import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MapPin, Calendar, Clock, Percent } from "lucide-react";
import type { StoreListItemVM } from "@/hooks/stores/store-list.viewmodel";

type Props = { vm: StoreListItemVM };

export function StoreCard({ vm }: Props) {
  // “최대 할인 이벤트”가 지정되어 있다면 그 이벤트를 우선 노출
  const topEvent =
    (vm.storeTopEventId && vm.events.find(e => e.id === vm.storeTopEventId)) ||
    vm.events?.[0];

  const hasDiscount =
    typeof vm.storeMaxDiscountRate === "number" &&
    Number.isFinite(vm.storeMaxDiscountRate);

  const hasPricePair =
    typeof vm.storeDiscountPrice === "number" &&
    typeof vm.storeOriginalPrice === "number";

  return (
    <Card className="overflow-hidden hover:shadow-lg transition-shadow border-gray-100">
      <CardContent className="p-0">
        <div className="flex items-center">
          {/* 썸네일 */}
          <div className="w-20 h-20 bg-gray-100 flex-shrink-0">
            <img
              src={vm.thumbnailUrl}
              alt={vm.name}
              className="w-full h-full object-cover"
            />
          </div>

          {/* 본문 */}
          <div className="flex-1 p-3">
            <div className="flex items-start justify-between gap-3">
              {/* 좌측 정보 */}
              <div className="flex-1 min-w-0">
                {/* 상단: 상호 + 상태/뱃지들 */}
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="font-semibold text-gray-800 text-sm line-clamp-1">
                    {vm.name}
                  </h3>

                  {/* 활성 상태 뱃지 */}
                  {vm.isActiveBadge && (
                    <Badge className="bg-teal-500 hover:bg-teal-600 text-white text-[10px]">
                      {vm.isActiveBadge}
                    </Badge>
                  )}

                  {/* 제휴 뱃지 */}
                  {vm.partnershipText && (
                    <Badge className="bg-purple-500 hover:bg-purple-600 text-white text-[10px]">
                      {vm.partnershipText}
                    </Badge>
                  )}

                  {/* 최대 할인 뱃지 */}
                  {hasDiscount && (
                    <Badge className="bg-rose-500 hover:bg-rose-600 text-white text-[10px] flex items-center gap-1">
                      <Percent className="w-3 h-3" />
                      최대 {vm.storeMaxDiscountRate}%
                    </Badge>
                  )}
                </div>

                {/* 주소/거리/카테고리 */}
                <div className="flex items-center gap-2 mt-1 text-xs text-gray-500 flex-wrap">
                  <div className="flex items-center gap-1">
                    <MapPin className="w-3 h-3" />
                    <span className="truncate">
                      {vm.distanceText ?? vm.addressText}
                    </span>
                  </div>
                  {vm.categoryText && (
                    <span className="text-gray-400">· {vm.categoryText}</span>
                  )}
                </div>

                {/* 이벤트 요약 */}
                {topEvent && (
                  <div className="mt-2 space-y-1">
                    {/* 진행 상태 + 제목 */}
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary" className="text-[10px]">
                        {topEvent.statusText}
                      </Badge>
                      <span className="text-xs font-medium text-gray-800 line-clamp-1">
                        {topEvent.title}
                      </span>
                    </div>

                    {/* 기간/해피아워/요일 */}
                    <div className="flex items-center gap-3 text-[11px] text-gray-500 flex-wrap">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {topEvent.periodText}
                      </span>

                      {topEvent.happyHourText && (
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {topEvent.happyHourText}
                        </span>
                      )}

                      {topEvent.weekdaysText && (
                        <span className="text-gray-400">{topEvent.weekdaysText}</span>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* 우측: 가격/작성일 */}
              <div className="text-right shrink-0">
                {/* 가격(최대 할인 기준) */}
                {hasPricePair && (
                  <>
                    <div className="text-[10px] text-gray-400 line-through">
                      {vm.storeOriginalPrice!.toLocaleString()}원
                    </div>
                    <div className="text-sm font-bold text-teal-600">
                      {vm.storeDiscountPrice!.toLocaleString()}원
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}