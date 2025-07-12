#!/bin/bash

if [ ! -n "$VIRTUAL_ENV" ]; then
    echo "Not in python venv; activate with:"
    echo "  source .venv/bin/activate"
    exit 1
fi

if [ ! -e models/CARE_Traced_GPUv.pt ]; then
    echo "models/CARE_Traced_GPUv.pt must exist."
fi

if [ ! -e models/Detector_GPU.pt ]; then
    echo "models/Detector_GPU.pt must exist."
fi

conda info &> /dev/null && (echo "DO NOT REDISTRIBUTE CONDA PYTHON" ; exit 1)

pyinstaller \
    --noconfirm \
    --name care-detect-reid \
    --distpath ../care-electron/resources/ \
    --add-data models/vit_care.yml:models \
    --add-data models/CARE_Traced_GPUv.pt:models \
    --add-data models/Detector_GPU.pt:models \
    main_cpu.py
