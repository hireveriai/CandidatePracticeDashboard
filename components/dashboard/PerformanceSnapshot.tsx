export default function PerformanceSnapshot() {
  return (
    <div className="bg-white/5 backdrop-blur-lg border border-white/10 rounded-2xl p-6 space-y-4 transition hover:-translate-y-1">
      
      <h2 className="text-lg text-cyan-200 font-medium">
        Performance Snapshot
      </h2>

      <div className="grid grid-cols-3 gap-6 text-center">
        <div>
          <p className="text-gray-400 text-sm">Confidence</p>
          <p className="text-2xl font-semibold">8.2</p>
        </div>

        <div>
          <p className="text-gray-400 text-sm">Clarity</p>
          <p className="text-2xl font-semibold">7.8</p>
        </div>

        <div>
          <p className="text-gray-400 text-sm">Communication</p>
          <p className="text-2xl font-semibold">8.5</p>
        </div>
      </div>

      <div className="text-sm text-gray-400">
        Tip: Use examples to strengthen your answers.
      </div>
    </div>
  );
}