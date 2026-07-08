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

export const scoreCards = [
  { label: "Interview readiness", value: "86%", detail: "+12% in 30 days" },
  { label: "Communication", value: "8.4", detail: "clearer pacing" },
  { label: "Role alignment", value: "91%", detail: "PM and SaaS roles" },
  { label: "Practice streak", value: "6", detail: "sessions this month" },
];

export const recentInterviews = [
  {
    role: "Product Manager",
    type: "Behavioral + Case",
    date: "Jul 7, 2026",
    score: "8.6",
    status: "Ready to repeat",
  },
  {
    role: "Frontend Engineer",
    type: "Technical + Coding",
    date: "Jul 4, 2026",
    score: "7.9",
    status: "Needs deeper examples",
  },
  {
    role: "Customer Success Lead",
    type: "Situational",
    date: "Jun 29, 2026",
    score: "8.2",
    status: "Strong clarity",
  },
];

export const skillProgress = [
  { label: "Structured answers", value: 84, color: "bg-blue-600" },
  { label: "Technical depth", value: 72, color: "bg-indigo-600" },
  { label: "Confidence", value: 88, color: "bg-teal-600" },
  { label: "Follow-up questions", value: 66, color: "bg-emerald-600" },
];

export const recommendedRoles = [
  "Product Manager",
  "Technical Program Manager",
  "Customer Success Lead",
  "Frontend Engineer",
];

export const industries = ["SaaS", "Fintech", "Health tech", "AI tools"];

export const journey = [58, 64, 68, 73, 79, 84, 86];

export const reportHighlights = [
  "Your strongest answers include clear context and measurable outcomes.",
  "Pause before complex technical responses to reduce filler words.",
  "Add one follow-up question at the end of each mock session.",
];

export const resumeItems = [
  {
    name: "Product Manager Resume",
    updated: "Updated Jul 6, 2026",
    match: "92% match for SaaS PM roles",
  },
  {
    name: "Frontend Engineer Resume",
    updated: "Updated Jun 28, 2026",
    match: "84% match for React roles",
  },
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
