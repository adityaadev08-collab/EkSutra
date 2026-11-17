// =============================================================================
// lib/data.ts — Single source of truth for all mock data in EkSutra
// =============================================================================
// WHY HERE: The lib/ folder holds non-route, non-component utility code.
// Every file that needs schemes or user data imports from THIS file, so
// when a real database replaces mock data, only this file changes.
// =============================================================================

// ---------------------------------------------------------------------------
// Type Definitions
// ---------------------------------------------------------------------------

/**
 * Scheme represents a single government program/benefit.
 *
 * - min_age:    the applicant must be at least this old to qualify
 * - max_income: the applicant's annual income must not exceed this value
 * - category:   a human-readable grouping label (health, housing, etc.)
 */
export interface Scheme {
  id: string;
  name: string;
  description: string;
  min_age: number;
  max_income: number;
  category: string;
}

/**
 * UserProfile represents the citizen's self-reported data.
 * The eligibility engine uses age and annual_income to filter schemes.
 */
export interface UserProfile {
  name: string;
  age: number;
  annual_income: number; // in INR per year
  state: string;
}

// ---------------------------------------------------------------------------
// Mock Schemes — five realistic Indian government programs
// ---------------------------------------------------------------------------

export const MOCK_SCHEMES: Scheme[] = [
  {
    id: "scheme_001",
    name: "Ayushman Bharat - PMJAY",
    description:
      "Free health coverage up to ₹5 lakh per family per year for secondary and tertiary hospitalisation.",
    min_age: 0,
    max_income: 300_000,
    category: "Health",
  },
  {
    id: "scheme_002",
    name: "PM Awas Yojana (Urban)",
    description:
      "Affordable housing with interest subsidy for economically weaker sections.",
    min_age: 21,
    max_income: 600_000,
    category: "Housing",
  },
  {
    id: "scheme_003",
    name: "PM Kisan Samman Nidhi",
    description:
      "₹6,000 per year in three instalments for small and marginal farmer families.",
    min_age: 18,
    max_income: 200_000,
    category: "Agriculture",
  },
  {
    id: "scheme_004",
    name: "National Pension Scheme (NPS)",
    description:
      "Voluntary retirement savings scheme with tax benefits under Section 80CCD.",
    min_age: 18,
    max_income: 1_500_000,
    category: "Pension",
  },
  {
    id: "scheme_005",
    name: "Atal Pension Yojana",
    description:
      "Guaranteed pension of ₹1,000–₹5,000/month after age 60 for unorganised sector workers.",
    min_age: 18,
    max_income: 500_000,
    category: "Pension",
  },
];

// ---------------------------------------------------------------------------
// Mock Users — two test profiles with different eligibility profiles
// ---------------------------------------------------------------------------
// "ravi"  → 25 years old, ₹180,000 income → qualifies for most schemes
// "meena" → 62 years old, ₹700,000 income → qualifies for only some schemes
// ---------------------------------------------------------------------------

export const MOCK_USERS: Record<string, UserProfile> = {
  ravi: {
    name: "Ravi Kumar",
    age: 25,
    annual_income: 180_000,
    state: "Uttar Pradesh",
  },
  meena: {
    name: "Meena Devi",
    age: 62,
    annual_income: 700_000,
    state: "Rajasthan",
  },
};

