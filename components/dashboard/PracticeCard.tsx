"use client";
import { useRouter } from "next/navigation";

export default function PracticeCard() {
  const router = useRouter();

  const startInterview = () => {
    router.push("/interview/setup?mode=practice");
  };

  return (
    <div className="bg-gradient-to-r from-cyan-500/20 to-blue-500/20 border border-cyan-400/20 rounded-2xl p-8 text-center transition hover:-translate-y-1">

      <h2 className="text-xl font-semibold text-cyan-200 mb-2">
        Ready to practice?
      </h2>

      <p className="text-gray-300 mb-6">
        Begin when you feel comfortable.
      </p>

      <button
        onClick={startInterview}
        className="w-full md:w-auto px-8 py-3 rounded-xl bg-cyan-400 text-slate-900 font-semibold hover:bg-cyan-300 transition"
      >
        Start Mock Interview
      </button>

    </div>
  );
}