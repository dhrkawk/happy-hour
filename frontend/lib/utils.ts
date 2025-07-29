import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Haversine 공식을 사용하여 두 지점 간의 거리를 계산 (단위: km)
export function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number) {
  if (!lat1 || !lon1 || !lat2 || !lon2) return 0
  const R = 6371 // 지구 반지름 (킬로미터)
  const dLat = (lat2 - lat1) * Math.PI / 180
  const dLon = (lon2 - lon1) * Math.PI / 180
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return R * c
}

// 남은 시간을 계산하여 보기 좋은 형식으로 반환
export function formatTimeLeft(endTime: string): string {
  const now = new Date()
  const end = new Date(endTime)
  const diff = end.getTime() - now.getTime()

  if (diff <= 0) {
    return "할인 종료"
  }

  const seconds = Math.floor(diff / 1000)
  const minutes = Math.floor(seconds / 60)
  const hours = Math.floor(minutes / 60)
  const days = Math.floor(hours / 24)

  if (days > 0) {
    return `${days}일 남음`
  } else if (hours > 0) {
    const remainingMinutes = minutes % 60;
    return `${hours}시간 ${remainingMinutes}분 남음`
  } else if (minutes > 0) {
    return `${minutes}분 남음`
  } else {
    return `${seconds}초 남음`
  }
}