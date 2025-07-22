'use client'

import { useEffect, useRef, useState, useCallback } from 'react'

declare global {
  interface Window {
    kakao: any
  }
}

interface AddressSearchMapProps {
  onAddressSelect: (address: string, lat: number, lng: number) => void
}

interface Place {
  place_name: string
  road_address_name: string
  address_name: string
  y: number
  x: number
}

export default function AddressSearchMap({ onAddressSelect }: AddressSearchMapProps) {
  const mapContainer = useRef<HTMLDivElement>(null)
  const mapInstance = useRef<any>(null)
  const markerInstance = useRef<any>(null)
  const geocoderInstance = useRef<any>(null)
  const placesInstance = useRef<any>(null)

  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<Place[]>([])
  const [isManuallyTyping, setIsManuallyTyping] = useState(true) // New state to track manual typing

  const initMap = useCallback((lat: number, lng: number) => {
    if (!mapContainer.current) return

    const center = new window.kakao.maps.LatLng(lat, lng)
    const mapOption = {
      center: center,
      level: 3,
    }
    mapInstance.current = new window.kakao.maps.Map(mapContainer.current, mapOption)
    geocoderInstance.current = new window.kakao.maps.services.Geocoder()
    placesInstance.current = new window.kakao.maps.services.Places()

    window.kakao.maps.event.addListener(mapInstance.current, 'click', (mouseEvent: any) => {
      const latlng = mouseEvent.latLng
      updateMarkerAndAddress(latlng.getLat(), latlng.getLng())
      setIsManuallyTyping(false) // Map click, so not manually typing
    })
  }, [])

  const updateMarkerAndAddress = useCallback(
    (lat: number, lng: number) => {
      const latlng = new window.kakao.maps.LatLng(lat, lng)

      if (markerInstance.current) {
        markerInstance.current.setPosition(latlng)
      } else {
        markerInstance.current = new window.kakao.maps.Marker({
          position: latlng,
          map: mapInstance.current,
        })
      }
      mapInstance.current.panTo(latlng)

      geocoderInstance.current.coord2Address(lng, lat, (result: any, status: any) => {
        if (status === window.kakao.maps.services.Status.OK) {
          const roadAddress = result[0].road_address ? result[0].road_address.address_name : result[0].address.address_name
          onAddressSelect(roadAddress, lat, lng)
          setSearchQuery(roadAddress) // Update input with the selected address
          setSearchResults([]) // Clear search results
          setIsManuallyTyping(false) // Address selected, so not manually typing
        }
      })
    },
    [onAddressSelect],
  )

  const handleSearch = useCallback(() => {
    if (!searchQuery.trim() || !placesInstance.current || !isManuallyTyping) return // Only search if manually typing

    placesInstance.current.keywordSearch(searchQuery, (data: Place[], status: any) => {
      if (status === window.kakao.maps.services.Status.OK) {
        setSearchResults(data)
      } else {
        setSearchResults([])
      }
    })
  }, [searchQuery, isManuallyTyping]) // Add isManuallyTyping to dependencies

  const handleSelectPlace = (place: Place) => {
    setSearchQuery(place.place_name)
    setSearchResults([])
    updateMarkerAndAddress(place.y, place.x)
    setIsManuallyTyping(false) // Place selected, so not manually typing
  }

  useEffect(() => {
    const script = document.createElement('script')
    script.src = `//dapi.kakao.com/v2/maps/sdk.js?appkey=${process.env.NEXT_PUBLIC_KAKAO_MAPS_APP_KEY}&libraries=services&autoload=false`
    script.async = true
    script.onload = () => {
      window.kakao.maps.load(() => {
        if (navigator.geolocation) {
          navigator.geolocation.getCurrentPosition(
            position => initMap(position.coords.latitude, position.coords.longitude),
            () => initMap(37.5665, 126.978), // Default to Seoul on error
          )
        } else {
          initMap(37.5665, 126.978) // Default to Seoul if not supported
        }
      })
    }
    document.head.appendChild(script)

    return () => {
      document.head.removeChild(script)
    }
  }, [initMap])

  useEffect(() => {
    if (!isManuallyTyping) return // Don't debounce if not manually typing

    const debounce = setTimeout(() => {
      handleSearch()
    }, 300) // 300ms debounce

    return () => clearTimeout(debounce)
  }, [searchQuery, handleSearch, isManuallyTyping]) // Add isManuallyTyping to dependencies

  return (
    <div className="relative">
      <div className="flex gap-2 mb-1">
        <input
          type="text"
          value={searchQuery}
          onChange={e => {
            setSearchQuery(e.target.value)
            setIsManuallyTyping(true) // User is typing
          }}
          placeholder="주소 또는 장소 검색"
          className="flex-grow p-2 border rounded"
        />
      </div>
      {isManuallyTyping && searchResults.length > 0 && (
        <ul className="absolute z-10 w-full bg-white border rounded-md shadow-lg max-h-60 overflow-y-auto">
          {searchResults.map((place, index) => (
            <li
              key={index}
              onClick={() => handleSelectPlace(place)}
              className="p-2 cursor-pointer hover:bg-gray-100"
            >
              <div className="font-semibold">{place.place_name}</div>
              <div className="text-sm text-gray-500">{place.road_address_name || place.address_name}</div>
            </li>
          ))}
        </ul>
      )}
      <div ref={mapContainer} style={{ width: '100%', height: '350px', marginTop: '8px' }} />
    </div>
  )
}
