import React from 'react';
import { cn } from '@/lib/utils';

interface HamburgerMenuProps {
  isOpen: boolean;
  onClick: () => void;
  className?: string;
}

export const HamburgerMenu: React.FC<HamburgerMenuProps> = ({ 
  isOpen, 
  onClick, 
  className 
}) => {
  return (
    <div
      className={cn(
        "relative w-6 h-6 flex flex-col justify-center items-center transition-all duration-300 cursor-pointer",
        className
      )}
      onClick={onClick}
      aria-label={isOpen ? "Close menu" : "Open menu"}
    >
      <span
        className={cn(
          "block h-0.5 w-6 bg-current transition-all duration-300 ease-in-out",
          isOpen ? "rotate-45 translate-y-0" : "-translate-y-1.5"
        )}
      />
      <span
        className={cn(
          "block h-0.5 w-6 bg-current transition-all duration-300 ease-in-out",
          isOpen ? "opacity-0" : "opacity-100"
        )}
      />
      <span
        className={cn(
          "block h-0.5 w-6 bg-current transition-all duration-300 ease-in-out",
          isOpen ? "-rotate-45 -translate-y-0.5" : "translate-y-1.5"
        )}
      />
    </div>
  );
};