'use client';

import { useEffect, useState } from "react";
import Image from "next/image";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

type OnboardingDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

// 슬라이드 데이터: 필요하면 caption을 원하는 문구로 바꿔주세요.
const SLIDES = [
  { src: "/poster1.png", alt: "이용 안내 1", caption: "가게 리스트에서 할인 가게를 찾으세요!" },
  { src: "/poster2.png", alt: "이용 안내 2", caption: "이벤트와 메뉴를 확인하고 담기를 누르세요!" },
  { src: "/poster3.png", alt: "이용 안내 3", caption: "수량을 조절한 후 우측 하단 장바구니를 확인하세요!" },
  { src: "/poster4.png", alt: "이용 안내 4", caption: "교환권 발급하기를 누르세요!" },
  { src: "/poster5.png", alt: "이용 안내 5", caption: "담은 메뉴와 이벤트 조건을 꼭 확인하세요!" },
  { src: "/poster6.png", alt: "이용 안내 6", caption: "쿠폰이 쿠폰함에 잘 담겼습니다!" },
  { src: "/poster7.png", alt: "이용 안내 7", caption: "쿠폰을 사용하기 직전에 쿠폰 사용하기를 눌러주세요!" },
  { src: "/poster8.png", alt: "이용 안내 8", caption: "타이머가 작동하는 동안만 쿠폰을 사용할 수 있어요!" },
];

const ICON_STYLE = {
  prev: "<", // "‹"
  next: ">", // "›"
};

export function OnboardingDialog({ open, onOpenChange }: OnboardingDialogProps) {
  const [step, setStep] = useState(0);

  const isFirst = step === 0;
  const isLast = step === SLIDES.length - 1;

  // 다이얼로그가 다시 열리면 처음으로 리셋
  useEffect(() => {
    if (open) setStep(0);
  }, [open]);

  const handleNext = () => {
    if (isLast) {
      onOpenChange(false); // 마지막이면 닫기
    } else {
      setStep((s) => Math.min(s + 1, SLIDES.length - 1));
    }
  };

  const handlePrev = () => {
    if (!isFirst) {
      setStep((s) => Math.max(s - 1, 0));
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>아워캠퍼스 이용 안내</DialogTitle>
        </DialogHeader>

        {/* 슬라이드 */}
        <div className="flex flex-col items-center">
          <div className="w-full flex justify-center">
            <Image
              src={SLIDES[step].src}
              alt={SLIDES[step].alt}
              width={420}
              height={640}
              // 크기 줄이고, 화면 높이 넘지 않게 제한
              className="mx-auto rounded-lg max-w-[320px] md:max-w-[420px] h-auto max-h-[60vh] object-contain"
              priority={step === 0}
            />
          </div>

          {/* 설명 (caption) */}
          {SLIDES[step].caption && (
            <p className="mt-3 text-sm md:text-base text-gray-600 text-center px-3">
              {SLIDES[step].caption}
            </p>
          )}

          {/* 네비게이션 버튼 */}
          <div className="mt-4 grid grid-cols-2 gap-3 w-full max-w-xs">
            <Button
              type="button"
              onClick={handlePrev}
              disabled={isFirst}
              className="w-full bg-blue-500 hover:bg-blue-600 text-white"
              aria-label="이전으로"
              title="이전으로"
            >
              {ICON_STYLE.prev}
            </Button>

            <Button
              type="button"
              onClick={handleNext}
              className="w-full bg-blue-500 hover:bg-blue-600 text-white"
              aria-label={isLast ? "이제 시작하기" : "다음으로"}
              title={isLast ? "이제 시작하기" : "다음으로"}
            >
              {isLast ? "이제 시작하기" : ICON_STYLE.next}
            </Button>
          </div>

          {/* 진행도 점 */}
          <div className="flex justify-center gap-2 mt-3">
            {SLIDES.map((_, i) => (
              <div
                key={i}
                className={`h-2 w-2 rounded-full transition-colors ${
                  i === step ? "bg-blue-600" : "bg-gray-300"
                }`}
              />
            ))}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}