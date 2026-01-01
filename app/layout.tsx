import type { Metadata } from "next";
import "./pretendard.css";
import "./globals.css";
import { AppShell } from "@/components/layout/AppShell";

export const metadata: Metadata = {
  title: "LAYERARY - Design Asset Management System",
  description: "Design Asset Management System for Penta Security",
  icons: {
    icon: '/img/favicon.png', // public 폴더 안의 파일 경로
  },
};

import { Providers } from "./providers";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko" suppressHydrationWarning>
      <body
        className={`font-sans antialiased min-h-screen bg-background`}
      >
        <Providers>
          <AppShell>
            {children}
          </AppShell>
        </Providers>
      </body>
    </html>
  );
}
