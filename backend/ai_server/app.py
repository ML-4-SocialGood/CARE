import json
import os
import platform
import psutil
import signal
import subprocess
import sys

from dotenv import load_dotenv
from flask import Flask, Response, jsonify
from ultralytics import YOLO


app = Flask(__name__)
processes = {}    # global dictionary to track processes by user_id

# Load JSON file and extract the global configrations.
with open("./config/install_config.json", "r") as file:
    config = json.load(file)

device = config["device"]
cuda_version = config["CUDA"]


def get_python_command():
    """
    Return the appropriate Python command based on the OS.
    """
    if platform.system() == "Windows":
        return "python"    # use "python" for Windows
    else:
        return "python3"    # use "python3" for Linux/macOS


def kill_existing_process(user_id):
    """
    Kill the existing process and its children for a given user_id.
    """
    user_id = int(user_id)
    if user_id in processes:
        parent_process = processes[user_id]
        if parent_process.poll() is None:    # check if parent is still running
            try:
                parent = psutil.Process(parent_process.pid)
                for child in parent.children(recursive=True):    # kill children
                    child.kill()
                parent.kill()    # kill parent
                parent_process.wait()    # ensure it's terminated
            except psutil.NoSuchProcess:
                pass    # process might have already finished

        processes.pop(int(user_id))    # remove it from the dictionary


def run_detection(user_id):
    # kill_existing_process(user_id)    # kill the process if already running
    python_command = get_python_command()
    current_dir = os.getcwd()
    
    # Check the configrations for running detection.
    if device == "CPU":
        detection_script_filename = "detection.py"
    else:
        detection_script_filename = "detection_GPU.py"

    # Run the Python script using Popen.
    if platform.system() == "Windows":
        creationflags = subprocess.CREATE_NEW_PROCESS_GROUP    # use this flag for Windows
        process = subprocess.Popen([python_command, detection_script_filename, 
                                    os.path.join(current_dir, "..", "temp", "image_detection_pending", str(user_id)), 
                                    os.path.join(current_dir, "..", "data", "image_marked", str(user_id)), 
                                    os.path.join(current_dir, "..", "data", "image_cropped_json", str(user_id))], 
                                    stdout = subprocess.PIPE, 
                                    stderr = subprocess.PIPE, 
                                    text = True, 
                                    creationflags = creationflags)
    else:
        process = subprocess.Popen([python_command, detection_script_filename, 
                                    os.path.join(current_dir, "..", "temp", "image_detection_pending", str(user_id)), 
                                    os.path.join(current_dir, "..", "data", "image_marked", str(user_id)), 
                                    os.path.join(current_dir, "..", "data", "image_cropped_json", str(user_id))], 
                                    stdout = subprocess.PIPE, 
                                    stderr = subprocess.PIPE, 
                                    text = True, 
                                    preexec_fn = os.setsid)    # use setsid to create new process group on Linux/macOS

    # Store the process in the global dictionary.
    processes[int(user_id)] = process

    # Yield each line of output as it comes in.
    for line in process.stdout:
        yield f"{line}<br/>\n"

    # Wait for the process to finish and handle any remaining output.
    process.stdout.close()
    process.wait()

    # Remove the process from the global dictionary when finished.
    processes.pop(int(user_id), None)


def run_reid(user_id):
    # kill_existing_process(user_id)    # kill the process if already running
    python_command = get_python_command()
    current_dir = os.getcwd()

    # Check the configrations for running reid.
    if device == "CPU":
        reid_script_filename = "ReID.py"
    else:
        reid_script_filename = "ReID_GPU.py"

    # Run the Python script using Popen.
    process = subprocess.Popen([python_command, reid_script_filename, 
                                os.path.join(current_dir, "..", "temp", "image_reid_pending", str(user_id)),    # <image_dir>
                                os.path.join(current_dir, "..", "data", "image_cropped_json", str(user_id)),    # <json_dir>
                                os.path.join(current_dir, "..", "temp", "image_cropped_reid_pending", str(user_id)),    # <output_dir>
                                os.path.join(current_dir, "..", "data", "image_reid_output", str(user_id))],    # <reid_output_dir>
                                stdout = subprocess.PIPE, 
                                stderr = subprocess.PIPE, 
                                text = True)
    
    # Store the process in the global dictionary.
    processes[int(user_id)] = process

    # Yield each line of output as it comes in.
    for line in process.stdout:
        yield f"{line}<br/>\n"

    # Wait for the process to finish and handle any remaining output.
    process.stdout.close()
    process.wait()

    # Remove the process from the global dictionary when finished.
    processes.pop(int(user_id), None)


@app.route('/ai_api/detection/<user_id>', methods=['GET'])
def detection_endpoint(user_id):
    return Response(run_detection(user_id), mimetype='text/html')

@app.route('/ai_api/reid/<user_id>', methods=['GET'])
def reid_endpoint(user_id):
    return Response(run_reid(user_id), mimetype='text/html')

@app.route('/ai_api/terminate/<user_id>', methods=['GET'])
def terminate_endpoint(user_id):
    kill_existing_process(user_id)
    return jsonify(message="Request was successful!"), 200

if __name__ == '__main__':
    load_dotenv(dotenv_path="../.env")
    ai_server_port = os.getenv("AI_SERVER_PORT", 5000)

    # Load YOLO first to avoid streaming output issue.
    if device == "CPU":
        DEVICE = "cpu"
        yolo_model = YOLO("Detector.pt").to(DEVICE)
    else:
        DEVICE = "cuda"
        yolo_model = YOLO("Detector_GPU.pt").to(DEVICE)

    app.run(host='127.0.0.1', port=ai_server_port)
