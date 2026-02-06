# API Testing Guide

Base URL: **http://localhost:5001** (or http://127.0.0.1:5001)

---

## How to Test

### Option 1: cURL (Terminal)
```bash
curl -X METHOD http://localhost:5001/ENDPOINT \
  -H "Content-Type: application/json" \
  -d '{"key":"value"}'
```

### Option 2: Postman / Insomnia
- Method, URL, Headers, Body (raw JSON)
- Import collection or manually create requests

### Option 3: Browser (GET only)
- Open `http://localhost:5001/health` in browser
- Or `http://localhost:5001/api/students` for list

### Option 4: VS Code REST Client / Thunder Client
- Extension: Thunder Client or REST Client
- Create `.http` file or use built-in tester

---

## Phase 3: Student Management

### 1. Register a student (POST)
```bash
curl -X POST http://localhost:5001/api/students/register \
  -H "Content-Type: application/json" \
  -d '{
    "enrollment": "101",
    "name": "Aditya Chawale",
    "email": "aditya@example.com",
    "password": "pass1234"
  }'
```
**Expected:** 201, JSON with `id`, `enrollment`, `name`, `email`, `imageCount`

**Errors:**
- 400: Missing fields / invalid enrollment (must be numeric) / password < 6 chars
- 409: Enrollment or email already registered

---

### 2. List all students (GET)
```bash
curl http://localhost:5001/api/students
```
**Query params (optional):** `?skip=0&limit=50`

**Expected:** 200, `{ "students": [...], "total": N, "skip": 0, "limit": 50 }`

---

### 3. Get student by enrollment (GET)
```bash
curl http://localhost:5001/api/students/101
```
**Expected:** 200, single student object  
**404:** Student not found

---

### 4. Delete student (DELETE)
```bash
curl -X DELETE http://localhost:5001/api/students/101
```
**Expected:** 200, `{ "message": "Student deleted" }`  
**404:** Student not found

---

## Phase 4: Face Capture & Training

### 5. Upload face image (POST)
**Prerequisite:** Student must exist (e.g. enrollment 101).

```bash
# Base64 image (example with minimal valid image - use real face image in practice)
# Get base64 from: https://www.base64-image.de/ or from browser canvas
curl -X POST http://localhost:5001/api/students/101/images \
  -H "Content-Type: application/json" \
  -d '{"image":"BASE64_STRING_HERE"}'
```

**Image format:** base64 string, optionally with data URL prefix `data:image/jpeg;base64,`

**Expected:** 201, `{ "message": "Image saved", "filename": "...", "sampleNum": 1, "cloudinaryUrl": null, "imageCount": 1 }`

**Errors:**
- 400: No image in body / no face or multiple faces detected
- 404: Student not found

**Tip:** For testing, use a real face photo. Convert to base64:
```bash
base64 -i face.jpg | tr -d '\n' > base64.txt
# Then use content of base64.txt in the JSON
```

---

### 6. Train model (POST)
```bash
curl -X POST http://localhost:5001/api/train
```
**Prerequisite:** At least one valid face image in `backend/TrainingImage/` (e.g. `Name.enrollment.1.jpg`).

**Expected:** 200, `{ "success": true, "message": "Model trained successfully", "studentCount": N, "imageCount": M }`

**Errors:**
- 400: No valid face images in TrainingImage folder
- 500: Haarcascade not found or training failed

---

## Cloudinary Setup (Optional)

1. Create account at https://cloudinary.com
2. Get: Cloud Name, API Key, API Secret from Dashboard
3. Add to `backend/.env`:
   ```
   CLOUDINARY_CLOUD_NAME=your_cloud_name
   CLOUDINARY_API_KEY=your_api_key
   CLOUDINARY_API_SECRET=your_api_secret
   ```
4. Restart backend — uploaded images will also be stored in Cloudinary; response will include `cloudinaryUrl`

---

## Phase 6: Auth

### 10. Login (POST)
```bash
curl -X POST http://localhost:5001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"aditya@test.com","password":"pass1234","role":"student"}'
```

**Body:** `email`, `password`, `role` (student | teacher | admin)

**Expected:** 200, `{ "token": "jwt...", "user": { id, email, role, name?, enrollment? } }`

**Default Admin:** `admin@attendance.com` / `admin123` (set in .env)

### 11. Create teacher (POST)
```bash
curl -X POST http://localhost:5001/api/teachers \
  -H "Content-Type: application/json" \
  -d '{"name":"John Teacher","email":"teacher@test.com","password":"pass1234"}'
```

### 12. List subjects (GET)
```bash
curl http://localhost:5001/api/subjects
```

### 13. Create subject (POST)
```bash
curl -X POST http://localhost:5001/api/subjects \
  -H "Content-Type: application/json" \
  -d '{"name":"Math"}'
```


---

## Phase 5: Attendance

### 7. Auto attendance (face recognition) (POST)
**Prerequisite:** Model trained (`POST /api/train`), student with face images exists.

```bash
curl -X POST http://localhost:5001/api/attendance/auto \
  -H "Content-Type: application/json" \
  -d '{"image":"BASE64_FACE_IMAGE","subject":"Math"}'
```

**Expected:** 201, `{ id, enrollment, name, subject, date, time, type: "auto" }`

**Errors:** 400 — no face, multiple faces, face not recognized, model not found

---

### 8. Manual attendance (POST)
```bash
curl -X POST http://localhost:5001/api/attendance/manual \
  -H "Content-Type: application/json" \
  -d '{"enrollment":"101","name":"Aditya","subject":"Math"}'
```

**Optional body:** `date` (YYYY-MM-DD), `time` (HH:MM:SS) — defaults to now

**Expected:** 201, `{ id, enrollment, name, subject, date, time, type: "manual" }`

---

### 9. List attendance (GET)
```bash
curl "http://localhost:5001/api/attendance"
curl "http://localhost:5001/api/attendance?subject=Math&date=2025-02-06"
curl "http://localhost:5001/api/attendance?skip=0&limit=20"
```

**Expected:** 200, `{ attendance: [...], total, skip, limit }`

---

## Quick Test Flow

1. `GET /health` — check API + DB
2. `POST /api/students/register` — create student 101
3. `GET /api/students` — list students
4. `GET /api/students/101` — get student 101
5. `POST /api/students/101/images` — upload face image (use real base64)
6. `POST /api/train` — train model
7. `POST /api/attendance/auto` — recognize face + record (image + subject)
8. `POST /api/attendance/manual` — manual entry (enrollment, name, subject)
9. `GET /api/attendance?subject=Math&date=2025-02-06` — list attendance
10. `DELETE /api/students/101` — delete (optional)
