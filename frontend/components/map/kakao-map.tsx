'use client'

import { useEffect, useRef, useState } from 'react'
import { StoreCardViewModel } from '@/lib/viewmodels/store-card.viewmodel'
import { SEMANTIC_COLORS } from '@/lib/constants/colors';

export const MARKER_COLOR_DEFAULT = SEMANTIC_COLORS.default[500];   // Gray-400
export const MARKER_COLOR_DISCOUNT = SEMANTIC_COLORS.discount[500];  // Orange-500 (해피아워)
export const MARKER_COLOR_PARTNERSHIP = SEMANTIC_COLORS.partnership[500]; // Blue-500 (제휴 매장)
export const MARKER_COLOR_USER = SEMANTIC_COLORS.user[500]; // Blue-500 (사용자 위치)

const getMarkerColor = (store: StoreCardViewModel) => {
  if (store.maxDiscountRate > 0) return MARKER_COLOR_DISCOUNT;
  return MARKER_COLOR_DEFAULT;
};

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
  stores: StoreCardViewModel[]
  selectedStoreId: string | null
  onSelectStore: (storeId: string | null) => void
}

export default function KakaoMap({ userLocation, stores, selectedStoreId, onSelectStore }: KakaoMapProps) {
  const mapContainer = useRef<HTMLDivElement>(null)
  const mapInstance = useRef<any>(null)
  const userMarkerInstance = useRef<any>(null)
  const storeMarkersInstance = useRef<any[]>([])
  const [isMapReady, setIsMapReady] = useState(false)

  const initMap = (lat: number, lng: number) => {
    if (!mapContainer.current) return

    const center = new window.kakao.maps.LatLng(lat, lng)
    const mapOption = {
      center: center,
      level: 3,
    }
    mapInstance.current = new window.kakao.maps.Map(mapContainer.current, mapOption)
    setIsMapReady(true)
  }

  useEffect(() => {
    if (window.kakao && window.kakao.maps) {
      if (!mapInstance.current && userLocation) {
        initMap(userLocation.lat, userLocation.lng)
      }
      return
    }

    const script = document.createElement('script')
    script.src = `//dapi.kakao.com/v2/maps/sdk.js?appkey=${process.env.NEXT_PUBLIC_KAKAO_MAPS_APP_KEY}&autoload=false`
    script.async = true
    script.onload = () => {
      window.kakao.maps.load(() => {
        if (!mapInstance.current && userLocation) {
          initMap(userLocation.lat, userLocation.lng)
        }
      })
    }
    document.head.appendChild(script)
  }, [userLocation])

  // 사용자 위치 마커 업데이트
  useEffect(() => {
    if (!mapInstance.current || !userLocation || !isMapReady) return

    const userPosition = new window.kakao.maps.LatLng(userLocation.lat, userLocation.lng)

    // 지도 중심 이동
    mapInstance.current.panTo(userPosition)

    // 마커 생성 또는 위치 업데이트
    if (userMarkerInstance.current) {
      userMarkerInstance.current.setPosition(userPosition)
    } else {
      const svgMarker = `
      <svg xmlns="http://www.w3.org/2000/svg" width="36" height="36" viewBox="0 0 36 36">
        <circle cx="18" cy="18" r="16" fill="${MARKER_COLOR_USER}" stroke="white" stroke-width="2" />
        <circle cx="18" cy="18" r="6" fill="white" />
      </svg>`;
      const markerImageSrc = `data:image/svg+xml;base64,${btoa(svgMarker)}`
      const imageSize = new window.kakao.maps.Size(20, 20)
      const imageOption = { offset: new window.kakao.maps.Point(10, 10) }

      const markerImage = new window.kakao.maps.MarkerImage(markerImageSrc, imageSize, imageOption)

      const marker = new window.kakao.maps.Marker({
        position: userPosition,
        image: markerImage,
        zIndex: 20,
      })

      marker.setMap(mapInstance.current)
      userMarkerInstance.current = marker
    }
  }, [userLocation, mapInstance.current, isMapReady])

  // 가게 마커 업데이트
  useEffect(() => {
    if (!mapInstance.current || !stores || !isMapReady) return

    // 기존 마커 제거
    storeMarkersInstance.current.forEach(marker => marker.setMap(null))
    storeMarkersInstance.current = []

    stores.forEach(store => {
      if (store.lat && store.lng) {
        const storePosition = new window.kakao.maps.LatLng(store.lat, store.lng);
        const fillColor = getMarkerColor(store)
        const width = 32
        const height = 40

        const storeSvgMarker = `
        <svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 32 40" fill="none">
          <path d="M16 0C7.16 0 0 7.16 0 16C0 26 16 40 16 40C16 40 32 26 32 16C32 7.16 24.84 0 16 0Z" fill="${fillColor}"/>
          <circle cx="16" cy="16" r="6" fill="white"/>
        </svg>`;
        const storeMarkerImageSrc = `data:image/svg+xml;base64,${btoa(storeSvgMarker)}`
        const storeImageSize = new window.kakao.maps.Size(32, 32)
        const storeImageOption = { offset: new window.kakao.maps.Point(16, 20) }


        const storeMarkerImage = new window.kakao.maps.MarkerImage(storeMarkerImageSrc, storeImageSize, storeImageOption)
    
        // 📍 1. 마커 생성
        const marker = new window.kakao.maps.Marker({
          position: storePosition,
          image: storeMarkerImage,
          map: mapInstance.current,
        });
    
        // 🟦 2. 항상 표시되는 "이름" 오버레이
        // 오버레이 이름 + 🤝 이모지 추가
        const nameLabel = document.createElement("div")
        const displayName = store.partnership ? `🤝 ${store.name}` : store.name
        nameLabel.innerHTML = `
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
          </div>`;
        const nameOverlay = new window.kakao.maps.CustomOverlay({
          content: nameLabel,
          position: storePosition,
          yAnchor: -0.3,
          zIndex: 20,
        });
        nameOverlay.setMap(mapInstance.current);
    
        // 🟥 3. hover 시 표시되는 상세 오버레이
        const detailBox = document.createElement("div");
        detailBox.innerHTML = `
          <div style="
            background: white;
            border: 1px solid #ddd;
            padding: 10px;
            border-radius: 8px;
            box-shadow: 0 2px 6px rgba(0,0,0,0.1);
            font-size: 12px;
            width: 200px;
          ">
            <strong style="color:#1E40AF">${store.name}</strong><br/>
            ${store.timeLeftText}<br/>
            카테고리: ${store.category}<br/>
            최대 ${store.maxDiscountRate ?? 0}% 할인
          </div>
        `;
        const detailOverlay = new window.kakao.maps.CustomOverlay({
          content: detailBox,
          position: storePosition,
          yAnchor: 1.1,
          zIndex: 20,
        });
    
        // 🧠 hover 이벤트 등록
        window.kakao.maps.event.addListener(marker, 'mouseover', () => {
          detailOverlay.setMap(mapInstance.current);
        });
        window.kakao.maps.event.addListener(marker, 'mouseout', () => {
          detailOverlay.setMap(null);
        });
    
        // ✅ 클릭 시 store 선택
        window.kakao.maps.event.addListener(marker, 'click', () => {
          mapInstance.current.panTo(storePosition); // ✅ 중심 이동 추가!
          onSelectStore(store.id);
        });
    
        storeMarkersInstance.current.push(marker);
      }
    });
  }, [stores, mapInstance.current, onSelectStore, isMapReady]); 

  if (!userLocation) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-gray-100">
        <p className="text-gray-500">위치 정보를 불러오는 중...</p>
      </div>
    )
  }

  return (
    <>
      <div ref={mapContainer} style={{ width: '100%', height: '100%' }} />
    </>
  )
  }