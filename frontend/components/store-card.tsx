import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MapPin } from "lucide-react";
import type { StoreListItemVM } from "@/lib/vm/store.vm";

type Props = { vm: StoreListItemVM };

export function StoreCard({ vm }: Props) {
  const hasBadges = !!(vm.partershipText || vm.hasEvent || vm.maxDiscountRate);

  return (
    <Card className="w-full bg-white rounded-xl border border-gray-200 hover:shadow-md transition-all duration-200 overflow-hidden mb-0.5">
      <CardContent className="p-3 md:p-4">
        <div className="flex items-center gap-3 md:gap-4">
          {/* 썸네일 */}
          <div className="w-20 h-20 md:w-16 md:h-16 bg-gray-200 rounded-lg overflow-hidden shrink-0">
            <img
              src={vm.thumbnail || "/placeholder.svg"}
              alt={vm.name || "store"}
              className="w-full h-full object-cover"
              loading="lazy"
            />
          </div>

          {/* 정보 영역 */}
          <div className="flex-1 min-w-0">
            {/* 가게명 */}
            <div className="flex gap-3">
            <h3 className="text-[16px] md:text-lg font-semibold text-gray-900 truncate">
              {vm.name}
            </h3>
            {vm.partershipText && (
                <Badge
                  variant="outline"
                  className="text-[11px] md:text-xs px-2 py-[2px] border-blue-200 text-blue-600 bg-blue-50"
                  title={vm.partershipText ?? undefined}
                >
                  한양대 제휴
                </Badge>
              )}
            </div>

            {/* 거리 + 카테고리 */}
            <div className="mt-0.5 flex items-center gap-2 min-w-0">
              <div className="flex items-center gap-1 text-[13px] md:text-sm text-gray-600 min-w-0">
                <MapPin className="w-4 h-4 shrink-0" />
                <span className="truncate">{vm.distanceText ?? vm.address}</span>
              </div>

              {vm.category && (
                <span className="bg-gray-100 px-2 py-[2px] rounded text-[11px] md:text-xs font-medium shrink-0">
                  {vm.category}
                </span>
              )}
            </div>

            {/* 배지 영역 (제휴 / 이벤트 / 최대할인) */}
            <div className="mt-2 min-h-[22px] flex items-center gap-x-2 gap-y-1 flex-wrap">
              {vm.hasEvent ? (
                // 이벤트 진행중
                <Badge className="text-[11px] md:text-xs px-2 py-[2px] bg-green-50 text-green-700 border border-green-200 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
                  이벤트 진행중
                </Badge>
              ) : (
                // 이벤트 준비중
                <Badge className="text-[11px] md:text-xs px-2 py-[2px] bg-gray-50 text-gray-700 border border-gray-200 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 bg-gray-400 rounded-full" />
                  이벤트 준비중
                </Badge>
              )}

              {typeof vm.maxDiscountRate === "number" && (
                <Badge className="ext-[11px] md:text-xs px-2 py-[2px] bg-red-50 text-red-700 border border-red-200 flex items-center gap-1">
                  최대 {vm.maxDiscountRate}% 할인
                </Badge>
              )}

              {/* 배지가 아무것도 없을 때 높이 확보 */}
              {!hasBadges && (
                <span className="invisible text-[11px]">placeholder</span>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}