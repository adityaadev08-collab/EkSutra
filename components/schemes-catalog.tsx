'use client'

// =============================================================================
// components/schemes-catalog.tsx — Interactive Full-Page Schemes Catalog
// =============================================================================
// WHY HERE: 
//   Provides zero-latency, client-side search, category filtering, and
//   paginated "Load More" fetching over live Supabase schemes.
// =============================================================================

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useMemo, useState } from 'react'
import {
  ArrowLeft,
  ArrowUpRight,
  Clock3,
  ExternalLink,
  Filter,
  Grid2X2,
  Loader2,
  Search,
  ShieldCheck,
  X,
  ChevronDown
} from 'lucide-react'
import type { LiveScheme } from '@/components/dashboard-client'

const accentClasses: Record<'saffron' | 'navy' | 'mint' | 'sky', string> = {
  saffron: 'bg-[#fff0d7] text-[#bc6a05]',
  navy: 'bg-[#dfe8f4] text-[#152d4d]',
  mint: 'bg-[#e1f1e9] text-[#287254]',
  sky: 'bg-[#e2eff5] text-[#28708a]',
}

const DEFAULT_ACCENTS: Array<'saffron' | 'navy' | 'mint' | 'sky'> = [
  'saffron',
  'navy',
  'mint',
  'sky',
]
const DEFAULT_ICONS = ['₹', '🏛️', '🌾', '🛡️', '✦', '⌂', '🩺', '📜']

export function SchemesCatalog({
  initialSchemes,
  totalSchemes = 5160,
}: {
  initialSchemes: LiveScheme[]
  totalSchemes?: number
}) {
  const router = useRouter()
  const [allSchemes, setAllSchemes] = useState<LiveScheme[]>(initialSchemes)
  const [currentPage, setCurrentPage] = useState<number>(1)
  const [totalCount, setTotalCount] = useState<number>(totalSchemes)
  const [isLoadingMore, setIsLoadingMore] = useState<boolean>(false)
  const [hasMore, setHasMore] = useState<boolean>(initialSchemes.length < totalSchemes)

  const [searchQuery, setSearchQuery] = useState('')
  const [selectedDept, setSelectedDept] = useState<string>('All')
  const [loadingId, setLoadingId] = useState<string | number | null>(null)

  // Extract unique departments/categories from current loaded payload
  const departments = useMemo(() => {
    const set = new Set<string>()
    allSchemes.forEach((s) => {
      const dept = s.department || s.category
      if (dept) set.add(dept)
    })
    return ['All', ...Array.from(set).slice(0, 8)]
  }, [allSchemes])

  // Filter schemes based on search query and department selection
  const filteredSchemes = useMemo(() => {
    return allSchemes.filter((scheme) => {
      const title = (scheme.title || scheme.name || '').toLowerCase()
      const dept = (scheme.department || scheme.category || '').toLowerCase()
      const desc = (scheme.description || '').toLowerCase()
      const query = searchQuery.toLowerCase().trim()

      const matchesSearch =
        !query ||
        title.includes(query) ||
        dept.includes(query) ||
        desc.includes(query)

      const matchesDept =
        selectedDept === 'All' ||
        (scheme.department || scheme.category) === selectedDept

      return matchesSearch && matchesDept
    })
  }, [allSchemes, searchQuery, selectedDept])

  const handleLoadMore = async () => {
    if (isLoadingMore || !hasMore) return
    setIsLoadingMore(true)

    try {
      const nextPage = currentPage + 1
      const res = await fetch(`/api/schemes?page=${nextPage}&limit=24`)
      const json = await res.json()

      if (json.success && Array.isArray(json.data)) {
        setAllSchemes((prev) => {
          const existingIds = new Set(prev.map((s) => s.id))
          const fresh = json.data.filter((s: LiveScheme) => !existingIds.has(s.id))
          return [...prev, ...fresh]
        })
        setCurrentPage(nextPage)
        setTotalCount(json.total ?? totalCount)
        setHasMore(json.hasMore)
      } else {
        setHasMore(false)
      }
    } catch (err) {
      console.error('Failed to load more schemes on /schemes:', err)
    } finally {
      setIsLoadingMore(false)
    }
  }

  const handleApply = (scheme: LiveScheme) => {
    setLoadingId(scheme.id)
    window.setTimeout(() => {
      if (scheme.apply_url && scheme.apply_url.startsWith('http')) {
        window.open(scheme.apply_url, '_blank', 'noopener,noreferrer')
        setLoadingId(null)
      } else {
        router.push(`/apply/${scheme.id}`)
      }
    }, 500)
  }

  return (
    <main className="min-h-screen bg-[#f7f8f5] text-[#152d4d]">
      {/* Ambient background glows */}
      <div className="pointer-events-none fixed -left-32 -top-40 size-[480px] rounded-full bg-[#f9d9a2]/20 blur-3xl" />
      <div className="pointer-events-none fixed -bottom-48 -right-32 size-[520px] rounded-full bg-[#b9d5df]/20 blur-3xl" />

      {/* Header bar */}
      <header className="sticky top-0 z-30 border-b border-[#152d4d]/8 bg-[#f7f8f5]/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-[1280px] items-center justify-between px-5 py-4 sm:px-8 lg:px-10">
          <div className="flex items-center gap-4">
            <Link
              href="/"
              className="flex items-center gap-2 rounded-full border border-[#152d4d]/10 bg-white/70 px-4 py-2 text-xs font-semibold text-[#152d4d] shadow-sm transition hover:bg-white"
            >
              <ArrowLeft className="size-3.5" />
              Back to Dashboard
            </Link>
            <div className="hidden h-5 w-px bg-[#152d4d]/10 sm:block" />
            <div className="hidden items-center gap-2 sm:flex">
              <span className="flex size-7 items-center justify-center rounded-lg bg-[#152d4d] font-serif text-xs text-white">
                एक
              </span>
              <span className="font-serif text-sm font-semibold tracking-tight">
                EkSutra Catalog
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <span className="rounded-full bg-white/80 px-3 py-1 text-xs font-semibold text-[#718095] shadow-sm">
              Loaded {allSchemes.length} of {totalCount.toLocaleString('en-IN')} Schemes
            </span>
          </div>
        </div>
      </header>

      {/* Page Title & Search Controls */}
      <section className="relative z-10 mx-auto max-w-[1280px] px-5 pt-8 sm:px-8 lg:px-10">
        <div className="max-w-2xl">
          <p className="mb-2 text-xs font-bold uppercase tracking-[0.2em] text-[#c27717]">
            Central & State Welfare
          </p>
          <h1 className="font-serif text-3xl font-medium tracking-[-0.03em] text-[#152d4d] sm:text-5xl">
            Explore Government Schemes
          </h1>
          <p className="mt-3 text-sm leading-6 text-[#718095]">
            Browse, filter, and apply for verified government programs across agriculture,
            education, health, housing, and social security.
          </p>
        </div>

        {/* Search input */}
        <div className="mt-8 flex flex-col gap-4 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 size-4 -translate-y-1/2 text-[#718095]" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by scheme name, keyword, or ministry..."
              className="h-12 w-full rounded-2xl border border-[#152d4d]/10 bg-white/80 pl-11 pr-10 text-sm text-[#152d4d] shadow-sm backdrop-blur-sm outline-none transition placeholder:text-[#8090a0] focus:border-[#c27717] focus:ring-4 focus:ring-[#c27717]/10"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-1 text-[#8090a0] hover:text-[#152d4d]"
              >
                <X className="size-4" />
              </button>
            )}
          </div>
        </div>

        {/* Department Pills */}
        <div className="mt-4 flex flex-wrap gap-2 pb-4">
          {departments.map((dept) => {
            const isSelected = selectedDept === dept
            return (
              <button
                key={dept}
                onClick={() => setSelectedDept(dept)}
                className={`rounded-full px-4 py-1.5 text-xs font-semibold transition ${
                  isSelected
                    ? 'bg-[#152d4d] text-white shadow-md'
                    : 'border border-[#152d4d]/10 bg-white/60 text-[#718095] hover:bg-white hover:text-[#152d4d]'
                }`}
              >
                {dept}
              </button>
            )
          })}
        </div>
      </section>

      {/* Schemes Grid */}
      <section className="relative z-10 mx-auto max-w-[1280px] px-5 py-8 sm:px-8 lg:px-10">
        {filteredSchemes.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-[#152d4d]/20 bg-white/50 p-16 text-center">
            <p className="font-serif text-xl font-medium text-[#152d4d]">
              No matching schemes found
            </p>
            <p className="mt-2 text-sm text-[#718095]">
              Try adjusting your search terms or clearing the selected department filter.
            </p>
            <button
              onClick={() => {
                setSearchQuery('')
                setSelectedDept('All')
              }}
              className="mt-6 rounded-full bg-[#152d4d] px-5 py-2.5 text-xs font-semibold text-white shadow"
            >
              Reset Filters
            </button>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {filteredSchemes.map((scheme, idx) => {
                const schemeTitle = scheme.title || scheme.name || 'Government Scheme'
                const schemeDept = scheme.department || scheme.category || 'Central Government'
                const schemeDesc = scheme.description || 'Public citizen benefit program.'
                const accent = scheme.accent || DEFAULT_ACCENTS[idx % DEFAULT_ACCENTS.length]
                const icon = scheme.icon || DEFAULT_ICONS[idx % DEFAULT_ICONS.length]

                return (
                  <article
                    key={scheme.id}
                    className="group flex min-h-[250px] flex-col justify-between rounded-[26px] border border-white/80 bg-white/70 p-5 shadow-[0_12px_40px_rgba(21,45,77,0.06)] backdrop-blur-xl transition duration-300 hover:-translate-y-1 hover:bg-white/95 hover:shadow-[0_20px_50px_rgba(21,45,77,0.1)]"
                  >
                    <div>
                      <div className="flex items-start justify-between gap-3">
                        <span
                          className={`flex size-11 items-center justify-center rounded-2xl text-lg font-semibold ${accentClasses[accent]}`}
                        >
                          {icon}
                        </span>
                        <span className="rounded-full bg-[#f5f6f4] px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-[#708092] line-clamp-1 max-w-[160px]">
                          {schemeDept}
                        </span>
                      </div>

                      <div className="mt-4">
                        <h2 className="font-serif text-lg font-medium tracking-tight text-[#152d4d] line-clamp-2">
                          {schemeTitle}
                        </h2>
                        <p className="mt-2 text-xs leading-5 text-[#718095] line-clamp-4">
                          {schemeDesc}
                        </p>
                      </div>
                    </div>

                    <div className="mt-5 border-t border-[#152d4d]/8 pt-3">
                      <div className="mb-3 flex items-center justify-between text-[11px] text-[#8090a0]">
                        {scheme.min_age !== undefined && (
                          <span>Min Age: {scheme.min_age} yrs</span>
                        )}
                        {scheme.max_income !== undefined && (
                          <span>Max Inc: ₹{scheme.max_income.toLocaleString('en-IN')}</span>
                        )}
                      </div>

                      <button
                        onClick={() => handleApply(scheme)}
                        className="flex w-full items-center justify-center gap-1.5 rounded-full bg-[#152d4d] py-2.5 text-xs font-semibold text-white shadow transition group-hover:bg-[#c27717]"
                      >
                        Apply Now <ArrowUpRight className="size-3.5" />
                      </button>
                    </div>
                  </article>
                )
              })}
            </div>

            {hasMore && (
              <div className="mt-12 flex flex-col items-center justify-center gap-3">
                <button
                  onClick={handleLoadMore}
                  disabled={isLoadingMore}
                  className="group flex items-center gap-2 rounded-full bg-[#152d4d] px-8 py-3.5 text-xs font-bold text-white shadow-[0_10px_25px_rgba(21,45,77,0.18)] transition hover:-translate-y-0.5 hover:bg-[#23466f] hover:shadow-[0_15px_30px_rgba(21,45,77,0.25)] disabled:cursor-wait disabled:opacity-70"
                >
                  {isLoadingMore ? (
                    <>
                      <Loader2 className="size-4 animate-spin text-[#e8a243]" />
                      <span>Loading next batch...</span>
                    </>
                  ) : (
                    <>
                      <span>Load More Schemes</span>
                      <ChevronDown className="size-4 transition-transform group-hover:translate-y-0.5" />
                    </>
                  )}
                </button>
                <p className="text-xs text-[#718095]">
                  Loaded {allSchemes.length} of {totalCount.toLocaleString('en-IN')} total schemes
                </p>
              </div>
            )}
          </>
        )}
      </section>

      {/* Loading indicator */}
      {loadingId && (
        <div
          role="status"
          className="fixed inset-0 z-50 flex items-center justify-center bg-[#152d4d]/15 backdrop-blur-sm"
        >
          <div className="flex items-center gap-3 rounded-full bg-white px-6 py-4 text-sm font-semibold text-[#152d4d] shadow-xl">
            <Loader2 className="size-4 animate-spin text-[#c27717]" /> Opening application portal…
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="mx-auto flex max-w-[1280px] items-center justify-between border-t border-[#152d4d]/8 px-5 py-8 text-xs text-[#8090a0] sm:px-8 lg:px-10">
        <span>© 2026 EkSutra Citizen Portal</span>
        <Link href="/" className="hover:underline">
          Return to Dashboard
        </Link>
      </footer>
    </main>
  )
}
