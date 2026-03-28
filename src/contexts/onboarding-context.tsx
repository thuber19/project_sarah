'use client'

import { createContext, useContext, useState, ReactNode } from 'react'
import type { ProfileData, IcpData } from '@/app/actions/onboarding.actions'

interface OnboardingContextType {
  profile: ProfileData | null
  icp: IcpData | null
  scoreThreshold: number
  setProfile: (profile: ProfileData | null) => void
  setIcp: (icp: IcpData | null) => void
  setScoreThreshold: (threshold: number) => void
  resetOnboarding: () => void
}

const OnboardingContext = createContext<OnboardingContextType | undefined>(undefined)

export function OnboardingProvider({ children }: { children: ReactNode }) {
  const [profile, setProfile] = useState<ProfileData | null>(() => {
    if (typeof window === 'undefined') return null
    const stored = sessionStorage.getItem('onboarding_profile')
    return stored ? JSON.parse(stored) : null
  })

  const [icp, setIcp] = useState<IcpData | null>(() => {
    if (typeof window === 'undefined') return null
    const stored = sessionStorage.getItem('onboarding_icp')
    return stored ? JSON.parse(stored) : null
  })

  const [scoreThreshold, setScoreThreshold] = useState<number>(() => {
    if (typeof window === 'undefined') return 60
    return Number(sessionStorage.getItem('onboarding_score_threshold') ?? '60')
  })

  const handleSetProfile = (newProfile: ProfileData | null) => {
    setProfile(newProfile)
    if (newProfile) {
      sessionStorage.setItem('onboarding_profile', JSON.stringify(newProfile))
    } else {
      sessionStorage.removeItem('onboarding_profile')
    }
  }

  const handleSetIcp = (newIcp: IcpData | null) => {
    setIcp(newIcp)
    if (newIcp) {
      sessionStorage.setItem('onboarding_icp', JSON.stringify(newIcp))
    } else {
      sessionStorage.removeItem('onboarding_icp')
    }
  }

  const handleSetScoreThreshold = (threshold: number) => {
    setScoreThreshold(threshold)
    sessionStorage.setItem('onboarding_score_threshold', String(threshold))
  }

  const resetOnboarding = () => {
    setProfile(null)
    setIcp(null)
    setScoreThreshold(60)
    sessionStorage.removeItem('onboarding_profile')
    sessionStorage.removeItem('onboarding_icp')
    sessionStorage.removeItem('onboarding_score_threshold')
  }

  return (
    <OnboardingContext.Provider
      value={{
        profile,
        icp,
        scoreThreshold,
        setProfile: handleSetProfile,
        setIcp: handleSetIcp,
        setScoreThreshold: handleSetScoreThreshold,
        resetOnboarding,
      }}
    >
      {children}
    </OnboardingContext.Provider>
  )
}

export function useOnboarding() {
  const context = useContext(OnboardingContext)
  if (context === undefined) {
    throw new Error('useOnboarding must be used within OnboardingProvider')
  }
  return context
}
