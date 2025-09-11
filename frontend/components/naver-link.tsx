import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ExternalLink } from "lucide-react";

export function GoToStoreButton({ naverLink }: { naverLink: string | null }) {
  if (!naverLink) return null; // 링크 없으면 버튼 숨김

  return (
    <Link href={naverLink} target="_blank" rel="noopener noreferrer">
      <Button
        variant="outline"
        className="px-1 gap-1 text-blue-600 hover:text-blue-700 hover:border-blue-400 text-sm"
      >
        가게 정보
        <ExternalLink className="h-2 w-2" />
      </Button>
    </Link>
  );
}