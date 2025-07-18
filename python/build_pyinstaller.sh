#!/bin/bash

SCRIPT_DIR=$(cd "$(dirname "${BASH_SOURCE[0]}")" &> /dev/null && pwd)

if [ ! -n "$VIRTUAL_ENV" ]; then
    echo "Not in python venv; activate with:"
    echo "  source .venv/bin/activate"
    exit 1
fi

models=(
    "models/vit_care.yml"
    "models/CARE_Traced.pt"
    "models/Detector.pt"
    "models/Detector_GPU.pt"
    "models/CARE_Traced_GPUv.pt"
)

for model in "${models[@]}"; do
    if [ ! -f "${SCRIPT_DIR}/$model" ]; then
        echo "$model must exist. Contact project owners for model files."
    fi
done

# Don't use Conda; it's multiprocessing impelementation is broken.
conda info &> /dev/null && (echo "DO NOT REDISTRIBUTE CONDA PYTHON" ; exit 1)

pyinstaller \
    --noconfirm \
    --name care-detect-reid \
    --distpath ../care-electron/resources/ \
    --add-data models/vit_care.yml:models \
    --add-data models/CARE_Traced.pt:models \
    --add-data models/CARE_Traced_GPUv.pt:models \
    --add-data models/Detector.pt:models \
    --add-data models/Detector_GPU.pt:models \
    main.py
