'use client'

import React, {
  createContext,
  useContext,
  useState,
  ReactNode,
  useCallback,
  useEffect,
} from 'react'

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

// --- Context Definition ---

interface AppContextType {
  appState: AppState
  // Location
  fetchLocation: () => void
  // User
  fetchUserProfile: () => Promise<void>
}

const AppContext = createContext<AppContextType | undefined>(undefined)

// --- Provider Component ---

export const AppProvider = ({ children }: { children: ReactNode }) => {
  // 1) User Profile (React Query)
  // useGetUserProfile는 내부에서 select: buildUserProfileVM 을 사용하므로 data는 UserProfileVM 이 됨.
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
      profile: null,
      loading: true,
      error: null,
      lastUpdated: null,
      isAuthenticated: false,
      role: null,
    },
  })

  // 2) 초기 로딩: 위치 & 사용자 프로필
  useEffect(() => {
    fetchLocation()
    // 프로필은 React Query가 자동으로 fetch
    // 별도 호출 없이 data 변화에 따른 동기화만 수행
  }, []) // 한 번만 실행

  // 3) React Query 결과 → AppState 동기화
  useEffect(() => {
    setAppState((prev) => ({
      ...prev,
      user: {
        profile: userVM ?? null,
        loading: userLoading || userFetching,
        error: userError ? (userError as Error).message : null,
        lastUpdated: userVM ? new Date() : prev.user.lastUpdated,
        isAuthenticated: !!userVM,
        role: userVM?.role ?? null,
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
    // 로딩 표시를 명확히 하고 싶다면 잠시 loading=true
    setAppState((prev) => ({
      ...prev,
      user: { ...prev.user, loading: true, error: null },
    }))
    await refetchUser()
    // 실제 state 반영은 userVM 변화에 따라 위 useEffect에서 처리
  }, [refetchUser])

  // --- Context Provider Value ---

  return (
    <AppContext.Provider
      value={{
        appState,
        fetchLocation,
        fetchUserProfile,
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
