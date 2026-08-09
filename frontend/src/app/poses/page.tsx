"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { BookOpen, Camera, Search, Sparkles, CheckCircle } from "lucide-react";

export default function PosesPage() {
  const [poses, setPoses] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    fetch("http://127.0.0.1:8000/api/poses")
      .then((res) => res.json())
      .then((data) => {
        if (data.poses) setPoses(data.poses);
      })
      .catch((err) => console.error("Could not fetch poses:", err));
  }, []);

  const filteredPoses = poses.filter((pose) =>
    pose.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-extrabold text-white tracking-tight flex items-center gap-3">
            Yoga Pose Benchmark Library <BookOpen className="w-6 h-6 text-purple-400" />
          </h2>
          <p className="text-slate-400 text-sm mt-1">
            Browse benchmark target angle parameters for 30 Sanskrit & Traditional Yoga Poses.
          </p>
        </div>

        {/* Search Bar */}
        <div className="relative w-full md:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
          <input
            type="text"
            placeholder="Search poses..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-900/80 text-sm text-white placeholder-slate-500 pl-10 pr-4 py-2.5 rounded-2xl border border-white/10 focus:outline-none focus:border-purple-500 transition-colors"
          />
        </div>
      </div>

      {/* Poses Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredPoses.length > 0 ? (
          filteredPoses.map((pose) => (
            <div
              key={pose}
              className="glass-card rounded-3xl p-6 border border-white/10 hover:border-purple-500/40 transition-all flex flex-col justify-between group"
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-[10px] uppercase font-bold tracking-wider px-2.5 py-1 rounded-full bg-purple-500/10 text-purple-300 border border-purple-500/20">
                    Sanskrit Benchmark
                  </span>
                  <Sparkles className="w-4 h-4 text-slate-500 group-hover:text-purple-400 transition-colors" />
                </div>
                <h3 className="text-xl font-bold text-white mb-2">{pose}</h3>
                <p className="text-xs text-slate-400">
                  Target alignment vectors pre-calculated across 8 primary joint angle landmarks.
                </p>
              </div>

              <div className="mt-6 pt-4 border-t border-white/5 flex items-center justify-between">
                <span className="text-xs text-emerald-400 flex items-center gap-1 font-medium">
                  <CheckCircle className="w-3.5 h-3.5" /> 8 Joint Vectors
                </span>

                <Link
                  href={`/practice?pose=${encodeURIComponent(pose)}`}
                  className="px-4 py-2 rounded-xl bg-purple-600/20 hover:bg-purple-600 text-purple-200 hover:text-white text-xs font-semibold flex items-center gap-1.5 transition-all border border-purple-500/30"
                >
                  <Camera className="w-3.5 h-3.5" /> Practice
                </Link>
              </div>
            </div>
          ))
        ) : (
          <div className="col-span-full text-center py-12 text-slate-500 text-sm">
            Loading pose benchmarks...
          </div>
        )}
      </div>
    </div>
  );
}
