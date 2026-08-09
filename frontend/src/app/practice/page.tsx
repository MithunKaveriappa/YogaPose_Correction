"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import PoseCamera from "@/components/PoseCamera";
import AICoachPanel from "@/components/AICoachPanel";
import { HelpCircle } from "lucide-react";

function PracticeContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const initialPose = searchParams.get("pose") || "Trikonasana";

  const [poses, setPoses] = useState<string[]>([]);
  const [selectedPose, setSelectedPose] = useState<string>(initialPose);
  const [poseImageUrl, setPoseImageUrl] = useState<string | null>(null);
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

  // Fetch target reference pose details & image URL whenever selectedPose changes
  useEffect(() => {
    fetch(`http://127.0.0.1:8000/api/poses/${encodeURIComponent(selectedPose)}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.image_url) {
          setPoseImageUrl(data.image_url);
        } else {
          setPoseImageUrl(null);
        }
      })
      .catch((err) => console.error("Error fetching pose details:", err));
  }, [selectedPose]);

  const handlePoseChange = (newPose: string) => {
    setSelectedPose(newPose);
    setEvaluationResult(null);
    router.replace(`/practice?pose=${encodeURIComponent(newPose)}`);
  };

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-extrabold text-white tracking-tight flex items-center gap-3">
            Practice Studio Studio HD <span className="text-xs px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">1280x720 60 FPS</span>
          </h2>
          <p className="text-slate-400 text-sm mt-1">
            Perform postures alongside the target reference guide with live AI joint corrections.
          </p>
        </div>

        {/* Dynamic Pose Selector */}
        <div className="flex items-center gap-3">
          <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Target Pose:</label>
          <select
            value={selectedPose}
            onChange={(e) => handlePoseChange(e.target.value)}
            className="bg-slate-900 text-white font-bold text-sm px-5 py-3 rounded-2xl border border-emerald-500/40 focus:outline-none focus:border-emerald-400 transition-all shadow-xl cursor-pointer"
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

      {/* Main Studio Grid - Large Viewport (7 cols) + AI Coach & Reference Pose (5 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Enlarged Video Studio (7 Cols) */}
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
                <li>Look at the <strong>Target Reference Pose Guide</strong> on the right to position your posture.</li>
                <li>Stand 6-8 feet away from your camera for full-body 3D skeleton tracking.</li>
                <li>Click <strong>Record Session Clip</strong> to capture and download WebM practice videos.</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Right Column: Reference Visual + AI Voice Coach (5 Cols) */}
        <div className="lg:col-span-5">
          <AICoachPanel
            evaluationResult={evaluationResult}
            selectedPose={selectedPose}
            poseImageUrl={poseImageUrl}
          />
        </div>
      </div>
    </div>
  );
}

export default function PracticePage() {
  return (
    <Suspense fallback={<div className="text-center py-12 text-slate-400">Loading Studio...</div>}>
      <PracticeContent />
    </Suspense>
  );
}
