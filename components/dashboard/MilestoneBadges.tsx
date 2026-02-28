"use client";

interface Badge {
  title: string;
  description: string;
}

export default function MilestoneBadges() {
  // sample unlocked milestones (later from DB)
  const badges: Badge[] = [
    {
      title: "First Practice",
      description: "Completed your first mock interview",
    },
    {
      title: "Consistency Builder",
      description: "Completed 5 practice sessions",
    },
    {
      title: "Confidence Rising",
      description: "Confidence score improved",
    },
  ];

  if (badges.length === 0) {
    return (
      <div className="bg-white/5 border border-white/10 rounded-2xl p-6 text-sm text-gray-400">
        Complete practice sessions to earn milestones.
      </div>
    );
  }

  return (
    <div className="bg-white/5 backdrop-blur-lg border border-white/10 rounded-2xl p-6 space-y-4 transition hover:-translate-y-1">

      <h2 className="text-lg text-cyan-200 font-medium">
        Milestones
      </h2>

      <div className="grid md:grid-cols-3 gap-4">
        {badges.map((badge, i) => (
          <div
            key={i}
            className="p-4 rounded-xl bg-gradient-to-br from-cyan-500/10 to-blue-500/10 border border-cyan-400/20"
          >
            <div className="text-sm font-semibold text-cyan-300">
              {badge.title}
            </div>

            <p className="text-xs text-gray-400 mt-1 leading-relaxed">
              {badge.description}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}