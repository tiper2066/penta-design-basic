'use client';

import { Moon, Sun } from 'lucide-react';
import { useTheme } from 'next-themes';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { useEffect, useState } from 'react';

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // useEffect only runs on the client, so now we can safely show the UI
  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <Button variant="ghost" size="icon" className="h-9 w-9">
        <div className="h-4 w-4" />
      </Button>
    );
  }

  const toggleTheme = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  };

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleTheme}
            className="h-9 w-9 hover:bg-muted"
          >
            {theme === 'dark' ? (
              <Sun className="h-4 w-4 text-muted-foreground hover:text-foreground transition-colors" />
            ) : (
              <Moon className="h-4 w-4 text-muted-foreground hover:text-foreground transition-colors" />
            )}
            <span className="sr-only">테마 변경</span>
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          <p>{theme === 'dark' ? '라이트 모드로 변경' : '다크 모드로 변경'}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}