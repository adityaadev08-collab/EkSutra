// =============================================================================
// lib/engine.ts — Universal Eligibility Engine for EkSutra
// =============================================================================
// WHY HERE: Pure, testable business logic isolated from HTTP/React.
// PURPOSE:
//   Evaluates citizen eligibility against welfare scheme constraints.
//   Supports both static mock datasets and live Supabase services records.
// =============================================================================

import { Scheme, UserProfile, MOCK_SCHEMES } from "./data";

/**
 * Minimal constraint contract required to evaluate a scheme's eligibility.
 */
export interface SchemeConstraints {
  min_age?: number | null;
  max_income?: number | null;
}

/**
 * Checks if a specific citizen meets a scheme's age and income criteria.
 *
 * @param user   Citizen profile containing age and annual_income
 * @param scheme Scheme containing optional min_age and max_income
 * @returns      Boolean indicating whether the citizen qualifies
 */
export function isUserEligible(
  user: { age: number; annual_income: number },
  scheme: SchemeConstraints
): boolean {
  const minAge = scheme.min_age ?? 0;
  const maxIncome = scheme.max_income ?? Infinity;

  const meetsAge = user.age >= minAge;
  const meetsIncome = user.annual_income <= maxIncome;

  return meetsAge && meetsIncome;
}

/**
 * Filters any array of schemes (mock data or live Supabase rows)
 * based on the citizen's age and annual income.
 *
 * @param user    The citizen's profile
 * @param schemes Array of schemes to filter
 * @returns       Filtered array containing only qualifying schemes
 */
export function filterEligibleSchemes<T extends SchemeConstraints>(
  user: { age: number; annual_income: number },
  schemes: T[]
): T[] {
  return schemes.filter((scheme) => isUserEligible(user, scheme));
}

/**
 * Backward-compatible function for original mock data engine callers.
 */
export function getEligibleSchemes(
  user: UserProfile,
  schemes: Scheme[] = MOCK_SCHEMES
): Scheme[] {
  return filterEligibleSchemes(user, schemes);
}
