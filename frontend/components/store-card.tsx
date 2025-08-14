import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { MapPin, Clock } from "lucide-react"
import type { StoreCardViewModel } from "@/lib/viewmodels/store-card.viewmodel"

type Props = {
  vm: StoreCardViewModel
}

export function StoreCard({ vm }: Props) {
  return (
    <Card className="overflow-hidden hover:shadow-lg transition-shadow border-teal-100">
      <CardContent className="p-0">
        <div className="flex items-center">
          <div className="w-20 h-20 bg-gray-200 flex-shrink-0">
            <img
              src={vm.thumbnailUrl}
              alt={vm.name}
              className="w-full h-full object-cover"
            />
          </div>
          <div className="flex-1 p-3">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <h3 className="font-semibold text-gray-800 text-sm">{vm.name}</h3>
                <div className="flex items-center gap-2 mt-1">
                  <div className="flex items-center gap-1 text-xs text-gray-500">
                    <MapPin className="w-3 h-3" />
                    {vm.distanceText}
                  </div>
                  <span className="text-xs text-gray-400">{vm.category}</span>
                </div>
                <div className="flex items-center gap-2 mt-2">
                  {vm.discountDisplay ? (
                    <Badge className="bg-orange-500 hover:bg-orange-600 text-white text-xs">
                      {vm.discountDisplay}
                    </Badge>
                  ) : null}
                  {vm.partnership ? (
                    <Badge className="bg-green-500 hover:bg-green-600 text-white text-xs">
                      한양대 제휴
                    </Badge>
                  ) : null}
                  {vm.hasActiveGift ? (
                    <Badge className="bg-blue-500 hover:bg-blue-600 text-white text-xs">
                      서비스 증정
                    </Badge>
                  ) : null}
                  <div className="flex items-center gap-1 text-xs text-gray-500">
                    <Clock className="w-3 h-3" />
                    {vm.timeLeftText}
                  </div>
                </div>
              </div>
              <div className="text-right">
                {vm.maxDiscountRate ? (
                  <div className="text-xs text-gray-400 line-through">
                    {vm.originalPrice.toLocaleString()}원
                  </div>
                ) : null}
                {vm.maxDiscountRate ? (
                  <div className="text-sm font-bold text-teal-600">
                  {vm.discountPrice.toLocaleString()}원
                  </div>
                ) : null}
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}