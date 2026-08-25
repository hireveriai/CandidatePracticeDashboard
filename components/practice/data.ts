import {
  BarChart3,
  BookOpenCheck,
  BriefcaseBusiness,
  FileText,
  Gauge,
  History,
  LayoutDashboard,
  Settings,
  Sparkles,
  Target,
} from "lucide-react";

export const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/interview/setup", label: "Start Mock Interview", icon: Sparkles },
  { href: "/history", label: "Interview History", icon: History },
  { href: "/reports", label: "Reports", icon: BarChart3 },
  { href: "/skills", label: "Skill Progress", icon: Target },
  { href: "/resume-library", label: "Resume Library", icon: FileText },
  { href: "/career-insights", label: "Career Insights", icon: BriefcaseBusiness },
  { href: "/settings", label: "Settings", icon: Settings },
];

export const setupOptions = {
  experience: ["Entry level", "Mid level", "Senior", "Leadership"],
  difficulty: ["Warm-up", "Standard", "Challenging"],
  types: ["Behavioral", "Technical", "Case study", "Mixed"],
  languages: ["English", "Hindi", "Spanish", "French"],
  durations: ["15 minutes", "30 minutes", "45 minutes", "60 minutes"],
};

export const precheckItems = [
  { label: "Camera", detail: "Face framing and lighting check", icon: Gauge },
  { label: "Microphone", detail: "Voice clarity and noise level", icon: BookOpenCheck },
  { label: "Network", detail: "Stable interview connection", icon: BarChart3 },
  { label: "Environment", detail: "Quiet room and distraction scan", icon: Sparkles },
];
