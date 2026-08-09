"use client";

import { useEffect, useState } from "react";
import { BarChart2, Activity, PieChart, Info, CheckCircle2 } from "lucide-react";

export default function AnalyticsPage() {
  const [selectedPose, setSelectedPose] = useState("Halasana");
  const bodyParts = [
    "Left Elbow", "Right Elbow", "Right Knee", "Left Knee",
    "Right Shoulder", "Left Shoulder", "Left Hip", "Right Hip"
  ];

  // Sample angle differences for heatmap visualizer
  const benchmarkAngles = [30, 45, 60, 90, 120, 135, 150, 180];
  const userSampleAngles = [35, 42, 65, 88, 125, 130, 145, 175];
  const angleDiffs = benchmarkAngles.map((target, idx) => Math.abs(target - userSampleAngles[idx]));

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h2 className="text-3xl font-extrabold text-white tracking-tight flex items-center gap-3">
          Posture Analytics & Heatmaps <BarChart2 className="w-6 h-6 text-emerald-400" />
        </h2>
        <p className="text-slate-400 text-sm mt-1">
          Detailed joint-by-joint angle error distribution and heatmap visualizations.
        </p>
      </div>

      {/* Heatmap Visualizer Section */}
      <div className="glass-card rounded-3xl p-8 border border-white/10 space-y-6">
        <div className="flex items-center justify-between">
          <h3 className="text-xl font-bold text-white flex items-center gap-2">
            <Activity className="w-5 h-5 text-teal-400" /> Posture Error Distribution Heatmap
          </h3>
          <span className="text-xs text-slate-400 bg-slate-900 px-3 py-1 rounded-full border border-white/10">
            Target Pose: {selectedPose}
          </span>
        </div>

        <p className="text-xs text-slate-400">
          Color scale indicates joint deviation (Degrees error). Green represents accurate alignment, Yellow indicates minor deviation, and Red highlights major errors.
        </p>

        {/* Heatmap Grid Bars */}
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-4 pt-4">
          {bodyParts.map((part, idx) => {
            const diff = angleDiffs[idx];
            const colorBg =
              diff <= 5 ? "bg-emerald-500/20 border-emerald-500/40 text-emerald-300" :
              diff <= 10 ? "bg-amber-500/20 border-amber-500/40 text-amber-300" :
              "bg-rose-500/20 border-rose-500/40 text-rose-300";

            return (
              <div key={part} className={`p-4 rounded-2xl border ${colorBg} flex flex-col items-center justify-between gap-3 text-center transition-all hover:scale-105`}>
                <span className="text-[11px] font-semibold tracking-tight">{part}</span>
                <div className="text-2xl font-black">{diff}°</div>
                <span className="text-[10px] uppercase font-bold tracking-wider opacity-80">
                  {diff <= 5 ? "Optimal" : diff <= 10 ? "Minor Error" : "Adjust"}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Analytics Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="glass-card rounded-3xl p-6 border border-white/10">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-bold text-white text-base">Average Posture Accuracy</h4>
              <p className="text-xs text-slate-400">Overall Session Score</p>
            </div>
          </div>
          <div className="text-4xl font-extrabold text-emerald-400">92.4%</div>
          <p className="text-xs text-slate-400 mt-2">+4.2% improvement from last session</p>
        </div>

        <div className="glass-card rounded-3xl p-6 border border-white/10">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center">
              <PieChart className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-bold text-white text-base">Most Accurate Joint</h4>
              <p className="text-xs text-slate-400">Highest Alignment Precision</p>
            </div>
          </div>
          <div className="text-2xl font-extrabold text-white">Left & Right Knee</div>
          <p className="text-xs text-emerald-400 mt-2">Average error under 2.5°</p>
        </div>

        <div className="glass-card rounded-3xl p-6 border border-white/10">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-purple-500/20 text-purple-400 flex items-center justify-center">
              <Info className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-bold text-white text-base">Focus Area for Next Practice</h4>
              <p className="text-xs text-slate-400">Primary Joint to Adjust</p>
            </div>
          </div>
          <div className="text-2xl font-extrabold text-amber-300">Right Shoulder</div>
          <p className="text-xs text-slate-400 mt-2">Extend elbow joint 8° further</p>
        </div>
      </div>
    </div>
  );
}
