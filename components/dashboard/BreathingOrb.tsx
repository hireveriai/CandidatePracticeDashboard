"use client";
import { useState } from "react";
import BreathingOverlay from "../calm/BreathingOverlay";

export default function BreathingOrb() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <div
        onClick={() => setOpen(true)}
        className="flex justify-center my-6 cursor-pointer"
      >
        <div className="w-24 h-24 rounded-full bg-cyan-400/30 blur-xl animate-[pulse_4s_ease-in-out_infinite]" />
      </div>

      {open && <BreathingOverlay onClose={() => setOpen(false)} />}
    </>
  );
}