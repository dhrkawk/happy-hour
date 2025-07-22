'use client'

import { useAppContext } from "@/contexts/app-context"

export function LocationErrorBanner() {
  const { appState } = useAppContext()

  if (!appState.location.error) return null

  return (
    <div className="bg-red-100 text-red-700 p-2 flex justify-between items-center text-xs rounded">
      {appState.location.error}
      {appState.location.error === "위치 정보 제공에 동의가 필요합니다." && (
        <button
          className="ml-2 underline"
          onClick={() =>
            alert(
              '브라우저 설정에서 위치 권한을 허용해주세요.\n(크롬 기준: 주소창 왼쪽 🔒 클릭 → 사이트 설정 → 위치 허용)'
            )
          }
        >
          위치 설정 방법 보기
        </button>
      )}
    </div>
  )
}