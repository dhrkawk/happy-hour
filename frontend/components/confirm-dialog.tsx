"use client"

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button, type ButtonProps } from "@/components/ui/button";

type ConfirmDialogProps = {
  open: boolean;
  title?: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  onOpenChange?: (open: boolean) => void;
  onConfirm: () => void;
  onCancel?: () => void;
  // 스타일 커스터마이즈 옵션
  confirmVariant?: ButtonProps["variant"];
  cancelVariant?: ButtonProps["variant"];
  confirmClassName?: string;
  cancelClassName?: string;
};

export default function ConfirmDialog({
  open,
  title = "확인",
  message,
  confirmText = "확인",
  cancelText = "취소",
  onOpenChange,
  onConfirm,
  onCancel,
  confirmVariant = "default",
  cancelVariant = "outline",
  // 기본 색상: #3B82F6 (blue-500)
  confirmClassName = "bg-[#3B82F6] hover:bg-[#3B82F6] text-white focus-visible:ring-[#3B82F6]",
  cancelClassName = "border-[#3B82F6] text-[#3B82F6] hover:bg-[#3B82F6]/10 focus-visible:ring-[#3B82F6]",
}: ConfirmDialogProps) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription>{message}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel asChild>
            <Button variant={cancelVariant} onClick={onCancel} className={cancelClassName}>
              {cancelText}
            </Button>
          </AlertDialogCancel>
          <AlertDialogAction asChild>
            <Button variant={confirmVariant} onClick={onConfirm} className={confirmClassName}>
              {confirmText}
            </Button>
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
