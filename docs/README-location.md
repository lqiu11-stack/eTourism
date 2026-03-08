# README (Location) – Experience data and APIs

This document explains the **simulated experience data** (stored in a JSON file) and the **two APIs** that return experience and location information for the eTourism backend.

---

## 1. Simulated data

### 1.1 Where the data is stored

- **Path**: `eTourism/backend/data/experiences.json`
- **Purpose**: This JSON file acts like a small database of “travel experiences”. The APIs read from it so you can test lists and locations without a real database.

### 1.2 Fields for each experience

Each experience is one JSON object with these fields:

| Field | Type | Meaning |
|-------|------|---------|
| id | number | Unique ID for the experience |
| title | string | Title of the experience |
| description | string | Short description |
| location_name | string | Place name or address |
| latitude | number | Latitude (WGS84) |
| longitude | number | Longitude (WGS84) |

### 1.3 Example data

The file comes with three real places:

1. **Royal Air Force Museum** (London) – coordinates: 51.5896, -0.2386  
2. **IWM Duxford** (Cambridgeshire) – coordinates: 52.0908, 0.1317  
3. **Queen's Road** (Bristol) – coordinates: 51.4545, -2.6242  

To add or change experiences, edit `data/experiences.json` and keep the same fields: `id`, `title`, `description`, `location_name`, `latitude`, `longitude`.

---

## 2. The two APIs

### 2.1 API 1: Get all experiences

- **Request**: `GET /api/experiences`
- **What it does**: Returns **all** experiences from the JSON file (no filtering or paging).
- **Success**: HTTP 200. The body is an array; each item has all the fields above, including `latitude` and `longitude`.
- **Errors**: If the file cannot be read or parsed, you get HTTP 500 and an error message.

**Example**  
Request: `GET http://localhost:5000/api/experiences`  
Response: `[{ "id": 1, "title": "Royal Air Force Museum", ... }, ...]`

### 2.2 API 2: Get one experience’s location by ID

- **Request**: `GET /api/experiences/:id/location`
- **Parameter**: `id` in the URL is the experience’s ID (integer).
- **What it does**: Finds the experience with that `id` and returns **only the fields needed for showing a location** (useful for a map or a detail page).
- **Success**: HTTP 200. The body contains only:
  - `id`
  - `title`
  - `location_name`
  - `latitude`
  - `longitude`
- **Errors**:
  - Invalid or non-numeric `id`: HTTP 400.
  - No experience with that `id`: **HTTP 404**, body: `{ "error": "Experience not found" }`.
  - Server error (e.g. file read failed): HTTP 500.

**Example**  
Request: `GET http://localhost:5000/api/experiences/1/location`  
Response: `{ "id": 1, "title": "Royal Air Force Museum", "location_name": "Royal Air Force Museum London, ...", "latitude": 51.5896, "longitude": -0.2386 }`

Request: `GET http://localhost:5000/api/experiences/99/location` (ID does not exist)  
Response: 404, `{ "error": "Experience not found" }`

---

## 3. Summary

| Item | Description |
|------|-------------|
| Data file | `eTourism/backend/data/experiences.json` – stores id, title, description, location name, and coordinates |
| GET /api/experiences | Returns all experiences; use for list or browsing |
| GET /api/experiences/:id/location | Returns one experience’s location; returns 404 if the id does not exist |

These APIs read only from the JSON file and do not use PostgreSQL or any other database.

---

**Note:** This setup uses **simulated data only**. Once the full database is in place, the implementation should be updated to read from and connect to the database instead of the JSON file.
