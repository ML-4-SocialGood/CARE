import json
import sys
import PIL.Image
import torch
from torchvision import transforms
from torchvision.ops import box_convert
from torchvision.ops import nms
import torch.nn.functional as F
import os
from typing import List, Tuple, Dict, Any
import time
import torch.nn as nn
from pathlib import Path
from megadetector.detection.run_detector_batch import load_and_run_detector_batch, write_results_to_file
from megadetector.utils import path_utils
from detection_utils import convert_bbox_normalized_to_absolute, create_log_file, log_message, save_detection_results

def md_detection(image_folder: str, output_file: str, logfile) -> None:
    """
    Run MegaDetector on a folder of images and save results to a JSON file.
    
    Args:
        image_folder (str): Path to the folder containing images.
        output_file (str): Path to save the detection results JSON file.
    """
    # Ensure the image folder exists
    if not os.path.exists(image_folder):
        print(f"Error: The specified image folder '{image_folder}' does not exist.")
        log_message(logfile, f"The path '{image_folder}' does not exist.")
        return
    
    detector_filename = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'models/md_v1000.0.0-redwood.pt')

    # Ensure the output directory exists
    output_dir = os.path.dirname(output_file)
    if output_dir and not os.path.exists(output_dir):
        os.makedirs(output_dir, exist_ok=True)

    # Pick a folder to run MD on recursively, and an output file
    image_folder = os.path.expanduser(image_folder)
    output_file = os.path.expanduser(output_file)

    # Recursively find images
    image_file_names = path_utils.find_images(image_folder, recursive=True)

    if not image_file_names:
        print(f"No images found in the specified folder '{image_folder}'.")
        log_message(logfile, f"No images found in the specified folder '{image_folder}'.")
        return


    results = load_and_run_detector_batch(detector_filename, image_file_names)

    # Write results to a format that Timelapse and other downstream tools like.
    write_results_to_file(results,
                          output_file,
                          detector_file=detector_filename)

class LinearClassifier(nn.Module):
    """Linear layer to train on top of frozen features"""
    def __init__(self, out_dim, use_n_blocks, use_avgpool, num_classes=1000):
        super().__init__()
        self.out_dim = out_dim
        self.use_n_blocks = use_n_blocks
        self.use_avgpool = use_avgpool
        self.num_classes = num_classes
        self.linear = nn.Linear(out_dim, num_classes)
        self.linear.weight.data.normal_(mean=0.0, std=0.01)
        self.linear.bias.data.zero_()

    def forward(self, x):
        return self.linear(x)


def create_linear_input(x_tokens_list, use_n_blocks, use_avgpool):
    """Create linear input from DINO intermediate layers"""
    intermediate_output = x_tokens_list[-use_n_blocks:]
    output = torch.cat([class_token for _, class_token in intermediate_output], dim=-1)
    if use_avgpool:
        output = torch.cat(
            (
                output,
                torch.mean(intermediate_output[-1][0], dim=1),  # patch tokens
            ),
            dim=-1,
        )
        output = output.reshape(output.shape[0], -1)
    return output.float()


def load_dino_model(device):
    """Load DINO model for feature extraction"""
    repo = os.path.join(os.path.dirname(os.path.abspath(__file__)), "dinov3")
    weights_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), "models/dinov3_vith16plus_pretrain_lvd1689m-7c1da9a5.pth")
    model = torch.hub.load(
        repo, 
        'dinov3_vith16plus', 
        source='local', 
        weights=weights_path
    )
    model.eval()
    model = model.to(device)
    return model

def filter_bboxes(detections, iou_threshold=0.3):
    """
    Filter bounding boxes based on IoU threshold.
    
    Args:
        detections (list): List of detection dictionaries containing 'bbox' and 'conf'.
        iou_threshold (float): IoU threshold for filtering.
    
    Returns:
        list: Filtered bounding boxes (xyxy).
    """

    bbox_list = [detection.get("bbox", []) for detection in detections if detection['category'] == '1' and detection['conf'] >= 0.3]
    bbox_conf_list = [detection.get("conf", 0) for detection in detections if detection['category'] == '1' and detection['conf'] >= 0.3]

    if not bbox_list or not bbox_conf_list:
        return torch.tensor([]), []
    
    bbox_list = torch.tensor(bbox_list, dtype=torch.float32)
    bbox_conf_list = torch.tensor(bbox_conf_list, dtype=torch.float32)
    
    bbox_list_xyxy = box_convert(bbox_list, in_fmt="xywh", out_fmt="xyxy")

    keep_indices = nms(bbox_list_xyxy, bbox_conf_list, iou_threshold=iou_threshold)

    return bbox_list_xyxy[keep_indices], bbox_conf_list[keep_indices].tolist()

def crop_image_from_bbox(filepath: str, bbox: List[float]) -> PIL.Image.Image:
    """
    Crop image based on bounding box coordinates.
    
    Args:
        filepath: Path to image file
        bbox: Bounding box in xyxy format (normalized coordinates)
        
    Returns:
        Cropped PIL Image
    """
    image_to_classify = PIL.Image.open(filepath)
    image_to_classify = image_to_classify.convert('RGB')  # Ensure RGB format
    image_width, image_height = image_to_classify.size
    
    xmin_abs, ymin_abs, xmax_abs, ymax_abs = convert_bbox_normalized_to_absolute(bbox, image_width, image_height)
    
    # Ensure valid bounding box
    cropped_image = image_to_classify.crop((xmin_abs, ymin_abs, xmax_abs, ymax_abs))
    return cropped_image

def batch_dino_image_processing(image_bbox_pairs: List[Tuple[str, List[float]]], 
                              device: torch.device, 
                              img_transform: transforms.Compose, 
                              dino_model: torch.nn.Module, 
                              batch_size: int = 32
                            ) -> List[torch.Tensor]:
    """
    Process multiple image crops in batches for efficient inference.
    
    Args:
        image_bbox_pairs: List of (filepath, bbox) tuples
        device: PyTorch device
        img_transform: Image transformation pipeline
        dino_model: DINO model for feature extraction
        batch_size: Batch size for processing
    
    Returns:
        List of features for each crop
    """
    all_features = []
    
    print(f"Processing {len(image_bbox_pairs)} crops in batches of {batch_size}")
    total_crops = len(image_bbox_pairs)
    
    for i in range(0, len(image_bbox_pairs), batch_size):
        batch_pairs = image_bbox_pairs[i:i + batch_size]
        batch_crops = []
        valid_indices = []  # Track which crops were successfully processed
        
        # Prepare batch of cropped images
        for j, (filepath, bbox) in enumerate(batch_pairs):
            try:
                cropped_image = crop_image_from_bbox(filepath, bbox)
                cropped_image = img_transform(cropped_image)
                batch_crops.append(cropped_image)
                valid_indices.append(i + j)  # Original index in image_bbox_pairs
            except Exception as e:
                print(f"Warning: Failed to process {filepath} with bbox {bbox}: {e}")
                # Add a dummy tensor to maintain batch consistency
                batch_crops.append(torch.zeros(3, 224, 224))
                valid_indices.append(i + j)
        
        # Stack into batch tensor and process
        if batch_crops:
            batch_tensor = torch.stack(batch_crops).to(device)
            
            # Extract features for entire batch
            with torch.no_grad():
                x_tokens_list = dino_model.get_intermediate_layers(
                    batch_tensor, n=1, return_class_token=True
                )
                features = create_linear_input(x_tokens_list, 1, False)
                features = features.to(device)
                
                # Store individual features
                for k in range(features.shape[0]):
                    all_features.append(features[k])
            
            # Clean up GPU memory
            del batch_tensor, x_tokens_list, features
        
        # Report progress for frontend
        processed_crops = min(i + batch_size, total_crops)
        print(f"PROCESS: {processed_crops}/{total_crops}", flush=True)
    
    return all_features

def batch_check_animal(features_batch: List[torch.Tensor], 
                      dino_binary_classifier: LinearClassifier,
                      batch_size: int = 64) -> Tuple[List[int], List[float]]:
    """
    Perform binary classification on a batch of features.
    
    Args:
        features_batch: List of DINO features
        dino_binary_classifier: Binary classifier model
        batch_size: Batch size for classification
    
    Returns:
        Tuple of (predictions, confidences) for the batch
    """
    all_predictions = []
    all_confidences = []
    
    for i in range(0, len(features_batch), batch_size):
        batch_end = min(i + batch_size, len(features_batch))
        batch_features = features_batch[i:batch_end]
        
        # Stack features into batch tensor
        features_tensor = torch.stack(batch_features)
        
        with torch.no_grad():
            output = dino_binary_classifier(features_tensor)
            _, predicted = torch.max(output, dim=1)
            pred_probs = F.softmax(output, dim=1)
            max_prob, _ = torch.max(pred_probs, dim=1)
        
        all_predictions.extend(predicted.cpu().tolist())
        all_confidences.extend(max_prob.cpu().tolist())
        
        # Clean up
        del features_tensor, output, pred_probs
    
    return all_predictions, all_confidences

def batch_predict_species(features_batch: List[torch.Tensor], 
                         dino_species_classifier: LinearClassifier,
                         batch_size: int = 64) -> Tuple[List[int], List[float]]:
    """
    Perform species classification on a batch of features.
    
    Args:
        features_batch: List of DINO features  
        dino_species_classifier: Species classifier model
        batch_size: Batch size for classification
    
    Returns:
        Tuple of (predictions, confidences) for the batch
    """
    all_predictions = []
    all_confidences = []
    
    for i in range(0, len(features_batch), batch_size):
        batch_end = min(i + batch_size, len(features_batch))
        batch_features = features_batch[i:batch_end]
        
        # Stack features into batch tensor
        features_tensor = torch.stack(batch_features)
        
        with torch.no_grad():
            output = dino_species_classifier(features_tensor)
            _, predicted = torch.max(output, dim=1)
            pred_probs = F.softmax(output, dim=1)
            max_prob, _ = torch.max(pred_probs, dim=1)
        
        all_predictions.extend(predicted.cpu().tolist())
        all_confidences.extend(max_prob.cpu().tolist())
        
        # Clean up
        del features_tensor, output, pred_probs
    
    return all_predictions, all_confidences

def predict_multiple_species_batched(detection_filepath: str, 
                                   json_output_dir: str = None,
                                   image_output_dir: str = None,
                                   original_images_dir: str = None,
                                   device: torch.device = None,
                                   feature_batch_size: int = 32,
                                   classification_batch_size: int = 64,
                                   log_file = None) -> List[Dict[str, Any]]:
    """
    Process the classification results using batch processing for improved speed.
    
    Args:
        detection_filepath (str): Path to the detection JSON file.
        output_filepath (str): Path to save the prediction results JSON file.
        device: PyTorch device to use
        feature_batch_size: Batch size for feature extraction
        classification_batch_size: Batch size for classification
    """
    start_time = time.time()
    
    dino_class_to_idx = {'Hedgehog': 0, 'bird': 1, 'cat': 2, 'deer': 3, 'dog': 4, 'ferret': 5, 'goat': 6, 'kea': 7, 'kiwi': 8, 'lagomorph': 9, 'livestock': 10, 'parakeet': 11, 'pig': 12, 'possum': 13, 'pukeko': 14, 'rodent': 15, 'stoat': 16, 'takahe': 17, 'tomtit': 18, 'tui': 19, 'wallaby': 20, 'weasel': 21, 'weka': 22, 'yellow_eyed_penguin': 23}
    
    # Create reverse mapping for DINO predictions
    idx_to_dino_class = {v: k for k, v in dino_class_to_idx.items()}

    # Initialize results list
    prediction_results = []
    
    print("Loading models...")
    # Load the state dictionary and create the linear classifier
    species_classifier_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'models/dino_species_classifier.pt')
    binary_classifier_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'models/dino_binary_classifier_v3.pt')
    
    dino_state_dict = torch.load(species_classifier_path, map_location=device)
    
    # Create the linear classifier with the correct dimensions (24 classes)
    dino_species_classifier = LinearClassifier(1280, 1, False, 24)
    dino_species_classifier.load_state_dict(dino_state_dict)
    dino_species_classifier.to(device).eval()

    dino_binary_classifier = LinearClassifier(1280, 1, False, 2)
    dino_binary_classifier.load_state_dict(torch.load(binary_classifier_path, map_location=device))
    dino_binary_classifier.to(device).eval()

    img_transform = transforms.Compose([
        transforms.ToTensor(),
        transforms.Resize((224, 224)),
        transforms.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225]),  # ImageNet normalization
    ])

    # Load DINO model directly
    print("Loading DINO model...")
    dino_model = load_dino_model(device)

    print("Loading detection data...")
    # Read JSON data from the file
    with open(detection_filepath, "r", encoding="utf-8") as file:
        data = json.load(file)

    # Step 1: Collect all image-bbox pairs and create mapping
    print("Collecting image-bbox pairs...")
    all_image_bbox_pairs = []
    image_bbox_to_result_mapping = []  # (image_idx, bbox_idx, bbox, bbox_conf, filepath, filename, pair_idx)
    
    for i, prediction in enumerate(data["images"]):
        filepath = prediction["file"]
        filename = Path(filepath).name
        
        # Check if file exists
        if not os.path.exists(filepath):
            print(f"Warning: File not found, skipping: {filepath}")
            continue
            
        detections = prediction.get("detections", [])
        
        if detections:
            bbox_list_filtered, bbox_conf_list_filtered = filter_bboxes(detections)
            if bbox_list_filtered.tolist():  
                for j, bbox in enumerate(bbox_list_filtered.tolist()):
                    all_image_bbox_pairs.append((filepath, bbox))
                    image_bbox_to_result_mapping.append({
                        'image_idx': i,
                        'bbox_idx': j,
                        'bbox': bbox,
                        'bbox_conf': bbox_conf_list_filtered[j],
                        'filepath': filepath,
                        'filename': filename,
                        'pair_idx': len(all_image_bbox_pairs) - 1  # Index in all_image_bbox_pairs
                    })

    print(f"Found {len(all_image_bbox_pairs)} crops to process from {len(data['images'])} images")
    print(f"PROCESS: 0/{len(all_image_bbox_pairs)}", flush=True)
    # os.remove(detection_filepath)  # Remove the detection file to save space
    print(f"Removed detection file: {detection_filepath}")
    log_message(log_file, f"Removed detection file: {detection_filepath}")
    
    if not all_image_bbox_pairs:
        print("No valid crops found for processing.")
        return []

    # Step 2: Batch process all crops for feature extraction
    print("Extracting features in batches...")
    feature_start_time = time.time()
    all_features = batch_dino_image_processing(
        all_image_bbox_pairs, device, img_transform, dino_model, feature_batch_size
    )
    feature_time = time.time() - feature_start_time
    print(f"Feature extraction completed in {feature_time:.2f} seconds")

    # Step 3: Batch binary classification
    print("Performing binary classification in batches...")
    binary_start_time = time.time()
    binary_predictions, binary_confidences = batch_check_animal(
        all_features, dino_binary_classifier, classification_batch_size
    )
    binary_time = time.time() - binary_start_time
    print(f"Binary classification completed in {binary_time:.2f} seconds")

    # Step 4: Batch species classification (only for non-blank detections)
    animal_features = [feat for i, feat in enumerate(all_features) if binary_predictions[i] == 1]
    animal_indices = [i for i, pred in enumerate(binary_predictions) if pred == 1]
    
    species_predictions = [0] * len(all_features)  # Initialize with dummy values
    species_confidences = [0.0] * len(all_features)
    
    if animal_features:
        print(f"Performing species classification on {len(animal_features)} animal detections...")
        species_start_time = time.time()
        animal_species_preds, animal_species_confs = batch_predict_species(
            animal_features, dino_species_classifier, classification_batch_size
        )
        species_time = time.time() - species_start_time
        print(f"Species classification completed in {species_time:.2f} seconds")
        
        # Map species predictions back to original indices
        for i, original_idx in enumerate(animal_indices):
            species_predictions[original_idx] = animal_species_preds[i]
            species_confidences[original_idx] = animal_species_confs[i]

    # Step 5: Organize results back into original structure
    print("Organizing results...")
    
    # Initialize result structure for each image
    image_results = {}
    for i, prediction in enumerate(data["images"]):
        filepath = prediction["file"]
        filename = Path(filepath).name
        image_results[i] = {
            "filename": filename,
            "filepath": filepath,
            "predictions": []
        }
    
    # Add predictions back to their respective images
    for mapping in image_bbox_to_result_mapping:
        pair_idx = mapping['pair_idx']
        image_idx = mapping['image_idx']
        bbox = mapping['bbox']
        
        binary_pred = binary_predictions[pair_idx]
        binary_conf = binary_confidences[pair_idx]
        
        if binary_pred == 0:  # Blank detection
            prediction_entry = {
                "bounding_box": bbox,
                "predicted_class": 'blank',
                "prediction_source": "dino_binary",
                "pred_confidence": float(binary_conf),
                "detection_confidence": float(mapping['bbox_conf'])
            }
        else:  # Animal detection
            species_pred = species_predictions[pair_idx]
            species_conf = species_confidences[pair_idx]
            predicted_class = idx_to_dino_class.get(species_pred, f"unknown_class_{species_pred}")
            
            prediction_entry = {
                "bounding_box": bbox,
                "predicted_class": predicted_class,
                "prediction_source": "dino",
                "pred_confidence": float(species_conf),
                "detection_confidence": float(mapping['bbox_conf'])
            }
            print(f"DINO prediction for {mapping['filepath']}: {predicted_class} with confidence {species_conf:.4f}")
        
        image_results[image_idx]["predictions"].append(prediction_entry)
    
    # Convert to list format
    prediction_results = [image_results[i] for i in sorted(image_results.keys())]
    
    # Save results to JSON file
    if json_output_dir is None:
        json_output_dir = str(Path(detection_filepath).parent / "prediction_standalone_batched.json")

    save_detection_results(prediction_results, image_output_dir, original_images_dir, json_output_dir, log_file)
    
    total_time = time.time() - start_time
    print(f"\nBatch processing completed!")
    print(f"Total time: {total_time:.2f} seconds")
    print(f"Prediction results saved to: {json_output_dir}")
    print(f"Total predictions processed: {len(prediction_results)}")
    print(f"Total crops processed: {len(all_image_bbox_pairs)}")

    if log_file:
        log_message(log_file, f"Batch processing completed in {total_time:.2f} seconds")
        log_message(log_file, f"Prediction results saved to: {json_output_dir}")
        log_message(log_file, f"Total predictions processed: {len(prediction_results)}")
        log_message(log_file, f"Total crops processed: {len(all_image_bbox_pairs)}")
    
    return prediction_results


def run(original_images_dir, output_images_dir, json_output_dir, log_dir=''):
    """
    Main run function that matches the interface expected by main.py
    
    Args:
        original_images_dir: Input directory containing images
        output_images_dir: Output directory for marked images
        json_output_dir: Output directory for JSON detection results
        log_dir: Directory for log files
    """
    print("STATUS: BEGIN", flush=True)
    
    log_file = create_log_file(log_dir)
    log_message(log_file, "Starting DINO detection pipeline")

    detection_filepath = os.path.join(original_images_dir, "detection_results.json")

    # Check available devices
    if torch.cuda.is_available():
        device = torch.device("cuda")
    elif torch.backends.mps.is_available():
        device = torch.device("mps")
    else:
        device = torch.device("cpu")
    print(f"Using device: {device}")
    log_message(log_file, f"Using device: {device}")

    # Step 1: Run MegaDetector
    print("Running MegaDetector...")
    log_message(log_file, "Running MegaDetector...")
    try:
        md_detection(original_images_dir, detection_filepath, log_file)
    except Exception as e:
        log_message(log_file, f"Error running MegaDetector: {str(e)}")
        raise e

    # Configurable batch sizes - adjust based on GPU memory
    feature_batch_size = 8 if device.type == 'cuda' else 4  # For feature extraction (more memory intensive)
    classification_batch_size = 16 if device.type == 'cuda' else 8  # For classification (less memory intensive)
    
    log_message(log_file, f"Starting species classification with batch sizes: feature={feature_batch_size}, classification={classification_batch_size}")
    
    try:
        predict_multiple_species_batched(
        detection_filepath,
        json_output_dir,
        output_images_dir,
        original_images_dir,
        device=device,
        feature_batch_size=feature_batch_size,
        classification_batch_size=classification_batch_size,
        log_file=log_file
        )
    except Exception as e:
        log_message(log_file, f"Error running DINO detection pipeline: {str(e)}")
        raise e
    
    print("STATUS: DONE", flush=True)
    log_message(log_file, "DINO detection pipeline completed successfully")


def main():
    if len(sys.argv) != 4:
        print("Usage: python detection_dino.py <input_folder> <output_folder> <json_output_folder>", flush=True)
        sys.exit(1)
    original_images_dir = sys.argv[1]
    image_output_dir = sys.argv[2]
    json_output_dir = sys.argv[3]

    run(original_images_dir, image_output_dir, json_output_dir)

if __name__ == "__main__":
    main()
