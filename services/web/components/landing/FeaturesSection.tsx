import { SectionShell, surfaceCardClass } from "./SectionShell";

const STEPS = [
  {
    step: "1",
    title: "Pick your topic",
    description:
      "Hotel, cooking, travel, shopping, banking, or workplace help — choose the area that fits you.",
  },
  {
    step: "2",
    title: "Start talking",
    description:
      "Share your name, begin the call, and ask your question by voice. Your words appear so you can review them.",
  },
  {
    step: "3",
    title: "Get your answer",
    description:
      "The assistant replies out loud. Ask again, pause a reply, or start fresh whenever you like.",
  },
];

const BENEFITS = [
  {
    title: "Always on, 24/7",
    description: "Your customers get support any time they need it, even outside business hours.",
  },
  {
    title: "Higher customer satisfaction",
    description: "Quick, clear voice responses help people feel heard and supported instantly.",
  },
  {
    title: "Business-ready scale",
    description: "Handle more support conversations without growing your support desk at the same pace.",
  },
];

export function FeaturesSection() {
  return (
    <SectionShell
      id="features"
      eyebrow="How it works"
      title="Three simple steps"
      description="A business-focused support flow designed to boost conversions, improve retention, and keep customers happy."
    >
      <ol className="grid gap-6 md:grid-cols-3">
        {STEPS.map((item) => (
          <li key={item.step} className={`flex flex-col items-center ${surfaceCardClass}`}>
            <span className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500/20 text-lg font-bold text-emerald-300">
              {item.step}
            </span>
            <h3 className="mt-5 text-lg font-semibold text-white">{item.title}</h3>
            <p className="mt-3 text-sm leading-relaxed text-slate-300">{item.description}</p>
          </li>
        ))}
      </ol>

      <div className="mt-6 grid gap-6 md:grid-cols-3">
        {BENEFITS.map((item) => (
          <article key={item.title} className={surfaceCardClass}>
            <h3 className="text-lg font-semibold text-white">{item.title}</h3>
            <p className="mt-3 text-sm leading-relaxed text-slate-300">{item.description}</p>
          </article>
        ))}
      </div>
    </SectionShell>
  );
}
