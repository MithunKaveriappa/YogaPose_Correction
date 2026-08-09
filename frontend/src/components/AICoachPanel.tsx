"use client";

import { useEffect, useState } from "react";
import { Sparkles, Volume2, VolumeX, CheckCircle, AlertTriangle, Info, Image as ImageIcon } from "lucide-react";

interface AICoachPanelProps {
  evaluationResult: any;
  selectedPose: string;
  poseImageUrl?: string | null;
}

export default function AICoachPanel({ evaluationResult, selectedPose, poseImageUrl }: AICoachPanelProps) {
  const [speechEnabled, setSpeechEnabled] = useState(true);
  const [lastSpokenText, setLastSpokenText] = useState("");

  const score = evaluationResult?.accuracy_score ?? 0;
  const poseName = evaluationResult?.pose_name ?? selectedPose;
  const coachingText = evaluationResult?.ai_coaching_text || "Align yourself in front of the camera and click Start Real-Time Tracking.";
  const jointDetails = evaluationResult?.joint_details || [];

  // Web Speech API Voice Feedback
  useEffect(() => {
    if (!speechEnabled || !coachingText || coachingText === lastSpokenText) return;
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;

    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(coachingText);
    utterance.rate = 1.0;
    utterance.pitch = 1.0;
    window.speechSynthesis.speak(utterance);
    setLastSpokenText(coachingText);
  }, [coachingText, speechEnabled]);

  const scoreColor =
    score >= 85 ? "from-emerald-500 to-teal-400" : score >= 60 ? "from-amber-500 to-yellow-400" : "from-rose-500 to-red-400";

  return (
    <div className="flex flex-col gap-6">
      {/* Target Reference Pose Visual Card */}
      <div className="glass-card rounded-3xl p-6 border border-purple-500/20 bg-gradient-to-br from-slate-900/90 to-purple-950/20">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <ImageIcon className="w-5 h-5 text-purple-400" />
            <h3 className="font-semibold text-base text-slate-200">Target Reference Pose Guide</h3>
          </div>
          <span className="text-xs px-3 py-1 rounded-full bg-purple-500/20 text-purple-300 font-bold border border-purple-500/30">
            {selectedPose}
          </span>
        </div>

        <div className="relative aspect-video w-full rounded-2xl overflow-hidden bg-slate-950/80 border border-white/10 flex items-center justify-center p-2">
          {poseImageUrl ? (
            <img
              src={poseImageUrl}
              alt={`Target benchmark for ${selectedPose}`}
              className="max-h-full max-w-full object-contain rounded-xl shadow-lg"
            />
          ) : (
            <div className="text-center p-6 text-slate-500 text-xs">
              <ImageIcon className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p>Reference pose visual loaded for {selectedPose}</p>
            </div>
          )}
        </div>
      </div>

      {/* Live Accuracy Score Card */}
      <div className="glass-card rounded-3xl p-6 border border-white/10 relative overflow-hidden">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-emerald-400" />
            <h3 className="font-semibold text-base text-slate-200">Live Posture Score</h3>
          </div>
          <button
            onClick={() => setSpeechEnabled(!speechEnabled)}
            className="p-2 rounded-xl glass-panel text-slate-400 hover:text-white transition-colors"
            title={speechEnabled ? "Mute Voice Coach" : "Enable Voice Coach"}
          >
            {speechEnabled ? <Volume2 className="w-4 h-4 text-emerald-400" /> : <VolumeX className="w-4 h-4 text-slate-500" />}
          </button>
        </div>

        <div className="flex items-center gap-6">
          <div className="relative w-24 h-24 flex items-center justify-center shrink-0">
            <div className={`absolute inset-0 rounded-full bg-gradient-to-tr ${scoreColor} opacity-20 blur-md`} />
            <div className="w-20 h-20 rounded-full border-4 border-slate-800 flex flex-col items-center justify-center bg-slate-950/80">
              <span className="text-2xl font-bold text-white tracking-tight">{Math.round(score)}%</span>
              <span className="text-[10px] text-slate-400 uppercase font-semibold">Match</span>
            </div>
          </div>

          <div>
            <h4 className="text-lg font-bold text-white">{poseName}</h4>
            <p className="text-xs text-slate-400 mt-1">
              {evaluationResult?.is_pose_matched
                ? "Perfect alignment! Posture benchmarks satisfied."
                : "Adjust joint angles to match reference posture."}
            </p>
          </div>
        </div>
      </div>

      {/* Real-Time AI Coach Audio / Text Card */}
      <div className="glass-card rounded-3xl p-6 border border-emerald-500/20 bg-gradient-to-br from-slate-900/90 to-emerald-950/30">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-8 h-8 rounded-lg bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center">
            <Sparkles className="w-4 h-4 text-emerald-300" />
          </div>
          <h4 className="font-semibold text-sm text-emerald-300">Gemini AI Voice Coach</h4>
        </div>
        <p className="text-sm text-slate-200 leading-relaxed font-medium bg-slate-950/40 p-3.5 rounded-2xl border border-white/5">
          "{coachingText}"
        </p>
      </div>

      {/* Joint Angle Diagnostics List */}
      <div className="glass-card rounded-3xl p-6 border border-white/10">
        <h4 className="font-semibold text-sm text-slate-300 mb-4 flex items-center gap-2">
          <Info className="w-4 h-4 text-indigo-400" /> 8-Joint Angle Breakdown
        </h4>

        <div className="space-y-3 max-h-[260px] overflow-y-auto pr-1">
          {jointDetails.length > 0 ? (
            jointDetails.map((joint: any, idx: number) => (
              <div
                key={idx}
                className="flex items-center justify-between p-3 rounded-2xl glass-panel border border-white/5 text-xs"
              >
                <div className="flex items-center gap-2.5">
                  {joint.is_correct ? (
                    <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
                  ) : (
                    <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
                  )}
                  <div>
                    <p className="font-semibold text-slate-200">{joint.part}</p>
                    <p className="text-[11px] text-slate-400">{joint.correction_hint}</p>
                  </div>
                </div>

                <div className="text-right font-mono">
                  <span className={`font-bold ${joint.is_correct ? "text-emerald-400" : "text-rose-400"}`}>
                    {joint.current_angle}°
                  </span>
                  <span className="text-slate-500 text-[10px] block">Target: {joint.target_angle}°</span>
                </div>
              </div>
            ))
          ) : (
            <p className="text-xs text-slate-500 text-center py-4">Start pose session to load live joint metrics.</p>
          )}
        </div>
      </div>
    </div>
  );
}
