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

    const handleMapClick = () => onSelectStore(null)

    window.kakao.maps.event.addListener(mapInstance.current, 'click', handleMapClick)
    // 필요하면 드래그/줌 시에도 닫기:
    // window.kakao.maps.event.addListener(mapInstance.current, 'dragstart', handleMapClick)
    // window.kakao.maps.event.addListener(mapInstance.current, 'zoom_changed', handleMapClick)

    return () => {
      window.kakao.maps.event.removeListener(mapInstance.current, 'click', handleMapClick)
      // window.kakao.maps.event.removeListener(mapInstance.current, 'dragstart', handleMapClick)
      // window.kakao.maps.event.removeListener(mapInstance.current, 'zoom_changed', handleMapClick)
    }
  }, [isMapReady, onSelectStore])

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

  // 선택 변경 시: 상세 오버레이 토글 + 이동/줌 앵커 기준
  useEffect(() => {
    if (!mapInstance.current || !isMapReady) return

    let targetPos: any | null = null

    storeMarkersInstance.current.forEach(({ store, detailOverlay }) => {
      if (store.id === selectedStoreId) {
        detailOverlay.setMap(mapInstance.current)
        targetPos = new window.kakao.maps.LatLng(store.lat, store.lng)
      } else {
        detailOverlay.setMap(null)
      }
    })

    if (targetPos) {
      const level = mapInstance.current.getLevel?.() ?? 3;
    
      // 현재 지도 중심 좌표에서 위도 오프셋 계산
      const offsetMeters = 100; // 원하는 만큼 아래로 밀고 싶으면 값 조절 (미터 단위)
      const projection = mapInstance.current.getProjection();
      const point = projection.pointFromCoords(targetPos);
    
      // y좌표를 줄이면 위로 이동 → 결과적으로 화면에서 아래쪽에 표시됨
      point.y -= offsetMeters;
    
      const adjustedPos = projection.coordsFromPoint(point);
    
      if (level > 3 && mapInstance.current.setLevel) {
        mapInstance.current.setLevel(3, { anchor: adjustedPos, animate: true });
      } else {
        mapInstance.current.panTo(adjustedPos);
      }
    }
  }, [selectedStoreId, isMapReady])

  // 스토어 마커 & 오버레이 생성 (선택만 바뀔 때 재생성되지 않도록 selectedStoreId 제외)
  useEffect(() => {
    if (!mapInstance.current || !isMapReady) return

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
        map: mapInstance.current,
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
      // ✅ 이름 오버레이 내부 클릭 전파 차단
      nameEl.addEventListener('click', (e) => e.stopPropagation())
      nameEl.addEventListener('mousedown', (e) => e.stopPropagation())
      nameEl.addEventListener('touchstart', (e) => e.stopPropagation(), { passive: true })

      const nameOverlay = new window.kakao.maps.CustomOverlay({
        content: nameEl,
        position: pos,
        yAnchor: -0.3,
        zIndex: 20,
      })
      nameOverlay.setMap(mapInstance.current)

      // 3) 상세 카드 오버레이 (모달 느낌)
      const detailEl = createStoreOverlayElement(store)
      // ✅ 상세 오버레이 내부 클릭 전파 차단
      detailEl.addEventListener('click', (e) => e.stopPropagation())
      detailEl.addEventListener('mousedown', (e) => e.stopPropagation())
      detailEl.addEventListener('touchstart', (e) => e.stopPropagation(), { passive: true })

      const detailOverlay = new window.kakao.maps.CustomOverlay({
        content: detailEl,
        position: pos,
        yAnchor: 1.1,
        zIndex: 30,
      })

      // 마커 클릭 → 선택 토글 + 중심 이동
      window.kakao.maps.event.addListener(marker, 'click', () => {
        // 이미 선택돼 있으면 닫기, 아니면 선택
        const next = selectedStoreId === store.id ? null : store.id
        onSelectStore(next)
        if (next) {
          mapInstance.current.panTo(pos)
        }
      })

      storeMarkersInstance.current.push({ marker, nameOverlay, detailOverlay, store })
    })
  }, [stores, isMapReady]) // ← selectedStoreId 제외!

  if (!userLocation) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-gray-100">
        <p className="text-gray-500">위치 정보를 불러오는 중...</p>
      </div>
    )
  }

  return <div ref={mapContainer} style={{ width: '100%', height: '100%' }} />
}