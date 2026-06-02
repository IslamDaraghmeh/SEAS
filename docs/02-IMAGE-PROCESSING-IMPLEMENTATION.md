# SEAS Image Processing Implementation Plan
## Face Recognition, Liveness Detection & Monitoring

---

## Table of Contents

1. [Overview](#overview)
2. [Technology Stack](#technology-stack)
3. [Architecture](#architecture)
4. [Phase 1: Foundation & Face Detection](#phase-1-foundation--face-detection)
5. [Phase 2: Face Recognition](#phase-2-face-recognition)
6. [Phase 3: Liveness Detection](#phase-3-liveness-detection)
7. [Phase 4: Real-time Monitoring](#phase-4-real-time-monitoring)
8. [Phase 5: Edge Deployment](#phase-5-edge-deployment)
9. [API Specifications](#api-specifications)
10. [Performance Requirements](#performance-requirements)

---

## Overview

The Image Processing module is the core AI/ML component of SEAS, responsible for:
- **Face Detection**: Detecting faces in camera frames
- **Face Recognition**: Comparing live faces against enrolled templates
- **Liveness Detection**: Preventing spoofing attacks (photos, videos, masks)
- **Real-time Monitoring**: Continuous verification during exams
- **Edge Processing**: Running inference on Raspberry Pi 4

---

## Technology Stack

| Component | Technology | Purpose |
|-----------|------------|---------|
| Language | Python 3.11+ | Core development |
| Web Framework | FastAPI | REST API |
| ML Framework | TensorFlow 2.x / TensorFlow Lite | Model inference |
| Face Detection | dlib / MediaPipe | 68-point landmarks |
| Face Recognition | FaceNet | 128-dim embeddings |
| Anti-Spoofing | MobileNetV2 | Texture analysis CNN |
| Image Processing | OpenCV | Image manipulation |
| Async | asyncio + uvicorn | High performance |
| Task Queue | Celery + Redis | Background processing |
| Containerization | Docker | Deployment |

---

## Architecture

### System Architecture

```
┌──────────────────────────────────────────────────────────────────────────────┐
│                              EDGE (Raspberry Pi 4)                           │
│  ┌─────────────┐    ┌─────────────────────────────────────────────────────┐ │
│  │   Camera    │───▶│              Edge Processing Client                  │ │
│  │  (HQ Cam)   │    │  ┌──────────┐ ┌──────────┐ ┌───────────────────┐   │ │
│  └─────────────┘    │  │ Face     │ │ Liveness │ │ FaceNet           │   │ │
│                     │  │ Detection│ │ Pipeline │ │ (TFLite)          │   │ │
│                     │  └──────────┘ └──────────┘ └───────────────────┘   │ │
│                     └────────────────────┬────────────────────────────────┘ │
└──────────────────────────────────────────┼──────────────────────────────────┘
                                           │ Results + Embeddings
                                           ▼
┌──────────────────────────────────────────────────────────────────────────────┐
│                              SERVER                                          │
│  ┌─────────────────────────────────────────────────────────────────────────┐ │
│  │                      Image Processing Service                           │ │
│  │  ┌──────────────┐  ┌──────────────┐  ┌────────────────────────────┐   │ │
│  │  │ Verification │  │ Enrollment   │  │ Alert Generation           │   │ │
│  │  │ API          │  │ API          │  │ Service                    │   │ │
│  │  └──────────────┘  └──────────────┘  └────────────────────────────┘   │ │
│  │                                                                         │ │
│  │  ┌──────────────────────────────────────────────────────────────────┐  │ │
│  │  │                    Template Storage (Encrypted)                   │  │ │
│  │  └──────────────────────────────────────────────────────────────────┘  │ │
│  └─────────────────────────────────────────────────────────────────────────┘ │
│                                    │                                         │
│                                    ▼                                         │
│  ┌─────────────────────────────────────────────────────────────────────────┐ │
│  │                      Backend API (NestJS)                               │ │
│  │                      WebSocket Gateway                                   │ │
│  └─────────────────────────────────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────────────────────────────┘
```

### Processing Pipeline

```
Camera Frame
     │
     ▼
┌─────────────────┐
│ Face Detection  │──▶ No face detected? ──▶ Alert: NO_FACE_DETECTED
│ (dlib/MediaPipe)│
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Multi-face      │──▶ Multiple faces? ──▶ Alert: MULTIPLE_FACES
│ Check           │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Landmark        │──▶ 68 facial landmarks extracted
│ Detection       │
└────────┬────────┘
         │
         ├──────────────────────────────────────┐
         │                                      │
         ▼                                      ▼
┌─────────────────┐                   ┌─────────────────┐
│ Liveness Check  │                   │ Face Embedding  │
│ (3-layer)       │                   │ (FaceNet)       │
│  • Eye Blink    │                   │ 128-dim vector  │
│  • Head Pose    │                   └────────┬────────┘
│  • Anti-Spoof   │                            │
└────────┬────────┘                            │
         │                                      │
         ▼                                      ▼
┌─────────────────┐                   ┌─────────────────┐
│ Liveness        │                   │ Template Match  │
│ Decision        │                   │ (Cosine Sim)    │
└────────┬────────┘                   └────────┬────────┘
         │                                      │
         └──────────────┬───────────────────────┘
                        │
                        ▼
              ┌─────────────────┐
              │ Final Decision  │
              │ VERIFIED / FAIL │
              └─────────────────┘
```

---

## Phase 1: Foundation & Face Detection

### Duration: Week 1-2

### Phase 1.1: Project Setup
**Duration: 2 days**

#### Task 1.1.1: Initialize Python Project
```bash
# Create project structure
mkdir -p image-processing/{api,services,models,utils,tests}
cd image-processing

# Initialize virtual environment
python -m venv venv
source venv/bin/activate  # or venv\Scripts\activate on Windows

# Create requirements files
touch requirements.txt requirements-dev.txt
```

**File: `requirements.txt`**
```
# Web Framework
fastapi==0.109.0
uvicorn[standard]==0.27.0
python-multipart==0.0.6

# ML/DL
tensorflow==2.15.0
numpy==1.26.3
scipy==1.12.0

# Image Processing
opencv-python-headless==4.9.0.80
Pillow==10.2.0
dlib==19.24.2

# Face Recognition
facenet-pytorch==2.5.3

# Utilities
python-dotenv==1.0.0
pydantic==2.5.3
pydantic-settings==2.1.0
httpx==0.26.0
aiofiles==23.2.1

# Encryption
cryptography==41.0.7

# Redis/Celery
redis==5.0.1
celery==5.3.6

# Logging
structlog==24.1.0
```

**File: `requirements-dev.txt`**
```
-r requirements.txt
pytest==7.4.4
pytest-asyncio==0.23.3
pytest-cov==4.1.0
black==24.1.1
isort==5.13.2
mypy==1.8.0
```

#### Task 1.1.2: Create Project Structure
```
image-processing/
├── api/
│   ├── __init__.py
│   ├── main.py
│   ├── routes/
│   │   ├── __init__.py
│   │   ├── enrollment.py
│   │   ├── verification.py
│   │   ├── liveness.py
│   │   └── health.py
│   ├── middleware/
│   │   ├── __init__.py
│   │   └── auth.py
│   └── dependencies.py
├── services/
│   ├── __init__.py
│   ├── face_detection/
│   │   ├── __init__.py
│   │   ├── detector.py
│   │   └── landmark_extractor.py
│   ├── face_recognition/
│   │   ├── __init__.py
│   │   ├── embedder.py
│   │   └── matcher.py
│   ├── liveness_detection/
│   │   ├── __init__.py
│   │   ├── eye_blink.py
│   │   ├── head_pose.py
│   │   ├── anti_spoofing.py
│   │   └── pipeline.py
│   └── monitoring/
│       ├── __init__.py
│       ├── session_manager.py
│       └── alert_service.py
├── models/
│   ├── __init__.py
│   ├── facenet/
│   │   └── facenet_keras.h5
│   ├── anti_spoofing/
│   │   └── mobilenetv2_spoof.tflite
│   └── shape_predictor/
│       └── shape_predictor_68_face_landmarks.dat
├── utils/
│   ├── __init__.py
│   ├── image_utils.py
│   ├── encryption.py
│   └── config.py
├── tests/
│   ├── __init__.py
│   ├── test_face_detection.py
│   ├── test_face_recognition.py
│   └── test_liveness.py
├── Dockerfile
├── docker-compose.yml
├── .env.example
└── README.md
```

#### Task 1.1.3: Create FastAPI Application
**File: `api/main.py`**
```python
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
import structlog

from api.routes import enrollment, verification, liveness, health
from utils.config import settings
from services.face_detection.detector import FaceDetector
from services.face_recognition.embedder import FaceEmbedder
from services.liveness_detection.pipeline import LivenessPipeline

logger = structlog.get_logger()

# Global model instances
face_detector: FaceDetector = None
face_embedder: FaceEmbedder = None
liveness_pipeline: LivenessPipeline = None


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Initialize models on startup, cleanup on shutdown."""
    global face_detector, face_embedder, liveness_pipeline

    logger.info("Loading models...")

    face_detector = FaceDetector(
        model_path=settings.LANDMARK_MODEL_PATH
    )

    face_embedder = FaceEmbedder(
        model_path=settings.FACENET_MODEL_PATH
    )

    liveness_pipeline = LivenessPipeline(
        anti_spoof_model_path=settings.ANTI_SPOOF_MODEL_PATH
    )

    logger.info("Models loaded successfully")

    yield

    logger.info("Shutting down...")


app = FastAPI(
    title="SEAS Image Processing Service",
    description="Face recognition, liveness detection, and monitoring API",
    version="1.0.0",
    lifespan=lifespan,
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Routes
app.include_router(health.router, prefix="/health", tags=["Health"])
app.include_router(enrollment.router, prefix="/api/enrollment", tags=["Enrollment"])
app.include_router(verification.router, prefix="/api/verification", tags=["Verification"])
app.include_router(liveness.router, prefix="/api/liveness", tags=["Liveness"])


def get_face_detector() -> FaceDetector:
    return face_detector


def get_face_embedder() -> FaceEmbedder:
    return face_embedder


def get_liveness_pipeline() -> LivenessPipeline:
    return liveness_pipeline
```

**Deliverables:**
- [ ] Project structure created
- [ ] Dependencies installed
- [ ] FastAPI application configured
- [ ] Docker setup ready

---

### Phase 1.2: Face Detection Service
**Duration: 3 days**

#### Task 1.2.1: Implement Face Detector
**File: `services/face_detection/detector.py`**
```python
import cv2
import dlib
import numpy as np
from dataclasses import dataclass
from typing import List, Optional, Tuple
import structlog

logger = structlog.get_logger()


@dataclass
class FaceDetection:
    """Represents a detected face."""
    bbox: Tuple[int, int, int, int]  # (x, y, width, height)
    confidence: float
    landmarks: Optional[np.ndarray] = None  # 68 landmarks


@dataclass
class DetectionResult:
    """Result of face detection on an image."""
    faces: List[FaceDetection]
    image_width: int
    image_height: int
    processing_time_ms: float


class FaceDetector:
    """Face detection using dlib with 68-point landmark extraction."""

    def __init__(self, model_path: str):
        """
        Initialize face detector.

        Args:
            model_path: Path to shape_predictor_68_face_landmarks.dat
        """
        self.detector = dlib.get_frontal_face_detector()
        self.landmark_predictor = dlib.shape_predictor(model_path)
        logger.info("Face detector initialized", model_path=model_path)

    def detect(
        self,
        image: np.ndarray,
        extract_landmarks: bool = True,
        upsample_num: int = 1
    ) -> DetectionResult:
        """
        Detect faces in an image.

        Args:
            image: BGR image as numpy array
            extract_landmarks: Whether to extract 68-point landmarks
            upsample_num: Number of times to upsample for small faces

        Returns:
            DetectionResult with detected faces
        """
        import time
        start_time = time.time()

        # Convert to grayscale for detection
        gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)

        # Detect faces
        dlib_rects = self.detector(gray, upsample_num)

        faces = []
        for rect in dlib_rects:
            # Convert dlib rect to bbox
            x = max(0, rect.left())
            y = max(0, rect.top())
            w = rect.width()
            h = rect.height()

            # Calculate confidence (dlib doesn't provide it directly)
            # Using area ratio as proxy
            face_area = w * h
            image_area = image.shape[0] * image.shape[1]
            confidence = min(1.0, (face_area / image_area) * 10)

            landmarks = None
            if extract_landmarks:
                shape = self.landmark_predictor(gray, rect)
                landmarks = self._shape_to_np(shape)

            faces.append(FaceDetection(
                bbox=(x, y, w, h),
                confidence=confidence,
                landmarks=landmarks
            ))

        processing_time = (time.time() - start_time) * 1000

        return DetectionResult(
            faces=faces,
            image_width=image.shape[1],
            image_height=image.shape[0],
            processing_time_ms=processing_time
        )

    def _shape_to_np(self, shape) -> np.ndarray:
        """Convert dlib shape to numpy array of landmarks."""
        landmarks = np.zeros((68, 2), dtype=np.int32)
        for i in range(68):
            landmarks[i] = (shape.part(i).x, shape.part(i).y)
        return landmarks

    def extract_face(
        self,
        image: np.ndarray,
        detection: FaceDetection,
        target_size: Tuple[int, int] = (160, 160),
        margin: float = 0.2
    ) -> np.ndarray:
        """
        Extract and align face from image.

        Args:
            image: Original image
            detection: Face detection result
            target_size: Output face size (width, height)
            margin: Margin around face as fraction

        Returns:
            Aligned face image
        """
        x, y, w, h = detection.bbox

        # Add margin
        margin_x = int(w * margin)
        margin_y = int(h * margin)

        x1 = max(0, x - margin_x)
        y1 = max(0, y - margin_y)
        x2 = min(image.shape[1], x + w + margin_x)
        y2 = min(image.shape[0], y + h + margin_y)

        # Crop face
        face = image[y1:y2, x1:x2]

        # Resize to target size
        face = cv2.resize(face, target_size)

        return face

    def get_eye_landmarks(self, landmarks: np.ndarray) -> Tuple[np.ndarray, np.ndarray]:
        """
        Extract eye landmarks from 68-point landmarks.

        Returns:
            (left_eye, right_eye) landmarks
        """
        # Left eye: points 36-41
        # Right eye: points 42-47
        left_eye = landmarks[36:42]
        right_eye = landmarks[42:48]
        return left_eye, right_eye

    def get_nose_landmarks(self, landmarks: np.ndarray) -> np.ndarray:
        """Get nose landmarks (points 27-35)."""
        return landmarks[27:36]

    def get_mouth_landmarks(self, landmarks: np.ndarray) -> np.ndarray:
        """Get mouth landmarks (points 48-67)."""
        return landmarks[48:68]
```

#### Task 1.2.2: Implement Landmark Extractor Utilities
**File: `services/face_detection/landmark_extractor.py`**
```python
import numpy as np
from typing import Tuple, Dict


class LandmarkExtractor:
    """Utility class for extracting features from 68-point landmarks."""

    # Landmark indices for different facial features
    LANDMARKS = {
        'jaw': list(range(0, 17)),
        'right_eyebrow': list(range(17, 22)),
        'left_eyebrow': list(range(22, 27)),
        'nose_bridge': list(range(27, 31)),
        'nose_tip': list(range(31, 36)),
        'right_eye': list(range(36, 42)),
        'left_eye': list(range(42, 48)),
        'outer_lip': list(range(48, 60)),
        'inner_lip': list(range(60, 68)),
    }

    # 3D model points for head pose estimation
    MODEL_POINTS_3D = np.array([
        (0.0, 0.0, 0.0),             # Nose tip
        (0.0, -330.0, -65.0),        # Chin
        (-225.0, 170.0, -135.0),     # Left eye left corner
        (225.0, 170.0, -135.0),      # Right eye right corner
        (-150.0, -150.0, -125.0),    # Left mouth corner
        (150.0, -150.0, -125.0)      # Right mouth corner
    ], dtype=np.float64)

    @staticmethod
    def compute_eye_aspect_ratio(eye_landmarks: np.ndarray) -> float:
        """
        Compute Eye Aspect Ratio (EAR) for blink detection.

        EAR = (||p2-p6|| + ||p3-p5||) / (2 * ||p1-p4||)

        Args:
            eye_landmarks: 6 points for one eye

        Returns:
            EAR value (drops during blink)
        """
        # Vertical distances
        v1 = np.linalg.norm(eye_landmarks[1] - eye_landmarks[5])
        v2 = np.linalg.norm(eye_landmarks[2] - eye_landmarks[4])

        # Horizontal distance
        h = np.linalg.norm(eye_landmarks[0] - eye_landmarks[3])

        if h == 0:
            return 0.0

        ear = (v1 + v2) / (2.0 * h)
        return ear

    @staticmethod
    def get_head_pose_points(landmarks: np.ndarray) -> np.ndarray:
        """
        Extract 2D points for head pose estimation.

        Args:
            landmarks: 68-point facial landmarks

        Returns:
            6 key points for pose estimation
        """
        return np.array([
            landmarks[30],    # Nose tip
            landmarks[8],     # Chin
            landmarks[36],    # Left eye left corner
            landmarks[45],    # Right eye right corner
            landmarks[48],    # Left mouth corner
            landmarks[54]     # Right mouth corner
        ], dtype=np.float64)

    @staticmethod
    def estimate_head_pose(
        landmarks: np.ndarray,
        image_width: int,
        image_height: int
    ) -> Tuple[float, float, float]:
        """
        Estimate head pose (pitch, yaw, roll) using solvePnP.

        Args:
            landmarks: 68-point facial landmarks
            image_width: Image width
            image_height: Image height

        Returns:
            (pitch, yaw, roll) in degrees
        """
        import cv2

        # Camera matrix (assuming standard webcam parameters)
        focal_length = image_width
        center = (image_width / 2, image_height / 2)
        camera_matrix = np.array([
            [focal_length, 0, center[0]],
            [0, focal_length, center[1]],
            [0, 0, 1]
        ], dtype=np.float64)

        # Assume no lens distortion
        dist_coeffs = np.zeros((4, 1))

        # Get 2D image points
        image_points = LandmarkExtractor.get_head_pose_points(landmarks)

        # Solve PnP
        success, rotation_vec, translation_vec = cv2.solvePnP(
            LandmarkExtractor.MODEL_POINTS_3D,
            image_points,
            camera_matrix,
            dist_coeffs,
            flags=cv2.SOLVEPNP_ITERATIVE
        )

        if not success:
            return 0.0, 0.0, 0.0

        # Convert rotation vector to rotation matrix
        rotation_mat, _ = cv2.Rodrigues(rotation_vec)

        # Get Euler angles
        pose_mat = cv2.hconcat([rotation_mat, translation_vec])
        _, _, _, _, _, _, euler_angles = cv2.decomposeProjectionMatrix(pose_mat)

        pitch = euler_angles[0, 0]
        yaw = euler_angles[1, 0]
        roll = euler_angles[2, 0]

        return pitch, yaw, roll

    @staticmethod
    def compute_mouth_aspect_ratio(landmarks: np.ndarray) -> float:
        """
        Compute Mouth Aspect Ratio for smile detection.

        Args:
            landmarks: 68-point facial landmarks

        Returns:
            MAR value (increases when mouth opens)
        """
        # Outer lip points
        outer_lip = landmarks[48:60]

        # Vertical distances
        v1 = np.linalg.norm(outer_lip[2] - outer_lip[10])
        v2 = np.linalg.norm(outer_lip[4] - outer_lip[8])

        # Horizontal distance
        h = np.linalg.norm(outer_lip[0] - outer_lip[6])

        if h == 0:
            return 0.0

        mar = (v1 + v2) / (2.0 * h)
        return mar
```

**Deliverables:**
- [ ] Face detector implemented with dlib
- [ ] 68-point landmark extraction
- [ ] Eye landmark extraction for EAR
- [ ] Head pose estimation with solvePnP
- [ ] Face cropping and alignment

---

### Phase 1.3: API Endpoints for Detection
**Duration: 2 days**

#### Task 1.3.1: Implement Detection Endpoint
**File: `api/routes/verification.py`**
```python
from fastapi import APIRouter, UploadFile, File, HTTPException, Depends
from pydantic import BaseModel
from typing import List, Optional
import numpy as np
import cv2
import base64

from api.main import get_face_detector
from services.face_detection.detector import FaceDetector, DetectionResult

router = APIRouter()


class FaceDetectionResponse(BaseModel):
    """Response model for face detection."""
    success: bool
    faces_count: int
    faces: List[dict]
    processing_time_ms: float
    message: Optional[str] = None


class Base64ImageRequest(BaseModel):
    """Request with base64 encoded image."""
    image: str  # Base64 encoded image


@router.post("/detect", response_model=FaceDetectionResponse)
async def detect_faces(
    file: UploadFile = File(...),
    face_detector: FaceDetector = Depends(get_face_detector)
):
    """
    Detect faces in an uploaded image.

    Returns detected faces with bounding boxes and landmarks.
    """
    # Read image
    contents = await file.read()
    nparr = np.frombuffer(contents, np.uint8)
    image = cv2.imdecode(nparr, cv2.IMREAD_COLOR)

    if image is None:
        raise HTTPException(status_code=400, detail="Invalid image file")

    # Detect faces
    result = face_detector.detect(image, extract_landmarks=True)

    faces_data = []
    for face in result.faces:
        face_dict = {
            "bbox": {
                "x": face.bbox[0],
                "y": face.bbox[1],
                "width": face.bbox[2],
                "height": face.bbox[3]
            },
            "confidence": face.confidence,
        }
        if face.landmarks is not None:
            face_dict["landmarks"] = face.landmarks.tolist()
        faces_data.append(face_dict)

    return FaceDetectionResponse(
        success=len(result.faces) > 0,
        faces_count=len(result.faces),
        faces=faces_data,
        processing_time_ms=result.processing_time_ms,
        message=None if result.faces else "No faces detected"
    )


@router.post("/detect/base64", response_model=FaceDetectionResponse)
async def detect_faces_base64(
    request: Base64ImageRequest,
    face_detector: FaceDetector = Depends(get_face_detector)
):
    """
    Detect faces in a base64 encoded image.
    """
    try:
        # Decode base64 image
        image_data = base64.b64decode(request.image)
        nparr = np.frombuffer(image_data, np.uint8)
        image = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Invalid base64 image: {str(e)}")

    if image is None:
        raise HTTPException(status_code=400, detail="Could not decode image")

    result = face_detector.detect(image, extract_landmarks=True)

    faces_data = []
    for face in result.faces:
        face_dict = {
            "bbox": {
                "x": face.bbox[0],
                "y": face.bbox[1],
                "width": face.bbox[2],
                "height": face.bbox[3]
            },
            "confidence": face.confidence,
        }
        if face.landmarks is not None:
            face_dict["landmarks"] = face.landmarks.tolist()
        faces_data.append(face_dict)

    return FaceDetectionResponse(
        success=len(result.faces) > 0,
        faces_count=len(result.faces),
        faces=faces_data,
        processing_time_ms=result.processing_time_ms,
        message=None if result.faces else "No faces detected"
    )
```

**Deliverables:**
- [ ] Face detection endpoint (file upload)
- [ ] Face detection endpoint (base64)
- [ ] Response with bounding boxes and landmarks

---

## Phase 2: Face Recognition

### Duration: Week 3-4

### Phase 2.1: Face Embedding Service
**Duration: 3 days**

#### Task 2.1.1: Implement FaceNet Embedder
**File: `services/face_recognition/embedder.py`**
```python
import numpy as np
import tensorflow as tf
from typing import List, Optional
import cv2
import structlog

logger = structlog.get_logger()


class FaceEmbedder:
    """
    Face embedding generator using FaceNet.
    Produces 128-dimensional embeddings for face recognition.
    """

    EMBEDDING_SIZE = 128
    INPUT_SIZE = (160, 160)

    def __init__(self, model_path: str, use_tflite: bool = False):
        """
        Initialize face embedder.

        Args:
            model_path: Path to FaceNet model (.h5 or .tflite)
            use_tflite: Use TensorFlow Lite for inference
        """
        self.use_tflite = use_tflite

        if use_tflite:
            self.interpreter = tf.lite.Interpreter(model_path=model_path)
            self.interpreter.allocate_tensors()
            self.input_details = self.interpreter.get_input_details()
            self.output_details = self.interpreter.get_output_details()
            logger.info("FaceNet TFLite model loaded", model_path=model_path)
        else:
            self.model = tf.keras.models.load_model(model_path)
            logger.info("FaceNet Keras model loaded", model_path=model_path)

    def preprocess(self, face_image: np.ndarray) -> np.ndarray:
        """
        Preprocess face image for embedding extraction.

        Args:
            face_image: BGR face image

        Returns:
            Preprocessed image tensor
        """
        # Resize to model input size
        if face_image.shape[:2] != self.INPUT_SIZE:
            face_image = cv2.resize(face_image, self.INPUT_SIZE)

        # Convert BGR to RGB
        face_image = cv2.cvtColor(face_image, cv2.COLOR_BGR2RGB)

        # Normalize to [-1, 1] (FaceNet standard)
        face_image = face_image.astype(np.float32)
        mean = np.mean(face_image)
        std = np.std(face_image)
        face_image = (face_image - mean) / (std + 1e-6)

        return face_image

    def get_embedding(self, face_image: np.ndarray) -> np.ndarray:
        """
        Extract 128-dimensional embedding from face image.

        Args:
            face_image: BGR face image (any size, will be resized)

        Returns:
            128-dimensional embedding vector (normalized)
        """
        # Preprocess
        preprocessed = self.preprocess(face_image)

        # Add batch dimension
        input_tensor = np.expand_dims(preprocessed, axis=0)

        if self.use_tflite:
            self.interpreter.set_tensor(self.input_details[0]['index'], input_tensor)
            self.interpreter.invoke()
            embedding = self.interpreter.get_tensor(self.output_details[0]['index'])[0]
        else:
            embedding = self.model.predict(input_tensor, verbose=0)[0]

        # L2 normalize
        embedding = embedding / np.linalg.norm(embedding)

        return embedding

    def get_embeddings_batch(self, face_images: List[np.ndarray]) -> List[np.ndarray]:
        """
        Extract embeddings for multiple face images.

        Args:
            face_images: List of BGR face images

        Returns:
            List of 128-dimensional embeddings
        """
        if not face_images:
            return []

        # Preprocess all images
        preprocessed = np.array([self.preprocess(img) for img in face_images])

        if self.use_tflite:
            # TFLite processes one at a time
            embeddings = []
            for img in preprocessed:
                input_tensor = np.expand_dims(img, axis=0)
                self.interpreter.set_tensor(self.input_details[0]['index'], input_tensor)
                self.interpreter.invoke()
                embedding = self.interpreter.get_tensor(self.output_details[0]['index'])[0]
                embeddings.append(embedding / np.linalg.norm(embedding))
            return embeddings
        else:
            embeddings = self.model.predict(preprocessed, verbose=0)
            # L2 normalize each embedding
            return [emb / np.linalg.norm(emb) for emb in embeddings]
```

#### Task 2.1.2: Implement Face Matcher
**File: `services/face_recognition/matcher.py`**
```python
import numpy as np
from typing import Tuple, Optional
from dataclasses import dataclass
import structlog

logger = structlog.get_logger()


@dataclass
class MatchResult:
    """Result of face matching."""
    is_match: bool
    similarity: float
    distance: float
    confidence: str  # "high", "medium", "low"


class FaceMatcher:
    """
    Face matching using cosine similarity.

    Thresholds based on FaceNet recommendations:
    - Cosine similarity >= 0.80: Match (distance <= 0.60)
    - Cosine similarity >= 0.65: Possible match, retry
    - Cosine similarity < 0.65: No match
    """

    MATCH_THRESHOLD = 0.80
    RETRY_THRESHOLD = 0.65

    @staticmethod
    def cosine_similarity(embedding1: np.ndarray, embedding2: np.ndarray) -> float:
        """
        Compute cosine similarity between two embeddings.

        Args:
            embedding1: First 128-dim embedding
            embedding2: Second 128-dim embedding

        Returns:
            Cosine similarity [-1, 1]
        """
        # Embeddings should already be L2 normalized
        return float(np.dot(embedding1, embedding2))

    @staticmethod
    def euclidean_distance(embedding1: np.ndarray, embedding2: np.ndarray) -> float:
        """
        Compute Euclidean distance between two embeddings.

        Args:
            embedding1: First 128-dim embedding
            embedding2: Second 128-dim embedding

        Returns:
            Euclidean distance
        """
        return float(np.linalg.norm(embedding1 - embedding2))

    @classmethod
    def match(
        cls,
        live_embedding: np.ndarray,
        stored_embedding: np.ndarray,
        threshold: Optional[float] = None
    ) -> MatchResult:
        """
        Compare live embedding against stored template.

        Args:
            live_embedding: Embedding from live capture
            stored_embedding: Stored enrollment template
            threshold: Custom match threshold (default: 0.80)

        Returns:
            MatchResult with similarity and decision
        """
        threshold = threshold or cls.MATCH_THRESHOLD

        similarity = cls.cosine_similarity(live_embedding, stored_embedding)
        distance = cls.euclidean_distance(live_embedding, stored_embedding)

        is_match = similarity >= threshold

        # Determine confidence level
        if similarity >= 0.90:
            confidence = "high"
        elif similarity >= 0.80:
            confidence = "medium"
        elif similarity >= 0.65:
            confidence = "low"
        else:
            confidence = "none"

        logger.debug(
            "Face match result",
            similarity=similarity,
            distance=distance,
            is_match=is_match,
            confidence=confidence
        )

        return MatchResult(
            is_match=is_match,
            similarity=similarity,
            distance=distance,
            confidence=confidence
        )

    @classmethod
    def match_against_templates(
        cls,
        live_embedding: np.ndarray,
        templates: list[np.ndarray],
        threshold: Optional[float] = None
    ) -> Tuple[MatchResult, int]:
        """
        Match live embedding against multiple templates.

        Args:
            live_embedding: Embedding from live capture
            templates: List of stored embeddings
            threshold: Custom match threshold

        Returns:
            (best_match_result, best_template_index)
        """
        if not templates:
            return MatchResult(
                is_match=False,
                similarity=0.0,
                distance=float('inf'),
                confidence="none"
            ), -1

        best_similarity = -1.0
        best_index = 0

        for i, template in enumerate(templates):
            similarity = cls.cosine_similarity(live_embedding, template)
            if similarity > best_similarity:
                best_similarity = similarity
                best_index = i

        return cls.match(live_embedding, templates[best_index], threshold), best_index

    @staticmethod
    def compute_average_template(embeddings: list[np.ndarray]) -> np.ndarray:
        """
        Compute average embedding from multiple captures.
        Used during enrollment to create robust template.

        Args:
            embeddings: List of embeddings from enrollment captures

        Returns:
            Averaged and normalized embedding
        """
        if not embeddings:
            raise ValueError("No embeddings provided")

        avg_embedding = np.mean(embeddings, axis=0)
        # Re-normalize
        avg_embedding = avg_embedding / np.linalg.norm(avg_embedding)

        return avg_embedding
```

**Deliverables:**
- [ ] FaceNet model integration
- [ ] Embedding extraction (128-dim)
- [ ] TFLite support for edge
- [ ] Cosine similarity matching
- [ ] Multi-template matching
- [ ] Template averaging for enrollment

---

### Phase 2.2: Enrollment API
**Duration: 2 days**

#### Task 2.2.1: Implement Enrollment Endpoint
**File: `api/routes/enrollment.py`**
```python
from fastapi import APIRouter, UploadFile, File, HTTPException, Depends, Form
from pydantic import BaseModel
from typing import List, Optional
import numpy as np
import cv2
import base64

from api.main import get_face_detector, get_face_embedder
from services.face_detection.detector import FaceDetector
from services.face_recognition.embedder import FaceEmbedder
from services.face_recognition.matcher import FaceMatcher
from utils.encryption import TemplateEncryption

router = APIRouter()


class EnrollmentRequest(BaseModel):
    """Request for face enrollment."""
    student_id: str
    images: List[str]  # List of base64 encoded images


class EnrollmentResponse(BaseModel):
    """Response for face enrollment."""
    success: bool
    student_id: str
    embeddings_count: int
    template_size_bytes: int
    message: Optional[str] = None


class SingleCaptureRequest(BaseModel):
    """Request for single face capture during enrollment."""
    student_id: str
    pose: str  # "front", "left", "right", "up", "down"
    image: str  # Base64 encoded image


class SingleCaptureResponse(BaseModel):
    """Response for single capture."""
    success: bool
    pose: str
    face_detected: bool
    quality_score: float
    message: Optional[str] = None


@router.post("/capture", response_model=SingleCaptureResponse)
async def capture_enrollment_image(
    request: SingleCaptureRequest,
    face_detector: FaceDetector = Depends(get_face_detector)
):
    """
    Capture a single enrollment image and validate quality.
    Called for each of the 5 poses during enrollment.
    """
    try:
        # Decode image
        image_data = base64.b64decode(request.image)
        nparr = np.frombuffer(image_data, np.uint8)
        image = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Invalid image: {str(e)}")

    # Detect face
    result = face_detector.detect(image, extract_landmarks=True)

    if len(result.faces) == 0:
        return SingleCaptureResponse(
            success=False,
            pose=request.pose,
            face_detected=False,
            quality_score=0.0,
            message="No face detected. Please position your face in the frame."
        )

    if len(result.faces) > 1:
        return SingleCaptureResponse(
            success=False,
            pose=request.pose,
            face_detected=True,
            quality_score=0.0,
            message="Multiple faces detected. Please ensure only one person is in frame."
        )

    face = result.faces[0]

    # Check face quality
    quality_score = _compute_face_quality(image, face)

    if quality_score < 0.5:
        return SingleCaptureResponse(
            success=False,
            pose=request.pose,
            face_detected=True,
            quality_score=quality_score,
            message="Image quality too low. Please ensure good lighting and face visibility."
        )

    return SingleCaptureResponse(
        success=True,
        pose=request.pose,
        face_detected=True,
        quality_score=quality_score,
        message=f"Successfully captured {request.pose} pose."
    )


@router.post("/complete", response_model=EnrollmentResponse)
async def complete_enrollment(
    request: EnrollmentRequest,
    face_detector: FaceDetector = Depends(get_face_detector),
    face_embedder: FaceEmbedder = Depends(get_face_embedder)
):
    """
    Complete face enrollment with all captured images.
    Generates averaged template from multiple poses.
    """
    if len(request.images) < 3:
        raise HTTPException(
            status_code=400,
            detail="At least 3 enrollment images required"
        )

    embeddings = []

    for i, img_base64 in enumerate(request.images):
        try:
            # Decode image
            image_data = base64.b64decode(img_base64)
            nparr = np.frombuffer(image_data, np.uint8)
            image = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
        except Exception:
            continue

        # Detect and extract face
        result = face_detector.detect(image, extract_landmarks=True)
        if len(result.faces) != 1:
            continue

        face_image = face_detector.extract_face(image, result.faces[0])
        embedding = face_embedder.get_embedding(face_image)
        embeddings.append(embedding)

    if len(embeddings) < 3:
        raise HTTPException(
            status_code=400,
            detail=f"Could not extract enough quality faces. Got {len(embeddings)}, need at least 3."
        )

    # Compute average template
    template = FaceMatcher.compute_average_template(embeddings)

    # Encrypt template
    encrypted_template = TemplateEncryption.encrypt(template)

    # TODO: Store template via backend API
    # await backend_client.store_face_template(request.student_id, encrypted_template)

    return EnrollmentResponse(
        success=True,
        student_id=request.student_id,
        embeddings_count=len(embeddings),
        template_size_bytes=len(encrypted_template),
        message="Face enrollment completed successfully."
    )


def _compute_face_quality(image: np.ndarray, face) -> float:
    """
    Compute face quality score based on multiple factors.

    Factors:
    - Face size relative to image
    - Lighting (brightness and contrast)
    - Blur detection
    - Face position (centered)
    """
    x, y, w, h = face.bbox
    img_h, img_w = image.shape[:2]

    # Face size score (should be at least 20% of image)
    face_area_ratio = (w * h) / (img_w * img_h)
    size_score = min(1.0, face_area_ratio / 0.15)

    # Lighting score
    face_region = image[y:y+h, x:x+w]
    gray_face = cv2.cvtColor(face_region, cv2.COLOR_BGR2GRAY)
    brightness = np.mean(gray_face)
    brightness_score = 1.0 - abs(brightness - 127) / 127

    # Blur score (Laplacian variance)
    laplacian_var = cv2.Laplacian(gray_face, cv2.CV_64F).var()
    blur_score = min(1.0, laplacian_var / 500)

    # Position score (face should be centered)
    face_center_x = x + w / 2
    face_center_y = y + h / 2
    center_offset_x = abs(face_center_x - img_w / 2) / (img_w / 2)
    center_offset_y = abs(face_center_y - img_h / 2) / (img_h / 2)
    position_score = 1.0 - (center_offset_x + center_offset_y) / 2

    # Weighted average
    quality_score = (
        size_score * 0.3 +
        brightness_score * 0.2 +
        blur_score * 0.3 +
        position_score * 0.2
    )

    return quality_score
```

**Deliverables:**
- [ ] Single capture validation endpoint
- [ ] Complete enrollment endpoint
- [ ] Face quality scoring
- [ ] Multi-pose template generation
- [ ] Template encryption

---

## Phase 3: Liveness Detection

### Duration: Week 5-6

### Phase 3.1: Eye Blink Detection
**Duration: 2 days**

#### Task 3.1.1: Implement Eye Blink Detector
**File: `services/liveness_detection/eye_blink.py`**
```python
import numpy as np
from collections import deque
from typing import Tuple, Optional
from dataclasses import dataclass
import structlog

from services.face_detection.landmark_extractor import LandmarkExtractor

logger = structlog.get_logger()


@dataclass
class BlinkState:
    """State of blink detection."""
    blink_detected: bool
    blink_count: int
    current_ear: float
    is_eye_closed: bool
    frames_since_blink: int


class EyeBlinkDetector:
    """
    Eye blink detection using Eye Aspect Ratio (EAR).

    A blink is detected when EAR drops below threshold for
    at least MIN_BLINK_FRAMES consecutive frames.
    """

    # EAR threshold - eyes are considered closed below this
    EAR_THRESHOLD = 0.21

    # Minimum consecutive frames for a valid blink
    MIN_BLINK_FRAMES = 3

    # Maximum frames for a blink (to distinguish from closed eyes)
    MAX_BLINK_FRAMES = 15

    def __init__(self, history_size: int = 30):
        """
        Initialize blink detector.

        Args:
            history_size: Number of frames to track
        """
        self.ear_history = deque(maxlen=history_size)
        self.blink_count = 0
        self.frames_below_threshold = 0
        self.was_below_threshold = False

    def reset(self):
        """Reset detector state."""
        self.ear_history.clear()
        self.blink_count = 0
        self.frames_below_threshold = 0
        self.was_below_threshold = False

    def process_frame(self, landmarks: np.ndarray) -> BlinkState:
        """
        Process a single frame and detect blinks.

        Args:
            landmarks: 68-point facial landmarks

        Returns:
            BlinkState with detection results
        """
        # Extract eye landmarks
        left_eye = landmarks[36:42]
        right_eye = landmarks[42:48]

        # Compute EAR for both eyes
        left_ear = LandmarkExtractor.compute_eye_aspect_ratio(left_eye)
        right_ear = LandmarkExtractor.compute_eye_aspect_ratio(right_eye)

        # Average EAR
        ear = (left_ear + right_ear) / 2.0
        self.ear_history.append(ear)

        is_eye_closed = ear < self.EAR_THRESHOLD
        blink_detected = False

        if is_eye_closed:
            self.frames_below_threshold += 1
        else:
            # Check if we just completed a blink
            if self.was_below_threshold:
                if self.MIN_BLINK_FRAMES <= self.frames_below_threshold <= self.MAX_BLINK_FRAMES:
                    blink_detected = True
                    self.blink_count += 1
                    logger.debug(
                        "Blink detected",
                        blink_count=self.blink_count,
                        frames=self.frames_below_threshold
                    )
            self.frames_below_threshold = 0

        self.was_below_threshold = is_eye_closed

        return BlinkState(
            blink_detected=blink_detected,
            blink_count=self.blink_count,
            current_ear=ear,
            is_eye_closed=is_eye_closed,
            frames_since_blink=self.frames_below_threshold if not is_eye_closed else 0
        )

    def get_average_ear(self) -> float:
        """Get average EAR from history."""
        if not self.ear_history:
            return 0.0
        return sum(self.ear_history) / len(self.ear_history)

    def check_natural_blink_pattern(self) -> bool:
        """
        Check if blink pattern appears natural.
        Helps detect static images or staring.

        Returns:
            True if pattern is natural
        """
        if len(self.ear_history) < 20:
            return True  # Not enough data

        # Natural eyes have variance in EAR
        ear_variance = np.var(list(self.ear_history))

        # Very low variance suggests static image
        if ear_variance < 0.001:
            logger.warning("Unnatural blink pattern detected", variance=ear_variance)
            return False

        return True
```

### Phase 3.2: Head Pose Detection
**Duration: 2 days**

#### Task 3.2.1: Implement Head Pose Validator
**File: `services/liveness_detection/head_pose.py`**
```python
import numpy as np
from collections import deque
from typing import Tuple, List, Optional
from dataclasses import dataclass
from enum import Enum
import random
import structlog

from services.face_detection.landmark_extractor import LandmarkExtractor

logger = structlog.get_logger()


class PoseChallenge(Enum):
    """Head pose challenges for liveness."""
    LOOK_LEFT = "look_left"
    LOOK_RIGHT = "look_right"
    LOOK_UP = "look_up"
    LOOK_DOWN = "look_down"
    STAY_CENTER = "stay_center"


@dataclass
class PoseState:
    """Current head pose state."""
    pitch: float  # Up/down
    yaw: float    # Left/right
    roll: float   # Tilt
    is_centered: bool
    current_direction: Optional[str]


@dataclass
class ChallengeResult:
    """Result of pose challenge."""
    challenge: PoseChallenge
    completed: bool
    current_pose: PoseState
    message: str


class HeadPoseValidator:
    """
    Head pose validation for liveness detection.

    Uses random pose challenges to prevent replay attacks.
    Tolerance: ±15 degrees for challenge completion.
    """

    # Tolerance for pose detection
    YAW_THRESHOLD = 15.0   # degrees
    PITCH_THRESHOLD = 12.0  # degrees
    CENTER_TOLERANCE = 10.0  # degrees for "centered" position

    # Challenge requirements
    HOLD_FRAMES = 5  # Frames to hold pose for completion

    def __init__(self):
        """Initialize pose validator."""
        self.pose_history = deque(maxlen=30)
        self.current_challenge: Optional[PoseChallenge] = None
        self.challenge_sequence: List[PoseChallenge] = []
        self.completed_challenges: List[PoseChallenge] = []
        self.frames_in_position = 0

    def reset(self):
        """Reset validator state."""
        self.pose_history.clear()
        self.current_challenge = None
        self.challenge_sequence = []
        self.completed_challenges = []
        self.frames_in_position = 0

    def generate_challenge_sequence(self, num_challenges: int = 2) -> List[PoseChallenge]:
        """
        Generate random sequence of pose challenges.

        Args:
            num_challenges: Number of challenges to generate

        Returns:
            List of challenges
        """
        available = [
            PoseChallenge.LOOK_LEFT,
            PoseChallenge.LOOK_RIGHT,
            PoseChallenge.LOOK_UP,
            PoseChallenge.LOOK_DOWN,
        ]

        self.challenge_sequence = random.sample(available, min(num_challenges, len(available)))
        self.current_challenge = self.challenge_sequence[0] if self.challenge_sequence else None

        logger.info("Generated pose challenge sequence", challenges=[c.value for c in self.challenge_sequence])

        return self.challenge_sequence

    def process_frame(
        self,
        landmarks: np.ndarray,
        image_width: int,
        image_height: int
    ) -> ChallengeResult:
        """
        Process frame and check pose challenge progress.

        Args:
            landmarks: 68-point facial landmarks
            image_width: Image width
            image_height: Image height

        Returns:
            ChallengeResult with current status
        """
        # Estimate head pose
        pitch, yaw, roll = LandmarkExtractor.estimate_head_pose(
            landmarks, image_width, image_height
        )

        # Determine current direction
        direction = self._determine_direction(pitch, yaw)

        is_centered = (
            abs(pitch) < self.CENTER_TOLERANCE and
            abs(yaw) < self.CENTER_TOLERANCE
        )

        pose_state = PoseState(
            pitch=pitch,
            yaw=yaw,
            roll=roll,
            is_centered=is_centered,
            current_direction=direction
        )

        self.pose_history.append(pose_state)

        if self.current_challenge is None:
            return ChallengeResult(
                challenge=PoseChallenge.STAY_CENTER,
                completed=True,
                current_pose=pose_state,
                message="No active challenge"
            )

        # Check if current pose matches challenge
        challenge_met = self._check_challenge_met(pose_state, self.current_challenge)

        if challenge_met:
            self.frames_in_position += 1

            if self.frames_in_position >= self.HOLD_FRAMES:
                # Challenge completed
                self.completed_challenges.append(self.current_challenge)
                logger.info("Pose challenge completed", challenge=self.current_challenge.value)

                # Move to next challenge
                remaining = [c for c in self.challenge_sequence if c not in self.completed_challenges]
                self.current_challenge = remaining[0] if remaining else None
                self.frames_in_position = 0

                return ChallengeResult(
                    challenge=self.completed_challenges[-1],
                    completed=True,
                    current_pose=pose_state,
                    message=f"Challenge '{self.completed_challenges[-1].value}' completed!"
                )
        else:
            self.frames_in_position = 0

        return ChallengeResult(
            challenge=self.current_challenge,
            completed=False,
            current_pose=pose_state,
            message=self._get_instruction(self.current_challenge)
        )

    def _determine_direction(self, pitch: float, yaw: float) -> Optional[str]:
        """Determine head direction from pitch and yaw."""
        if abs(yaw) > self.YAW_THRESHOLD:
            return "left" if yaw > 0 else "right"
        if abs(pitch) > self.PITCH_THRESHOLD:
            return "up" if pitch > 0 else "down"
        return "center"

    def _check_challenge_met(self, pose: PoseState, challenge: PoseChallenge) -> bool:
        """Check if current pose meets challenge requirement."""
        if challenge == PoseChallenge.LOOK_LEFT:
            return pose.yaw > self.YAW_THRESHOLD
        elif challenge == PoseChallenge.LOOK_RIGHT:
            return pose.yaw < -self.YAW_THRESHOLD
        elif challenge == PoseChallenge.LOOK_UP:
            return pose.pitch > self.PITCH_THRESHOLD
        elif challenge == PoseChallenge.LOOK_DOWN:
            return pose.pitch < -self.PITCH_THRESHOLD
        elif challenge == PoseChallenge.STAY_CENTER:
            return pose.is_centered
        return False

    def _get_instruction(self, challenge: PoseChallenge) -> str:
        """Get user instruction for challenge."""
        instructions = {
            PoseChallenge.LOOK_LEFT: "Please turn your head to the LEFT",
            PoseChallenge.LOOK_RIGHT: "Please turn your head to the RIGHT",
            PoseChallenge.LOOK_UP: "Please look UP",
            PoseChallenge.LOOK_DOWN: "Please look DOWN",
            PoseChallenge.STAY_CENTER: "Please look straight at the camera",
        }
        return instructions.get(challenge, "")

    def is_complete(self) -> bool:
        """Check if all challenges are completed."""
        return (
            len(self.challenge_sequence) > 0 and
            len(self.completed_challenges) == len(self.challenge_sequence)
        )
```

### Phase 3.3: Anti-Spoofing CNN
**Duration: 2 days**

#### Task 3.3.1: Implement Anti-Spoofing Model
**File: `services/liveness_detection/anti_spoofing.py`**
```python
import numpy as np
import tensorflow as tf
import cv2
from dataclasses import dataclass
import structlog

logger = structlog.get_logger()


@dataclass
class SpoofResult:
    """Result of anti-spoofing check."""
    is_live: bool
    spoof_score: float  # 0 = definitely live, 1 = definitely spoof
    confidence: str
    details: dict


class AntiSpoofingDetector:
    """
    Anti-spoofing detection using MobileNetV2 trained on CelebA-Spoof.

    Detects:
    - Printed photos
    - Screen replay attacks
    - 3D masks (with limitations)

    Threshold: spoof_score > 0.4 triggers re-verification
    """

    SPOOF_THRESHOLD = 0.4
    INPUT_SIZE = (224, 224)

    def __init__(self, model_path: str, use_tflite: bool = False):
        """
        Initialize anti-spoofing detector.

        Args:
            model_path: Path to MobileNetV2 anti-spoof model
            use_tflite: Use TensorFlow Lite for inference
        """
        self.use_tflite = use_tflite

        if use_tflite:
            self.interpreter = tf.lite.Interpreter(model_path=model_path)
            self.interpreter.allocate_tensors()
            self.input_details = self.interpreter.get_input_details()
            self.output_details = self.interpreter.get_output_details()
            logger.info("Anti-spoofing TFLite model loaded")
        else:
            self.model = tf.keras.models.load_model(model_path)
            logger.info("Anti-spoofing Keras model loaded")

    def preprocess(self, face_image: np.ndarray) -> np.ndarray:
        """
        Preprocess face image for anti-spoofing.

        Args:
            face_image: BGR face image

        Returns:
            Preprocessed tensor
        """
        # Resize
        image = cv2.resize(face_image, self.INPUT_SIZE)

        # Convert BGR to RGB
        image = cv2.cvtColor(image, cv2.COLOR_BGR2RGB)

        # Normalize to [0, 1]
        image = image.astype(np.float32) / 255.0

        # MobileNetV2 preprocessing
        image = (image - 0.5) * 2.0  # Scale to [-1, 1]

        return image

    def detect(self, face_image: np.ndarray) -> SpoofResult:
        """
        Detect if face is live or spoofed.

        Args:
            face_image: BGR face image

        Returns:
            SpoofResult with detection details
        """
        # Preprocess
        preprocessed = self.preprocess(face_image)
        input_tensor = np.expand_dims(preprocessed, axis=0)

        # Run inference
        if self.use_tflite:
            self.interpreter.set_tensor(self.input_details[0]['index'], input_tensor)
            self.interpreter.invoke()
            output = self.interpreter.get_tensor(self.output_details[0]['index'])[0]
        else:
            output = self.model.predict(input_tensor, verbose=0)[0]

        # Output is probability of being a spoof
        spoof_score = float(output[0]) if len(output) == 1 else float(output[1])

        is_live = spoof_score < self.SPOOF_THRESHOLD

        # Determine confidence
        if spoof_score < 0.2:
            confidence = "high"
        elif spoof_score < 0.4:
            confidence = "medium"
        elif spoof_score < 0.6:
            confidence = "low"
        else:
            confidence = "spoof_detected"

        # Additional texture analysis
        texture_details = self._analyze_texture(face_image)

        logger.debug(
            "Anti-spoofing result",
            spoof_score=spoof_score,
            is_live=is_live,
            confidence=confidence
        )

        return SpoofResult(
            is_live=is_live,
            spoof_score=spoof_score,
            confidence=confidence,
            details=texture_details
        )

    def _analyze_texture(self, face_image: np.ndarray) -> dict:
        """
        Additional texture analysis for spoof detection.

        Analyzes:
        - Moiré patterns (screen replay)
        - Print artifacts
        - Reflection patterns
        """
        gray = cv2.cvtColor(face_image, cv2.COLOR_BGR2GRAY)

        # Laplacian variance (focus/sharpness)
        laplacian_var = cv2.Laplacian(gray, cv2.CV_64F).var()

        # High-frequency content (moiré detection)
        f = np.fft.fft2(gray)
        fshift = np.fft.fftshift(f)
        magnitude_spectrum = np.abs(fshift)

        # Ratio of high-frequency to total energy
        h, w = gray.shape
        center_y, center_x = h // 2, w // 2
        mask = np.zeros((h, w), dtype=np.float32)
        cv2.circle(mask, (center_x, center_y), min(center_x, center_y) // 2, 1, -1)

        low_freq_energy = np.sum(magnitude_spectrum * mask)
        total_energy = np.sum(magnitude_spectrum)
        high_freq_ratio = 1 - (low_freq_energy / total_energy) if total_energy > 0 else 0

        return {
            "laplacian_variance": float(laplacian_var),
            "high_freq_ratio": float(high_freq_ratio),
            "potential_moire": high_freq_ratio > 0.7,
            "potential_print": laplacian_var < 100
        }
```

### Phase 3.4: Combined Liveness Pipeline
**Duration: 2 days**

#### Task 3.4.1: Implement Liveness Pipeline
**File: `services/liveness_detection/pipeline.py`**
```python
import numpy as np
from dataclasses import dataclass
from typing import Optional, List
from enum import Enum
import structlog

from services.liveness_detection.eye_blink import EyeBlinkDetector, BlinkState
from services.liveness_detection.head_pose import HeadPoseValidator, ChallengeResult, PoseChallenge
from services.liveness_detection.anti_spoofing import AntiSpoofingDetector, SpoofResult

logger = structlog.get_logger()


class LivenessStep(Enum):
    """Steps in liveness verification."""
    BLINK = "blink"
    HEAD_POSE = "head_pose"
    ANTI_SPOOF = "anti_spoof"
    COMPLETE = "complete"
    FAILED = "failed"


@dataclass
class LivenessState:
    """Current state of liveness verification."""
    current_step: LivenessStep
    blink_detected: bool
    blink_count: int
    head_pose_complete: bool
    completed_poses: List[str]
    current_pose_instruction: Optional[str]
    anti_spoof_passed: bool
    spoof_score: float
    overall_passed: bool
    failure_reason: Optional[str]
    retry_count: int
    max_retries: int


class LivenessPipeline:
    """
    Combined liveness detection pipeline.

    Three-layer verification:
    1. Eye blink detection (defeats static images)
    2. Head pose challenges (defeats replay videos)
    3. Anti-spoofing CNN (defeats sophisticated attacks)

    All three must pass for verification success.
    Maximum 3 retries before alerting proctor.
    """

    MAX_RETRIES = 3
    BLINK_TIMEOUT_SECONDS = 8
    POSE_TIMEOUT_SECONDS = 15

    def __init__(self, anti_spoof_model_path: str, use_tflite: bool = False):
        """Initialize pipeline components."""
        self.blink_detector = EyeBlinkDetector()
        self.pose_validator = HeadPoseValidator()
        self.anti_spoof = AntiSpoofingDetector(anti_spoof_model_path, use_tflite)

        self.current_step = LivenessStep.BLINK
        self.retry_count = 0
        self.blink_passed = False
        self.pose_passed = False
        self.spoof_passed = False
        self.last_spoof_score = 0.0

    def reset(self):
        """Reset pipeline for new verification."""
        self.blink_detector.reset()
        self.pose_validator.reset()
        self.current_step = LivenessStep.BLINK
        self.blink_passed = False
        self.pose_passed = False
        self.spoof_passed = False
        self.last_spoof_score = 0.0
        # Don't reset retry_count - that persists across attempts

    def start_verification(self) -> LivenessState:
        """
        Start a new liveness verification session.

        Returns:
            Initial LivenessState
        """
        self.reset()

        # Generate random pose challenges
        self.pose_validator.generate_challenge_sequence(num_challenges=2)

        logger.info("Liveness verification started")

        return self._get_current_state()

    def process_frame(
        self,
        face_image: np.ndarray,
        landmarks: np.ndarray,
        image_width: int,
        image_height: int
    ) -> LivenessState:
        """
        Process a single frame through the liveness pipeline.

        Args:
            face_image: Cropped face image (BGR)
            landmarks: 68-point facial landmarks
            image_width: Full image width
            image_height: Full image height

        Returns:
            Updated LivenessState
        """
        # Always run anti-spoofing on every frame
        spoof_result = self.anti_spoof.detect(face_image)
        self.last_spoof_score = spoof_result.spoof_score

        # If spoof detected, fail immediately
        if not spoof_result.is_live:
            logger.warning("Spoof detected", score=spoof_result.spoof_score)
            return self._handle_failure("Spoof attack detected")

        # Process based on current step
        if self.current_step == LivenessStep.BLINK:
            return self._process_blink_step(landmarks)

        elif self.current_step == LivenessStep.HEAD_POSE:
            return self._process_pose_step(landmarks, image_width, image_height)

        elif self.current_step == LivenessStep.ANTI_SPOOF:
            # Final spoof check passed
            self.spoof_passed = True
            self.current_step = LivenessStep.COMPLETE
            logger.info("Liveness verification passed")

        return self._get_current_state()

    def _process_blink_step(self, landmarks: np.ndarray) -> LivenessState:
        """Process blink detection step."""
        blink_state = self.blink_detector.process_frame(landmarks)

        if blink_state.blink_count >= 1:
            self.blink_passed = True
            self.current_step = LivenessStep.HEAD_POSE
            logger.info("Blink detection passed", blinks=blink_state.blink_count)

        # Check for unnatural pattern (static image)
        if not self.blink_detector.check_natural_blink_pattern():
            return self._handle_failure("Unnatural eye pattern detected")

        return self._get_current_state()

    def _process_pose_step(
        self,
        landmarks: np.ndarray,
        image_width: int,
        image_height: int
    ) -> LivenessState:
        """Process head pose challenge step."""
        result = self.pose_validator.process_frame(landmarks, image_width, image_height)

        if self.pose_validator.is_complete():
            self.pose_passed = True
            self.current_step = LivenessStep.ANTI_SPOOF
            logger.info("Head pose challenges passed")

        return self._get_current_state()

    def _handle_failure(self, reason: str) -> LivenessState:
        """Handle verification failure."""
        self.retry_count += 1

        if self.retry_count >= self.MAX_RETRIES:
            self.current_step = LivenessStep.FAILED
            logger.error("Liveness verification failed", reason=reason, retries=self.retry_count)
        else:
            # Reset for retry
            self.reset()
            self.pose_validator.generate_challenge_sequence(num_challenges=2)
            logger.warning("Liveness retry", reason=reason, retry=self.retry_count)

        state = self._get_current_state()
        state.failure_reason = reason
        return state

    def _get_current_state(self) -> LivenessState:
        """Get current pipeline state."""
        current_instruction = None
        if self.current_step == LivenessStep.BLINK:
            current_instruction = "Please blink naturally"
        elif self.current_step == LivenessStep.HEAD_POSE and self.pose_validator.current_challenge:
            current_instruction = self.pose_validator._get_instruction(
                self.pose_validator.current_challenge
            )

        return LivenessState(
            current_step=self.current_step,
            blink_detected=self.blink_passed,
            blink_count=self.blink_detector.blink_count,
            head_pose_complete=self.pose_passed,
            completed_poses=[c.value for c in self.pose_validator.completed_challenges],
            current_pose_instruction=current_instruction,
            anti_spoof_passed=self.spoof_passed,
            spoof_score=self.last_spoof_score,
            overall_passed=self.current_step == LivenessStep.COMPLETE,
            failure_reason=None,
            retry_count=self.retry_count,
            max_retries=self.MAX_RETRIES
        )
```

**Deliverables:**
- [ ] Eye blink detection with EAR
- [ ] Head pose challenges (random sequence)
- [ ] MobileNetV2 anti-spoofing
- [ ] Combined pipeline with AND logic
- [ ] Retry mechanism (max 3)

---

## Phase 4: Real-time Monitoring

### Duration: Week 7-8

### Phase 4.1: Session Manager
**Duration: 2 days**

#### Task 4.1.1: Implement Session Manager
**File: `services/monitoring/session_manager.py`**
```python
import asyncio
from dataclasses import dataclass, field
from datetime import datetime
from typing import Dict, Optional, List
from enum import Enum
import structlog

logger = structlog.get_logger()


class SessionStatus(Enum):
    """Status of monitoring session."""
    INITIALIZING = "initializing"
    VERIFYING = "verifying"
    ACTIVE = "active"
    WARNING = "warning"
    ALERT = "alert"
    COMPLETED = "completed"
    TERMINATED = "terminated"


@dataclass
class VerificationEvent:
    """Single verification event during exam."""
    timestamp: datetime
    match_score: float
    liveness_passed: bool
    spoof_score: float
    is_verified: bool
    failure_reason: Optional[str] = None


@dataclass
class MonitoringSession:
    """Active monitoring session for a student."""
    attempt_id: str
    student_id: str
    exam_id: str
    status: SessionStatus
    started_at: datetime
    last_verification_at: Optional[datetime] = None
    verification_count: int = 0
    failed_verifications: int = 0
    consecutive_failures: int = 0
    alerts_raised: int = 0
    events: List[VerificationEvent] = field(default_factory=list)


class SessionManager:
    """
    Manages active monitoring sessions for all ongoing exams.

    Features:
    - Real-time session tracking
    - Periodic verification scheduling (every 30 seconds)
    - Alert threshold monitoring
    - Session statistics
    """

    VERIFICATION_INTERVAL_SECONDS = 30
    CONSECUTIVE_FAILURE_THRESHOLD = 3
    TOTAL_FAILURE_THRESHOLD = 5

    def __init__(self):
        """Initialize session manager."""
        self.sessions: Dict[str, MonitoringSession] = {}
        self._verification_tasks: Dict[str, asyncio.Task] = {}

    async def create_session(
        self,
        attempt_id: str,
        student_id: str,
        exam_id: str
    ) -> MonitoringSession:
        """
        Create a new monitoring session.

        Args:
            attempt_id: Exam attempt ID
            student_id: Student ID
            exam_id: Exam ID

        Returns:
            Created MonitoringSession
        """
        session = MonitoringSession(
            attempt_id=attempt_id,
            student_id=student_id,
            exam_id=exam_id,
            status=SessionStatus.INITIALIZING,
            started_at=datetime.utcnow()
        )

        self.sessions[attempt_id] = session
        logger.info("Monitoring session created", attempt_id=attempt_id, student_id=student_id)

        return session

    def get_session(self, attempt_id: str) -> Optional[MonitoringSession]:
        """Get session by attempt ID."""
        return self.sessions.get(attempt_id)

    def get_exam_sessions(self, exam_id: str) -> List[MonitoringSession]:
        """Get all sessions for an exam."""
        return [s for s in self.sessions.values() if s.exam_id == exam_id]

    async def record_verification(
        self,
        attempt_id: str,
        match_score: float,
        liveness_passed: bool,
        spoof_score: float,
        failure_reason: Optional[str] = None
    ) -> MonitoringSession:
        """
        Record a verification result.

        Args:
            attempt_id: Exam attempt ID
            match_score: Face match score (0-1)
            liveness_passed: Whether liveness check passed
            spoof_score: Spoof detection score (0-1)
            failure_reason: Reason for failure if any

        Returns:
            Updated session
        """
        session = self.sessions.get(attempt_id)
        if not session:
            raise ValueError(f"Session not found: {attempt_id}")

        is_verified = match_score >= 0.80 and liveness_passed and spoof_score < 0.4

        event = VerificationEvent(
            timestamp=datetime.utcnow(),
            match_score=match_score,
            liveness_passed=liveness_passed,
            spoof_score=spoof_score,
            is_verified=is_verified,
            failure_reason=failure_reason
        )

        session.events.append(event)
        session.verification_count += 1
        session.last_verification_at = event.timestamp

        if is_verified:
            session.consecutive_failures = 0
            session.status = SessionStatus.ACTIVE
        else:
            session.failed_verifications += 1
            session.consecutive_failures += 1

            # Check alert thresholds
            if session.consecutive_failures >= self.CONSECUTIVE_FAILURE_THRESHOLD:
                session.status = SessionStatus.ALERT
                session.alerts_raised += 1
                logger.warning(
                    "Alert raised: consecutive failures",
                    attempt_id=attempt_id,
                    consecutive=session.consecutive_failures
                )
            elif session.failed_verifications >= self.TOTAL_FAILURE_THRESHOLD:
                session.status = SessionStatus.WARNING

        logger.info(
            "Verification recorded",
            attempt_id=attempt_id,
            is_verified=is_verified,
            match_score=match_score
        )

        return session

    async def end_session(self, attempt_id: str) -> Optional[MonitoringSession]:
        """
        End a monitoring session.

        Args:
            attempt_id: Exam attempt ID

        Returns:
            Final session state
        """
        session = self.sessions.get(attempt_id)
        if not session:
            return None

        session.status = SessionStatus.COMPLETED

        # Cancel verification task if running
        if attempt_id in self._verification_tasks:
            self._verification_tasks[attempt_id].cancel()
            del self._verification_tasks[attempt_id]

        logger.info(
            "Monitoring session ended",
            attempt_id=attempt_id,
            verifications=session.verification_count,
            failures=session.failed_verifications
        )

        return session

    def get_session_statistics(self, attempt_id: str) -> dict:
        """Get statistics for a session."""
        session = self.sessions.get(attempt_id)
        if not session:
            return {}

        if not session.events:
            return {
                "verification_count": 0,
                "pass_rate": 0.0,
                "average_match_score": 0.0,
                "average_spoof_score": 0.0,
            }

        passed = sum(1 for e in session.events if e.is_verified)
        avg_match = sum(e.match_score for e in session.events) / len(session.events)
        avg_spoof = sum(e.spoof_score for e in session.events) / len(session.events)

        return {
            "verification_count": session.verification_count,
            "pass_rate": passed / len(session.events) * 100,
            "average_match_score": avg_match,
            "average_spoof_score": avg_spoof,
            "alerts_raised": session.alerts_raised,
            "status": session.status.value,
        }
```

### Phase 4.2: Alert Service
**Duration: 2 days**

#### Task 4.2.1: Implement Alert Service
**File: `services/monitoring/alert_service.py`**
```python
from dataclasses import dataclass
from datetime import datetime
from typing import Optional, List, Callable, Awaitable
from enum import Enum
import structlog
import httpx

logger = structlog.get_logger()


class AlertType(Enum):
    """Types of monitoring alerts."""
    FACE_MISMATCH = "face_mismatch"
    MULTIPLE_FACES = "multiple_faces"
    NO_FACE_DETECTED = "no_face_detected"
    LIVENESS_FAILED = "liveness_failed"
    PROLONGED_ABSENCE = "prolonged_absence"
    HEAD_ROTATION = "head_rotation"
    SPOOF_DETECTED = "spoof_detected"
    SUSPICIOUS_BEHAVIOR = "suspicious_behavior"


class AlertSeverity(Enum):
    """Severity levels for alerts."""
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    CRITICAL = "critical"


@dataclass
class Alert:
    """Monitoring alert."""
    id: str
    attempt_id: str
    type: AlertType
    severity: AlertSeverity
    message: str
    metadata: dict
    timestamp: datetime
    acknowledged: bool = False
    acknowledged_at: Optional[datetime] = None
    acknowledged_by: Optional[str] = None


class AlertService:
    """
    Alert generation and notification service.

    Generates alerts based on verification failures and
    notifies the backend/proctor dashboard via WebSocket.
    """

    # Alert severity mapping
    SEVERITY_MAP = {
        AlertType.FACE_MISMATCH: AlertSeverity.HIGH,
        AlertType.MULTIPLE_FACES: AlertSeverity.HIGH,
        AlertType.NO_FACE_DETECTED: AlertSeverity.MEDIUM,
        AlertType.LIVENESS_FAILED: AlertSeverity.HIGH,
        AlertType.PROLONGED_ABSENCE: AlertSeverity.MEDIUM,
        AlertType.HEAD_ROTATION: AlertSeverity.LOW,
        AlertType.SPOOF_DETECTED: AlertSeverity.CRITICAL,
        AlertType.SUSPICIOUS_BEHAVIOR: AlertSeverity.MEDIUM,
    }

    # Alert message templates
    MESSAGE_TEMPLATES = {
        AlertType.FACE_MISMATCH: "Face does not match enrolled template (score: {score:.2f})",
        AlertType.MULTIPLE_FACES: "Multiple faces detected in frame ({count} faces)",
        AlertType.NO_FACE_DETECTED: "No face detected in frame",
        AlertType.LIVENESS_FAILED: "Liveness check failed: {reason}",
        AlertType.PROLONGED_ABSENCE: "Student absent from frame for {seconds} seconds",
        AlertType.HEAD_ROTATION: "Sustained head rotation away from screen",
        AlertType.SPOOF_DETECTED: "Potential spoofing attack detected (score: {score:.2f})",
        AlertType.SUSPICIOUS_BEHAVIOR: "Suspicious behavior detected: {description}",
    }

    def __init__(self, backend_url: str, api_key: str):
        """
        Initialize alert service.

        Args:
            backend_url: URL of backend API
            api_key: API key for authentication
        """
        self.backend_url = backend_url
        self.api_key = api_key
        self.pending_alerts: List[Alert] = []
        self._alert_callbacks: List[Callable[[Alert], Awaitable[None]]] = []

    def register_callback(self, callback: Callable[[Alert], Awaitable[None]]):
        """Register callback for alert notifications."""
        self._alert_callbacks.append(callback)

    async def create_alert(
        self,
        attempt_id: str,
        alert_type: AlertType,
        metadata: Optional[dict] = None
    ) -> Alert:
        """
        Create and send an alert.

        Args:
            attempt_id: Exam attempt ID
            alert_type: Type of alert
            metadata: Additional alert data

        Returns:
            Created Alert
        """
        import uuid

        metadata = metadata or {}

        alert = Alert(
            id=str(uuid.uuid4()),
            attempt_id=attempt_id,
            type=alert_type,
            severity=self.SEVERITY_MAP.get(alert_type, AlertSeverity.MEDIUM),
            message=self._format_message(alert_type, metadata),
            metadata=metadata,
            timestamp=datetime.utcnow()
        )

        logger.warning(
            "Alert created",
            alert_id=alert.id,
            attempt_id=attempt_id,
            type=alert_type.value,
            severity=alert.severity.value
        )

        # Send to backend
        await self._send_to_backend(alert)

        # Notify callbacks (WebSocket, etc.)
        for callback in self._alert_callbacks:
            try:
                await callback(alert)
            except Exception as e:
                logger.error("Alert callback failed", error=str(e))

        return alert

    def _format_message(self, alert_type: AlertType, metadata: dict) -> str:
        """Format alert message from template."""
        template = self.MESSAGE_TEMPLATES.get(
            alert_type,
            "Alert: {type}"
        )
        try:
            return template.format(type=alert_type.value, **metadata)
        except KeyError:
            return template

    async def _send_to_backend(self, alert: Alert):
        """Send alert to backend API."""
        try:
            async with httpx.AsyncClient() as client:
                response = await client.post(
                    f"{self.backend_url}/api/monitoring/alerts",
                    json={
                        "attemptId": alert.attempt_id,
                        "type": alert.type.value,
                        "severity": alert.severity.value,
                        "message": alert.message,
                        "metadata": alert.metadata,
                        "timestamp": alert.timestamp.isoformat(),
                    },
                    headers={"Authorization": f"Bearer {self.api_key}"},
                    timeout=5.0
                )

                if response.status_code != 201:
                    logger.error(
                        "Failed to send alert to backend",
                        status=response.status_code,
                        response=response.text
                    )
        except Exception as e:
            logger.error("Error sending alert to backend", error=str(e))
            self.pending_alerts.append(alert)

    async def retry_pending_alerts(self):
        """Retry sending pending alerts."""
        while self.pending_alerts:
            alert = self.pending_alerts.pop(0)
            await self._send_to_backend(alert)
```

**Deliverables:**
- [ ] Session manager for tracking active exams
- [ ] Verification event logging
- [ ] Alert threshold detection
- [ ] Alert service with backend integration
- [ ] WebSocket notification support

---

## Phase 5: Edge Deployment

### Duration: Week 9-10

### Phase 5.1: Raspberry Pi Client
**Duration: 3 days**

#### Task 5.1.1: Edge Client Implementation
**File: `edge-client/main.py`**
```python
"""
SEAS Edge Client for Raspberry Pi 4
Handles camera capture, local inference, and server communication.
"""

import asyncio
import cv2
import numpy as np
from picamera2 import Picamera2
import websockets
import json
import base64
from datetime import datetime
import structlog

from inference.face_detector import EdgeFaceDetector
from inference.face_embedder import EdgeFaceEmbedder
from inference.liveness import EdgeLivenessPipeline

logger = structlog.get_logger()


class EdgeClient:
    """
    Edge client running on Raspberry Pi 4.

    Performs local inference and sends results to server.
    """

    def __init__(self, config: dict):
        """
        Initialize edge client.

        Args:
            config: Configuration dictionary
        """
        self.config = config
        self.server_url = config["server_url"]
        self.station_id = config["station_id"]

        # Initialize camera
        self.camera = Picamera2()
        camera_config = self.camera.create_still_configuration(
            main={"size": (1920, 1080), "format": "RGB888"}
        )
        self.camera.configure(camera_config)

        # Initialize models (TFLite)
        self.face_detector = EdgeFaceDetector(
            config["models"]["landmark_predictor"]
        )
        self.face_embedder = EdgeFaceEmbedder(
            config["models"]["facenet_tflite"]
        )
        self.liveness = EdgeLivenessPipeline(
            config["models"]["anti_spoof_tflite"]
        )

        self.websocket = None
        self.current_session = None
        self.running = False

    async def start(self):
        """Start the edge client."""
        self.running = True
        self.camera.start()

        logger.info("Edge client started", station_id=self.station_id)

        # Connect to server
        await self._connect_to_server()

        # Main loop
        while self.running:
            try:
                await self._process_frame()
                await asyncio.sleep(0.033)  # ~30 FPS
            except Exception as e:
                logger.error("Frame processing error", error=str(e))
                await asyncio.sleep(1)

    async def stop(self):
        """Stop the edge client."""
        self.running = False
        self.camera.stop()
        if self.websocket:
            await self.websocket.close()
        logger.info("Edge client stopped")

    async def _connect_to_server(self):
        """Establish WebSocket connection to server."""
        while self.running:
            try:
                self.websocket = await websockets.connect(
                    f"{self.server_url}/ws/edge/{self.station_id}"
                )
                logger.info("Connected to server")

                # Handle incoming messages
                asyncio.create_task(self._handle_server_messages())
                break
            except Exception as e:
                logger.error("Failed to connect to server", error=str(e))
                await asyncio.sleep(5)

    async def _handle_server_messages(self):
        """Handle messages from server."""
        try:
            async for message in self.websocket:
                data = json.loads(message)

                if data["type"] == "start_session":
                    await self._start_session(data["payload"])
                elif data["type"] == "end_session":
                    await self._end_session()
                elif data["type"] == "verify_now":
                    await self._run_verification()
        except websockets.ConnectionClosed:
            logger.warning("Server connection closed")
            await self._connect_to_server()

    async def _start_session(self, payload: dict):
        """Start a new verification session."""
        self.current_session = {
            "attempt_id": payload["attempt_id"],
            "student_id": payload["student_id"],
            "template": np.frombuffer(
                base64.b64decode(payload["face_template"]),
                dtype=np.float32
            ),
            "verification_interval": payload.get("interval", 30),
            "last_verification": None
        }

        self.liveness.start_verification()
        logger.info("Session started", attempt_id=payload["attempt_id"])

    async def _end_session(self):
        """End current session."""
        if self.current_session:
            logger.info("Session ended", attempt_id=self.current_session["attempt_id"])
            self.current_session = None

    async def _process_frame(self):
        """Process a single camera frame."""
        if not self.current_session:
            return

        # Capture frame
        frame = self.camera.capture_array()
        frame_bgr = cv2.cvtColor(frame, cv2.COLOR_RGB2BGR)

        # Face detection
        detection_result = self.face_detector.detect(frame_bgr)

        if len(detection_result.faces) == 0:
            await self._send_event("no_face")
            return

        if len(detection_result.faces) > 1:
            await self._send_event("multiple_faces", {"count": len(detection_result.faces)})
            return

        face = detection_result.faces[0]
        face_image = self.face_detector.extract_face(frame_bgr, face)

        # Process liveness
        liveness_state = self.liveness.process_frame(
            face_image,
            face.landmarks,
            frame_bgr.shape[1],
            frame_bgr.shape[0]
        )

        # Check if verification interval has passed
        now = datetime.utcnow()
        should_verify = (
            self.current_session["last_verification"] is None or
            (now - self.current_session["last_verification"]).seconds >=
            self.current_session["verification_interval"]
        )

        if should_verify and liveness_state.overall_passed:
            await self._run_verification(face_image)

        # Send liveness state update
        await self._send_event("liveness_update", {
            "step": liveness_state.current_step.value,
            "instruction": liveness_state.current_pose_instruction,
            "blink_count": liveness_state.blink_count,
            "spoof_score": liveness_state.spoof_score
        })

    async def _run_verification(self, face_image: np.ndarray = None):
        """Run face verification."""
        if face_image is None:
            frame = self.camera.capture_array()
            frame_bgr = cv2.cvtColor(frame, cv2.COLOR_RGB2BGR)
            result = self.face_detector.detect(frame_bgr)
            if not result.faces:
                return
            face_image = self.face_detector.extract_face(frame_bgr, result.faces[0])

        # Get embedding
        embedding = self.face_embedder.get_embedding(face_image)

        # Compare with template
        similarity = float(np.dot(embedding, self.current_session["template"]))

        self.current_session["last_verification"] = datetime.utcnow()

        # Send verification result
        await self._send_event("verification_result", {
            "match_score": similarity,
            "is_verified": similarity >= 0.80,
            "timestamp": self.current_session["last_verification"].isoformat()
        })

    async def _send_event(self, event_type: str, payload: dict = None):
        """Send event to server."""
        if not self.websocket or not self.current_session:
            return

        message = {
            "type": event_type,
            "attempt_id": self.current_session["attempt_id"],
            "station_id": self.station_id,
            "timestamp": datetime.utcnow().isoformat(),
            "payload": payload or {}
        }

        await self.websocket.send(json.dumps(message))


if __name__ == "__main__":
    import yaml

    with open("config.yaml") as f:
        config = yaml.safe_load(f)

    client = EdgeClient(config)
    asyncio.run(client.start())
```

**Deliverables:**
- [ ] Raspberry Pi camera integration
- [ ] TFLite model inference
- [ ] WebSocket communication with server
- [ ] Session management
- [ ] Continuous verification loop

---

## API Specifications

### Enrollment API

```yaml
POST /api/enrollment/capture
  Request:
    student_id: string
    pose: "front" | "left" | "right" | "up" | "down"
    image: base64_string
  Response:
    success: boolean
    pose: string
    face_detected: boolean
    quality_score: float
    message: string

POST /api/enrollment/complete
  Request:
    student_id: string
    images: base64_string[]
  Response:
    success: boolean
    student_id: string
    embeddings_count: int
    template_size_bytes: int
```

### Verification API

```yaml
POST /api/verification/verify
  Request:
    attempt_id: string
    image: base64_string
    face_template: base64_string
  Response:
    success: boolean
    is_verified: boolean
    match_score: float
    liveness_passed: boolean
    spoof_score: float
    failure_reason: string | null

POST /api/verification/liveness
  Request:
    attempt_id: string
    image: base64_string
    landmarks: number[][]
  Response:
    current_step: string
    instruction: string
    blink_detected: boolean
    pose_complete: boolean
    overall_passed: boolean
```

---

## Performance Requirements

| Metric | Target | Notes |
|--------|--------|-------|
| Face Detection | < 50ms | Per frame |
| Landmark Extraction | < 30ms | Per face |
| Face Embedding | < 350ms | FaceNet on Pi 4 |
| Liveness Check | < 100ms | All 3 layers |
| Total Verification | < 2s | End-to-end |
| API Response | < 200ms | Server-side |
| WebSocket Latency | < 200ms | Alert delivery |

---

## Task Summary

### Phase 1: Foundation (Week 1-2)
| Task | Status | Duration |
|------|--------|----------|
| 1.1.1 Initialize Python Project | [ ] | 1 day |
| 1.1.2 Create Project Structure | [ ] | 0.5 day |
| 1.1.3 Create FastAPI Application | [ ] | 0.5 day |
| 1.2.1 Implement Face Detector | [ ] | 1.5 days |
| 1.2.2 Implement Landmark Extractor | [ ] | 1 day |
| 1.3.1 Implement Detection Endpoints | [ ] | 1.5 days |

### Phase 2: Face Recognition (Week 3-4)
| Task | Status | Duration |
|------|--------|----------|
| 2.1.1 Implement FaceNet Embedder | [ ] | 2 days |
| 2.1.2 Implement Face Matcher | [ ] | 1 day |
| 2.2.1 Implement Enrollment Endpoints | [ ] | 2 days |

### Phase 3: Liveness Detection (Week 5-6)
| Task | Status | Duration |
|------|--------|----------|
| 3.1.1 Implement Eye Blink Detector | [ ] | 2 days |
| 3.2.1 Implement Head Pose Validator | [ ] | 2 days |
| 3.3.1 Implement Anti-Spoofing Model | [ ] | 2 days |
| 3.4.1 Implement Liveness Pipeline | [ ] | 2 days |

### Phase 4: Monitoring (Week 7-8)
| Task | Status | Duration |
|------|--------|----------|
| 4.1.1 Implement Session Manager | [ ] | 2 days |
| 4.2.1 Implement Alert Service | [ ] | 2 days |

### Phase 5: Edge Deployment (Week 9-10)
| Task | Status | Duration |
|------|--------|----------|
| 5.1.1 Edge Client Implementation | [ ] | 3 days |
| 5.1.2 TFLite Model Conversion | [ ] | 2 days |
| 5.1.3 Raspberry Pi Setup & Testing | [ ] | 2 days |
