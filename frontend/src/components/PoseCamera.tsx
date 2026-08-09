"use client";

import { useEffect, useRef, useState } from "react";
import { Camera } from "@mediapipe/camera_utils";
import { Pose, Results } from "@mediapipe/pose";
import { Play, Square, RefreshCw, Video, Download, Maximize2, Minimize2 } from "lucide-react";

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
  const containerRef = useRef<HTMLDivElement | null>(null);
  const wsRef = useRef<WebSocket | null>(null);

  const [wsConnected, setWsConnected] = useState(false);
  const [isCameraReady, setIsCameraReady] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Recording State
  const [isRecording, setIsRecording] = useState(false);
  const [recordedVideoUrl, setRecordedVideoUrl] = useState<string | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordedChunksRef = useRef<Blob[]>([]);

  // Initialize WebSocket connection
  useEffect(() => {
    const wsUrl = `ws://127.0.0.1:8000/ws/practice/${encodeURIComponent(selectedPose)}`;
    const ws = new WebSocket(wsUrl);

    ws.onopen = () => {
      console.log("[WebSocket] Connected to FastAPI Pose Engine for:", selectedPose);
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

      canvas.width = videoRef.current?.videoWidth || 1280;
      canvas.height = videoRef.current?.videoHeight || 720;

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

        ctx.lineWidth = 6;
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
          ctx.arc(lm.x * canvas.width, lm.y * canvas.height, 7, 0, 2 * Math.PI);
          ctx.fillStyle = "#38bdf8"; // Light cyan landmark nodes
          ctx.fill();
          ctx.lineWidth = 3;
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
      width: 1280,
      height: 720,
    });

    camera.start().then(() => setIsCameraReady(true)).catch((err) => console.error("Camera failed:", err));

    return () => {
      camera.stop();
      pose.close();
    };
  }, [isSessionActive, selectedPose]);

  // Video Recording Logic
  const startRecording = () => {
    if (!canvasRef.current) return;
    recordedChunksRef.current = [];
    const stream = canvasRef.current.captureStream(30); // 30 FPS canvas stream

    const mediaRecorder = new MediaRecorder(stream, { mimeType: "video/webm" });
    mediaRecorder.ondataavailable = (event) => {
      if (event.data.size > 0) {
        recordedChunksRef.current.push(event.data);
      }
    };

    mediaRecorder.onstop = () => {
      const blob = new Blob(recordedChunksRef.current, { type: "video/webm" });
      const url = URL.createObjectURL(blob);
      setRecordedVideoUrl(url);
    };

    mediaRecorder.start();
    mediaRecorderRef.current = mediaRecorder;
    setIsRecording(true);
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const toggleFullscreen = () => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().then(() => setIsFullscreen(true)).catch(console.error);
    } else {
      document.exitFullscreen().then(() => setIsFullscreen(false)).catch(console.error);
    }
  };

  return (
    <div ref={containerRef} className="relative rounded-3xl overflow-hidden glass-card p-3 border border-white/10 shadow-2xl space-y-4">
      {/* Video Canvas Container - Large High Resolution Viewport */}
      <div className="relative aspect-[16/9] w-full min-h-[450px] md:min-h-[600px] rounded-2xl overflow-hidden bg-slate-950 flex items-center justify-center border border-white/5">
        <video ref={videoRef} className="hidden" playsInline muted />
        <canvas ref={canvasRef} className="w-full h-full object-cover rounded-2xl" />

        {/* Live HUD Badges */}
        <div className="absolute top-5 left-5 flex items-center gap-3 z-10">
          <span className={`px-4 py-1.5 rounded-full text-xs font-bold flex items-center gap-2 backdrop-blur-md shadow-lg ${
            isSessionActive ? "bg-red-500/90 text-white animate-pulse" : "bg-slate-800/80 text-slate-300"
          }`}>
            <span className={`w-2.5 h-2.5 rounded-full ${isSessionActive ? "bg-white" : "bg-slate-400"}`} />
            {isSessionActive ? "LIVE SESSION ACTIVE" : "PAUSED"}
          </span>

          <span className={`px-4 py-1.5 rounded-full text-xs font-medium backdrop-blur-md border ${
            wsConnected ? "bg-emerald-500/20 border-emerald-500/30 text-emerald-300" : "bg-amber-500/20 border-amber-500/30 text-amber-300"
          }`}>
            {wsConnected ? `FastAPI WebSocket (${selectedPose})` : "Connecting Server..."}
          </span>
        </div>

        {/* Fullscreen Button */}
        <button
          onClick={toggleFullscreen}
          className="absolute top-5 right-5 p-2.5 rounded-2xl glass-panel text-white/80 hover:text-white transition-colors z-10"
          title={isFullscreen ? "Exit Fullscreen" : "Fullscreen Studio Mode"}
        >
          {isFullscreen ? <Minimize2 className="w-5 h-5" /> : <Maximize2 className="w-5 h-5" />}
        </button>

        {/* Camera Loading State */}
        {!isCameraReady && (
          <div className="absolute inset-0 bg-slate-950/90 flex flex-col items-center justify-center gap-3 text-slate-400">
            <RefreshCw className="w-10 h-10 animate-spin text-emerald-400" />
            <p className="text-base font-semibold">Initializing HD GPU Camera Pipeline...</p>
          </div>
        )}
      </div>

      {/* Control Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-4 px-2 py-1">
        <div className="flex items-center gap-3">
          <button
            onClick={onToggleSession}
            disabled={!isCameraReady}
            className={`px-8 py-3.5 rounded-2xl font-bold text-sm flex items-center gap-2.5 transition-all shadow-xl ${
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

          {/* Video Recording Controls */}
          {isRecording ? (
            <button
              onClick={stopRecording}
              className="px-6 py-3.5 rounded-2xl bg-amber-600 hover:bg-amber-500 text-white font-bold text-sm flex items-center gap-2 animate-pulse shadow-lg"
            >
              <Square className="w-4 h-4 fill-current" /> Stop Recording
            </button>
          ) : (
            <button
              onClick={startRecording}
              disabled={!isCameraReady}
              className="px-6 py-3.5 rounded-2xl glass-panel hover:bg-white/10 text-slate-200 font-semibold text-sm flex items-center gap-2 border border-white/10 transition-all"
            >
              <Video className="w-4 h-4 text-rose-400" /> Record Session Clip
            </button>
          )}

          {/* Download Recording Link */}
          {recordedVideoUrl && (
            <a
              href={recordedVideoUrl}
              download={`yoga-practice-${selectedPose.toLowerCase()}.webm`}
              className="px-6 py-3.5 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-sm flex items-center gap-2 transition-all shadow-lg"
            >
              <Download className="w-4 h-4" /> Download Practice Video
            </a>
          )}
        </div>

        <div className="text-right text-xs text-slate-400">
          <p className="font-semibold text-slate-200">Active Pose: {selectedPose}</p>
          <p>Resolution: 1280x720 | 60 FPS GPU</p>
        </div>
      </div>
    </div>
  );
}
