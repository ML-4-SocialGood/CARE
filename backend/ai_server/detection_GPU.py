import cv2
import json
import os
import sys
import torch
import time
from ultralytics import YOLO
from datetime import datetime

def create_log_file():
    log_dir = "detection_logs"
    os.makedirs(log_dir, exist_ok=True)
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    return os.path.join(log_dir, f"{timestamp}_detection_log.txt")

def log_message(log_file, message):
    current_time = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    with open(log_file, "a") as f:
        f.write(f"[{current_time}] {message}\n")

def save_detection_results(image_paths, predictions, image_output_path, original_images_dir, json_output_path, log_file):
    for index, (image_path, result) in enumerate(zip(image_paths, predictions)):
        try:
            image_filename = os.path.basename(image_path)

            if not os.path.exists(image_path):
                log_message(log_file, f"The path '{image_path}' does not exist.")
                return None

            image = cv2.imread(image_path)
            if image is None:
                log_message(log_file, f"Failed to read image '{image_path}'.")
                return None
            
            image_name = os.path.splitext(os.path.basename(image_path))[0]
            class_dict = result.names
            confidences, labels, coordinates = result.boxes.conf.cpu().numpy(), result.boxes.cls.cpu().numpy(), result.boxes.xyxy.cpu().numpy()
            
            # result.save(f"{os.path.join(image_output_path, image_name)}.JPG")

            json_results = {}
            json_results["image"] = os.path.basename(image_path)
            json_results["boxes"] = []

            if image_output_path:
                relative_path = os.path.relpath(image_path, original_images_dir)
                output_path = os.path.join(image_output_path, relative_path)
                os.makedirs(os.path.dirname(output_path), exist_ok=True)

            if len(confidences) == 0:
                log_message(log_file, f"No Detection in image '{image_filename}'.")
                json_results["boxes"].append({
                    "label": None,
                    "confidence": 0,
                    "bbox": []
                })
                image_to_save = image
                save_message = f"Original image '{image_filename}' has been saved to '{output_path}'."
                
                # print(f" - No Detections in Image {image_name}")
                # bounding_box = {}
                # bounding_box["label"] = None
                # bounding_box["confidence"] = None
                # bounding_box["bbox"] = []
                # json_results["boxes"].append(bounding_box)

                # with open(f"{os.path.join(json_output_path, image_name)}.json", "w") as json_file:
                #     json.dump(json_results, json_file, indent = 4)
                
                # print(f"  {json_results}\n")
                # continue
            else:
                for i in range(len(confidences)):
                    conf = round(confidences[i], 2)
                    label = class_dict[int(labels[i])]
                    bounding_box = coordinates[i]
                    json_results["boxes"].append({
                        "label": label,
                        "confidence": float(conf),
                        "bbox": [float(coord) for coord in bounding_box.tolist()]
                    })

                    x1, y1, x2, y2 = list(map(int, bounding_box))
                    cv2.rectangle(image, (x1, y1), (x2, y2), (0, 0, 255), 15)
                    label_text = f"{label} ({conf:.2f})"
                    font = cv2.FONT_HERSHEY_SIMPLEX
                    font_scale = 3.5
                    thickness = 10
                    text_size = cv2.getTextSize(label_text, font, font_scale, thickness)[0]
                    text_x = x1
                    text_y = y1 - 10 if y1 - text_size[1] - 10 >= 0 else y2 + text_size[1] + 10
                    cv2.rectangle(image, (text_x, text_y - text_size[1] - 10),
                                (text_x + text_size[0], text_y + 10), (0, 0, 255), -1)
                    cv2.putText(image, label_text, (text_x, text_y), font, font_scale, (255, 255, 255), thickness)
                image_to_save = image
                save_message = f"Marked image '{image_filename}' has been saved to '{output_path}'."

            if image_output_path:
                cv2.imwrite(output_path, image_to_save)
                log_message(log_file, save_message)

            if json_results:
                relative_path = os.path.relpath(image_path, original_images_dir)
                json_filename = os.path.splitext(relative_path)[0] + ".json"
                fin_json_output_path = os.path.join(json_output_path, json_filename)
                os.makedirs(os.path.dirname(fin_json_output_path), exist_ok=True)

                detections = json_results['boxes']
                selected_detection = None

                stoat_detections = [d for d in detections if d['label'] == 'Stoat']

                if stoat_detections:
                    selected_detection = max(stoat_detections, key=lambda x: x['confidence'])
                else:
                    valid_detections = [d for d in detections if d['label'] is not None]
                    selected_detection = max(valid_detections, key=lambda x: x['confidence']) if valid_detections else {
                        "label": None,
                        "confidence": 0,
                        "bbox": []
                    }
                
                json_results['boxes'] = [selected_detection]
                with open(fin_json_output_path, "w") as f:
                    json.dump(json_results, f, indent=4)

                log_message(log_file, f"Cropped info for '{json_results['image']}' has been saved to '{fin_json_output_path}'.")
            
            else:
                relative_path = os.path.relpath(image_path, original_images_dir)
                json_filename = os.path.splitext(relative_path)[0] + ".json"
                fin_json_output_path = os.path.join(json_output_path, json_filename)
                os.makedirs(os.path.dirname(fin_json_output_path), exist_ok=True)
                json_results = {
                    "image": os.path.basename(image_path),
                    "boxes": [{"label": None, "confidence": 0, "bbox": []}]
                }
                with open(fin_json_output_path, "w") as f:
                    json.dump(json_results, f, indent=4)
                log_message(log_file, f"No detections for '{image_path}'. Empty JSON saved to '{fin_json_output_path}'.")
    
        except Exception as e:
            log_message(log_file, f"Error processing image: {str(e)}")

            # stoat_indices = (labels == 7).nonzero(as_tuple = False)
            # if len(stoat_indices) == 0:
            #     max_conf_index = torch.argmax(confidences)
            #     selected_conf = confidences[max_conf_index].item()
            #     selected_label = class_dict[labels[max_conf_index].item()]
            #     selected_bbox = coordinates[max_conf_index].tolist()[0][0]

            #     bounding_box = {}
            #     bounding_box["label"] = selected_label
            #     bounding_box["confidence"] = selected_conf
            #     bounding_box["bbox"] = selected_bbox
            #     json_results["boxes"].append(bounding_box)

            #     with open(f"{os.path.join(json_output_path, image_name)}.json", "w") as json_file:
            #         json.dump(json_results, json_file, indent = 4)

            #     print(f" - Image {image_name}")
            #     print(f"  {json_results}\n")

            # else:
            #     stoat_conf = confidences[stoat_indices]
            #     max_stoat_conf = torch.max(stoat_conf)
            #     max_stoat_conf_index = (confidences == max_stoat_conf).nonzero(as_tuple = False)
            #     selected_label = class_dict[labels[max_stoat_conf_index].item()]
            #     selected_bbox = coordinates[max_stoat_conf_index].tolist()[0][0]

            #     bounding_box = {}
            #     bounding_box["label"] = selected_label
            #     bounding_box["confidence"] = max_stoat_conf.item()
            #     bounding_box["bbox"] = selected_bbox
            #     json_results["boxes"].append(bounding_box)
                
            #     with open(f"{os.path.join(json_output_path, image_name)}.json", "w") as json_file:
            #         json.dump(json_results, json_file, indent = 4)
                
            #     print(f" - Image {image_name}")
            #     print(f"  {json_results}\n")

def main():
    if len(sys.argv) != 4:
        print("Usage: python detection.py <input_folder> <output_folder> <json_output_folder>", flush=True)
        sys.exit(1)

    original_images_dir = sys.argv[1]
    output_dir = sys.argv[2]
    json_output_dir = sys.argv[3]

    log_file = create_log_file()

    DEVICE = "cuda"  # Change to "cuda" if using GPU
    yolo_model = YOLO("best_50_GPU.pt").to(DEVICE)

    # DEVICE = "cpu"
    # batch_size = 16
    # yolo = YOLO("best_50.pt").to(DEVICE)

    # # Construct the source path.
    # root = "/home/ywu840/Capstone"
    # source_dir = "Original"
    # source_path = os.path.join(root, source_dir)
    
    # # Construct the destination path.
    # destination_dir = "Detection_Results"
    # output_dir = "Bbox_Images"
    # output_path = os.path.join(root, destination_dir, output_dir)
    # json_output_path = os.path.join(root, destination_dir)
    # os.makedirs(output_path, exist_ok = True)
    # os.makedirs(json_output_path, exist_ok = True)
    
    # Construct a list of image paths.
    # image_paths_list = []
    # for file in sorted(os.listdir(source_path)):
    #     if file.lower().endswith(('.jpg', '.jpeg', '.png')):
    #         image_path = os.path.join(source_path, file)
    #         image_paths_list.append(image_path)

    # num_of_images = len(image_paths_list)
    # print(f"\nTotal: {num_of_images} images\n")
    
    if not os.path.exists(output_dir):
        os.makedirs(output_dir, exist_ok=True)
    if not os.path.exists(json_output_dir):
        os.makedirs(json_output_dir, exist_ok=True)
    if not os.path.exists(original_images_dir):
        log_message(log_file, f"The path '{original_images_dir}' does not exist.")
        raise FileNotFoundError(f"The path '{original_images_dir}' does not exist.")

    image_paths_list = []
    for root, dirs, files in os.walk(original_images_dir):
        for file in files:
            if file.lower().endswith(('.jpg', '.jpeg', '.png')):
                image_paths_list.append(os.path.join(root, file))

    num_of_images = len(image_paths_list)
    if num_of_images == 0:
        log_message(log_file, f"No images found in the folder '{original_images_dir}'.")
        return

    start_time = time.time()

    counter = 0
    batch_size = 16
    
    print("STATUS: BEGIN", flush=True)

    while counter < num_of_images:
        process_images = image_paths_list[counter:min(counter + batch_size, num_of_images)]
        # print(f"* [{counter} - {min(counter + batch_size, num_of_images)}]\n")
        preds = yolo_model(process_images, verbose = False)
        save_detection_results(image_paths = process_images, predictions = preds, 
                               image_output_path = output_dir, original_images_dir = original_images_dir, 
                               json_output_path = json_output_dir, log_file=log_file)
        
        print(f"PROCESS: {min(counter + batch_size, num_of_images)}/{num_of_images}", flush=True)
        counter += batch_size

    end_time = time.time()
    total_time = end_time - start_time
    log_message(log_file, f"Total processing time: {total_time:.2f} seconds")

    print("STATUS: DONE", flush=True)

    # print(f"\nFinished {num_of_images} images!\n")
    

main()