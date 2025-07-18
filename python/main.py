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

import detection_cpu
import detection_gpu
import reid_cpu
import reid_gpu


def main():
    # We must call freeze_support() before any flag parsing, as when
    # multiprocessing forks it passes different CLI arguments.
    multiprocessing.freeze_support()
    if len(sys.argv) == 1:
        print("No task specified.")
        sys.exit(1)
    task = sys.argv[1]
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
            if torch.cuda.is_available():
                run = reid_gpu.run
            else:
                run = reid_cpu.run
        case "detection":
            args = [
                "original_images_dir",
                "output_images_dir",
                "json_output_dir",
                "log_dir",
            ]
            if torch.cuda.is_available():
                run = detection_gpu.run
            else:
                run = detection_cpu.run
        case _:
            print(f"Invalid option {task}")
            sys.exit(1)
    if len(sys.argv) != len(args) + 2:
        print(f"Invalid arguments for task {task} expected {args}")
        print(f"sys.argv={sys.argv}")
        sys.exit(1)
    kwargs = {k : sys.argv[2 + i] for (i, k) in enumerate(args)}
    run(**kwargs)

if __name__ == "__main__":
    main()
