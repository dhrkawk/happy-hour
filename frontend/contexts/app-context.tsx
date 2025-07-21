
"use client"

import React, { createContext, useContext, useState, ReactNode, useCallback, useEffect } from "react"

// 1. 상태 타입 정의
interface LocationState {
  coordinates: { lat: number; lng: number } | null
  address: string | null
  loading: boolean
  error: string | null
  lastUpdated: Date | null
}

interface AppState {
  location: LocationState
}

// 2. Context가 제공할 값의 타입 정의
interface AppContextType {
  appState: AppState
  fetchLocation: () => void
}

// 3. Context 생성 (초기값은 undefined로 설정, Provider에서 실제 값 제공)
const AppContext = createContext<AppContextType | undefined>(undefined)

// 4. AppProvider 컴포넌트 구현 (아직 로직 없음)
export const AppProvider = ({ children }: { children: ReactNode }) => {
  const [appState, setAppState] = useState<AppState>({
    location: {
      coordinates: null,
      address: null,
      loading: false,
      error: null,
      lastUpdated: null,
    },
  })

  const fetchLocation = useCallback(() => {
    if (!navigator.geolocation) {
      setAppState(prevState => ({
        ...prevState,
        location: {
          ...prevState.location,
          error: "이 브라우저에서는 위치 정보를 지원하지 않습니다.",
          // Fallback 위치 (예: 한양대 애지문)
          coordinates: { lat: 37.5559902611037, lng: 127.04385216428395 },
          address: "강남역 부근",
        }
      }))
      return
    }

    setAppState(prevState => ({ ...prevState, location: { ...prevState.location, loading: true, error: null } }))

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords
        try {
          const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`
          )
          const data = await response.json()
          const address = data.address
          const locationString = `${address.city || ""} ${address.road || address.suburb || address.neighbourhood || ""}`.trim()
          
          setAppState(prevState => ({
            ...prevState,
            location: {
              ...prevState.location,
              coordinates: { lat: latitude, lng: longitude },
              address: locationString || "위치를 찾을 수 없습니다.",
              loading: false,
              lastUpdated: new Date(),
            }
          }))
        } catch (error) {
          console.error("Error fetching address: ", error)
          setAppState(prevState => ({
            ...prevState,
            location: {
              ...prevState.location,
              // 주소 변환 실패 시에도 좌표는 유지
              coordinates: { lat: latitude, lng: longitude },
              address: "주소를 가져오는 데 실패했습니다.",
              loading: false,
              lastUpdated: new Date(), // 좌표는 성공했으므로 시간 갱신
            }
          }))
        }
      },
      (error) => {
        let errorMessage = "현재 위치를 가져올 수 없습니다."
        if (error.code === error.PERMISSION_DENIED) {
          errorMessage = "위치 정보 제공에 동의가 필요합니다."
        }

        setAppState(prevState => ({
          ...prevState,
          location: {
            ...prevState.location,
            error: errorMessage,
            // Fallback 위치 (예: 강남역)
            coordinates: { lat: 37.4979, lng: 127.0276 },
            address: "강남역 부근",
            loading: false,
          }
        }))
      }
    )
  }, [])

  // 앱 시작 시 위치 정보 한 번만 가져오기
  useEffect(() => {
    fetchLocation()
  }, [fetchLocation])

  const value = {
    appState,
    fetchLocation,
  }

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>
}

// 5. 커스텀 훅 생성
export const useAppContext = () => {
  const context = useContext(AppContext)
  if (context === undefined) {
    throw new Error("useAppContext must be used within an AppProvider")
  }
  return context
}
