from fastapi import FastAPI, WebSocket, WebSocketDisconnect, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel
from typing import List, Dict, Any, Optional
import json
import asyncio
import os
from app.pose_engine import PoseEngine
from app.ai_coach import AICoachService

app = FastAPI(
    title="YogaCorrector AI Engine API",
    description="Real-Time Computer Vision & Gemini AI Powered Yoga Posture Analysis",
    version="2.0.0"
)

# Enable CORS for Next.js Frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount Static Files for Reference Pose Heatmap Images
heatmap_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "Heatmap (1)", "Heatmap"))
if os.path.exists(heatmap_dir):
    app.mount("/static/heatmaps", StaticFiles(directory=heatmap_dir), name="heatmaps")

pose_engine = PoseEngine()
ai_coach = AICoachService()

def find_pose_image_filename(pose_name: str) -> Optional[str]:
    """Find matching PNG file in Heatmap directory for a given pose name."""
    if not os.path.exists(heatmap_dir):
        return None
    
    files = os.listdir(heatmap_dir)
    # Direct match or case-insensitive match
    for f in files:
        if f.lower().startswith(pose_name.lower().replace(" ", "")) or f.lower().startswith(pose_name.lower()):
            return f
    # Soft match
    for f in files:
        if pose_name.lower() in f.lower():
            return f
    return None

class SessionSummaryRequest(BaseModel):
    pose_name: str
    average_score: float
    duration_seconds: int

@app.get("/")
def root():
    return {
        "status": "online",
        "service": "YogaCorrector Backend Engine",
        "available_poses_count": len(pose_engine.get_available_poses())
    }

@app.get("/api/health")
def health_check():
    return {"status": "healthy"}

@app.get("/api/poses")
def get_poses():
    poses_list = pose_engine.get_available_poses()
    results = []
    for pose_name in poses_list:
        img_file = find_pose_image_filename(pose_name)
        img_url = f"http://127.0.0.1:8000/static/heatmaps/{img_file}" if img_file else None
        results.append({
            "name": pose_name,
            "image_url": img_url
        })
    return {
        "poses": poses_list,
        "pose_details": results
    }

@app.get("/api/poses/{pose_name}")
def get_pose_details(pose_name: str):
    poses_db = pose_engine.poses_database
    if pose_name not in poses_db:
        raise HTTPException(status_code=404, detail=f"Pose '{pose_name}' not found.")
    
    img_file = find_pose_image_filename(pose_name)
    img_url = f"http://127.0.0.1:8000/static/heatmaps/{img_file}" if img_file else None

    return {
        "pose_name": pose_name,
        "target_angles": poses_db[pose_name],
        "image_url": img_url,
        "joints": ['Left Elbow', 'Right Elbow', 'Right Knee', 'Left Knee',
                  'Right Shoulder', 'Left Shoulder', 'Left Hip', 'Right Hip']
    }

@app.post("/api/session/summary")
def generate_summary(req: SessionSummaryRequest):
    summary = ai_coach.generate_session_summary(req.dict())
    return summary

@app.websocket("/ws/practice/{pose_name}")
async def websocket_practice(websocket: WebSocket, pose_name: str):
    await websocket.accept()
    print(f"[WebSocket] Connected client practicing '{pose_name}'")
    
    last_coaching_time = 0
    cached_advice = ""

    try:
        while True:
            data_text = await websocket.receive_text()
            data = json.loads(data_text)
            
            landmarks = data.get("landmarks")
            selected_pose = data.get("pose_name", pose_name)

            if not landmarks or len(landmarks) < 33:
                await websocket.send_json({"error": "Invalid landmarks. Need 33 pose keypoints."})
                continue

            # Evaluate posture
            eval_result = pose_engine.evaluate_pose(landmarks, selected_pose)

            # Generate real-time coaching text periodically
            now = asyncio.get_event_loop().time()
            if now - last_coaching_time > 3.0:
                cached_advice = ai_coach.generate_realtime_coaching(eval_result)
                last_coaching_time = now

            eval_result["ai_coaching_text"] = cached_advice
            await websocket.send_json(eval_result)

    except WebSocketDisconnect:
        print(f"[WebSocket] Client disconnected from '{pose_name}' session.")
    except Exception as e:
        print(f"[WebSocket] Error during session: {e}")
