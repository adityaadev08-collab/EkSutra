// =============================================================================
// app/page.tsx — High-Performance EkSutra Citizen Portal & Dashboard
// =============================================================================
// WHY HERE: 
//   Root page route for EkSutra. Performs lightweight server-side pre-fetching
//   of the initial batch of 20 schemes plus exact total count from Supabase.
// =============================================================================

import { cookies } from 'next/headers'
import { connection } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { AuthProvider } from '@/context/auth-context'
import { DashboardClient, type LiveScheme } from '@/components/dashboard-client'

// Required in Next.js 16: Render dynamically on request
export const instant = false

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
const supabase = createClient(supabaseUrl, supabaseKey)

// 20 schemes loaded initially on first visit
const INITIAL_BATCH_SIZE = 20

export default async function Home() {
  await connection()

  // 1. Resolve active user session from HTTP-only cookie if present
  let sessionUsername: string | null = null
  try {
    const cookieStore = await cookies()
    sessionUsername = cookieStore.get('eksutra_session')?.value || null
  } catch (err) {
    console.warn('Cookie reading fallback:', err)
  }

  // 2. Fetch initial 20 schemes + exact total count from Supabase
  let initialSchemes: LiveScheme[] = []
  let totalSchemes = 0

  try {
    const { data, count, error } = await supabase
      .from('services')
      .select('*', { count: 'exact' })
      .range(0, INITIAL_BATCH_SIZE - 1)
      .order('id', { ascending: true })

    if (error) {
      console.error('Supabase query error on services:', error.message)
    } else if (data) {
      initialSchemes = data as LiveScheme[]
      totalSchemes = count ?? data.length
    }
  } catch (err) {
    console.error('Failed to connect to Supabase:', err)
  }

  // 3. Render the application wrapped in AuthProvider
  return (
    <AuthProvider initialUsername={sessionUsername}>
      <DashboardClient
        services={initialSchemes}
        totalSchemes={totalSchemes}
      />
    </AuthProvider>
  )
}
