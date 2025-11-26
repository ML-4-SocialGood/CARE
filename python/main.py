"""
Animal detection and reidentification main wrapper.

A single binary which encompasses both detection and re-ID, so that we can
bundle a single Python interpreter and all deps as a single pyinstaller package.

Build with:

    ./python/build_pyinstaller.sh

Test with:

    mkdir -p \
        /tmp/care/detection_images \
        /tmp/care/detection_json \
        /tmp/care/reid_image_output \
        /tmp/care/reid_json_output \
        /tmp/care/logs

    python main.py detection \
        /Users/cpearce/Downloads/Test-Data \
        /tmp/care/detection_images \
        /tmp/care/detection_json \
        /tmp/care/logs

    python main.py reid \
        /tmp/care/detection_images \
        /tmp/care/detection_json \
        /tmp/care/reid_image_output \
        /tmp/care/reid_json_output \
        /tmp/care/logs
"""

import multiprocessing
import sys
import torch
import os
import logging
import traceback

import detection_dino_cpu
import reid_dino_adapter
import reid_cpu
import reid_gpu
import detection_dino


def setup_logging(log_dir):
    if not os.path.exists(log_dir):
        os.makedirs(log_dir)
    log_file = os.path.join(log_dir, 'main.log')
    logging.basicConfig(
        level=logging.INFO,
        format='%(asctime)s - %(levelname)s - %(message)s',
        handlers=[
            logging.FileHandler(log_file),
            logging.StreamHandler()
        ]
    )


def main():
    # We must call freeze_support() before any flag parsing
    multiprocessing.freeze_support()
    
    if len(sys.argv) == 1:
        print("No task specified.")
        sys.exit(1)
        
    task = sys.argv[1]
    try:
        print(f"torch.cuda.is_available(): {torch.cuda.is_available()}")
        
        match (task):
            case "reid":
                args = [
                    "image_dir",
                    "json_dir", 
                    "output_dir",
                    "reid_output_dir",
                    "log_dir",
                ]
                optional_args = ["batch_size"]
                if torch.cuda.is_available():
                    run = reid_dino_adapter.run
                else:
                    run = reid_dino_adapter.run
            case "detection":
                args = [
                    "original_images_dir",
                    "output_images_dir", 
                    "json_output_dir",
                    "log_dir",
                ]
                optional_args = []
                if torch.cuda.is_available() or torch.backends.mps.is_available():
                    run = detection_dino.run
                else:
                    run = detection_dino.run
            case _:
                print(f"Invalid option {task}")
                sys.exit(1)

        min_args = len(args) + 2
        max_args = len(args) + 2 + len(optional_args)
        if not (min_args <= len(sys.argv) <= max_args):
            print(f"Invalid arguments for task {task} expected {args} plus optional {optional_args}")
            print(f"sys.argv={sys.argv}")
            sys.exit(1)

        kwargs = {k: sys.argv[2 + i] for (i, k) in enumerate(args)}

        # Append optional arguments if provided
        extra_values = sys.argv[2 + len(args):]
        for i, value in enumerate(extra_values):
            if i < len(optional_args):
                kwargs[optional_args[i]] = value
        
        # Setup logging before running
        setup_logging(kwargs['log_dir'])
        logging.info(f"Starting {task} with arguments: {kwargs}")
        
        # Verify input/output paths exist for path arguments only
        for key in args:
            path = kwargs[key]
            if not os.path.exists(path):
                os.makedirs(path, exist_ok=True)
                logging.info(f"Created directory: {path}")
        
        run(**kwargs)
        
    except Exception as e:
        logging.error(f"Error in main: {str(e)}")
        logging.error(traceback.format_exc())
        sys.exit(1)

if __name__ == "__main__":
    main()
