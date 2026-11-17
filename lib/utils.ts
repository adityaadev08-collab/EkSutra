// =============================================================================
// lib/utils.ts — Styling & Tailwind Merge Utility for EkSutra
// =============================================================================
// WHY HERE: Standard location for application-wide helper functions.
// This utility is used by Shadcn and Tailwind components to safely merge
// conditional class names and resolve conflicting Tailwind utilities.
// =============================================================================

import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

/**
 * Combines conditional class names and resolves Tailwind CSS conflicts.
 * Example: cn('px-4 py-2', isActive && 'bg-blue-600', className)
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

