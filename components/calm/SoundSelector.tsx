"use client";
import useCalmSound from "./useCalmSound";

export default function SoundSelector() {
  const { playSound, stopSound, current } = useCalmSound();

  const sounds = ["ocean", "rain", "forest"];

  return (
    <div className="flex gap-2">
      {sounds.map((s) => (
        <button
          key={s}
          onClick={() => playSound(s)}
          className={`px-3 py-1 rounded-lg border text-sm transition ${
            current === s
              ? "bg-cyan-400 text-slate-900"
              : "border-white/20 text-gray-300 hover:bg-white/10"
          }`}
        >
          {s}
        </button>
      ))}

      <button
        onClick={stopSound}
        className="px-3 py-1 rounded-lg border border-white/20 text-gray-300 hover:bg-white/10 text-sm"
      >
        off
      </button>
    </div>
  );
}