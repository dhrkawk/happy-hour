'use client'

import { useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'

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
  stores: any[]
}

export default function KakaoMap({ userLocation, stores }: KakaoMapProps) {
  const router = useRouter()
  const mapContainer = useRef<HTMLDivElement>(null)
  const mapInstance = useRef<any>(null)
  const userMarkerInstance = useRef<any>(null)
  const storeMarkersInstance = useRef<any[]>([])

  const initMap = () => {
    if (!mapContainer.current || !userLocation) return

    const center = new window.kakao.maps.LatLng(userLocation.lat, userLocation.lng)
    const mapOption = {
      center: center,
      level: 3,
    }
    mapInstance.current = new window.kakao.maps.Map(mapContainer.current, mapOption)
  }

  useEffect(() => {
    if (window.kakao && window.kakao.maps) {
      if (userLocation) {
        initMap()
      }
      return
    }

    const script = document.createElement('script')
    script.src = `//dapi.kakao.com/v2/maps/sdk.js?appkey=${process.env.NEXT_PUBLIC_KAKAO_MAPS_APP_KEY}&autoload=false`
    script.async = true
    script.onload = () => {
      window.kakao.maps.load(() => {
        if (userLocation) {
          initMap()
        }
      })
    }
    document.head.appendChild(script)
  }, [userLocation]) // userLocation이 준비되면 지도를 초기화합니다.

  // 사용자 위치 마커 업데이트
  useEffect(() => {
    if (!mapInstance.current || !userLocation) return

    const userPosition = new window.kakao.maps.LatLng(userLocation.lat, userLocation.lng)

    // 지도 중심 이동
    mapInstance.current.panTo(userPosition)

    // 마커 생성 또는 위치 업데이트
    if (userMarkerInstance.current) {
      userMarkerInstance.current.setPosition(userPosition)
    } else {
      const svgMarker = '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><circle cx="12" cy="12" r="9" fill="#3B82F6" stroke="white" stroke-width="2"/></svg>'
      const markerImageSrc = `data:image/svg+xml;base64,${btoa(svgMarker)}`
      const imageSize = new window.kakao.maps.Size(24, 24)
      const imageOption = { offset: new window.kakao.maps.Point(12, 12) }

      const markerImage = new window.kakao.maps.MarkerImage(markerImageSrc, imageSize, imageOption)

      const marker = new window.kakao.maps.Marker({
        position: userPosition,
        image: markerImage,
        zIndex: 10,
      })

      marker.setMap(mapInstance.current)
      userMarkerInstance.current = marker
    }
  }, [userLocation, mapInstance.current])

  // 가게 마커 업데이트
  useEffect(() => {
    if (!mapInstance.current || !stores) return

    // 기존 마커 제거
    storeMarkersInstance.current.forEach(marker => marker.setMap(null))
    storeMarkersInstance.current = []

    const storeSvgMarker = '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><circle cx="12" cy="12" r="9" fill="#EF4444" stroke="white" stroke-width="2"/></svg>'
    const storeMarkerImageSrc = `data:image/svg+xml;base64,${btoa(storeSvgMarker)}`
    const storeImageSize = new window.kakao.maps.Size(24, 24)
    const storeImageOption = { offset: new window.kakao.maps.Point(12, 12) }

    const storeMarkerImage = new window.kakao.maps.MarkerImage(storeMarkerImageSrc, storeImageSize, storeImageOption)

    stores.forEach(store => {
      if (store.lat && store.lng) {
        const storePosition = new window.kakao.maps.LatLng(store.lat, store.lng)
        const marker = new window.kakao.maps.Marker({
          position: storePosition,
          image: storeMarkerImage,
          map: mapInstance.current,
        })

        window.kakao.maps.event.addListener(marker, 'click', function() {
          router.push(`/store/${store.id}`)
        })

        storeMarkersInstance.current.push(marker)
      }
    })
  }, [stores, mapInstance.current, router])

  if (!userLocation) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-gray-100">
        <p className="text-gray-500">위치 정보를 불러오는 중...</p>
      </div>
    )
  }

  return <div ref={mapContainer} style={{ width: '100%', height: '100%' }} />
}
