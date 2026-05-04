export type PracticeMeta = {
  label: string;
  glyph: string;
  description: string;
  steps: string[];
  duration: string;
  /** Default time-of-day (HH:MM, 24h) used when user adds an alarm to this practice. */
  defaultReminderTime?: string;
  /** Time is computed from the user's typical bedtime instead of a fixed clock. */
  reminderRelativeToBedtime?: { offsetMinutes: number };
};

/** Practice descriptions, ordered by how often a beginner meets them.
 * Some entries are foundation-week additions (sensory grounding, wind-down,
 * nose pinch, etc); some are kept for back-compat with older user logs. */
export const PRACTICE_META: Record<string, PracticeMeta> = {
  // ── Foundation / sensory groundwork (Week 1) ──────────────────────
  evening_winddown: {
    label: "Evening wind-down",
    glyph: "☾",
    description:
      "30 minutes before bed: dim the lights, close screens, slow the body. Deeper REM density depends on a long, undisturbed sleep — so the wind-down is the lucid practice.",
    steps: [
      "Stop screens 30 minutes before lights-out.",
      "Lower lights — single warm lamp if possible.",
      "Write one sentence of intention for tonight.",
    ],
    duration: "30 min",
    defaultReminderTime: "21:30",
    reminderRelativeToBedtime: { offsetMinutes: -30 },
  },
  sensory_grounding: {
    label: "Sensory grounding",
    glyph: "✦",
    description:
      "Pause for a minute and drop into your senses. Listen for the sounds around you — the hum of a room, a far-off voice, your own breath. Or feel a texture under your fingers — the weave of your sleeve, the cool edge of a desk. Or simply reflect on this moment: where you are, what you see, the touch of air on your skin. The point is to fully arrive in *now*. That same noticing muscle is what wakes you up inside a dream.",
    steps: [
      "Pause wherever you are and stop moving for a moment.",
      "Pick one sense — sound, touch, or sight — and rest your attention there for ~30 seconds.",
      "Name what you notice silently: three sounds, or three textures, or three things you see.",
      "Ask: am I really here, awake? Take the question seriously.",
      "Repeat 2–3 times across the day.",
    ],
    duration: "1–2 min",
    defaultReminderTime: "12:00",
  },
  body_scan: {
    label: "Body scan",
    glyph: "≋",
    description:
      "Five-minute progressive scan from feet to crown. Lowers arousal and primes the still-body / awake-mind state that SSILD and WILD ride.",
    steps: [
      "Lie on your back. Eyes closed.",
      "Move attention slowly: feet, calves, hips, belly, chest, hands, throat, face, crown.",
      "Linger one slow breath at each.",
    ],
    duration: "5 min",
    defaultReminderTime: "22:30",
    reminderRelativeToBedtime: { offsetMinutes: 0 },
  },
  mindful_breath_10min: {
    label: "Mindful breath",
    glyph: "○",
    description:
      "Ten minutes of open-monitoring meditation. Long-term meditators report ~67% more lucid dreams than non-meditators (Baird 2019; MDPI 2024) — the curve is slow, the daily reps matter.",
    steps: [
      "Sit comfortably. Eyes soft or closed.",
      "Follow the breath without steering it.",
      "When the mind drifts, notice — return without judgement.",
    ],
    duration: "10 min",
    defaultReminderTime: "08:00",
  },

  // ── Reality checks (specific, evidence-ranked) ────────────────────
  nose_pinch_rc: {
    label: "Nose-pinch reality check",
    glyph: "○",
    description:
      "Pinch your nose closed and try to breathe through it. If air flows, you are dreaming. Most reliable RC by ranking — binary outcome, no ambiguity (Levitan & LaBerge; Oneironaut analysis).",
    steps: [
      "Pinch your nose with thumb and finger.",
      "Close your mouth and try to inhale through your nose.",
      "Ask out loud or in mind: am I dreaming? Take it seriously even when you 'know'.",
    ],
    duration: "20 sec",
    defaultReminderTime: "12:00",
  },
  finger_count_rc: {
    label: "Finger-count reality check",
    glyph: "✋",
    description:
      "Look at your hand, count the fingers, look away, look back, count again. In dreams the count rarely matches twice. #2 by reliability after the nose-pinch.",
    steps: [
      "Hold one hand in front of you.",
      "Count slowly: one, two, three, four, five.",
      "Glance away. Look back. Count again.",
    ],
    duration: "20 sec",
    defaultReminderTime: "10:00",
  },

  // ── Recall (Weeks 1–2) ────────────────────────────────────────────
  morning_recall: {
    label: "Morning recall",
    glyph: "☀",
    description:
      "On waking, stay still. Replay anything — a feeling, a fragment — before movement washes it away. Recall is the strongest predictor of lucid frequency (Tan 2023).",
    steps: [
      "Don't move or open your eyes when you wake.",
      "Hold whatever drifts up — a colour, a face, a place.",
      "Reach for your journal only once you have something to anchor.",
    ],
    duration: "3–5 min",
    defaultReminderTime: "07:00",
  },
  wake_recall_freeze: {
    label: "Wake-still recall",
    glyph: "≡",
    description:
      "Resist movement. Movement is the river that washes the dream away. The longer you stay frozen, the more drifts back.",
    steps: [
      "Don't open your eyes. Don't shift position.",
      "Stay for 60 seconds. Let the dream surface.",
      "Move only when you have the thread.",
    ],
    duration: "1–3 min",
    defaultReminderTime: "07:00",
  },
  voice_memo_recall: {
    label: "Voice-memo recall",
    glyph: "♪",
    description:
      "Speak the dream while it's hot. Words come faster than fingers and salvage fragments that journaling alone misses.",
    steps: [
      "Phone within reach before you sleep.",
      "On waking, hit record without sitting up.",
      "Whisper the fragments. Transcribe later.",
    ],
    duration: "2–4 min",
    defaultReminderTime: "07:05",
  },
  journal_entry: {
    label: "Journal entry",
    glyph: "❍",
    description:
      "A written entry — even a sentence — strengthens the recall muscle and trains the symbols you'll later spot as dream signs.",
    steps: [
      "Open a new entry the moment you wake.",
      "Title it with whatever lingers — even nonsense.",
      "Tag the strongest feeling and one symbol.",
    ],
    duration: "5–10 min",
    defaultReminderTime: "07:15",
  },
  dream_sign_review: {
    label: "Dream-sign review",
    glyph: "✶",
    description:
      "Re-read your last 7 entries and tag recurring symbols, places, people. These are *your* dream signs — when one shows up in a dream, lucidity follows. Foundation of DILD.",
    steps: [
      "Open the last week of journal entries.",
      "Mark anything that repeats: a person, a building, a feeling.",
      "Pick one to silently 'expect' tonight.",
    ],
    duration: "5–10 min",
    defaultReminderTime: "21:00",
  },

  // ── Intent / induction (Weeks 3+) ─────────────────────────────────
  intent_setting: {
    label: "Intent setting",
    glyph: "✺",
    description:
      "Verbal + visualised intention as you fall asleep. Aspy 2017 RCT — visualisation matters more than the phrase itself.",
    steps: [
      "Lie still. Slow the breath.",
      "Repeat: 'Next time I am dreaming, I will recognise that I am dreaming.'",
      "Picture yourself becoming lucid in a dream from this week. Hold the scene until sleep.",
    ],
    duration: "5–10 min",
    defaultReminderTime: "23:00",
    reminderRelativeToBedtime: { offsetMinutes: -10 },
  },
  evening_reflection: {
    label: "Evening reflection",
    glyph: "☾",
    description:
      "Before sleep, set the night's intention. Tell yourself you'll notice. Kept for users on the legacy program.",
    steps: [
      "Lie still. Slow the breath.",
      "Picture the moment you'd realise you're dreaming.",
      "Say it: 'Tonight, I'll notice.'",
    ],
    duration: "5 min",
    defaultReminderTime: "22:30",
  },
  ssild_cycles: {
    label: "SSILD cycles",
    glyph: "≈",
    description:
      "Senses-Initiated Lucid Dream — three slow rounds then three quick rounds across sight, sound, touch. Aspy 2020 ILDIS (n=355) — equally effective as MILD, no visualisation skill required.",
    steps: [
      "After WBTB, lie comfortably. Eyes closed.",
      "Slow round (~30 sec each): sight (darkness behind eyelids), sound (room ambience), touch (body on bed). Repeat 3×.",
      "Quick round (~5 sec each): same three senses, light attention. Repeat 3×. Then sleep.",
    ],
    duration: "10–15 min",
    defaultReminderTime: "04:00",
  },

  // ── WBTB family (Weeks 4–6) ───────────────────────────────────────
  wbtb_weekend: {
    label: "WBTB (weekends only)",
    glyph: "◐",
    description:
      "Wake back to bed restricted to weekend nights. Daily WBTB compounds sleep debt and crushes recall — weekends preserve the substrate while still hitting the late REM-dense window.",
    steps: [
      "Set an alarm for ~4½ hours after sleep onset, Friday/Saturday only.",
      "Out of bed for 15–20 minutes. Lights low. Read your journal.",
      "Return to bed and run SSILD or MILD as you fall asleep.",
    ],
    duration: "20 min awake",
    defaultReminderTime: "03:30",
    reminderRelativeToBedtime: { offsetMinutes: 270 },
  },
  wbtb_4_5h: {
    label: "WBTB at 4½ hours",
    glyph: "◐",
    description:
      "Wake fully 4½–6 hours after sleep onset to catch the longest REM windows of the night.",
    steps: [
      "Set the alarm 4½ hours after lights-out.",
      "Get fully awake — out of bed, low lights.",
      "Stay up 20–30 minutes (see next practice).",
    ],
    duration: "alarm",
    defaultReminderTime: "03:30",
    reminderRelativeToBedtime: { offsetMinutes: 270 },
  },
  "20m_awake_practice": {
    label: "20 min awake practice",
    glyph: "◌",
    description:
      "The window during WBTB. Read about lucid dreaming, skim your journal, sit with intent. 20–30 minutes is the cited optimum — shorter and the prefrontal isn't online; longer and you can't return to sleep.",
    steps: [
      "Stay seated, lights very low.",
      "Read 1–2 pages on lucid dreaming OR skim recent journal entries.",
      "Set intention for the return-to-bed.",
    ],
    duration: "20–30 min",
  },
  wild_or_mild_attempt: {
    label: "WILD or MILD attempt",
    glyph: "≈",
    description:
      "Return to bed and run your chosen induction as you fall asleep — MILD's intention loop or WILD's still-body / awake-mind hold.",
    steps: [
      "Lie comfortably — different position from your usual sleep helps.",
      "Run MILD (visualised intent) OR WILD (watch hypnagogia without grasping).",
      "Whichever you choose, *don't move*.",
    ],
    duration: "until sleep",
  },
  wbtb_chosen: {
    label: "WBTB on your nights",
    glyph: "◐",
    description:
      "WBTB scheduled on the 2–3 nights per week you've found most reliable. Sustainability beats heroics.",
    steps: [
      "Pick your nights this week (e.g. Tue/Fri/Sat).",
      "Same protocol: 4½h alarm, 20–30 min awake, MILD or SSILD as you return to sleep.",
    ],
    duration: "20 min awake",
  },
  chosen_technique: {
    label: "Chosen technique",
    glyph: "✺",
    description:
      "Run the technique that produced your strongest result in Weeks 3–5. Consistency, not novelty, is what makes lucidity a practice.",
    steps: [
      "Name your technique aloud at lights-out.",
      "Run it the same way each night.",
      "Note results in your journal — what worked is now your protocol.",
    ],
    duration: "varies",
  },
  evening_chakra_session: {
    label: "Evening chakra session",
    glyph: "✦",
    description:
      "A short chakra meditation before sleep. Choose the centre that matches tonight's intent — third-eye for clarity, heart for warmth.",
    steps: [
      "Open Chakras and pick a centre.",
      "Run a 5–10 minute timed session.",
      "Carry the colour and tone into your wind-down.",
    ],
    duration: "5–10 min",
    defaultReminderTime: "22:00",
    reminderRelativeToBedtime: { offsetMinutes: -45 },
  },
  spell_practice: {
    label: "Spell practice",
    glyph: "☾",
    description:
      "Pick a spell from your unlocked grimoire and run its rite tonight inside the dream. Kept for legacy week 6 logs.",
    steps: [
      "Open Spells and choose one you've unlocked.",
      "Read its incantation as part of intent-setting.",
      "Attempt the spell once you become lucid.",
    ],
    duration: "varies",
  },

  // ── Legacy slugs kept for back-compat with old user logs ──────────
  rc_every_2h: {
    label: "Reality check every 2h",
    glyph: "○",
    description:
      "A small, deliberate question to waking life — repeated until it slips into dreams. Replaced by nose-pinch / finger-count in the new program; kept here for back-compat.",
    steps: [
      "Pause. Ask: am I dreaming?",
      "Run a check (nose pinch, finger count).",
      "Look around for one detail that doesn't fit.",
    ],
    duration: "30 sec",
  },
  afternoon_meditation: {
    label: "Afternoon meditation",
    glyph: "✦",
    description:
      "A short stillness in the day. Kept for legacy week 3 logs — superseded by `mindful_breath_10min` in the v2 program.",
    steps: [
      "Sit. Eyes soft or closed.",
      "Follow the breath without steering it.",
      "When the mind drifts, return — without judgement.",
    ],
    duration: "10–20 min",
  },
  wbtb_3am: {
    label: "Wake back to bed (3am)",
    glyph: "◐",
    description:
      "Legacy daily WBTB. Replaced by `wbtb_weekend` / `wbtb_4_5h` in the v2 program — daily WBTB compounds sleep debt.",
    steps: [
      "Set an alarm for ~5 hours after sleep onset.",
      "Stay up 15–20 min, lights low. Re-read your last dream.",
      "Return to bed with the intention: 'I'll notice.'",
    ],
    duration: "20 min awake",
  },
  wild_attempt: {
    label: "WILD attempt",
    glyph: "≈",
    description:
      "Wake-induced lucid: keep the body asleep, the mind awake. Slip across the threshold consciously. Now consolidated under `wild_or_mild_attempt`.",
    steps: [
      "After WBTB, lie still on your back.",
      "Watch hypnagogic imagery without grabbing.",
      "Let the body fall. Stay aware as the dream forms.",
    ],
    duration: "15–40 min",
  },
  early_bedtime: {
    label: "Early bedtime",
    glyph: "☾",
    description:
      "Sleep before 11pm so the WBTB alarm lands inside the late-night REM-rich window without crushing total sleep. Kept for legacy week 5 logs.",
    steps: [
      "Lights out by 10:30pm.",
      "Wind-down ritual first (no screens 30 min prior).",
      "Aim for full 7–9 hours total even with WBTB.",
    ],
    duration: "—",
  },
};

/** A single, method-agnostic Reality Check entry. We collapse all RC variants
 * (nose-pinch, finger-count, legacy rc_every_2h) into one display so the user
 * picks whichever method resonates — no need to specify which. */
export const REALITY_CHECK_META: PracticeMeta = {
  label: "Reality check",
  glyph: "○",
  description:
    "A small, deliberate question to waking life: am I dreaming? Pick whichever check feels right — pinch your nose and try to breathe through it, count your fingers twice, read a line of text and look back, push a finger through your palm. The method matters less than the *habit*. Repeated often enough in waking life, the question slips into a dream — and that's where lucidity begins.",
  steps: [
    "Pause whatever you're doing and ask, sincerely: am I dreaming?",
    "Run a check you trust — nose pinch, finger count, re-read text, palm push.",
    "Look around for one detail that doesn't fit: writing that shifts, a face that won't hold, a room slightly off.",
    "Take the answer seriously even when you 'know' you're awake. The seriousness is what carries over.",
  ],
  duration: "20–30 sec",
  defaultReminderTime: "12:00",
};

/** True for any reality-check practice slug, regardless of method. */
export function isRealityCheckSlug(slug: string): boolean {
  return slug.endsWith("_rc") || slug === "rc_every_2h";
}

export function metaFor(key: string): PracticeMeta {
  if (isRealityCheckSlug(key)) return REALITY_CHECK_META;
  return (
    PRACTICE_META[key] ?? {
      label: key.replace(/_/g, " "),
      glyph: "·",
      description: "",
      steps: [],
      duration: "",
    }
  );
}

/** Collapse a list of practice slugs so multiple RC variants surface as a
 * single Reality Check entry. The first RC slug seen represents the group. */
export function dedupePracticeSlugs(slugs: string[]): string[] {
  const out: string[] = [];
  let rcSeen = false;
  for (const s of slugs) {
    if (isRealityCheckSlug(s)) {
      if (rcSeen) continue;
      rcSeen = true;
    }
    out.push(s);
  }
  return out;
}
