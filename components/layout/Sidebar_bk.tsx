'use client';

import Image from 'next/image';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useSession, signOut } from 'next-auth/react';
import {
    Briefcase,
    Palette,
    Layout,
    FileText,
    Code,
    ChevronDown,
    LogOut,
    LogIn,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
    Collapsible,
    CollapsibleContent,
    CollapsibleTrigger,
} from "@/components/ui/collapsible"
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip"
import { useState } from 'react';
import LoginPage from '@/app/login/page';

interface SidebarProps {
    className?: string;
}

export function Sidebar({ className }: SidebarProps) {
    const pathname = usePathname();
    // Open all by default or manage state
    const [openCategories, setOpenCategories] = useState<string[]>(['WORK', 'SOURCE', 'TEMPLATE', 'BROCHURE']);
    const { data: session, status } = useSession();
    const router = useRouter();

    const toggleCategory = (title: string) => {
        setOpenCategories(prev =>
            prev.includes(title)
                ? prev.filter(t => t !== title)
                : [...prev, title]
        );
    };

    const handleLinkClick = (e: React.MouseEvent, href: string) => {
        if (status !== 'authenticated') {
            e.preventDefault();
            router.push('/login');
        }
    };

    const menuGroups = [
        {
            title: 'WORK',
            icon: Briefcase,
            items: [
                { title: 'Penta Design', href: '/work' } // Defaulting to /work as main list
            ]
        },
        {
            title: 'SOURCE',
            icon: Palette,
            items: [
                { title: 'CI/BI', href: '/source?type=cibi' },
                { title: 'ICON', href: '/source?type=icon' },
                { title: '캐릭터', href: '/source?type=character' },
                { title: '다이어그램', href: '/source?type=diagram' }
            ]
        },
        {
            title: 'TEMPLATE',
            icon: Layout,
            items: [
                { title: 'PPT', href: '/template?type=ppt' },
                { title: '감사 / 연말 카드', href: '/template?type=card' },
                { title: '바탕화면', href: '/template?type=wallpaper' },
                { title: '월컴보드', href: '/template?type=board' }
            ]
        },
        {
            title: 'BROCHURE',
            icon: FileText,
            items: [
                { title: 'WAPPLES', href: '/brochure?product=wapples' },
                { title: 'D.AMO', href: '/brochure?product=damo' },
                { title: 'iSIGN', href: '/brochure?product=isign' },
                { title: 'Cloudbric', href: '/brochure?product=cloudbric' }
            ]
        },
        {
            title: 'CODE GENERATOR',
            icon: Code,
            items: [
                // No sub items defined in text, maybe just a direct link or empty
                { title: 'eDM', href: '/code-generator' }
            ]
        },
    ];

    return (
        <aside className={cn("pb-0 w-64 h-screen bg-sidebar text-sidebar-foreground flex flex-col fixed left-0 top-0 z-40", className)}>
            {/* Header Logo */}
            <div className="px-6 py-6 h-16 flex items-center shrink-0">
                <Link href="/" className="flex items-center">
                    <Image
                        src="/img/ci_logo.svg"
                        alt="Penta Security"
                        width={160}
                        height={40}
                        className="h-[18px] w-auto"
                        priority
                    />
                </Link>
            </div>

            {/* Scrollable Menu Area */}
            <div className="flex-1 overflow-y-auto py-4 px-6">
                <div className="space-y-1">
                    {menuGroups.map((group) => (
                        <Collapsible
                            key={group.title}
                            open={openCategories.includes(group.title)}
                            onOpenChange={() => toggleCategory(group.title)}
                            className="space-y-1"
                        >
                            <CollapsibleTrigger asChild>
                                {/* <Button variant="ghost" className="w-full justify-between font-semibold hover:bg-sidebar-accent/50"> */}
                                <span className="flex items-center text-ring text-[10px]">
                                    {/* <group.icon className="mr-2 h-4 w-4" /> */}
                                    {group.title}
                                </span>
                                {/* <ChevronDown className={cn("h-4 w-4 transition-transform", openCategories.includes(group.title) ? "transform rotate-180" : "")} /> */}
                                {/* </Button> */}
                            </CollapsibleTrigger>
                            <CollapsibleContent className="space-y-1 px-2">
                                {group.items.map((item) => (
                                    <Button
                                        key={item.href}
                                        variant={pathname === item.href || (pathname === '/work' && item.href === '/work') ? "secondary" : "ghost"}
                                        size="sm"
                                        className={cn(
                                            "w-full justify-start pl-8 h-9 font-normal text-muted-foreground",
                                            (pathname === item.href) && "bg-sidebar-accent text-sidebar-accent-foreground font-medium"
                                        )}
                                        asChild
                                    >
                                        <Link href={item.href} onClick={(e) => handleLinkClick(e, item.href)}>
                                            {item.title}
                                        </Link>
                                    </Button>
                                ))}
                            </CollapsibleContent>
                        </Collapsible>
                    ))}
                </div>
            </div>

            {/* Footer User Profile */}
            <div className="pt-4 pr-4 pb-6 pl-4 bg-sidebar shrink-0">
                {status === 'authenticated' && session?.user ? (
                    <div className="flex justify-between items-center gap-3">
                        <TooltipProvider>
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <div className='flex items-center gap-2 ml-2 rounded-[50px] p-[8px] bg-muted'>
                                        <Avatar className="h-6 w-6 border">
                                            <AvatarImage src={session.user.image || "/img/avatar.jpg"} alt={session.user.name || "User"} />
                                            <AvatarFallback>{session.user.name?.slice(0, 2).toUpperCase() || "CN"}</AvatarFallback>
                                        </Avatar>
                                        <div className="flex flex-col min-w-0">
                                            <p className="text-sm font-medium leading-none truncate pr-2">{session.user.name}</p>
                                        </div>
                                    </div>
                                </TooltipTrigger>
                                <TooltipContent align="start">
                                    <p>{session.user.email}</p>
                                </TooltipContent>
                            </Tooltip>
                        </TooltipProvider>
                        <TooltipProvider>
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-8 w-8 text-muted-foreground hover:text-foreground"
                                        onClick={() => signOut({ callbackUrl: '/' })}
                                    >
                                        <LogOut className="h-4 w-4" />
                                    </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                    <p>로그아웃</p>
                                </TooltipContent>
                            </Tooltip>
                        </TooltipProvider>
                    </div>
                ) : (
                    <div className="flex flex-col gap-2">
                        <Link href="/login">
                            <Button className="w-full" size="sm"><LogIn /> 로그인</Button>
                        </Link>
                    </div>
                )}
            </div>
        </aside>
    );
}
