"""
Animal detection and reidentification main wrapper.

A single binary which encompasses both detection and re-ID, so that we can
bundle a single Python interpreter and all deps as a single pyinstaller package.

Build with:

    pyinstaller --name care \
        --add-data vit_care.yml:. \
        --add-data CARE_Traced.pt:. \
        --add-data Detector.pt:. \
        main.py

Test with:

    mkdir -p \
        /tmp/care/detection_images \
        /tmp/care/detection_json \
        /tmp/care/reid_image_output \
        /tmp/care/reid_json_output \
        /tmp/care/logs

    dist/care/care detection-cpu \
        /Users/cpearce/Downloads/Test-Data \
        /tmp/care/detection_images \
        /tmp/care/detection_json \
        /tmp/care/logs

    dist/care/care reid-cpu \
        /tmp/care/detection_images \
        /tmp/care/detection_json \
        /tmp/care/reid_image_output \
        /tmp/care/reid_json_output \
        vit_care.yml \
        /tmp/care/logs

"""

import sys
import detection
import detection_GPU
import multiprocessing
import ReID
import ReID_GPU


def main():
    # We must call freeze_support() before any flag parsing, as when
    # multiprocessing forks it passes different CLI arguments.
    multiprocessing.freeze_support()
    if len(sys.argv) == 1:
        print("No task specified.")
        sys.exit(1)
    task = sys.argv[1]
    match (task):
        case "reid-cpu":
            args = [
                "image_dir",
                "json_dir",
                "output_dir",
                "reid_output_dir",
                "log_dir",
            ]
            run = ReID.run
        case "reid-gpu":
            args = [
                "image_dir",
                "json_dir",
                "output_dir",
                "reid_output_dir",
                "log_dir",
            ]
            run = ReID_GPU.run
        case "detection-cpu":
            args = [
                "original_images_dir",
                "output_images_dir",
                "json_output_dir",
                "log_dir",
            ]
            run = detection.run
        case "detection-gpu":
            args = [
                "original_images_dir",
                "output_images_dir",
                "json_output_dir",
                "log_dir",
            ]
            run = detection.run
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
