const BAR_COUNT = 14;

export function VoiceWaveVisualizer({ active = true }: { active?: boolean }) {
  return (
    <div
      className="flex h-24 items-end justify-center gap-1.5"
      aria-hidden
    >
      {Array.from({ length: BAR_COUNT }, (_, index) => (
        <span
          key={index}
          className={`w-1.5 origin-bottom rounded-full bg-gradient-to-t from-emerald-500 to-teal-300 ${
            active ? "animate-wave" : "h-6 opacity-40"
          }`}
          style={
            active
              ? {
                  height: `${28 + (index % 5) * 10}%`,
                  animationDelay: `${index * 70}ms`,
                }
              : { height: "24%" }
          }
        />
      ))}
    </div>
  );
}
