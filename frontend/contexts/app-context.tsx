'use client'

import React, {
  createContext,
  useContext,
  useState,
  ReactNode,
  useCallback,
  useEffect,
} from 'react'
import { useRouter } from 'next/navigation'

// ==== Imports (경로는 프로젝트 구조에 맞게 조정하세요) ====
import { UserProfileVM } from '@/lib/vm/profile.vm'
import { useGetUserProfile } from '@/hooks/usecases/profile.usecase'

// --- Data Structures ---

interface LocationState {
  coordinates: { lat: number; lng: number } | null
  address: string | null
  loading: boolean
  error: string | null
  lastUpdated: Date | null
}

interface UserState {
  profile: UserProfileVM | null
  loading: boolean
  error: string | null
  lastUpdated: Date | null
  isAuthenticated: boolean
  role: UserProfileVM['role'] | null
}

interface AppState {
  location: LocationState
  user: UserState
}

type AppProviderProps = {
  children: ReactNode
  initialUser?: UserProfileVM
}

// --- Context Definition ---

interface AppContextType {
  appState: AppState
  // Location
  fetchLocation: () => void
  // User
  fetchUserProfile: () => Promise<void>
  // Onboarding
  isOnboarded: boolean
  redirectByOnboarding: (opts?: {
    whenReady?: string            // 온보딩 완료 시 이동할 경로 (예: '/home')
    whenMissingProfile?: string   // 프로필 없을 때 이동 경로 (기본 '/onboarding')
    whenNotLoggedIn?: string      // 비로그인 시 이동 경로 (기본 '/login')
    remember?: boolean            // 로컬 저장 여부 (기본 true)
    replace?: boolean             // push 대신 replace 사용할지 (기본 true)
  }) => void
}

const AppContext = createContext<AppContextType | undefined>(undefined)

// --- Provider Component ---

export const AppProvider = ({children, initialUser }: AppProviderProps) => {
  const router = useRouter()

  // 1) User Profile (React Query)
  const {
    data: userVM,
    isLoading: userLoading,
    isFetching: userFetching,
    error: userError,
    refetch: refetchUser,
  } = useGetUserProfile()

  const [appState, setAppState] = useState<AppState>({
    location: {
      coordinates: null,
      address: null,
      loading: true,
      error: null,
      lastUpdated: null,
    },
    user: {
      profile: initialUser ?? null,
      loading: initialUser ? false : true,
      error: null,
      lastUpdated: initialUser ? new Date() : null,
      isAuthenticated: !!initialUser,
      role: initialUser?.role ?? null,
    },
  })

  // 2) 초기 로딩: 위치 & 사용자 프로필
  useEffect(() => {
    fetchLocation()
    // 프로필은 React Query가 자동으로 fetch
  }, []) // 한 번만 실행

  // 3) React Query 결과 → AppState 동기화
  useEffect(() => {
    setAppState((prev) => ({
      ...prev,
      user: {
        profile: userVM ?? prev.user.profile,
        loading: userLoading || userFetching,
        error: userError ? (userError as Error).message : null,
        lastUpdated: userVM ? new Date() : prev.user.lastUpdated,
        isAuthenticated: !!(userVM ?? prev.user.profile),
        role: (userVM ?? prev.user.profile)?.role ?? null,
      },
    }))
  }, [userVM, userLoading, userFetching, userError])

  // --- Location Logic ---

  const fetchLocation = useCallback(() => {
    if (!navigator.geolocation) {
      setAppState((prev) => ({
        ...prev,
        location: {
          ...prev.location,
          error: '이 브라우저에서는 위치 정보를 지원하지 않습니다.',
          coordinates: { lat: 37.5559902611037, lng: 127.04385216428395 },
          address: '한양대 부근',
          loading: false,
          lastUpdated: new Date(),
        },
      }))
      return
    }

    setAppState((prev) => ({
      ...prev,
      location: { ...prev.location, loading: true, error: null },
    }))

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords
        try {
          const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`
          )
          const data = await response.json()
          const address = data.address
          const locationString = `${address.city || ''} ${
            address.road || address.suburb || address.neighbourhood || ''
          }`.trim()

          setAppState((prev) => ({
            ...prev,
            location: {
              ...prev.location,
              coordinates: { lat: latitude, lng: longitude },
              address: locationString || '위치를 찾을 수 없습니다.',
              loading: false,
              lastUpdated: new Date(),
            },
          }))
        } catch {
          setAppState((prev) => ({
            ...prev,
            location: {
              ...prev.location,
              coordinates: { lat: latitude, lng: longitude },
              address: '주소를 가져오는 데 실패했습니다.',
              loading: false,
              lastUpdated: new Date(),
            },
          }))
        }
      },
      (err) => {
        let errorMessage = '현재 위치를 가져올 수 없습니다.'
        if (err.code === err.PERMISSION_DENIED) {
          errorMessage = '위치 정보 제공에 동의가 필요합니다.'
        }

        setAppState((prev) => ({
          ...prev,
          location: {
            ...prev.location,
            error: errorMessage,
            coordinates: { lat: 37.5559902611037, lng: 127.04385216428395 },
            address: '한양대 부근',
            loading: false,
            lastUpdated: new Date(),
          },
        }))
      }
    )
  }, [])

  // --- User Logic (수동 리프레시용) ---
  const fetchUserProfile = useCallback(async () => {
    setAppState((prev) => ({
      ...prev,
      user: { ...prev.user, loading: true, error: null },
    }))
    await refetchUser()
  }, [refetchUser])

  // --- Onboarding Helpers ---

  // 프로필 존재 = 온보딩 완료로 간주
  const isOnboarded = !!appState.user.profile

  // 프로필 로드/변경 시 로컬 저장 (선택)
  useEffect(() => {
    try {
      if (appState.user.loading) return
      if (isOnboarded) {
        localStorage.setItem('onboardingChecked', 'true')
      } else {
        localStorage.removeItem('onboardingChecked')
      }
    } catch {
      // SSR/프라이버시 모드 등 무시
    }
  }, [appState.user.loading, isOnboarded])

  // 안정적인 리다이렉트 유틸
  const redirectByOnboarding: AppContextType['redirectByOnboarding'] = useCallback(
    (opts) => {
      const {
        whenReady,                   // 온보딩 된 경우 이동할 목적지(옵션)
        whenMissingProfile = '/onboarding',
        whenNotLoggedIn = '/login',
        remember = true,
        replace = true,
      } = opts || {}

      const u = appState.user
      // 아직 로딩 중이면 아무 것도 하지 않음 (호출측 useEffect 의존성으로 재평가)
      if (u.loading) return

      // 인증 X
      if (!u.isAuthenticated) {
        replace ? router.replace(whenNotLoggedIn) : router.push(whenNotLoggedIn)
        return
      }

      // 프로필 없음 => 온보딩으로
      if (!u.profile) {
        if (remember) {
          try { localStorage.setItem('onboardingChecked', 'false') } catch {}
        }
        replace ? router.replace(whenMissingProfile) : router.push(whenMissingProfile)
        return
      }

      // 온보딩 완료 상태에서 목적지가 있으면 이동
      if (whenReady) {
        replace ? router.replace(whenReady) : router.push(whenReady)
      }
    },
    [appState.user, router]
  )

  // --- Context Provider Value ---

  return (
    <AppContext.Provider
      value={{
        appState,
        fetchLocation,
        fetchUserProfile,
        isOnboarded,
        redirectByOnboarding,
      }}
    >
      {children}
    </AppContext.Provider>
  )
}

// --- Custom Hook ---

export const useAppContext = () => {
  const context = useContext(AppContext)
  if (!context) throw new Error('useAppContext must be used within an AppProvider')
  return context
}

/** (옵션) 페이지에서 편하게 쓰는 온보딩 가드 */
export function useOnboardingGuard(opts?: Parameters<AppContextType['redirectByOnboarding']>[0]) {
  const { appState, redirectByOnboarding } = useAppContext()
  useEffect(() => {
    redirectByOnboarding(opts)
    // user 로딩/상태가 바뀔 때마다 재평가
  }, [appState.user.loading, appState.user.isAuthenticated, appState.user.profile, redirectByOnboarding, opts])
}