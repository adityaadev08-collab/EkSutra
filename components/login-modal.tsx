'use client'

// =============================================================================
// components/login-modal.tsx — 1-Click "Sign in with Google" Citizen Modal
// =============================================================================
// WHY HERE: 
//   Replaces manual form login with a 1-click Google OAuth trigger powered
//   by @supabase/supabase-js, with an optional quick-test fallback for reviews.
// =============================================================================

import { useState } from 'react'
import { X, Loader2, AlertCircle, ShieldCheck, ChevronDown, User } from 'lucide-react'
import { useAuth } from '@/context/auth-context'

function GoogleIcon({ className = "size-5" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
        fill="#4285F4"
      />
      <path
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
        fill="#34A853"
      />
      <path
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
        fill="#FBBC05"
      />
      <path
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
        fill="#EA4335"
      />
    </svg>
  )
}

export function LoginModal() {
  const { isLoginModalOpen, closeLoginModal, signInWithGoogle, loginWithMock } = useAuth()
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [isGoogleLoading, setIsGoogleLoading] = useState(false)
  const [showMockOptions, setShowMockOptions] = useState(false)

  if (!isLoginModalOpen) return null

  const handleGoogleSignIn = async () => {
    try {
      setIsGoogleLoading(true)
      setErrorMessage(null)
      await signInWithGoogle()
    } catch (err: unknown) {
      setIsGoogleLoading(false)
      const message = err instanceof Error ? err.message : 'Google sign in failed'
      setErrorMessage(message)
    }
  }

  const handleQuickSelect = async (username: string) => {
    setErrorMessage(null)
    const result = await loginWithMock(username)
    if (!result.success) {
      setErrorMessage(result.error || 'Login failed')
    }
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#152d4d]/40 backdrop-blur-md animate-in fade-in duration-200"
      onClick={(e) => {
        if (e.target === e.currentTarget && !isGoogleLoading) closeLoginModal()
      }}
    >
      <div className="relative w-full max-w-md rounded-[32px] border border-white/80 bg-white/95 p-6 md:p-8 shadow-[0_25px_60px_rgba(21,45,77,0.18)] backdrop-blur-xl">
        {/* Close Button */}
        <button
          onClick={closeLoginModal}
          disabled={isGoogleLoading}
          className="absolute right-5 top-5 flex size-9 items-center justify-center rounded-full border border-[#152d4d]/10 bg-[#f7f8f5] text-[#718095] transition hover:bg-white hover:text-[#152d4d] disabled:opacity-50"
          aria-label="Close dialog"
        >
          <X className="size-4" />
        </button>

        {/* Header with EkSutra emblem */}
        <div className="flex items-center gap-3">
          <span className="flex size-10 items-center justify-center rounded-2xl bg-[#152d4d] font-serif text-lg text-white shadow-md shadow-[#152d4d]/15">
            एक
          </span>
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#c27717]">
              Single Sign-On
            </p>
            <h2 className="font-serif text-2xl font-semibold tracking-tight text-[#152d4d]">
              Sign in to EkSutra
            </h2>
          </div>
        </div>

        <p className="mt-3 text-xs leading-5 text-[#718095]">
          Connect securely via Google. EkSutra will automatically create your citizen profile and calculate your government scheme eligibility.
        </p>

        {/* Primary Action: 1-Click Sign in with Google */}
        <div className="mt-6 flex flex-col gap-3">
          <button
            type="button"
            onClick={handleGoogleSignIn}
            disabled={isGoogleLoading}
            className="group relative flex h-13 w-full items-center justify-center gap-3 rounded-2xl border border-[#152d4d]/15 bg-white px-5 text-sm font-semibold text-[#152d4d] shadow-[0_8px_20px_rgba(21,45,77,0.06)] transition hover:-translate-y-0.5 hover:bg-zinc-50 hover:shadow-[0_12px_28px_rgba(21,45,77,0.12)] disabled:cursor-wait disabled:opacity-60"
          >
            {isGoogleLoading ? (
              <>
                <Loader2 className="size-5 animate-spin text-[#c27717]" />
                <span>Redirecting to Google...</span>
              </>
            ) : (
              <>
                <GoogleIcon className="size-5 transition group-hover:scale-110" />
                <span>Sign in with Google</span>
              </>
            )}
          </button>

          <div className="flex items-center justify-center gap-1.5 text-[11px] text-[#8090a0]">
            <ShieldCheck className="size-3.5 text-[#287254]" />
            <span>Authenticated via Supabase Google OAuth</span>
          </div>
        </div>

        {errorMessage && (
          <div className="mt-4 flex items-center gap-2 rounded-xl bg-red-50 p-3 text-xs text-red-700">
            <AlertCircle className="size-4 shrink-0 text-red-500" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Collapsible Viva Reviewer Testing Options */}
        <div className="mt-6 border-t border-[#152d4d]/10 pt-4">
          <button
            type="button"
            onClick={() => setShowMockOptions(!showMockOptions)}
            className="flex w-full items-center justify-between text-left text-xs font-semibold text-[#8090a0] hover:text-[#152d4d]"
          >
            <span>Reviewer Demo Fallback (Ravi / Meena)</span>
            <ChevronDown
              className={`size-4 transition-transform ${showMockOptions ? 'rotate-180' : ''}`}
            />
          </button>

          {showMockOptions && (
            <div className="mt-3 flex flex-col gap-2 animate-in fade-in duration-150">
              <button
                type="button"
                onClick={() => handleQuickSelect('ravi')}
                className="flex items-center justify-between rounded-xl border border-[#152d4d]/10 bg-[#f7f8f5] px-3.5 py-2 text-left text-xs font-medium text-[#152d4d] transition hover:bg-white"
              >
                <div>
                  <span className="font-semibold text-[#152d4d]">Ravi Kumar</span>
                  <span className="ml-2 text-[11px] text-[#718095]">Age 25 · ₹1.8L income</span>
                </div>
                <span className="rounded-full bg-[#e1f1e9] px-2 py-0.5 text-[10px] font-bold text-[#287254]">
                  Demo
                </span>
              </button>

              <button
                type="button"
                onClick={() => handleQuickSelect('meena')}
                className="flex items-center justify-between rounded-xl border border-[#152d4d]/10 bg-[#f7f8f5] px-3.5 py-2 text-left text-xs font-medium text-[#152d4d] transition hover:bg-white"
              >
                <div>
                  <span className="font-semibold text-[#152d4d]">Meena Devi</span>
                  <span className="ml-2 text-[11px] text-[#718095]">Age 62 · ₹7.0L income</span>
                </div>
                <span className="rounded-full bg-[#dfe8f4] px-2 py-0.5 text-[10px] font-bold text-[#152d4d]">
                  Demo
                </span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
