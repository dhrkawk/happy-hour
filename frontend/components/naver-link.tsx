import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ExternalLink, ArrowUpRight } from "lucide-react";

export function GoToStoreButton({ naverLink }: { naverLink: string | null }) {
  if (!naverLink) return null;

  return (
    <Link href={naverLink} target="_blank" rel="noopener noreferrer">
      <Button
        variant="outline"
        className="h-6 px-2 text-blue-600 hover:text-blue-700 
                   hover:border-blue-400 text-xs leading-none rounded-md"
      >
        <ArrowUpRight className="h-2 w-2" />
        길찾기
      </Button>
    </Link>
  );
}