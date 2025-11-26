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

from config import cfg
from datetime import datetime
from PIL import Image
from pathlib import Path

class DinoStudent(nn.Module):
    def __init__(
        self,
        cfg,
        student_backbone,
        dimention_student,
        dimention_teacher,
        num_classes_per_domain,
    ):
        super().__init__()
        self.backbone = student_backbone
        self.cfg = cfg
        self.proj = nn.Linear(dimention_student, dimention_teacher, bias=False)
        self.classifiers = nn.ModuleDict(
            {
                f"domain_{int(domain)}": nn.Linear(
                    dimention_student, int(num_classes)
                )
                for domain, num_classes in num_classes_per_domain.items()
            }
        )

    def forward(self, x):
        feature_student = create_linear_input(
            self.backbone.get_intermediate_layers(x, n=1, return_class_token=True),
            1,
            False,
        )
        feature_student_teacher_space = self.proj(feature_student)
        return feature_student_teacher_space, feature_student

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


def load_and_preprocess_image(file_path):
    """
    Load and preprocess image with the configrations.
    """
    img = Image.open(file_path).convert("RGB")

    image_transforms = T.Compose([
        T.Resize(cfg.INPUT.SIZE_TEST),
        T.ToTensor(),
        T.Normalize(mean = cfg.INPUT.PIXEL_MEAN, std = cfg.INPUT.PIXEL_STD)
    ])                                 # define transformations

    image = image_transforms(img)      # apply transformations
    image = image.unsqueeze(0)         # add batch dimension (i.e., [1, 3, 256, 128])
    return image

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
    return output.float()

def get_dino_finetune_embedding(model, image, device):
    with torch.no_grad():
        image = image.to(device)
        _, feature = model(image)
        feature = feature.to(device)
        feature = nn.functional.normalize(feature, dim=-1, eps=1e-6)
    return feature

def get_dino_zeroshot_embedding(model, image, device):
    with torch.no_grad():
        image = image.to(device)
        x_tokens_list = model.get_intermediate_layers(
            image, n=1, return_class_token=True
        )
        feature = create_linear_input(x_tokens_list, 1, False)
        feature = feature.to(device)
        feature = nn.functional.normalize(feature, dim=-1, eps=1e-6)
    return feature

def compute_distances(model, query_image, gallery_images, is_duplicate, device):
    """
    Compute the distances between the query image and the gallery images.
    """
    list_of_dist = []
    query_embedding = get_dino_finetune_embedding(model, query_image, device)    # forward pass to get the embedding of the query image

    # Calculate the similarity and distance.
    for index in range(len(gallery_images)):
        gallery_embedding = get_dino_finetune_embedding(model, gallery_images[index], device)    # forward pass to get the embedding of the gallery image
        similarity = F.cosine_similarity(query_embedding, gallery_embedding)
        dist = 1 - similarity
        list_of_dist.append(dist.cpu().detach().numpy()[0])

    list_of_dist = np.array(list_of_dist)

    if is_duplicate:
        list_of_dist[np.argmin(list_of_dist)] = list_of_dist[np.argmax(list_of_dist)] + 1
    return list_of_dist


def process_dist_mat(dist_mat):
    output_dict = dict()
    number_of_images = len(dist_mat)
    keys = [-1] * number_of_images
    counter = 0
    for r in range(len(dist_mat)):
        row = dist_mat[r]
        matched_index = np.argmin(row)

        if keys[r] == -1 and keys[matched_index] == -1:
            output_dict[counter] = [r]
            keys[r] = counter
            output_dict[keys[r]].append(matched_index)
            keys[matched_index] = counter
            counter += 1

        elif keys[r] == -1 and keys[matched_index] != -1:
            output_dict[keys[matched_index]].append(r)
            keys[r] = keys[matched_index]

        elif keys[r] != -1 and keys[matched_index] == -1:
            output_dict[keys[r]].append(matched_index)
            keys[matched_index] = keys[r]
    return output_dict


def process_dist_mat_v2(dist_mat):
    """
    Process the distance matrix to count the number of individuals.
    """
    number_of_images = len(dist_mat)
    keys = np.array([-1] * number_of_images)

    for r in range(len(dist_mat)):
        row = dist_mat[r]
        min_dist = np.min(row)
        candidates_bool = np.abs(row - min_dist) <= 0.01
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


def run(image_dir, json_dir, output_dir, reid_output_dir, log_dir = ''):
    log_file = create_log_file(log_dir)
    clear_cropped_folder(output_dir, log_file)

    zeroshot_model_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), "models", "dinov3_vith16plus_pretrain_lvd1689m-7c1da9a5.pth")
    model_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), "models", "dino_finetune_distill-weights-only.pth")
    cfg_file_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), "models", "dinodistill.yaml")

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
        # dino_zeroshot_model = torch.hub.load(
        #                 repo, 
        #                 'dinov3_vith16plus', 
        #                 source='local', 
        #                 weights=model_path
        #             )
        # dino_zeroshot_model = dino_zeroshot_model.to(DEVICE)
        # dino_zeroshot_model.eval()    # set the model in evaluation mode

        dino_finetuned_model = DinoStudent(
            cfg,
            student_backbone=torch.hub.load(
                repo,
                "dinov3_vith16plus",
                source="local",
                weights=zeroshot_model_path,
            ),
            dimention_student=1280,
            dimention_teacher=4096,
            num_classes_per_domain={"0": 22},
        )
        checkpoint = torch.load(model_path, map_location="cpu")
        missing, unexpected = dino_finetuned_model.backbone.load_state_dict(
            checkpoint, strict=False
        )
        print("Missing", missing)
        print("Unexpected", unexpected)
        dino_finetuned_model = dino_finetuned_model.to(DEVICE)
        dino_finetuned_model.eval()    # set the model in evaluation mode
    except Exception as e:
        log_message(log_file, f'Errors: {e}')
        raise e

    cropped_image_paths = sorted(glob.glob(os.path.join(output_dir, "**", "*.jpg"), recursive=True))
    if not cropped_image_paths:
        log_message(log_file, "No cropped images found. Exiting ReID processing.")
        print("STATUS: DONE", flush=True)
        sys.exit(0)

    distance_mat = []    # a distance matrix
    cropped_images = [load_and_preprocess_image(img_path) for img_path in cropped_image_paths]
    log_message(log_file, cropped_images)

    print("STATUS: PROCESSING", flush=True)

    total_images = len(cropped_image_paths)

    # Compute the similarity of each matched image pair.
    for index in range(total_images):
        dist = compute_distances(model = dino_finetuned_model,
                                 query_image = cropped_images[index],
                                 gallery_images = cropped_images,
                                 is_duplicate = True,    # check whether the query image has a duplicate in Gallery
                                 device = DEVICE)
        distance_mat.append(dist)

        print(f"PROCESS: {index+1}/{total_images}", flush=True)

    id_dict = process_dist_mat_v2(distance_mat)

    log_message(log_file, id_dict)
    log_message(log_file, output_dir)
    log_message(log_file, cropped_image_paths)

    output_dict = format_output_dict(cropped_image_paths, id_dict, output_dir)

    show_results(cropped_image_paths, output_dict, reid_output_dir, log_file)

    clear_cropped_folder(output_dir, log_file)

    print("STATUS: DONE", flush=True)


def main():
    if len(sys.argv) != 5:
        print("Usage: script.py <image_dir> <json_dir> <output_dir> <reid_output_dir>")
        sys.exit(1)
    image_dir = sys.argv[1]
    json_dir = sys.argv[2]
    output_dir = sys.argv[3]
    reid_output_dir = sys.argv[4]
    run(image_dir, json_dir, output_dir, reid_output_dir)


if __name__ == "__main__":
    main()
