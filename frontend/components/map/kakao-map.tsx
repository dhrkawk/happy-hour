'use client'

import { useEffect, useRef } from 'react'

declare global {
  interface Window {
    kakao: any
  }
}

interface KakaoMapProps {
  userLocation: {
    lat: number
    lng: number
  } | null
}

export default function KakaoMap({ userLocation }: KakaoMapProps) {
  const mapContainer = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const kakaoMapScript = document.createElement('script')
    kakaoMapScript.async = false
    kakaoMapScript.src = `//dapi.kakao.com/v2/maps/sdk.js?appkey=${process.env.NEXT_PUBLIC_KAKAO_MAPS_APP_KEY}&autoload=false`
    document.head.appendChild(kakaoMapScript)

    const onLoadKakaoAPI = () => {
      if (!mapContainer.current) return
      window.kakao.maps.load(() => {
        const center = userLocation
          ? new window.kakao.maps.LatLng(userLocation.lat, userLocation.lng)
          : new window.kakao.maps.LatLng(37.5665, 126.978) // Default to Seoul

        const mapOption = {
          center,
          level: 3,
        }
        new window.kakao.maps.Map(mapContainer.current, mapOption)
      })
    }

    kakaoMapScript.addEventListener('load', onLoadKakaoAPI)

    return () => {
      kakaoMapScript.removeEventListener('load', onLoadKakaoAPI)
    }
  }, [userLocation])

  return <div ref={mapContainer} style={{ width: '100%', height: '100%' }} />
}