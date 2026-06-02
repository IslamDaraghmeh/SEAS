"""
Combined verification API endpoint (face match + liveness)
"""

from fastapi import APIRouter, HTTPException
from loguru import logger
from typing import List
import numpy as np

from app.models.schemas import (
    VerificationRequest,
    VerificationResponse,
    ErrorResponse,
)
from app.utils.image_utils import decode_base64_image, get_image_dimensions
from app.services.face_detection import face_detection_service
from app.services.face_recognition import face_recognition_service
from app.services.liveness_detection import liveness_detection_service
from config import settings


router = APIRouter(prefix="/verify", tags=["Verification"])


@router.post(
    "",
    response_model=VerificationResponse,
    responses={400: {"model": ErrorResponse}, 500: {"model": ErrorResponse}}
)
async def verify_identity(request: VerificationRequest):
    """
    Perform full identity verification

    Combines face matching with the enrolled template and liveness detection.
    Returns comprehensive verification results including:
    - matchScore: Face similarity score
    - livenessScore: Combined liveness score
    - blinkDetected: Whether blink was detected
    - headPoseValid: Whether head pose is valid
    - spoofScore: Anti-spoofing score
    - isVerified: Overall verification result
    """
    try:
        if not request.images:
            raise HTTPException(status_code=400, detail="At least one image is required")

        # Initialize response data
        verification_details = {
            "face_detection": {},
            "face_matching": {},
            "liveness": {}
        }

        images = []
        landmarks_list = []
        embeddings = []
        face_detected = False

        # Process all images
        for idx, img_base64 in enumerate(request.images):
            try:
                image = decode_base64_image(img_base64)
                images.append(image)

                # Detect face
                faces = face_detection_service.detect_faces(image, max_faces=1)

                if faces:
                    face_detected = True
                    face = faces[0]

                    # Get landmarks
                    landmarks = face_detection_service.get_landmarks(image, face)
                    if landmarks:
                        landmarks_list.append(landmarks)
                    else:
                        landmarks_list.append(None)

                    # Get embedding for face matching
                    embedding = face_recognition_service.get_embedding(image, face, landmarks)
                    if embedding is not None:
                        embeddings.append(embedding)
                else:
                    landmarks_list.append(None)

            except Exception as e:
                logger.warning(f"Error processing image {idx}: {e}")
                landmarks_list.append(None)

        # If no face detected in any image
        if not face_detected:
            return VerificationResponse(
                success=True,
                is_verified=False,
                match_score=0.0,
                liveness_score=0.0,
                blink_detected=False,
                head_pose_valid=False,
                spoof_score=0.5,
                face_detected=False,
                verification_details={
                    "error": "No face detected in any provided image"
                }
            )

        # ==================== Face Matching ====================
        match_score = 0.0
        is_match = False

        logger.info(f"Starting face matching for student: {request.student_id}")
        logger.info(f"Number of embeddings extracted: {len(embeddings)}")

        if embeddings:
            # Get stored template or use provided embedding
            stored_embedding = None

            if request.stored_embedding:
                stored_embedding = np.array(request.stored_embedding, dtype=np.float32)
                logger.info("Using provided stored_embedding")
            else:
                stored_embedding = face_recognition_service.load_template(request.student_id)
                if stored_embedding is not None:
                    logger.info(f"Loaded stored template for student {request.student_id}, embedding size: {len(stored_embedding)}")
                else:
                    logger.warning(f"No stored template found for student {request.student_id}")

            if stored_embedding is not None:
                # Use the best embedding from captured images
                # Compare each captured embedding with stored and take the best match
                best_similarity = 0.0

                for idx, embedding in enumerate(embeddings):
                    similarity, match, confidence = face_recognition_service.compare_embeddings(
                        embedding, stored_embedding
                    )
                    # Convert numpy types to native Python types
                    similarity = float(similarity) if hasattr(similarity, 'item') else float(similarity)
                    logger.info(f"Embedding {idx}: similarity={similarity:.4f}, match={match}, confidence={confidence}")
                    if similarity > best_similarity:
                        best_similarity = similarity
                        is_match = bool(match)

                match_score = float(best_similarity)
                logger.info(f"Best match score: {match_score:.4f}, is_match: {is_match}")

                verification_details["face_matching"] = {
                    "similarity": round(float(match_score), 4),
                    "is_match": bool(is_match),
                    "threshold": float(settings.FACE_MATCH_THRESHOLD),
                    "embeddings_compared": len(embeddings)
                }
            else:
                verification_details["face_matching"] = {
                    "error": f"No stored template found for student {request.student_id}"
                }

        # ==================== Liveness Detection ====================
        liveness_score = 1.0
        blink_detected = False
        head_pose_valid = True
        spoof_score = 0.3
        is_live = True

        if request.verify_liveness:
            # Filter valid landmarks
            valid_landmarks = [l for l in landmarks_list if l is not None]

            if valid_landmarks:
                liveness_result = liveness_detection_service.verify_liveness(
                    images=images,
                    landmarks_list=valid_landmarks,
                    require_blink=request.require_blink,
                    require_head_pose=True,
                    require_anti_spoof=True
                )

                # Convert numpy types to native Python types
                is_live = bool(liveness_result["is_live"])
                liveness_score = float(liveness_result["liveness_score"])
                blink_detected = bool(liveness_result["blink_detected"])
                head_pose_valid = bool(liveness_result["head_pose_valid"])
                spoof_score = float(liveness_result["spoof_score"])

                verification_details["liveness"] = {
                    "is_live": bool(is_live),
                    "score": float(liveness_score),
                    "blink_detected": bool(blink_detected),
                    "head_pose_valid": bool(head_pose_valid),
                    "spoof_score": float(spoof_score),
                    "checks_passed": int(liveness_result["checks_passed"]),
                    "checks_total": int(liveness_result["checks_total"])
                }
            else:
                verification_details["liveness"] = {
                    "error": "Could not extract landmarks for liveness detection"
                }
                liveness_score = 0.5

        # ==================== Final Verification Decision ====================
        # Combine face match and liveness for final decision
        is_verified = False

        if request.verify_liveness:
            # Both face match AND liveness must pass
            is_verified = is_match and is_live and match_score >= settings.FACE_MATCH_THRESHOLD
        else:
            # Only face match required
            is_verified = is_match and match_score >= settings.FACE_MATCH_THRESHOLD

        verification_details["final_decision"] = {
            "face_match_passed": bool(is_match),
            "liveness_passed": bool(is_live) if request.verify_liveness else True,
            "verification_result": bool(is_verified)
        }

        return VerificationResponse(
            success=True,
            is_verified=bool(is_verified),
            match_score=round(float(match_score), 4),
            liveness_score=round(float(liveness_score), 4),
            blink_detected=bool(blink_detected),
            head_pose_valid=bool(head_pose_valid),
            spoof_score=round(float(spoof_score), 4),
            face_detected=bool(face_detected),
            verification_details=verification_details
        )

    except ValueError as e:
        logger.warning(f"Invalid request in verification: {e}")
        raise HTTPException(status_code=400, detail=str(e))
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error in verification: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")


@router.post(
    "/quick",
    responses={400: {"model": ErrorResponse}, 500: {"model": ErrorResponse}}
)
async def quick_verify(
    student_id: str,
    image: str,
    stored_embedding: List[float] = None
):
    """
    Quick verification with a single image

    Simplified endpoint for rapid verification without liveness checks.
    Useful for initial face matching before full verification.
    """
    try:
        # Decode image
        decoded_image = decode_base64_image(image)

        # Detect face
        faces = face_detection_service.detect_faces(decoded_image, max_faces=1)

        if not faces:
            return {
                "success": True,
                "is_match": False,
                "match_score": 0.0,
                "face_detected": False,
                "message": "No face detected"
            }

        face = faces[0]

        # Get embedding
        landmarks = face_detection_service.get_landmarks(decoded_image, face)
        embedding = face_recognition_service.get_embedding(decoded_image, face, landmarks)

        if embedding is None:
            return {
                "success": True,
                "is_match": False,
                "match_score": 0.0,
                "face_detected": True,
                "message": "Could not extract face embedding"
            }

        # Get stored template
        template = None
        if stored_embedding:
            template = np.array(stored_embedding, dtype=np.float32)
        else:
            template = face_recognition_service.load_template(student_id)

        if template is None:
            return {
                "success": True,
                "is_match": False,
                "match_score": 0.0,
                "face_detected": True,
                "message": f"No template found for student {student_id}"
            }

        # Compare
        similarity, is_match, confidence = face_recognition_service.compare_embeddings(
            embedding, template
        )

        return {
            "success": True,
            "is_match": is_match,
            "match_score": round(similarity, 4),
            "face_detected": True,
            "confidence": confidence,
            "threshold": settings.FACE_MATCH_THRESHOLD
        }

    except ValueError as e:
        logger.warning(f"Invalid request in quick verify: {e}")
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Error in quick verify: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")
