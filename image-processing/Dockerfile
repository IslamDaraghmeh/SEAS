# SEAS Image Processing Service - Dockerfile
# Using pre-built packages for easier Docker builds

FROM python:3.11-slim

# Install system dependencies for OpenCV and face_recognition
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    cmake \
    libopenblas-dev \
    liblapack-dev \
    libx11-dev \
    libgtk-3-dev \
    libboost-python-dev \
    libboost-thread-dev \
    libboost-system-dev \
    libgl1 \
    libglib2.0-0 \
    libsm6 \
    libxext6 \
    libxrender1 \
    && rm -rf /var/lib/apt/lists/*

# Create non-root user
RUN groupadd -r seas && useradd -r -g seas seas

# Set working directory
WORKDIR /app

# Create necessary directories
RUN mkdir -p /app/models /app/data/face_templates /app/logs && \
    chown -R seas:seas /app

# Copy requirements and install dependencies
COPY --chown=seas:seas requirements.txt .
RUN pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY --chown=seas:seas . .

# Switch to non-root user
USER seas

# Expose port
EXPOSE 8000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD python -c "import urllib.request; urllib.request.urlopen('http://localhost:8000/health')" || exit 1

# Environment variables
ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    HOST=0.0.0.0 \
    PORT=8000

# Run the application
CMD ["python", "main.py"]
