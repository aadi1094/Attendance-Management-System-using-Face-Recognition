# Attendance Management System — Setup Guide

> **E2E Flow:** See [docs/E2E_FLOW.md](docs/E2E_FLOW.md) for Register → Upload → Train → Mark attendance → View report.  
> **API Testing:** See [TESTING.md](TESTING.md) for route testing (curl, Postman, etc.)

## Tech Stack

- **Backend:** Flask (Python), MongoDB, OpenCV (LBPH face recognition)
- **Frontend:** Next.js 16, React 19, Tailwind CSS 4
- **Auth:** JWT (student / teacher / admin roles)

## Project Structure

```
├── backend/          # Flask API (Python)
│   ├── app/
│   │   ├── config.py
│   │   ├── database.py
│   │   ├── models/
│   │   ├── routes/
│   │   ├── services/
│   │   └── utils/
│   ├── TrainingImage/        # Face images (created at runtime)
│   ├── TrainingImageLabel/   # Trained LBPH model
│   ├── haarcascade_frontalface_default.xml
│   ├── requirements.txt
│   ├── run.py
│   └── .env.example
│
├── frontend/         # Next.js + Tailwind (TypeScript)
│   ├── src/
│   │   ├── app/       # Pages: login, register, student/, teacher/, admin/
│   │   ├── components/
│   │   └── lib/
│   └── package.json
│
└── docs/
    ├── E2E_FLOW.md
    └── LBPH_AND_TRAINNER.md
```

## Backend (Flask)

1. **Create virtual environment and install dependencies:**
   ```bash
   cd backend
   python3 -m venv venv
   source venv/bin/activate   # On Windows: venv\Scripts\activate
   pip install -r requirements.txt
   ```
   > **Note:** Face recognition uses LBPH from `opencv-contrib-python` (not `opencv-python`). The `haarcascade_frontalface_default.xml` must be in `backend/`.

2. **Configure environment:**
   ```bash
   cp .env.example .env
   # Edit .env: MONGODB_URI, JWT_SECRET, ADMIN_EMAIL, ADMIN_PASSWORD
   ```
   - `MONGODB_URI`: MongoDB Atlas URI (use `certifi.where()` for SSL)
   - `ADMIN_EMAIL` / `ADMIN_PASSWORD`: Default admin login (default: admin@attendance.com / admin123)

3. **Run the API:**
   ```bash
   python run.py
   ```
   API runs at `http://localhost:5001` (5001 avoids macOS AirPlay on 5000)

## Frontend (Next.js + Tailwind)

1. **Install dependencies:**
   ```bash
   cd frontend
   npm install
   ```

2. **Configure environment (optional):**
   ```bash
   # Create .env.local if needed; NEXT_PUBLIC_API_URL defaults to http://localhost:5001
   echo "NEXT_PUBLIC_API_URL=http://localhost:5001" > .env.local
   ```

3. **Run the dev server:**
   ```bash
   npm run dev
   ```
   App runs at `http://localhost:3000`

## Run Both Together

- **Terminal 1:** `cd backend && source venv/bin/activate && python run.py`
- **Terminal 2:** `cd frontend && npm run dev`

## Default Credentials

| Role    | Email                  | Password  |
|---------|------------------------|-----------|
| Admin   | admin@attendance.com   | admin123  |
| Teacher | Create via Admin → Teachers | —    |
| Student | Register at /register  | —         |
