'use client'

import React, { createContext, useContext, useState, ReactNode, useCallback, useEffect } from "react"

// --- Data Structures ---

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

// --- Context Definition ---

interface AppContextType {
  appState: AppState
  fetchLocation: () => void
}

const AppContext = createContext<AppContextType | undefined>(undefined)

// --- Provider Component ---

export const AppProvider = ({ children }: { children: ReactNode }) => {
  const [appState, setAppState] = useState<AppState>({
    location: {
      coordinates: null,
      address: null,
      loading: true,
      error: null,
      lastUpdated: null,
    },
  });

  // 데이터 로딩을 시작하는 useEffect
  useEffect(() => {
    fetchLocation();
  }, []); // 이 useEffect는 한 번만 실행됩니다.


  // --- Location Logic ---

  const fetchLocation = useCallback(() => {
    if (!navigator.geolocation) {
      setAppState((prev) => ({
        ...prev,
        location: {
          ...prev.location,
          error: "이 브라우저에서는 위치 정보를 지원하지 않습니다.",
          coordinates: { lat: 37.5559902611037, lng: 127.04385216428395 },
          address: "한양대 부근",
        }
      }))
      return
    }

    setAppState((prev) => ({ ...prev, location: { ...prev.location, loading: true, error: null } }))

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords
        try {
          const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`
          )
          const data = await response.json()
          const address = data.address
          const locationString = `${address.city || ""} ${address.road || address.suburb || address.neighbourhood || ""}`.trim()

          setAppState((prev) => ({
            ...prev,
            location: {
              ...prev.location,
              coordinates: { lat: latitude, lng: longitude },
              address: locationString || "위치를 찾을 수 없습니다.",
              loading: false,
              lastUpdated: new Date(),
            }
          }))
        } catch (err) {
          setAppState((prev) => ({
            ...prev,
            location: {
              ...prev.location,
              coordinates: { lat: latitude, lng: longitude },
              address: "주소를 가져오는 데 실패했습니다.",
              loading: false,
              lastUpdated: new Date(),
            }
          }))
        }
      },
      (err) => {
        let errorMessage = "현재 위치를 가져올 수 없습니다."
        if (err.code === err.PERMISSION_DENIED) {
          errorMessage = "위치 정보 제공에 동의가 필요합니다."
        }

        setAppState((prev) => ({
          ...prev,
          location: {
            ...prev.location,
            error: errorMessage,
            coordinates: { lat: 37.5559902611037, lng: 127.04385216428395 },
            address: "한양대 부근",
            loading: false,
          }
        }))
      }
    )
  }, [])

  // --- Context Provider Value ---

  return (
    <AppContext.Provider value={{ 
      appState, 
      fetchLocation,
    }}>
      {children}
    </AppContext.Provider>
  )
}

// --- Custom Hook ---

export const useAppContext = () => {
  const context = useContext(AppContext)
  if (!context) throw new Error("useAppContext must be used within an AppProvider")
  return context
}
