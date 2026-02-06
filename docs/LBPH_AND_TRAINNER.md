# LBPH Model & Trainner.yml

## What is LBPH?

**LBPH** = **Local Binary Patterns Histograms**

- Face recognition algorithm built into OpenCV (`cv2.face.LBPHFaceRecognizer_create()`)
- Learns grayscale face patterns for each person (identified by an integer ID, e.g. enrollment number)
- Works well for small datasets and real-time recognition
- **Confidence threshold:** Lower value = more confident. We use 70 — if `conf < 70`, the face is accepted as a match.

## Trainner.yml

**Location:** `backend/TrainingImageLabel/Trainner.yml`

**When is it created?**  
- It is **generated** when you run `POST /api/train`
- It does **not** exist until you:
  1. Register at least one student
  2. Upload face images via `POST /api/students/<enrollment>/images`
  3. Call `POST /api/train`

**What does it contain?**  
- Serialized LBPH model (OpenCV YAML format)
- Trained on all images in `backend/TrainingImage/` (format: `Name.enrollment.sampleNum.jpg`)
- Used by `POST /api/attendance/auto` to recognize faces

**Path resolution:**
- Default: `backend/TrainingImageLabel/Trainner.yml`
- Configurable via `TRAINING_LABEL_PATH` in `.env`
