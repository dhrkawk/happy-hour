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

// 가격을 한국 통화 형식으로 포맷
export function formatPrice(price: number): string {
  return new Intl.NumberFormat('ko-KR').format(price);
}

// 현재 시간이 할인 기간 내에 있는지 확인
export function isDiscountActive(startTime: string, endTime: string): boolean {
  const now = new Date();
  const start = new Date(startTime);
  const end = new Date(endTime);
  return now >= start && now <= end;
}

// Supabase Storage에서 이미지 URL 가져오기
export function getPublicUrl(bucketName: string, path: string): string {
  const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!SUPABASE_URL) {
    console.error("NEXT_PUBLIC_SUPABASE_URL is not defined");
    return "";
  }
  return `${SUPABASE_URL}/storage/v1/object/public/${bucketName}/${path}`;
}

// 이미지 로딩 오류 처리
export function handleImageError(event: React.SyntheticEvent<HTMLImageElement, Event>) {
  event.currentTarget.src = '/no-image.jpg'; // 대체 이미지 경로
  event.currentTarget.onerror = null; // 무한 루프 방지
}

export const getStatusInfo = (status: string) => {
  switch (status) {
    case "confirmed":
      return { label: "예약확정", color: "bg-blue-500 text-white", description: "예약이 확정되었습니다." };
    case "used":
      return { label: "방문완료", color: "bg-green-500 text-white", description: "방문이 완료되었습니다." };
    case "cancelled":
      return { label: "예약취소", color: "bg-red-500 text-white", description: "예약이 취소되었습니다." };
    case "active":
      return { label: "예약확정", color: "bg-blue-500 text-white", description: "예약이 확정되었습니다." };
    default:
      return { label: "알 수 없음", color: "bg-gray-500 text-white", description: "" };
  }
};

type DiscountStatus = "scheduled" | "active" | "expired";
export function getDiscountStatus(start: string, end: string, isActive: boolean): DiscountStatus {
  if (!isActive) return "expired"; // 비활성화된 할인은 만료 상태로 간주
  const now = new Date();
  const startTime = new Date(start);
  const endTime = new Date(end);

  if (now < startTime) return "scheduled";
  if (now > endTime) return "expired";
  return "active";
}