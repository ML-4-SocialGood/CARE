import multiprocessing as mp
import os
import sys
import time
import signal
import torch
import PIL.Image
from torchvision import transforms
from torchvision.ops import box_convert
from torchvision.ops import nms
import torch.nn.functional as F
import torch.nn as nn
from typing import List, Tuple, Dict, Any

from datetime import datetime
from pathlib import Path
from megadetector.detection.run_detector_batch import load_and_run_detector_batch
from detection_utils import convert_bbox_normalized_to_absolute, create_log_file, log_message, save_detection_results


# Global variables for multiprocessing
md_model = None
dino_model = None
dino_binary_classifier = None
dino_species_classifier = None
img_transform = None
device = None


def init_process(md_model_path, dino_model_path, binary_classifier_path, species_classifier_path):
    global md_model, dino_model, dino_binary_classifier, dino_species_classifier, img_transform, device
    
    device = torch.device("cpu")
    
    # Load MegaDetector model
    md_model = md_model_path
    
    # Load DINO model
    repo = os.path.join(os.path.dirname(os.path.abspath(__file__)), "dinov3")
    weights_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), "models/dinov3_vith16plus_pretrain_lvd1689m-7c1da9a5.pth")
    dino_model = torch.hub.load(
        repo, 
        'dinov3_vith16plus', 
        source='local', 
        weights=weights_path
    )
    dino_model.eval()
    dino_model = dino_model.to(device)
    
    # Load classifiers
    dino_binary_classifier = LinearClassifier(1280, 1, False, 2)
    dino_binary_classifier.load_state_dict(torch.load(binary_classifier_path, map_location=device))
    dino_binary_classifier.to(device).eval()
    
    dino_species_classifier = LinearClassifier(1280, 1, False, 24)
    dino_species_classifier.load_state_dict(torch.load(species_classifier_path, map_location=device))
    dino_species_classifier.to(device).eval()
    
    # Image transform
    img_transform = transforms.Compose([
        transforms.ToTensor(),
        transforms.Resize((224, 224)),
        transforms.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225]),
    ])


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

def make_inference_detection(path_to_img, output_dir, original_root, log_file):
    global md_model, dino_model, dino_binary_classifier, dino_species_classifier, img_transform, device
    
    image_filename = path_to_img
    dino_class_to_idx = {'Hedgehog': 0, 'bird': 1, 'cat': 2, 'deer': 3, 'dog': 4, 'ferret': 5, 'goat': 6, 'kea': 7, 'kiwi': 8, 'lagomorph': 9, 'livestock': 10, 'parakeet': 11, 'pig': 12, 'possum': 13, 'pukeko': 14, 'rodent': 15, 'stoat': 16, 'takahe': 17, 'tomtit': 18, 'tui': 19, 'wallaby': 20, 'weasel': 21, 'weka': 22, 'yellow_eyed_penguin': 23}
    idx_to_dino_class = {v: k for k, v in dino_class_to_idx.items()}

    try:
        if not os.path.exists(path_to_img):
            log_message(log_file, f"The path '{path_to_img}' does not exist.")
            return None

        # Run MegaDetector on single image
        results = load_and_run_detector_batch(md_model, [path_to_img])

        if not results:
            log_message(log_file, f"No MegaDetector results for image '{image_filename}'.")
            return None

        detections = results[0].get('detections', [])

        # Filter bounding boxes
        bbox_list_filtered, bbox_conf_list_filtered = filter_bboxes(detections)
        
        if not bbox_list_filtered.tolist():
            log_message(log_file, f"No valid bounding boxes found in image '{image_filename}'.")
            return {
                "image": image_filename,
                "boxes": [{"label": None, "confidence": 0, "bbox": []}]
            }
        
        bounding_boxes = []
        
        for i, bbox in enumerate(bbox_list_filtered.tolist()):
            # Extract features for this crop
            try:
                cropped_image = crop_image_from_bbox(path_to_img, bbox)
                cropped_image = img_transform(cropped_image).unsqueeze(0).to(device)
                
                with torch.no_grad():
                    # Binary classification
                    x_tokens_list = dino_model.get_intermediate_layers(
                        cropped_image, n=1, return_class_token=True
                    )
                    features = create_linear_input(x_tokens_list, 1, False)
                    
                    binary_output = dino_binary_classifier(features)
                    binary_pred = torch.argmax(binary_output, dim=1).item()
                    binary_conf = F.softmax(binary_output, dim=1).max().item()

                    if binary_pred == 1:  # Animal detected
                        # Species classification
                        species_output = dino_species_classifier(features)
                        species_pred = torch.argmax(species_output, dim=1).item()
                        species_conf = F.softmax(species_output, dim=1).max().item()
                        
                        predicted_class = idx_to_dino_class.get(species_pred, f"unknown_class_{species_pred}")
                        confidence = species_conf
                    else:  # Blank detection
                        predicted_class = 'blank'
                        confidence = binary_conf

                bounding_boxes.append({
                    "label": predicted_class,
                    "confidence": float(confidence),
                    "bbox": [float(coord) for coord in bbox]
                })
                
            except Exception as e:
                log_message(log_file, f"Error processing crop {i} in image '{image_filename}': {str(e)}")
                bounding_boxes.append({
                    "label": None,
                    "confidence": 0,
                    "bbox": [float(coord) for coord in bbox]
                })
        return {
            "image": image_filename,
            "boxes": bounding_boxes
        }

    except Exception as e:
        log_message(log_file, f"Error processing imagev during detection '{image_filename}': {e}")
        return None


def worker_process(args):
    img_path, output_dir, json_output_dir, original_root, log_file, counter, total_images, lock = args
    try:
        detection_info = make_inference_detection(img_path, output_dir, original_root, log_file)
        if detection_info:
            # Convert detection_info to the format expected by save_detection_results
            prediction_result = {
                "filename": detection_info['image'],
                "filepath": img_path,
                "predictions": []
            }
            
            for box in detection_info['boxes']:
                if box['label'] is not None:
                    prediction_result["predictions"].append({
                        "bounding_box": box['bbox'],
                        "predicted_class": box['label'],
                        "prediction_source": "dino",
                        "confidence": box['confidence']
                    })
                else:
                    prediction_result["predictions"].append({
                        "bounding_box": box['bbox'],
                        "predicted_class": None,
                        "prediction_source": "dino",
                        "confidence": box['confidence']
                    })
            
            # Use save_detection_results from detection_utils
            save_detection_results(prediction_result['predictions'], output_dir, original_root, json_output_dir, log_file)
            
            log_message(log_file, f"Detection info for '{detection_info['image']}' has been processed and saved.")
        else:
            # Handle case with no detections
            prediction_result = {
                "filename": os.path.basename(img_path),
                "filepath": img_path,
                "predictions": []
            }
            
            save_detection_results([prediction_result], output_dir, original_root, json_output_dir, log_file)
            log_message(log_file, f"No detections for '{img_path}'. Empty result saved.")
    except Exception as e:
        log_message(log_file, f"Error processing image '{img_path}': {str(e)}")
    finally:
        with lock:
            counter.value += 1
            print(f"PROCESS: {counter.value}/{total_images}", flush=True)


def process_images_with_pool(md_model_path, dino_model_path, binary_classifier_path, species_classifier_path, 
                           original_images_dir, output_dir, json_output_dir, log_file):
    print("STATUS: BEGIN", flush=True)

    if not os.path.exists(output_dir):
        os.makedirs(output_dir, exist_ok=True)
    if not os.path.exists(json_output_dir):
        os.makedirs(json_output_dir, exist_ok=True)
    if not os.path.exists(original_images_dir):
        log_message(log_file, f"The path '{original_images_dir}' does not exist.")
        raise FileNotFoundError(f"The path '{original_images_dir}' does not exist.")

    image_files = []
    for root, dirs, files in os.walk(original_images_dir):
        for file in files:
            if file.lower().endswith(('.jpg', '.jpeg', '.png')):
                image_files.append(os.path.join(root, file))

    total_images = len(image_files)
    if total_images == 0:
        log_message(log_file, f"No images found in the folder '{original_images_dir}'.")
        return
    print(f"PROCESS: 0/{total_images}")

    mp.freeze_support()
    manager = mp.Manager()
    counter = manager.Value('i', 0)
    lock = manager.Lock()

    args_list = []
    for img_path in image_files:
        args_list.append((img_path, output_dir, json_output_dir, original_images_dir, log_file, counter, total_images, lock))

    num_processes = max(1, min(mp.cpu_count() // 2, 12))
    with mp.Pool(
        processes=num_processes,
        initializer=init_process,
        initargs=(md_model_path, dino_model_path, binary_classifier_path, species_classifier_path),
    ) as pool:
        result = pool.map_async(worker_process, args_list)
        while not result.ready():
            result.wait(timeout=1)

    print("STATUS: DONE", flush=True)


def signal_handler(signum, frame):
    print(f"Signal received {signum}. Terminating.")
    sys.exit(0)


def run(original_images_dir, output_images_dir, json_output_dir, log_dir):
    signal.signal(signal.SIGTERM, signal_handler)
    signal.signal(signal.SIGINT, signal_handler)

    log_file = create_log_file(log_dir)
    
    # Model paths
    md_model_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), "models", "md_v1000.0.0-redwood.pt")
    dino_model_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), "dinov3")
    binary_classifier_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), "models", "dino_binary_classifier_v3.pt")
    species_classifier_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), "models", "dino_species_classifier.pt")

    start_time = time.time()
    process_images_with_pool(md_model_path, dino_model_path, binary_classifier_path, species_classifier_path,
                           original_images_dir, output_images_dir, json_output_dir, log_file)
    end_time = time.time()

    total_time = end_time - start_time
    log_message(log_file, f"Total processing time: {total_time:.2f} seconds")


def main():
    if len(sys.argv) != 4:
        print("Usage: python detection_dino_cpu.py <input_folder> <output_folder> <json_output_folder>", flush=True)
        sys.exit(1)

    original_images_dir = sys.argv[1]
    output_images_dir = sys.argv[2]
    json_output_dir = sys.argv[3]
    run(original_images_dir, output_images_dir, json_output_dir)


if __name__ == "__main__":
    main()
