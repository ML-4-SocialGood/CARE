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

### Admin Get All Users

**Endpoint:** `GET /api/admin/users?isAuth=all`

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