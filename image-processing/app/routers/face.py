"""
Face detection and recognition API endpoints
"""

from fastapi import APIRouter, HTTPException
from loguru import logger
from typing import List

from app.models.schemas import (
    FaceDetectionRequest,
    FaceDetectionResponse,
    FaceBox,
    FaceLandmarks,
    FaceEncodeRequest,
    FaceEncodeResponse,
    FaceCompareRequest,
    FaceCompareResponse,
    FaceEnrollRequest,
    FaceEnrollResponse,
    ErrorResponse,
)
from app.utils.image_utils import decode_base64_image, get_image_dimensions
from app.services.face_detection import face_detection_service
from app.services.face_recognition import face_recognition_service
from config import settings


router = APIRouter(prefix="/face", tags=["Face Detection & Recognition"])


@router.post(
    "/detect",
    response_model=FaceDetectionResponse,
    responses={400: {"model": ErrorResponse}, 500: {"model": ErrorResponse}}
)
async def detect_faces(request: FaceDetectionRequest):
    """
    Detect faces in an image

    Returns bounding boxes and optionally facial landmarks for detected faces.
    Uses dlib's HOG-based detector for accurate face detection.
    """
    try:
        # Decode image
        image = decode_base64_image(request.image)
        width, height = get_image_dimensions(image)

        # Detect faces
        faces = face_detection_service.detect_faces(
            image,
            max_faces=request.max_faces
        )

        # Get landmarks if requested
        landmarks_list = None
        if request.return_landmarks and faces:
            landmarks_list = []
            for face in faces:
                landmarks = face_detection_service.get_landmarks(image, face)
                if landmarks:
                    landmarks_list.append(FaceLandmarks(
                        points=landmarks["points"],
                        left_eye=landmarks["left_eye"],
                        right_eye=landmarks["right_eye"],
                        nose=landmarks["nose"],
                        mouth=landmarks["mouth"]
                    ))
                else:
                    landmarks_list.append(None)

        # Convert faces to response format
        face_boxes = [
            FaceBox(
                x=face["x"],
                y=face["y"],
                width=face["width"],
                height=face["height"],
                confidence=face["confidence"]
            )
            for face in faces
        ]

        return FaceDetectionResponse(
            success=True,
            faces_detected=len(faces),
            faces=face_boxes,
            landmarks=landmarks_list,
            image_width=width,
            image_height=height
        )

    except ValueError as e:
        logger.warning(f"Invalid request in face detection: {e}")
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Error in face detection: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")


@router.post(
    "/encode",
    response_model=FaceEncodeResponse,
    responses={400: {"model": ErrorResponse}, 500: {"model": ErrorResponse}}
)
async def encode_face(request: FaceEncodeRequest):
    """
    Extract 128-dimensional face embedding from an image

    Returns a FaceNet-style embedding vector that can be used for face comparison.
    """
    try:
        # Decode image
        image = decode_base64_image(request.image)

        # Get face location
        if request.face_box:
            face = {
                "x": request.face_box.x,
                "y": request.face_box.y,
                "width": request.face_box.width,
                "height": request.face_box.height
            }
        else:
            # Detect face
            faces = face_detection_service.detect_faces(image, max_faces=1)
            if not faces:
                return FaceEncodeResponse(
                    success=True,
                    embedding=[0.0] * 128,
                    embedding_size=128,
                    face_detected=False
                )
            face = faces[0]

        # Get landmarks for better encoding
        landmarks = face_detection_service.get_landmarks(image, face)

        # Get embedding
        embedding = face_recognition_service.get_embedding(image, face, landmarks)

        if embedding is None:
            raise HTTPException(status_code=500, detail="Failed to generate embedding")

        return FaceEncodeResponse(
            success=True,
            embedding=embedding.tolist(),
            embedding_size=len(embedding),
            face_detected=True
        )

    except ValueError as e:
        logger.warning(f"Invalid request in face encoding: {e}")
        raise HTTPException(status_code=400, detail=str(e))
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error in face encoding: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")


@router.post(
    "/compare",
    response_model=FaceCompareResponse,
    responses={400: {"model": ErrorResponse}, 500: {"model": ErrorResponse}}
)
async def compare_faces(request: FaceCompareRequest):
    """
    Compare two faces using their embeddings or images

    Returns similarity score and match determination based on threshold.
    """
    try:
        embedding1 = None
        embedding2 = None

        # Get first embedding
        if request.embedding1:
            embedding1 = request.embedding1
        elif request.image1:
            image1 = decode_base64_image(request.image1)
            faces = face_detection_service.detect_faces(image1, max_faces=1)
            if not faces:
                raise HTTPException(status_code=400, detail="No face detected in image1")
            face = faces[0]
            landmarks = face_detection_service.get_landmarks(image1, face)
            embedding1 = face_recognition_service.get_embedding(image1, face, landmarks)
        else:
            raise HTTPException(status_code=400, detail="Either embedding1 or image1 is required")

        # Get second embedding
        if request.embedding2:
            embedding2 = request.embedding2
        elif request.image2:
            image2 = decode_base64_image(request.image2)
            faces = face_detection_service.detect_faces(image2, max_faces=1)
            if not faces:
                raise HTTPException(status_code=400, detail="No face detected in image2")
            face = faces[0]
            landmarks = face_detection_service.get_landmarks(image2, face)
            embedding2 = face_recognition_service.get_embedding(image2, face, landmarks)
        else:
            raise HTTPException(status_code=400, detail="Either embedding2 or image2 is required")

        # Compare embeddings
        similarity, is_match, confidence = face_recognition_service.compare_embeddings(
            embedding1, embedding2
        )

        return FaceCompareResponse(
            success=True,
            similarity=round(similarity, 4),
            is_match=is_match,
            threshold=settings.FACE_MATCH_THRESHOLD,
            confidence=confidence
        )

    except ValueError as e:
        logger.warning(f"Invalid request in face comparison: {e}")
        raise HTTPException(status_code=400, detail=str(e))
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error in face comparison: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")


@router.post(
    "/enroll",
    response_model=FaceEnrollResponse,
    responses={400: {"model": ErrorResponse}, 500: {"model": ErrorResponse}}
)
async def enroll_face(request: FaceEnrollRequest):
    """
    Enroll a student's face for future verification

    Accepts multiple images for better template quality.
    Creates averaged face embedding for the student.
    """
    try:
        if not request.images:
            raise HTTPException(status_code=400, detail="At least one image is required")

        # Check if already enrolled
        if face_recognition_service.template_exists(request.student_id) and not request.overwrite:
            raise HTTPException(
                status_code=400,
                detail=f"Student {request.student_id} already enrolled. Set overwrite=true to replace."
            )

        embeddings = []

        for idx, img_base64 in enumerate(request.images):
            try:
                image = decode_base64_image(img_base64)

                # Detect face
                faces = face_detection_service.detect_faces(image, max_faces=1)
                if not faces:
                    logger.warning(f"No face detected in image {idx + 1}")
                    continue

                face = faces[0]
                landmarks = face_detection_service.get_landmarks(image, face)

                # Get embedding
                embedding = face_recognition_service.get_embedding(image, face, landmarks)
                if embedding is not None:
                    embeddings.append(embedding)

            except Exception as e:
                logger.warning(f"Error processing image {idx + 1}: {e}")
                continue

        if not embeddings:
            raise HTTPException(
                status_code=400,
                detail="Could not extract face embeddings from any provided images"
            )

        # Save template
        success = face_recognition_service.save_template(request.student_id, embeddings)

        if not success:
            raise HTTPException(status_code=500, detail="Failed to save face template")

        return FaceEnrollResponse(
            success=True,
            student_id=request.student_id,
            faces_enrolled=len(embeddings),
            message=f"Successfully enrolled {len(embeddings)} face(s) for student {request.student_id}"
        )

    except ValueError as e:
        logger.warning(f"Invalid request in face enrollment: {e}")
        raise HTTPException(status_code=400, detail=str(e))
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error in face enrollment: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")


@router.delete(
    "/enroll/{student_id}",
    responses={404: {"model": ErrorResponse}, 500: {"model": ErrorResponse}}
)
async def delete_enrollment(student_id: str):
    """
    Delete a student's face enrollment
    """
    try:
        if not face_recognition_service.template_exists(student_id):
            raise HTTPException(
                status_code=404,
                detail=f"No enrollment found for student {student_id}"
            )

        success = face_recognition_service.delete_template(student_id)

        if not success:
            raise HTTPException(status_code=500, detail="Failed to delete enrollment")

        return {
            "success": True,
            "message": f"Enrollment deleted for student {student_id}"
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error deleting enrollment: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")


@router.get(
    "/enroll/{student_id}/status",
    responses={500: {"model": ErrorResponse}}
)
async def check_enrollment_status(student_id: str):
    """
    Check if a student is enrolled
    """
    try:
        is_enrolled = face_recognition_service.template_exists(student_id)

        return {
            "student_id": student_id,
            "is_enrolled": is_enrolled
        }

    except Exception as e:
        logger.error(f"Error checking enrollment status: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")


@router.get(
    "/enroll/list/all",
    responses={500: {"model": ErrorResponse}}
)
async def list_all_enrollments():
    """
    List all enrolled students (for debugging)
    """
    import os
    try:
        template_dir = settings.FACE_TEMPLATES_DIR
        if not os.path.exists(template_dir):
            return {
                "success": True,
                "count": 0,
                "students": [],
                "template_dir": template_dir
            }

        files = os.listdir(template_dir)
        student_ids = [f.replace('.pkl', '') for f in files if f.endswith('.pkl')]

        return {
            "success": True,
            "count": len(student_ids),
            "students": student_ids,
            "template_dir": template_dir
        }

    except Exception as e:
        logger.error(f"Error listing enrollments: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")
