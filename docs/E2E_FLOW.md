# End-to-End Flow: Register → Upload → Train → Mark Attendance → View Report

This document describes the complete flow for using the Attendance Management System.

## Prerequisites

- Backend running at `http://localhost:5001`
- Frontend running at `http://localhost:3000`
- MongoDB connected (see SETUP.md)

---

## Step 1: Student Registration

1. Go to [http://localhost:3000/register](http://localhost:3000/register)
2. Fill in:
   - **Enrollment** (e.g. `101`)
   - **Name** (e.g. `John Doe`)
   - **Email** (e.g. `john@example.com`)
   - **Password** (min 6 characters)
3. Click **Register**
4. You should be redirected to the login page with a success toast

---

## Step 2: Add Subjects (Admin)

Before teachers can mark attendance, subjects must exist.

1. Login as **Admin**:
   - Email: `admin@attendance.com` (or from `.env`)
   - Password: `admin123` (or from `.env`)
2. Go to **Subjects** tab
3. Add subjects (e.g. `Math`, `Physics`)
4. Click **Add Subject**

---

## Step 3: Student Face Upload

1. Login as the **Student** you registered
2. Go to **Student Dashboard**
3. In **Add face images**, capture at least **15** clear photos of your face (use the guided prompts for variety)
4. Use good lighting and follow the on-screen prompts
5. Each upload shows a success toast; status updates with `Face images: X/15`

---

## Step 4: Train the Model (Admin)

1. Login as **Admin**
2. Go to **Train Model** tab
3. Ensure at least one student has face images (≥15)
4. Click **Train Model**
5. Wait for success toast: `Model trained. X images, Y students.`

---

## Step 5: Mark Attendance

### Option A: Automatic (Face Recognition)

1. Login as **Teacher**
2. Go to **Auto (Camera)** tab
3. Select a **Subject**
4. Click **Capture** and look at the camera
5. If recognized, attendance is recorded; success toast appears

### Option B: Manual Entry

1. Login as **Teacher**
2. Go to **Manual Entry** tab
3. Select **Subject**
4. Enter **Enrollment** and **Name**
5. Click **Record**
6. Success toast confirms attendance recorded

---

## Step 6: View Attendance Report

1. Login as **Admin** (or **Teacher**)
2. **Admin**: Go to **Attendance** tab
3. **Teacher**: Go to **View Attendance** tab
4. Filter by **Subject** and/or **Date**
5. Click **Refresh** (Admin) or filters auto-load (Teacher)
6. Table shows: Enrollment, Name, Subject, Date, Time

---

## Flow Summary

```
Register (Student) → Add Subjects (Admin) → Upload Face Images (Student)
                                              ↓
                              Train Model (Admin)
                                              ↓
                    Mark Attendance (Teacher: Auto or Manual)
                                              ↓
                    View Report (Admin or Teacher)
```

---

## Troubleshooting

| Issue | Solution |
|-------|----------|
| Face not detected | Ensure good lighting, look at camera, face fully visible |
| Face not recognized | Upload more images (15+), retrain model |
| Training fails | At least one student must have ≥15 face images |
| API errors | Check backend logs, ensure MongoDB and backend are running |
