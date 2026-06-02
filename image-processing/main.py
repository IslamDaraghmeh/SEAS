"""
SEAS Image Processing Service - Main Application

FastAPI-based service for face recognition and liveness detection.
Provides endpoints for:
- Face detection and landmark extraction
- Face encoding and comparison
- Blink detection using Eye Aspect Ratio (EAR)
- Head pose estimation
- Anti-spoofing checks
- Combined verification pipeline
"""

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from contextlib import asynccontextmanager
import uvicorn
from loguru import logger
import sys
import os

# Add parent directory to path for imports
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from config import settings, ensure_directories
from app.models.schemas import HealthResponse, ErrorResponse


# Configure logging
logger.remove()
logger.add(
    sys.stdout,
    format="<green>{time:YYYY-MM-DD HH:mm:ss}</green> | <level>{level: <8}</level> | <cyan>{name}</cyan>:<cyan>{function}</cyan>:<cyan>{line}</cyan> - <level>{message}</level>",
    level="DEBUG" if settings.DEBUG else "INFO"
)
logger.add(
    "logs/app.log",
    rotation="10 MB",
    retention="7 days",
    level="DEBUG"
)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan handler for startup and shutdown"""
    # Startup
    logger.info(f"Starting {settings.SERVICE_NAME} v{settings.SERVICE_VERSION}")

    # Ensure required directories exist
    ensure_directories()

    # Initialize services (they use singleton pattern)
    from app.services.face_detection import face_detection_service
    from app.services.face_recognition import face_recognition_service
    from app.services.liveness_detection import liveness_detection_service

    logger.info("Services initialized")
    logger.info(f"MediaPipe available: {face_detection_service.mediapipe_available}")
    logger.info(f"Face mesh available: {face_detection_service.face_mesh is not None}")

    yield

    # Shutdown
    logger.info("Shutting down service")


# Create FastAPI application
app = FastAPI(
    title=settings.SERVICE_NAME,
    description="""
    ## SEAS Image Processing Service

    Provides face recognition and liveness detection for the Smart Exam Attendance System.

    ### Features:
    - **Face Detection**: Detect faces using dlib's HOG detector
    - **Face Encoding**: Extract 128-dimensional face embeddings
    - **Face Comparison**: Compare faces using cosine similarity
    - **Blink Detection**: Detect eye blinks using Eye Aspect Ratio (EAR)
    - **Head Pose Estimation**: Estimate head orientation using solvePnP
    - **Anti-Spoofing**: Detect photo/screen attacks
    - **Combined Verification**: Full verification pipeline

    ### Usage:
    All endpoints accept base64-encoded images and return JSON responses.
    """,
    version=settings.SERVICE_VERSION,
    lifespan=lifespan,
    docs_url="/docs",
    redoc_url="/redoc"
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Global exception handler
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    """Handle uncaught exceptions"""
    logger.error(f"Unhandled exception: {exc}")
    return JSONResponse(
        status_code=500,
        content={
            "success": False,
            "error": "Internal server error",
            "detail": str(exc) if settings.DEBUG else None
        }
    )


# Health check endpoint
@app.get("/health", response_model=HealthResponse, tags=["Health"])
async def health_check():
    """
    Health check endpoint

    Returns service status and model availability.
    """
    from app.services.face_detection import face_detection_service
    from app.services.face_recognition import face_recognition_service

    # Check model availability
    mediapipe_available = face_detection_service.mediapipe_available
    models_loaded = mediapipe_available and face_detection_service.face_mesh is not None

    # Check TensorFlow
    try:
        import tensorflow as tf
        tf_available = True
    except ImportError:
        tf_available = False

    return HealthResponse(
        status="healthy",
        service=settings.SERVICE_NAME,
        version=settings.SERVICE_VERSION,
        models_loaded=models_loaded,
        mediapipe_available=mediapipe_available,
        tensorflow_available=tf_available
    )


@app.get("/", tags=["Health"])
async def root():
    """Root endpoint - service info"""
    return {
        "service": settings.SERVICE_NAME,
        "version": settings.SERVICE_VERSION,
        "status": "running",
        "docs": "/docs",
        "health": "/health"
    }


# Import and mount routers
from app.routers import face_router, liveness_router, verification_router

app.include_router(face_router)
app.include_router(liveness_router)
app.include_router(verification_router)


# Additional utility endpoints
@app.get("/config", tags=["Config"])
async def get_config():
    """
    Get current configuration (non-sensitive values only)
    """
    return {
        "face_match_threshold": settings.FACE_MATCH_THRESHOLD,
        "face_match_strict_threshold": settings.FACE_MATCH_STRICT_THRESHOLD,
        "liveness_threshold": settings.LIVENESS_THRESHOLD,
        "spoof_threshold": settings.SPOOF_THRESHOLD,
        "ear_threshold": settings.EAR_THRESHOLD,
        "ear_consec_frames": settings.EAR_CONSEC_FRAMES,
        "head_pose_yaw_threshold": settings.HEAD_POSE_YAW_THRESHOLD,
        "head_pose_pitch_threshold": settings.HEAD_POSE_PITCH_THRESHOLD,
        "head_pose_roll_threshold": settings.HEAD_POSE_ROLL_THRESHOLD,
        "min_face_size": settings.MIN_FACE_SIZE,
        "target_face_size": settings.TARGET_FACE_SIZE,
        "max_image_size_bytes": settings.MAX_IMAGE_SIZE
    }


if __name__ == "__main__":
    logger.info(f"Starting server on {settings.HOST}:{settings.PORT}")
    uvicorn.run(
        "main:app",
        host=settings.HOST,
        port=settings.PORT,
        reload=settings.DEBUG,
        log_level="debug" if settings.DEBUG else "info"
    )
