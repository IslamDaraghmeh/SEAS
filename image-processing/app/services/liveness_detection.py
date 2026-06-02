"""
Liveness Detection Service for blink, head pose, and anti-spoofing detection
"""

import cv2
import numpy as np
from typing import List, Tuple, Optional, Dict, Any
from scipy.spatial import distance
from loguru import logger
import math

from config import settings, MODEL_POINTS_3D


class LivenessDetectionService:
    """Service for liveness detection including blink, head pose, and anti-spoofing"""

    _instance = None
    _initialized = False

    def __new__(cls):
        """Singleton pattern"""
        if cls._instance is None:
            cls._instance = super().__new__(cls)
        return cls._instance

    def __init__(self):
        """Initialize liveness detection"""
        if self._initialized:
            return

        self.anti_spoof_model = None
        self._init_anti_spoof_model()
        self._initialized = True

    def _init_anti_spoof_model(self):
        """Initialize anti-spoofing model (placeholder)"""
        # TODO: Load actual anti-spoofing CNN model
        # For now, we use heuristic-based detection
        logger.info("Anti-spoofing using heuristic detection (model not loaded)")

    # ==================== Blink Detection ====================

    def calculate_ear(
        self,
        eye_landmarks: List[Tuple[int, int]]
    ) -> float:
        """
        Calculate Eye Aspect Ratio (EAR)

        EAR = (||p2-p6|| + ||p3-p5||) / (2 * ||p1-p4||)

        Where p1-p6 are the 6 eye landmarks:
        p1 = outer corner, p4 = inner corner
        p2, p6 = upper lid, p3, p5 = lower lid

        Args:
            eye_landmarks: List of 6 (x, y) points for one eye

        Returns:
            EAR value (typically 0.2-0.4 for open eyes, <0.2 for closed)
        """
        if len(eye_landmarks) != 6:
            logger.warning(f"Expected 6 eye landmarks, got {len(eye_landmarks)}")
            return 0.3  # Return neutral value

        # Convert to numpy array
        eye = np.array(eye_landmarks, dtype=np.float32)

        # Compute euclidean distances
        # Vertical distances
        A = distance.euclidean(eye[1], eye[5])  # p2-p6
        B = distance.euclidean(eye[2], eye[4])  # p3-p5

        # Horizontal distance
        C = distance.euclidean(eye[0], eye[3])  # p1-p4

        # Compute EAR
        if C == 0:
            return 0.3

        ear = (A + B) / (2.0 * C)

        return ear

    def detect_blink(
        self,
        landmarks: Dict[str, Any],
        ear_threshold: float = None
    ) -> Dict[str, Any]:
        """
        Detect if eyes are blinking based on EAR

        Args:
            landmarks: Facial landmarks dictionary
            ear_threshold: EAR threshold for blink detection

        Returns:
            Dictionary with blink detection results
        """
        if ear_threshold is None:
            ear_threshold = settings.EAR_THRESHOLD

        try:
            left_eye = landmarks.get("left_eye", [])
            right_eye = landmarks.get("right_eye", [])

            if len(left_eye) < 6 or len(right_eye) < 6:
                return {
                    "blink_detected": False,
                    "ear_value": 0.3,
                    "ear_threshold": ear_threshold,
                    "left_eye_ear": 0.3,
                    "right_eye_ear": 0.3,
                    "eyes_open": True,
                    "error": "Insufficient eye landmarks"
                }

            # Calculate EAR for both eyes
            left_ear = self.calculate_ear(left_eye)
            right_ear = self.calculate_ear(right_eye)

            # Average EAR
            avg_ear = (left_ear + right_ear) / 2.0

            # Determine if blink (eyes closed)
            eyes_closed = avg_ear < ear_threshold

            return {
                "blink_detected": eyes_closed,
                "ear_value": round(avg_ear, 4),
                "ear_threshold": ear_threshold,
                "left_eye_ear": round(left_ear, 4),
                "right_eye_ear": round(right_ear, 4),
                "eyes_open": not eyes_closed
            }

        except Exception as e:
            logger.error(f"Error in blink detection: {e}")
            return {
                "blink_detected": False,
                "ear_value": 0.3,
                "ear_threshold": ear_threshold,
                "left_eye_ear": 0.3,
                "right_eye_ear": 0.3,
                "eyes_open": True,
                "error": str(e)
            }

    def detect_blink_sequence(
        self,
        landmarks_sequence: List[Dict[str, Any]],
        ear_threshold: float = None,
        consec_frames: int = None
    ) -> Dict[str, Any]:
        """
        Detect blink in a sequence of frames

        Args:
            landmarks_sequence: List of landmarks from consecutive frames
            ear_threshold: EAR threshold
            consec_frames: Minimum consecutive frames for blink

        Returns:
            Dictionary with blink detection results
        """
        if ear_threshold is None:
            ear_threshold = settings.EAR_THRESHOLD
        if consec_frames is None:
            consec_frames = settings.EAR_CONSEC_FRAMES

        ear_values = []
        blink_count = 0
        below_threshold_count = 0

        for landmarks in landmarks_sequence:
            result = self.detect_blink(landmarks, ear_threshold)
            ear_values.append(result["ear_value"])

            if result["ear_value"] < ear_threshold:
                below_threshold_count += 1
            else:
                if below_threshold_count >= consec_frames:
                    blink_count += 1
                below_threshold_count = 0

        # Check for blink at end of sequence
        if below_threshold_count >= consec_frames:
            blink_count += 1

        return {
            "blink_detected": blink_count > 0,
            "blink_count": blink_count,
            "ear_values": ear_values,
            "avg_ear": round(np.mean(ear_values), 4) if ear_values else 0.3,
            "min_ear": round(min(ear_values), 4) if ear_values else 0.3,
            "max_ear": round(max(ear_values), 4) if ear_values else 0.3,
            "frames_analyzed": len(landmarks_sequence)
        }

    # ==================== Mouth Aspect Ratio (MAR) Detection ====================

    def calculate_mar(
        self,
        upper_lip: List[Tuple[int, int]],
        lower_lip: List[Tuple[int, int]],
        mouth_left: Tuple[int, int],
        mouth_right: Tuple[int, int]
    ) -> float:
        """
        Calculate Mouth Aspect Ratio (MAR)

        MAR = vertical_distance / horizontal_distance

        Args:
            upper_lip: List of upper lip inner points
            lower_lip: List of lower lip inner points
            mouth_left: Left mouth corner
            mouth_right: Right mouth corner

        Returns:
            MAR value (higher when mouth is open)
        """
        if len(upper_lip) < 3 or len(lower_lip) < 3:
            return 0.0

        # Calculate vertical distance (mouth opening)
        # Use center points of upper and lower lip
        upper_center_idx = len(upper_lip) // 2
        lower_center_idx = len(lower_lip) // 2

        # Multiple vertical measurements for robustness
        vertical_distances = []

        # Center points
        center_dist = distance.euclidean(
            upper_lip[upper_center_idx],
            lower_lip[lower_center_idx]
        )
        vertical_distances.append(center_dist)

        # Additional points around center
        for offset in [1, 2]:
            if upper_center_idx - offset >= 0 and lower_center_idx - offset >= 0:
                dist = distance.euclidean(
                    upper_lip[upper_center_idx - offset],
                    lower_lip[lower_center_idx - offset]
                )
                vertical_distances.append(dist)

            if upper_center_idx + offset < len(upper_lip) and lower_center_idx + offset < len(lower_lip):
                dist = distance.euclidean(
                    upper_lip[upper_center_idx + offset],
                    lower_lip[lower_center_idx + offset]
                )
                vertical_distances.append(dist)

        avg_vertical = np.mean(vertical_distances)

        # Calculate horizontal distance (mouth width)
        horizontal = distance.euclidean(mouth_left, mouth_right)

        if horizontal == 0:
            return 0.0

        mar = avg_vertical / horizontal

        return mar

    def detect_lip_movement(
        self,
        landmarks_sequence: List[Dict[str, Any]],
        mar_change_threshold: float = None
    ) -> Dict[str, Any]:
        """
        Detect lip/mouth movement across a sequence of frames

        Args:
            landmarks_sequence: List of landmarks from consecutive frames
            mar_change_threshold: Minimum MAR change to detect movement

        Returns:
            Dictionary with lip movement detection results
        """
        if mar_change_threshold is None:
            mar_change_threshold = settings.MAR_CHANGE_THRESHOLD

        if not landmarks_sequence or len(landmarks_sequence) < 2:
            return {
                "movement_detected": False,
                "mar_values": [],
                "mar_change": 0.0,
                "mar_range": 0.0,
                "error": "Insufficient frames for lip movement detection"
            }

        mar_values = []

        for landmarks in landmarks_sequence:
            upper_lip = landmarks.get("upper_lip_inner", [])
            lower_lip = landmarks.get("lower_lip_inner", [])
            mouth_left = landmarks.get("mouth_left_corner", (0, 0))
            mouth_right = landmarks.get("mouth_right_corner", (0, 0))

            if upper_lip and lower_lip:
                mar = self.calculate_mar(upper_lip, lower_lip, mouth_left, mouth_right)
                mar_values.append(mar)

        if not mar_values:
            return {
                "movement_detected": False,
                "mar_values": [],
                "mar_change": 0.0,
                "mar_range": 0.0,
                "error": "Could not extract mouth landmarks"
            }

        # Calculate MAR statistics
        mar_min = min(mar_values)
        mar_max = max(mar_values)
        mar_range = mar_max - mar_min
        mar_std = np.std(mar_values)

        # Detect significant lip movement
        # More lenient - just need 0.05 MAR change (reduced from 0.2)
        min_mar_change = 0.05
        movement_detected = mar_range >= min_mar_change

        return {
            "movement_detected": movement_detected,
            "mar_values": [round(m, 4) for m in mar_values],
            "mar_change": round(mar_range, 4),
            "mar_range": round(mar_range, 4),
            "mar_min": round(mar_min, 4),
            "mar_max": round(mar_max, 4),
            "mar_std": round(mar_std, 4),
            "frames_analyzed": len(mar_values)
        }

    # ==================== Nod Detection ====================

    def detect_nod(
        self,
        landmarks_sequence: List[Dict[str, Any]],
        image_heights: List[int],
        image_widths: List[int],
        pitch_change_min: float = None,
        pitch_change_max: float = None
    ) -> Dict[str, Any]:
        """
        Detect head nodding motion (up-down movement)

        Args:
            landmarks_sequence: List of landmarks from consecutive frames
            image_heights: List of image heights for each frame
            image_widths: List of image widths for each frame
            pitch_change_min: Minimum pitch change for nod detection
            pitch_change_max: Maximum pitch change (prevent extreme movement)

        Returns:
            Dictionary with nod detection results
        """
        if pitch_change_min is None:
            pitch_change_min = settings.NOD_PITCH_CHANGE_MIN
        if pitch_change_max is None:
            pitch_change_max = settings.NOD_PITCH_CHANGE_MAX

        if not landmarks_sequence or len(landmarks_sequence) < 2:
            return {
                "nod_detected": False,
                "pitch_values": [],
                "pitch_range": 0.0,
                "error": "Insufficient frames for nod detection"
            }

        pitch_values = []

        for i, landmarks in enumerate(landmarks_sequence):
            height = image_heights[i] if i < len(image_heights) else 480
            width = image_widths[i] if i < len(image_widths) else 640

            pose_result = self.estimate_head_pose(landmarks, width, height)

            if "error" not in pose_result:
                pitch_values.append(pose_result["pitch"])

        if len(pitch_values) < 2:
            return {
                "nod_detected": False,
                "pitch_values": [],
                "pitch_range": 0.0,
                "error": "Could not estimate head pose from frames"
            }

        # Calculate pitch statistics
        pitch_min = min(pitch_values)
        pitch_max = max(pitch_values)
        pitch_range = pitch_max - pitch_min

        # Detect nod: any significant pitch variation
        # More lenient - just need 8+ degrees of pitch change
        min_pitch_for_nod = 8.0  # Reduced from settings value

        nod_detected = pitch_range >= min_pitch_for_nod

        # Count direction changes (optional, for confidence)
        direction_changes = 0
        for i in range(1, len(pitch_values)):
            if i < len(pitch_values) - 1:
                prev_diff = pitch_values[i] - pitch_values[i - 1]
                next_diff = pitch_values[i + 1] - pitch_values[i]
                if prev_diff * next_diff < 0 and abs(prev_diff) > 2 and abs(next_diff) > 2:
                    direction_changes += 1

        return {
            "nod_detected": nod_detected,
            "pitch_values": [round(p, 2) for p in pitch_values],
            "pitch_range": round(pitch_range, 2),
            "pitch_min": round(pitch_min, 2),
            "pitch_max": round(pitch_max, 2),
            "direction_changes": direction_changes,
            "frames_analyzed": len(pitch_values)
        }

    # ==================== Head Pose Estimation ====================

    def estimate_head_pose(
        self,
        landmarks: Dict[str, Any],
        image_width: int,
        image_height: int
    ) -> Dict[str, Any]:
        """
        Estimate head pose using solvePnP

        Args:
            landmarks: Facial landmarks dictionary (from MediaPipe)
            image_width: Image width for camera matrix
            image_height: Image height for camera matrix

        Returns:
            Dictionary with head pose angles (yaw, pitch, roll)
        """
        try:
            # Check if we have the key points from MediaPipe
            nose_tip = landmarks.get("nose_tip")
            chin = landmarks.get("chin")
            left_eye = landmarks.get("left_eye_corner")
            right_eye = landmarks.get("right_eye_corner")
            left_mouth = landmarks.get("left_mouth")
            right_mouth = landmarks.get("right_mouth")

            if not all([nose_tip, chin, left_eye, right_eye, left_mouth, right_mouth]):
                return {
                    "is_valid": True,
                    "yaw": 0.0,
                    "pitch": 0.0,
                    "roll": 0.0,
                    "pose_direction": "center",
                    "error": "Insufficient landmarks"
                }

            # Get 2D image points for pose estimation
            image_points = np.array([
                nose_tip,       # Nose tip
                chin,           # Chin
                left_eye,       # Left eye corner
                right_eye,      # Right eye corner
                left_mouth,     # Left mouth corner
                right_mouth     # Right mouth corner
            ], dtype=np.float64)

            # 3D model points (standard face model)
            model_points = np.array(MODEL_POINTS_3D, dtype=np.float64)

            # Camera matrix (approximation)
            focal_length = image_width
            center = (image_width / 2, image_height / 2)

            camera_matrix = np.array([
                [focal_length, 0, center[0]],
                [0, focal_length, center[1]],
                [0, 0, 1]
            ], dtype=np.float64)

            # Distortion coefficients (assuming no distortion)
            dist_coeffs = np.zeros((4, 1))

            # Solve PnP
            success, rotation_vector, translation_vector = cv2.solvePnP(
                model_points,
                image_points,
                camera_matrix,
                dist_coeffs,
                flags=cv2.SOLVEPNP_ITERATIVE
            )

            if not success:
                return {
                    "is_valid": True,
                    "yaw": 0.0,
                    "pitch": 0.0,
                    "roll": 0.0,
                    "pose_direction": "center",
                    "error": "PnP solve failed"
                }

            # Convert rotation vector to rotation matrix
            rotation_matrix, _ = cv2.Rodrigues(rotation_vector)

            # Get Euler angles
            yaw, pitch, roll = self._rotation_matrix_to_euler(rotation_matrix)

            # Convert to degrees
            yaw_deg = math.degrees(yaw)
            pitch_deg = math.degrees(pitch)
            roll_deg = math.degrees(roll)

            # Determine pose direction
            pose_direction = self._get_pose_direction(yaw_deg, pitch_deg)

            # Check if pose is valid (facing camera)
            is_valid = (
                abs(yaw_deg) < settings.HEAD_POSE_YAW_THRESHOLD and
                abs(pitch_deg) < settings.HEAD_POSE_PITCH_THRESHOLD and
                abs(roll_deg) < settings.HEAD_POSE_ROLL_THRESHOLD
            )

            return {
                "is_valid": is_valid,
                "yaw": round(yaw_deg, 2),
                "pitch": round(pitch_deg, 2),
                "roll": round(roll_deg, 2),
                "pose_direction": pose_direction
            }

        except Exception as e:
            logger.error(f"Error in head pose estimation: {e}")
            return {
                "is_valid": True,
                "yaw": 0.0,
                "pitch": 0.0,
                "roll": 0.0,
                "pose_direction": "center",
                "error": str(e)
            }

    def _rotation_matrix_to_euler(
        self,
        rotation_matrix: np.ndarray
    ) -> Tuple[float, float, float]:
        """
        Convert rotation matrix to Euler angles (yaw, pitch, roll)

        Uses the decomposition for ZYX rotation order

        Args:
            rotation_matrix: 3x3 rotation matrix

        Returns:
            Tuple of (yaw, pitch, roll) in radians
        """
        sy = math.sqrt(rotation_matrix[0, 0] ** 2 + rotation_matrix[1, 0] ** 2)

        singular = sy < 1e-6

        if not singular:
            x = math.atan2(rotation_matrix[2, 1], rotation_matrix[2, 2])
            y = math.atan2(-rotation_matrix[2, 0], sy)
            z = math.atan2(rotation_matrix[1, 0], rotation_matrix[0, 0])
        else:
            x = math.atan2(-rotation_matrix[1, 2], rotation_matrix[1, 1])
            y = math.atan2(-rotation_matrix[2, 0], sy)
            z = 0

        # Return as yaw, pitch, roll
        return z, x, y

    def _get_pose_direction(self, yaw: float, pitch: float) -> str:
        """Determine pose direction from angles"""
        # Very lenient thresholds for center detection (35 degrees)
        # This accounts for camera angles, natural head positions, and webcam positioning
        # Many webcams are positioned below eye level causing natural pitch variation
        if abs(yaw) < 35 and abs(pitch) < 35:
            return "center"
        # For directional poses, require significant movement (30+ degrees)
        # This ensures clear intentional head movement for non-front poses
        elif yaw < -30:
            return "left"
        elif yaw > 30:
            return "right"
        elif pitch < -30:
            return "down"
        elif pitch > 30:
            return "up"
        return "center"

    def validate_head_pose(
        self,
        landmarks: Dict[str, Any],
        image_width: int,
        image_height: int,
        expected_pose: str = None
    ) -> Dict[str, Any]:
        """
        Validate head pose, optionally checking against expected pose

        Args:
            landmarks: Facial landmarks
            image_width: Image width
            image_height: Image height
            expected_pose: Expected pose direction

        Returns:
            Validation result dictionary
        """
        result = self.estimate_head_pose(landmarks, image_width, image_height)

        matches_expected = True
        if expected_pose and expected_pose != "any":
            matches_expected = result["pose_direction"] == expected_pose

        result["matches_expected"] = matches_expected

        return result

    # ==================== Anti-Spoofing ====================

    def detect_spoof(
        self,
        image: np.ndarray,
        face: Dict[str, Any] = None
    ) -> Dict[str, Any]:
        """
        Detect if face is a spoof (photo, screen, mask)

        Currently uses heuristic-based detection.
        TODO: Implement CNN-based anti-spoofing

        Args:
            image: BGR image
            face: Face bounding box

        Returns:
            Dictionary with spoof detection results
        """
        try:
            # Crop face region if available
            if face is not None:
                x, y, w, h = face["x"], face["y"], face["width"], face["height"]
                height, width = image.shape[:2]
                x1 = max(0, x)
                y1 = max(0, y)
                x2 = min(width, x + w)
                y2 = min(height, y + h)
                face_img = image[y1:y2, x1:x2]
            else:
                face_img = image

            # Heuristic-based spoof detection
            spoof_score, spoof_type = self._heuristic_spoof_detection(face_img)

            is_real = spoof_score < settings.SPOOF_THRESHOLD

            return {
                "is_real": is_real,
                "spoof_score": round(spoof_score, 4),
                "spoof_type": spoof_type if not is_real else None,
                "confidence": round(abs(spoof_score - 0.5) * 2, 4)  # 0-1 confidence
            }

        except Exception as e:
            logger.error(f"Error in spoof detection: {e}")
            return {
                "is_real": True,
                "spoof_score": 0.3,
                "spoof_type": None,
                "confidence": 0.4,
                "error": str(e)
            }

    def _heuristic_spoof_detection(
        self,
        face_img: np.ndarray
    ) -> Tuple[float, str]:
        """
        Heuristic-based spoof detection using image analysis

        Checks for:
        - Color distribution (screens have different color profiles)
        - Texture analysis (printed photos lack fine texture)
        - Reflection patterns (screens have reflections)
        - Edge sharpness (photos/screens have different edges)

        Args:
            face_img: Face region image

        Returns:
            Tuple of (spoof_score, detected_type)
        """
        scores = []
        detected_type = None

        # Resize for consistent analysis
        face_img = cv2.resize(face_img, (128, 128))

        # 1. Color analysis
        hsv = cv2.cvtColor(face_img, cv2.COLOR_BGR2HSV)
        h, s, v = cv2.split(hsv)

        # Check saturation variance (screens often have uniform saturation)
        sat_var = np.var(s)
        if sat_var < 200:  # Low variance might indicate screen
            scores.append(0.6)
            detected_type = "screen"
        else:
            scores.append(0.3)

        # 2. Texture analysis using Laplacian
        gray = cv2.cvtColor(face_img, cv2.COLOR_BGR2GRAY)
        laplacian_var = cv2.Laplacian(gray, cv2.CV_64F).var()

        if laplacian_var < 100:  # Low texture might indicate print
            scores.append(0.7)
            if detected_type is None:
                detected_type = "print"
        else:
            scores.append(0.2)

        # 3. Edge analysis
        edges = cv2.Canny(gray, 50, 150)
        edge_density = np.sum(edges > 0) / (128 * 128)

        if edge_density < 0.05:  # Very few edges
            scores.append(0.6)
        elif edge_density > 0.3:  # Too many edges (might be screen artifacts)
            scores.append(0.5)
        else:
            scores.append(0.2)

        # 4. Frequency analysis
        f_transform = np.fft.fft2(gray)
        f_shift = np.fft.fftshift(f_transform)
        magnitude = np.log(np.abs(f_shift) + 1)

        # Check for periodic patterns (screen refresh)
        mag_var = np.var(magnitude)
        if mag_var < 2:
            scores.append(0.5)
        else:
            scores.append(0.3)

        # 5. Brightness consistency
        brightness_var = np.var(v)
        if brightness_var < 500:  # Very uniform brightness
            scores.append(0.55)
        else:
            scores.append(0.25)

        # Combine scores
        final_score = np.mean(scores)

        return final_score, detected_type

    def detect_spoof_multi_frame(
        self,
        images: List[np.ndarray],
        faces: List[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """
        Detect spoof using multiple frames (temporal analysis)

        Args:
            images: List of consecutive frame images
            faces: List of face bounding boxes

        Returns:
            Spoof detection results
        """
        if not images:
            return {
                "is_real": True,
                "spoof_score": 0.3,
                "spoof_type": None,
                "confidence": 0.4
            }

        # Analyze each frame
        results = []
        for i, img in enumerate(images):
            face = faces[i] if faces and i < len(faces) else None
            result = self.detect_spoof(img, face)
            results.append(result)

        # Aggregate results
        avg_score = np.mean([r["spoof_score"] for r in results])
        is_real = avg_score < settings.SPOOF_THRESHOLD

        # Find most common spoof type
        spoof_types = [r.get("spoof_type") for r in results if r.get("spoof_type")]
        most_common_type = max(set(spoof_types), key=spoof_types.count) if spoof_types else None

        return {
            "is_real": is_real,
            "spoof_score": round(avg_score, 4),
            "spoof_type": most_common_type if not is_real else None,
            "confidence": round(abs(avg_score - 0.5) * 2, 4),
            "frames_analyzed": len(images)
        }

    # ==================== Full Liveness Verification ====================

    def verify_liveness(
        self,
        images: List[np.ndarray],
        landmarks_list: List[Dict[str, Any]],
        require_blink: bool = True,
        require_head_pose: bool = True,
        require_anti_spoof: bool = True
    ) -> Dict[str, Any]:
        """
        Perform full liveness verification

        Args:
            images: List of consecutive frame images
            landmarks_list: List of landmarks for each frame
            require_blink: Whether blink is required
            require_head_pose: Whether valid head pose is required
            require_anti_spoof: Whether anti-spoof check is required

        Returns:
            Complete liveness verification results
        """
        results = {
            "is_live": False,
            "liveness_score": 0.0,
            "blink_detected": False,
            "head_pose_valid": False,
            "anti_spoof_passed": False,
            "spoof_score": 0.5,
            "checks_passed": 0,
            "checks_total": 0
        }

        checks_passed = 0
        checks_total = 0
        scores = []

        # 1. Blink detection
        if require_blink and landmarks_list:
            checks_total += 1
            blink_result = self.detect_blink_sequence(landmarks_list)
            results["blink_detected"] = blink_result["blink_detected"]
            if blink_result["blink_detected"]:
                checks_passed += 1
                scores.append(1.0)
            else:
                scores.append(0.3)

        # 2. Head pose validation
        if require_head_pose and landmarks_list and images:
            checks_total += 1
            # Check last frame for head pose
            last_landmarks = landmarks_list[-1]
            height, width = images[-1].shape[:2]
            pose_result = self.estimate_head_pose(last_landmarks, width, height)
            results["head_pose_valid"] = pose_result["is_valid"]
            if pose_result["is_valid"]:
                checks_passed += 1
                scores.append(1.0)
            else:
                scores.append(0.4)

        # 3. Anti-spoofing
        if require_anti_spoof and images:
            checks_total += 1
            spoof_result = self.detect_spoof_multi_frame(images)
            results["anti_spoof_passed"] = spoof_result["is_real"]
            results["spoof_score"] = spoof_result["spoof_score"]
            if spoof_result["is_real"]:
                checks_passed += 1
                scores.append(1.0 - spoof_result["spoof_score"])
            else:
                scores.append(0.2)

        # Calculate overall results
        results["checks_passed"] = checks_passed
        results["checks_total"] = checks_total

        if checks_total > 0:
            results["liveness_score"] = round(np.mean(scores), 4)
            results["is_live"] = (
                results["liveness_score"] >= settings.LIVENESS_THRESHOLD and
                checks_passed >= (checks_total * 0.6)  # At least 60% checks must pass
            )
        else:
            results["is_live"] = True
            results["liveness_score"] = 1.0

        return results


# Create singleton instance
liveness_detection_service = LivenessDetectionService()
