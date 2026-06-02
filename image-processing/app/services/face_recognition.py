"""
Face Recognition Service for face embedding extraction and comparison
"""

import cv2
import numpy as np
from typing import List, Tuple, Optional, Dict, Any
from scipy.spatial.distance import cosine
from loguru import logger
import os
import json
import pickle

from config import settings

# Try to import dlib for face recognition
try:
    import dlib
    DLIB_AVAILABLE = True
except ImportError:
    DLIB_AVAILABLE = False
    logger.warning("dlib not available for face recognition")

# Try to import TensorFlow for FaceNet-style embeddings
try:
    import tensorflow as tf
    TF_AVAILABLE = True
except ImportError:
    TF_AVAILABLE = False
    logger.warning("TensorFlow not available")


class FaceRecognitionService:
    """Service for face embedding extraction and comparison"""

    _instance = None
    _initialized = False

    def __new__(cls):
        """Singleton pattern"""
        if cls._instance is None:
            cls._instance = super().__new__(cls)
        return cls._instance

    def __init__(self):
        """Initialize face recognition model"""
        if self._initialized:
            return

        self.dlib_available = DLIB_AVAILABLE
        self.tf_available = TF_AVAILABLE
        self.face_encoder = None
        self.embedding_size = 128

        self._init_face_encoder()
        self._initialized = True

    def _init_face_encoder(self):
        """Initialize the face encoding model"""
        if DLIB_AVAILABLE:
            self._init_dlib_encoder()
        else:
            logger.warning("Using placeholder face encoder")

    def _init_dlib_encoder(self):
        """Initialize dlib face recognition model"""
        try:
            model_path = settings.DLIB_FACE_RECOGNITION_MODEL_PATH
            if os.path.exists(model_path):
                self.face_encoder = dlib.face_recognition_model_v1(model_path)
                self.embedding_size = 128
                logger.info(f"Loaded dlib face recognition model from {model_path}")
            else:
                logger.warning(f"Face recognition model not found at {model_path}")
                logger.info("Using placeholder embedding generation")
        except Exception as e:
            logger.error(f"Error loading dlib face recognition model: {e}")

    def get_embedding(
        self,
        image: np.ndarray,
        face: Dict[str, Any] = None,
        landmarks: Dict[str, Any] = None
    ) -> Optional[np.ndarray]:
        """
        Extract 128-dimensional face embedding

        Args:
            image: BGR image
            face: Face bounding box dictionary
            landmarks: Facial landmarks dictionary

        Returns:
            128-dimensional embedding vector or None
        """
        try:
            if self.face_encoder is not None and landmarks is not None:
                return self._get_dlib_embedding(image, face, landmarks)
            else:
                # Placeholder: generate deterministic embedding from image
                return self._get_placeholder_embedding(image, face)

        except Exception as e:
            logger.error(f"Error generating embedding: {e}")
            return None

    def _get_dlib_embedding(
        self,
        image: np.ndarray,
        face: Dict[str, Any],
        landmarks: Dict[str, Any]
    ) -> np.ndarray:
        """Get embedding using dlib's face recognition model"""
        rgb_image = cv2.cvtColor(image, cv2.COLOR_BGR2RGB)

        # Create dlib shape from landmarks
        points = landmarks["points"]

        # Create a dlib full_object_detection from landmarks
        if face.get("detection") is not None:
            rect = face["detection"]
        else:
            rect = dlib.rectangle(
                face["x"],
                face["y"],
                face["x"] + face["width"],
                face["y"] + face["height"]
            )

        # We need to recreate the shape from landmarks
        # dlib's compute_face_descriptor can work with aligned face chips
        from app.services.face_detection import face_detection_service

        # Get face chip
        face_chip = face_detection_service.get_face_chip(image, face, size=150)

        if face_chip is None:
            return self._get_placeholder_embedding(image, face)

        # Convert to RGB
        face_chip_rgb = cv2.cvtColor(face_chip, cv2.COLOR_BGR2RGB)

        # Get descriptor
        descriptor = self.face_encoder.compute_face_descriptor(face_chip_rgb)

        return np.array(descriptor)

    def _get_placeholder_embedding(
        self,
        image: np.ndarray,
        face: Dict[str, Any] = None
    ) -> np.ndarray:
        """
        Generate a placeholder embedding based on image features.
        This is a simplified version for testing when models aren't available.
        """
        # Crop face region if available
        if face is not None:
            x, y, w, h = face["x"], face["y"], face["width"], face["height"]
            face_img = image[y:y+h, x:x+w]
        else:
            face_img = image

        # Resize to standard size
        face_img = cv2.resize(face_img, (64, 64))

        # Convert to grayscale
        gray = cv2.cvtColor(face_img, cv2.COLOR_BGR2GRAY)

        # Extract simple features
        # 1. HOG-like features
        gx = cv2.Sobel(gray, cv2.CV_64F, 1, 0, ksize=3)
        gy = cv2.Sobel(gray, cv2.CV_64F, 0, 1, ksize=3)
        mag, angle = cv2.cartToPolar(gx, gy, angleInDegrees=True)

        # 2. Divide into cells and compute histograms
        cell_size = 8
        n_bins = 9
        features = []

        for i in range(0, 64, cell_size):
            for j in range(0, 64, cell_size):
                cell_mag = mag[i:i+cell_size, j:j+cell_size]
                cell_angle = angle[i:i+cell_size, j:j+cell_size]

                # Compute histogram
                hist, _ = np.histogram(
                    cell_angle.ravel(),
                    bins=n_bins,
                    range=(0, 180),
                    weights=cell_mag.ravel()
                )
                features.extend(hist)

        # Add intensity statistics
        features.extend([
            np.mean(gray),
            np.std(gray),
            np.mean(gray[:32, :]),  # Top half
            np.mean(gray[32:, :]),  # Bottom half
        ])

        # Normalize and truncate/pad to 128 dimensions
        features = np.array(features, dtype=np.float32)
        features = features / (np.linalg.norm(features) + 1e-10)

        if len(features) > 128:
            features = features[:128]
        elif len(features) < 128:
            features = np.pad(features, (0, 128 - len(features)))

        return features

    def compare_embeddings(
        self,
        embedding1: np.ndarray,
        embedding2: np.ndarray
    ) -> Tuple[float, bool, str]:
        """
        Compare two face embeddings using cosine similarity

        Args:
            embedding1: First embedding
            embedding2: Second embedding

        Returns:
            Tuple of (similarity score, is_match, confidence_level)
        """
        try:
            # Ensure numpy arrays
            e1 = np.array(embedding1, dtype=np.float32)
            e2 = np.array(embedding2, dtype=np.float32)

            # Normalize
            e1 = e1 / (np.linalg.norm(e1) + 1e-10)
            e2 = e2 / (np.linalg.norm(e2) + 1e-10)

            # Cosine similarity (1 - cosine distance)
            similarity = 1 - cosine(e1, e2)

            # Clamp to valid range
            similarity = max(0.0, min(1.0, similarity))

            # Determine match and confidence
            is_match = similarity >= settings.FACE_MATCH_THRESHOLD

            if similarity >= settings.FACE_MATCH_STRICT_THRESHOLD:
                confidence = "high"
            elif similarity >= settings.FACE_MATCH_THRESHOLD:
                confidence = "medium"
            else:
                confidence = "low"

            return similarity, is_match, confidence

        except Exception as e:
            logger.error(f"Error comparing embeddings: {e}")
            return 0.0, False, "low"

    def save_template(
        self,
        student_id: str,
        embeddings: List[np.ndarray]
    ) -> bool:
        """
        Save face template(s) for a student

        Args:
            student_id: Unique student identifier
            embeddings: List of face embeddings

        Returns:
            Success status
        """
        try:
            # Ensure directory exists
            os.makedirs(settings.FACE_TEMPLATES_DIR, exist_ok=True)

            template_path = os.path.join(
                settings.FACE_TEMPLATES_DIR,
                f"{student_id}.pkl"
            )

            # Average embeddings for single template
            avg_embedding = np.mean(embeddings, axis=0)
            avg_embedding = avg_embedding / (np.linalg.norm(avg_embedding) + 1e-10)

            template_data = {
                "student_id": student_id,
                "embedding": avg_embedding.tolist(),
                "num_samples": len(embeddings),
                "embedding_size": self.embedding_size
            }

            with open(template_path, 'wb') as f:
                pickle.dump(template_data, f)

            logger.info(f"Saved face template for student {student_id}")
            return True

        except Exception as e:
            logger.error(f"Error saving template: {e}")
            return False

    def load_template(self, student_id: str) -> Optional[np.ndarray]:
        """
        Load face template for a student

        Args:
            student_id: Unique student identifier

        Returns:
            Face embedding or None
        """
        try:
            template_path = os.path.join(
                settings.FACE_TEMPLATES_DIR,
                f"{student_id}.pkl"
            )

            if not os.path.exists(template_path):
                logger.warning(f"Template not found for student {student_id}")
                return None

            with open(template_path, 'rb') as f:
                template_data = pickle.load(f)

            return np.array(template_data["embedding"], dtype=np.float32)

        except Exception as e:
            logger.error(f"Error loading template: {e}")
            return None

    def delete_template(self, student_id: str) -> bool:
        """Delete face template for a student"""
        try:
            template_path = os.path.join(
                settings.FACE_TEMPLATES_DIR,
                f"{student_id}.pkl"
            )

            if os.path.exists(template_path):
                os.remove(template_path)
                logger.info(f"Deleted template for student {student_id}")
                return True

            return False

        except Exception as e:
            logger.error(f"Error deleting template: {e}")
            return False

    def template_exists(self, student_id: str) -> bool:
        """Check if template exists for a student"""
        template_path = os.path.join(
            settings.FACE_TEMPLATES_DIR,
            f"{student_id}.pkl"
        )
        return os.path.exists(template_path)

    def is_available(self) -> bool:
        """Check if face recognition is available"""
        return True  # Placeholder always available


# Create singleton instance
face_recognition_service = FaceRecognitionService()
