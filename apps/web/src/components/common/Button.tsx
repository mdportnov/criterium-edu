import React, { ButtonHTMLAttributes } from 'react';

export type ButtonVariant =
  | 'primary'
  | 'secondary'
  | 'accent'
  | 'ghost'
  | 'link'
  | 'outline'
  | 'error'
  | 'success'
  | 'warning'
  | 'info';
export type ButtonSize = 'xs' | 'sm' | 'md' | 'lg';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  isLoading?: boolean;
  isFullWidth?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  isLoading = false,
  isFullWidth = false,
  leftIcon,
  rightIcon,
  className = '',
  ...props
}) => {
  const baseClassName = 'btn';

  const variantClassName = variant ? `btn-${variant}` : '';
  const sizeClassName = size ? `btn-${size}` : '';
  const fullWidthClassName = isFullWidth ? 'w-full' : '';
  const loadingClassName = isLoading ? 'loading' : '';

  const combinedClassName = `
    ${baseClassName}
    ${variantClassName}
    ${sizeClassName}
    ${fullWidthClassName}
    ${loadingClassName}
    ${className}
  `
    .trim()
    .replace(/\s+/g, ' '); // Remove excess whitespace

  return (
    <button
      className={combinedClassName}
      disabled={isLoading || props.disabled}
      {...props}
    >
      {!isLoading && leftIcon && <span className="mr-2">{leftIcon}</span>}
      {children}
      {!isLoading && rightIcon && <span className="ml-2">{rightIcon}</span>}
    </button>
  );
};
