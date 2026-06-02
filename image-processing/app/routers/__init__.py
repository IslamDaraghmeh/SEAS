"""
SEAS Image Processing Service - Routers Package
"""

from .face import router as face_router
from .liveness import router as liveness_router
from .verification import router as verification_router

__all__ = [
    "face_router",
    "liveness_router",
    "verification_router",
]
