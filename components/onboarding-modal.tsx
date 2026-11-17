'use client'

// =============================================================================
// components/onboarding-modal.tsx — Citizen Profile Onboarding Modal
// =============================================================================
// WHY HERE: 
//   When a citizen logs in via Google for the first time (or lacks age/income),
//   this modal intercepts their session to collect Age, Annual Income, and State.
//   Upon submission, it updates Supabase and triggers the Eligibility Engine.
// =============================================================================

import { useState } from 'react'
import {
  Sparkles,
  ArrowRight,
  Loader2,
  AlertCircle,
  Building2,
  Calendar,
  IndianRupee,
  MapPin
} from 'lucide-react'
import { useAuth } from '@/context/auth-context'

const INDIAN_STATES = [
  'Andhra Pradesh',
  'Arunachal Pradesh',
  'Assam',
  'Bihar',
  'Chhattisgarh',
  'Goa',
  'Gujarat',
  'Haryana',
  'Himachal Pradesh',
  'Jharkhand',
  'Karnataka',
  'Kerala',
  'Madhya Pradesh',
  'Maharashtra',
  'Manipur',
  'Meghalaya',
  'Mizoram',
  'Nagaland',
  'Odisha',
  'Punjab',
  'Rajasthan',
  'Sikkim',
  'Tamil Nadu',
  'Telangana',
  'Tripura',
  'Uttar Pradesh',
  'Uttarakhand',
  'West Bengal',
  'Delhi (NCT)',
  'Jammu & Kashmir',
  'Ladakh',
  'Puducherry',
]

export function OnboardingModal() {
  const { isOnboardingOpen, authUser, saveOnboardingProfile } = useAuth()

  const [age, setAge] = useState<number | ''>(25)
  const [annualIncome, setAnnualIncome] = useState<number | ''>(180000)
  const [state, setState] = useState<string>('Uttar Pradesh')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  if (!isOnboardingOpen) return null

  const displayName =
    authUser?.user_metadata?.full_name ||
    authUser?.user_metadata?.name ||
    authUser?.email?.split('@')[0] ||
    'Citizen'

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMessage(null)

    const numAge = Number(age)
    const numIncome = Number(annualIncome)

    if (!age || isNaN(numAge) || numAge < 1 || numAge > 120) {
      setErrorMessage('Please enter a valid age (between 1 and 120).')
      return
    }

    if (annualIncome === '' || isNaN(numIncome) || numIncome < 0) {
      setErrorMessage('Please enter a valid annual income (₹0 or greater).')
      return
    }

    if (!state.trim()) {
      setErrorMessage('Please select your state of residence.')
      return
    }

    setIsSubmitting(true)

    const result = await saveOnboardingProfile({
      age: numAge,
      annual_income: numIncome,
      state: state.trim(),
    })

    setIsSubmitting(false)

    if (!result.success) {
      setErrorMessage(result.error || 'Failed to save profile. Please try again.')
    }
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#152d4d]/50 backdrop-blur-md animate-in fade-in duration-200"
    >
      <div className="relative w-full max-w-lg rounded-[32px] border border-white/80 bg-white/95 p-6 md:p-8 shadow-[0_25px_60px_rgba(21,45,77,0.22)] backdrop-blur-xl">
        {/* Header with EkSutra emblem */}
        <div className="flex items-center gap-3">
          <span className="flex size-11 items-center justify-center rounded-2xl bg-[#152d4d] font-serif text-lg text-white shadow-md shadow-[#152d4d]/15">
            एक
          </span>
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#c27717]">
              Step 1 of 1 · Citizen Demographics
            </p>
            <h2 className="font-serif text-2xl font-semibold tracking-tight text-[#152d4d]">
              Complete Your Profile
            </h2>
          </div>
        </div>

        <p className="mt-3 text-xs leading-5 text-[#718095]">
          Welcome, <strong>{displayName}</strong>! EkSutra requires your age, annual income, and state to accurately compute which government schemes and subsidies you qualify for.
        </p>

        {/* Input Form */}
        <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-4">
          {/* Age Field */}
          <div>
            <label
              htmlFor="onboarding-age"
              className="flex items-center gap-1.5 text-xs font-semibold text-[#152d4d]"
            >
              <Calendar className="size-3.5 text-[#c27717]" />
              Age (Years)
            </label>
            <div className="relative mt-1.5">
              <input
                id="onboarding-age"
                type="number"
                min="1"
                max="120"
                required
                value={age}
                onChange={(e) => setAge(e.target.value === '' ? '' : Number(e.target.value))}
                placeholder="e.g. 25"
                className="h-11 w-full rounded-2xl border border-[#152d4d]/15 bg-white px-4 text-xs font-medium text-[#152d4d] outline-none transition placeholder:text-[#a0afbe] focus:border-[#c27717] focus:ring-4 focus:ring-[#c27717]/10"
              />
            </div>
          </div>

          {/* Annual Income Field */}
          <div>
            <label
              htmlFor="onboarding-income"
              className="flex items-center gap-1.5 text-xs font-semibold text-[#152d4d]"
            >
              <IndianRupee className="size-3.5 text-[#c27717]" />
              Annual Family Income (₹ / Year)
            </label>
            <div className="relative mt-1.5">
              <input
                id="onboarding-income"
                type="number"
                min="0"
                step="5000"
                required
                value={annualIncome}
                onChange={(e) => setAnnualIncome(e.target.value === '' ? '' : Number(e.target.value))}
                placeholder="e.g. 180000"
                className="h-11 w-full rounded-2xl border border-[#152d4d]/15 bg-white px-4 text-xs font-medium text-[#152d4d] outline-none transition placeholder:text-[#a0afbe] focus:border-[#c27717] focus:ring-4 focus:ring-[#c27717]/10"
              />
            </div>
            <p className="mt-1 text-[11px] text-[#8090a0]">
              Used to evaluate EWS/BPL income caps (e.g. ₹3 Lakh for Ayushman Bharat).
            </p>
          </div>

          {/* State Dropdown */}
          <div>
            <label
              htmlFor="onboarding-state"
              className="flex items-center gap-1.5 text-xs font-semibold text-[#152d4d]"
            >
              <MapPin className="size-3.5 text-[#c27717]" />
              State of Residence
            </label>
            <div className="relative mt-1.5">
              <select
                id="onboarding-state"
                value={state}
                onChange={(e) => setState(e.target.value)}
                required
                className="h-11 w-full rounded-2xl border border-[#152d4d]/15 bg-white px-4 text-xs font-medium text-[#152d4d] outline-none transition focus:border-[#c27717] focus:ring-4 focus:ring-[#c27717]/10"
              >
                {INDIAN_STATES.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {errorMessage && (
            <div className="flex items-center gap-2 rounded-xl bg-red-50 p-3 text-xs text-red-700">
              <AlertCircle className="size-4 shrink-0 text-red-500" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Submit Action */}
          <button
            type="submit"
            disabled={isSubmitting}
            className="mt-2 flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-[#152d4d] px-5 text-xs font-bold text-white shadow-[0_10px_24px_rgba(21,45,77,0.18)] transition hover:bg-[#23466f] disabled:opacity-60"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="size-4 animate-spin" /> Saving & Calculating Eligibility...
              </>
            ) : (
              <>
                Save Profile & View Eligible Schemes <ArrowRight className="size-3.5" />
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  )
}

