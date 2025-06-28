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
global_process = None # Tracks running subprocess.

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


def kill_existing_process():
    """
    Kill the existing process and its children.
    """
    global global_process
    # subprocess.poll() returns None if the process is running.
    if global_process and global_process.poll() is None:
        try:
            parent = psutil.Process(global_process.pid)
            for child in parent.children(recursive=True):    # kill children
                child.kill()
            parent.kill()    # kill parent
            global_process.wait()    # ensure it's terminated
        except psutil.NoSuchProcess:
            pass    # process might have already finished

    global_process = None


def run_detection():
    kill_existing_process()
    global global_process
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
                                    os.path.join(current_dir, "..", "temp", "image_detection_pending", "1"),
                                    os.path.join(current_dir, "..", "data", "image_marked", "1"),
                                    os.path.join(current_dir, "..", "data", "image_cropped_json", "1")],
                                    stdout = subprocess.PIPE,
                                    stderr = subprocess.PIPE,
                                    text = True,
                                    creationflags = creationflags)
    else:
        process = subprocess.Popen([python_command, detection_script_filename,
                                    os.path.join(current_dir, "..", "temp", "image_detection_pending", "1"),
                                    os.path.join(current_dir, "..", "data", "image_marked", "1"),
                                    os.path.join(current_dir, "..", "data", "image_cropped_json", "1")],
                                    stdout = subprocess.PIPE,
                                    stderr = subprocess.PIPE,
                                    text = True,
                                    preexec_fn = os.setsid)    # use setsid to create new process group on Linux/macOS

    # Record process to terminate() can kill.
    # Note: We rely on our local reference, as terminate() clears global_process.
    global_process = process

    # Yield each line of output as it comes in.
    for line in process.stdout:
        yield f"{line}<br/>\n"

    # Wait for the process to finish and handle any remaining output.
    process.stdout.close()
    process.wait()

    # Remove the process from the global dictionary when finished.
    global_process = None


def run_reid():
    python_command = get_python_command()
    current_dir = os.getcwd()

    # Check the configrations for running reid.
    if device == "CPU":
        reid_script_filename = "ReID.py"
    else:
        reid_script_filename = "ReID_GPU.py"

    # Run the Python script using Popen.
    kill_existing_process()
    global global_process
    process = subprocess.Popen([python_command, reid_script_filename,
                                os.path.join(current_dir, "..", "temp", "image_reid_pending", "1"),    # <image_dir>
                                os.path.join(current_dir, "..", "data", "image_cropped_json", "1"),    # <json_dir>
                                os.path.join(current_dir, "..", "temp", "image_cropped_reid_pending", "1"),    # <output_dir>
                                os.path.join(current_dir, "..", "data", "image_reid_output", "1")],    # <reid_output_dir>
                                stdout = subprocess.PIPE,
                                stderr = subprocess.PIPE,
                                text = True)

    # Record process to terminate() can kill.
    # Note: We rely on our local reference, as terminate() clears global_process.
    global_process = process

    # Yield each line of output as it comes in.
    for line in process.stdout:
        yield f"{line}<br/>\n"

    # Wait for the process to finish and handle any remaining output.
    process.stdout.close()
    process.wait()

    # Remove the process from the global dictionary when finished.
    global_process = None


@app.route('/ai_api/detection', methods=['GET'])
def detection_endpoint():
    return Response(run_detection(), mimetype='text/html')

@app.route('/ai_api/reid', methods=['GET'])
def reid_endpoint():
    return Response(run_reid(), mimetype='text/html')

@app.route('/ai_api/terminate', methods=['GET'])
def terminate_endpoint():
    kill_existing_process()
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
