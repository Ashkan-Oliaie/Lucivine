export type ExperienceLevel =
  | "newcomer"
  | "recaller"
  | "dabbler"
  | "practitioner"
  | "adept";

export type Goal =
  | "recall"
  | "lucidity"
  | "nightmares"
  | "creativity"
  | "healing"
  | "meditation"
  | "sleep_quality";

export type User = {
  id: string;
  email: string;
  display_name: string;
  avatar_url: string;
  timezone: string;
  current_week: number;
  streak_count: number;
  last_practice_date: string | null;
  email_verified: boolean;
  date_joined: string;
  experience_level: ExperienceLevel | "";
  goals: Goal[];
  typical_bedtime: string | null;
  onboarded_at: string | null;
};

export type OnboardingInput = {
  experience_level?: ExperienceLevel;
  goals?: Goal[];
  typical_bedtime?: string | null;
};

export type TokenPair = {
  access: string;
  refresh: string;
  user: User;
};

export type RealityCheckMethod =
  | "hand"
  | "nose"
  | "text"
  | "clock"
  | "light"
  | "mirror"
  | "memory"
  | "jump";

export type RealityCheck = {
  id: string;
  method: RealityCheckMethod;
  was_lucid_trigger: boolean;
  notes: string;
  performed_at: string;
};

export type RealityCheckStats = {
  total: number;
  last_30_days_total: number;
  daily: Array<{ date: string; count: number }>;
  by_method: Partial<Record<RealityCheckMethod, number>>;
};

export type Paginated<T> = {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
};

// Practice
export type Technique = "DILD" | "WILD" | "MILD" | "WBTB" | "SSILD" | "other";
export type ChakraId =
  | "root"
  | "sacral"
  | "solar"
  | "heart"
  | "throat"
  | "thirdeye"
  | "crown";

export type WeeklyProgram = {
  week_number: number;
  title: string;
  focus: string;
  daily_practices: string[];
  primary_technique: Technique;
  technique_detail: string;
  recommended_chakras: ChakraId[];
};

export type UserProgress = {
  id: string;
  week_number: number;
  started_at: string;
  completed_at: string | null;
  daily_completion_log: Record<string, string[]>;
};

// Meditation
export type Chakra = {
  id: ChakraId;
  name: string;
  english: string;
  color: string;
  frequency_hz: number;
  mantra: string;
  location: string;
  theme: string;
};

export type ChakraSession = {
  id: string;
  chakra_id: ChakraId;
  duration_seconds: number;
  frequency_hz: number | null;
  mantra: string;
  notes: string;
  completed_at: string;
};

export type ChakraStats = {
  total_sessions: number;
  total_seconds: number;
  per_chakra: Array<{ chakra_id: ChakraId; sessions: number; seconds: number }>;
  last_30_days: Array<{ date: string; by_chakra: Record<string, number> }>;
};

// Journal
export type DreamEntry = {
  id: string;
  title: string;
  content: string;
  dream_date: string;
  is_lucid: boolean;
  lucidity_duration_seconds: number | null;
  technique_used: Technique | "";
  vividness: number | null;
  emotions: string[];
  symbols: string[];
  transition_stages_reached: number[];
  created_at: string;
  updated_at: string;
};

export type JournalStats = {
  total: number;
  lucid_total: number;
  wild_total: number;
  avg_vividness: number | null;
  last_30_days_total: number;
  last_30_days_lucid: number;
  by_technique: Partial<Record<Technique, number>>;
  calendar: Array<{ date: string; count: number; lucid: number }>;
};

// Spells
export type SpellCategory =
  | "stabilization"
  | "manifestation"
  | "transformation"
  | "environmental";

export type Spell = {
  id: string;
  slug: string;
  name: string;
  tier: number;
  description: string;
  incantation: string;
  unlock_threshold: number;
  category: SpellCategory;
  unlocked: boolean;
  cast_count: number;
};

export type SpellList = {
  lucid_count: number;
  results: Spell[];
};

export type SpellCast = {
  id: string;
  spell: string;
  dream_entry: string | null;
  success_rating: number;
  notes: string;
  cast_at: string;
};

export type GrimoireEntry = {
  spell: Spell;
  casts: Array<{
    id: string;
    dream_entry: string | null;
    success_rating: number;
    notes: string;
    cast_at: string;
  }>;
  avg_success: number | null;
};

// Reminders
export type ReminderKind = "rc" | "meditation" | "journal" | "wbtb" | "custom";
export type ReminderCadence = "daily" | "interval";
export type ReminderChannel = "email" | "push" | "both";

export type Reminder = {
  id: string;
  kind: ReminderKind;
  label: string;
  cadence: ReminderCadence;
  time_of_day: string;
  active_until: string | null;
  interval_minutes: number | null;
  channel: ReminderChannel;
  enabled: boolean;
  next_fire_at: string;
  last_fired_at: string | null;
  created_at: string;
  /** Empty string when this reminder isn't bound to a specific practice. */
  practice_slug: string;
};

// Analytics
export type Dashboard = {
  streak: number;
  current_week: number;
  totals: {
    lucid_dreams: number;
    wild_successes: number;
    dream_entries: number;
    reality_checks: number;
    chakra_sessions: number;
    chakra_seconds: number;
  };
  last_30_days: {
    reality_checks: number;
    lucid_dreams: number;
    chakra_minutes: number;
  };
  recent_lucids: Array<{
    id: string;
    title: string;
    dream_date: string;
    technique_used: Technique | "";
    vividness: number | null;
  }>;
};

export type Heatmap = {
  year: number;
  days: Array<{
    date: string;
    reality_checks: number;
    chakra_sessions: number;
    chakra_seconds: number;
    dream_entries: number;
    lucid_dreams: number;
  }>;
};

export type TimelineMetric = "lucid_count" | "rc_count" | "chakra_minutes";

export type Timeline = {
  metric: TimelineMetric;
  range_days: number;
  points: Array<{ date: string; value: number }>;
};
