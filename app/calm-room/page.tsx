"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import BreathingOrb from "@/components/dashboard/BreathingOrb";
import BreathingOverlay from "@/components/calm/BreathingOverlay";
import { useState } from "react";

const SoundSelector = dynamic(() => import("@/components/calm/SoundSelector"), { ssr: false });

export default function CalmRoomPage() {
  const [showBreathing, setShowBreathing] = useState(false);

  return (
    <main className="min-h-screen bg-slate-950 text-white">
      {showBreathing && <BreathingOverlay onClose={() => setShowBreathing(false)} />}
      <section className="mx-auto flex min-h-screen w-full max-w-5xl flex-col px-5 py-6">
        <Link href="/interview/setup" className="inline-flex w-fit items-center gap-2 text-sm font-semibold text-cyan-200">
          <ArrowLeft size={17} aria-hidden="true" />
          Back to practice setup
        </Link>

        <div className="grid flex-1 place-items-center py-10">
          <div className="w-full rounded-2xl border border-white/10 bg-white/5 p-8 text-center shadow-2xl shadow-cyan-950/30">
            <h1 className="text-3xl font-semibold tracking-tight text-cyan-100">Candidate Calm Room</h1>
            <p className="mx-auto mt-3 max-w-xl text-slate-300">
              Use the existing calm experience before launching your practice interview.
            </p>
            <div className="mt-8 flex justify-center">
              <SoundSelector />
            </div>
            <BreathingOrb />
            <button
              type="button"
              onClick={() => setShowBreathing(true)}
              className="mt-8 rounded-xl bg-cyan-400 px-6 py-3 font-semibold text-slate-950 transition hover:bg-cyan-300"
            >
              Start breathing overlay
            </button>
          </div>
        </div>
      </section>
    </main>
  );
}
