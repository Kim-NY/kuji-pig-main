import './globals.css';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: '쿠지돼지 관리 시스템',
  description: '수량 관리 및 포인트 조회 페이지',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko">
      <body>{children}</body>
    </html>
  );
}
