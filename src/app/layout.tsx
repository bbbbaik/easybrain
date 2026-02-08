import type { Metadata, Viewport } from "next";
import "./globals.css";
import { Providers } from "@/components/Providers";
import { QuickCapture } from "@/components/QuickCapture";

export const metadata: Metadata = {
  title: "EasyBrain - 세컨드 브레인 Task 관리",
  description: "확장성과 멀티 플랫폼 사용성을 갖춘 Task 관리 서비스",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "EasyBrain",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#3182F6",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <head>
        <link
          rel="stylesheet"
          as="style"
          crossOrigin="anonymous"
          href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/static/pretendard.min.css"
        />
      </head>
      <body className="font-sans antialiased tracking-tight bg-[#F9FAFB] min-h-screen">
        <Providers>
          {children}
          <QuickCapture />
        </Providers>
      </body>
    </html>
  );
}
