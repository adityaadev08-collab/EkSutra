'use client'

// =============================================================================
// context/auth-context.tsx — Global Authentication & Citizen Onboarding State
// =============================================================================
// WHY HERE: 
//   Manages live Supabase Auth sessions, triggers 1-click Google OAuth,
//   intercepts new/incomplete users with the Onboarding Modal, and updates
//   the Eligibility Engine with their actual submitted demographics.
// =============================================================================

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { User as SupabaseAuthUser } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'
import { setSessionUser, clearSession } from '@/app/actions/auth'
import { MOCK_USERS, UserProfile } from '@/lib/data'

export interface ExtendedUserProfile extends UserProfile {
  id?: string
  initials: string
  avatar_url?: string
  applications_count?: number
  completed_count?: number
  pending_count?: number
}

interface OnboardingInput {
  age: number
  annual_income: number
  state: string
}

interface AuthContextType {
  user: ExtendedUserProfile | null
  activeUsername: string | null
  authUser: SupabaseAuthUser | null
  isLoginModalOpen: boolean
  isOnboardingOpen: boolean
  isLoadingAuth: boolean
  openLoginModal: () => void
  closeLoginModal: () => void
  openOnboardingModal: () => void
  closeOnboardingModal: () => void
  signInWithGoogle: () => Promise<void>
  loginWithMock: (username: string) => Promise<{ success: boolean; error?: string }>
  saveOnboardingProfile: (data: OnboardingInput) => Promise<{ success: boolean; error?: string }>
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

function formatMockProfile(profile: UserProfile): ExtendedUserProfile {
  const initials = profile.name
    .split(' ')
    .map((w) => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)

  return {
    ...profile,
    initials: initials || 'CZ',
    applications_count: 4,
    completed_count: 2,
    pending_count: 1,
  }
}

export function AuthProvider({
  children,
  initialUsername = null,
}: {
  children: ReactNode
  initialUsername?: string | null
}) {
  const [user, setUser] = useState<ExtendedUserProfile | null>(() => {
    if (initialUsername && MOCK_USERS[initialUsername]) {
      return formatMockProfile(MOCK_USERS[initialUsername])
    }
    return null
  })
  const [activeUsername, setActiveUsername] = useState<string | null>(initialUsername)
  const [authUser, setAuthUser] = useState<SupabaseAuthUser | null>(null)
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false)
  const [isOnboardingOpen, setIsOnboardingOpen] = useState(false)
  const [isLoadingAuth, setIsLoadingAuth] = useState(true)

  const openLoginModal = () => setIsLoginModalOpen(true)
  const closeLoginModal = () => setIsLoginModalOpen(false)
  const openOnboardingModal = () => setIsOnboardingOpen(true)
  const closeOnboardingModal = () => setIsOnboardingOpen(false)

  /**
   * Synchronizes user profile from Supabase profiles table.
   * If the user row is missing OR lacks age/income, opens the Onboarding Modal.
   */
  const syncUserProfile = async (currentAuthUser: SupabaseAuthUser) => {
    try {
      setAuthUser(currentAuthUser)
      setIsLoginModalOpen(false)

      const googleName =
        currentAuthUser.user_metadata?.full_name ||
        currentAuthUser.user_metadata?.name ||
        currentAuthUser.email?.split('@')[0] ||
        'Citizen'

      const avatarUrl =
        currentAuthUser.user_metadata?.avatar_url ||
        currentAuthUser.user_metadata?.picture ||
        undefined

      const initials = googleName
        .split(' ')
        .map((w: string) => w[0])
        .join('')
        .toUpperCase()
        .slice(0, 2)

      // 1. Query existing profile from Supabase profiles table
      const { data: existingProfile, error: fetchError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', currentAuthUser.id)
        .maybeSingle()

      if (fetchError) {
        console.warn('Error reading profiles table:', fetchError.message)
      }

      // 2. Check if profile is missing OR lacks demographic constraints (age or income)
      const isMissingDemographics =
        !existingProfile ||
        existingProfile.age === null ||
        existingProfile.age === undefined ||
        existingProfile.annual_income === null ||
        existingProfile.annual_income === undefined

      if (isMissingDemographics) {
        // Set basic Google identity into state so their photo and name appear,
        // and trigger the onboarding modal immediately to collect demographics.
        setUser({
          id: currentAuthUser.id,
          name: googleName,
          state: (existingProfile?.occupation as string) || 'Uttar Pradesh',
          age: 0,
          annual_income: 0,
          avatar_url: avatarUrl,
          initials: initials || 'CZ',
          applications_count: 0,
          completed_count: 0,
          pending_count: 0,
        })
        setActiveUsername(currentAuthUser.email || currentAuthUser.id)
        setIsOnboardingOpen(true)
        return
      }

      // 3. User already completed onboarding
      setIsOnboardingOpen(false)
      const userState =
        (existingProfile.state as string) ||
        (existingProfile.occupation as string) ||
        'Uttar Pradesh'

      setUser({
        id: currentAuthUser.id,
        name: existingProfile.full_name || googleName,
        age: existingProfile.age,
        annual_income: existingProfile.annual_income,
        state: userState,
        avatar_url: avatarUrl,
        initials: initials || 'CZ',
        applications_count: 4,
        completed_count: 2,
        pending_count: 1,
      })
      setActiveUsername(currentAuthUser.email || currentAuthUser.id)
    } catch (err) {
      console.error('Failed to sync user profile:', err)
    }
  }

  // Set up live Supabase auth subscription to automatically capture Google OAuth redirect
  useEffect(() => {
    let isMounted = true

    async function initializeAuth() {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        if (session?.user && isMounted) {
          await syncUserProfile(session.user)
        }
      } catch (err) {
        console.warn('Initial session check error:', err)
      } finally {
        if (isMounted) setIsLoadingAuth(false)
      }
    }

    initializeAuth()

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!isMounted) return

        if (event === 'SIGNED_IN' && session?.user) {
          await syncUserProfile(session.user)
        } else if (event === 'SIGNED_OUT') {
          setUser(null)
          setAuthUser(null)
          setActiveUsername(null)
          setIsOnboardingOpen(false)
        }
      }
    )

    return () => {
      isMounted = false
      subscription.unsubscribe()
    }
  }, [])

  /**
   * 1-Click Sign in with Google via Supabase OAuth
   */
  const signInWithGoogle = async () => {
    const origin = typeof window !== 'undefined' ? window.location.origin : ''
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${origin}/`,
      },
    })

    if (error) {
      console.error('Google OAuth error:', error.message)
      throw error
    }
  }

  /**
   * Saves submitted onboarding demographics (Age, Income, State) to Supabase profiles
   * and synchronizes the active React state for the Eligibility Engine.
   */
  const saveOnboardingProfile = async (data: OnboardingInput) => {
    try {
      if (!authUser) {
        return { success: false, error: 'User session not found.' }
      }

      const googleName =
        authUser.user_metadata?.full_name ||
        authUser.user_metadata?.name ||
        authUser.email?.split('@')[0] ||
        'Citizen'

      const avatarUrl =
        authUser.user_metadata?.avatar_url ||
        authUser.user_metadata?.picture ||
        undefined

      // Prepare payload (includes state in occupation as well for schema resilience)
      const basePayload: Record<string, unknown> = {
        id: authUser.id,
        full_name: googleName,
        age: data.age,
        annual_income: data.annual_income,
        occupation: data.state,
      }

      // Upsert into Supabase profiles table
      const { error: upsertError } = await supabase
        .from('profiles')
        .upsert(basePayload)

      if (upsertError) {
        console.error('Profile upsert error:', upsertError.message)
        return { success: false, error: upsertError.message }
      }

      const initials = googleName
        .split(' ')
        .map((w: string) => w[0])
        .join('')
        .toUpperCase()
        .slice(0, 2)

      // Update active React state so Eligibility Engine immediately recalculates
      setUser({
        id: authUser.id,
        name: googleName,
        age: data.age,
        annual_income: data.annual_income,
        state: data.state,
        avatar_url: avatarUrl,
        initials: initials || 'CZ',
        applications_count: 4,
        completed_count: 2,
        pending_count: 1,
      })

      setIsOnboardingOpen(false)
      return { success: true }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to save profile'
      return { success: false, error: msg }
    }
  }

  /**
   * Fallback for mock demo testing
   */
  const loginWithMock = async (username: string) => {
    const key = username.toLowerCase().trim()
    const result = await setSessionUser(key)

    if (result.success && result.user) {
      setUser(formatMockProfile(result.user))
      setActiveUsername(key)
      setIsLoginModalOpen(false)
      setIsOnboardingOpen(false)
      return { success: true }
    }

    return {
      success: false,
      error: result.error || "User not found. Try 'ravi' or 'meena'.",
    }
  }

  /**
   * Sign out: Clears Supabase session, state, and HTTP-only cookie
   */
  const signOut = async () => {
    try {
      await supabase.auth.signOut()
    } catch (e) {
      console.warn('Supabase signout error:', e)
    }
    await clearSession()
    setUser(null)
    setAuthUser(null)
    setActiveUsername(null)
    setIsOnboardingOpen(false)
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        activeUsername,
        authUser,
        isLoginModalOpen,
        isOnboardingOpen,
        isLoadingAuth,
        openLoginModal,
        closeLoginModal,
        openOnboardingModal,
        closeOnboardingModal,
        signInWithGoogle,
        loginWithMock,
        saveOnboardingProfile,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
