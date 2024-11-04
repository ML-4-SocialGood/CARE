# API Document by Kingsley Leung, 07/08/2024
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
Due to GitHub's limit, you should manually copy the `best_50.pt` to `<backend_project_directory>/ai_server`.  
Make sure you have Anaconda installed.  
Run these command under Anaconda prompt:  
`cd <backend_project_directory>/backend/ai_server`  
`conda env create -f environment.yml`  
`conda activate care_ai_server`  
`python app.py`  
The AI server will be run at http://localhost:5000.  
---

### User Registration

**Endpoint:** `POST /api/auth/register`

**Description:** Registers a new user. The user cannot log in until approved by a user with admin permission.

**Request Body:**
```json
{
  "username": "user",
  "email": "user@user.com",
  "password": "pa55word"
}
```

**Response HTTP Code:**
- `201 Created` for successful registration
- `400 Bad Request` if username or email is already in use
- `500 Internal Server Error` for other errors

**Response Body:**
```json
{
  "message": "User registered successfully. Awaiting admin approval."
}
```
or
```json
{
  "error": "Username or email already in use"
}
```
or
```json
{
  "error": "An error occurred during registration"
}
```

---

### User Login

**Endpoint:** `POST /api/auth/login`

**Description:** Logs in a user.

**Request Body:**
```json
{
  "username": "admin",
  "password": "123456"
}
```

**Response HTTP Code:**
- `200 OK` for successful login
- `403 Forbidden` if user is not authorized by admin
- `404 Not Found` if user does not exist
- `401 Unauthorized` for invalid credentials
- `500 Internal Server Error` for other errors

**Response Body:**
```json
{
  "id": 1,
  "isAdmin": true
}
```
or
```json
{
  "error": "User not authorized by admin"
}
```
or
```json
{
  "error": "User not found"
}
```
or
```json
{
  "error": "Invalid credentials"
}
```
or
```json
{
  "error": "An error occurred during login"
}
```

---

### User Logout

**Endpoint:** `POST /api/auth/logout`

**Description:** Logs out a user. (Handled on the client-side by discarding the token)

**Authentication Required:**  
Yes  

**Cookie Used:**  
Name: `token`  
Description: The HTTP-only cookie containing the JWT token used for authentication.  

**Response HTTP Code:**
- `200 OK` for successful logout

**Response Body:**
```json
{
  "message": "User logged out successfully"
}
```

---

### User Check Auth

**Endpoint:** `GET /api/auth/checkauth`

**Description:** Check if the token from cookies is valid. 

**Authentication Required:**  
Yes  

**Cookie Used:**  
Name: `token`  
Description: The HTTP-only cookie containing the JWT token used for authentication.  

**Response HTTP Code:**
- `200 OK` for valid credentials    
- `401 Unauthorized` for invalid credentials  

**Response Body:**
```json
{ 
  "authenticated": true, 
  "userId": 1, 
  "isAdmin": true
}
```

---



---

### Admin Get All Users

**Endpoint:** `GET /api/admin/users`

**Description:** Retrieves all users, optionally filtered by authorization status.

**Authentication Required:**  
Yes  

**Cookie Used:**  
Name: `token`  
Description: The HTTP-only cookie containing the JWT token used for authentication.  

**Query Parameters:**
- `isAuth` (optional): `true`, `false`, or `all`

**Response HTTP Code:**
- `200 OK` for successful retrieval
- `401 Unauthorized` if token is missing or invalid
- `500 Internal Server Error` for other errors

**Response Body:**
```json
[
  {
    "id": 1,
    "username": "admin",
    "email": "admin@admin.com",
    "password": "string",
    "isAdmin": true,
    "isAuth": true,
    "createdAt": "2024-08-10T06:03:26.122Z",
    "updatedAt": "2024-08-10T06:03:26.122Z"
  }
]
```
or
```json
{
  "error": "An error occurred while fetching users"
}
```

---

### Admin Get User Profile

**Endpoint:** `GET /api/admin/users/:userId`

**Description:** Retrieves a user's profile by user ID.

**Authentication Required:**  
Yes  

**Cookie Used:**  
Name: `token`  
Description: The HTTP-only cookie containing the JWT token used for authentication.  

**Response HTTP Code:**
- `200 OK` for successful retrieval
- `401 Unauthorized` if token is missing or invalid
- `404 Not Found` if user does not exist
- `500 Internal Server Error` for other errors

**Response Body:**
```json
{
  "id": 1,
  "username": "admin",
  "email": "admin@admin.com",
  "password": "string",
  "isAdmin": true,
  "isAuth": true,
  "createdAt": "2024-08-10T06:03:26.122Z",
  "updatedAt": "2024-08-10T06:03:26.122Z"
}
```
or
```json
{
  "error": "User not found"
}
```
or
```json
{
  "error": "An error occurred while fetching the user profile"
}
```

---

### Admin Update User Profile

**Endpoint:** `PUT /api/admin/users/:userId`

**Description:** Updates a user's profile by user ID, including authorization status and email.

**Authentication Required:**  
Yes  

**Cookie Used:**  
Name: `token`  
Description: The HTTP-only cookie containing the JWT token used for authentication.  

**Request Body:**
```json
{
  "email": "admin@admin.com",
  "password": "123456",
  "isAdmin": true,
  "isAuth": "boolean"
}
```

**Response HTTP Code:**
- `200 OK` for successful update
- `401 Unauthorized` if token is missing or invalid
- `404 Not Found` if user does not exist
- `400 Bad Request` if email is already in use
- `500 Internal Server Error` for other errors

**Response Body:**
```json
{
  "message": "User profile updated successfully"
}
```
or
```json
{
  "error": "User not found"
}
```
or
```json
{
  "error": "Email already in use"
}
```
or
```json
{
  "error": "An error occurred while updating the user profile"
}
```

---

### Admin Get All Uploaded Images

**Endpoint:** `GET /api/admin/images`

**Description:** Retrieves all uploaded images by all users.

**Authentication Required:**  
Yes  

**Cookie Used:**  
Name: `token`  
Description: The HTTP-only cookie containing the JWT token used for authentication.  

**Response HTTP Code:**
- `200 OK` for successful retrieval
- `401 Unauthorized` if token is missing or invalid
- `500 Internal Server Error` for other errors

**Response Body:**
```json
[
  {
    "id": "number",
    "filename": "string",
    "userId": "number",
    "createdAt": "string",
    "updatedAt": "string"
  }
]
```
or
```json
{
  "error": "An error occurred while fetching images"
}
```

---

### Admin Get Uploaded Images by User ID

**Endpoint:** `GET /api/admin/users/images/:userId`

**Description:** Retrieves all uploaded images by a specific user.

**Authentication Required:**  
Yes  

**Cookie Used:**  
Name: `token`  
Description: The HTTP-only cookie containing the JWT token used for authentication.  

**Response HTTP Code:**
- `200 OK` for successful retrieval
- `401 Unauthorized` if token is missing or invalid
- `404 Not Found` if user does not exist or has no images
- `500 Internal Server Error` for other errors

**Response Body:**
```json
[
  {
    "id": "number",
    "filename": "string",
    "userId": "number",
    "createdAt": "string",
    "updatedAt": "string"
  }
]
```
or
```json
{
  "error": "User not found or no images available"
}
```
or
```json
{
  "error": "An error occurred while fetching images"
}
```

---

### Admin Delete Uploaded Image by Image ID

**Endpoint:** `DELETE /api/admin/images/:imageId`

**Description:** Deletes an uploaded image by image ID.

**Authentication Required:**  
Yes  

**Cookie Used:**  
Name: `token`  
Description: The HTTP-only cookie containing the JWT token used for authentication.  

**Response HTTP Code:**
- `200 OK` for successful deletion
- `401 Unauthorized` if token is missing or invalid
- `404 Not Found` if image does not exist
- `500 Internal Server Error` for other errors

**Response Body:**
```json
{
  "message": "Image deleted successfully"
}
```
or
```json
{
  "error": "Image not found"
}
```
or
```json
{
  "error": "An error occurred while deleting the image"
}
```

---

### Get Current User Profile

**Endpoint:**

`GET /api/users/profile`

**Description:** Retrieves the current user's profile.

**Authentication Required:**  
Yes  

**Cookie Used:**  
Name: `token`  
Description: The HTTP-only cookie containing the JWT token used for authentication.  

**Response HTTP Code:**
- `200 OK` for successful retrieval
- `401 Unauthorized` if token is missing or invalid
- `500 Internal Server Error` for other errors

**Response Body:**
```json
{
  "id": "number",
  "username": "string",
  "email": "string",
  "isAuth": "boolean",
  "createdAt": "string",
  "updatedAt": "string"
}
```
or
```json
{
  "error": "An error occurred while fetching the user profile"
}
```

---

### Update Current User Profile

**Endpoint:** `PUT /api/users/profile`

**Description:** Updates the current user's profile. Only email can be changed.

**Authentication Required:**  
Yes  

**Cookie Used:**  
Name: `token`  
Description: The HTTP-only cookie containing the JWT token used for authentication.  

**Request Body:**
```json
{
  "email": "string",
  "password": "123456"
}
```

**Response HTTP Code:**
- `200 OK` for successful update
- `400 Bad Request` if email is already in use
- `401 Unauthorized` if token is missing or invalid
- `500 Internal Server Error` for other errors

**Response Body:**
```json
{
  "message": "User profile updated successfully"
}
```
or
```json
{
  "error": "Email already in use"
}
```
or
```json
{
  "error": "An error occurred while updating the user profile"
}
```

---

### Browse Current User Uploaded Images

**Endpoint:** `GET /api/users/images/browse`

**Description:** Fetches the contents of a specified directory within a date-stamped folder. This allows the current user to browse their uploaded images and folders.

**Authentication Required:**  
Yes  

**Cookie Used:**  
Name: `token`  
Description: The HTTP-only cookie containing the JWT token used for authentication.  

**Query Parameters:**
- `date` (string, optional): The date folder name in `YYYYMMDD` format (e.g., `20200612`).  
- `folderPath` (string, optional): The relative path within the date folder to view (e.g., `A/A1`). Defaults to the `data/image_uploaded/{userId}/{date}` folder. This path should not allow directory traversal outside the date folder.
- If `date` is not provided, it will return contents from the `data/image_uploaded/{userId}` folder.  

**Response HTTP Code:**
- `200 OK` for successful retrieval
- `400 Bad Request` if path is a file, not a directory
- `401 Unauthorized` if token is missing or invalid
- `403 Forbidden` if the folder parameter attempts directory traversal (e.g., ../)  
- `404 Not Found` if the specified directory or file does not exist  
- `500 Internal Server Error` for other errors

**Response Body:**
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
or
```json
{
  "error": "Error message"
}
```

---

### View Current User Uploaded Image

**Endpoint:** `GET /api/users/images/view`

**Description:** View the image of a specified directory within a date-stamped folder. This allows the current user to view their uploaded images and folders.

**Authentication Required:**  
Yes  

**Cookie Used:**  
Name: `token`  
Description: The HTTP-only cookie containing the JWT token used for authentication.  

**Query Parameters:**
- `date` (string, required): The date folder name in `YYYYMMDD` format (e.g., `20200612`).  
- `imagePath` (string, required): The relative path within the date folder to view (e.g., `A/1501.jpg`). Defaults to the `data/image_uploaded/{userId}/{date}` folder. This path should not allow directory traversal outside the date folder.

**Response HTTP Code:**
- `200 OK` for successful retrieval
- `400 Bad Request` if missing date or imagePath query parameters/ path is a directory, not an image/ requested file is not an image.  
- `401 Unauthorized` if token is missing or invalid
- `403 Forbidden` if the folder parameter attempts directory traversal (e.g., ../)  
- `404 Not Found` if the specified image does not exist  
- `500 Internal Server Error` for other errors

**Response Body:**
```
Content-Type: image/jpeg
```
or
```json
{
  "error": "Error message"
}
```

---

### Upload Image for Current User

**Endpoint:** `POST /api/users/images/upload`

**Description:** Upload a zip file containing a folder structure of images. The server unzips the folder, filters out non-.jpg files, and stores the remaining files under `data/image_uploaded/{userId}/{date}`.  

**Authentication Required:**  
Yes  

**Cookie Used:**  
Name: `token`  
Description: The HTTP-only cookie containing the JWT token used for authentication.  

**Request Headers**  
- `Content-Type: multipart/form-data`  

**Request Body:**
- `folderZip`: ZIP File

**Response HTTP Code:**
- `201 Created` for successful upload
- `400 Bad Request` if file is not a ZIP or if no file is provided
- `401 Unauthorized` if token is missing or invalid
- `500 Internal Server Error` for other errors

**Response Body:**
```json
{
  "message": "Folder upload successfully, non-jpg files will be removed."
}
```
or
```json
{
  "error": "The uploaded file must be a zip file."
}
```
or
```json
{
  "error": "No file was uploaded."
}
```
or
```json
{
  "error": "An error occurred while uploading the image"
}
```

---

### Delete Current User Uploaded Image

#### NOTICE: This endpoint is deprecated. Do not use it.  

**Endpoint:** `DELETE /api/users/images/:imageId`

**Description:** Deletes a specific uploaded image by the current user using the image ID.

**Authentication Required:**  
Yes  

**Cookie Used:**  
Name: `token`  
Description: The HTTP-only cookie containing the JWT token used for authentication.  

**Response HTTP Code:**
- `200 OK` for successful deletion
- `401 Unauthorized` if token is missing or invalid
- `404 Not Found` if image does not exist
- `500 Internal Server Error` for other errors

**Response Body:**
```json
{
  "message": "Image deleted successfully"
}
```
or
```json
{
  "error": "Image not found"
}
```
or
```json
{
  "error": "An error occurred while deleting the image"
}
```

---

### Run Detection for Selected Images

#### NOTICE: This endpoint is under construction.  

**Endpoint:** `POST /api/users/images/detect`

**Description:** Copy images from specified paths to the temp folder, then pass them to the detection model.  
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
PROCESS: 0/3
<br/>
PROCESS: 1/3
<br/>
PROCESS: 2/3
<br/>
PROCESS: 3/3
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

### Browse Current User Detected Images

**Endpoint:** `GET /api/users/detect_images/browse`

**Description:** Fetches the contents of a specified directory within a date-stamped folder. This allows the current user to browse their detected images and folders.

**Authentication Required:**  
Yes  

**Cookie Used:**  
Name: `token`  
Description: The HTTP-only cookie containing the JWT token used for authentication.  

**Query Parameters:**
- `date` (string, optional): The date folder name in `YYYYMMDD` format (e.g., `20200612`).  
- `folderPath` (string, optional): The relative path within the date folder to view (e.g., `A/A1`). Defaults to the `data/image_marked/{userId}/{date}` folder. This path should not allow directory traversal outside the date folder.
- If `date` is not provided, it will return contents from the `data/image_marked/{userId}` folder.  

**Response HTTP Code:**
- `200 OK` for successful retrieval
- `400 Bad Request` if path is a file, not a directory
- `401 Unauthorized` if token is missing or invalid
- `403 Forbidden` if the folder parameter attempts directory traversal (e.g., ../)  
- `404 Not Found` if the specified directory or file does not exist  
- `500 Internal Server Error` for other errors

**Response Body:**
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
or
```json
{
  "error": "Error message"
}
```

---

### View Current User Detected Image

**Endpoint:** `GET /api/users/detect_images/view`

**Description:** View the image of a specified directory within a date-stamped folder. This allows the current user to view their detected images and folders.

**Authentication Required:**  
Yes  

**Cookie Used:**  
Name: `token`  
Description: The HTTP-only cookie containing the JWT token used for authentication.  

**Query Parameters:**
- `date` (string, required): The date folder name in `YYYYMMDD` format (e.g., `20200612`).  
- `imagePath` (string, required): The relative path within the date folder to view (e.g., `A/1501.jpg`). Defaults to the `data/image_marked/{userId}/{date}` folder. This path should not allow directory traversal outside the date folder.

**Response HTTP Code:**
- `200 OK` for successful retrieval
- `400 Bad Request` if missing date or imagePath query parameters/ path is a directory, not an image/ requested file is not an image.  
- `401 Unauthorized` if token is missing or invalid
- `403 Forbidden` if the folder parameter attempts directory traversal (e.g., ../)  
- `404 Not Found` if the specified image does not exist  
- `500 Internal Server Error` for other errors

**Response Body:**
```
Content-Type: image/jpeg
```
or
```json
{
  "error": "Error message"
}
```

---

### Browse Current User ReID Images

**Endpoint:** `GET /api/users/reid_images/browse?date=20240927&time=215329&group_id=ID-5`

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

**Response Body:**
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
or
```json
{
  "error": "Error message"
}
```