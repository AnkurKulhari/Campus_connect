FROM python:3.13-slim

WORKDIR /app

# Install system dependencies for OpenCV, ONNX runtime, and Tesseract OCR
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    libgl1 \
    libglib2.0-0 \
    tesseract-ocr \
    tesseract-ocr-eng \
    && rm -rf /var/lib/apt/lists/*

# Install python requirements
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy backend application source
COPY . .

# Set default port (Railway overrides this with $PORT)
ENV PORT=8000
EXPOSE 8000

# Make start script executable
RUN chmod +x start.sh

# Run migrations safely and start server with uvicorn
CMD ["./start.sh"]
