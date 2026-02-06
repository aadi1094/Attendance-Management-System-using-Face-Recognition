# Attendance Management System — Roadmap & Guidance

This document describes what has been implemented, what is next, and how to make the project better and more powerful.

---

## ✅ Implemented (Recent Improvements)

### 1. Better Training Data Quality
- **15 images** required (up from 10) for more robust recognition
- **Quality checks** on upload:
  - Minimum face size (80px) — rejects small/blurry faces
  - Blur detection (Laplacian variance) — rejects blurry images
  - Clear error messages for each failure case

### 2. Guided Capture
- **Step-by-step prompts** during face capture:
  - Look straight, vary expressions
  - Turn head slightly left/right
  - Chin up/down
- Ensures diverse angles and reduces duplicate-looking images

### 3. Continuous Learning from Attendance
- **Automatic model improvement**: When students give attendance via face recognition, their face crop is saved (if quality passes)
- **Limits**: Max 2 new training images per student per day (configurable)
- **Config**: Set `SAVE_ATTENDANCE_FACES_FOR_TRAINING=false` in `.env` to disable
- **Result**: Model gets better over time without students re-uploading photos

### 4. Backend Configuration (.env)
```
MIN_FACE_SIZE=80                    # Minimum face width/height in pixels
MIN_LAPLACIAN_VAR=80                # Blur threshold (higher = sharper required)
SAVE_ATTENDANCE_FACES_FOR_TRAINING=true
MAX_ATTENDANCE_FACES_PER_STUDENT_PER_DAY=2
```

---

## 📋 What to Do Next (Step-by-Step)

### Phase 1: Immediate (Already Done)
1. ✅ Increase images to 15
2. ✅ Add quality checks
3. ✅ Add guided capture
4. ✅ Save attendance faces for retraining

### Phase 2: Short-Term Improvements
| # | Task | Effort | Impact |
|---|------|--------|--------|
| 1 | **Export attendance to CSV** (Admin & Teacher) | Low | High — school reports |
| 2 | **Higher-resolution webcam** for teacher (1280×720) | Low | Medium — better for 10–20 faces |
| 3 | **Bulk manual entry** (paste multiple enrollments) | Medium | Medium |
| 4 | **Image upload** for teacher (phone/tablet photo) | Medium | High — flexibility |

### Phase 3: Medium-Term Enhancements
| # | Task | Effort | Impact |
|---|------|--------|--------|
| 5 | **API route protection** (JWT middleware) | Medium | High — security |
| 6 | **Attendance summary dashboard** (% per student) | Medium | High |
| 7 | **“Absent” list** (who didn’t give attendance) | Medium | Medium |
| 8 | **Scheduled auto-retrain** (nightly cron) | Medium | Medium |

### Phase 4: Advanced
| # | Task | Effort | Impact |
|---|------|--------|--------|
| 9 | **Class/section model** (students per class) | High | High |
| 10 | **Deep learning detector** (MTCNN/RetinaFace) | High | High — better detection |
| 11 | **Mobile app** or PWA for teachers | High | High |

---

## 🔄 Continuous Learning Flow

1. Student gives attendance via face recognition (teacher captures photo)
2. Backend recognizes face → records attendance
3. If enabled, saves face crop to `TrainingImage/` (max 2 per student per day)
4. Admin clicks **Train Model** when ready
5. Model retrains on all images (including new ones)
6. Recognition improves over time

---

## 📁 Files Changed (Summary)

- `backend/app/config.py` — New config vars
- `backend/app/services/face_image_service.py` — Quality checks, `save_attendance_face_crop`
- `backend/app/services/attendance_service.py` — Call `save_attendance_face_crop` on recognition
- `frontend/src/app/student/dashboard/page.tsx` — MIN_IMAGES=15, guided WebcamCapture
- `frontend/src/components/WebcamCapture.tsx` — Guided prompts
- `backend/.env.example` — Add new vars (optional)

---

## 🚀 Quick Start for New Features

1. **Export CSV**: Add `GET /api/attendance/export?format=csv&...` and a Download button in Admin/Teacher UI
2. **Higher-res webcam**: Change `width: 640, height: 480` to `1280, 720` in WebcamCapture for teacher
3. **Bulk manual**: Add textarea for enrollments, split by newline, loop `record_manual`

---

## 📞 Support

- See [E2E_FLOW.md](./E2E_FLOW.md) for user flows
- See [LBPH_AND_TRAINNER.md](./LBPH_AND_TRAINNER.md) for model details
- See [SETUP.md](../SETUP.md) for installation
