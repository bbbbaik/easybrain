import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "@/components/Providers";

export const metadata: Metadata = {
  title: "EasyBrain - 세컨드 브레인 Task 관리",
  description: "확장성과 멀티 플랫폼 사용성을 갖춘 Task 관리 서비스",
  manifest: "/manifest.json",
  themeColor: "#3182F6",
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
      <head>
        <link
          rel="stylesheet"
          as="style"
          crossOrigin="anonymous"
          href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/static/pretendard.min.css"
        />
      </head>
      <body className="font-sans antialiased tracking-tight bg-toss-base min-h-screen">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
