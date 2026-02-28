"use client";

import { Bell, ChevronDown } from "lucide-react";

export default function Topbar() {
  return (
    <header className="sticky top-0 z-30 backdrop-blur-xl bg-slate-950/70 border-b border-slate-800">
      <div className="flex items-center justify-between px-6 md:px-8 h-16">
        
        <div>
          <h2 className="text-lg font-semibold tracking-tight text-white">
            Welcome back
          </h2>
          <p className="text-xs text-slate-400">
            You're in a calm, focused space
          </p>
        </div>

        <div className="flex items-center gap-4">
          <button className="text-slate-400 hover:text-white transition">
            <Bell size={18} />
          </button>

          <button className="flex items-center gap-2 bg-slate-900 border border-slate-800 px-3 py-1.5 rounded-xl hover:bg-slate-800 transition">
            <div className="w-7 h-7 rounded-full bg-gradient-to-br from-cyan-400 to-blue-500 flex items-center justify-center text-xs font-semibold text-black">
              JS
            </div>
            <ChevronDown size={16} className="text-slate-400" />
          </button>
        </div>
      </div>
    </header>
  );
}