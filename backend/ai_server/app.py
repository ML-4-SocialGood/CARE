from flask import Flask, Response, jsonify
from dotenv import load_dotenv
import os
import subprocess
import sys
import platform
import signal
from ultralytics import YOLO
import psutil

app = Flask(__name__)

# Global dictionary to track processes by user_id
processes = {}

def get_python_command():
    """
    Returns the appropriate Python command based on the OS.
    """
    if platform.system() == "Windows":
        return "python"  # Use "python" for Windows
    else:
        return "python3"  # Use "python3" for Linux/macOS

def kill_existing_process(user_id):
    """
    Kill the existing process and its children for a given user_id.
    """
    user_id = int(user_id)
    if user_id in processes:
        parent_process = processes[user_id]
        if parent_process.poll() is None:  # Check if parent is still running
            try:
                parent = psutil.Process(parent_process.pid)
                for child in parent.children(recursive=True):  # Kill children
                    child.kill()
                parent.kill()  # Kill parent
                parent_process.wait()  # Ensure it's terminated
            except psutil.NoSuchProcess:
                pass # Process might have already finished

        processes.pop(int(user_id))  # Remove it from the dictionary

def run_detection(user_id):
    # kill_existing_process(user_id)  # Kill the process if already running

    python_command = get_python_command()
    current_dir = os.getcwd()
    # Run the Python script using Popen
    if platform.system() == "Windows":
        creationflags = subprocess.CREATE_NEW_PROCESS_GROUP  # Use this flag for Windows
        process = subprocess.Popen([python_command, 'detection_GPU.py', 
                                    os.path.join(current_dir, "..", "temp", "image_detection_pending", str(user_id)),
                                    os.path.join(current_dir, "..", "data", "image_marked", str(user_id)),
                                    os.path.join(current_dir, "..", "data", "image_cropped_json", str(user_id))],
                                    stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True,
                                    creationflags=creationflags)
    else:
        process = subprocess.Popen([python_command, 'detection_GPU.py', 
                                    os.path.join(current_dir, "..", "temp", "image_detection_pending", str(user_id)),
                                    os.path.join(current_dir, "..", "data", "image_marked", str(user_id)),
                                    os.path.join(current_dir, "..", "data", "image_cropped_json", str(user_id))],
                                    stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True,
                                    preexec_fn=os.setsid)  # Use setsid to create new process group on Linux/macOS

    # Store the process in the global dictionary
    processes[int(user_id)] = process

    # Yield each line of output as it comes in
    for line in process.stdout:
        yield f"{line}<br/>\n"

    # Wait for the process to finish and handle any remaining output
    process.stdout.close()
    process.wait()

    # Remove the process from the global dictionary when finished
    processes.pop(int(user_id), None)

def run_reid(user_id):
    # kill_existing_process(user_id)  # Kill the process if already running

    python_command = get_python_command()
    current_dir = os.getcwd()
    # Run the Python script using Popen
    process = subprocess.Popen([python_command, 'ReID_GPU.py', 
                                os.path.join(current_dir, "..", "temp", "image_reid_pending", str(user_id)), # <image_dir>
                                os.path.join(current_dir, "..", "data", "image_cropped_json", str(user_id)), # <json_dir>
                                os.path.join(current_dir, "..", "temp", "image_cropped_reid_pending", str(user_id)), # <output_dir>
                                os.path.join(current_dir, "..", "data", "image_reid_output", str(user_id))], # <reid_output_dir>
                                stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True)
    
    # Store the process in the global dictionary
    processes[int(user_id)] = process

    # print(processes)

    # Yield each line of output as it comes in
    for line in process.stdout:
        yield f"{line}<br/>\n"

    # Wait for the process to finish and handle any remaining output
    process.stdout.close()
    process.wait()

    # Remove the process from the global dictionary when finished
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

    # Load YOLO first to avoid streaming output issue
    DEVICE = "cuda"  # Change to "cuda" if using GPU
    yolo_model = YOLO("best_50_GPU.pt").to(DEVICE)

    app.run(host='127.0.0.1', port=ai_server_port)
