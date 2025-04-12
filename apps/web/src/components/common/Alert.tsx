import React from 'react';

export type AlertVariant = 'info' | 'success' | 'warning' | 'error';

interface AlertProps {
  variant?: AlertVariant;
  title?: string;
  children: React.ReactNode;
  icon?: React.ReactNode;
  onClose?: () => void;
  className?: string;
}

export const Alert: React.FC<AlertProps> = ({
  variant = 'info',
  title,
  children,
  icon,
  onClose,
  className = '',
}) => {
  const baseClassName = 'alert';
  const variantClassName = variant ? `alert-${variant}` : '';
  
  const combinedClassName = `
    ${baseClassName}
    ${variantClassName}
    ${className}
  `.trim().replace(/\s+/g, ' ');
  
  return (
    <div className={combinedClassName}>
      {icon && <div className="alert-icon">{icon}</div>}
      <div>
        {title && <h3 className="font-bold">{title}</h3>}
        <div className="text-sm">{children}</div>
      </div>
      {onClose && (
        <button
          className="btn btn-sm btn-ghost"
          onClick={onClose}
          aria-label="Close"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-5 w-5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>
      )}
    </div>
  );
};
