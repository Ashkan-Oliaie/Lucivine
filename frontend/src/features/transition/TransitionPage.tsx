import { motion } from "framer-motion";
import { Card } from "@/components/ui/Card";

const STAGES = [
  {
    n: 1,
    name: "Relaxation",
    cue: "Body softens. Breath slows. The world recedes.",
    action: "Lie still. Scan from crown to toes. Release each layer.",
  },
  {
    n: 2,
    name: "Hypnagogic drift",
    cue: "Random images bloom and dissolve behind closed lids.",
    action: "Witness without attaching. Don't follow any single image.",
  },
  {
    n: 3,
    name: "Patterns",
    cue: "Geometric patterns swirl. Color emerges from grey.",
    action: "Stay relaxed but alert. The body is going under; you remain.",
  },
  {
    n: 4,
    name: "Vibrations",
    cue: "Buzzing, rushing, electric tingling through the body.",
    action: "Do not move. Do not flinch. Welcome it. Let it intensify.",
  },
  {
    n: 5,
    name: "Loud noise",
    cue: "Roaring, ringing, voices. The auditory threshold.",
    action: "Stay still. This passes in seconds. The dream body is forming.",
  },
  {
    n: 6,
    name: "Floating",
    cue: "A sense of separation. You are above, beside, or doubled.",
    action: "Roll out gently. Or sit up. The physical body remains behind.",
  },
  {
    n: 7,
    name: "Scene formation",
    cue: "A place coalesces around you. Sometimes familiar, often not.",
    action: "Stabilise: rub hands, examine details, speak your intent.",
  },
  {
    n: 8,
    name: "Lucidity",
    cue: "You know. The dream is yours.",
    action: "Begin gently. Stabilise before you act. Then create.",
  },
];

export default function TransitionPage() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <p className="font-mono uppercase tracking-ritual text-[10px] text-ink-secondary mb-3">
        Transition
      </p>
      <h1 className=" text-4xl md:text-5xl font-light text-ink-primary">
        Eight gates. <em className="text-accent-lavender">One crossing</em>.
      </h1>
      <p className=" italic text-ink-secondary text-base md:text-lg mt-4 max-w-xl">
        The WILD threshold passes through these stages. Knowing the map keeps
        the witness awake.
      </p>

      <ol className="mt-12 space-y-6">
        {STAGES.map((s, i) => (
          <motion.li
            key={s.n}
            initial={{ opacity: 0, x: -16 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.05, duration: 0.4 }}
          >
            <Card className="!p-5 md:!p-6">
              <div className="flex items-start gap-4 md:gap-6">
                <div className=" text-4xl md:text-5xl text-accent-lavender/50 leading-none w-10 shrink-0">
                  {s.n}
                </div>
                <div className="flex-1">
                  <p className="font-mono uppercase tracking-ritual text-[10px] text-ink-muted">
                    Stage
                  </p>
                  <h2 className=" text-xl md:text-2xl text-ink-primary mt-1">
                    {s.name}
                  </h2>
                  <p className=" italic text-ink-secondary mt-3">
                    {s.cue}
                  </p>
                  <p className=" text-ink-primary mt-3 leading-relaxed">
                    {s.action}
                  </p>
                </div>
              </div>
            </Card>
          </motion.li>
        ))}
      </ol>
    </motion.div>
  );
}
