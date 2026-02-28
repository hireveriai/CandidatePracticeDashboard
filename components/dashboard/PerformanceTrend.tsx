"use client";

interface PerformanceTrendProps {
  scores?: number[]; // optional for future API data
}

export default function PerformanceTrend({
  scores = [6.5, 6.8, 7.2, 7.5, 7.8, 8.0, 8.2], // fallback sample data
}: PerformanceTrendProps) {
  const maxScore = 10;

  // improvement calculation
  const improvement =
    scores.length > 1
      ? (scores[scores.length - 1] - scores[0]).toFixed(1)
      : null;

  return (
    <div className="bg-white/5 backdrop-blur-lg border border-white/10 rounded-2xl p-6 space-y-5 transition hover:-translate-y-1">

      {/* Title */}
      <div className="flex justify-between items-center">
        <h2 className="text-lg text-cyan-200 font-medium">
          Performance Trend
        </h2>

        {improvement && (
          <span className="text-xs text-cyan-300">
            ↑ {improvement} improvement
          </span>
        )}
      </div>

      {/* Empty state */}
      {scores.length === 0 ? (
        <p className="text-gray-400 text-sm">
          Complete a practice session to see your progress.
        </p>
      ) : (
        <div className="flex items-end gap-3 h-44">
          {scores.map((score, index) => {
            const height = (score / maxScore) * 100;

            return (
              <div key={index} className="flex flex-col items-center flex-1">
                
                {/* Bar container */}
                <div className="w-full rounded-t-lg overflow-hidden bg-white/5">
                  <div
                    className="w-full bg-gradient-to-t from-cyan-400 to-blue-400 transition-all duration-700 ease-out shadow-[0_0_12px_rgba(56,189,248,0.35)]"
                    style={{ height: `${height}%` }}
                  />
                </div>

                {/* Session label */}
                <span className="text-xs text-gray-400 mt-2">
                  {index + 1}
                </span>
              </div>
            );
          })}
        </div>
      )}

      {/* Encouraging message */}
      <p className="text-xs text-gray-400 leading-relaxed">
        Your clarity and confidence are improving with each session.
      </p>
    </div>
  );
}