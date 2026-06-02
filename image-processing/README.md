# SEAS Image Processing Service

A Python/FastAPI microservice for face recognition and liveness detection, part of the Smart Exam Attendance System (SEAS).

## Features

- **Face Detection**: Using dlib's HOG-based face detector with 68-point facial landmark extraction
- **Face Recognition**: FaceNet-style 128-dimensional face embeddings with cosine similarity comparison
- **Blink Detection**: Eye Aspect Ratio (EAR) calculation for detecting eye blinks
- **Head Pose Estimation**: Using solvePnP algorithm for 3D head pose estimation (yaw, pitch, roll)
- **Anti-Spoofing**: Heuristic-based spoof detection (screen, print detection)
- **Combined Verification**: Full verification pipeline combining face matching and liveness

## Requirements

- Python 3.9+
- OpenCV
- dlib (optional, but recommended)
- TensorFlow (optional, for future CNN models)

## Quick Start

### 1. Create Virtual Environment

```bash
cd image-processing
python -m venv venv

# Windows
venv\Scripts\activate

# Linux/macOS
source venv/bin/activate
```

### 2. Install Dependencies

```bash
pip install -r requirements.txt
```

### 3. Download dlib Models (Optional but Recommended)

Download the following models and place them in the `models/` directory:

- `shape_predictor_68_face_landmarks.dat` - [Download](http://dlib.net/files/shape_predictor_68_face_landmarks.dat.bz2)
- `dlib_face_recognition_resnet_model_v1.dat` - [Download](http://dlib.net/files/dlib_face_recognition_resnet_model_v1.dat.bz2)

```bash
mkdir models
cd models

# Download and extract shape predictor
wget http://dlib.net/files/shape_predictor_68_face_landmarks.dat.bz2
bzip2 -d shape_predictor_68_face_landmarks.dat.bz2

# Download and extract face recognition model
wget http://dlib.net/files/dlib_face_recognition_resnet_model_v1.dat.bz2
bzip2 -d dlib_face_recognition_resnet_model_v1.dat.bz2
```

### 4. Configure Environment

```bash
cp .env.example .env
# Edit .env with your settings
```

### 5. Run the Service

```bash
python main.py
```

The service will start on `http://localhost:8000`

## API Documentation

Once running, visit:
- Swagger UI: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc

## API Endpoints

### Health & Config

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/health` | GET | Health check with model status |
| `/config` | GET | Current configuration values |

### Face Detection & Recognition

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/face/detect` | POST | Detect faces in image |
| `/face/encode` | POST | Get 128-dim face embedding |
| `/face/compare` | POST | Compare two face embeddings |
| `/face/enroll` | POST | Enroll student's face |
| `/face/enroll/{student_id}` | DELETE | Delete enrollment |
| `/face/enroll/{student_id}/status` | GET | Check enrollment status |

### Liveness Detection

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/liveness/blink` | POST | Detect eye blink |
| `/liveness/head-pose` | POST | Validate head pose |
| `/liveness/anti-spoof` | POST | Anti-spoofing check |
| `/liveness/verify` | POST | Full liveness verification |

### Combined Verification

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/verify` | POST | Full verification (face + liveness) |
| `/verify/quick` | POST | Quick face match only |

## Example Usage

### Face Detection

```python
import requests
import base64

# Read and encode image
with open("photo.jpg", "rb") as f:
    image_b64 = base64.b64encode(f.read()).decode()

# Detect faces
response = requests.post(
    "http://localhost:8000/face/detect",
    json={
        "image": image_b64,
        "return_landmarks": True,
        "max_faces": 1
    }
)

result = response.json()
print(f"Faces detected: {result['faces_detected']}")
```

### Full Verification

```python
import requests
import base64

# Capture multiple frames for liveness
frames = []
for i in range(5):
    with open(f"frame_{i}.jpg", "rb") as f:
        frames.append(base64.b64encode(f.read()).decode())

# Verify identity
response = requests.post(
    "http://localhost:8000/verify",
    json={
        "student_id": "STU001",
        "images": frames,
        "verify_liveness": True,
        "require_blink": True
    }
)

result = response.json()
print(f"Verified: {result['is_verified']}")
print(f"Match Score: {result['match_score']}")
print(f"Liveness Score: {result['liveness_score']}")
```

## Docker Deployment

### Build and Run

```bash
# Build image
docker build -t seas-image-processing .

# Run container
docker run -p 8000:8000 \
    -v $(pwd)/models:/app/models:ro \
    -v $(pwd)/data:/app/data \
    seas-image-processing
```

### Using Docker Compose

```bash
# Production
docker-compose up -d

# Development with hot reload
docker-compose --profile dev up image-processing-dev
```

## Configuration

Key configuration options (set via environment variables or `.env` file):

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | 8000 | Service port |
| `DEBUG` | false | Enable debug mode |
| `FACE_MATCH_THRESHOLD` | 0.6 | Face match threshold |
| `LIVENESS_THRESHOLD` | 0.5 | Liveness score threshold |
| `SPOOF_THRESHOLD` | 0.5 | Spoof detection threshold |
| `EAR_THRESHOLD` | 0.25 | Eye aspect ratio for blink |
| `HEAD_POSE_YAW_THRESHOLD` | 30.0 | Max yaw angle (degrees) |

## Integration with NestJS Backend

The service is designed to be called from the SEAS NestJS backend:

```typescript
// Example backend service call
const response = await fetch('http://localhost:8000/verify', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    student_id: studentId,
    images: capturedFrames,
    verify_liveness: true
  })
});

const result = await response.json();
if (result.is_verified) {
  // Mark attendance
}
```

## Project Structure

```
image-processing/
├── main.py                 # FastAPI application entry point
├── config.py               # Configuration settings
├── requirements.txt        # Python dependencies
├── Dockerfile              # Docker configuration
├── docker-compose.yml      # Docker Compose setup
├── .env.example            # Environment template
├── app/
│   ├── models/
│   │   └── schemas.py      # Pydantic models
│   ├── routers/
│   │   ├── face.py         # Face detection endpoints
│   │   ├── liveness.py     # Liveness detection endpoints
│   │   └── verification.py # Combined verification
│   ├── services/
│   │   ├── face_detection.py    # Face detection service
│   │   ├── face_recognition.py  # Face recognition service
│   │   └── liveness_detection.py # Liveness service
│   └── utils/
│       └── image_utils.py  # Image processing utilities
├── models/                 # ML model files (download separately)
├── data/
│   └── face_templates/     # Stored face embeddings
└── logs/                   # Application logs
```

## Algorithm Details

### Eye Aspect Ratio (EAR)

The EAR is calculated using 6 eye landmarks:

```
EAR = (||p2-p6|| + ||p3-p5||) / (2 * ||p1-p4||)
```

Where p1-p6 are the eye landmarks. EAR drops below threshold (~0.25) when eyes close.

### Head Pose Estimation

Uses OpenCV's `solvePnP` with a 3D face model to estimate:
- **Yaw**: Left-right rotation
- **Pitch**: Up-down rotation
- **Roll**: Tilt

### Face Matching

1. Extract 128-dimensional face embedding
2. Normalize embeddings
3. Calculate cosine similarity
4. Compare against threshold (default: 0.6)

## Troubleshooting

### dlib Installation Issues

If dlib fails to install, try:

```bash
# Install build dependencies (Linux)
apt-get install build-essential cmake libopenblas-dev liblapack-dev

# Install with conda (recommended)
conda install -c conda-forge dlib
```

### No Face Detected

- Ensure good lighting
- Face should be clearly visible
- Minimum face size is 80x80 pixels by default

### Low Match Scores

- Use multiple enrollment images
- Ensure consistent lighting during enrollment and verification
- Check that faces are properly aligned

## License

Part of the SEAS (Smart Exam Attendance System) project.
