import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "EasyBrain - 세컨드 브레인 Task 관리",
  description: "확장성과 멀티 플랫폼 사용성을 갖춘 Task 관리 서비스",
  manifest: "/manifest.json",
  themeColor: "#ffffff",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "EasyBrain",
  },
  viewport: {
    width: "device-width",
    initialScale: 1,
    maximumScale: 1,
    userScalable: false,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body>{children}</body>
    </html>
  );
}
