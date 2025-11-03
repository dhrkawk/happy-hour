// app/layout.tsx
import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import { Providers } from "./providers";

// 👉 SUIT Variable (woff2) 폰트 등록
const suit = localFont({
  variable: "--font-suit",
  src: [
    {
      path: "../public/fonts/SUIT-Variable.woff2",
      weight: "100 900", // Variable font는 범위 지정
      style: "normal",
    },
  ],
  display: "swap",
});

export const metadata: Metadata = {
  title: "OURCAMPUS - 할인 가게 찾기",
  description: "학교 주변 할인 가게를 찾아보세요",
  generator: "v0.dev",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko" className={suit.variable}>
      <body className="font-suit">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}