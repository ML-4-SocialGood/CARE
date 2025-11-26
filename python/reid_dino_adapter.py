import glob
import json
import numpy as np
import os
import shutil
import sys
import torch
import torch.nn.functional as F
import torchvision.transforms as T
import torch.nn as nn
from torch.amp import autocast

from config import cfg
from datetime import datetime
from PIL import Image
from pathlib import Path

class Adapter(nn.Module):
    def __init__(self, channel_in, reduction=4):
        super().__init__()
        self.fc = nn.Sequential(
            nn.Linear(channel_in, channel_in // reduction, bias=False),
            nn.ReLU(),  
            nn.Dropout(0.5),
            nn.Linear(channel_in // reduction, channel_in, bias=False),
            nn.ReLU(),  
        )

    def forward(self, x):
        x = self.fc(x)
        return x


class CustomDino(nn.Module):
    def __init__(self, cfg, dino_model, domains):
        super().__init__()
        self.cfg = cfg
        self.dino_model = dino_model

        output_dim = self.dino_model.embed_dim
        self.adapter_dict = nn.ModuleDict()
        self.classifier_dict = nn.ModuleDict()

        self.day_night_adapter = cfg.MODEL.Day_Night_Adapter

        for i, domain in enumerate(domains):
            if self.day_night_adapter:
                self.adapter_dict[f"adapter_{i}_day"] = Adapter(output_dim, 4)
                self.adapter_dict[f"adapter_{i}_night"] = Adapter(output_dim, 4)
            else:
                self.adapter_dict[f"adapter_{i}"] = Adapter(output_dim, 4)
        self.domains = domains

    # single domain assumed, restriction imposed in front-end
    def forward(self, image, time):
        adapter_ratio = 0.4  
        # Get cls token from DINO
        x_tokens_list = self.dino_model.get_intermediate_layers(image, n=1, return_class_token=True)
        image_features = create_linear_input(x_tokens_list, 1, False)
        # Normalize only at the end; keep raw features here
        base_features = image_features
        if isinstance(time, int):
            time = torch.tensor([time]).to(base_features.device)
        else:
            time = torch.tensor(time).to(base_features.device)
        
        unique_times = torch.unique(time)
        # Mix in-place; avoid cloning to save memory
        mixed_features = base_features

        
        if self.day_night_adapter:
            if time is None:
                raise ValueError("Time information (day/night) must be provided when using day/night adapters.")
            day_adapter = self.adapter_dict["adapter_0_day"]
            night_adapter = self.adapter_dict["adapter_0_night"]
            # iterate through day and night adapters
            for t in unique_times.tolist():
                idx = (time == t).nonzero(as_tuple=False).squeeze(1)
                sub_base_features = base_features.index_select(0, idx)
                if t == 1:  # day
                    sub_adapter_features = day_adapter(sub_base_features)
                else:  # night
                    sub_adapter_features = night_adapter(sub_base_features)
                sub_mixed_features = (
                    adapter_ratio * sub_adapter_features + (1 - adapter_ratio) * sub_base_features
                )
                mixed_features[idx] = sub_mixed_features
        else:
            adapter = self.adapter_dict["adapter_0"]
            sub_adapter_features = adapter(base_features)
            sub_mixed_features = (
                adapter_ratio * sub_adapter_features + (1 - adapter_ratio) * base_features
            )

        # Normalize mixed features for retrieval/metric learning
        mixed_features_norm = torch.nn.functional.normalize(mixed_features, dim=-1, eps=1e-6)
        return mixed_features_norm

def create_log_file(log_dir: str = '') -> str:
    """
    Create a log file with a timestamp.
    """
    if not log_dir:
        log_dir = os.path.join(Path.home(), ".ml4sg-care", "logs")
    os.makedirs(log_dir, exist_ok=True)
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    return os.path.join(log_dir, f"{timestamp}_reid_log.txt")


def log_message(log_file, message):
    current_time = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    with open(log_file, "a") as f:
        f.write(f"[{current_time}] {message}\n")

def check_day_night(img):
    arr = np.array(img)

    r, g, b = arr[:,:,0], arr[:,:,1], arr[:,:,2]

    dff_rg = np.median(np.abs(r - g))
    dff_rb = np.median(np.abs(r - b))
    dff_gb = np.median(np.abs(g - b))

    mean_diff = np.max([dff_rg, dff_rb, dff_gb])

    # 255 is for extreme cases, night time photos usually have diff of 0
    if mean_diff < 3 or mean_diff == 255:
        return 0  # night
    else:
        return 1

def load_and_preprocess_image(file_path):
    """
    Load and preprocess image with the configrations.
    """
    img = Image.open(file_path).convert("RGB")

    is_day = check_day_night(img)

    image_transforms = T.Compose([
        T.Resize(cfg.INPUT.SIZE),
        T.ToTensor(),
        T.Normalize(mean = cfg.INPUT.PIXEL_MEAN, std = cfg.INPUT.PIXEL_STD)
    ])                                 # define transformations

    image = image_transforms(img)      # apply transformations
    image = image.unsqueeze(0)         # add batch dimension (i.e., [1, 3, 256, 128])
    return image, is_day

def create_linear_input(x_tokens_list, use_n_blocks, use_avgpool):
    """Create linear input from DINO intermediate layers"""
    intermediate_output = x_tokens_list[-use_n_blocks:]
    output = torch.cat([class_token for _, class_token in intermediate_output], dim=-1)
    if use_avgpool:
        output = torch.cat(
            (
                output,
                torch.mean(intermediate_output[-1][0], dim=1),  # patch tokens
            ),
            dim=-1,
        )
        output = output.reshape(output.shape[0], -1)
    return output

def get_dino_with_adapter_embedding(model, image, device, is_day_list=None):
    with torch.no_grad(), autocast(device_type=device.type, dtype=torch.float16, enabled=_fp16_supported(device)):
        image = image.to(device)
        feature = model(image, is_day_list)
        feature = feature.to(device)
    return feature

def _fp16_supported(device):
    fp16_supported = device.type == "cuda" or (device.type == "mps" and torch.backends.mps.is_built())
    return fp16_supported


def compute_embeddings_batched(model, images, times, device, batch_size: int) -> np.ndarray:
    """
    Compute L2-normalized embeddings for all images in mini-batches.

    Args:
        model: DINO+adapter model.
        images: list of tensors, each of shape [1, C, H, W].
        times: list of day/night flags aligned with images.
        device: torch.device to run on.
        batch_size: batch size for inference.

    Returns:
        embeddings: NumPy array of shape [N, D].
    """
    embeddings = []
    total = len(images)
    processed = 0

    for start in range(0, total, batch_size):
        end = min(start + batch_size, total)
        batch_images = images[start:end]
        batch_times = times[start:end]

        # Concatenate into a single batch tensor: [B, C, H, W]
        batch_tensor = torch.cat(batch_images, dim=0)

        batch_embedding = get_dino_with_adapter_embedding(
            model,
            batch_tensor,
            device,
            batch_times,
        )
        # batch_embedding: [B, D]
        batch_np = batch_embedding.cpu().float().numpy()
        embeddings.append(batch_np)

        processed += (end - start)
        print(f"PROCESS: {processed}/{total}", flush=True)

    return np.concatenate(embeddings, axis=0)  # [N, D], L2-normalized


def compute_distance_matrix(embeddings: np.ndarray) -> np.ndarray:
    """
    Build a cosine distance matrix and apply the same per-row masking
    behavior as the original compute_distances(is_duplicate=True).

    Args:
        embeddings: NumPy array of shape [N, D].

    Returns:
        distance_mat: NumPy array of shape [N, N].
    """
    # Cosine similarity matrix: sim[i, j] = <emb_i, emb_j>
    sim_matrix = embeddings @ embeddings.T
    distance_mat = 1.0 - sim_matrix

    # For each row, set the minimum-distance entry to infinity.
    for r in range(distance_mat.shape[0]):
        row = distance_mat[r]
        min_idx = np.argmin(row)
        distance_mat[r, min_idx] = np.inf

    return distance_mat


def process_dist_mat_v2(dist_mat):
    """
    Process the distance matrix to count the number of individuals.
    """
    number_of_images = len(dist_mat)
    keys = np.array([-1] * number_of_images)

    for r in range(len(dist_mat)):
        row = dist_mat[r]
        print(f"Row {r} distances: {row}")
        min_dist = np.min(row)
        candidates_bool = np.abs(row - min_dist) <= 0.00065
        candidates_index = np.where(candidates_bool)[0]
        candidates_key = keys[candidates_index]
        current_counter = np.max(keys)

        if keys[r] != -1:
            keys[candidates_index] = keys[r]

        elif keys[r] == -1 and np.all(candidates_key == -1):
            keys[r] = current_counter + 1
            keys[candidates_index] = current_counter + 1

        elif keys[r] == -1 and np.any(candidates_key != -1):
            min_pos_key = np.min(candidates_key[candidates_key != -1])
            selected_indices = candidates_index[np.where(candidates_key != min_pos_key)[0]]
            keys[r] = min_pos_key
            keys[selected_indices] = min_pos_key

    aid = 0
    output_dict = dict()
    min_key, max_key = np.min(keys), np.max(keys)
    for k in range(min_key, max_key + 1):
        if k in keys:
            if aid not in output_dict:
                output_dict[aid] = list(np.where(keys == k)[0])
                aid += 1
    return output_dict


def format_output_dict(image_paths, output_dict, rel_parent_path):
    image_names = []
    output_dict_with_rel_paths = dict()
    for img_path in image_paths:
        img_name = os.path.basename(img_path)
        image_names.append(img_name)

    for id, list_of_imgs in output_dict.items():
        id = "ID-" + str(id)
        list_of_img_paths = []
        for img_idx in list_of_imgs:
            img_full_path = image_paths[img_idx]
            img_relative_path = os.path.relpath(img_full_path, rel_parent_path)
            list_of_img_paths.append(img_relative_path)
        if id not in output_dict_with_rel_paths:
            output_dict_with_rel_paths[id] = list_of_img_paths
    return output_dict_with_rel_paths


def show_results(q_img_paths, reid_dict, reid_output_dir, log_file):
    """
    Show and save the re-identification results.
    """
    if len(reid_dict) == 1:
        log_message(log_file, f"The CARE model successfully identified {len(reid_dict)} individual in the dataset.")
    else:
        log_message(log_file, f"The CARE model successfully identified {len(reid_dict)} individuals in the dataset.")
    log_message(log_file, "\nRe-identification Result:")
    log_message(log_file, str(reid_dict))
    log_message(log_file, "-" * 30)
    log_message(log_file, "")

    current_datetime = datetime.now()
    formatted_date = current_datetime.strftime("%Y%m%d")
    formatted_time = current_datetime.strftime("%H%M%S")

    output_parent_path = os.path.join(reid_output_dir, formatted_date)
    os.makedirs(output_parent_path, exist_ok=True)

    json_output_path = os.path.join(output_parent_path, formatted_time + '.json')
    with open(json_output_path, 'w') as json_file:
        json.dump(reid_dict, json_file, indent=4)

    log_message(log_file, f"Re-identification results saved to JSON file: {json_output_path}")


def crop_image_from_json(image_path, json_path, output_dir, original_root, log_file):
    with open(json_path, "r") as f:
        crop_info = json.load(f)

    if 'boxes' not in crop_info or not crop_info['boxes']:
        log_message(log_file, f"No animal detected in image: {image_path}, skipping.")
        return

    img = Image.open(image_path).convert("RGB")
    relative_path = os.path.relpath(image_path, original_root)
    relative_dir = os.path.dirname(relative_path)
    output_dir_with_subfolders = os.path.join(output_dir, relative_dir)

    if not os.path.exists(output_dir_with_subfolders):
        os.makedirs(output_dir_with_subfolders)

    base_name = os.path.splitext(os.path.basename(image_path))[0]

    top_bbox = max(crop_info['boxes'], key=lambda x: x.get('detection_confidence', 0))
    crop_info['boxes'] = [top_bbox]

    for i, bbox_info in enumerate(crop_info['boxes']):
        bbox = bbox_info['bbox']

        if not bbox or len(bbox) != 4:
            log_message(log_file, f"Invalid bbox in image: {image_path}, bbox: {bbox}, skipping this bbox.")
            continue

        x1, y1, x2, y2 = map(int, bbox)
        cropped_img = img.crop((x1, y1, x2, y2))

        if len(crop_info['boxes']) > 1:
            cropped_img_filename = f"{base_name}_{i}.jpg"
        else:
            cropped_img_filename = f"{base_name}.jpg"

        cropped_img_path = os.path.join(output_dir_with_subfolders, cropped_img_filename)
        cropped_img.save(cropped_img_path)
        log_message(log_file, f"Saved cropped image: {cropped_img_path}")


def process_images_in_folder(image_dir, json_dir, output_dir, log_file):
    for root, _, files in os.walk(image_dir):
        for file in files:
            if file.lower().endswith(('.jpg', '.jpeg', '.png')):
                image_path = os.path.join(root, file)
                relative_path = os.path.relpath(image_path, image_dir)
                json_path = os.path.join(json_dir, relative_path)
                json_path = os.path.splitext(json_path)[0] + '.json'

                if os.path.exists(json_path):
                    crop_image_from_json(image_path, json_path, output_dir, image_dir, log_file)
                else:
                    log_message(log_file, f"JSON file not found for image: {file}")


def clear_cropped_folder(cropped_dir, log_file):
    for root, dirs, files in os.walk(cropped_dir):
        for file in files:
            file_path = os.path.join(root, file)
            try:
                os.remove(file_path)
                log_message(log_file, f"Deleted file: {file_path}")
            except Exception as e:
                log_message(log_file, f"Error deleting file {file_path}: {e}")
        for dir in dirs:
            dir_path = os.path.join(root, dir)
            try:
                shutil.rmtree(dir_path)
                log_message(log_file, f"Deleted directory: {dir_path}")
            except Exception as e:
                log_message(log_file, f"Error deleting directory {dir_path}: {e}")


def run(image_dir, json_dir, output_dir, reid_output_dir, log_dir = '', batch_size: int | str = 4):
    log_file = create_log_file(log_dir)
    clear_cropped_folder(output_dir, log_file)

    dino_backbone_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), "models", "dinov3_vith16plus_pretrain_lvd1689m-7c1da9a5.pth")
    adapter_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), "models", "DinoAdapter_Stoat_day_night_mixed_precision.pth.tar25")
    cfg_file_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), "models", "dinoadapter_inference.yaml")

    print("STATUS: BEGIN", flush=True)

    process_images_in_folder(image_dir, json_dir, output_dir, log_file)

    # Set the device to GPU if available, otherwise use CPU.
    if torch.cuda.is_available():
        DEVICE = torch.device("cuda")
        log_message(log_file, f'Using GPU: {torch.cuda.get_device_name(0)}')
    elif torch.backends.mps.is_available():
        DEVICE = torch.device("mps")
        log_message(log_file, 'Using Apple Silicon GPU')
    else:
        DEVICE = torch.device("cpu")
        log_message(log_file, 'Using CPU. Note: Using CPU may be slow.')

    # Read and import the cfg file.
    cfg.set_new_allowed(True)
    cfg.merge_from_file(cfg_file_path)
    cfg.merge_from_list([])
    cfg.freeze()

    # Load the traced reid model.
    try:
        repo = os.path.join(os.path.dirname(os.path.abspath(__file__)), "dinov3")
        dino_model = torch.hub.load(
                        repo, 
                        'dinov3_vith16plus', 
                        source='local', 
                        weights=dino_backbone_path
                    )
        dino_model = dino_model.to(DEVICE)
        dino_model.eval()    # set the model in evaluation mode

        dino_with_adapter = CustomDino(
            cfg,
            dino_model=dino_model,
            domains=[0],    # only one domain for now
        )
        checkpoint = torch.load(adapter_path, map_location="cpu")
        for k, v in list(checkpoint.items()):
            if k.startswith("adapter_dict."):
                checkpoint[k[len("adapter_dict."):]] = v
                del checkpoint[k]
        missing, unexpected = dino_with_adapter.adapter_dict.load_state_dict(
            checkpoint, strict=False
        )
        print("Missing", missing)
        print("Unexpected", unexpected)
        dino_with_adapter = dino_with_adapter.to(DEVICE)
        dino_with_adapter.eval()    # set the model in evaluation mode
    except Exception as e:
        log_message(log_file, f'Errors: {e}')
        raise e

    cropped_image_paths = sorted(glob.glob(os.path.join(output_dir, "**", "*.jpg"), recursive=True))
    if not cropped_image_paths:
        log_message(log_file, "No cropped images found. Exiting ReID processing.")
        print("STATUS: DONE", flush=True)
        sys.exit(0)

    # Load all cropped images and corresponding day/night flags
    cropped_with_meta = [load_and_preprocess_image(img_path) for img_path in cropped_image_paths]
    is_day_list = [is_day for _, is_day in cropped_with_meta]
    cropped_images = [img for img, _ in cropped_with_meta]
    log_message(log_file, cropped_images)

    print("STATUS: PROCESSING", flush=True)

    total_images = len(cropped_image_paths)

    # Ensure batch_size is an int
    try:
        batch_size_int = int(batch_size)
        if batch_size_int <= 0:
            raise ValueError
    except (ValueError, TypeError):
        batch_size_int = 4
    batch_size = batch_size_int

    # Compute embeddings in mini-batches for efficiency, then build the full distance matrix.
    embeddings = compute_embeddings_batched(
        dino_with_adapter,
        cropped_images,
        is_day_list,
        DEVICE,
        batch_size,
    )

    distance_mat = compute_distance_matrix(embeddings)

    id_dict = process_dist_mat_v2(distance_mat)

    log_message(log_file, id_dict)
    log_message(log_file, output_dir)
    log_message(log_file, cropped_image_paths)

    output_dict = format_output_dict(cropped_image_paths, id_dict, output_dir)

    show_results(cropped_image_paths, output_dict, reid_output_dir, log_file)

    clear_cropped_folder(output_dir, log_file)

    print("STATUS: DONE", flush=True)



def main():
    if len(sys.argv) not in (5, 6):
        print("Usage: script.py <image_dir> <json_dir> <output_dir> <reid_output_dir> [batch_size]")
        sys.exit(1)
    image_dir = sys.argv[1]
    json_dir = sys.argv[2]
    output_dir = sys.argv[3]
    reid_output_dir = sys.argv[4]
    batch_size = sys.argv[5] if len(sys.argv) == 6 else 4
    run(image_dir, json_dir, output_dir, reid_output_dir, batch_size=batch_size)


if __name__ == "__main__":
    main()
