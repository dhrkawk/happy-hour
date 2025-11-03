"use client"

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button, type ButtonProps } from "@/components/ui/button";

type AlertDialogBasicProps = {
  open: boolean;
  title?: string;
  message: string;
  okText?: string;
  onOpenChange?: (open: boolean) => void;
  onOk?: () => void;
  // 스타일 옵션 (전역 기본값은 #3B82F6)
  okVariant?: ButtonProps["variant"];
  okClassName?: string;
};

export default function AlertDialogBasic({
  open,
  title = "알림",
  message,
  okText = "확인",
  onOpenChange,
  onOk,
  okVariant = "default",
  okClassName = "bg-[#3B82F6] hover:bg-[#3B82F6] text-white focus-visible:ring-[#3B82F6]",
}: AlertDialogBasicProps) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription>{message}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogAction asChild>
            <Button variant={okVariant} onClick={onOk} className={okClassName}>
              {okText}
            </Button>
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
