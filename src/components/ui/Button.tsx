import { ButtonHTMLAttributes, ReactNode } from 'react';

type BtnVariant = 'primary' | 'secondary' | 'danger' | 'ghost' | 'success' | 'outline';
type BtnSize    = 'sm' | 'md' | 'lg';

interface BtnProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: BtnVariant;
  size?: BtnSize;
  loading?: boolean;
  icon?: ReactNode;
  block?: boolean;
  iconOnly?: boolean;
  children: ReactNode;
}

export function Button({
  variant  = 'primary',
  size     = 'md',
  loading  = false,
  icon,
  block    = false,
  iconOnly = false,
  children,
  className = '',
  disabled,
  ...props
}: BtnProps) {
  const classes = [
    'btn',
    `btn-${variant}`,
    size !== 'md' ? `btn-${size}` : '',
    block    ? 'btn-block'  : '',
    iconOnly ? 'btn-icon'   : '',
    className,
  ].filter(Boolean).join(' ');

  return (
    <button
      className={classes}
      disabled={disabled || loading}
      aria-disabled={disabled || loading}
      {...props}
    >
      {loading
        ? <span className="btn-spinner" aria-hidden="true" />
        : icon && <span style={{ display:'flex', alignItems:'center' }}>{icon}</span>
      }
      {!iconOnly && children}
    </button>
  );
}
