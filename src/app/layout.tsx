import type { Metadata } from "next";
import { Geist } from "next/font/google";
import "./globals.css";

const geist = Geist({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "ValuTree — AI 밸류에이션 트리",
  description:
    "회사명을 입력하면 AI가 밸류에이션 수식 트리를 자동 생성합니다.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko">
      <body className={`${geist.className} bg-zinc-50 text-zinc-900 antialiased`}>
        {children}
      </body>
    </html>
  );
}
