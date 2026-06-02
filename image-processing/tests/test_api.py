"""
API tests for SEAS Image Processing Service
"""

import pytest
from fastapi.testclient import TestClient
import base64
import numpy as np
import cv2
import sys
import os

# Add parent directory to path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from main import app


client = TestClient(app)


def create_test_image(width: int = 200, height: int = 200, with_face: bool = False) -> str:
    """Create a test image and return as base64"""
    # Create a simple image
    image = np.zeros((height, width, 3), dtype=np.uint8)

    if with_face:
        # Draw a simple face-like pattern (won't be detected as real face)
        # This is just for testing image processing, not actual face detection
        center = (width // 2, height // 2)

        # Face outline (circle)
        cv2.circle(image, center, 60, (200, 180, 160), -1)

        # Eyes
        cv2.circle(image, (center[0] - 20, center[1] - 15), 8, (50, 50, 50), -1)
        cv2.circle(image, (center[0] + 20, center[1] - 15), 8, (50, 50, 50), -1)

        # Nose
        cv2.line(image, (center[0], center[1] - 5), (center[0], center[1] + 10), (150, 130, 120), 2)

        # Mouth
        cv2.ellipse(image, (center[0], center[1] + 25), (15, 8), 0, 0, 180, (100, 80, 80), 2)
    else:
        # Just a colored rectangle
        cv2.rectangle(image, (50, 50), (150, 150), (100, 150, 200), -1)

    # Encode to base64
    _, buffer = cv2.imencode('.jpg', image)
    base64_string = base64.b64encode(buffer).decode('utf-8')

    return base64_string


class TestHealthEndpoints:
    """Test health and info endpoints"""

    def test_root_endpoint(self):
        """Test root endpoint returns service info"""
        response = client.get("/")
        assert response.status_code == 200
        data = response.json()
        assert "service" in data
        assert "version" in data
        assert data["status"] == "running"

    def test_health_endpoint(self):
        """Test health check endpoint"""
        response = client.get("/health")
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "healthy"
        assert "models_loaded" in data
        assert "dlib_available" in data

    def test_config_endpoint(self):
        """Test config endpoint returns thresholds"""
        response = client.get("/config")
        assert response.status_code == 200
        data = response.json()
        assert "face_match_threshold" in data
        assert "liveness_threshold" in data
        assert "ear_threshold" in data


class TestFaceEndpoints:
    """Test face detection and recognition endpoints"""

    def test_face_detect_no_face(self):
        """Test face detection with image without face"""
        image = create_test_image(with_face=False)

        response = client.post(
            "/face/detect",
            json={"image": image, "return_landmarks": True}
        )

        assert response.status_code == 200
        data = response.json()
        assert data["success"] == True
        assert "faces_detected" in data
        # May or may not detect face depending on image

    def test_face_detect_invalid_image(self):
        """Test face detection with invalid base64"""
        response = client.post(
            "/face/detect",
            json={"image": "invalid_base64!@#$", "return_landmarks": True}
        )

        assert response.status_code == 400

    def test_face_encode(self):
        """Test face encoding endpoint"""
        image = create_test_image(with_face=True)

        response = client.post(
            "/face/encode",
            json={"image": image}
        )

        assert response.status_code == 200
        data = response.json()
        assert data["success"] == True
        assert "embedding" in data
        # Check embedding size (should be 128 or similar)
        assert len(data["embedding"]) > 0

    def test_face_compare_embeddings(self):
        """Test face comparison with embeddings"""
        # Create two similar embeddings
        embedding1 = [0.1] * 128
        embedding2 = [0.1] * 128  # Same embedding should match

        response = client.post(
            "/face/compare",
            json={
                "embedding1": embedding1,
                "embedding2": embedding2
            }
        )

        assert response.status_code == 200
        data = response.json()
        assert data["success"] == True
        assert "similarity" in data
        assert "is_match" in data
        assert data["similarity"] >= 0.99  # Should be very similar

    def test_face_compare_different_embeddings(self):
        """Test face comparison with different embeddings"""
        embedding1 = [0.1] * 128
        embedding2 = [-0.1] * 128  # Opposite embedding

        response = client.post(
            "/face/compare",
            json={
                "embedding1": embedding1,
                "embedding2": embedding2
            }
        )

        assert response.status_code == 200
        data = response.json()
        assert data["success"] == True
        assert data["similarity"] < 0.5  # Should be different


class TestLivenessEndpoints:
    """Test liveness detection endpoints"""

    def test_blink_detection_single_image(self):
        """Test blink detection with single image"""
        image = create_test_image(with_face=True)

        response = client.post(
            "/liveness/blink",
            json={"image": image}
        )

        assert response.status_code == 200
        data = response.json()
        assert data["success"] == True
        assert "blink_detected" in data
        assert "ear_value" in data
        assert "ear_threshold" in data

    def test_head_pose_validation(self):
        """Test head pose validation"""
        image = create_test_image(with_face=True)

        response = client.post(
            "/liveness/head-pose",
            json={"image": image}
        )

        assert response.status_code == 200
        data = response.json()
        assert data["success"] == True
        assert "is_valid" in data
        assert "pose" in data
        assert "pose_direction" in data

    def test_anti_spoof_check(self):
        """Test anti-spoofing check"""
        image = create_test_image(with_face=True)

        response = client.post(
            "/liveness/anti-spoof",
            json={"image": image}
        )

        assert response.status_code == 200
        data = response.json()
        assert data["success"] == True
        assert "is_real" in data
        assert "spoof_score" in data
        assert "confidence" in data

    def test_liveness_verify(self):
        """Test full liveness verification"""
        images = [create_test_image(with_face=True) for _ in range(3)]

        response = client.post(
            "/liveness/verify",
            json={
                "images": images,
                "require_blink": False,  # Can't test real blink
                "require_head_pose": True,
                "require_anti_spoof": True
            }
        )

        assert response.status_code == 200
        data = response.json()
        assert data["success"] == True
        assert "is_live" in data
        assert "liveness_score" in data
        assert "checks_passed" in data
        assert "checks_total" in data


class TestVerificationEndpoints:
    """Test combined verification endpoints"""

    def test_verification_no_template(self):
        """Test verification without stored template"""
        images = [create_test_image(with_face=True) for _ in range(2)]

        response = client.post(
            "/verify",
            json={
                "student_id": "TEST_NONEXISTENT_001",
                "images": images,
                "verify_liveness": True
            }
        )

        assert response.status_code == 200
        data = response.json()
        assert data["success"] == True
        assert "is_verified" in data
        assert "match_score" in data
        assert "liveness_score" in data

    def test_verification_with_embedding(self):
        """Test verification with provided embedding"""
        images = [create_test_image(with_face=True)]
        stored_embedding = [0.1] * 128

        response = client.post(
            "/verify",
            json={
                "student_id": "TEST_001",
                "images": images,
                "verify_liveness": False,
                "stored_embedding": stored_embedding
            }
        )

        assert response.status_code == 200
        data = response.json()
        assert data["success"] == True
        assert "is_verified" in data
        assert "match_score" in data


class TestEnrollment:
    """Test face enrollment endpoints"""

    def test_enroll_and_delete(self):
        """Test enrollment and deletion flow"""
        student_id = "TEST_ENROLL_001"
        images = [create_test_image(with_face=True) for _ in range(2)]

        # Enroll
        response = client.post(
            "/face/enroll",
            json={
                "student_id": student_id,
                "images": images,
                "overwrite": True
            }
        )

        # Enrollment may or may not succeed based on face detection
        assert response.status_code in [200, 400]

        # Check status
        response = client.get(f"/face/enroll/{student_id}/status")
        assert response.status_code == 200
        data = response.json()
        assert "is_enrolled" in data

        # Delete if enrolled
        if data["is_enrolled"]:
            response = client.delete(f"/face/enroll/{student_id}")
            assert response.status_code == 200


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
