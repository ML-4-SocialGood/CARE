### Delete ReID result with Date and Time

**Endpoint:** `DELETE /api/users/reid_images/delete?date={date}&time={time}`

**Description:** Deletes a specific ReId result by the current user using the date and time.

**Authentication Required:**  
Yes  

**Cookie Used:**  
Name: `token`  
Description: The HTTP-only cookie containing the JWT token used for authentication.  

**Query Parameters:**
- `date` (string): The date folder name in `YYYYMMDD` format (e.g., `20241007`).  
- `time` (string): The time JSON name in `HHMMSS` format (e.g., `165914`).  

**Response HTTP Code:**
- `200 OK` for successful deletion
- `401 Unauthorized` if token is missing or invalid
- `404 Not Found` if image does not exist
- `500 Internal Server Error` for other errors

**Response Body:**
```json
{
    "message": "ReID result (date = 20241007, time = 165914) deleted successfully."
}
```
or
```json
{
  "error": "Error message"
}
```

**Example Usage:**
```
GET /api/users/reid_images/delete?date=20241007&time=165914
```

---

### Rename ReID Group

**Endpoint:** `POST /api/users/reid_images/rename_group?date={date}&time={time}&old_group_id={old_group_id}&new_group_id={new_group_id}`

**Description:** Renames a specific group in the ReID results for the current user using the provided date, time, old group ID, and new group ID.

**Authentication Required:**  
Yes  

**Cookie Used:**  
Name: `token`  
Description: The HTTP-only cookie containing the JWT token used for authentication.  

**Query Parameters:**
- `date` (string): The date folder name in `YYYYMMDD` format (e.g., `20241007`).  
- `time` (string): The time JSON name in `HHMMSS` format (e.g., `165914`).  
- `old_group_id` (string): The ID of the group to be renamed.  
- `new_group_id` (string): The new ID to assign to the group.  

**Response HTTP Code:**
- `200 OK` for successful renaming
- `400 Bad Request` if any required query parameters are missing
- `403 Forbidden` if the path is invalid
- `404 Not Found` if the specified directory or old group ID does not exist
- `409 Conflict` if the new group ID already exists
- `500 Internal Server Error` for other errors

**Response Body:**
```json
{
    "message": "Successfully renamed from {old_group_id} to {new_group_id}."
}
```
or
```json
{
  "error": "Error message"
}
```

**Example Usage:**
```
POST /api/users/reid_images/rename?date=20241007&time=165953&old_group_id=ID-1&new_group_id=Kingsley
```