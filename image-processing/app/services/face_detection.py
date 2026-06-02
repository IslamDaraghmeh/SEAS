"""
Face Detection Service using MediaPipe Face Mesh
"""

import cv2
import numpy as np
from typing import List, Optional, Dict, Any
from loguru import logger

# Try to import mediapipe
try:
    import mediapipe as mp
    MEDIAPIPE_AVAILABLE = True
except ImportError:
    MEDIAPIPE_AVAILABLE = False
    logger.warning("MediaPipe not available")

from config import settings, MEDIAPIPE_MOUTH_INDICES


class FaceDetectionService:
    """Service for face detection and landmark extraction using MediaPipe"""

    _instance = None
    _initialized = False

    def __new__(cls):
        """Singleton pattern to avoid loading models multiple times"""
        if cls._instance is None:
            cls._instance = super().__new__(cls)
        return cls._instance

    def __init__(self):
        """Initialize face detector"""
        if self._initialized:
            return

        self.mediapipe_available = MEDIAPIPE_AVAILABLE
        self.face_mesh = None
        self.face_detection = None
        self.opencv_cascade = None

        if MEDIAPIPE_AVAILABLE:
            self._init_mediapipe()
        else:
            self._init_opencv_fallback()

        self._initialized = True

    def _init_mediapipe(self):
        """Initialize MediaPipe face mesh and detection"""
        try:
            mp_face_mesh = mp.solutions.face_mesh
            mp_face_detection = mp.solutions.face_detection

            self.face_mesh = mp_face_mesh.FaceMesh(
                static_image_mode=True,
                max_num_faces=1,
                refine_landmarks=True,
                min_detection_confidence=0.5
            )

            self.face_detection = mp_face_detection.FaceDetection(
                model_selection=0,
                min_detection_confidence=0.5
            )

            logger.info("MediaPipe face mesh and detection initialized")

        except Exception as e:
            logger.error(f"Error initializing MediaPipe: {e}")
            self.mediapipe_available = False
            self._init_opencv_fallback()

    def _init_opencv_fallback(self):
        """Initialize OpenCV Haar cascade as fallback"""
        try:
            cascade_path = cv2.data.haarcascades + "haarcascade_frontalface_default.xml"
            self.opencv_cascade = cv2.CascadeClassifier(cascade_path)
            logger.info("OpenCV Haar cascade face detector initialized")
        except Exception as e:
            logger.error(f"Error initializing OpenCV cascade: {e}")

    def detect_faces(
        self,
        image: np.ndarray,
        max_faces: int = 1,
        upsample: int = None
    ) -> List[Dict[str, Any]]:
        """
        Detect faces in image

        Args:
            image: BGR image (OpenCV format)
            max_faces: Maximum number of faces to return
            upsample: Not used with MediaPipe

        Returns:
            List of face dictionaries with bounding boxes
        """
        if self.mediapipe_available and self.face_detection:
            return self._detect_faces_mediapipe(image, max_faces)
        elif self.opencv_cascade is not None:
            return self._detect_faces_opencv(image, max_faces)
        else:
            logger.error("No face detector available")
            return []

    def _detect_faces_mediapipe(
        self,
        image: np.ndarray,
        max_faces: int = 1
    ) -> List[Dict[str, Any]]:
        """Detect faces using MediaPipe"""
        try:
            # Convert BGR to RGB
            rgb_image = cv2.cvtColor(image, cv2.COLOR_BGR2RGB)
            height, width = image.shape[:2]

            results = self.face_detection.process(rgb_image)

            faces = []
            if results.detections:
                for i, detection in enumerate(results.detections[:max_faces]):
                    bboxC = detection.location_data.relative_bounding_box

                    x = int(bboxC.xmin * width)
                    y = int(bboxC.ymin * height)
                    w = int(bboxC.width * width)
                    h = int(bboxC.height * height)

                    # Ensure coordinates are within image bounds
                    x = max(0, x)
                    y = max(0, y)
                    w = min(w, width - x)
                    h = min(h, height - y)

                    faces.append({
                        "x": x,
                        "y": y,
                        "width": w,
                        "height": h,
                        "confidence": detection.score[0] if detection.score else 0.9
                    })

            return faces

        except Exception as e:
            logger.error(f"Error in MediaPipe face detection: {e}")
            return []

    def _detect_faces_opencv(
        self,
        image: np.ndarray,
        max_faces: int = 1
    ) -> List[Dict[str, Any]]:
        """Detect faces using OpenCV Haar cascade"""
        try:
            gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
            detected = self.opencv_cascade.detectMultiScale(
                gray,
                scaleFactor=1.1,
                minNeighbors=5,
                minSize=(settings.MIN_FACE_SIZE, settings.MIN_FACE_SIZE)
            )

            faces = []
            for i, (x, y, w, h) in enumerate(detected[:max_faces]):
                faces.append({
                    "x": int(x),
                    "y": int(y),
                    "width": int(w),
                    "height": int(h),
                    "confidence": 0.9
                })

            return faces

        except Exception as e:
            logger.error(f"Error in OpenCV face detection: {e}")
            return []

    def get_landmarks(
        self,
        image: np.ndarray,
        face: Dict[str, Any]
    ) -> Optional[Dict[str, Any]]:
        """
        Get facial landmarks for a detected face using MediaPipe Face Mesh

        Args:
            image: BGR image
            face: Face dictionary from detect_faces

        Returns:
            Dictionary with landmarks data or None
        """
        if not self.mediapipe_available or self.face_mesh is None:
            logger.warning("Landmark detection unavailable")
            return None

        try:
            # Convert BGR to RGB
            rgb_image = cv2.cvtColor(image, cv2.COLOR_BGR2RGB)
            height, width = image.shape[:2]

            # Process with face mesh
            results = self.face_mesh.process(rgb_image)

            if not results.multi_face_landmarks:
                return None

            face_landmarks = results.multi_face_landmarks[0]

            # Convert landmarks to pixel coordinates
            points = []
            for landmark in face_landmarks.landmark:
                x = int(landmark.x * width)
                y = int(landmark.y * height)
                points.append((x, y))

            # MediaPipe face mesh has 478 landmarks (with refine_landmarks=True)
            # Key landmarks for head pose estimation:
            # 1: Nose tip (index 1)
            # 152: Chin
            # 33: Left eye outer corner
            # 263: Right eye outer corner
            # 61: Left mouth corner
            # 291: Right mouth corner

            # Extract eye landmarks for EAR calculation
            # Left eye: 33, 160, 158, 133, 153, 144
            left_eye_indices = [33, 160, 158, 133, 153, 144]
            # Right eye: 362, 385, 387, 263, 373, 380
            right_eye_indices = [362, 385, 387, 263, 373, 380]

            left_eye = [points[i] for i in left_eye_indices if i < len(points)]
            right_eye = [points[i] for i in right_eye_indices if i < len(points)]

            # Extract mouth landmarks for MAR calculation
            # Upper lip inner points (for mouth opening detection)
            upper_lip_inner_indices = MEDIAPIPE_MOUTH_INDICES["upper_lip_inner"]
            lower_lip_inner_indices = MEDIAPIPE_MOUTH_INDICES["lower_lip_inner"]

            upper_lip_inner = [points[i] for i in upper_lip_inner_indices if i < len(points)]
            lower_lip_inner = [points[i] for i in lower_lip_inner_indices if i < len(points)]

            # Mouth corners
            mouth_left_idx = MEDIAPIPE_MOUTH_INDICES["mouth_left"]
            mouth_right_idx = MEDIAPIPE_MOUTH_INDICES["mouth_right"]
            mouth_left = points[mouth_left_idx] if mouth_left_idx < len(points) else (0, 0)
            mouth_right = points[mouth_right_idx] if mouth_right_idx < len(points) else (0, 0)

            return {
                "points": points,
                "left_eye": left_eye,
                "right_eye": right_eye,
                "nose": [points[1]] if len(points) > 1 else [],
                "mouth": [points[61], points[291]] if len(points) > 291 else [],
                # Key points for head pose
                "nose_tip": points[1] if len(points) > 1 else (0, 0),
                "chin": points[152] if len(points) > 152 else (0, 0),
                "left_eye_corner": points[33] if len(points) > 33 else (0, 0),
                "right_eye_corner": points[263] if len(points) > 263 else (0, 0),
                "left_mouth": points[61] if len(points) > 61 else (0, 0),
                "right_mouth": points[291] if len(points) > 291 else (0, 0),
                # Mouth landmarks for MAR calculation
                "upper_lip_inner": upper_lip_inner,
                "lower_lip_inner": lower_lip_inner,
                "mouth_left_corner": mouth_left,
                "mouth_right_corner": mouth_right,
            }

        except Exception as e:
            logger.error(f"Error getting landmarks: {e}")
            return None

    def get_face_encoding(
        self,
        image: np.ndarray,
        face: Dict[str, Any] = None
    ) -> Optional[np.ndarray]:
        """
        Get face encoding/embedding (simplified version)

        For full face recognition, consider using a dedicated model.
        This returns a simplified feature vector based on landmarks.
        """
        landmarks = self.get_landmarks(image, face) if face else None

        if landmarks and landmarks.get("points"):
            # Return normalized landmark positions as a simple encoding
            points = np.array(landmarks["points"], dtype=np.float32)
            # Normalize
            points = points - points.mean(axis=0)
            points = points / (points.std() + 1e-6)
            return points.flatten()[:128]  # Return first 128 values

        return None


# Create singleton instance
face_detection_service = FaceDetectionService()
