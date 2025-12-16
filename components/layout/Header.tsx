'use client';

import { Search, Bell } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ThemeToggle } from '@/components/ui/theme-toggle';

interface HeaderProps {
    readonly className?: string;
}

export function Header({ className }: HeaderProps) {
    return (
        <header className="fixed top-0 right-0 left-0 md:left-56 z-30 flex h-16 items-center bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 pl-[80px] pr-6 justify-between">
            {/* Left side (Breadcrumbs or title - currently empty based on request, or maybe just space) */}
            <div className="flex items-center">
                {/* Placeholder for Breadcrumb if needed later */}
            </div>

            {/* Right side: Search UI + Notifications + Theme Toggle */}
            <div className="flex items-center gap-3 w-full md:w-auto">
                <div className="relative w-full md:w-80">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                        type="search"
                        placeholder="전체 리소스 검색..."
                        className="w-full bg-background pl-8"
                    />
                </div>

                <Button variant="ghost" size="icon" className="relative shrink-0 h-9 w-9">
                    <Bell className="h-4 w-4 text-muted-foreground" />
                    <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-red-500" />
                </Button>

                <ThemeToggle />
            </div>
        </header>
    );
}
