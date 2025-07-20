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
  stores: any[] // Add stores prop
}

export default function KakaoMap({ userLocation, stores }: KakaoMapProps) {
  const mapContainer = useRef<HTMLDivElement>(null)
  const mapInstance = useRef<any>(null)
  const userMarkerInstance = useRef<any>(null)
  const storeMarkersInstance = useRef<any[]>([]) // To store store markers

  // Effect for script loading and initial map creation
  useEffect(() => {
    if (window.kakao && window.kakao.maps) {
      initMap()
      return
    }

    const script = document.createElement('script')
    script.src = `//dapi.kakao.com/v2/maps/sdk.js?appkey=${process.env.NEXT_PUBLIC_KAKAO_MAPS_APP_KEY}&autoload=false`
    script.async = true
    script.onload = () => {
      window.kakao.maps.load(initMap)
    }
    document.head.appendChild(script)
  }, []) // Runs only once

  // Effect for updating map when userLocation changes
  useEffect(() => {
    if (!mapInstance.current || !userLocation) {
      return
    }

    const { lat, lng } = userLocation
    const newCenter = new window.kakao.maps.LatLng(lat, lng)

    // Move map center
    mapInstance.current.panTo(newCenter)

    // Create or move the marker
    if (userMarkerInstance.current) {
      userMarkerInstance.current.setPosition(newCenter)
    } else {
      // Define a custom SVG for the marker
      const svgMarker = '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><circle cx="12" cy="12" r="9" fill="#3B82F6" stroke="white" stroke-width="2"/></svg>';
      
      // Create a data URI from the SVG
      const markerImageSrc = `data:image/svg+xml;base64,${btoa(svgMarker)}`;
      
      const imageSize = new window.kakao.maps.Size(24, 24);
      const imageOption = { offset: new window.kakao.maps.Point(12, 12) }; // Center the marker on its coordinates

      const markerImage = new window.kakao.maps.MarkerImage(
        markerImageSrc,
        imageSize,
        imageOption
      );

      const marker = new window.kakao.maps.Marker({
        position: newCenter,
        image: markerImage, // Set the custom marker image
      });

      marker.setMap(mapInstance.current);
      userMarkerInstance.current = marker;
    }
  }, [userLocation]) // Runs when userLocation changes

  // Effect for displaying store markers
  useEffect(() => {
    if (!mapInstance.current || !stores) {
      return
    }

    // Clear existing store markers
    storeMarkersInstance.current.forEach(marker => marker.setMap(null));
    storeMarkersInstance.current = [];

    // Define a custom SVG for store markers (red circle)
    const storeSvgMarker = '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><circle cx="12" cy="12" r="9" fill="#EF4444" stroke="white" stroke-width="2"/></svg>';
    const storeMarkerImageSrc = `data:image/svg+xml;base64,${btoa(storeSvgMarker)}`;
    const storeImageSize = new window.kakao.maps.Size(24, 24);
    const storeImageOption = { offset: new window.kakao.maps.Point(12, 12) };

    const storeMarkerImage = new window.kakao.maps.MarkerImage(
      storeMarkerImageSrc,
      storeImageSize,
      storeImageOption
    );

    stores.forEach(store => {
      if (store.lat && store.lng) { // Ensure store has valid coordinates
        const storePosition = new window.kakao.maps.LatLng(store.lat, store.lng);
        const marker = new window.kakao.maps.Marker({
          position: storePosition,
          image: storeMarkerImage, // Set the custom store marker image
          map: mapInstance.current,
        });
        storeMarkersInstance.current.push(marker);
      }
    });

  }, [stores, mapInstance.current]); // Runs when stores or mapInstance changes

  const initMap = () => {
    if (!mapContainer.current) return
    const defaultCenter = new window.kakao.maps.LatLng(37.5665, 126.978) // Seoul
    const mapOption = {
      center: defaultCenter,
      level: 3,
    }
    mapInstance.current = new window.kakao.maps.Map(mapContainer.current, mapOption)
  }

  return <div ref={mapContainer} style={{ width: '100%', height: '100%' }} />
}
