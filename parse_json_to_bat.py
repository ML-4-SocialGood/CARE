import json


# Load JSON file and extract the configrations.
with open("./backend/ai_server/config/install_config.json", "r") as file:
    config = json.load(file)

device = config["device"]
cuda_version = config["CUDA"]

# Print values in a format that can be read by the batch script.
print(f"{device} {cuda_version}")