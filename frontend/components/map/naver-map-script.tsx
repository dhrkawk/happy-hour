"use client"

import Script from "next/script"

export default function NaverMapScript() {
  return (
    <Script
      strategy="beforeInteractive"
      src={`https://openapi.map.naver.com/openapi/v3/maps.js?ncpClientId=${process.env.NEXT_PUBLIC_NAVER_MAPS_CLIENT_ID}`}
    />
  )
}
