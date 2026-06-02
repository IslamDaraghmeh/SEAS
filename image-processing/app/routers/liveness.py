"""
Liveness detection API endpoints
"""

from fastapi import APIRouter, HTTPException
from loguru import logger
from typing import List

from app.models.schemas import (
    LivenessBlinkRequest,
    LivenessBlinkResponse,
    LivenessHeadPoseRequest,
    LivenessHeadPoseResponse,
    HeadPose,
    LivenessAntiSpoofRequest,
    LivenessAntiSpoofResponse,
    LivenessVerifyRequest,
    LivenessVerifyResponse,
    LivenessLipRequest,
    LivenessLipResponse,
    LivenessNodRequest,
    LivenessNodResponse,
    ChallengeRequest,
    ChallengeResponse,
    ChallengeType,
    ErrorResponse,
)
from app.utils.image_utils import decode_base64_image, get_image_dimensions
from app.services.face_detection import face_detection_service
from app.services.liveness_detection import liveness_detection_service
from config import settings


router = APIRouter(prefix="/liveness", tags=["Liveness Detection"])


@router.post(
    "/blink",
    response_model=LivenessBlinkResponse,
    responses={400: {"model": ErrorResponse}, 500: {"model": ErrorResponse}}
)
async def detect_blink(request: LivenessBlinkRequest):
    """
    Detect eye blink using Eye Aspect Ratio (EAR)

    Can process a single image or a sequence of images for temporal blink detection.
    Returns EAR values and blink status.
    """
    try:
        # Handle single image or sequence
        if request.images:
            # Process sequence of images
            landmarks_list = []

            for img_base64 in request.images:
                image = decode_base64_image(img_base64)

                # Detect face and get landmarks
                faces = face_detection_service.detect_faces(image, max_faces=1)
                if not faces:
                    continue

                landmarks = face_detection_service.get_landmarks(image, faces[0])
                if landmarks:
                    landmarks_list.append(landmarks)

            if not landmarks_list:
                return LivenessBlinkResponse(
                    success=True,
                    blink_detected=False,
                    ear_value=0.3,
                    ear_threshold=settings.EAR_THRESHOLD,
                    left_eye_ear=0.3,
                    right_eye_ear=0.3,
                    eyes_open=True
                )

            # Detect blink in sequence
            result = liveness_detection_service.detect_blink_sequence(landmarks_list)

            return LivenessBlinkResponse(
                success=True,
                blink_detected=result["blink_detected"],
                ear_value=result["avg_ear"],
                ear_threshold=settings.EAR_THRESHOLD,
                left_eye_ear=result["min_ear"],  # Using min as representative
                right_eye_ear=result["max_ear"],  # Using max as representative
                eyes_open=result["max_ear"] > settings.EAR_THRESHOLD
            )

        elif request.image:
            # Process single image
            image = decode_base64_image(request.image)

            # Use provided landmarks or detect
            if request.landmarks:
                landmarks = {
                    "left_eye": request.landmarks.left_eye,
                    "right_eye": request.landmarks.right_eye
                }
            else:
                faces = face_detection_service.detect_faces(image, max_faces=1)
                if not faces:
                    return LivenessBlinkResponse(
                        success=True,
                        blink_detected=False,
                        ear_value=0.3,
                        ear_threshold=settings.EAR_THRESHOLD,
                        left_eye_ear=0.3,
                        right_eye_ear=0.3,
                        eyes_open=True
                    )

                landmarks = face_detection_service.get_landmarks(image, faces[0])
                if not landmarks:
                    return LivenessBlinkResponse(
                        success=True,
                        blink_detected=False,
                        ear_value=0.3,
                        ear_threshold=settings.EAR_THRESHOLD,
                        left_eye_ear=0.3,
                        right_eye_ear=0.3,
                        eyes_open=True
                    )

            # Detect blink
            result = liveness_detection_service.detect_blink(landmarks)

            return LivenessBlinkResponse(
                success=True,
                blink_detected=result["blink_detected"],
                ear_value=result["ear_value"],
                ear_threshold=result["ear_threshold"],
                left_eye_ear=result["left_eye_ear"],
                right_eye_ear=result["right_eye_ear"],
                eyes_open=result["eyes_open"]
            )

        else:
            raise HTTPException(status_code=400, detail="Either image or images is required")

    except ValueError as e:
        logger.warning(f"Invalid request in blink detection: {e}")
        raise HTTPException(status_code=400, detail=str(e))
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error in blink detection: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")


@router.post(
    "/head-pose",
    response_model=LivenessHeadPoseResponse,
    responses={400: {"model": ErrorResponse}, 500: {"model": ErrorResponse}}
)
async def validate_head_pose(request: LivenessHeadPoseRequest):
    """
    Validate head pose using solvePnP algorithm

    Returns yaw, pitch, roll angles and whether the pose is valid (facing camera).
    Can optionally check for a specific expected pose direction.
    """
    try:
        image = decode_base64_image(request.image)
        width, height = get_image_dimensions(image)

        # Use provided landmarks or detect
        if request.landmarks:
            landmarks = {
                "points": request.landmarks.points,
                "left_eye": request.landmarks.left_eye,
                "right_eye": request.landmarks.right_eye,
                "nose": request.landmarks.nose,
                "mouth": request.landmarks.mouth
            }
        else:
            faces = face_detection_service.detect_faces(image, max_faces=1)
            if not faces:
                return LivenessHeadPoseResponse(
                    success=True,
                    is_valid=False,
                    pose=HeadPose(yaw=0.0, pitch=0.0, roll=0.0),
                    pose_direction="unknown",
                    matches_expected=False
                )

            landmarks = face_detection_service.get_landmarks(image, faces[0])
            if not landmarks:
                return LivenessHeadPoseResponse(
                    success=True,
                    is_valid=False,
                    pose=HeadPose(yaw=0.0, pitch=0.0, roll=0.0),
                    pose_direction="unknown",
                    matches_expected=False
                )

        # Validate head pose
        result = liveness_detection_service.validate_head_pose(
            landmarks, width, height, request.expected_pose
        )

        return LivenessHeadPoseResponse(
            success=True,
            is_valid=result["is_valid"],
            pose=HeadPose(
                yaw=result["yaw"],
                pitch=result["pitch"],
                roll=result["roll"]
            ),
            pose_direction=result["pose_direction"],
            matches_expected=result.get("matches_expected", True)
        )

    except ValueError as e:
        logger.warning(f"Invalid request in head pose validation: {e}")
        raise HTTPException(status_code=400, detail=str(e))
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error in head pose validation: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")


@router.post(
    "/anti-spoof",
    response_model=LivenessAntiSpoofResponse,
    responses={400: {"model": ErrorResponse}, 500: {"model": ErrorResponse}}
)
async def anti_spoof_check(request: LivenessAntiSpoofRequest):
    """
    Perform anti-spoofing check

    Detects if the face is real or a spoof (photo, screen, mask).
    Uses heuristic-based detection with texture and color analysis.
    """
    try:
        if request.images:
            # Multi-frame analysis
            images = []
            faces_list = []

            for img_base64 in request.images:
                image = decode_base64_image(img_base64)
                images.append(image)

                faces = face_detection_service.detect_faces(image, max_faces=1)
                faces_list.append(faces[0] if faces else None)

            result = liveness_detection_service.detect_spoof_multi_frame(
                images, faces_list
            )

        else:
            # Single image analysis
            image = decode_base64_image(request.image)

            faces = face_detection_service.detect_faces(image, max_faces=1)
            face = faces[0] if faces else None

            result = liveness_detection_service.detect_spoof(image, face)

        return LivenessAntiSpoofResponse(
            success=True,
            is_real=result["is_real"],
            spoof_score=result["spoof_score"],
            spoof_type=result.get("spoof_type"),
            confidence=result["confidence"]
        )

    except ValueError as e:
        logger.warning(f"Invalid request in anti-spoof check: {e}")
        raise HTTPException(status_code=400, detail=str(e))
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error in anti-spoof check: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")


@router.post(
    "/verify",
    response_model=LivenessVerifyResponse,
    responses={400: {"model": ErrorResponse}, 500: {"model": ErrorResponse}}
)
async def verify_liveness(request: LivenessVerifyRequest):
    """
    Perform full liveness verification

    Combines blink detection, head pose validation, and anti-spoofing checks.
    Returns comprehensive liveness assessment.
    """
    try:
        if not request.images:
            raise HTTPException(status_code=400, detail="At least one image is required")

        images = []
        landmarks_list = []

        for img_base64 in request.images:
            image = decode_base64_image(img_base64)
            images.append(image)

            # Get landmarks for liveness checks
            faces = face_detection_service.detect_faces(image, max_faces=1)
            if faces:
                landmarks = face_detection_service.get_landmarks(image, faces[0])
                if landmarks:
                    landmarks_list.append(landmarks)
                else:
                    landmarks_list.append(None)
            else:
                landmarks_list.append(None)

        # Filter out None landmarks
        valid_landmarks = [l for l in landmarks_list if l is not None]

        if not valid_landmarks:
            return LivenessVerifyResponse(
                success=True,
                is_live=False,
                liveness_score=0.0,
                blink_detected=False,
                head_pose_valid=False,
                anti_spoof_passed=False,
                spoof_score=0.5,
                checks_passed=0,
                checks_total=3
            )

        # Perform liveness verification
        result = liveness_detection_service.verify_liveness(
            images=images,
            landmarks_list=valid_landmarks,
            require_blink=request.require_blink,
            require_head_pose=request.require_head_pose,
            require_anti_spoof=request.require_anti_spoof
        )

        return LivenessVerifyResponse(
            success=True,
            is_live=result["is_live"],
            liveness_score=result["liveness_score"],
            blink_detected=result["blink_detected"],
            head_pose_valid=result["head_pose_valid"],
            anti_spoof_passed=result["anti_spoof_passed"],
            spoof_score=result["spoof_score"],
            checks_passed=result["checks_passed"],
            checks_total=result["checks_total"]
        )

    except ValueError as e:
        logger.warning(f"Invalid request in liveness verification: {e}")
        raise HTTPException(status_code=400, detail=str(e))
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error in liveness verification: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")


@router.post(
    "/lip-movement",
    response_model=LivenessLipResponse,
    responses={400: {"model": ErrorResponse}, 500: {"model": ErrorResponse}}
)
async def detect_lip_movement(request: LivenessLipRequest):
    """
    Detect lip/mouth movement across a sequence of frames

    Used for "Say Hello" or similar lip movement challenges.
    Analyzes Mouth Aspect Ratio (MAR) changes across frames.
    """
    try:
        if not request.images or len(request.images) < 2:
            raise HTTPException(
                status_code=400,
                detail="At least 2 images required for lip movement detection"
            )

        landmarks_list = []

        for img_base64 in request.images:
            image = decode_base64_image(img_base64)

            faces = face_detection_service.detect_faces(image, max_faces=1)
            if not faces:
                continue

            landmarks = face_detection_service.get_landmarks(image, faces[0])
            if landmarks:
                landmarks_list.append(landmarks)

        if len(landmarks_list) < 2:
            return LivenessLipResponse(
                success=True,
                movement_detected=False,
                mar_values=[],
                mar_change=0.0,
                frames_analyzed=0
            )

        result = liveness_detection_service.detect_lip_movement(landmarks_list)

        return LivenessLipResponse(
            success=True,
            movement_detected=result["movement_detected"],
            mar_values=result["mar_values"],
            mar_change=result["mar_change"],
            mar_min=result.get("mar_min"),
            mar_max=result.get("mar_max"),
            frames_analyzed=result.get("frames_analyzed", len(landmarks_list))
        )

    except ValueError as e:
        logger.warning(f"Invalid request in lip movement detection: {e}")
        raise HTTPException(status_code=400, detail=str(e))
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error in lip movement detection: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")


@router.post(
    "/nod",
    response_model=LivenessNodResponse,
    responses={400: {"model": ErrorResponse}, 500: {"model": ErrorResponse}}
)
async def detect_nod(request: LivenessNodRequest):
    """
    Detect head nodding motion across a sequence of frames

    Analyzes pitch angle changes to detect up-down nodding motion.
    """
    try:
        if not request.images or len(request.images) < 2:
            raise HTTPException(
                status_code=400,
                detail="At least 2 images required for nod detection"
            )

        landmarks_list = []
        image_heights = []
        image_widths = []

        for img_base64 in request.images:
            image = decode_base64_image(img_base64)
            width, height = get_image_dimensions(image)
            image_widths.append(width)
            image_heights.append(height)

            faces = face_detection_service.detect_faces(image, max_faces=1)
            if not faces:
                landmarks_list.append(None)
                continue

            landmarks = face_detection_service.get_landmarks(image, faces[0])
            landmarks_list.append(landmarks)

        # Filter out None landmarks but keep track of valid indices
        valid_landmarks = [l for l in landmarks_list if l is not None]
        valid_heights = [h for i, h in enumerate(image_heights) if landmarks_list[i] is not None]
        valid_widths = [w for i, w in enumerate(image_widths) if landmarks_list[i] is not None]

        if len(valid_landmarks) < 2:
            return LivenessNodResponse(
                success=True,
                nod_detected=False,
                pitch_values=[],
                pitch_range=0.0,
                frames_analyzed=0
            )

        result = liveness_detection_service.detect_nod(
            valid_landmarks,
            valid_heights,
            valid_widths
        )

        return LivenessNodResponse(
            success=True,
            nod_detected=result["nod_detected"],
            pitch_values=result["pitch_values"],
            pitch_range=result["pitch_range"],
            pitch_min=result.get("pitch_min"),
            pitch_max=result.get("pitch_max"),
            direction_changes=result.get("direction_changes", 0),
            frames_analyzed=result.get("frames_analyzed", len(valid_landmarks))
        )

    except ValueError as e:
        logger.warning(f"Invalid request in nod detection: {e}")
        raise HTTPException(status_code=400, detail=str(e))
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error in nod detection: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")


@router.post(
    "/challenge",
    response_model=ChallengeResponse,
    responses={400: {"model": ErrorResponse}, 500: {"model": ErrorResponse}}
)
async def verify_challenge(request: ChallengeRequest):
    """
    Generic challenge verification endpoint

    Routes to appropriate detection based on challenge type:
    - front_selfie: Face detection + baseline capture
    - turn_left: Head pose yaw < -30°
    - turn_right: Head pose yaw > 30°
    - nod: Pitch change detection over frames
    - blink: EAR drops below threshold
    - lip_movement: MAR changes detection
    """
    try:
        if not request.images:
            raise HTTPException(status_code=400, detail="At least one image required")

        challenge_type = request.challenge_type

        # Static challenges (single frame)
        if challenge_type in [ChallengeType.FRONT_SELFIE, ChallengeType.TURN_LEFT, ChallengeType.TURN_RIGHT]:
            image = decode_base64_image(request.images[0])
            width, height = get_image_dimensions(image)

            faces = face_detection_service.detect_faces(image, max_faces=1)
            if not faces:
                return ChallengeResponse(
                    success=True,
                    challenge_type=challenge_type.value,
                    passed=False,
                    confidence=0.0,
                    details={"error": "No face detected"},
                    error="No face detected"
                )

            landmarks = face_detection_service.get_landmarks(image, faces[0])
            if not landmarks:
                return ChallengeResponse(
                    success=True,
                    challenge_type=challenge_type.value,
                    passed=False,
                    confidence=0.0,
                    details={"error": "Could not extract landmarks"},
                    error="Could not extract landmarks"
                )

            pose_result = liveness_detection_service.estimate_head_pose(
                landmarks, width, height
            )

            if challenge_type == ChallengeType.FRONT_SELFIE:
                # Front selfie: just check if face is detected
                # This is the baseline capture - we just need a good face image
                # Face was already detected above, so we pass
                passed = True
                confidence = 0.9

                return ChallengeResponse(
                    success=True,
                    challenge_type=challenge_type.value,
                    passed=passed,
                    confidence=confidence,
                    details={
                        "pose_direction": pose_result.get("pose_direction", "center"),
                        "yaw": pose_result.get("yaw", 0),
                        "pitch": pose_result.get("pitch", 0),
                        "roll": pose_result.get("roll", 0),
                        "face_detected": True
                    }
                )

            elif challenge_type == ChallengeType.TURN_LEFT:
                # Turn left: yaw < -30
                passed = pose_result["yaw"] < -30
                confidence = min(1.0, abs(pose_result["yaw"]) / 45) if passed else 0.3

                return ChallengeResponse(
                    success=True,
                    challenge_type=challenge_type.value,
                    passed=passed,
                    confidence=confidence,
                    details={
                        "pose_direction": pose_result["pose_direction"],
                        "yaw": pose_result["yaw"],
                        "required_yaw": "< -30"
                    }
                )

            elif challenge_type == ChallengeType.TURN_RIGHT:
                # Turn right: yaw > 30
                passed = pose_result["yaw"] > 30
                confidence = min(1.0, abs(pose_result["yaw"]) / 45) if passed else 0.3

                return ChallengeResponse(
                    success=True,
                    challenge_type=challenge_type.value,
                    passed=passed,
                    confidence=confidence,
                    details={
                        "pose_direction": pose_result["pose_direction"],
                        "yaw": pose_result["yaw"],
                        "required_yaw": "> 30"
                    }
                )

        # Motion challenges (multiple frames)
        elif challenge_type == ChallengeType.NOD:
            if len(request.images) < 2:
                raise HTTPException(
                    status_code=400,
                    detail="Nod detection requires at least 2 images"
                )

            # Reuse nod detection logic
            landmarks_list = []
            image_heights = []
            image_widths = []

            for img_base64 in request.images:
                image = decode_base64_image(img_base64)
                width, height = get_image_dimensions(image)
                image_widths.append(width)
                image_heights.append(height)

                faces = face_detection_service.detect_faces(image, max_faces=1)
                if faces:
                    landmarks = face_detection_service.get_landmarks(image, faces[0])
                    landmarks_list.append(landmarks)
                else:
                    landmarks_list.append(None)

            valid_landmarks = [l for l in landmarks_list if l is not None]
            valid_heights = [h for i, h in enumerate(image_heights) if landmarks_list[i] is not None]
            valid_widths = [w for i, w in enumerate(image_widths) if landmarks_list[i] is not None]

            if len(valid_landmarks) < 2:
                return ChallengeResponse(
                    success=True,
                    challenge_type=challenge_type.value,
                    passed=False,
                    confidence=0.0,
                    details={"error": "Insufficient valid frames"},
                    error="Insufficient valid frames"
                )

            result = liveness_detection_service.detect_nod(
                valid_landmarks, valid_heights, valid_widths
            )

            confidence = min(1.0, result["pitch_range"] / 30) if result["nod_detected"] else 0.3

            return ChallengeResponse(
                success=True,
                challenge_type=challenge_type.value,
                passed=result["nod_detected"],
                confidence=confidence,
                details={
                    "pitch_range": result["pitch_range"],
                    "direction_changes": result.get("direction_changes", 0),
                    "frames_analyzed": result.get("frames_analyzed", 0)
                }
            )

        elif challenge_type == ChallengeType.BLINK:
            if len(request.images) < 2:
                raise HTTPException(
                    status_code=400,
                    detail="Blink detection requires at least 2 images"
                )

            landmarks_list = []

            for img_base64 in request.images:
                image = decode_base64_image(img_base64)
                faces = face_detection_service.detect_faces(image, max_faces=1)
                if faces:
                    landmarks = face_detection_service.get_landmarks(image, faces[0])
                    if landmarks:
                        landmarks_list.append(landmarks)

            if len(landmarks_list) < 2:
                return ChallengeResponse(
                    success=True,
                    challenge_type=challenge_type.value,
                    passed=False,
                    confidence=0.0,
                    details={"error": "Insufficient valid frames"},
                    error="Insufficient valid frames"
                )

            result = liveness_detection_service.detect_blink_sequence(landmarks_list)

            confidence = 1.0 if result["blink_detected"] else 0.3

            return ChallengeResponse(
                success=True,
                challenge_type=challenge_type.value,
                passed=result["blink_detected"],
                confidence=confidence,
                details={
                    "blink_count": result.get("blink_count", 0),
                    "min_ear": result.get("min_ear", 0),
                    "frames_analyzed": result.get("frames_analyzed", 0)
                }
            )

        elif challenge_type == ChallengeType.LIP_MOVEMENT:
            if len(request.images) < 2:
                raise HTTPException(
                    status_code=400,
                    detail="Lip movement detection requires at least 2 images"
                )

            landmarks_list = []

            for img_base64 in request.images:
                image = decode_base64_image(img_base64)
                faces = face_detection_service.detect_faces(image, max_faces=1)
                if faces:
                    landmarks = face_detection_service.get_landmarks(image, faces[0])
                    if landmarks:
                        landmarks_list.append(landmarks)

            if len(landmarks_list) < 2:
                return ChallengeResponse(
                    success=True,
                    challenge_type=challenge_type.value,
                    passed=False,
                    confidence=0.0,
                    details={"error": "Insufficient valid frames"},
                    error="Insufficient valid frames"
                )

            result = liveness_detection_service.detect_lip_movement(landmarks_list)

            confidence = min(1.0, result["mar_change"] / 0.4) if result["movement_detected"] else 0.3

            return ChallengeResponse(
                success=True,
                challenge_type=challenge_type.value,
                passed=result["movement_detected"],
                confidence=confidence,
                details={
                    "mar_change": result.get("mar_change", 0),
                    "mar_range": result.get("mar_range", 0),
                    "frames_analyzed": result.get("frames_analyzed", 0)
                }
            )

        else:
            raise HTTPException(
                status_code=400,
                detail=f"Unknown challenge type: {challenge_type}"
            )

    except ValueError as e:
        logger.warning(f"Invalid request in challenge verification: {e}")
        raise HTTPException(status_code=400, detail=str(e))
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error in challenge verification: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")
