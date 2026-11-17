// =============================================================================
// lib/supabase.ts — Centralized Supabase Client Singleton
// =============================================================================
// WHY HERE: 
//   Provides a shared Supabase client for browser authentication and queries.
//   Ensures that OAuth redirect tokens, session persistence, and auto-refresh
//   listeners operate on a single coordinated instance across the app.
// =============================================================================

import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('⚠️ Supabase environment variables are missing in .env.local')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
})

