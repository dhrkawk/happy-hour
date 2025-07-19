"use client"

import { useEffect, useRef } from "react"

interface NaverMapProps {
  userLocation: {
    lat: number
    lng: number
  } | null
}

declare global {
  interface Window {
    naver: any
  }
}

export default function NaverMap({ userLocation }: NaverMapProps) {
  const mapElement = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (typeof window === "undefined" || !window.naver) return

    const { naver } = window
    if (!mapElement.current) return

    const center = userLocation
      ? new naver.maps.LatLng(userLocation.lat, userLocation.lng)
      : new naver.maps.LatLng(37.5665, 126.978) // Default to Seoul if no location

    const mapOptions = {
      center,
      zoom: 15,
      zoomControl: true,
      zoomControlOptions: {
        style: naver.maps.ZoomControlStyle.SMALL,
        position: naver.maps.Position.TOP_RIGHT,
      },
    }

    const map = new naver.maps.Map(mapElement.current, mapOptions)

    if (userLocation) {
      new naver.maps.Marker({
        position: new naver.maps.LatLng(userLocation.lat, userLocation.lng),
        map,
      })
    }
  }, [userLocation])

  return <div ref={mapElement} style={{ width: "100%", height: "100%" }} />
}
