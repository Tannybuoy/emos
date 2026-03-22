export interface MusicProfile {
  bpmMin: number;
  bpmMax: number;
  instrumental: boolean;
  energyLevel: "low" | "medium" | "high";
  mood: "calm" | "intense" | "uplifting";
  progression: "steady" | "ramp-up" | "dynamic";
  searchQuery: string;
  summary: string;
  language: string;
}

const STATE_RULES: Record<string, Partial<MusicProfile>> = {
  Focused:    { bpmMin: 70, bpmMax: 90, progression: "steady" },
  Stressed:   { bpmMin: 55, bpmMax: 75, instrumental: true, mood: "calm" },
  Tired:      { bpmMin: 60, bpmMax: 85, progression: "ramp-up", energyLevel: "low" },
  Energized:  { bpmMin: 100, bpmMax: 130, energyLevel: "high", mood: "uplifting" },
  Bored:      { bpmMin: 85, bpmMax: 110, energyLevel: "medium", mood: "uplifting" },
  Calm:       { bpmMin: 60, bpmMax: 80, mood: "calm", instrumental: true },
  Anxious:    { bpmMin: 55, bpmMax: 75, instrumental: true, mood: "calm" },
  Distracted: { instrumental: true, energyLevel: "low" },
  "Locked-in":    { bpmMin: 80, bpmMax: 100, progression: "steady" },
  Overwhelmed:    { bpmMin: 55, bpmMax: 70, instrumental: true, mood: "calm", energyLevel: "low" },
  "In Control":   { bpmMin: 75, bpmMax: 95, progression: "steady", mood: "uplifting" },
  Curious:        { bpmMin: 75, bpmMax: 100, energyLevel: "medium", progression: "dynamic" },
  Blocked:        { bpmMin: 60, bpmMax: 80, instrumental: true, mood: "calm" },
  Start:          { bpmMin: 90, bpmMax: 115, energyLevel: "medium", mood: "uplifting" },
  Continue:       { bpmMin: 75, bpmMax: 95, progression: "steady" },
  Finish:         { bpmMin: 95, bpmMax: 125, progression: "ramp-up", mood: "intense" },
  Recover:        { bpmMin: 55, bpmMax: 75, energyLevel: "low", mood: "calm", instrumental: true },
};

const ROLE_BIAS: Record<string, Partial<MusicProfile>> = {
  engineer:   { instrumental: true },
  developer:  { instrumental: true },
  designer:   { progression: "dynamic" },
  pm:         { instrumental: false },
  "product manager": { instrumental: false },
  student:    { energyLevel: "medium" },
};

// Genre-native terms Spotify actually understands — put these FIRST in queries
// so they dominate relevance ranking and pull music actually in that language.
const LANGUAGE_GENRE_TERMS: Record<string, string> = {
  english:    "pop indie",
  spanish:    "pop latino reggaeton",
  french:     "french pop chanson",
  japanese:   "j-pop jpop",
  korean:     "kpop k-pop",
  portuguese: "mpb sertanejo",
  hindi:      "bollywood hindi",
  arabic:     "arabic pop",
  german:     "deutschpop german",
};

const STATE_KEYWORDS: Record<string, string> = {
  Focused:      "focus concentration",
  "Locked-in":  "flow state",
  Stressed:     "stress relief calming",
  Anxious:      "peaceful anxiety relief",
  Overwhelmed:  "slow calming",
  Energized:    "energizing upbeat",
  Tired:        "gentle wake up",
  Bored:        "eclectic variety",
  Curious:      "eclectic exploration",
  "In Control": "confident steady",
  Distracted:   "minimal ambient",
  Calm:         "peaceful serene",
  Start:        "motivating kickstart",
  Finish:       "finish strong",
  Continue:     "steady momentum",
  Recover:      "recovery gentle",
};

function getQueryKeywords(profile: MusicProfile, states: string[]): string {
  const parts: string[] = [];

  // 1. Language genre term FIRST — strongest signal for language enforcement
  const langGenre = profile.language && profile.language !== "any"
    ? LANGUAGE_GENRE_TERMS[profile.language]
    : null;
  if (langGenre) parts.push(langGenre);

  // 2. Instrumental flag; when vocal+no language, use "pop" as genre anchor
  // (avoids "vocal exercise" / "vocal warm-up" results that "vocal" keyword attracts)
  if (profile.instrumental) {
    parts.push("instrumental");
  } else if (!langGenre) {
    parts.push("pop");
  }
  // When langGenre is set, it already implies vocals (kpop, reggaeton, etc.)

  // 3. Mood + energy
  if (profile.mood === "calm") parts.push("calm");
  if (profile.mood === "intense") parts.push("intense deep work");
  if (profile.mood === "uplifting") parts.push("uplifting");
  if (profile.energyLevel === "low") parts.push("chill");
  if (profile.energyLevel === "high") parts.push("high energy");

  // 4. Top state keywords (first 2 states only to stay focused)
  for (const state of states.slice(0, 2)) {
    const kw = STATE_KEYWORDS[state];
    if (kw) parts.push(kw);
  }

  const unique = [...new Set(parts.flatMap((p) => p.split(" ")))];
  return unique.slice(0, 8).join(" ");
}

function buildSummary(_profile: MusicProfile, states: string[], role: string): string {
  const allLabels = states.join(" · ");
  const roleLabel = role ? role.trim() : "knowledge worker";
  return `emos tuned for ${roleLabel} · ${allLabels}`;
}

export function mapStateToMusic(
  states: string[],
  role: string,
  overrides?: { instrumental?: boolean; language?: string }
): MusicProfile {
  let bpmMin = 70;
  let bpmMax = 95;
  let instrumental = false;
  let energyLevel: "low" | "medium" | "high" = "medium";
  let mood: "calm" | "intense" | "uplifting" = "calm";
  let progression: "steady" | "ramp-up" | "dynamic" = "steady";

  let bpmMinSum = 0;
  let bpmMaxSum = 0;
  let bpmCount = 0;

  for (const state of states) {
    const rule = STATE_RULES[state];
    if (!rule) continue;

    if (rule.bpmMin !== undefined) { bpmMinSum += rule.bpmMin; bpmCount++; }
    if (rule.bpmMax !== undefined) bpmMaxSum += rule.bpmMax;
    if (rule.instrumental === true) instrumental = true;
    if (rule.energyLevel) energyLevel = rule.energyLevel;
    if (rule.mood) mood = rule.mood;
    if (rule.progression) progression = rule.progression;
  }

  if (bpmCount > 0) {
    bpmMin = Math.round(bpmMinSum / bpmCount);
    bpmMax = Math.round(bpmMaxSum / bpmCount);
  }

  const normalizedRole = role.toLowerCase();
  for (const [key, bias] of Object.entries(ROLE_BIAS)) {
    if (normalizedRole.includes(key)) {
      if (bias.instrumental !== undefined) instrumental = bias.instrumental;
      if (bias.energyLevel) energyLevel = bias.energyLevel;
      if (bias.progression) progression = bias.progression;
      break;
    }
  }

  // Apply user overrides (explicit choices win over inferred values)
  if (overrides?.instrumental !== undefined) instrumental = overrides.instrumental;
  const language = overrides?.language ?? "any";

  const profile: MusicProfile = {
    bpmMin,
    bpmMax,
    instrumental,
    energyLevel,
    mood,
    progression,
    searchQuery: "",
    summary: "",
    language,
  };

  profile.searchQuery = getQueryKeywords(profile, states);
  profile.summary = buildSummary(profile, states, role);

  return profile;
}
