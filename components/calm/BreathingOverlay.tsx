"use client";
import { useState, useEffect } from "react";

export default function BreathingOverlay({ onClose }: { onClose: () => void }) {
  const [phase, setPhase] = useState("Inhale");

  useEffect(() => {
    const interval = setInterval(() => {
      setPhase((p) => (p === "Inhale" ? "Exhale" : "Inhale"));
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-lg flex items-center justify-center z-50">

      <div className="text-center space-y-8">
        <div className="w-40 h-40 rounded-full bg-cyan-400/30 animate-[pulse_4s_ease-in-out_infinite] mx-auto" />

        <h2 className="text-2xl text-cyan-200 font-semibold">{phase}</h2>

        <p className="text-gray-300 max-w-sm">
          Slow breathing helps your mind stay clear and focused.
        </p>

        <button
          onClick={onClose}
          className="mt-4 px-6 py-2 rounded-lg border border-white/20 text-gray-300 hover:bg-white/10"
        >
          Continue
        </button>
      </div>
    </div>
  );
}