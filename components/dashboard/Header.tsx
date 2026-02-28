"use client";

import dynamic from "next/dynamic";

const SoundSelector = dynamic(
  () => import("@/components/calm/SoundSelector"),
  { ssr: false }
);

export default function Header() {
  return (
    <div className="flex justify-between items-center">
      <h1 className="text-2xl font-semibold tracking-wide text-cyan-200">
        Candidate Calm Room
      </h1>

      <SoundSelector />
    </div>
  );
}