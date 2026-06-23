import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "SMS 본문 점검",
  description:
    "마케팅 발송 본문 오탈자 검사, 광고성/정보성 AI 분류, 메시지 트렌드 분석",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko">
      <body className="bg-slate-50 text-slate-800">{children}</body>
    </html>
  );
}
