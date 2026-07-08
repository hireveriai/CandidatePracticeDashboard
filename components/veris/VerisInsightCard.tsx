"use client";
import { useState } from "react";

const insights = [
  "Clear pauses before answering improve clarity.",
  "Using examples strengthens credibility.",
  "Speaking slightly slower improves confidence perception.",
  "Structured answers improve understanding.",
  "Taking a breath before responding reduces filler words.",
  "Maintaining steady pace signals confidence.",
];

export default function VerisInsightCard() {
  const [insight] = useState(
    () => insights[Math.floor(Math.random() * insights.length)]
  );

  return (
    <div className="bg-gradient-to-r from-cyan-500/10 to-blue-500/10 border border-cyan-400/20 rounded-2xl p-6 space-y-2 transition hover:-translate-y-1">

      <div className="text-xs tracking-widest text-cyan-300 font-semibold">
        VERIS INSIGHT
      </div>

      <p className="text-gray-200 leading-relaxed">
        {insight}
      </p>

      <p className="text-xs text-gray-400">
        VERIS analyzes communication patterns to help you improve clarity and confidence.
      </p>
    </div>
  );
}
