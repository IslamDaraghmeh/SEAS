"""
Configuration settings for SEAS Image Processing Service
"""

from pydantic_settings import BaseSettings
from pydantic import Field
from typing import Optional
import os


class Settings(BaseSettings):
    """Application settings with environment variable support"""

    # Service configuration
    SERVICE_NAME: str = "SEAS Image Processing Service"
    SERVICE_VERSION: str = "1.0.0"
    DEBUG: bool = Field(default=False, description="Enable debug mode")
    HOST: str = Field(default="0.0.0.0", description="Server host")
    PORT: int = Field(default=8000, description="Server port")

    # CORS settings
    CORS_ORIGINS: list[str] = Field(
        default=["http://localhost:3000", "http://localhost:3001", "http://localhost:5173"],
        description="Allowed CORS origins"
    )

    # Model paths
    DLIB_FACE_PREDICTOR_PATH: str = Field(
        default="models/shape_predictor_68_face_landmarks.dat",
        description="Path to dlib face predictor model"
    )
    DLIB_FACE_RECOGNITION_MODEL_PATH: str = Field(
        default="models/dlib_face_recognition_resnet_model_v1.dat",
        description="Path to dlib face recognition model"
    )
    ANTI_SPOOF_MODEL_PATH: str = Field(
        default="models/anti_spoof_model.h5",
        description="Path to anti-spoofing model"
    )

    # Face detection thresholds
    FACE_DETECTION_UPSAMPLE: int = Field(
        default=1,
        description="Number of times to upsample image for face detection"
    )
    MIN_FACE_SIZE: int = Field(
        default=80,
        description="Minimum face size in pixels"
    )

    # Face matching thresholds
    FACE_MATCH_THRESHOLD: float = Field(
        default=0.6,
        description="Threshold for face match (cosine similarity)"
    )
    FACE_MATCH_STRICT_THRESHOLD: float = Field(
        default=0.7,
        description="Strict threshold for high-security scenarios"
    )

    # Liveness detection thresholds
    LIVENESS_THRESHOLD: float = Field(
        default=0.5,
        description="Threshold for liveness score"
    )
    SPOOF_THRESHOLD: float = Field(
        default=0.5,
        description="Threshold for spoof detection (below = real)"
    )

    # Eye Aspect Ratio (EAR) for blink detection
    EAR_THRESHOLD: float = Field(
        default=0.25,
        description="EAR threshold for detecting blink"
    )
    EAR_CONSEC_FRAMES: int = Field(
        default=2,
        description="Consecutive frames below EAR threshold for blink"
    )

    # Head pose thresholds (in degrees)
    HEAD_POSE_YAW_THRESHOLD: float = Field(
        default=30.0,
        description="Maximum yaw angle for valid head pose"
    )
    HEAD_POSE_PITCH_THRESHOLD: float = Field(
        default=30.0,
        description="Maximum pitch angle for valid head pose"
    )
    HEAD_POSE_ROLL_THRESHOLD: float = Field(
        default=25.0,
        description="Maximum roll angle for valid head pose"
    )

    # Mouth Aspect Ratio (MAR) for lip movement detection
    MAR_THRESHOLD: float = Field(
        default=0.5,
        description="MAR threshold for detecting open mouth"
    )
    MAR_CHANGE_THRESHOLD: float = Field(
        default=0.2,
        description="Minimum MAR change to detect lip movement"
    )

    # Nod Detection thresholds
    NOD_PITCH_CHANGE_MIN: float = Field(
        default=15.0,
        description="Minimum pitch change in degrees for nod detection"
    )
    NOD_PITCH_CHANGE_MAX: float = Field(
        default=45.0,
        description="Maximum pitch change to prevent extreme movement"
    )

    # Motion Detection settings
    MOTION_FRAME_COUNT: int = Field(
        default=30,
        description="Number of frames to capture for motion detection (3 sec at 10fps)"
    )
    MOTION_FRAME_INTERVAL_MS: int = Field(
        default=100,
        description="Interval between frames in milliseconds"
    )

    # Image processing settings
    MAX_IMAGE_SIZE: int = Field(
        default=10 * 1024 * 1024,  # 10MB
        description="Maximum image size in bytes"
    )
    TARGET_FACE_SIZE: int = Field(
        default=160,
        description="Target face size for normalization"
    )

    # Backend service URL
    BACKEND_URL: str = Field(
        default="http://localhost:3000",
        description="NestJS backend service URL"
    )

    # Storage settings
    FACE_TEMPLATES_DIR: str = Field(
        default="data/face_templates",
        description="Directory to store face templates"
    )

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"
        case_sensitive = True


# Create global settings instance
settings = Settings()


# Ensure directories exist
def ensure_directories():
    """Create necessary directories if they don't exist"""
    directories = [
        settings.FACE_TEMPLATES_DIR,
        "models",
        "logs"
    ]
    for directory in directories:
        os.makedirs(directory, exist_ok=True)


# 3D model points for head pose estimation (standard face model)
MODEL_POINTS_3D = [
    (0.0, 0.0, 0.0),             # Nose tip
    (0.0, -330.0, -65.0),        # Chin
    (-225.0, 170.0, -135.0),     # Left eye left corner
    (225.0, 170.0, -135.0),      # Right eye right corner
    (-150.0, -150.0, -125.0),    # Left mouth corner
    (150.0, -150.0, -125.0)      # Right mouth corner
]

# Facial landmark indices for dlib 68-point model
LANDMARK_INDICES = {
    "left_eye": list(range(36, 42)),
    "right_eye": list(range(42, 48)),
    "nose": list(range(27, 36)),
    "mouth": list(range(48, 68)),
    "left_eyebrow": list(range(17, 22)),
    "right_eyebrow": list(range(22, 27)),
    "jaw": list(range(0, 17)),
    # Key points for head pose estimation
    "nose_tip": 30,
    "chin": 8,
    "left_eye_left_corner": 36,
    "right_eye_right_corner": 45,
    "left_mouth_corner": 48,
    "right_mouth_corner": 54
}

# MediaPipe mouth landmarks for MAR calculation
MEDIAPIPE_MOUTH_INDICES = {
    # Outer lip landmarks
    "upper_lip_top": [61, 185, 40, 39, 37, 0, 267, 269, 270, 409, 291],
    "lower_lip_bottom": [146, 91, 181, 84, 17, 314, 405, 321, 375, 291],
    # Key mouth corners for width calculation
    "mouth_left": 61,
    "mouth_right": 291,
    # Inner lip landmarks for mouth opening detection
    "upper_lip_inner": [78, 191, 80, 81, 82, 13, 312, 311, 310, 415, 308],
    "lower_lip_inner": [78, 95, 88, 178, 87, 14, 317, 402, 318, 324, 308],
}
