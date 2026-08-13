/** Bulk rows used only to show that sorting stays responsive at scale. */

export interface MemberRow {
  id: string;
  name: string;
  tier: "Unlimited" | "Off-peak" | "Pay as you go";
  visits: number;
  lifetimeSpend: number;
  joinedOn: string;
}

const TIERS: readonly MemberRow["tier"][] = [
  "Unlimited",
  "Off-peak",
  "Pay as you go",
];

const SYLLABLES = [
  "ka",
  "ro",
  "min",
  "sa",
  "del",
  "ven",
  "tor",
  "lia",
  "nor",
  "esh",
];

function syntheticName(index: number): string {
  const a = SYLLABLES[index % SYLLABLES.length];
  const b = SYLLABLES[(index * 7 + 3) % SYLLABLES.length];
  const c = SYLLABLES[(index * 13 + 5) % SYLLABLES.length];
  const first = `${a}${b}`;
  const last = `${c}${a}`;
  return `${first.charAt(0).toUpperCase()}${first.slice(1)} ${last
    .charAt(0)
    .toUpperCase()}${last.slice(1)}`;
}

let cache: MemberRow[] | null = null;

export function getMemberRows(count = 10_000): MemberRow[] {
  if (cache && cache.length === count) return cache;

  cache = Array.from({ length: count }, (_, index) => ({
    id: `mem-${index + 1}`,
    name: syntheticName(index),
    tier: TIERS[index % TIERS.length] as MemberRow["tier"],
    visits: (index * 37) % 320,
    lifetimeSpend: Math.round(((index * 91) % 4200) * 100) / 100,
    joinedOn: new Date(Date.UTC(2022, 0, 1 + ((index * 11) % 1400)))
      .toISOString()
      .slice(0, 10),
  }));

  return cache;
}
