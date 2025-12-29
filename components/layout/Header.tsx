'use client';

import { Search, Bell, SlidersHorizontal } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

interface HeaderProps {
    readonly className?: string;
}

export function Header({ className }: HeaderProps) {
    const router = useRouter();
    const [isOpen, setIsOpen] = useState(false);

    // Search States
    const [keyword, setKeyword] = useState('');
    const [scope, setScope] = useState('all'); // all, title, description
    const [category, setCategory] = useState('all'); // all, WORK (Penta Design), WALLPAPER
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [minSize, setMinSize] = useState('');
    const [maxSize, setMaxSize] = useState('');

    const handleSearch = () => {
        const params = new URLSearchParams();
        if (keyword) params.set('q', keyword);
        if (scope !== 'all') params.set('scope', scope);

        // Category Logic based on Sidebar names
        if (category === 'WORK') {
            // Penta Design (Everything except Wallpaper)
            params.set('excludeCategory', 'WALLPAPER');
        } else if (category === 'WALLPAPER') {
            params.set('category', 'WALLPAPER');
        }
        // For 'all', we don't set category params -> searches everything

        if (startDate) params.set('startDate', startDate);
        if (endDate) params.set('endDate', endDate);

        // Convert MB to Bytes for API
        if (minSize) params.set('minSize', (parseFloat(minSize) * 1024 * 1024).toString());
        if (maxSize) params.set('maxSize', (parseFloat(maxSize) * 1024 * 1024).toString());

        setIsOpen(false);
        router.push(`/search?${params.toString()}`);

        // Reset fields after search
        setKeyword('');
        setScope('all');
        setCategory('all');
        setStartDate('');
        setEndDate('');
        setMinSize('');
        setMaxSize('');
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            handleSearch();
        }
    };

    return (
        <header className="fixed top-0 right-0 left-0 md:left-56 z-30 flex h-16 items-center bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 pl-[80px] pr-6 justify-between">
            {/* Left side */}
            <div className="flex items-center">
            </div>

            {/* Right side: Search UI + Notifications + Theme Toggle */}
            <div className="flex items-center gap-3 w-full md:w-auto">
                <div className="relative flex items-center gap-2">
                    <div className="relative w-full md:w-64">
                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                            type="search"
                            placeholder="전체 리소스 검색..."
                            className="w-full bg-background pl-8"
                            value={keyword}
                            onChange={(e) => setKeyword(e.target.value)}
                            onKeyDown={handleKeyDown}
                        />
                    </div>

                    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
                        <DropdownMenuTrigger asChild>
                            <Button variant="outline" size="icon" className="shrink-0">
                                <SlidersHorizontal className="h-4 w-4" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent className="w-96 p-4" align="end" onInteractOutside={() => setIsOpen(false)}>
                            <div className="grid gap-4" onClick={(e) => e.stopPropagation()}>
                                <div className="space-y-2">
                                    <h4 className="font-medium leading-none">상세 검색</h4>
                                    <p className="text-sm text-muted-foreground">
                                        원하는 조건으로 리소스를 검색하세요.
                                    </p>
                                </div>
                                <div className="grid gap-4">
                                    <div className="space-y-1">
                                        <label className="text-sm font-medium">범위</label>
                                        <select
                                            className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                                            value={scope}
                                            onChange={(e) => setScope(e.target.value)}
                                        >
                                            <option value="all">전체 (제목+내용)</option>
                                            <option value="title">제목만</option>
                                            <option value="description">내용만</option>
                                        </select>
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-sm font-medium">카테고리</label>
                                        <select
                                            className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                                            value={category}
                                            onChange={(e) => setCategory(e.target.value)}
                                        >
                                            <option value="all">전체</option>
                                            <option value="WORK">Penta Design</option>
                                            <option value="WALLPAPER">바탕화면</option>
                                        </select>
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-sm font-medium">등록 기간</label>
                                        <div className="flex items-center gap-2">
                                            <Input
                                                type="date"
                                                className="h-8 text-xs"
                                                value={startDate}
                                                onChange={(e) => setStartDate(e.target.value)}
                                            />
                                            <span className="text-xs text-muted-foreground">~</span>
                                            <Input
                                                type="date"
                                                className="h-8 text-xs"
                                                value={endDate}
                                                onChange={(e) => setEndDate(e.target.value)}
                                            />
                                        </div>
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-sm font-medium">파일 용량 (MB)</label>
                                        <div className="flex items-center gap-2">
                                            <Input
                                                type="number"
                                                placeholder="Min"
                                                className="h-8 text-xs"
                                                value={minSize}
                                                onChange={(e) => setMinSize(e.target.value)}
                                            />
                                            <span className="text-xs text-muted-foreground">~</span>
                                            <Input
                                                type="number"
                                                placeholder="Max"
                                                className="h-8 text-xs"
                                                value={maxSize}
                                                onChange={(e) => setMaxSize(e.target.value)}
                                            />
                                        </div>
                                    </div>
                                    <Button className="w-full mt-2" onClick={handleSearch}>
                                        검색 적용
                                    </Button>
                                </div>
                            </div>
                        </DropdownMenuContent>
                    </DropdownMenu>
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
