import cv2
import json
import multiprocessing as mp
import os
import sys
import time
import signal

from datetime import datetime
from ultralytics import YOLO
from pathlib import Path


yolo_model = None    # global variable

def init_process(yolo_model_path):
    global yolo_model
    DEVICE = "cpu"
    yolo_model = YOLO(yolo_model_path).to(DEVICE)


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


def make_inference_detection(path_to_img, output_dir, original_root, log_file):
    global yolo_model
    image_filename = os.path.basename(path_to_img)

    try:
        if not os.path.exists(path_to_img):
            log_message(log_file, f"The path '{path_to_img}' does not exist.")
            return None

        image = cv2.imread(path_to_img)
        if image is None:
            log_message(log_file, f"Failed to read image '{path_to_img}'.")
            return None

        prediction = yolo_model(path_to_img, verbose=False)[0]
        class_dict = prediction.names
        array_of_confidences = prediction.boxes.conf.numpy()
        array_of_labels = prediction.boxes.cls.numpy()

        bounding_boxes = []

        if output_dir:
            relative_path = os.path.relpath(path_to_img, original_root)
            output_path = os.path.join(output_dir, relative_path)
            os.makedirs(os.path.dirname(output_path), exist_ok=True)

        if len(array_of_confidences) == 0:
            log_message(log_file, f"No Detection in image '{image_filename}'.")
            bounding_boxes.append({
                "label": None,
                "confidence": 0,
                "bbox": []
            })
            image_to_save = image
            save_message = f"Original image '{image_filename}' has been saved to '{output_path}'."
        else:
            for i in range(len(array_of_confidences)):
                conf = round(array_of_confidences[i], 2)
                label = class_dict[int(array_of_labels[i])]
                bounding_box = prediction.boxes.xyxy.numpy()[i]
                bounding_boxes.append({
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

        if output_dir:
            cv2.imwrite(output_path, image_to_save)
            log_message(log_file, save_message)

        return {
            "image": image_filename,
            "boxes": bounding_boxes
        }

    except Exception as e:
        log_message(log_file, f"Error processing image '{image_filename}': {str(e)}")
        return None


def worker_process(args):
    img_path, output_dir, json_output_dir, original_root, log_file, counter, total_images, lock = args
    try:
        cropped_info = make_inference_detection(img_path, output_dir, original_root, log_file)
        if cropped_info:
            relative_path = os.path.relpath(img_path, original_root)
            json_filename = os.path.splitext(relative_path)[0] + ".json"
            json_output_path = os.path.join(json_output_dir, json_filename)
            os.makedirs(os.path.dirname(json_output_path), exist_ok=True)

            detections = cropped_info['boxes']
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

            json_output = {
                "image": cropped_info['image'],
                "boxes": [selected_detection]
            }

            with open(json_output_path, "w") as f:
                json.dump(json_output, f, indent=4)

            log_message(log_file, f"Cropped info for '{cropped_info['image']}' has been saved to '{json_output_path}'.")
        else:
            relative_path = os.path.relpath(img_path, original_root)
            json_filename = os.path.splitext(relative_path)[0] + ".json"
            json_output_path = os.path.join(json_output_dir, json_filename)
            os.makedirs(os.path.dirname(json_output_path), exist_ok=True)
            json_output = {
                "image": os.path.basename(img_path),
                "boxes": [{"label": None, "confidence": 0, "bbox": []}]
            }
            with open(json_output_path, "w") as f:
                json.dump(json_output, f, indent=4)
            log_message(log_file, f"No detections for '{img_path}'. Empty JSON saved to '{json_output_path}'.")
    except Exception as e:
        log_message(log_file, f"Error processing image '{img_path}': {str(e)}")
    finally:
        with lock:
            counter.value += 1
            print(f"PROCESS: {counter.value}/{total_images}", flush=True)


def process_images_with_pool(yolo_model_path, original_images_dir, output_dir, json_output_dir, log_file):
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
        initargs=(yolo_model_path,),
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
    model_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), "models", "Detector.pt")

    start_time = time.time()
    process_images_with_pool(model_path, original_images_dir, output_images_dir, json_output_dir, log_file)
    end_time = time.time()

    total_time = end_time - start_time
    log_message(log_file, f"Total processing time: {total_time:.2f} seconds")


def main():
    if len(sys.argv) != 4:
        print("Usage: python detection.py <input_folder> <output_folder> <json_output_folder>", flush=True)
        sys.exit(1)

    original_images_dir = sys.argv[1]
    output_images_dir = sys.argv[2]
    json_output_dir = sys.argv[3]
    run(original_images_dir, output_images_dir, json_output_dir)

if __name__ == "__main__":
    main()
