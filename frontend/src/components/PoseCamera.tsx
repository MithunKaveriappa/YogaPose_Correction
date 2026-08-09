"use client";

import { useEffect, useRef, useState } from "react";
import { Camera } from "@mediapipe/camera_utils";
import { Pose, Results } from "@mediapipe/pose";
import { Play, Square, RefreshCw, AlertCircle } from "lucide-react";

interface PoseCameraProps {
  selectedPose: string;
  onEvaluationResult: (result: any) => void;
  isSessionActive: boolean;
  onToggleSession: () => void;
}

export default function PoseCamera({
  selectedPose,
  onEvaluationResult,
  isSessionActive,
  onToggleSession,
}: PoseCameraProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const [wsConnected, setWsConnected] = useState(false);
  const [isCameraReady, setIsCameraReady] = useState(false);

  // Initialize WebSocket connection
  useEffect(() => {
    const wsUrl = `ws://127.0.0.1:8000/ws/practice/${encodeURIComponent(selectedPose)}`;
    const ws = new WebSocket(wsUrl);

    ws.onopen = () => {
      console.log("[WebSocket] Connected to FastAPI Pose Engine");
      setWsConnected(true);
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        onEvaluationResult(data);
      } catch (err) {
        console.error("Failed to parse evaluation result:", err);
      }
    };

    ws.onerror = (err) => {
      console.error("[WebSocket] Connection error:", err);
      setWsConnected(false);
    };

    ws.onclose = () => {
      console.log("[WebSocket] Connection closed");
      setWsConnected(false);
    };

    wsRef.current = ws;

    return () => {
      ws.close();
    };
  }, [selectedPose]);

  // Initialize MediaPipe Pose Client
  useEffect(() => {
    if (!videoRef.current || !canvasRef.current) return;

    const pose = new Pose({
      locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/pose/${file}`,
    });

    pose.setOptions({
      modelComplexity: 1,
      smoothLandmarks: true,
      minDetectionConfidence: 0.5,
      minTrackingConfidence: 0.5,
    });

    pose.onResults((results: Results) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      canvas.width = videoRef.current?.videoWidth || 640;
      canvas.height = videoRef.current?.videoHeight || 480;

      ctx.save();
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(results.image, 0, 0, canvas.width, canvas.height);

      if (results.poseLandmarks) {
        // Draw Skeleton Connections
        const connections = [
          [11, 12], [11, 13], [13, 15], [12, 14], [14, 16],
          [11, 23], [12, 24], [23, 24], [23, 25], [24, 26],
          [25, 27], [26, 28]
        ];

        ctx.lineWidth = 4;
        ctx.strokeStyle = "#22c55e"; // Emerald green skeleton lines

        connections.forEach(([start, end]) => {
          const lm1 = results.poseLandmarks[start];
          const lm2 = results.poseLandmarks[end];
          if (lm1 && lm2) {
            ctx.beginPath();
            ctx.moveTo(lm1.x * canvas.width, lm1.y * canvas.height);
            ctx.lineTo(lm2.x * canvas.width, lm2.y * canvas.height);
            ctx.stroke();
          }
        });

        // Draw Landmark Points
        results.poseLandmarks.forEach((lm) => {
          ctx.beginPath();
          ctx.arc(lm.x * canvas.width, lm.y * canvas.height, 5, 0, 2 * Math.PI);
          ctx.fillStyle = "#38bdf8"; // Light cyan landmark nodes
          ctx.fill();
          ctx.lineWidth = 2;
          ctx.strokeStyle = "#ffffff";
          ctx.stroke();
        });

        // Stream Landmarks to FastAPI WebSocket if active
        if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN && isSessionActive) {
          const payload = {
            pose_name: selectedPose,
            landmarks: results.poseLandmarks.map((lm) => ({
              x: lm.x,
              y: lm.y,
              z: lm.z,
              visibility: lm.visibility || 1.0,
            })),
          };
          wsRef.current.send(JSON.stringify(payload));
        }
      }
      ctx.restore();
    });

    const camera = new Camera(videoRef.current, {
      onFrame: async () => {
        if (videoRef.current) {
          await pose.send({ image: videoRef.current });
        }
      },
      width: 640,
      height: 480,
    });

    camera.start().then(() => setIsCameraReady(true)).catch((err) => console.error("Camera failed:", err));

    return () => {
      camera.stop();
      pose.close();
    };
  }, [isSessionActive, selectedPose]);

  return (
    <div className="relative rounded-3xl overflow-hidden glass-card p-3 border border-white/10 shadow-2xl">
      {/* Video & Canvas Container */}
      <div className="relative aspect-video rounded-2xl overflow-hidden bg-slate-950 flex items-center justify-center">
        <video ref={videoRef} className="hidden" playsInline muted />
        <canvas ref={canvasRef} className="w-full h-full object-cover rounded-2xl" />

        {/* Live HUD Badges */}
        <div className="absolute top-4 left-4 flex items-center gap-2">
          <span className={`px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1.5 backdrop-blur-md ${
            isSessionActive ? "bg-red-500/80 text-white animate-pulse" : "bg-slate-800/80 text-slate-300"
          }`}>
            <span className={`w-2 h-2 rounded-full ${isSessionActive ? "bg-white" : "bg-slate-400"}`} />
            {isSessionActive ? "LIVE SESSION" : "PAUSED"}
          </span>

          <span className={`px-3 py-1 rounded-full text-xs font-medium backdrop-blur-md border ${
            wsConnected ? "bg-emerald-500/20 border-emerald-500/30 text-emerald-300" : "bg-amber-500/20 border-amber-500/30 text-amber-300"
          }`}>
            {wsConnected ? "FastAPI WebSocket Connected" : "Connecting Backend..."}
          </span>
        </div>

        {/* Camera Loading State */}
        {!isCameraReady && (
          <div className="absolute inset-0 bg-slate-950/90 flex flex-col items-center justify-center gap-3 text-slate-400">
            <RefreshCw className="w-8 h-8 animate-spin text-emerald-400" />
            <p className="text-sm font-medium">Initializing GPU Camera Pipeline...</p>
          </div>
        )}
      </div>

      {/* Control Bar */}
      <div className="mt-4 flex items-center justify-between px-2">
        <div className="flex items-center gap-3">
          <button
            onClick={onToggleSession}
            disabled={!isCameraReady}
            className={`px-6 py-3 rounded-2xl font-semibold text-sm flex items-center gap-2 transition-all shadow-lg ${
              isSessionActive
                ? "bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white shadow-red-600/30"
                : "bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white shadow-emerald-600/30"
            }`}
          >
            {isSessionActive ? (
              <>
                <Square className="w-4 h-4 fill-current" /> Stop Session
              </>
            ) : (
              <>
                <Play className="w-4 h-4 fill-current" /> Start Real-Time Tracking
              </>
            )}
          </button>
        </div>

        <div className="text-right text-xs text-slate-400">
          <p className="font-medium text-slate-300">Target Pose: {selectedPose}</p>
          <p>GPU Acceleration Active (60 FPS)</p>
        </div>
      </div>
    </div>
  );
}
