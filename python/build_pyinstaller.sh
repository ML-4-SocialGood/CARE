#!/bin/bash

SCRIPT_DIR=$(cd "$(dirname "${BASH_SOURCE[0]}")" &> /dev/null && pwd)

if [ ! -n "$VIRTUAL_ENV" ]; then
    echo "Not in python venv; activate with:"
    echo "  source .venv/bin/activate"
    exit 1
fi

models=(
    "models/md_v1000.0.0-redwood.pt"
    "models/dinov3_vith16plus_pretrain_lvd1689m-7c1da9a5.pth"
    "models/dino_species_classifier.pt"
    "models/dino_binary_classifier_v3.pt"
    "models/DinoAdapter_Stoat_day_night_mixed_precision.pth.tar25"
    "models/dinoadapter_inference.yaml"
)

for model in "${models[@]}"; do
    if [ ! -f "${SCRIPT_DIR}/$model" ]; then
        echo "$model must exist. Contact project owners for model files."
    fi
done

# Check if dinov3 folder exists
if [ ! -d "${SCRIPT_DIR}/dinov3" ]; then
    echo "dinov3 folder must exist. Contact project owners for dinov3 files."
    exit 1
fi

# Don't use Conda; it's multiprocessing impelementation is broken.
conda info &> /dev/null && (echo "DO NOT REDISTRIBUTE CONDA PYTHON" ; exit 1)

pyinstaller \
    --noconfirm \
    --name care-detect-reid \
    --distpath ../care-electron/resources/ \
    --add-data models/md_v1000.0.0-redwood.pt:models \
    --add-data models/dinov3_vith16plus_pretrain_lvd1689m-7c1da9a5.pth:models \
    --add-data models/dino_species_classifier.pt:models \
    --add-data models/dino_binary_classifier_v3.pt:models \
    --add-data dinov3:dinov3 \
    --add-data models/DinoAdapter_Stoat_day_night_mixed_precision.pth.tar25:models \
    --add-data models/dinoadapter_inference.yaml:models \
    main.py
