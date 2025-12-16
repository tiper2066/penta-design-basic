'use client';

import { usePathname } from 'next/navigation';
import { Sidebar } from "@/components/layout/Sidebar";
import { Header } from "@/components/layout/Header";
import { cn } from "@/lib/utils";

export function AppShell({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const isAuthPage = pathname === '/login' || pathname === '/register';

    return (
        <div className="flex min-h-screen">
            {/* Sidebar - Hide on Auth Pages */}
            {!isAuthPage && <Sidebar />}

            {/* Main Content Area --- 로그인/회원가입 페이지가 아닐경우 상단 패딩적용 */}
            <main className={cn("flex-1 min-h-screen", !isAuthPage && "pt-16 md:ml-56")}>
                {!isAuthPage && <Header />}
                <div className={cn("pr-8 pb-8 pl-8 max-w-[1600px] mx-auto", isAuthPage && "p-0 max-w-none")}>
                    {children}
                </div>
            </main>
        </div >
    );
}
