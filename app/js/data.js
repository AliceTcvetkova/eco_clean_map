/** Fallback when Supabase is unavailable or SQL not applied yet. */
export const FALLBACK_ROWS = [
  {
    id: "fallback-gorky",
    title: "Riverside plastic waste",
    location_name: "Gorky Park, Moscow",
    lat: 55.731,
    lng: 37.601,
    severity: "medium",
    reward_points: 240,
    category: "Plastic",
    created_at: new Date(Date.now() - 18 * 60000).toISOString(),
    status: "open"
  },
  {
    id: "fallback-patriarch",
    title: "Park bench litter",
    location_name: "Patriarch Ponds, Moscow",
    lat: 55.7642,
    lng: 37.5917,
    severity: "high",
    reward_points: 320,
    category: "Mixed",
    created_at: new Date(Date.now() - 42 * 60000).toISOString(),
    status: "open"
  },
  {
    id: "fallback-sparrow",
    title: "Glass near the path",
    location_name: "Sparrow Hills, Moscow",
    lat: 55.7103,
    lng: 37.5593,
    severity: "low",
    reward_points: 180,
    category: "Glass",
    created_at: new Date(Date.now() - 120 * 60000).toISOString(),
    status: "open"
  }
];

export const PROFILE = {
  name: "Alice",
  level: "Level 4 - Local Cleaner",
  cleanups: 12,
  area: "3.8km",
  points: 2840,
  badges: ["Riverside", "Park Hero", "First Report", "Team Sprint"]
};

export const CAMPAIGN = {
  title: "Clean Northern Park",
  description: "Fund 14 open cleanup tasks around the riverside path and playground.",
  funded: 420,
  goal: 650
};

export const REPORT_CATEGORIES = ["Plastic", "Glass", "Mixed"];
