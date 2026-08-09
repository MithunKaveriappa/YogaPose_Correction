"use client";

import { useEffect, useState } from "react";
import PoseCamera from "@/components/PoseCamera";
import AICoachPanel from "@/components/AICoachPanel";
import { Sparkles, HelpCircle } from "lucide-react";

export default function PracticePage() {
  const [poses, setPoses] = useState<string[]>([]);
  const [selectedPose, setSelectedPose] = useState<string>("Trikonasana");
  const [isSessionActive, setIsSessionActive] = useState<boolean>(false);
  const [evaluationResult, setEvaluationResult] = useState<any>(null);

  // Fetch available poses list from FastAPI backend
  useEffect(() => {
    fetch("http://127.0.0.1:8000/api/poses")
      .then((res) => res.json())
      .then((data) => {
        if (data.poses && data.poses.length > 0) {
          setPoses(data.poses);
        }
      })
      .catch((err) => console.error("Could not fetch poses list:", err));
  }, []);

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-extrabold text-white tracking-tight flex items-center gap-3">
            Practice Studio <span className="text-xs px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">Live 60 FPS</span>
          </h2>
          <p className="text-slate-400 text-sm mt-1">Select a pose, allow camera access, and receive real-time AI posture feedback.</p>
        </div>

        {/* Pose Selection Dropdown */}
        <div className="flex items-center gap-3">
          <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Select Pose:</label>
          <select
            value={selectedPose}
            onChange={(e) => setSelectedPose(e.target.value)}
            disabled={isSessionActive}
            className="bg-slate-900 text-white font-semibold text-sm px-4 py-2.5 rounded-2xl border border-white/10 focus:outline-none focus:border-emerald-500 transition-colors shadow-lg cursor-pointer"
          >
            {poses.length > 0 ? (
              poses.map((pose) => (
                <option key={pose} value={pose}>
                  {pose}
                </option>
              ))
            ) : (
              <option value="Trikonasana">Trikonasana</option>
            )}
          </select>
        </div>
      </div>

      {/* Main Studio Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Live Camera GPU Workspace (7 Cols) */}
        <div className="lg:col-span-7 space-y-6">
          <PoseCamera
            selectedPose={selectedPose}
            onEvaluationResult={(res) => setEvaluationResult(res)}
            isSessionActive={isSessionActive}
            onToggleSession={() => setIsSessionActive(!isSessionActive)}
          />

          {/* Quick Guide Card */}
          <div className="glass-card rounded-3xl p-6 border border-white/10 flex items-start gap-4">
            <HelpCircle className="w-6 h-6 text-indigo-400 shrink-0 mt-0.5" />
            <div className="text-xs text-slate-300 space-y-1">
              <p className="font-semibold text-slate-200">How to get the most accurate feedback:</p>
              <ul className="list-disc list-inside text-slate-400 space-y-1">
                <li>Stand 6-8 feet away from your webcam so your full body is visible.</li>
                <li>Ensure good room lighting with minimal background clutter.</li>
                <li>Follow the live voice cues from Gemini AI Coach to adjust your joint angles.</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Right Column: Real-Time AI Coach & Diagnostics (5 Cols) */}
        <div className="lg:col-span-5">
          <AICoachPanel evaluationResult={evaluationResult} />
        </div>
      </div>
    </div>
  );
}
