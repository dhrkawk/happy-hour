import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MapPin, Percent } from "lucide-react";
import type { StoreListItemVM } from "@/lib/vm/store.vm";

type Props = { vm: StoreListItemVM };

export function StoreCard({ vm }: Props) {

  return (
    <Card className="w-full bg-white rounded-xl border border-gray-200 hover:shadow-md transition-all duration-200 overflow-hidden">
      <CardContent className="p-3 md:p-4">
        <div className="flex items-center gap-3 md:gap-4">
          {/* 썸네일 */}
          <div className="w-14 h-14 md:w-16 md:h-16 bg-gray-200 rounded-lg overflow-hidden shrink-0">
            <img
              src={vm.thumbnail || "/placeholder.svg"}
              alt={vm.name || "store"}
              className="w-full h-full object-cover"
              loading="lazy"
            />
          </div>

          {/* 정보 */}
          <div className="flex-1 min-w-0">
            {/* 상단: 이름 + 거리/카테고리 */}
            <div className="flex items-center gap-2 flex-wrap min-w-0">
              <h3 className="text-[15px] md:text-base font-semibold text-gray-900 truncate">
                {vm.name}
              </h3>

              <div className="flex items-center gap-1 text-[13px] md:text-sm text-gray-600 min-w-0">
                <MapPin className="w-4 h-4 shrink-0" />
                <span className="truncate">{vm.distanceText ?? vm.address}</span>
              </div>

              {vm.category && (
                <span className="bg-gray-100 px-2 py-[2px] rounded text-[11px] md:text-xs font-medium">
                  {vm.category}
                </span>
              )}
            </div>

            {/* 하단: 배지들 (제휴 / 진행중 / 최대할인) */}
            <div className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 justify-between md:justify-start">
              <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                {vm.partnership && (
                  <Badge
                    variant="outline"
                    className="text-[11px] md:text-xs px-2 py-[2px] border-blue-200 text-blue-600 bg-blue-50"
                    title={vm.partnership ?? undefined}
                  >
                    한양대 제휴
                  </Badge>
                )}

                {vm.hasEvent && (
                  <Badge className="text-[11px] md:text-xs px-2 py-[2px] bg-green-50 text-green-700 border border-green-200 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
                    이벤트 진행중
                  </Badge>
                )}

                {vm.maxDiscountRate && (
                  <Badge className="text-[11px] md:text-xs px-2 py-[2px] bg-rose-500 text-white flex items-center gap-1">
                    최대 {vm.maxDiscountRate}% 할인
                  </Badge>
                )}
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}