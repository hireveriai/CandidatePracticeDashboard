import BreathingOrb from "./BreathingOrb";

export default function WelcomeCard() {
  return (
    <div className="bg-white/5 backdrop-blur-lg border border-white/10 rounded-2xl p-6 transition hover:-translate-y-1">
      <h2 className="text-lg text-cyan-200 font-medium mb-1">
        Welcome back
      </h2>

      <p className="text-gray-300">
        Take a breath and do your best today.
      </p>

      <BreathingOrb />
    </div>
  );
}