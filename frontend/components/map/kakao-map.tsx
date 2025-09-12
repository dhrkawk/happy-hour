'use client'

import { useEffect, useRef, useState } from 'react'
import type { StoreListItemVM } from '@/lib/vm/store.vm'
import { SEMANTIC_COLORS } from '@/lib/constants/colors'
import { createStoreOverlayElement } from './map-modal'

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
    Array<{ marker: any; nameOverlay: any; detailOverlay: any; store: StoreListItemVM }>
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

  // 지도 빈 곳 클릭 시 선택 해제(모달 닫기)
  useEffect(() => {
    if (!mapInstance.current || !isMapReady) return
    const map = mapInstance.current
    const handleMapClick = () => onSelectStore(null)
    window.kakao.maps.event.addListener(map, 'click', handleMapClick)
    return () => {
      window.kakao.maps.event.removeListener(map, 'click', handleMapClick)
    }
  }, [isMapReady, onSelectStore])

  // 사용자 위치 마커
  useEffect(() => {
    if (!mapInstance.current || !userLocation || !isMapReady) return
    const userPos = new window.kakao.maps.LatLng(userLocation.lat, userLocation.lng)
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

  // ✅ 선택 변경 시: 상세 오버레이 토글 + 단일 panTo(픽셀 오프셋 포함)
  useEffect(() => {
    if (!mapInstance.current || !isMapReady) return
    const map = mapInstance.current

    // 1) 오버레이 표시/숨김만 처리 (좌표는 stores에서 직접 찾음)
    storeMarkersInstance.current.forEach(({ store, detailOverlay }) => {
      detailOverlay.setMap(store.id === selectedStoreId ? map : null)
    })

    // 2) 이동할 타겟 좌표는 최신 stores 배열에서 직접 가져오기
    if (!selectedStoreId) return
    const s = stores.find((x) => x.id === selectedStoreId)
    if (!s || !s.lat || !s.lng) return

    const target = new window.kakao.maps.LatLng(s.lat, s.lng)

    // 3) 현재 줌 레벨에서의 프로젝션으로 “한 번만” 오프셋 적용 좌표 계산
    const projection = map.getProjection()
    const pt = projection.pointFromCoords(target)
    const OFFSET_PX = 80 // 마커/카드가 화면 아래쪽에 조금 보이도록
    pt.y -= OFFSET_PX
    const adjusted = projection.coordsFromPoint(pt)

    // 4) 단일 애니메이션 이동
    map.panTo(adjusted)
  }, [selectedStoreId, isMapReady, stores])

  // 스토어 마커 & 오버레이 생성 (selectedStoreId와 독립)
  useEffect(() => {
    if (!mapInstance.current || !isMapReady) return
    const map = mapInstance.current

    // 기존 제거
    storeMarkersInstance.current.forEach(({ marker, nameOverlay, detailOverlay }) => {
      marker.setMap(null)
      nameOverlay.setMap(null)
      detailOverlay.setMap(null)
    })
    storeMarkersInstance.current = []

    stores.forEach((store) => {
      if (!store.lat || !store.lng) return

      const pos = new window.kakao.maps.LatLng(store.lat, store.lng)
      const fillColor = getMarkerColor(store)

      // 마커 이미지
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
        map,
      })

      // 2) 상시 이름 오버레이
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
      nameEl.addEventListener('click', (e) => e.stopPropagation())
      nameEl.addEventListener('mousedown', (e) => e.stopPropagation())
      nameEl.addEventListener('touchstart', (e) => e.stopPropagation(), { passive: true })

      const nameOverlay = new window.kakao.maps.CustomOverlay({
        content: nameEl,
        position: pos,
        yAnchor: -0.3,
        zIndex: 20,
      })
      nameOverlay.setMap(map)

      // 3) 상세 카드 오버레이
      const detailEl = createStoreOverlayElement(store)
      detailEl.addEventListener('click', (e) => e.stopPropagation())
      detailEl.addEventListener('mousedown', (e) => e.stopPropagation())
      detailEl.addEventListener('touchstart', (e) => e.stopPropagation(), { passive: true })

      const detailOverlay = new window.kakao.maps.CustomOverlay({
        content: detailEl,
        position: pos,
        yAnchor: 1.1,
        zIndex: 30,
      })

      // ✅ 마커 클릭: 선택만 토글 (이동은 selection effect에서 1회 panTo)
      window.kakao.maps.event.addListener(marker, 'click', () => {
        onSelectStore(store.id)
      })

      storeMarkersInstance.current.push({ marker, nameOverlay, detailOverlay, store })
    })
  }, [stores, isMapReady]) // selectedStoreId 제외!

  if (!userLocation) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-gray-100">
        <p className="text-gray-500">위치 정보를 불러오는 중...</p>
      </div>
    )
  }

  return <div ref={mapContainer} style={{ width: '100%', height: '100%' }} />
}