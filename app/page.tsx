import Sidebar from "@/components/dashboard/Sidebar";
import Header from "@/components/dashboard/Header";
import WelcomeCard from "@/components/dashboard/WelcomeCard";
import PracticeCard from "@/components/dashboard/PracticeCard";
import PerformanceSnapshot from "@/components/dashboard/PerformanceSnapshot";
import VerisInsightCard from "@/components/veris/VerisInsightCard";
import PerformanceTrend from "@/components/dashboard/PerformanceTrend";
import MilestoneBadges from "@/components/dashboard/MilestoneBadges";

export default function Dashboard() {
  return (
    <div className="min-h-screen text-white relative overflow-hidden">

      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900" />

      {/* soft glow accents */}
      <div className="absolute top-[-200px] left-[-200px] w-[500px] h-[500px] bg-cyan-500/10 blur-[160px] rounded-full" />
      <div className="absolute bottom-[-200px] right-[-200px] w-[500px] h-[500px] bg-blue-500/10 blur-[160px] rounded-full" />

      <div className="relative flex">
        <Sidebar />

        <main className="flex-1 p-6 md:p-10 space-y-6">
          <Header />
          <WelcomeCard />
          <PracticeCard />
          <PerformanceSnapshot />
          <PerformanceTrend scores={[7.1, 7.4, 7.8, 8.2]} />
          <MilestoneBadges />
          <VerisInsightCard />
        </main>
      </div>
    </div>
  );
}