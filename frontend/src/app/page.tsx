"use client";

import Link from "next/link";
import { Camera, Sparkles, Activity, ShieldCheck, Zap, ArrowRight, BarChart3, Award } from "lucide-react";

export default function DashboardPage() {
  const stats = [
    { label: "Available Poses", value: "30+", change: "Benchmark DB", icon: Activity, color: "from-emerald-500 to-teal-500" },
    { label: "Landmark Points", value: "33", change: "Full 3D Skeleton", icon: Sparkles, color: "from-indigo-500 to-purple-500" },
    { label: "Processing Speed", value: "60 FPS", change: "Client GPU Accelerated", icon: Zap, color: "from-amber-500 to-orange-500" },
    { label: "AI Feedback Engine", value: "Gemini 2.0", change: "Natural Language", icon: ShieldCheck, color: "from-sky-500 to-blue-500" },
  ];

  return (
    <div className="space-y-10">
      {/* Hero Section */}
      <section className="glass-card rounded-3xl p-8 md:p-12 relative overflow-hidden border border-white/10">
        <div className="absolute -right-16 -top-16 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -left-16 -bottom-16 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-3xl space-y-6 relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs font-semibold">
            <Sparkles className="w-3.5 h-3.5" /> Next-Gen AI Vision Posture Corrector
          </div>

          <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight text-white leading-tight">
            Perfect Your Yoga Posture with <span className="bg-clip-text text-transparent bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-400">Real-Time AI Guidance</span>
          </h1>

          <p className="text-slate-300 text-base md:text-lg leading-relaxed">
            Experience 60 FPS GPU-accelerated skeletal tracking combined with Gemini AI voice coaching. Get instant feedback on joint angles, posture alignment, and posture accuracy.
          </p>

          <div className="flex flex-wrap items-center gap-4 pt-2">
            <Link
              href="/practice"
              className="px-8 py-4 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-base flex items-center gap-3 transition-all shadow-xl shadow-emerald-600/30 group"
            >
              <Camera className="w-5 h-5" /> Start Practice Session
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Link>

            <Link
              href="/poses"
              className="px-8 py-4 rounded-2xl glass-panel hover:bg-white/10 text-slate-200 font-semibold text-base flex items-center gap-2 transition-all border border-white/10"
            >
              Explore Pose Catalog
            </Link>
          </div>
        </div>
      </section>

      {/* Stats Grid */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, idx) => {
          const Icon = stat.icon;
          return (
            <div key={idx} className="glass-card rounded-3xl p-6 border border-white/10 relative overflow-hidden group hover:border-emerald-500/40 transition-all">
              <div className="flex items-center justify-between mb-4">
                <div className={`w-12 h-12 rounded-2xl bg-gradient-to-tr ${stat.color} flex items-center justify-center text-white shadow-lg`}>
                  <Icon className="w-6 h-6" />
                </div>
                <span className="text-xs text-slate-400 font-medium">{stat.change}</span>
              </div>
              <h3 className="text-3xl font-black text-white tracking-tight">{stat.value}</h3>
              <p className="text-xs text-slate-400 mt-1 font-medium">{stat.label}</p>
            </div>
          );
        })}
      </section>

      {/* Quick Navigation Cards */}
      <section className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="glass-card rounded-3xl p-8 border border-white/10 flex flex-col justify-between">
          <div>
            <div className="w-12 h-12 rounded-2xl bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400 mb-6">
              <BarChart3 className="w-6 h-6" />
            </div>
            <h3 className="text-2xl font-bold text-white mb-2">Posture Analytics & Heatmaps</h3>
            <p className="text-slate-400 text-sm leading-relaxed mb-6">
              Inspect joint angle error breakdowns, historical score trends, and angle deviation heatmaps for 30 yoga poses.
            </p>
          </div>
          <Link
            href="/analytics"
            className="inline-flex items-center gap-2 text-sm font-semibold text-emerald-400 hover:text-emerald-300 transition-colors"
          >
            View Heatmaps & Analytics <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="glass-card rounded-3xl p-8 border border-white/10 flex flex-col justify-between">
          <div>
            <div className="w-12 h-12 rounded-2xl bg-purple-500/20 border border-purple-500/30 flex items-center justify-center text-purple-400 mb-6">
              <Award className="w-6 h-6" />
            </div>
            <h3 className="text-2xl font-bold text-white mb-2">Benchmark Pose Library</h3>
            <p className="text-slate-400 text-sm leading-relaxed mb-6">
              Browse target angle specifications for Trikonasana, Adho Mukha Svanasana, Virabhadrasana, and 27 other postures.
            </p>
          </div>
          <Link
            href="/poses"
            className="inline-flex items-center gap-2 text-sm font-semibold text-purple-400 hover:text-purple-300 transition-colors"
          >
            Browse All 30 Poses <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </section>
    </div>
  );
}
