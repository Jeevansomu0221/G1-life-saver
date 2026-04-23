export type ZodiacName =
  | "Aries"
  | "Taurus"
  | "Gemini"
  | "Cancer"
  | "Leo"
  | "Virgo"
  | "Libra"
  | "Scorpio"
  | "Sagittarius"
  | "Capricorn"
  | "Aquarius"
  | "Pisces";

export type FocusArea = "Money" | "Career" | "Love" | "Health";

export type PredictionInput = {
  dateOfBirth?: string;
  placeOfBirth?: string;
  timeOfBirth?: string;
  zodiacSign?: ZodiacName;
  mainFocus: FocusArea;
};

export type PredictionReport = {
  header: string;
  zodiacName: ZodiacName;
  zodiacEmoji: string;
  nakshatraStyle: string;
  corePersonality: { outer: string; inner: string; othersSee: string; hidden: string };
  money: { rating: string; earlyVsLater: string; strengthAreas: string; warning: string; advice: string };
  career: { bestFields: string; timeline: string; growthPattern: string; keyInsight: string };
  respect: { ratingImprovement: string; misunderstanding: string; mainIssue: string; solution: string };
  love: { emotionalNature: string; weakness: string; loveTimeline: string; partnerType: string };
  marriage: { likelyAgeRange: string; partnerPersonality: string; impact: string };
  health: { rating: string; issues: string; advice: string };
  currentYear: { money: string; career: string; respect: string; love: string; warning: string };
  lucky: { numbers: string; colors: string; day: string; habits: string };
  finalTruth: { strength: string; weakness: string; closing: string; guidanceLine: string };
};

type Profile = {
  range: [number, number, number, number];
  nakshatra: string;
  outer: string;
  inner: string;
  others: string;
  hidden: string;
  money: string;
  warning: string;
  careers: string;
  insight: string;
  respect: string;
  love: string;
  loveWeakness: string;
  partner: string;
  marriage: string;
  health: string;
  luckyNumbers: string;
  luckyColors: string;
  luckyDay: string;
};

const profiles: Record<ZodiacName, Profile> = {
  Aries: makeProfile([3, 21, 4, 19], "Ashwini style drive", "Bold, direct, and restless.", "You fear wasting your potential.", "People see force and courage.", "You are more loyal than your anger suggests.", "Business, sales, leadership", "Impulsive spending and shortcuts", "Leadership, operations, entrepreneurship", "Discipline is your real breakthrough.", "Intensity gets mistaken for ego.", "You love fast and protectively.", "Impatience and reactive anger", "Stable, honest, mentally strong", "Marriage steadies your ambition.", "Stress, headaches, burnout", "1, 9, 18", "Red, copper", "Tuesday"),
  Taurus: makeProfile([4, 20, 5, 20], "Rohini style steadiness", "Calm, practical, and grounded.", "You crave peace and loyalty.", "People see patience and reliability.", "When hurt, you become silently intense.", "Savings, assets, stable business", "Comfort can make you slow", "Finance, property, design, banking", "Consistency creates your wealth.", "Silence is mistaken for passivity.", "You love deeply and loyally.", "Possessiveness and holding on too long", "Warm, loyal, steady", "Marriage strengthens your foundation.", "Throat, weight, emotional eating", "2, 6, 15", "Green, cream", "Friday"),
  Gemini: makeProfile([5, 21, 6, 20], "Mrigashira style curiosity", "Quick, expressive, and mentally alive.", "Your mind creates too many paths.", "People see intelligence and humor.", "Loneliness hides behind motion.", "Communication, media, teaching", "Scattered focus and unfinished plans", "Writing, media, education, sales, tech", "Focus changes your fate faster than luck.", "People think you are inconsistent.", "You seek mental freshness and movement.", "Overthinking and inconsistency", "Smart, patient, playful", "Marriage calms mental restlessness.", "Anxiety, sleep issues", "5, 14, 23", "Yellow, silver", "Wednesday"),
  Cancer: makeProfile([6, 21, 7, 22], "Pushya style emotional depth", "Soft, caring, and emotionally magnetic.", "You feel everything deeply.", "People see kindness and intuition.", "You are more strategic than people realize.", "Care work, hospitality, trust-based business", "Emotional financial choices", "Psychology, teaching, writing, hospitality", "Sensitivity must become structure.", "Silence is misunderstood as weakness.", "You love with total feeling.", "Mood swings and overgiving", "Protective, calm, loyal", "Marriage can deeply heal or deeply unsettle you.", "Digestion, stress, overthinking", "2, 7, 20", "Silver blue, white", "Monday"),
  Leo: makeProfile([7, 23, 8, 22], "Magha style royal pride", "Radiant, expressive, and visible.", "You want respect more than comfort.", "People see charisma and command.", "Validation matters more than you admit.", "Leadership, branding, entrepreneurship", "Image-based spending", "Leadership, entertainment, branding", "Purpose must become greater than ego.", "Attention-seeking is assumed too quickly.", "You love grandly and proudly.", "Drama and pride", "Secure, admiring, intelligent", "Marriage expands identity and responsibility.", "Pressure, heat, burnout", "1, 10, 19", "Gold, maroon", "Sunday"),
  Virgo: makeProfile([8, 23, 9, 22], "Hasta style precision", "Analytical, careful, and observant.", "Chaos unsettles your nervous system.", "People see discipline and intelligence.", "You are harder on yourself than others are.", "Analysis, planning, service", "Over-caution delays progress", "Medicine, analytics, research, operations", "Execution matters more than perfect analysis.", "Correction gets mistaken for criticism.", "You love quietly and through service.", "Overthinking and fault-finding", "Patient, sincere, grounded", "Marriage stabilizes you through rhythm.", "Gut stress, perfectionist burnout", "5, 14, 24", "Olive, beige", "Wednesday"),
  Libra: makeProfile([9, 23, 10, 22], "Swati style balance", "Balanced, graceful, and diplomatic.", "Too many choices create confusion.", "People see fairness and calmness.", "You delay hard decisions too long.", "Negotiation, design, partnerships", "People-pleasing delays action", "Law, design, consulting, branding", "You rise when you stop waiting for perfect balance.", "People may call you indecisive.", "You want romance, beauty, and companionship.", "Avoiding conflict", "Refined, kind, steady", "Marriage becomes a mirror for maturity.", "Stress, hormonal imbalance", "6, 15, 24", "Pink, white", "Friday"),
  Scorpio: makeProfile([10, 23, 11, 21], "Anuradha style depth", "Private, intense, and powerful.", "Trust is never casual for you.", "People see mystery and force.", "Your silence protects a vulnerable heart.", "Research, strategy, transformation", "Control issues and all-or-nothing risks", "Research, psychology, strategy, finance", "Precision is stronger than raw intensity.", "Silence and force are often feared.", "You love deeply and possessively.", "Jealousy and mistrust", "Deep, loyal, brave", "Marriage transforms you strongly.", "Suppressed stress, hormone imbalance", "9, 18, 27", "Maroon, black", "Tuesday"),
  Sagittarius: makeProfile([11, 22, 12, 21], "Mula style truth-seeking", "Independent, outspoken, future-driven.", "You need meaning to stay alive inside.", "People see optimism and honesty.", "You feel trapped very easily.", "Teaching, travel, advising", "Over-risking and ignoring detail", "Teaching, law, travel, coaching", "Purpose must become practical effort.", "Blunt honesty can look insensitive.", "You want freedom and shared growth.", "Commitment fear and distance", "Wise, adventurous, patient", "Marriage works when freedom remains respected.", "Restlessness, overdoing", "3, 12, 21", "Purple, saffron", "Thursday"),
  Capricorn: makeProfile([12, 22, 1, 19], "Shravana style discipline", "Serious, reserved, and goal-focused.", "Responsibility shaped you early.", "People see maturity and endurance.", "Softness exists, but you rarely show it.", "Long-term growth, business, administration", "Overwork and delayed enjoyment", "Management, finance, business, engineering", "Your rise is slow but powerful.", "Seriousness gets read as coldness.", "You love carefully and commit slowly.", "Work-first habits and emotional distance", "Stable, patient, grounded", "Marriage softens your emotional life.", "Fatigue, joint stress, overwork", "8, 17, 26", "Navy, charcoal", "Saturday"),
  Aquarius: makeProfile([1, 20, 2, 18], "Shatabhisha style vision", "Inventive, detached, and future-minded.", "You want belonging, but on your own terms.", "People see originality and distance.", "Emotion hides behind thought.", "Technology, innovation, unconventional work", "Detachment from practical routine", "Technology, startups, social impact", "Routine supports your brilliance.", "People may see you as aloof.", "You need space and mental resonance.", "Detached pacing and unpredictability", "Independent, tolerant, emotionally evolved", "Friendship must be stronger than control.", "Nervous stress, erratic sleep", "4, 11, 22", "Electric blue, silver", "Saturday"),
  Pisces: makeProfile([2, 19, 3, 20], "Revati style sensitivity", "Gentle, imaginative, and intuitive.", "You absorb the emotional world around you.", "People see softness and mystery.", "You become strong when your heart decides.", "Creative work, healing, spiritual service", "Escapism and fantasy spending", "Art, healing, counseling, design", "Sensitivity needs structure.", "People may underestimate you.", "You love with devotion and idealism.", "Escaping reality and emotional confusion", "Reliable, calm, spiritually aware", "Marriage can ground your whole life.", "Emotional exhaustion, sleep issues", "7, 16, 25", "Sea green, lavender", "Thursday")
};

function makeProfile(range: [number, number, number, number], nakshatra: string, outer: string, inner: string, others: string, hidden: string, money: string, warning: string, careers: string, insight: string, respect: string, love: string, loveWeakness: string, partner: string, marriage: string, health: string, luckyNumbers: string, luckyColors: string, luckyDay: string): Profile {
  return { range, nakshatra, outer, inner, others, hidden, money, warning, careers, insight, respect, love, loveWeakness, partner, marriage, health, luckyNumbers, luckyColors, luckyDay };
}

export const zodiacOptions = Object.keys(profiles) as ZodiacName[];

export function detectZodiacFromDob(dateOfBirth: string): ZodiacName | null {
  const date = new Date(dateOfBirth);
  if (Number.isNaN(date.getTime())) return null;
  const month = date.getMonth() + 1;
  const day = date.getDate();
  const found = (Object.entries(profiles) as [ZodiacName, Profile][])
    .find(([, profile]) => inRange(month, day, profile.range));
  return found?.[0] ?? null;
}

function inRange(month: number, day: number, [sm, sd, em, ed]: [number, number, number, number]) {
  if (sm <= em) return (month === sm && day >= sd) || (month === em && day <= ed) || (month > sm && month < em);
  return (month === sm && day >= sd) || (month === em && day <= ed) || month > sm || month < em;
}

function rating(base: number, focus: boolean) {
  const score = Math.min(10, base + (focus ? 1 : 0));
  return `${score - 1} -> ${score}/10`;
}

function currentYearLine(area: FocusArea, input: PredictionInput) {
  const score = 6 + (input.mainFocus === area ? 2 : 0);
  const text: Record<FocusArea, string> = {
    Money: "Money improves when discipline becomes stronger than emotional reaction.",
    Career: "Career grows when you stop splitting your attention and commit fully.",
    Love: "Love becomes clearer when honesty replaces overthinking and fear.",
    Health: "Health responds quickly to routine; neglect will show quickly too."
  };
  return `${score}/10 - ${text[area]}`;
}

export function generatePredictionReport(input: PredictionInput): PredictionReport | null {
  const zodiacName = input.zodiacSign || (input.dateOfBirth ? detectZodiacFromDob(input.dateOfBirth) : null);
  if (!zodiacName) return null;
  const profile = profiles[zodiacName];
  const dob = input.dateOfBirth || "Not provided";
  const place = input.placeOfBirth?.trim() || "Not provided";
  const time = input.timeOfBirth?.trim() || "Not provided";

  return {
    header: `Here's your detailed personal prediction based on:\nDOB: ${dob}\nPlace of Birth: ${place}\nTime of Birth: ${time}\n\nYou are ${zodiacName} - a unique mix of emotion and intelligence.`,
    zodiacName,
    zodiacEmoji: "",
    nakshatraStyle: profile.nakshatra,
    corePersonality: {
      outer: profile.outer,
      inner: `${profile.inner} Your timing improves when your mind stays calm and consistent.`,
      othersSee: profile.others,
      hidden: `${profile.hidden} Your emotional nature becomes powerful when it is guided by clarity.`
    },
    money: {
      rating: rating(7, input.mainFocus === "Money"),
      earlyVsLater: "Early life brings uneven stability, while later life becomes stronger through maturity and discipline.",
      strengthAreas: profile.money,
      warning: profile.warning,
      advice: "Steady effort will decide how strongly this prediction becomes visible in your life. Build money through patience, not urgency."
    },
    career: {
      bestFields: profile.careers,
      timeline: "18-22: trial, identity shifts, and confusion.\n23-26: stronger pressure, sharper lessons, and skill-building.\n27+: more stable direction, bigger responsibility, and clearer reward.",
      growthPattern: "Your rise is not smooth. It deepens through correction, pressure, and self-mastery.",
      keyInsight: profile.insight
    },
    respect: {
      ratingImprovement: "Respect improves noticeably with age, especially when your speech becomes calmer and more precise.",
      misunderstanding: "People misunderstand you because they react to your surface behavior, not the pressure behind it.",
      mainIssue: profile.respect,
      solution: "Speak less in emotional heat and act more with visible steadiness. Respect follows consistency."
    },
    love: {
      emotionalNature: profile.love,
      weakness: profile.loveWeakness,
      loveTimeline: "Early love tends to teach intense lessons. Later love becomes slower, wiser, and more meaningful.",
      partnerType: profile.partner
    },
    marriage: {
      likelyAgeRange: "26-31 is the strongest range for stable marriage energy.",
      partnerPersonality: profile.partner,
      impact: profile.marriage
    },
    health: {
      rating: rating(7, input.mainFocus === "Health"),
      issues: profile.health,
      advice: "Protect sleep, reduce overstimulation, and keep one steady physical routine. Your mind needs structure more than motivation."
    },
    currentYear: {
      money: currentYearLine("Money", input),
      career: currentYearLine("Career", input),
      respect: "7/10 - Respect rises when your work becomes visible and your words become calmer.",
      love: currentYearLine("Love", input),
      warning: "Do not make life-changing emotional decisions while tired, angry, or desperate for quick results."
    },
    lucky: {
      numbers: profile.luckyNumbers,
      colors: profile.luckyColors,
      day: profile.luckyDay,
      habits: "Wake with intention, reduce emotional overreaction, write your thoughts clearly, and stay disciplined in one daily practice."
    },
    finalTruth: {
      strength: "Your greatest strength is the depth of your inner drive once you stop doubting your own path.",
      weakness: "Your greatest weakness is emotional distortion when pressure becomes stronger than clarity.",
      closing: "Your life does not become powerful through luck alone. It becomes powerful when your mind, effort, and timing begin to move together.",
      guidanceLine: "Focus on your actions, not the results."
    }
  };
}
