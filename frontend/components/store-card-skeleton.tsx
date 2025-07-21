
import { Card, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"

export function StoreCardSkeleton() {
  return (
    <Card className="overflow-hidden">
      <CardContent className="p-0">
        <div className="flex items-center">
          <Skeleton className="w-20 h-20 flex-shrink-0" />
          <div className="flex-1 p-3 space-y-2">
            <Skeleton className="h-4 w-3/4" />
            <div className="flex items-center gap-2">
              <Skeleton className="h-3 w-1/4" />
              <Skeleton className="h-3 w-1/4" />
            </div>
            <div className="flex items-center gap-2">
              <Skeleton className="h-5 w-1/3 rounded-full" />
              <Skeleton className="h-3 w-1/2" />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
