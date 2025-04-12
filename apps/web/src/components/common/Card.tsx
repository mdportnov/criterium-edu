import React from 'react';

interface CardProps {
  title?: React.ReactNode;
  actions?: React.ReactNode;
  footer?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  compact?: boolean;
  bordered?: boolean;
}

export const Card: React.FC<CardProps> = ({
  title,
  actions,
  footer,
  children,
  className = '',
  compact = false,
  bordered = true,
}) => {
  const baseClassName = 'card bg-base-100 shadow-sm';
  const compactClassName = compact ? 'card-compact' : '';
  const borderedClassName = bordered ? 'border border-base-300' : '';
  
  const combinedClassName = `
    ${baseClassName}
    ${compactClassName}
    ${borderedClassName}
    ${className}
  `.trim().replace(/\s+/g, ' ');
  
  return (
    <div className={combinedClassName}>
      {title && (
        <div className="card-title p-6 pb-0 flex justify-between items-center">
          <div>{title}</div>
          {actions && <div>{actions}</div>}
        </div>
      )}
      <div className="card-body">
        {children}
      </div>
      {footer && (
        <div className="card-footer p-6 pt-0 bg-base-200 rounded-b-box">
          {footer}
        </div>
      )}
    </div>
  );
};
