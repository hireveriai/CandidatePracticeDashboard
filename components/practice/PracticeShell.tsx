"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Bell, Menu, UserRound, X } from "lucide-react";
import { useState } from "react";
import { navItems } from "./data";

export default function PracticeShell({
  children,
  candidateName = "Candidate",
}: {
  children: React.ReactNode;
  candidateName?: string;
}) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  const nav = (
    <nav className="grid gap-1">
      {navItems.map((item) => {
        const Icon = item.icon;
        const active =
          pathname === item.href ||
          (item.href !== "/dashboard" && pathname.startsWith(item.href));

        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={() => setOpen(false)}
            className={`flex min-h-11 items-center gap-3 rounded-md px-3 text-sm font-medium transition ${
              active
                ? "bg-blue-50 text-blue-700"
                : "text-slate-600 hover:bg-slate-100 hover:text-slate-950"
            }`}
          >
            <Icon size={18} aria-hidden="true" />
            <span>{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );

  return (
    <div className="min-h-screen bg-[#f7faff] text-slate-950">
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-72 border-r border-slate-200 bg-white px-5 py-5 lg:block">
        <Link href="/" className="flex items-center gap-3" aria-label="HireVeri home">
          <Image src="/hireveri_logo.png" alt="HireVeri" width={130} height={36} className="h-8 w-auto" />
        </Link>
        <p className="mt-2 text-sm text-slate-500">Practice Candidate</p>
        <div className="mt-8">{nav}</div>
      </aside>

      {open && (
        <div className="fixed inset-0 z-50 bg-slate-950/30 lg:hidden" role="dialog" aria-modal="true">
          <div className="h-full w-80 max-w-[88vw] border-r border-slate-200 bg-white p-5 shadow-xl">
            <div className="flex items-center justify-between">
              <Image src="/hireveri_logo.png" alt="HireVeri" width={124} height={34} className="h-8 w-auto" />
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="grid h-10 w-10 place-items-center rounded-md border border-slate-200 text-slate-600"
                aria-label="Close navigation"
              >
                <X size={18} />
              </button>
            </div>
            <div className="mt-8">{nav}</div>
          </div>
        </div>
      )}

      <div className="lg:pl-72">
        <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/90 backdrop-blur">
          <div className="flex min-h-16 items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setOpen(true)}
                className="grid h-10 w-10 place-items-center rounded-md border border-slate-200 text-slate-700 lg:hidden"
                aria-label="Open navigation"
              >
                <Menu size={19} />
              </button>
              <div>
                <p className="text-sm font-semibold text-slate-950">Welcome back, {candidateName}</p>
                <p className="text-xs text-slate-500">Your practice data is loaded from HireVeri records.</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                className="grid h-10 w-10 place-items-center rounded-md border border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                aria-label="Notifications"
              >
                <Bell size={18} />
              </button>
              <button
                type="button"
                className="flex h-10 items-center gap-2 rounded-md border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700 hover:bg-slate-50"
              >
                <UserRound size={17} aria-hidden="true" />
                <span className="hidden sm:inline">Candidate</span>
              </button>
            </div>
          </div>
        </header>

        <main className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
          {children}
        </main>
      </div>
    </div>
  );
}
