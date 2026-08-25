"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Bell, ChevronLeft, ChevronRight, LogOut, Menu, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { logoutCandidate } from "@/lib/client/logout";
import { navItems } from "./data";

const SIDEBAR_COLLAPSE_KEY = "verisnova-practice-sidebar-collapsed";

function getInitials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return "PC";
  return parts
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}

function readStoredCollapsed() {
  if (typeof window === "undefined") return false;
  return window.localStorage.getItem(SIDEBAR_COLLAPSE_KEY) === "1";
}

function Nav({
  pathname,
  showLabels,
  onNavigate,
}: {
  pathname: string;
  showLabels: boolean;
  onNavigate: () => void;
}) {
  return (
    <nav className="grid gap-1">
      {navItems.map((item) => {
        const Icon = item.icon;
        const active = pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(item.href));

        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            title={showLabels ? undefined : item.label}
            className={`group flex h-11 items-center gap-3 rounded-lg px-3 text-sm font-medium transition ${
              showLabels ? "" : "justify-center px-0"
            } ${
              active
                ? "bg-blue-600/15 text-blue-300 ring-1 ring-inset ring-blue-500/30"
                : "text-slate-400 hover:bg-white/5 hover:text-slate-100"
            }`}
          >
            <span
              className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-md transition ${
                active ? "bg-blue-500/20 text-blue-300" : "text-slate-500 group-hover:text-slate-200"
              }`}
            >
              <Icon size={17} aria-hidden="true" />
            </span>
            {showLabels ? <span className="truncate">{item.label}</span> : null}
          </Link>
        );
      })}
    </nav>
  );
}

function SidebarFooter({
  showLabels,
  candidateName,
  initials,
  loggingOut,
  onLogout,
}: {
  showLabels: boolean;
  candidateName: string;
  initials: string;
  loggingOut: boolean;
  onLogout: () => void;
}) {
  return (
    <div className="mt-6 border-t border-white/10 pt-4">
      <div className={`flex items-center gap-3 rounded-xl bg-white/5 p-3 ${showLabels ? "" : "justify-center px-2"}`}>
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-blue-500/20 text-sm font-semibold text-blue-300">
          {initials}
        </div>
        {showLabels ? (
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-slate-100">{candidateName}</p>
            <p className="truncate text-xs text-slate-500">Practice candidate</p>
          </div>
        ) : null}
      </div>
      <button
        type="button"
        onClick={onLogout}
        disabled={loggingOut}
        title={showLabels ? undefined : "Log out"}
        className={`mt-3 flex h-11 w-full items-center gap-3 rounded-lg px-3 text-sm font-medium text-slate-400 transition hover:bg-red-500/10 hover:text-red-300 disabled:cursor-not-allowed disabled:opacity-60 ${
          showLabels ? "" : "justify-center px-0"
        }`}
      >
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-slate-500">
          <LogOut size={17} aria-hidden="true" />
        </span>
        {showLabels ? <span>{loggingOut ? "Logging out…" : "Log out"}</span> : null}
      </button>
    </div>
  );
}

export default function PracticeShell({
  children,
  candidateName = "Candidate",
}: {
  children: React.ReactNode;
  candidateName?: string;
}) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  // Lazy-initialized from localStorage: this runs once on mount for a
  // client-only preference, so the SSR/first-paint mismatch it can cause is
  // limited to this one boolean and corrects itself before the user notices.
  const [collapsed, setCollapsed] = useState(readStoredCollapsed);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const toggleCollapsed = () => {
    setCollapsed((value) => {
      const next = !value;
      window.localStorage.setItem(SIDEBAR_COLLAPSE_KEY, next ? "1" : "0");
      return next;
    });
  };

  const handleLogout = async () => {
    if (loggingOut) return;
    setLoggingOut(true);
    await logoutCandidate();
  };

  const initials = getInitials(candidateName);
  const closeMobileNav = () => setOpen(false);

  return (
    <div className="min-h-screen bg-[#f5f7fb] text-slate-950">
      <aside
        className={`fixed inset-y-0 left-0 z-40 hidden flex-col border-r border-slate-900 bg-slate-950 py-6 transition-[width] duration-200 lg:flex ${
          collapsed ? "w-20 px-3" : "w-72 px-5"
        }`}
      >
        <div className={`flex items-center ${collapsed ? "justify-center" : "justify-between"}`}>
          <Link
            href="/"
            className={`flex items-center gap-3 ${collapsed ? "justify-center" : ""}`}
            aria-label="VerisNova home"
          >
            <Image
              src="/verisnova_logo_light.png"
              alt="VerisNova"
              width={80}
              height={80}
              priority
              className={`shrink-0 rounded-lg object-contain ${collapsed ? "h-10 w-10" : "h-11 w-11"}`}
            />
            {!collapsed ? <span className="text-base font-semibold tracking-wide text-white">VerisNova</span> : null}
          </Link>
        </div>

        {!collapsed ? (
          <p className="mt-1 text-xs font-medium uppercase tracking-[0.16em] text-slate-500">Practice Candidate</p>
        ) : null}

        <div className="mt-8 flex-1">
          <Nav pathname={pathname} showLabels={!collapsed} onNavigate={closeMobileNav} />
        </div>
        <SidebarFooter
          showLabels={!collapsed}
          candidateName={candidateName}
          initials={initials}
          loggingOut={loggingOut}
          onLogout={handleLogout}
        />

        <button
          type="button"
          onClick={toggleCollapsed}
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          className="absolute -right-3 top-8 grid h-6 w-6 place-items-center rounded-full border border-slate-800 bg-slate-900 text-slate-400 shadow-sm transition hover:text-slate-100"
        >
          {collapsed ? <ChevronRight size={13} /> : <ChevronLeft size={13} />}
        </button>
      </aside>

      {open && (
        <div className="fixed inset-0 z-50 bg-slate-950/50 lg:hidden" role="dialog" aria-modal="true">
          <div className="flex h-full w-80 max-w-[88vw] flex-col border-r border-slate-900 bg-slate-950 p-5 shadow-xl">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Image
                  src="/verisnova_logo_light.png"
                  alt="VerisNova"
                  width={80}
                  height={80}
                  className="h-11 w-11 shrink-0 rounded-lg object-contain"
                />
                <span className="text-base font-semibold tracking-wide text-white">VerisNova</span>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="grid h-10 w-10 place-items-center rounded-md border border-white/10 text-slate-300"
                aria-label="Close navigation"
              >
                <X size={18} />
              </button>
            </div>
            <div className="mt-8 flex-1">
              <Nav pathname={pathname} showLabels onNavigate={closeMobileNav} />
            </div>
            <SidebarFooter
              showLabels
              candidateName={candidateName}
              initials={initials}
              loggingOut={loggingOut}
              onLogout={handleLogout}
            />
          </div>
        </div>
      )}

      <div className={collapsed ? "lg:pl-20" : "lg:pl-72"}>
        <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/90 backdrop-blur">
          <div className="flex h-16 items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
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
                <p className="text-xs text-slate-500">Your practice data is loaded from VerisNova records.</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                className="grid h-10 w-10 place-items-center rounded-md border border-slate-200 bg-white text-slate-600 transition hover:bg-slate-50"
                aria-label="Notifications"
              >
                <Bell size={18} />
              </button>

              <div className="relative" ref={menuRef}>
                <button
                  type="button"
                  onClick={() => setMenuOpen((value) => !value)}
                  className="flex h-10 items-center gap-2 rounded-md border border-slate-200 bg-white pl-2 pr-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                  aria-haspopup="menu"
                  aria-expanded={menuOpen}
                >
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-blue-600 text-xs font-semibold text-white">
                    {initials}
                  </span>
                  <span className="hidden sm:inline">Candidate</span>
                </button>

                {menuOpen && (
                  <div
                    role="menu"
                    className="absolute right-0 top-12 w-52 overflow-hidden rounded-lg border border-slate-200 bg-white py-1 shadow-lg"
                  >
                    <div className="border-b border-slate-100 px-3 py-2">
                      <p className="truncate text-sm font-semibold text-slate-950">{candidateName}</p>
                      <p className="text-xs text-slate-500">Practice candidate</p>
                    </div>
                    <Link
                      href="/settings"
                      onClick={() => setMenuOpen(false)}
                      role="menuitem"
                      className="block px-3 py-2 text-sm text-slate-700 hover:bg-slate-50"
                    >
                      Settings
                    </Link>
                    <button
                      type="button"
                      role="menuitem"
                      onClick={handleLogout}
                      disabled={loggingOut}
                      className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm font-medium text-red-600 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      <LogOut size={15} aria-hidden="true" />
                      {loggingOut ? "Logging out…" : "Log out"}
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </header>

        <main className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 lg:px-8">{children}</main>
      </div>
    </div>
  );
}
