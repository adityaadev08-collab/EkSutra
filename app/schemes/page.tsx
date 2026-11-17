// =============================================================================
// app/schemes/page.tsx — High-Performance Full-Page Schemes Catalog Route
// =============================================================================
// WHY HERE: 
//   In Next.js App Router, app/schemes/page.tsx maps to /schemes.
//   Queries an initial batch of 24 schemes + exact total count from Supabase
//   to avoid massive network payloads and keep catalog navigation snappy.
// =============================================================================

import { connection } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { SchemesCatalog } from '@/components/schemes-catalog'
import type { LiveScheme } from '@/components/dashboard-client'

// Required in Next.js 16: Dynamic request-time rendering
export const instant = false

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
const supabase = createClient(supabaseUrl, supabaseKey)

const CATALOG_INITIAL_LIMIT = 24

export default async function SchemesPage() {
  await connection()

  let schemes: LiveScheme[] = []
  let totalCount = 0

  try {
    const { data, count, error } = await supabase
      .from('services')
      .select('*', { count: 'exact' })
      .range(0, CATALOG_INITIAL_LIMIT - 1)
      .order('id', { ascending: true })

    if (error) {
      console.error('Supabase query error on /schemes:', error.message)
    } else if (data) {
      schemes = data as LiveScheme[]
      totalCount = count ?? data.length
    }
  } catch (err) {
    console.error('Failed to fetch schemes on /schemes route:', err)
  }

  return (
    <SchemesCatalog
      initialSchemes={schemes}
      totalSchemes={totalCount}
    />
  )
}
