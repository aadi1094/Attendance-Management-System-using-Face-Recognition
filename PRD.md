# Product Requirements Document (PRD)

## Attendance Management System using Face Recognition

**Version:** 2.0  
**Tech Stack:** Flask (Python) | Next.js (TypeScript) | MongoDB | Tailwind CSS

---

## 1. Project Overview

Rebuild the Attendance Management System from scratch with a modern web stack, **role-based access** (Student, Teacher, Admin), and self-service student registration. The existing `main_Run.py` (Tkinter desktop app) and project folders serve as reference only. All new code lives in `backend/` and `frontend/`.

### Reference Data Flow (from main_Run.py)
- **StudentDetails.csv** → Enrollment, Name, Date, Time (registration log)
- **TrainingImage/** → Face images: `Name.enrollment.sampleNum.jpg` (e.g. `Aditya Chawale.1.1.jpg`)
- **TrainingImageLabel/Trainner.yml** → OpenCV LBPH trained model (uses enrollment as ID)
- **Attendance/*.csv** → Per-subject attendance (Enrollment, Name, Date, Time)

---

## 2. User Roles & Flows

### 2.1 Student
| Action | Flow | Acceptance Criteria |
|--------|------|---------------------|
| **Register** | Visit `/register` → Enter enrollment, name, email, password → Submit | Student created in MongoDB, can login |
| **Login** | Visit `/login` → Choose "Student" → Enter email + password | Redirect to `/student/dashboard` |
| **Upload face** | Dashboard → "Add face images" → Webcam captures 10+ images → Upload to backend | Images saved to disk as `Name.enrollment.N.jpg` |
| **Train status** | Dashboard shows: registered ✓, images uploaded ✓, model trained ✓ | Clear status for each step |

### 2.2 Teacher
| Action | Flow | Acceptance Criteria |
|--------|------|---------------------|
| **Login** | Visit `/login` → Choose "Teacher" → Enter email + password | Redirect to `/teacher/dashboard` |
| **View assigned subjects** | Dashboard lists subjects assigned to this teacher | Only their subjects shown |
| **View present students** | Select subject + date → See attendance list | Filter by subject, date |
| **Manual attendance** | Subject + Enrollment + Name → Submit | Record saved to MongoDB |
| **Fill auto attendance** | Select subject → Start webcam → Recognizes faces → Mark present | Same as reference `subjectchoose()` |

### 2.3 Admin
| Action | Flow | Acceptance Criteria |
|--------|------|---------------------|
| **Login** | Visit `/login` → Choose "Admin" → Enter credentials | Redirect to `/admin/dashboard` |
| **View all students** | Dashboard → Students list | Full CRUD, export CSV |
| **View all attendance** | Filter by subject, date, student | Full report |
| **Manage teachers** | Add teacher, assign subjects | Teacher can login and see assigned subjects |
| **Trigger model train** | "Train model" button | Retrains LBPH on all TrainingImage, saves Trainner.yml |
| **Manage subjects** | Add/remove subjects | Used in dropdowns everywhere |

---

## 3. Data Models (MongoDB)

### Student
- `enrollment` (str, unique), `name`, `email` (unique), `passwordHash`, `imageCount`, `createdAt`, `updatedAt`

### Teacher
- `name`, `email` (unique), `passwordHash`, `assignedSubjectIds` (array of ObjectIds), `createdAt`, `updatedAt`

### Subject
- `name` (unique), `createdAt`

### Attendance
- `enrollment`, `name`, `subject`, `date`, `time`, `type` (auto|manual), `createdAt`

### Admin
- Stored in env or separate collection; single/multiple admins configurable.

---

## 4. API Endpoints (Summary)

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/students/register` | Public | Student self-registration |
| GET | `/api/students` | Admin/Teacher | List students |
| GET | `/api/students/:enrollment` | Admin/Teacher/Student(self) | Get one student |
| DELETE | `/api/students/:enrollment` | Admin | Delete student |
| POST | `/api/students/:enrollment/images` | Student(self) | Upload face image |
| POST | `/api/train` | Admin | Train LBPH model |
| POST | `/api/attendance/auto` | Teacher | Recognize face + record |
| POST | `/api/attendance/manual` | Teacher | Manual attendance entry |
| GET | `/api/attendance` | Admin/Teacher | List attendance (filterable) |
| POST | `/api/auth/login` | Public | Login (student/teacher/admin) |

---

## 5. Implementation Phases (Detailed)

### Phase 1: Foundation — Complete
- [x] Project structure, Flask, Next.js, Tailwind
- [x] Health check, CORS, ports

### Phase 2: Database & Models — Complete
- [x] MongoDB connection, Student, Attendance, Subject
- [x] Indexes

### Phase 3: Student Management (Backend)

- [x] **Step 3.1** — Extend Student model: add `email`, `passwordHash`
- [x] **Step 3.2** — `POST /api/students/register` — enrollment, name, email, password
- [x] **Step 3.3** — `GET /api/students` — List all (paginated: skip, limit)
- [x] **Step 3.4** — `GET /api/students/<enrollment>` — Get by enrollment
- [x] **Step 3.5** — `DELETE /api/students/<enrollment>` — Delete (admin, later)
- [ ] **Step 3.6** — Add Teacher model + `POST /api/teachers` (admin, Phase 6)
- [x] **Acceptance:** Register student via API, list returns created student

### Phase 4: Face Capture & Training (Backend)

- [x] **Step 4.1** — `POST /api/students/<enrollment>/images` — Accept base64 image, validate face, save to `TrainingImage/`
- [x] **Step 4.2** — Naming: `Name.enrollment.sampleNum.jpg`; update student `imageCount`; optional Cloudinary upload
- [x] **Step 4.3** — `haarcascade_frontalface_default.xml` in backend
- [x] **Step 4.4** — `POST /api/train` — Train LBPH, save `Trainner.yml`
- [x] **Acceptance:** Upload images via API, train returns success

### Phase 5: Attendance (Backend)

- [x] **Step 5.1** — `POST /api/attendance/auto` — Image → recognize → record (no duplicate same day+subject)
- [x] **Step 5.2** — `POST /api/attendance/manual` — enrollment, name, subject, date?, time?
- [x] **Step 5.3** — `GET /api/attendance?subject=&date=&skip=&limit=` — Filterable list

### Phase 6: Auth (Backend)

- [x] **Step 6.1** — JWT-based auth
- [x] **Step 6.2** — `POST /api/auth/login` — Returns token + user (role, email, etc.)
- [ ] **Step 6.3** — Middleware: protect backend routes by role (optional for now)
- [x] **Step 6.4** — Teacher model, `POST /api/teachers` for creating teachers

### Phase 7: Frontend — Layout & Navigation

- [x] **Step 7.1** — Layout with nav: Home, Login, Register
- [x] **Step 7.2** — Routes: /, /login, /register (role redirects in Phase 6)
- [x] **Step 7.3** — Shared components (Button, Input, Card, Header)

### Phase 8: Frontend — Student Portal

- [x] **Step 8.1** — `/register` — Registration form
- [x] **Step 8.2** — `/login` — Role selector + credentials
- [x] **Step 8.3** — `/student/dashboard` — Status, webcam face upload, profile

### Phase 9: Frontend — Teacher Portal

- [x] **Step 9.1** — `/teacher/dashboard` — Tabs: View, Manual, Auto
- [x] **Step 9.2** — View attendance by subject/date (table)
- [x] **Step 9.3** — Manual attendance form (subject, enrollment, name)
- [x] **Step 9.4** — Auto attendance (webcam modal + face recognition)

### Phase 10: Frontend — Admin Portal

- [x] **Step 10.1** — `/admin/dashboard` — Overview stats (students, teachers, subjects, model status)
- [x] **Step 10.2** — Students list, add, delete
- [x] **Step 10.3** — Teachers, subjects management (add)
- [x] **Step 10.4** — Train model button
- [x] **Step 10.5** — Full attendance reports (filter by subject/date)

### Phase 11: Integration & Polish

- [x] **Step 11.1** — E2E: Register → Upload → Train → Mark attendance → View report
- [x] **Step 11.2** — Error handling, toasts, validation
- [x] **Step 11.3** — Responsive, accessibility
- [x] **Step 11.4** — SETUP.md, README update

---

## 6. Folder Structure

```
├── backend/
│   ├── app/
│   │   ├── models/       # student, teacher, subject, attendance
│   │   ├── routes/       # students, auth, attendance, train
│   │   ├── services/     # face recognition, training logic
│   │   └── utils/
│   ├── TrainingImage/    # Face images (created at runtime)
│   ├── TrainingImageLabel/
│   └── haarcascade_frontalface_default.xml
├── frontend/
│   └── src/app/
│       ├── (auth)/login, register
│       ├── student/
│       ├── teacher/
│       └── admin/
└── PRD.md
```

---

## 7. Progress Summary

| Phase | Description            | Status   |
|-------|------------------------|----------|
| 1     | Foundation             | Complete |
| 2     | Database & Models      | Complete |
| 3     | Student Management     | Complete |
| 4     | Face Capture & Training| Complete |
| 5     | Attendance             | Complete |
| 6     | Auth                   | Complete |
| 7     | Frontend Layout        | Complete |
| 8     | Frontend Student       | Complete |
| 9     | Frontend Teacher       | Complete |
| 10    | Frontend Admin         | Complete |
| 11    | Integration & Polish   | Complete |
