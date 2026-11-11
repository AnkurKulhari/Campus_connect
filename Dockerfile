FROM python:3.13-slim

WORKDIR /app

# Install system dependencies for OpenCV and ONNX runtime
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    libgl1 \
    libglib2.0-0 \
    && rm -rf /var/lib/apt/lists/*

# Install python requirements from backend/
COPY backend/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy backend application source
COPY backend/ .

# Make start script executable
RUN chmod +x start.sh

# Run migrations safely and start server with uvicorn
CMD ["./start.sh"]
