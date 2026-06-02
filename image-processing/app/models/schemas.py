"""
Pydantic models for SEAS Image Processing Service API
"""

from pydantic import BaseModel, Field
from typing import Optional, List, Tuple, Dict, Any
from enum import Enum


# ============== Challenge Types ==============

class ChallengeType(str, Enum):
    """Types of liveness challenges"""
    FRONT_SELFIE = "front_selfie"
    TURN_LEFT = "turn_left"
    TURN_RIGHT = "turn_right"
    NOD = "nod"
    BLINK = "blink"
    LIP_MOVEMENT = "lip_movement"


# ============== Common Models ==============

class ErrorResponse(BaseModel):
    """Standard error response"""
    success: bool = False
    error: str
    detail: Optional[str] = None


class HealthResponse(BaseModel):
    """Health check response"""
    status: str = "healthy"
    service: str = "SEAS Image Processing Service"
    version: str
    models_loaded: bool
    mediapipe_available: bool
    tensorflow_available: bool


# ============== Face Detection Models ==============

class FaceBox(BaseModel):
    """Bounding box for detected face"""
    x: int = Field(..., description="X coordinate of top-left corner")
    y: int = Field(..., description="Y coordinate of top-left corner")
    width: int = Field(..., description="Width of bounding box")
    height: int = Field(..., description="Height of bounding box")
    confidence: float = Field(..., description="Detection confidence score")


class FaceLandmarks(BaseModel):
    """68-point facial landmarks"""
    points: List[Tuple[int, int]] = Field(..., description="List of (x, y) landmark points")
    left_eye: List[Tuple[int, int]] = Field(..., description="Left eye landmarks")
    right_eye: List[Tuple[int, int]] = Field(..., description="Right eye landmarks")
    nose: List[Tuple[int, int]] = Field(..., description="Nose landmarks")
    mouth: List[Tuple[int, int]] = Field(..., description="Mouth landmarks")


class FaceDetectionRequest(BaseModel):
    """Request for face detection"""
    image: str = Field(..., description="Base64 encoded image")
    return_landmarks: bool = Field(default=True, description="Whether to return facial landmarks")
    max_faces: int = Field(default=1, description="Maximum number of faces to detect")


class FaceDetectionResponse(BaseModel):
    """Response for face detection"""
    success: bool = True
    faces_detected: int = Field(..., description="Number of faces detected")
    faces: List[FaceBox] = Field(..., description="List of detected face bounding boxes")
    landmarks: Optional[List[FaceLandmarks]] = Field(None, description="Facial landmarks for each face")
    image_width: int = Field(..., description="Original image width")
    image_height: int = Field(..., description="Original image height")


# ============== Face Encoding Models ==============

class FaceEncodeRequest(BaseModel):
    """Request for face encoding"""
    image: str = Field(..., description="Base64 encoded image")
    face_box: Optional[FaceBox] = Field(None, description="Optional face bounding box")


class FaceEncodeResponse(BaseModel):
    """Response for face encoding"""
    success: bool = True
    embedding: List[float] = Field(..., description="128-dimensional face embedding")
    embedding_size: int = Field(default=128, description="Size of the embedding vector")
    face_detected: bool = Field(..., description="Whether a face was detected")


# ============== Face Comparison Models ==============

class FaceCompareRequest(BaseModel):
    """Request for face comparison"""
    embedding1: Optional[List[float]] = Field(None, description="First face embedding")
    embedding2: Optional[List[float]] = Field(None, description="Second face embedding")
    image1: Optional[str] = Field(None, description="First image (base64) - alternative to embedding1")
    image2: Optional[str] = Field(None, description="Second image (base64) - alternative to embedding2")


class FaceCompareResponse(BaseModel):
    """Response for face comparison"""
    success: bool = True
    similarity: float = Field(..., description="Cosine similarity score (0-1)")
    is_match: bool = Field(..., description="Whether faces match based on threshold")
    threshold: float = Field(..., description="Threshold used for matching")
    confidence: str = Field(..., description="Confidence level: high, medium, low")


# ============== Face Enrollment Models ==============

class FaceEnrollRequest(BaseModel):
    """Request for face enrollment"""
    student_id: str = Field(..., description="Unique student identifier")
    images: List[str] = Field(..., description="List of base64 encoded images")
    overwrite: bool = Field(default=False, description="Overwrite existing enrollment")


class FaceEnrollResponse(BaseModel):
    """Response for face enrollment"""
    success: bool = True
    student_id: str = Field(..., description="Student ID that was enrolled")
    faces_enrolled: int = Field(..., description="Number of face templates stored")
    message: str = Field(..., description="Status message")


# ============== Liveness Detection Models ==============

class LivenessBlinkRequest(BaseModel):
    """Request for blink detection"""
    image: str = Field(None, description="Single base64 encoded image")
    images: Optional[List[str]] = Field(None, description="Sequence of base64 encoded images")
    landmarks: Optional[FaceLandmarks] = Field(None, description="Pre-computed landmarks")


class LivenessBlinkResponse(BaseModel):
    """Response for blink detection"""
    success: bool = True
    blink_detected: bool = Field(..., description="Whether a blink was detected")
    ear_value: float = Field(..., description="Eye Aspect Ratio value")
    ear_threshold: float = Field(..., description="EAR threshold used")
    left_eye_ear: float = Field(..., description="Left eye EAR")
    right_eye_ear: float = Field(..., description="Right eye EAR")
    eyes_open: bool = Field(..., description="Whether eyes are currently open")


class HeadPose(BaseModel):
    """Head pose angles"""
    yaw: float = Field(..., description="Yaw angle (left-right rotation)")
    pitch: float = Field(..., description="Pitch angle (up-down rotation)")
    roll: float = Field(..., description="Roll angle (tilt)")


class LivenessHeadPoseRequest(BaseModel):
    """Request for head pose validation"""
    image: str = Field(..., description="Base64 encoded image")
    landmarks: Optional[FaceLandmarks] = Field(None, description="Pre-computed landmarks")
    expected_pose: Optional[str] = Field(None, description="Expected pose: center, left, right, up, down")


class LivenessHeadPoseResponse(BaseModel):
    """Response for head pose validation"""
    success: bool = True
    is_valid: bool = Field(..., description="Whether head pose is valid (facing camera)")
    pose: HeadPose = Field(..., description="Detected head pose angles")
    pose_direction: str = Field(..., description="Detected pose direction")
    matches_expected: bool = Field(default=True, description="Whether pose matches expected direction")


class LivenessAntiSpoofRequest(BaseModel):
    """Request for anti-spoofing check"""
    image: str = Field(..., description="Base64 encoded image")
    images: Optional[List[str]] = Field(None, description="Multiple images for temporal analysis")


class LivenessAntiSpoofResponse(BaseModel):
    """Response for anti-spoofing check"""
    success: bool = True
    is_real: bool = Field(..., description="Whether the face is determined to be real")
    spoof_score: float = Field(..., description="Spoof probability (0-1, lower is more real)")
    spoof_type: Optional[str] = Field(None, description="Detected spoof type if any")
    confidence: float = Field(..., description="Confidence in the prediction")


class LivenessVerifyRequest(BaseModel):
    """Request for full liveness verification"""
    images: List[str] = Field(..., description="Sequence of base64 encoded images")
    require_blink: bool = Field(default=True, description="Require blink detection")
    require_head_pose: bool = Field(default=True, description="Require valid head pose")
    require_anti_spoof: bool = Field(default=True, description="Require anti-spoof check")


class LivenessVerifyResponse(BaseModel):
    """Response for full liveness verification"""
    success: bool = True
    is_live: bool = Field(..., description="Overall liveness determination")
    liveness_score: float = Field(..., description="Combined liveness score (0-1)")
    blink_detected: bool = Field(..., description="Whether blink was detected")
    head_pose_valid: bool = Field(..., description="Whether head pose is valid")
    anti_spoof_passed: bool = Field(..., description="Whether anti-spoof check passed")
    spoof_score: float = Field(..., description="Anti-spoof score")
    checks_passed: int = Field(..., description="Number of checks passed")
    checks_total: int = Field(..., description="Total number of checks")


# ============== Full Verification Models ==============

class VerificationRequest(BaseModel):
    """Request for full verification (face match + liveness)"""
    student_id: str = Field(..., description="Student ID to verify against")
    images: List[str] = Field(..., description="Sequence of base64 encoded images for verification")
    verify_liveness: bool = Field(default=True, description="Whether to verify liveness")
    require_blink: bool = Field(default=True, description="Require blink for liveness")
    stored_embedding: Optional[List[float]] = Field(None, description="Optional: pre-stored embedding to compare against")


class VerificationResponse(BaseModel):
    """Response for full verification"""
    success: bool = True
    is_verified: bool = Field(..., description="Overall verification result")
    match_score: float = Field(..., description="Face match similarity score (0-1)")
    liveness_score: float = Field(..., description="Liveness score (0-1)")
    blink_detected: bool = Field(..., description="Whether blink was detected")
    head_pose_valid: bool = Field(..., description="Whether head pose is valid")
    spoof_score: float = Field(..., description="Anti-spoof score (lower is better)")
    face_detected: bool = Field(..., description="Whether face was detected")
    verification_details: dict = Field(default_factory=dict, description="Detailed verification results")


# ============== Lip Movement Detection Models ==============

class LivenessLipRequest(BaseModel):
    """Request for lip movement detection"""
    images: List[str] = Field(..., description="Sequence of base64 encoded images")


class LivenessLipResponse(BaseModel):
    """Response for lip movement detection"""
    success: bool = True
    movement_detected: bool = Field(..., description="Whether lip movement was detected")
    mar_values: List[float] = Field(default_factory=list, description="MAR values for each frame")
    mar_change: float = Field(..., description="Range of MAR values (max - min)")
    mar_min: Optional[float] = Field(None, description="Minimum MAR value")
    mar_max: Optional[float] = Field(None, description="Maximum MAR value")
    frames_analyzed: int = Field(default=0, description="Number of frames analyzed")


# ============== Nod Detection Models ==============

class LivenessNodRequest(BaseModel):
    """Request for head nod detection"""
    images: List[str] = Field(..., description="Sequence of base64 encoded images")


class LivenessNodResponse(BaseModel):
    """Response for head nod detection"""
    success: bool = True
    nod_detected: bool = Field(..., description="Whether head nod was detected")
    pitch_values: List[float] = Field(default_factory=list, description="Pitch angles for each frame")
    pitch_range: float = Field(..., description="Range of pitch values")
    pitch_min: Optional[float] = Field(None, description="Minimum pitch angle")
    pitch_max: Optional[float] = Field(None, description="Maximum pitch angle")
    direction_changes: int = Field(default=0, description="Number of direction changes detected")
    frames_analyzed: int = Field(default=0, description="Number of frames analyzed")


# ============== Generic Challenge Models ==============

class ChallengeRequest(BaseModel):
    """Request for generic challenge verification"""
    challenge_type: ChallengeType = Field(..., description="Type of challenge to verify")
    images: List[str] = Field(..., description="Base64 encoded images (single for static, sequence for motion)")
    expected_direction: Optional[str] = Field(None, description="Expected direction for pose challenges")


class ChallengeResponse(BaseModel):
    """Response for generic challenge verification"""
    success: bool = True
    challenge_type: str = Field(..., description="Type of challenge that was verified")
    passed: bool = Field(..., description="Whether the challenge was passed")
    confidence: float = Field(default=0.0, description="Confidence score (0-1)")
    details: Dict[str, Any] = Field(default_factory=dict, description="Challenge-specific details")
    error: Optional[str] = Field(None, description="Error message if any")
