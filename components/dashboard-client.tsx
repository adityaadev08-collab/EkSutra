'use client'

// =============================================================================
// components/dashboard-client.tsx — Unified Citizen Dashboard & Engine Controller
// =============================================================================
// WHY HERE: 
//   Manages interactive state, client-side scheme filtering with lib/engine.ts,
//   displays Google account avatars, and supports customized pagination:
//     - 20 schemes loaded initially for both Eligible and Total tabs
//     - For Eligible: clicking Load More loads ALL the rest of the eligible schemes
//     - For Total: clicking Load More loads 100 schemes per batch
// =============================================================================

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useMemo, useState, useEffect, useRef } from 'react'
import {
  ArrowUpRight,
  Bell,
  CheckCircle2,
  ChevronRight,
  Clock3,
  FileText,
  Grid2X2,
  Loader2,
  Menu,
  Search,
  ShieldCheck,
  Sparkles,
  X,
  LogOut,
  UserCheck,
  Check,
  AlertTriangle,
  User as UserIcon,
  ChevronDown,
  ChevronLeft
} from 'lucide-react'
import { useAuth } from '@/context/auth-context'
import { LoginModal } from '@/components/login-modal'
import { OnboardingModal } from '@/components/onboarding-modal'
import { isUserEligible, filterEligibleSchemes } from '@/lib/engine'

// Scheme schema matching live Supabase records from the 'services' table
export type LiveScheme = {
  id: string | number
  title?: string
  name?: string
  department?: string
  description?: string
  min_age?: number
  max_age?: number
  max_income?: number
  target_occupation?: string
  apply_url?: string
  category?: string
  eta?: string
  accent?: 'saffron' | 'navy' | 'mint' | 'sky'
  icon?: string
}

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

const INITIAL_BATCH_SIZE = 20
const TOTAL_LOAD_MORE_SIZE = 100

function SchemeCard({
  service,
  index,
  isEligible,
  userActive,
  onApply,
}: {
  service: LiveScheme
  index: number
  isEligible: boolean
  userActive: boolean
  onApply: (service: LiveScheme) => void
}) {
  const schemeTitle = service.title || service.name || 'Government Scheme'
  const schemeDept = service.department || service.category || 'Central Scheme'
  const schemeDesc = service.description || 'Public citizen benefit service.'
  const accent = service.accent || DEFAULT_ACCENTS[index % DEFAULT_ACCENTS.length]
  const icon = service.icon || DEFAULT_ICONS[index % DEFAULT_ICONS.length]

  // Hover Preview Logic
  const [showPreview, setShowPreview] = useState(false)
  const hoverTimeout = useRef<NodeJS.Timeout | null>(null)

  const handleMouseEnter = () => {
    // Start a 3-second timer when the mouse enters the card
    hoverTimeout.current = setTimeout(() => {
      setShowPreview(true)
    }, 1500)
  }

  const handleMouseLeave = () => {
    // Clear timer and hide preview instantly if the mouse leaves
    if (hoverTimeout.current) clearTimeout(hoverTimeout.current)
    setShowPreview(false)
  }

  return (
    <article 
      className="relative group flex min-h-[230px] flex-col justify-between rounded-[28px] border border-white/80 bg-white/65 p-4 shadow-[0_12px_40px_rgba(21,45,77,0.06)] md:p-6 backdrop-blur-xl transition duration-300 hover:-translate-y-1 hover:bg-white/90 hover:shadow-[0_20px_50px_rgba(21,45,77,0.1)] overflow-hidden"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <div>
        <div className="flex items-start justify-between gap-3">
          <span
            className={`flex size-11 items-center justify-center rounded-2xl text-lg font-semibold ${accentClasses[accent]}`}
          >
            {icon}
          </span>
          <div className="flex flex-col items-end gap-1">
            <span className="rounded-full bg-[#f5f6f4] px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-[#708092] truncate max-w-[140px] inline-block text-center">
              {schemeDept}
            </span>
            {userActive && (
              isEligible ? (
                <span className="flex items-center gap-1 rounded-full bg-[#e1f1e9] px-2.5 py-0.5 text-[10px] font-bold text-[#287254]">
                  <Check className="size-3" /> Eligible
                </span>
              ) : (
                <span className="flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-0.5 text-[10px] font-bold text-amber-700">
                  <AlertTriangle className="size-3" /> Exceeds Criteria
                </span>
              )
            )}
          </div>
        </div>

        <div className="mt-3 md:mt-4">
          <h3 className="font-serif text-lg font-medium tracking-[-0.02em] text-[#152d4d] line-clamp-2">
            {schemeTitle}
          </h3>
          <p className="mt-2 text-xs leading-5 text-[#718095] line-clamp-3">
            {schemeDesc}
          </p>
        </div>
      </div>

      <div className="mt-4 border-t border-[#152d4d]/8 pt-3">
        <div className="mb-2 flex items-center justify-between text-[11px] text-[#8090a0]">
          {service.min_age != null && (
            <span>Min Age: {service.min_age} yrs</span>
          )}
          {service.max_income != null && (
            <span>Max Inc: ₹{service.max_income.toLocaleString('en-IN')}</span>
          )}
          {service.eta && (
            <span className="flex items-center gap-1">
              <Clock3 className="size-3" /> {service.eta}
            </span>
          )}
        </div>

        <div className="flex items-center justify-between">
          <span className="text-[10px] uppercase tracking-wider text-[#a0afbe]">
            Verified Scheme
          </span>
          <button
            onClick={() => onApply(service)}
            className="flex items-center gap-1 text-xs font-semibold text-[#152d4d] transition group-hover:text-[#c27717]"
          >
            Apply <ArrowUpRight className="size-3.5" />
          </button>
        </div>
      </div>

      {/* 3-Second Hover Detail Overlay */}
      {showPreview && (
        <div className="absolute inset-0 z-20 flex flex-col justify-center bg-[#152d4d]/95 p-6 text-white shadow-2xl backdrop-blur-md transition-opacity duration-300 animate-in fade-in">
          <h4 className="mb-2 font-serif text-lg font-bold text-[#e8a243] line-clamp-3 leading-tight">
            {schemeTitle}
          </h4>
          <p className="mb-4 text-[13px] leading-relaxed text-white/80 line-clamp-4">
            {schemeDesc}
          </p>
          <div className="mt-auto flex items-center justify-between border-t border-white/20 pt-4">
            <span className="text-[10px] font-semibold uppercase tracking-widest text-white/50 truncate max-w-[120px]">
              {schemeDept}
            </span>
            <button
              onClick={() => onApply(service)}
              className="flex items-center gap-1 text-xs font-bold text-[#e8a243] hover:text-[#f3b965] transition"
            >
              Apply Now <ArrowUpRight className="size-3.5" />
            </button>
          </div>
        </div>
      )}
    </article>
  )
}

export function DashboardClient({
  services,
  totalSchemes = 5160,
}: {
  services: LiveScheme[]
  totalSchemes?: number
}) {
  const router = useRouter()
  const { user, openLoginModal, openOnboardingModal, signOut } = useAuth()

  // Mode: 'eligible' vs 'all' (Total schemes)
  const [filterMode, setFilterMode] = useState<'eligible' | 'all'>('eligible')

  // Total schemes dataset (begins with 20 items from server)
  const [totalSchemesList, setTotalSchemesList] = useState<LiveScheme[]>(services)
  const [totalDbCount, setTotalDbCount] = useState<number>(totalSchemes)
  const [hasMoreTotal, setHasMoreTotal] = useState<boolean>(services.length < totalSchemes)

  // Eligible schemes dataset (begins with 20 items)
  const [eligibleSchemesList, setEligibleSchemesList] = useState<LiveScheme[]>([])
  const [totalEligibleDbCount, setTotalEligibleDbCount] = useState<number>(0)
  const [hasMoreEligible, setHasMoreEligible] = useState<boolean>(true)
  const [isLoadingEligibleInitial, setIsLoadingEligibleInitial] = useState<boolean>(false)

  // Loading indicator for "Load More" button
  const [isLoadingMore, setIsLoadingMore] = useState<boolean>(false)

  // 1. Animated Income Certificate Widget states
  const [incomeProgress, setIncomeProgress] = useState<number>(68)
  const [incomeVerified, setIncomeVerified] = useState<boolean>(false)

  // Trigger verification animation after 3000ms
  useEffect(() => {
    const timer = setTimeout(() => {
      setIncomeProgress(100)
      setIncomeVerified(true)
    }, 3000)
    return () => clearTimeout(timer)
  }, [])

  // 2. Pagination state (render max 20 items in DOM at a time)
  const [currentPage, setCurrentPage] = useState<number>(1)
  const itemsPerPage = 20

  // Reset pagination to page 1 whenever filter mode changes
  useEffect(() => {
    setCurrentPage(1)
  }, [filterMode])

  const [loadingId, setLoadingId] = useState<string | number | null>(null)
  const [notice, setNotice] = useState<string | null>(null)
  const [menuOpen, setMenuOpen] = useState(false)

  const isProfileComplete = user && user.age > 0

  // 1. Fetch initial 20 eligible schemes as soon as user profile is resolved/changes
  useEffect(() => {
    if (!isProfileComplete || !user) {
      setEligibleSchemesList([])
      setTotalEligibleDbCount(0)
      return
    }

    const currentAge = user.age
    const currentIncome = user.annual_income

    let isMounted = true
    async function loadInitialEligible() {
      setIsLoadingEligibleInitial(true)
      try {
        const res = await fetch(
          `/api/schemes?eligible_only=true&age=${currentAge}&income=${currentIncome}&offset=0&limit=${INITIAL_BATCH_SIZE}`
        )
        const json = await res.json()
        if (isMounted && json.success && Array.isArray(json.data)) {
          setEligibleSchemesList(json.data)
          setTotalEligibleDbCount(json.total ?? json.data.length)
          setHasMoreEligible(json.hasMore)
        }
      } catch (err) {
        console.error('Failed to load initial eligible schemes:', err)
      } finally {
        if (isMounted) setIsLoadingEligibleInitial(false)
      }
    }

    loadInitialEligible()

    return () => {
      isMounted = false
    }
  }, [user?.age, user?.annual_income, isProfileComplete])

  // Displayed schemes based on filterMode
  const displayedSchemes = useMemo(() => {
    if (!isProfileComplete) return totalSchemesList
    if (filterMode === 'eligible') {
      return eligibleSchemesList
    }
    return totalSchemesList
  }, [filterMode, isProfileComplete, eligibleSchemesList, totalSchemesList])

  // "Load More" handler tailored to the user's specific request:
  // - If on 'eligible' mode: loads ALL the rest of the eligible schemes at once
  // - If on 'all' (total) mode: loads 100 schemes per click
  const handleLoadMore = async () => {
    if (isLoadingMore) return
    setIsLoadingMore(true)

    try {
      if (filterMode === 'eligible' && user && isProfileComplete) {
        // Load ALL the rest of the eligible schemes in one request!
        const currentCount = eligibleSchemesList.length
        const remainingToFetch = Math.max(1, totalEligibleDbCount - currentCount)
        const fetchLimit = Math.min(2000, remainingToFetch + 10)

        const res = await fetch(
          `/api/schemes?eligible_only=true&age=${user.age}&income=${user.annual_income}&offset=${currentCount}&limit=${fetchLimit}`
        )
        const json = await res.json()

        if (json.success && Array.isArray(json.data)) {
          setEligibleSchemesList((prev) => {
            const existingIds = new Set(prev.map((s) => s.id))
            const fresh = json.data.filter((s: LiveScheme) => !existingIds.has(s.id))
            return [...prev, ...fresh]
          })
          setHasMoreEligible(false) // All remaining eligible schemes loaded
        }
      } else {
        // Total schemes mode: Load 100 schemes per click
        const currentOffset = totalSchemesList.length
        const res = await fetch(
          `/api/schemes?offset=${currentOffset}&limit=${TOTAL_LOAD_MORE_SIZE}`
        )
        const json = await res.json()

        if (json.success && Array.isArray(json.data)) {
          setTotalSchemesList((prev) => {
            const existingIds = new Set(prev.map((s) => s.id))
            const fresh = json.data.filter((s: LiveScheme) => !existingIds.has(s.id))
            return [...prev, ...fresh]
          })
          setTotalDbCount(json.total ?? totalDbCount)
          setHasMoreTotal(json.hasMore)
        } else {
          setHasMoreTotal(false)
        }
      }
    } catch (err) {
      console.error('Failed to load more schemes:', err)
      setNotice('Could not load more schemes. Please try again.')
    } finally {
      setIsLoadingMore(false)
    }
  }

  const handleApply = (service: LiveScheme) => {
    setLoadingId(service.id)
    setNotice(null)

    window.setTimeout(() => {
      if (service.apply_url && service.apply_url.startsWith('http')) {
        window.open(service.apply_url, '_blank', 'noopener,noreferrer')
        setLoadingId(null)
      } else {
        router.push(`/apply/${service.id}`)
      }
    }, 600)
  }

  const handleLogoutClick = async () => {
    await signOut()
    setNotice('Signed out successfully.')
  }

  const currentTabHasMore =
    filterMode === 'eligible' && isProfileComplete ? hasMoreEligible : hasMoreTotal

  const eligibleRemainingCount = Math.max(0, totalEligibleDbCount - eligibleSchemesList.length)

  // Slice displayed schemes so the grid ONLY ever renders 20 items at a time
  const paginatedSchemes = displayedSchemes.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  )

  const totalAvailableCount =
    filterMode === 'eligible'
      ? (totalEligibleDbCount || eligibleSchemesList.length)
      : (totalDbCount || totalSchemesList.length)

  const totalPages = Math.max(1, Math.ceil(totalAvailableCount / itemsPerPage))

  const handleNextPage = async () => {
    // If the next page is already loaded in memory
    if (currentPage * itemsPerPage < displayedSchemes.length) {
      setCurrentPage((prev) => prev + 1)
      document.getElementById('services')?.scrollIntoView({ behavior: 'smooth' })
      return
    }

    // Otherwise, fetch the next 20 items from the API if available
    const hasMore = filterMode === 'eligible' ? hasMoreEligible : hasMoreTotal
    if (!hasMore || isLoadingMore) return

    setIsLoadingMore(true)
    try {
      if (filterMode === 'eligible' && user && isProfileComplete) {
        const currentOffset = eligibleSchemesList.length
        const res = await fetch(
          `/api/schemes?eligible_only=true&age=${user.age}&income=${user.annual_income}&offset=${currentOffset}&limit=${itemsPerPage}`
        )
        const json = await res.json()
        if (json.success && Array.isArray(json.data) && json.data.length > 0) {
          setEligibleSchemesList((prev) => {
            const existingIds = new Set(prev.map((s) => s.id))
            const fresh = json.data.filter((s: LiveScheme) => !existingIds.has(s.id))
            return [...prev, ...fresh]
          })
          setHasMoreEligible(json.hasMore)
          setCurrentPage((prev) => prev + 1)
        } else {
          setHasMoreEligible(false)
        }
      } else {
        const currentOffset = totalSchemesList.length
        const res = await fetch(
          `/api/schemes?offset=${currentOffset}&limit=${itemsPerPage}`
        )
        const json = await res.json()
        if (json.success && Array.isArray(json.data) && json.data.length > 0) {
          setTotalSchemesList((prev) => {
            const existingIds = new Set(prev.map((s) => s.id))
            const fresh = json.data.filter((s: LiveScheme) => !existingIds.has(s.id))
            return [...prev, ...fresh]
          })
          setTotalDbCount(json.total ?? totalDbCount)
          setHasMoreTotal(json.hasMore)
          setCurrentPage((prev) => prev + 1)
        } else {
          setHasMoreTotal(false)
        }
      }
      document.getElementById('services')?.scrollIntoView({ behavior: 'smooth' })
    } catch (err) {
      console.error('Failed to load next page of schemes:', err)
      setNotice('Could not load next page. Please try again.')
    } finally {
      setIsLoadingMore(false)
    }
  }

  const handlePrevPage = () => {
    if (currentPage > 1) {
      setCurrentPage((prev) => prev - 1)
      document.getElementById('services')?.scrollIntoView({ behavior: 'smooth' })
    }
  }

  return (
    <main className="min-h-screen overflow-hidden bg-[#f7f8f5] text-[#152d4d]">
      {/* Ambient background glows */}
      <div className="pointer-events-none fixed -left-32 -top-40 size-[480px] rounded-full bg-[#f9d9a2]/20 blur-3xl" />
      <div className="pointer-events-none fixed -bottom-48 -right-32 size-[520px] rounded-full bg-[#b9d5df]/20 blur-3xl" />

      {/* Navigation bar */}
      <nav className="relative z-20 mx-auto flex max-w-[1240px] items-center justify-between px-5 pb-3 pt-5 sm:px-8 lg:px-10">
        <Link href="/" className="flex items-center gap-3" aria-label="EkSutra home">
          <span className="flex size-10 items-center justify-center rounded-2xl bg-[#152d4d] font-serif text-lg text-white shadow-lg shadow-[#152d4d]/15">
            एक
          </span>
          <span className="font-serif text-xl font-semibold tracking-[-0.03em]">
            EkSutra
          </span>
        </Link>

        <div className="hidden items-center gap-8 text-sm font-medium text-[#718095] md:flex">
          <Link href="/schemes" className="transition hover:text-[#152d4d]">
            Explore Schemes
          </Link>
          <a href="#services" className="transition hover:text-[#152d4d]">
            Eligibility Engine
          </a>
          <a href="#activity" className="transition hover:text-[#152d4d]">
            My activity
          </a>
        </div>

        {/* Authentication Controls in Header */}
        <div className="flex items-center gap-2">
          <Link
            href="/schemes"
            className="hidden size-10 items-center justify-center rounded-full border border-[#152d4d]/10 bg-white/55 text-[#718095] transition hover:text-[#152d4d] sm:flex"
            aria-label="Search schemes"
          >
            <Search className="size-4" />
          </Link>

          {/* Conditional Header: Shows Logout if user is active; Sign in trigger if logged out */}
          {user ? (
            <div className="flex items-center gap-2.5">
              <div className="hidden items-center gap-2 rounded-full border border-[#152d4d]/10 bg-white/70 py-1 pl-1 pr-3 text-xs font-semibold text-[#152d4d] md:flex shadow-sm">
                {user.avatar_url ? (
                  <img
                    src={user.avatar_url}
                    alt={user.name}
                    referrerPolicy="no-referrer"
                    className="size-6 rounded-full object-cover ring-1 ring-[#c27717]"
                  />
                ) : (
                  <UserCheck className="ml-1.5 size-3.5 text-[#2a8059]" />
                )}
                <span className="truncate max-w-[120px]">{user.name}</span>
              </div>
              <button
                onClick={handleLogoutClick}
                className="flex items-center gap-1.5 rounded-full bg-[#152d4d] px-4 py-2 text-xs font-semibold text-white shadow-md transition hover:bg-[#23466f]"
              >
                <LogOut className="size-3.5" />
                Logout
              </button>
            </div>
          ) : (
            <button
              onClick={openLoginModal}
              className="rounded-full bg-[#152d4d] px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-[#152d4d]/15 transition hover:bg-[#23466f]"
            >
              Continue with DigiLocker
            </button>
          )}

          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="flex size-10 items-center justify-center rounded-full border border-[#152d4d]/10 bg-white/55 md:hidden"
            aria-label="Toggle menu"
          >
            {menuOpen ? <X className="size-4" /> : <Menu className="size-4" />}
          </button>
        </div>
      </nav>

      {/* Mobile drawer */}
      {menuOpen && (
        <div className="relative z-10 mx-5 flex flex-col gap-4 rounded-3xl border border-white bg-white/80 p-5 text-sm shadow-xl backdrop-blur-xl md:hidden">
          <Link href="/schemes" onClick={() => setMenuOpen(false)}>
            Explore All Schemes
          </Link>
          <a href="#services" onClick={() => setMenuOpen(false)}>
            Eligibility Engine
          </a>
          <a href="#activity" onClick={() => setMenuOpen(false)}>
            My activity
          </a>
          {user ? (
            <button
              onClick={() => {
                setMenuOpen(false)
                handleLogoutClick()
              }}
              className="text-left font-semibold text-red-600"
            >
              Logout ({user.name})
            </button>
          ) : (
            <button
              onClick={() => {
                setMenuOpen(false)
                openLoginModal()
              }}
              className="text-left font-semibold text-[#152d4d]"
            >
              Continue with DigiLocker
            </button>
          )}
        </div>
      )}

      {/* Hero & Activity Section */}
      <section className="relative z-0 mx-auto max-w-[1240px] px-5 pb-12 pt-8 sm:px-8 lg:px-10 lg:pt-14">
        <div className="mb-8 flex flex-col justify-between gap-3 md:mb-10 md:gap-5 md:flex-row md:items-end">
          <div>
            <p className="mb-3 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.2em] text-[#c27717]">
              <span className="size-1.5 rounded-full bg-[#e59b32]" /> Citizen
              services, simplified
            </p>
            <h1 className="max-w-[690px] font-serif text-4xl leading-[0.98] tracking-[-0.05em] text-[#152d4d] sm:text-6xl">
              One thread for <em className="text-[#c27717]">every</em> public
              service.
            </h1>
            <p className="mt-5 max-w-[520px] text-base leading-7 text-[#718095]">
              {user ? (
                <>
                  Welcome back,{' '}
                  <strong className="font-semibold text-[#152d4d]">
                    {user.name}
                  </strong>
                  .
                </>
              ) : (
                <>
                  Welcome,{' '}
                  <strong className="font-semibold text-[#152d4d]">
                    Guest Citizen
                  </strong>
                  .
                </>
              )}{' '}
              {isProfileComplete
                ? `You qualify for ${totalEligibleDbCount.toLocaleString('en-IN')} government schemes based on your profile (${user.age} yrs, ₹${user.annual_income.toLocaleString('en-IN')}/yr).`
                : user
                ? 'Please complete your demographics to calculate your personal welfare eligibility.'
                : 'Sign in with DigiLocker to automatically evaluate your scheme entitlements.'}
            </p>
          </div>
          <div className="flex items-center gap-2 text-xs text-[#718095]">
            <span className="flex size-8 items-center justify-center rounded-full bg-[#e0f0e7] text-[#2a8059]">
              <ShieldCheck className="size-4" />
            </span>{' '}
            High Performance · Paginated Feed
          </div>
        </div>

        {/* Dynamic Activity Summary Cards */}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-12" id="activity">
          {/* Main Citizen Profile Card */}
          <div className="relative overflow-hidden rounded-[30px] bg-[#152d4d] p-5 text-white md:p-7 shadow-[0_18px_50px_rgba(21,45,77,0.18)] md:col-span-7 md:min-h-[260px]">
            <div className="absolute -right-12 -top-24 size-72 rounded-full border border-white/10" />
            <div className="absolute -right-2 -top-14 size-52 rounded-full border border-white/10" />
            <div className="relative flex h-full flex-col justify-between">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs uppercase tracking-[0.18em] text-white/50">
                    Active Citizen Profile
                  </p>
                  <h2 className="mt-3 font-serif text-3xl tracking-[-0.03em]">
                    {user ? user.name : 'Guest Citizen'}
                  </h2>
                  <p className="mt-1 text-sm text-white/60">
                    {isProfileComplete ? (
                      <>
                        {user.state} · {user.age} yrs · ₹{user.annual_income.toLocaleString('en-IN')}/yr
                      </>
                    ) : user ? (
                      <span className="text-amber-300">Profile incomplete — click to add age & income</span>
                    ) : (
                      'Sign in with DigiLocker to view scheme eligibility'
                    )}
                  </p>
                </div>

                {/* Profile Picture or Initials Avatar */}
                {user?.avatar_url ? (
                  <img
                    src={user.avatar_url}
                    alt={user.name}
                    referrerPolicy="no-referrer"
                    className="size-13 rounded-2xl object-cover ring-2 ring-[#e8a243] shadow-md"
                  />
                ) : (
                  <button
                    onClick={user ? openOnboardingModal : openLoginModal}
                    title={user ? 'Edit Profile' : 'Sign in with DigiLocker'}
                    className="flex size-12 items-center justify-center rounded-2xl bg-[#e8a243] font-serif text-lg text-[#152d4d] shadow-md transition hover:scale-105"
                  >
                    {user ? user.initials : 'GC'}
                  </button>
                )}
              </div>

              <div className="mt-6 flex flex-wrap items-center justify-between gap-4 border-t border-white/10 pt-4">
                <div className="grid grid-cols-3 gap-6">
                  <div>
                    <p className="text-2xl font-semibold">
                      {isProfileComplete ? totalEligibleDbCount.toLocaleString('en-IN') : 0}
                    </p>
                    <p className="text-[11px] text-white/50">Total Eligible</p>
                  </div>
                  <div>
                    <p className="text-2xl font-semibold">
                      {user?.completed_count ?? '02'}
                    </p>
                    <p className="text-[11px] text-white/50">Completed</p>
                  </div>
                  <div>
                    <p className="text-2xl font-semibold">
                      {user?.pending_count ?? '01'}
                    </p>
                    <p className="text-[11px] text-white/50">Action needed</p>
                  </div>
                </div>

                {user ? (
                  <div className="flex gap-2">
                    <button
                      onClick={openOnboardingModal}
                      className="rounded-full bg-[#e8a243] px-3.5 py-1.5 text-xs font-semibold text-[#152d4d] shadow transition hover:bg-[#d8902d]"
                    >
                      {isProfileComplete ? 'Edit Details' : 'Complete Profile'}
                    </button>
                    <button
                      onClick={handleLogoutClick}
                      className="rounded-full border border-white/20 bg-white/10 px-3.5 py-1.5 text-xs font-semibold text-white transition hover:bg-white/20"
                    >
                      Sign Out
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={openLoginModal}
                    className="rounded-full bg-[#e8a243] px-3.5 py-1.5 text-xs font-semibold text-[#152d4d] shadow transition hover:bg-[#d8902d]"
                  >
                    Continue with DigiLocker
                  </button>
                )}
              </div>
            </div>
          </div>

          <div className="hidden min-h-[260px] flex-col justify-between rounded-[30px] border border-white/80 bg-[#fff8ea]/75 p-5 md:flex md:p-7 shadow-[0_12px_40px_rgba(21,45,77,0.05)] backdrop-blur-xl md:col-span-5">
            <div className="flex items-start justify-between">
              <span className="flex size-11 items-center justify-center rounded-2xl bg-[#f8dfb6] text-[#b96b0d]">
                <FileText className="size-5" />
              </span>
              <span className="rounded-full bg-[#f4e1bf] px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-[#a56a1a]">
                {incomeVerified ? 'Verified' : 'In progress'}
              </span>
            </div>
            <div>
              <h2 className="mt-4 font-serif text-2xl tracking-[-0.03em] text-[#152d4d]">
                Income Certificate
              </h2>
              <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-[#ecd9b8]">
                <div
                  className={`h-full rounded-full transition-all duration-1000 ${
                    incomeVerified ? 'bg-[#287254]' : 'bg-[#d88b28]'
                  }`}
                  style={{ width: `${incomeProgress}%` }}
                />
              </div>
              <div className="mt-2 flex justify-between text-xs text-[#9a835e]">
                <span>
                  {incomeVerified
                    ? 'Verified via DigiLocker API'
                    : 'Verification in progress'}
                </span>
                <span>{incomeProgress}%</span>
              </div>
            </div>
            <button
              onClick={() =>
                setNotice(
                  incomeVerified
                    ? 'Income Certificate is verified via DigiLocker.'
                    : 'Your application timeline is up to date.'
                )
              }
              className="flex items-center gap-1 text-left text-sm font-semibold text-[#152d4d]"
            >
              View application <ChevronRight className="size-4" />
            </button>
          </div>

          <div className="flex items-center justify-between rounded-[26px] border border-white/80 bg-white/60 p-4 shadow-[0_12px_40px_rgba(21,45,77,0.04)] backdrop-blur-xl md:col-span-4 md:p-5">
            <div className="flex items-center gap-4">
              <span className="flex size-11 items-center justify-center rounded-2xl bg-[#e0f0e7] text-[#287254]">
                <CheckCircle2 className="size-5" />
              </span>
              <div>
                <p className="text-sm font-semibold">Eligibility Calculation</p>
                <p className="mt-1 text-xs text-[#8090a0]">
                  {isProfileComplete
                    ? `Found ${totalEligibleDbCount.toLocaleString('en-IN')} schemes out of ${totalDbCount.toLocaleString('en-IN')}`
                    : 'Set age and income to run engine'}
                </p>
              </div>
            </div>
            <ChevronRight className="size-4 text-[#9aacb8]" />
          </div>

          <div className="flex items-center justify-between rounded-[26px] border border-white/80 bg-white/60 p-4 shadow-[0_12px_40px_rgba(21,45,77,0.04)] backdrop-blur-xl md:col-span-8 md:p-5">
            <div className="flex items-center gap-4">
              <span className="flex size-11 items-center justify-center rounded-2xl bg-[#e2eff5] text-[#28708a]">
                <Sparkles className="size-5" />
              </span>
              <div>
                <p className="text-sm font-semibold">5,160+ Verified Schemes</p>
                <p className="mt-1 text-xs text-[#8090a0]">
                  Displaying {displayedSchemes.length} schemes in active view
                </p>
              </div>
            </div>
            <Link
              href="/schemes"
              className="rounded-full bg-[#152d4d] px-5 py-2 text-xs font-semibold text-white shadow transition hover:bg-[#23466f]"
            >
              Search All Schemes
            </Link>
          </div>
        </div>

        {/* Verified Government Schemes Grid & Eligibility Filter Controls */}
        <div className="mt-12 md:mt-16" id="services">
          <div className="mb-6 flex flex-col justify-between gap-4 md:flex-row md:items-end">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#c27717]">
                Live Eligibility Feed
              </p>
              <h2 className="mt-2 font-serif text-3xl tracking-[-0.04em]">
                Verified Government Schemes
              </h2>
            </div>

            {/* Eligibility Mode Switcher: 20 Loaded Initially for Both */}
            {isProfileComplete ? (
              <div className="flex items-center gap-2 rounded-2xl border border-[#152d4d]/10 bg-white/70 p-1 shadow-sm">
                <button
                  onClick={() => setFilterMode('eligible')}
                  className={`rounded-xl px-4 py-2 text-xs font-bold transition ${
                    filterMode === 'eligible'
                      ? 'bg-[#152d4d] text-white shadow-sm'
                      : 'text-[#718095] hover:text-[#152d4d]'
                  }`}
                >
                  Eligible for You ({eligibleSchemesList.length}{totalEligibleDbCount > eligibleSchemesList.length ? ` of ${totalEligibleDbCount}` : ''})
                </button>
                <button
                  onClick={() => setFilterMode('all')}
                  className={`rounded-xl px-4 py-2 text-xs font-bold transition ${
                    filterMode === 'all'
                      ? 'bg-[#152d4d] text-white shadow-sm'
                      : 'text-[#718095] hover:text-[#152d4d]'
                  }`}
                >
                  Total Schemes ({totalSchemesList.length} of {totalDbCount})
                </button>
              </div>
            ) : user ? (
              <button
                onClick={openOnboardingModal}
                className="flex items-center gap-1.5 text-xs font-semibold text-[#c27717] hover:underline"
              >
                Complete profile to filter by your eligibility <ArrowUpRight className="size-3.5" />
              </button>
            ) : (
              <button
                onClick={openLoginModal}
                className="flex items-center gap-1.5 text-xs font-semibold text-[#c27717] hover:underline"
              >
                Sign in via DigiLocker to filter by your eligibility <ArrowUpRight className="size-3.5" />
              </button>
            )}
          </div>

          {/* Scheme Cards Grid */}
          {isLoadingEligibleInitial && filterMode === 'eligible' ? (
            <div className="flex h-48 items-center justify-center">
              <Loader2 className="size-8 animate-spin text-[#c27717]" />
            </div>
          ) : displayedSchemes.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-[#152d4d]/20 bg-white/40 p-12 text-center text-sm text-[#718095]">
              No schemes currently meet the selected criteria.
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {paginatedSchemes.map((service, idx) => (
                <SchemeCard
                  key={service.id}
                  service={service}
                  index={(currentPage - 1) * itemsPerPage + idx}
                  isEligible={isProfileComplete ? isUserEligible(user, service) : true}
                  userActive={!!isProfileComplete}
                  onApply={handleApply}
                />
              ))}
            </div>
          )}

          {/* Previous Page and Next Page Pagination Buttons */}
          {displayedSchemes.length > 0 && (
            <div className="mt-10 flex flex-col items-center justify-center gap-3">
              <div className="flex flex-wrap items-center justify-center gap-4">
                <button
                  onClick={handlePrevPage}
                  disabled={currentPage === 1 || isLoadingMore}
                  className="group flex items-center gap-2 rounded-full bg-[#152d4d] px-8 py-3.5 text-xs font-bold text-white shadow-[0_10px_25px_rgba(21,45,77,0.18)] transition hover:-translate-y-0.5 hover:bg-[#23466f] hover:shadow-[0_15px_30px_rgba(21,45,77,0.25)] disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:translate-y-0 disabled:hover:bg-[#152d4d]"
                >
                  <ChevronLeft className="size-4 transition-transform group-hover:-translate-x-0.5" />
                  <span>Previous Page</span>
                </button>

                <button
                  onClick={handleNextPage}
                  disabled={(currentPage >= totalPages && !currentTabHasMore) || isLoadingMore}
                  className="group flex items-center gap-2 rounded-full bg-[#152d4d] px-8 py-3.5 text-xs font-bold text-white shadow-[0_10px_25px_rgba(21,45,77,0.18)] transition hover:-translate-y-0.5 hover:bg-[#23466f] hover:shadow-[0_15px_30px_rgba(21,45,77,0.25)] disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:translate-y-0 disabled:hover:bg-[#152d4d]"
                >
                  {isLoadingMore ? (
                    <>
                      <Loader2 className="size-4 animate-spin text-[#e8a243]" />
                      <span>Loading...</span>
                    </>
                  ) : (
                    <>
                      <span>Next Page</span>
                      <ChevronRight className="size-4 transition-transform group-hover:translate-x-0.5" />
                    </>
                  )}
                </button>
              </div>

              <p className="text-xs text-[#718095]">
                Page {currentPage} of {totalPages} · Showing{' '}
                {Math.min((currentPage - 1) * itemsPerPage + 1, totalAvailableCount)}–
                {Math.min(currentPage * itemsPerPage, totalAvailableCount)} of{' '}
                {totalAvailableCount.toLocaleString('en-IN')}{' '}
                {filterMode === 'eligible' ? 'eligible' : 'total'} schemes
              </p>
            </div>
          )}
        </div>

        {/* Status Notice Toast */}
        {notice && (
          <div
            role="status"
            className="fixed bottom-5 left-1/2 z-30 flex -translate-x-1/2 items-center gap-3 rounded-full bg-[#152d4d] px-5 py-3 text-sm text-white shadow-xl"
          >
            <CheckCircle2 className="size-4 text-[#e8a243]" /> {notice}
          </div>
        )}

        {/* Loading overlay during application portal routing */}
        {loadingId && (
          <div
            role="status"
            className="fixed inset-0 z-40 flex items-center justify-center bg-[#152d4d]/15 backdrop-blur-sm"
          >
            <div className="flex items-center gap-3 rounded-full bg-white px-6 py-4 text-sm font-semibold text-[#152d4d] shadow-xl">
              <Loader2 className="size-4 animate-spin text-[#c27717]" /> Opening application portal…
            </div>
          </div>
        )}
      </section>

      {/* Login Modal */}
      <LoginModal />

      {/* Onboarding Modal */}
      <OnboardingModal />

      {/* Footer */}
      <footer
        id="help"
        className="mx-auto flex max-w-[1240px] items-center justify-between border-t border-[#152d4d]/8 px-5 py-8 text-xs text-[#8090a0] sm:px-8 lg:px-10"
      >
        <span>© 2026 EkSutra Citizen Portal</span>
        <div className="flex gap-4">
          <Link href="/schemes" className="hover:underline">
            All Schemes
          </Link>
          <button onClick={openLoginModal} className="hover:underline">
            {user ? 'Switch Account' : 'Sign in with DigiLocker'}
          </button>
        </div>
      </footer>
    </main>
  )
}