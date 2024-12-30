# ReID API Document by Kingsley Leung, 29/09/2024
---
Notice: The backend is still under construction, and the document needs to be thoroughly checked.  
If you notice issues, please let me know.  
You should not receive HTML 500. If so, please let me know.

---
## Running the backend
Run these command:  
`npm install`  
`npm run dev`  
The server will be run at http://localhost:3000.  
I suggested you use Postman to check these endpoints.

## Running the AI server
Due to GitHub's limit, you should manually copy the `best_50.pt` and `CARE_Traced.pt` to `<backend_project_directory>/ai_server`.  
Make sure you have Anaconda installed.  
Run these command under Anaconda prompt:  
`cd <backend_project_directory>/backend/ai_server`  
`conda env create -f environment_universal.yml`  
`conda activate care_ai_server_universal`  
`python app.py`  
The AI server will be run at http://127.0.0.1:5000.  

---

### Run ReID for Selected Images

#### NOTICE: This endpoint is under construction.  

**Endpoint:** `POST /api/users/detect_images/reid`

**Description:** Copy images from specified paths to the temp folder, then pass them to the ReID model.  
If one of the image path is not exist, the console will pop a warning.  

**Authentication Required:**  
Yes

**Cookie Used:**  
Name: `token`  
Description: The HTTP-only cookie containing the JWT token used for authentication.

**Request Body:**
```json
{
  "selectedPaths": [
    "20240902/Stoat_Original/A/02170150.jpg",
    "20240902/Stoat_Original/02210623.jpg",
    "20240902/Stoat_Original/02210617.jpg"
  ]
}
```

**Response HTTP Code:**
- `200 OK` for successful retrieval
- `400 Bad Request` if the request body is invalid
- `401 Unauthorized` if token is missing or invalid
- `403 Forbidden` if the folder parameter attempts directory traversal (e.g., ../)
- `500 Internal Server Error` for other errors

**Response Body:**
Content-Type: text/html  
Streaming output  
```
STATUS: BEGIN
<br/>
STATUS: PROCESSING
<br/>
STATUS: DONE
<br/>
```
or
```json
{
  "error": "Error message"
}
```

---

### Browse Current User ReID Images

**Endpoint:** `GET /api/users/reid_images/browse?date=<date>&time=<time>&group_id=<group_id>`  

**Description:** Fetches the contents of a specified directory within a date-stamped folder. This allows the current user to browse their ReIDed images and folders.  

**Authentication Required:**  
Yes  

**Cookie Used:**  
Name: `token`  
Description: The HTTP-only cookie containing the JWT token used for authentication.  

**Query Parameters:**  
- `date` (string, optional): The date folder name in `YYYYMMDD` format (e.g., `20200612`).  
- `time` (string, optional): The time JSON name in `HHMMSS` format (e.g., `215329`).  
- `group_id` (string, optional): The ReID group ID in `ID-*` format (e.g., `ID-5`).  
- If `date` is not provided, it will return contents from the `data/image_reid_output/{userId}` folder.  

**Response HTTP Code:**  
- `200 OK` for successful retrieval
- `400 Bad Request` if path is a file, not a directory
- `401 Unauthorized` if token is missing or invalid
- `403 Forbidden` if the folder parameter attempts directory traversal (e.g., ../)  
- `404 Not Found` if the specified directory or file does not exist  
- `500 Internal Server Error` for other errors

**Utilise Body Messages:**  
NOTICE from Kingsley: Checking these could benefit you when using this endpoint.  
You should use "date", "time", "group_id" as the path.  
To access the "folder", you can use the same endpoint but with the provided Query Parameters ("date", "time", "group_id").  
To view a specific image, you should use "realDate" and "realPath" and apply them on this endpoints:  
`GET /api/users/detect_images/view?date=<realDate>&imagePath=<realPath>`  

**Response Body:**  
No Query Parameters:  
```json
{
    "files": [
        {
            "name": "20240927",
            "isDirectory": true,
            "path": "20240927",
            "date": "20240927",
            "time": null,
            "group_id": null,
            "realDate": null,
            "realPath": null
        }
    ]
}
```
or  
Only `date` Query Parameter:  
```json
{
    "files": [
        {
            "name": "202002",
            "isDirectory": false,
            "path": "20240927\\202002",
            "date": "20240927",
            "time": "202002",
            "group_id": null,
            "realDate": null,
            "realPath": null
        },
        {
            "name": "215329",
            "isDirectory": false,
            "path": "20240927\\215329",
            "date": "20240927",
            "time": "215329",
            "group_id": null,
            "realDate": null,
            "realPath": null
        }
    ]
}
```
or
Only `date`, `time` Query Parameters:  
```json
{
    "files": [
        {
            "name": "ID-0",
            "isDirectory": true,
            "path": "20240927\\215329\\ID-0",
            "date": "20240927",
            "time": "215329",
            "group_id": "ID-0",
            "realDate": null,
            "realPath": null
        },
        {
            "name": "ID-1",
            "isDirectory": true,
            "path": "20240927\\215329\\ID-1",
            "date": "20240927",
            "time": "215329",
            "group_id": "ID-1",
            "realDate": null,
            "realPath": null
        },
        {
            "name": "ID-2",
            "isDirectory": true,
            "path": "20240927\\215329\\ID-2",
            "date": "20240927",
            "time": "215329",
            "group_id": "ID-2",
            "realDate": null,
            "realPath": null
        },
        {
            "name": "ID-3",
            "isDirectory": true,
            "path": "20240927\\215329\\ID-3",
            "date": "20240927",
            "time": "215329",
            "group_id": "ID-3",
            "realDate": null,
            "realPath": null
        },
        {
            "name": "ID-4",
            "isDirectory": true,
            "path": "20240927\\215329\\ID-4",
            "date": "20240927",
            "time": "215329",
            "group_id": "ID-4",
            "realDate": null,
            "realPath": null
        },
        {
            "name": "ID-5",
            "isDirectory": true,
            "path": "20240927\\215329\\ID-5",
            "date": "20240927",
            "time": "215329",
            "group_id": "ID-5",
            "realDate": null,
            "realPath": null
        }
    ]
}
```
or  
With all `date`, `time`, `group_id` Query Parameters:  
```json
{
    "files": [
        {
            "name": "02170149.jpg",
            "isDirectory": false,
            "path": "20240927\\215329\\ID-5\\02170149.jpg",
            "date": "20240927",
            "time": "215329",
            "group_id": "ID-5",
            "realDate": "20240923",
            "realPath": "Stoat_Original_Copy\\A\\02170149.jpg"
        },
        {
            "name": "02170150.jpg",
            "isDirectory": false,
            "path": "20240927\\215329\\ID-5\\02170150.jpg",
            "date": "20240927",
            "time": "215329",
            "group_id": "ID-5",
            "realDate": "20240923",
            "realPath": "Stoat_Original_Copy\\A\\02170150.jpg"
        },
        {
            "name": "02170151.jpg",
            "isDirectory": false,
            "path": "20240927\\215329\\ID-5\\02170151.jpg",
            "date": "20240927",
            "time": "215329",
            "group_id": "ID-5",
            "realDate": "20240923",
            "realPath": "Stoat_Original_Copy\\A\\02170151.jpg"
        }
    ]
}
```
or  
Error:  
```json
{
  "error": "Error message"
}
```