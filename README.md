# Attendance Management System using Face Recognition

A web-based attendance system that uses face recognition (LBPH) to automatically mark student attendance. Built with Flask, Next.js, and MongoDB.

---

## Features

- **Face Recognition**: Automatically recognize students' faces and mark attendance.
- **Image Capture**: Students upload face images via webcam for training.
- **Manual Attendance**: Option to manually record attendance (enrollment + name).
- **Attendance Reports**: Filter by subject and date.
- **Role-based Access**: Student, Teacher, and Admin portals.
- **Responsive UI**: Works on desktop and mobile with toast notifications.

---

## Tech Stack

| Layer   | Technology |
|---------|------------|
| Backend | Flask, MongoDB, OpenCV (LBPH), JWT |
| Frontend| Next.js 16, React 19, Tailwind CSS 4 |
| Auth    | JWT (student / teacher / admin) |

---

## Quick Start

### Prerequisites

- Python 3.10+
- Node.js 18+
- MongoDB (local or Atlas)

### Setup

1. **Backend**
   ```bash
   cd backend
   python3 -m venv venv
   source venv/bin/activate
   pip install -r requirements.txt
   cp .env.example .env
   # Edit .env with your MongoDB URI
   python run.py
   ```

2. **Frontend**
   ```bash
   cd frontend
   npm install
   npm run dev
   ```

3. Open [http://localhost:3000](http://localhost:3000)

See [SETUP.md](SETUP.md) for detailed instructions and [docs/E2E_FLOW.md](docs/E2E_FLOW.md) for the full workflow.

---

## E2E Flow

1. **Register** (Student) → 2. **Add Subjects** (Admin) → 3. **Upload Face Images** (Student)  
   → 4. **Train Model** (Admin) → 5. **Mark Attendance** (Teacher: Auto or Manual)  
   → 6. **View Report** (Admin / Teacher)

---

## Project Structure

```
├── backend/          # Flask API
│   ├── app/          # Models, routes, services
│   ├── TrainingImage/
│   ├── TrainingImageLabel/
│   └── haarcascade_frontalface_default.xml
├── frontend/         # Next.js app
│   └── src/app/      # login, register, student/, teacher/, admin/
├── docs/
│   ├── E2E_FLOW.md
│   └── LBPH_AND_TRAINNER.md
├── SETUP.md
├── TESTING.md
└── PRD.md
```

---

## Default Admin Login

- **Email:** admin@attendance.com  
- **Password:** admin123  

(Configurable via `ADMIN_EMAIL` and `ADMIN_PASSWORD` in backend `.env`.)

---

## License

MIT License — see [LICENSE](LICENSE) for details.
