import React from 'react';
import { Moon, Sun, Monitor } from 'lucide-react';
import { useTheme } from '@/contexts/ThemeContext';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';

const THEMES = [
  { name: 'Light', value: 'light' as const, icon: Sun },
  { name: 'Dark', value: 'dark' as const, icon: Moon },
  { name: 'System', value: 'system' as const, icon: Monitor },
];

export const ThemeToggle: React.FC = () => {
  const { theme, setTheme, currentTheme } = useTheme();
  const CurrentIcon = currentTheme === 'dark' ? Moon : Sun;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon">
          <CurrentIcon className="size-4" />
          <span className="sr-only">Theme: {theme}. Change theme</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-36">
        {THEMES.map((option) => {
          const Icon = option.icon;
          const selected = theme === option.value;
          return (
            <DropdownMenuItem
              key={option.value}
              onClick={() => setTheme(option.value)}
              className={cn(selected && 'bg-muted font-medium')}
            >
              <Icon className="size-4 text-muted-foreground" />
              <span>{option.name}</span>
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
