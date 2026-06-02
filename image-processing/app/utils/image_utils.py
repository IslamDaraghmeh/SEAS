"""
Image utility functions for SEAS Image Processing Service
"""

import base64
import cv2
import numpy as np
from typing import Optional, Tuple, List
from PIL import Image
import io
from loguru import logger

from config import settings


def decode_base64_image(base64_string: str) -> np.ndarray:
    """
    Decode a base64 encoded image to numpy array (OpenCV format)

    Args:
        base64_string: Base64 encoded image string (may include data URI prefix)

    Returns:
        numpy array in BGR format (OpenCV standard)

    Raises:
        ValueError: If image decoding fails
    """
    try:
        # Remove data URI prefix if present
        if "," in base64_string:
            base64_string = base64_string.split(",")[1]

        # Decode base64 to bytes
        image_bytes = base64.b64decode(base64_string)

        # Check size limit
        if len(image_bytes) > settings.MAX_IMAGE_SIZE:
            raise ValueError(f"Image size exceeds maximum limit of {settings.MAX_IMAGE_SIZE} bytes")

        # Convert to numpy array
        nparr = np.frombuffer(image_bytes, np.uint8)

        # Decode image
        image = cv2.imdecode(nparr, cv2.IMREAD_COLOR)

        if image is None:
            raise ValueError("Failed to decode image")

        return image

    except Exception as e:
        logger.error(f"Error decoding base64 image: {e}")
        raise ValueError(f"Invalid image data: {str(e)}")


def encode_image_base64(image: np.ndarray, format: str = "jpg") -> str:
    """
    Encode a numpy array image to base64 string

    Args:
        image: numpy array in BGR format
        format: Output format (jpg, png)

    Returns:
        Base64 encoded string with data URI prefix
    """
    try:
        if format.lower() == "png":
            ext = ".png"
            mime = "image/png"
        else:
            ext = ".jpg"
            mime = "image/jpeg"

        # Encode image
        success, buffer = cv2.imencode(ext, image)
        if not success:
            raise ValueError("Failed to encode image")

        # Convert to base64
        base64_string = base64.b64encode(buffer).decode("utf-8")

        # Add data URI prefix
        return f"data:{mime};base64,{base64_string}"

    except Exception as e:
        logger.error(f"Error encoding image to base64: {e}")
        raise ValueError(f"Failed to encode image: {str(e)}")


def preprocess_image(image: np.ndarray, target_size: Optional[Tuple[int, int]] = None) -> np.ndarray:
    """
    Preprocess image for face detection/recognition

    Args:
        image: Input image in BGR format
        target_size: Optional target size (width, height)

    Returns:
        Preprocessed image
    """
    # Convert to RGB if needed (some models expect RGB)
    # Note: dlib uses RGB, OpenCV uses BGR

    # Resize if needed
    if target_size:
        image = cv2.resize(image, target_size, interpolation=cv2.INTER_LINEAR)

    return image


def resize_image(image: np.ndarray, max_dimension: int = 1024) -> Tuple[np.ndarray, float]:
    """
    Resize image if it exceeds max dimension while maintaining aspect ratio

    Args:
        image: Input image
        max_dimension: Maximum width or height

    Returns:
        Tuple of (resized image, scale factor)
    """
    height, width = image.shape[:2]

    if max(height, width) <= max_dimension:
        return image, 1.0

    if width > height:
        scale = max_dimension / width
    else:
        scale = max_dimension / height

    new_width = int(width * scale)
    new_height = int(height * scale)

    resized = cv2.resize(image, (new_width, new_height), interpolation=cv2.INTER_LINEAR)

    return resized, scale


def crop_face(image: np.ndarray, box: dict, margin: float = 0.2) -> np.ndarray:
    """
    Crop face from image with margin

    Args:
        image: Input image
        box: Face bounding box dict with x, y, width, height
        margin: Margin to add around face (as fraction of face size)

    Returns:
        Cropped face image
    """
    height, width = image.shape[:2]

    x, y, w, h = box["x"], box["y"], box["width"], box["height"]

    # Add margin
    margin_x = int(w * margin)
    margin_y = int(h * margin)

    # Calculate crop coordinates with bounds checking
    x1 = max(0, x - margin_x)
    y1 = max(0, y - margin_y)
    x2 = min(width, x + w + margin_x)
    y2 = min(height, y + h + margin_y)

    return image[y1:y2, x1:x2]


def align_face(
    image: np.ndarray,
    landmarks: List[Tuple[int, int]],
    target_size: int = 160,
    left_eye_indices: List[int] = None,
    right_eye_indices: List[int] = None
) -> np.ndarray:
    """
    Align face based on eye positions (similarity transform)

    Args:
        image: Input image
        landmarks: 68-point facial landmarks
        target_size: Output face size
        left_eye_indices: Indices for left eye landmarks (default: 36-41)
        right_eye_indices: Indices for right eye landmarks (default: 42-47)

    Returns:
        Aligned face image
    """
    if left_eye_indices is None:
        left_eye_indices = list(range(36, 42))
    if right_eye_indices is None:
        right_eye_indices = list(range(42, 48))

    # Calculate eye centers
    left_eye_pts = [landmarks[i] for i in left_eye_indices]
    right_eye_pts = [landmarks[i] for i in right_eye_indices]

    left_eye_center = np.mean(left_eye_pts, axis=0).astype(np.float32)
    right_eye_center = np.mean(right_eye_pts, axis=0).astype(np.float32)

    # Calculate angle between eyes
    dY = right_eye_center[1] - left_eye_center[1]
    dX = right_eye_center[0] - left_eye_center[0]
    angle = np.degrees(np.arctan2(dY, dX))

    # Calculate desired eye positions in output image
    desired_left_eye = (0.35, 0.35)  # Normalized position
    desired_right_eye_x = 1.0 - desired_left_eye[0]

    # Calculate scale
    dist = np.sqrt((dX ** 2) + (dY ** 2))
    desired_dist = (desired_right_eye_x - desired_left_eye[0]) * target_size
    scale = desired_dist / dist

    # Calculate center point between eyes
    eyes_center = ((left_eye_center[0] + right_eye_center[0]) / 2,
                   (left_eye_center[1] + right_eye_center[1]) / 2)

    # Get rotation matrix
    M = cv2.getRotationMatrix2D(eyes_center, angle, scale)

    # Update translation component
    tX = target_size * 0.5
    tY = target_size * desired_left_eye[1]
    M[0, 2] += (tX - eyes_center[0])
    M[1, 2] += (tY - eyes_center[1])

    # Apply affine transformation
    aligned = cv2.warpAffine(image, M, (target_size, target_size),
                             flags=cv2.INTER_CUBIC)

    return aligned


def normalize_image(image: np.ndarray, mean: float = 127.5, std: float = 128.0) -> np.ndarray:
    """
    Normalize image pixel values for neural network input

    Args:
        image: Input image
        mean: Mean value to subtract
        std: Standard deviation to divide by

    Returns:
        Normalized image as float32
    """
    normalized = (image.astype(np.float32) - mean) / std
    return normalized


def convert_bgr_to_rgb(image: np.ndarray) -> np.ndarray:
    """Convert BGR image to RGB"""
    return cv2.cvtColor(image, cv2.COLOR_BGR2RGB)


def convert_rgb_to_bgr(image: np.ndarray) -> np.ndarray:
    """Convert RGB image to BGR"""
    return cv2.cvtColor(image, cv2.COLOR_RGB2BGR)


def get_image_dimensions(image: np.ndarray) -> Tuple[int, int]:
    """Get image dimensions (width, height)"""
    height, width = image.shape[:2]
    return width, height


def draw_face_box(
    image: np.ndarray,
    box: dict,
    color: Tuple[int, int, int] = (0, 255, 0),
    thickness: int = 2
) -> np.ndarray:
    """Draw face bounding box on image"""
    output = image.copy()
    x, y, w, h = box["x"], box["y"], box["width"], box["height"]
    cv2.rectangle(output, (x, y), (x + w, y + h), color, thickness)
    return output


def draw_landmarks(
    image: np.ndarray,
    landmarks: List[Tuple[int, int]],
    color: Tuple[int, int, int] = (0, 255, 0),
    radius: int = 2
) -> np.ndarray:
    """Draw facial landmarks on image"""
    output = image.copy()
    for (x, y) in landmarks:
        cv2.circle(output, (int(x), int(y)), radius, color, -1)
    return output
