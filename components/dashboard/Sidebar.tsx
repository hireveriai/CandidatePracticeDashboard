export default function Sidebar() {
  const active = "text-cyan-300 font-medium";
  const normal = "text-gray-400 hover:text-white transition";

  return (
    <aside className="w-64 flex flex-col bg-slate-800/60 backdrop-blur-xl border-r border-white/10 p-6">
      <h2 className="text-xl font-semibold mb-10 text-cyan-300 whitespace-nowrap">
        Calm Room
      </h2>

      <nav className="space-y-6">
        <div className={active}>Overview</div>
        <div className={normal}>Practice Room</div>
        <div className={normal}>Performance</div>
        <div className={normal}>Resume & Career</div>
        <div className={normal}>Account & Settings</div>
      </nav>
    </aside>
  );
}