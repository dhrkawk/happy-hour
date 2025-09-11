import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MapPin } from "lucide-react";
import type { StoreListItemVM } from "@/lib/vm/store.vm";

type Props = {
  vm: StoreListItemVM;
  selected?: boolean;
  onSelect?: (id: string) => void;
};

export function StoreCard2({ vm, selected = false, onSelect }: Props) {
  const hasBadges = !!(vm.partershipText || vm.hasEvent || vm.maxDiscountRate);

  return (
    <Card
      role="button"
      tabIndex={0}
      onClick={() => onSelect?.(vm.id)}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onSelect?.(vm.id);
        }
      }}
      className={[
        "w-full rounded-xl border transition-all duration-200 overflow-hidden mb-0.5 cursor-pointer",
        "bg-white hover:shadow-md",
        selected ? "border-blue-400 ring-2 ring-blue-100 bg-blue-50/40" : "border-gray-200",
      ].join(" ")}
    >
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
            <div className="flex gap-3">
              <h3 className="text-[16px] md:text-lg font-semibold text-gray-900 truncate">
                {vm.name}
              </h3>
              {vm.partershipText && (
                <Badge
                  variant="outline"
                  className="px-1.5 py-0.5 mt-1 mb-1 text-[10px] border-blue-200 text-blue-600 bg-blue-50 leading-none"
                  title={vm.partershipText ?? undefined}
                >
                  한양대 제휴
                </Badge>
              )}
            </div>

            <div className="mt-0.5 flex items-center gap-2 min-w-0">
              <div className="flex items-center gap-1 text-xs text-gray-600 min-w-0">
                <MapPin className="w-3 h-3 shrink-0" />
                <span className="truncate">{vm.distanceText ?? vm.address}</span>
              </div>

              {vm.category && (
                <span className="bg-gray-100 px-2 py-[2px] rounded text-[11px] md:text-xs font-medium shrink-0">
                  {vm.category}
                </span>
              )}
            </div>

            <div className="mt-2 min-h-[22px] flex items-center gap-x-2 gap-y-1 flex-wrap">
              {vm.hasEvent ? (
                <Badge className="text-[11px] md:text-xs px-2 py-[2px] bg-green-50 text-green-700 border border-green-200 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
                  이벤트 진행중
                </Badge>
              ) : (
                <Badge className="text-[11px] md:text-xs px-2 py-[2px] bg-gray-50 text-gray-700 border border-gray-200 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 bg-gray-400 rounded-full" />
                  이벤트 준비중
                </Badge>
              )}

              {typeof vm.maxDiscountRate === "number" && (
                <Badge className="text-[11px] md:text-xs px-2 py-[2px] bg-red-50 text-red-700 border border-red-200 flex items-center gap-1">
                  최대 {vm.maxDiscountRate}% 할인
                </Badge>
              )}

              {!hasBadges && <span className="invisible text-[11px]">placeholder</span>}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}