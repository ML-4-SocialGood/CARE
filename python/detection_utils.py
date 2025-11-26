from datetime import datetime
import json
import os
from pathlib import Path
import cv2

def convert_bbox_normalized_to_absolute(bbox, image_width, image_height):
    xmin, ymin, xmax, ymax = bbox
    
    # Convert normalized coordinates to absolute coordinates
    xmin_abs = max(0, min(int(xmin * image_width), image_width - 1))
    ymin_abs = max(0, min(int(ymin * image_height), image_height - 1))
    xmax_abs = max(0, min(int(xmax * image_width), image_width))
    ymax_abs = max(0, min(int(ymax * image_height), image_height))

    return [xmin_abs, ymin_abs, xmax_abs, ymax_abs]

def create_log_file(log_dir: str = '') -> str:
    """
    Create a log file with a timestamp.
    """
    if not log_dir:
        log_dir = os.path.join(Path.home(), ".ml4sg-care", "logs")
    os.makedirs(log_dir, exist_ok=True)
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    return os.path.join(log_dir, f"{timestamp}_detection_log.txt")

def log_message(log_file, message):
    current_time = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    with open(log_file, "a") as f:
        f.write(f"[{current_time}] {message}\n")

def save_detection_results(predictions, image_output_path, original_images_dir, json_output_path, log_file):
    for img_file in predictions:
        try:
            image_filename = img_file['filename']
            image_path = img_file['filepath']
            predictions_list = img_file.get('predictions', [])

            if not os.path.exists(image_path):
                log_message(log_file, f"The path '{image_path}' does not exist.")
                return None

            image = cv2.imread(image_path)
            if image is None:
                log_message(log_file, f"Failed to read image '{image_path}'.")
                return None

            json_results = {}
            json_results["image"] = os.path.basename(image_path)
            json_results["boxes"] = []

            if image_output_path:
                relative_path = os.path.relpath(image_path, original_images_dir)
                output_path = os.path.join(image_output_path, relative_path)
                os.makedirs(os.path.dirname(output_path), exist_ok=True)

            if len(predictions_list) == 0:
                log_message(log_file, f"No Detection in image '{image_filename}'.")
                json_results["boxes"].append({
                    "label": None,
                    "confidence": 0,
                    "bbox": []
                })
                image_to_save = image
                save_message = f"Original image '{image_filename}' has been saved to '{output_path}'."

            else:
                for pred in predictions_list:
                    pred_conf = round(pred['pred_confidence'], 2)
                    detection_conf = round(pred.get('detection_confidence', 0), 2)
                    label = pred['predicted_class']
                    bounding_box = pred['bounding_box']
                    source = pred.get('prediction_source', 'DINO')

                    # Convert bounding box to absolute coordinates
                    image_height, image_width = image.shape[:2]
                    bounding_box = convert_bbox_normalized_to_absolute(bounding_box, image_width, image_height)

                    json_results["boxes"].append({
                        "label": label,
                        "pred_conf": float(pred_conf),
                        "detection_conf": float(detection_conf),
                        "bbox": bounding_box,
                        "source": source
                    })

                    if label != 'blank':
                        x1, y1, x2, y2 = list(map(int, bounding_box))
                        cv2.rectangle(image, (x1, y1), (x2, y2), (0, 0, 255), 15)
                        label_text = f"{label} ({pred_conf:.2f})"
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

                # detections = json_results['boxes']
                # selected_detection = None

                # stoat_detections = [d for d in detections if d['label'] == 'Stoat']

                # if stoat_detections:
                #     selected_detection = max(stoat_detections, key=lambda x: x['confidence'])
                # else:
                #     valid_detections = [d for d in detections if d['label'] is not None]
                #     selected_detection = max(valid_detections, key=lambda x: x['confidence']) if valid_detections else {
                #         "label": None,
                #         "confidence": 0,
                #         "bbox": []
                #     }

                # json_results['boxes'] = [selected_detection]
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
            print(f"Error processing image: {str(e)}")
            log_message(log_file, f"Error processing image: {str(e)}")  
