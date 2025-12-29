'use client';

import { usePathname } from 'next/navigation';
import { Sidebar } from "@/components/layout/Sidebar";
import { Header } from "@/components/layout/Header";
import { cn } from "@/lib/utils";

export function AppShell({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const isAuthPage = pathname === '/login' || pathname === '/register';
    const isEditorPage = pathname?.startsWith('/editor');

    const isFullScreen = isAuthPage || isEditorPage;

    return (
        <div className="flex min-h-screen">
            {/* Sidebar - Hide on Auth/Editor Pages */}
            {!isFullScreen && <Sidebar />}

            {/* Main Content Area */}
            <main className={cn("flex-1 min-h-screen", !isFullScreen && "pt-16 md:ml-56")}>
                {!isFullScreen && <Header />}
                <div className={cn("pr-8 pb-8 pl-8 max-w-[1600px] mx-auto", isFullScreen && "p-0 max-w-none")}>
                    {children}
                </div>
            </main>
        </div >
    );
}
