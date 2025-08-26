'use client'

import { useEffect, useRef, useState } from 'react'
import type { StoreListItemVM } from '@/lib/vm/store.vm'
import { SEMANTIC_COLORS } from '@/lib/constants/colors'

export const MARKER_COLOR_DEFAULT = SEMANTIC_COLORS.default[500]
export const MARKER_COLOR_DISCOUNT = SEMANTIC_COLORS.discount[500]
export const MARKER_COLOR_USER = SEMANTIC_COLORS.user[500]

declare global {
  interface Window {
    kakao: any
  }
}

type KakaoMapProps = {
  userLocation: { lat: number; lng: number } | null
  stores: StoreListItemVM[]
  selectedStoreId: string | null
  onSelectStore: (storeId: string | null) => void
}

const getMarkerColor = (store: StoreListItemVM) => {
  const hasActiveOrAnyEvent = store.hasEvent
  return hasActiveOrAnyEvent ? MARKER_COLOR_DISCOUNT : MARKER_COLOR_DEFAULT
}

export default function KakaoMap({
  userLocation,
  stores,
  selectedStoreId,
  onSelectStore,
}: KakaoMapProps) {
  const mapContainer = useRef<HTMLDivElement>(null)
  const mapInstance = useRef<any>(null)
  const userMarkerInstance = useRef<any>(null)
  const storeMarkersInstance = useRef<
    Array<{ marker: any; nameOverlay: any; detailOverlay?: any }>
  >([])
  const [isMapReady, setIsMapReady] = useState(false)

  const initMap = (lat: number, lng: number) => {
    if (!mapContainer.current) return
    const center = new window.kakao.maps.LatLng(lat, lng)
    const mapOption = { center, level: 3 }
    mapInstance.current = new window.kakao.maps.Map(mapContainer.current, mapOption)
    setIsMapReady(true)
  }

  // SDK 로딩 + 초기화
  useEffect(() => {
    if (window.kakao?.maps) {
      if (!mapInstance.current && userLocation) initMap(userLocation.lat, userLocation.lng)
      return
    }
    const script = document.createElement('script')
    script.src = `//dapi.kakao.com/v2/maps/sdk.js?appkey=${process.env.NEXT_PUBLIC_KAKAO_MAPS_APP_KEY}&autoload=false`
    script.async = true
    script.onload = () => {
      window.kakao.maps.load(() => {
        if (!mapInstance.current && userLocation) initMap(userLocation.lat, userLocation.lng)
      })
    }
    document.head.appendChild(script)
  }, [userLocation])

  // 사용자 위치 마커
  useEffect(() => {
    if (!mapInstance.current || !userLocation || !isMapReady) return
    const userPos = new window.kakao.maps.LatLng(userLocation.lat, userLocation.lng)

    // 지도 중심 이동
    mapInstance.current.panTo(userPos)

    if (userMarkerInstance.current) {
      userMarkerInstance.current.setPosition(userPos)
      return
    }

    const svg = `
      <svg xmlns="http://www.w3.org/2000/svg" width="36" height="36" viewBox="0 0 36 36">
        <circle cx="18" cy="18" r="16" fill="${MARKER_COLOR_USER}" stroke="white" stroke-width="2" />
        <circle cx="18" cy="18" r="6" fill="white" />
      </svg>`
    const markerImgSrc = `data:image/svg+xml;base64,${btoa(svg)}`
    const imageSize = new window.kakao.maps.Size(20, 20)
    const imageOption = { offset: new window.kakao.maps.Point(10, 10) }
    const image = new window.kakao.maps.MarkerImage(markerImgSrc, imageSize, imageOption)

    const marker = new window.kakao.maps.Marker({
      position: userPos,
      image,
      zIndex: 20,
    })
    marker.setMap(mapInstance.current)
    userMarkerInstance.current = marker
  }, [userLocation, isMapReady])

  // 스토어 마커
  useEffect(() => {
    if (!mapInstance.current || !isMapReady) return

    // 기존 제거
    storeMarkersInstance.current.forEach(({ marker, nameOverlay, detailOverlay }) => {
      marker.setMap(null)
      nameOverlay.setMap(null)
      detailOverlay?.setMap(null)
    })
    storeMarkersInstance.current = []

    stores.forEach((store) => {
      if (!store.lat || !store.lng) return

      const pos = new window.kakao.maps.LatLng(store.lat, store.lng)
      const fillColor = getMarkerColor(store)

      const svg = `
        <svg xmlns="http://www.w3.org/2000/svg" width="32" height="40" viewBox="0 0 32 40" fill="none">
          <path d="M16 0C7.16 0 0 7.16 0 16C0 26 16 40 16 40C16 40 32 26 32 16C32 7.16 24.84 0 16 0Z" fill="${fillColor}"/>
          <circle cx="16" cy="16" r="6" fill="white"/>
        </svg>`
      const imgSrc = `data:image/svg+xml;base64,${btoa(svg)}`
      const imgSize = new window.kakao.maps.Size(32, 32)
      const imgOpt = { offset: new window.kakao.maps.Point(16, 20) }
      const img = new window.kakao.maps.MarkerImage(imgSrc, imgSize, imgOpt)

      // 1) 마커
      const marker = new window.kakao.maps.Marker({
        position: pos,
        image: img,
        map: mapInstance.current,
      })

      // 2) 항상 표시되는 이름 오버레이 (제휴라면 🤝 접두)
      const nameEl = document.createElement('div')
      const displayName = store.partershipText ? `🤝 ${store.name}` : store.name
      nameEl.innerHTML = `
        <div style="
          padding: 4px 8px;
          border-radius: 4px;
          font-size: 12px;
          color: black;
          font-weight: bold;
          white-space: nowrap;
          text-shadow:
            -1px -1px 0 white,
             1px -1px 0 white,
            -1px  1px 0 white,
             1px  1px 0 white;
        ">
          ${displayName}
        </div>`
      const nameOverlay = new window.kakao.maps.CustomOverlay({
        content: nameEl,
        position: pos,
        yAnchor: -0.3,
        zIndex: 20,
      })
      nameOverlay.setMap(mapInstance.current)

      // 3) hover 상세 오버레이 (첫 이벤트 요약)
      const maxRate = store.maxDiscountRate // 확장된 VM에 있을 때 표시
      const detailEl = document.createElement('div')
      detailEl.innerHTML = `
      <div style="
        background: white;
        border: 1px solid #ddd;
        padding: 10px;
        border-radius: 8px;
        box-shadow: 0 2px 6px rgba(0,0,0,0.1);
        font-size: 12px;
        width: 220px;
        line-height: 1.4;
      ">
        <strong style="color:#0f766e">${store.name}</strong><br/>
        ${store.category ? `카테고리: ${store.category}<br/>` : ''}
        ${store.distanceText ? `거리: ${store.distanceText}<br/>` : ''}
    
        ${
          store.hasEvent
            ? `
              <hr style="margin:6px 0;border:none;border-top:1px solid #eee" />
              <div> ${store.eventTitle} </div>
              ${
                typeof maxRate === 'number' && maxRate > 0
                  ? `<div style="color:#ef4444">${maxRate}% 할인</div>`
                  : `<div>이벤트 진행 중</div>`
              }
            `
            : `<div>진행 중인 이벤트 없음</div>`
        }
      </div>
    `;
      const detailOverlay = new window.kakao.maps.CustomOverlay({
        content: detailEl,
        position: pos,
        yAnchor: 1.1,
        zIndex: 20,
      })

      window.kakao.maps.event.addListener(marker, 'mouseover', () => {
        detailOverlay.setMap(mapInstance.current)
      })
      window.kakao.maps.event.addListener(marker, 'mouseout', () => {
        detailOverlay.setMap(null)
      })

      // 클릭 → 선택 + 중심 이동
      window.kakao.maps.event.addListener(marker, 'click', () => {
        mapInstance.current.panTo(pos)
        onSelectStore(store.id)
      })

      storeMarkersInstance.current.push({ marker, nameOverlay, detailOverlay })
    })
  }, [stores, isMapReady, onSelectStore])

  if (!userLocation) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-gray-100">
        <p className="text-gray-500">위치 정보를 불러오는 중...</p>
      </div>
    )
  }

  return <div ref={mapContainer} style={{ width: '100%', height: '100%' }} />
}