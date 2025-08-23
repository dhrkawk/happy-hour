import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers"; // 여기 import

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "해피아워 - 할인 가게 찾기",
  description: "현재 위치 기반 할인 가게를 찾아보세요",
  generator: "v0.dev",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko">
      <body className={inter.className}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}