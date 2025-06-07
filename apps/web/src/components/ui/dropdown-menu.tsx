import React, { createContext, useContext, useState } from 'react';
import { cn } from '@/lib/utils';

interface DropdownContextType {
  open: boolean;
  setOpen: (open: boolean) => void;
}

const DropdownContext = createContext<DropdownContextType | undefined>(undefined);

const useDropdown = () => {
  const context = useContext(DropdownContext);
  if (!context) {
    throw new Error('useDropdown must be used within a DropdownMenu');
  }
  return context;
};

interface DropdownMenuProps {
  children: React.ReactNode;
}

export const DropdownMenu: React.FC<DropdownMenuProps> = ({ children }) => {
  const [open, setOpen] = useState(false);

  return (
    <DropdownContext.Provider value={{ open, setOpen }}>
      <div className="relative">{children}</div>
    </DropdownContext.Provider>
  );
};

interface DropdownMenuTriggerProps {
  children: React.ReactNode;
  asChild?: boolean;
}

export const DropdownMenuTrigger: React.FC<DropdownMenuTriggerProps> = ({
  children,
  asChild = false,
}) => {
  const { open, setOpen } = useDropdown();

  if (asChild && React.isValidElement(children)) {
    return React.cloneElement(children, {
      onClick: () => setOpen(!open),
      'aria-expanded': open,
      'aria-haspopup': true,
    } as any);
  }

  return (
    <button
      onClick={() => setOpen(!open)}
      aria-expanded={open}
      aria-haspopup={true}
      className="outline-none"
    >
      {children}
    </button>
  );
};

interface DropdownMenuContentProps {
  children: React.ReactNode;
  align?: 'start' | 'center' | 'end';
  className?: string;
}

export const DropdownMenuContent: React.FC<DropdownMenuContentProps> = ({
  children,
  align = 'center',
  className,
}) => {
  const { open, setOpen } = useDropdown();

  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;
      if (!target.closest('[data-dropdown-content]')) {
        setOpen(false);
      }
    };

    if (open) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [open, setOpen]);

  if (!open) return null;

  const alignmentClasses = {
    start: 'left-0',
    center: 'left-1/2 -translate-x-1/2',
    end: 'right-0',
  };

  return (
    <div
      data-dropdown-content=""
      className={cn(
        'absolute top-full mt-2 z-50 min-w-[8rem] overflow-hidden rounded-md border border-border bg-background p-1 text-foreground shadow-lg animate-in fade-in-0 zoom-in-95',
        alignmentClasses[align],
        className
      )}
    >
      {children}
    </div>
  );
};

interface DropdownMenuItemProps {
  children: React.ReactNode;
  onClick?: () => void;
  className?: string;
  disabled?: boolean;
}

export const DropdownMenuItem: React.FC<DropdownMenuItemProps> = ({
  children,
  onClick,
  className,
  disabled = false,
}) => {
  const { setOpen } = useDropdown();

  const handleClick = () => {
    if (!disabled && onClick) {
      onClick();
      setOpen(false);
    }
  };

  return (
    <button
      onClick={handleClick}
      disabled={disabled}
      className={cn(
        'relative flex w-full cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground disabled:pointer-events-none disabled:opacity-50',
        className
      )}
    >
      {children}
    </button>
  );
};
