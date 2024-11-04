
---

### Browse Current User Detected Images

**Endpoint:** `GET /api/users/detect_images/browse`

**Description:** Fetches the contents of a specified directory within a date-stamped folder. This allows the current user to browse their detected images and folders. If an image file is found, the corresponding JSON file will be searched in the `data/image_cropped_json` folder to extract object detection details like labels and confidence levels. The API can now filter image files based on these extracted values.

**Authentication Required:**  
Yes  

**Cookie Used:**  
Name: `token`  
Description: The HTTP-only cookie containing the JWT token used for authentication.  

**Query Parameters:**
- `date` (string, optional): The date folder name in `YYYYMMDD` format (e.g., `20200612`).  
- `folderPath` (string, optional): The relative path within the date folder to view (e.g., `A/A1`). Defaults to the `data/image_marked/{userId}/{date}` folder. This path should not allow directory traversal outside the date folder.
  - If `date` is not provided, it will return contents from the `data/image_marked/{userId}` folder.
- **New Parameter: `label` (string, optional):** Filter images based on the object detection label extracted from their corresponding JSON files. If no label is provided, all images are returned (subject to confidence filtering).
  - Possible value for `label`: `null`, `Bird`, `Cat`, `Dog`, `Hedgehog`, `Rabbit`, `Rat`, `Sheep`, `Stoat`, `Trap`, `Weka`. (Total 1 + 10 possibilities)  
  - Also, when `label` = `null`, it will return images with no detection result, the frontend should display this option as `None`.    
  - Moreover, when `label` is not provided, all images are returned (subject to confidence filtering), the frontend should display this option as `All`.  
- **New Parameter: `confLow` (number, optional):** Lower bound for the object detection confidence score. Only images with a confidence score greater than or equal to this value will be included. Default: `0`. Minimum: `0`. Maximum: `1`.  
- **New Parameter: `confHigh` (number, optional):** Upper bound for the object detection confidence score. Only images with a confidence score less than or equal to this value will be included. Default: `1`. Minimum: `0`. Maximum: `1`.

**Response HTTP Code:**
- `200 OK` for successful retrieval
- `400 Bad Request` if path is a file, not a directory
- `401 Unauthorized` if token is missing or invalid
- `403 Forbidden` if the folder parameter attempts directory traversal (e.g., ../)  
- `404 Not Found` if the specified directory or file does not exist  
- `500 Internal Server Error` for other errors

**New Error Conditions:**
- If the corresponding JSON file for an image is not found in the `data/image_cropped_json` folder, the image will be skipped in the response.
- If no files match the label or confidence filters, the `files` array will be empty.

**Response Body:**

**Success Response (without filters):**
```json
{
  "files": [
    {
      "name": "02210617.jpg",
      "isDirectory": false,
      "path": "Stoat_Original\\02210617.jpg"
    },
    {
      "name": "02210623.jpg",
      "isDirectory": false,
      "path": "Stoat_Original\\02210623.jpg"
    },
    {
      "name": "A",
      "isDirectory": true,
      "path": "Stoat_Original\\A"
    }
  ]
}
```

**Success Response (with filters applied):**
```json
{
  "files": [
    {
      "name": "02210617.jpg",
      "isDirectory": false,
      "path": "Stoat_Original\\02210617.jpg"
    },
    {
      "name": "A",
      "isDirectory": true,
      "path": "Stoat_Original\\A"
    }
  ]
}
```

**Error Response:**
```json
{
  "error": "Error message"
}
```

**New Feature Details:**

- **Label and Confidence Filtering:** 
  - The system will check each image's corresponding JSON file (located under the `data/image_cropped_json` folder) to extract object detection details (`label` and `confidence`).
  - If an image’s confidence score (from its corresponding JSON file) does not fall within the specified range of `confLow` and `confHigh`, the image will be excluded from the response.
  - If a `label` is provided in the query, only images with that exact label in their JSON data will be included.
  
- **Cross-Platform Path Handling:**
  - The API now uses Node.js’s `path` module to ensure compatibility across different operating systems (Windows, Linux, macOS). This ensures that file paths are constructed correctly regardless of platform-specific path separators (`\` or `/`).

- **Missing JSON File:**
  - If a corresponding JSON file for an image is not found in the `data/image_cropped_json` folder, the image will be skipped in the response.

**Example Usage:**  

1. **Fetch all files in a folder (no filters):**
   ```
   GET /api/users/detect_images/browse?date=20241004&folderPath=Stoat_Original
   ```

2. **Fetch images with a specific label:**
   ```
   GET /api/users/detect_images/browse?date=20241004&folderPath=Stoat_Original&label=Stoat
   ```

3. **Fetch images with a confidence score between 0.7 and 0.9:**
   ```
   GET /api/users/detect_images/browse?date=20241004&folderPath=Stoat_Original&confLow=0.7&confHigh=0.9
   ```

4. **Fetch images with a specific label and with a confidence score between 0.7 and 0.9:**
   ```
   GET /api/users/detect_images/browse?date=20241004&folderPath=Stoat_Original&label=Stoat&confLow=0.7&confHigh=0.9
   ```

---

### Get All Uploaded Images under a Path (including subfolders)

**Endpoint:** `GET /api/users/images/select_all?path=<path>&label=<label>&confLow=<confLow>&confHigh=<confHigh>`

**Authentication Required:**  
Yes  

**Cookie Used:**  
Name: `token`  
Description: The HTTP-only cookie containing the JWT token used for authentication.  

**Query Parameters:**
- `path` (string, optional): The relative path within the date folder to view (e.g., `A/A1`). Defaults to the `data/image_uploaded/{userId}` folder.

**Response Body:**

**Success Response:**
```json
{
    "selectAllPaths": [
        "20241004\\Stoat_Original_Copy\\02200092.jpg",
        "20241004\\Stoat_Original_Copy\\02210619.jpg",
        "20241004\\Stoat_Original_Copy\\02210623.jpg",
        "20241004\\Stoat_Original_Copy\\A\\02170149.jpg",
        "20241004\\Stoat_Original_Copy\\A\\02170150.jpg",
        "20241004\\Stoat_Original_Copy\\B\\02210624.jpg",
        "20241004\\Stoat_Original_Copy\\B\\02210625.jpg"
    ]
}
```

**Error Response:**
```json
{
  "error": "Error message"
}
```

**Example Usage:**  
```
http://localhost:3000/api/users/images/select_all?path=20241004/Stoat_Original_Copy
```

---

### Get All Detected Images under a Path (including subfolders)

**Endpoint:** `GET /api/users/detect_images/select_all?path=<path>&label=<label>&confLow=<confLow>&confHigh=<confHigh>`

**Authentication Required:**  
Yes  

**Cookie Used:**  
Name: `token`  
Description: The HTTP-only cookie containing the JWT token used for authentication.  

**Query Parameters:**
- `path` (string, optional): The relative path within the date folder to view (e.g., `A/A1`). Defaults to the `data/image_marked/{userId}` folder.
- **New Parameter: `label` (string, optional):** Filter images based on the object detection label extracted from their corresponding JSON files. If no label is provided, all images are returned (subject to confidence filtering).
  - Possible value for `label`: `null`, `Bird`, `Cat`, `Dog`, `Hedgehog`, `Rabbit`, `Rat`, `Sheep`, `Stoat`, `Trap`, `Weka`. (Total 1 + 10 possibilities)  
  - Also, when `label` = `null`, it will return images with no detection result, the frontend should display this option as `None`.    
  - Moreover, when `label` is not provided, all images are returned (subject to confidence filtering), the frontend should display this option as `All`.  
- **New Parameter: `confLow` (number, optional):** Lower bound for the object detection confidence score. Only images with a confidence score greater than or equal to this value will be included. Default: `0`. Minimum: `0`. Maximum: `1`.  
- **New Parameter: `confHigh` (number, optional):** Upper bound for the object detection confidence score. Only images with a confidence score less than or equal to this value will be included. Default: `1`. Minimum: `0`. Maximum: `1`.

**Response Body:**

**Success Response (with filters applied):**
```json
{
    "selectAllPaths": [
        "20241004\\Stoat_Original_Copy\\02200092.jpg",
        "20241004\\Stoat_Original_Copy\\02210619.jpg",
        "20241004\\Stoat_Original_Copy\\02210623.jpg",
        "20241004\\Stoat_Original_Copy\\A\\02170149.jpg",
        "20241004\\Stoat_Original_Copy\\A\\02170150.jpg",
        "20241004\\Stoat_Original_Copy\\B\\02210624.jpg",
        "20241004\\Stoat_Original_Copy\\B\\02210625.jpg"
    ]
}
```

**Error Response:**
```json
{
  "error": "Error message"
}
```

**Example Usage:**  
```
http://localhost:3000/api/users/detect_images/select_all?path=20241004/Stoat_Original_Copy&label=Stoat&confLow=0.9&confHigh=0.95
```