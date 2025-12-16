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
  LogOut,
  LogIn,
  Menu,
  ShieldUser,
  Settings,
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
import {
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetTitle,
} from "@/components/ui/sheet"
import { useState } from 'react';

interface SidebarProps {
  className?: string;
  onLinkClick?: () => void;
}

function SidebarContent({ className, onLinkClick }: SidebarProps) {
  const pathname = usePathname();
  // Open all by default or manage state
  const [openCategories, setOpenCategories] = useState<string[]>(['WORK', 'SOURCE', 'TEMPLATE', 'BROCHURE', 'ADMIN']);
  const { data: session, status } = useSession();
  const router = useRouter();

  const toggleCategory = (title: string) => {
    setOpenCategories(prev =>
      prev.includes(title)
        ? prev.filter(t => t !== title)
        : [...prev, title]
    );
  };

  const handleLinkClick = (e: React.MouseEvent) => {
    if (status !== 'authenticated') {
      e.preventDefault();
      router.push('/login');
    } else {
      // 모바일에서 링크 클릭 시 사이드바 닫기
      onLinkClick?.();
    }
  };

  const menuGroups = [
    {
      title: 'WORK',
      icon: Briefcase,
      items: [
        { title: 'Penta Design', href: '/work' }
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
        { title: 'eDM', href: '/code-generator' }
      ]
    },
  ];

  return (
    <div className={cn("pb-0 h-full bg-sidebar text-sidebar-foreground flex flex-col", className)}>
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
              className="space-y-1 pb-3"
            >
              <CollapsibleTrigger asChild>
                <span className="flex items-center text-ring text-[10px] cursor-pointer">
                  {group.title}
                </span>
              </CollapsibleTrigger>
              <CollapsibleContent className="space-y-1">
                {group.items.map((item) => (
                  <Button
                    key={item.href}
                    variant={pathname === item.href || (pathname === '/work' && item.href === '/work') ? "secondary" : "ghost"}
                    size="sm"
                    className={cn(
                      "w-full justify-start h-9 font-normal text-muted-foreground",
                      (pathname === item.href) && "bg-sidebar-accent text-penta-indigo font-medium"
                    )}
                    asChild
                  >
                    <Link href={item.href} onClick={handleLinkClick}>
                      {item.title}
                    </Link>
                  </Button>
                ))}
              </CollapsibleContent>
            </Collapsible>
          ))}

          {/* Admin Menu - Only visible to ADMIN users */}
          {session?.user && (session.user as any).role === 'ADMIN' && (
            <div className="pt-4 border-t border-sidebar-border">
              <Collapsible
                open={openCategories.includes('ADMIN')}
                onOpenChange={() => toggleCategory('ADMIN')}
                className="space-y-1 pb-3"
              >
                <CollapsibleTrigger asChild>
                  <span className="flex items-center text-ring text-[10px] cursor-pointer">
                    ADMIN
                  </span>
                </CollapsibleTrigger>
                <CollapsibleContent className="space-y-1">
                  <Button
                    variant={pathname === '/admin/users' ? "secondary" : "ghost"}
                    size="sm"
                    className={cn(
                      "w-full justify-start h-9 font-normal text-muted-foreground",
                      pathname === '/admin/users' && "bg-sidebar-accent text-penta-indigo font-medium"
                    )}
                    asChild
                  >
                    <Link href="/admin/users" onClick={handleLinkClick}>
                      <ShieldUser className="mr-2 h-4 w-4" />
                      사용자 관리
                    </Link>
                  </Button>
                </CollapsibleContent>
              </Collapsible>
            </div>
          )}
        </div>
      </div>

      {/* Footer User Profile */}
      <div className="pt-4 pr-4 pb-6 pl-4 bg-sidebar shrink-0">
        {status === 'authenticated' && session?.user ? (
          <div className="flex items-center gap-2 min-w-0">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className='flex items-center gap-2 ml-2 rounded-[50px] p-[8px] bg-muted flex-1 min-w-0'>
                    <Avatar className="h-6 w-6 border shrink-0">
                      <AvatarImage src={session.user.image || "/img/avatar.jpg"} alt={session.user.name || "User"} />
                      <AvatarFallback>{session.user.name?.slice(0, 2).toUpperCase() || "CN"}</AvatarFallback>
                    </Avatar>
                    <div className="flex flex-col min-w-0 flex-1">
                      <p className="text-sm font-medium leading-none truncate">
                        {session.user.name && session.user.name.length > 6 
                          ? `${session.user.name.slice(0, 6)}...` 
                          : session.user.name || 'User'}
                      </p>
                    </div>
                  </div>
                </TooltipTrigger>
                <TooltipContent align="start">
                  <div className="text-xs">
                    <p className="font-medium">{session.user.name}</p>
                    <p className="text-muted-foreground">{session.user.email}</p>
                  </div>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
            <div className="flex gap-1 shrink-0">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 shrink-0"
                      asChild
                    >
                      <Link href="/settings/profile" onClick={handleLinkClick}>
                        <Settings className="h-4 w-4" />
                      </Link>
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>프로필 설정</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 shrink-0"
                      onClick={() => signOut({ callbackUrl: '/login' })}
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
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            <Link href="/login">
              <Button className="w-full" size="sm"><LogIn /> 로그인</Button>
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}

export function Sidebar({ className }: SidebarProps) {
  const [isOpen, setIsOpen] = useState(false);

  const handleLinkClick = () => {
    setIsOpen(false);
  };

  return (
    <>
      {/* Mobile Sidebar (Sheet) */}
      <div className="md:hidden fixed top-4 left-4 z-50">
        <Sheet open={isOpen} onOpenChange={setIsOpen}>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" className="hover:bg-transparent hover:text-penta-indigo">
              <Menu className="h-6 w-6" />
              <span className="sr-only">Toggle Menu</span>
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="p-0 w-64">
            <SheetTitle className="sr-only">Navigation Menu</SheetTitle>
            <SidebarContent onLinkClick={handleLinkClick} />
          </SheetContent>
        </Sheet>
      </div>

      {/* Desktop Sidebar (Fixed Aside) */}
      <aside className={cn("hidden md:flex flex-col fixed left-0 top-0 z-40 bg-sidebar h-screen w-56", className)}>
        <SidebarContent />
      </aside>
    </>
  );
}
