
from pathlib import Path
from datetime import datetime, timezone
from contextlib import asynccontextmanager

import cv2
import numpy as np

from fastapi import FastAPI, UploadFile, File, HTTPException
from ultralytics import YOLO

# --------------------------------------------------
# CONFIGURATION
# --------------------------------------------------

BASE_DIR = Path(__file__).resolve().parent.parent
MODEL_PATH = BASE_DIR / "models" / "best.pt"

CONFIDENCE_THRESHOLD = 0.25
IMAGE_SIZE = 640
MAX_IMAGE_SIZE = 10 * 1024 * 1024  # 10 MB

model = None

# --------------------------------------------------
# MODEL LIFECYCLE
# --------------------------------------------------

@asynccontextmanager
async def lifespan(app: FastAPI):
    global model

    if not MODEL_PATH.exists():
        raise RuntimeError(f"Model not found: {MODEL_PATH}")

    print("Loading YOLO vehicle detection model...")
    model = YOLO(str(MODEL_PATH))
    print("Model loaded successfully.")
    print("Classes:", model.names)

    yield

    model = None
    print("Model unloaded.")

# --------------------------------------------------
# FASTAPI APPLICATION
# --------------------------------------------------

app = FastAPI(
    title="Vehicle Detection API",
    description="YOLO-powered vehicle detection service",
    version="1.0.0",
    lifespan=lifespan
)

# --------------------------------------------------
# ROOT ENDPOINT
# --------------------------------------------------

@app.get("/")
def root():
    return {
        "message": "Vehicle Detection API",
        "version": "1.0.0",
        "documentation": "/docs"
    }

# --------------------------------------------------
# HEALTH ENDPOINT
# --------------------------------------------------

@app.get("/health")
def health():
    return {
        "status": "healthy",
        "model_loaded": model is not None,
        "model": "YOLO26n"
    }

# --------------------------------------------------
# IMAGE PREDICTION ENDPOINT
# --------------------------------------------------

@app.post("/predict")
async def predict(file: UploadFile = File(...)):

    if model is None:
        raise HTTPException(
            status_code=503,
            detail="Detection model is not loaded"
        )

    image_bytes = await file.read()

    if not image_bytes:
        raise HTTPException(
            status_code=400,
            detail="Empty image received"
        )

    if len(image_bytes) > MAX_IMAGE_SIZE:
        raise HTTPException(
            status_code=413,
            detail="Image exceeds the 10 MB limit"
        )

    # Decode JPEG/PNG bytes into an OpenCV image
    image_array = np.frombuffer(image_bytes, np.uint8)
    image = cv2.imdecode(image_array, cv2.IMREAD_COLOR)

    if image is None:
        raise HTTPException(
            status_code=400,
            detail="Invalid or unsupported image"
        )

    height, width = image.shape[:2]

    # Run YOLO inference
    try:
        result = model.predict(
            source=image,
            imgsz=IMAGE_SIZE,
            conf=CONFIDENCE_THRESHOLD,
            device="cpu",
            verbose=False
        )[0]

    except Exception as error:
        raise HTTPException(
            status_code=500,
            detail=f"Inference failed: {str(error)}"
        )

    detections = []

    if result.boxes is not None:
        for box in result.boxes:

            class_id = int(box.cls[0].item())
            confidence = float(box.conf[0].item())

            x1, y1, x2, y2 = (
                box.xyxy[0].tolist()
            )

            detections.append({
                "class_id": class_id,
                "class_name": model.names[class_id],
                "confidence": round(confidence, 4),
                "bbox": {
                    "x1": round(x1, 2),
                    "y1": round(y1, 2),
                    "x2": round(x2, 2),
                    "y2": round(y2, 2)
                }
            })
    print("\n========== VEHICLE DETECTION ==========")

    if detections:
        for detection in detections:
            print(
                f"{detection['class_name']} "
                f"| Confidence: {detection['confidence']:.2%}"
            )
    else:
        print("No vehicles detected.")

    print("=======================================\n")

    return {
        "success": True,
        "filename": file.filename,
        "timestamp": datetime.now(
            timezone.utc
        ).isoformat(),
        "image": {
            "width": width,
            "height": height
        },
        "vehicle_count": len(detections),
        "detections": detections
    }