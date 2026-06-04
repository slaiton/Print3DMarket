// src/components/ui/index.tsx
// Componentes genéricos reutilizables en toda la app

import { ReactNode, ButtonHTMLAttributes, InputHTMLAttributes, SelectHTMLAttributes } from 'react';
import { Loader2, X } from 'lucide-react';

// ── Button ──────────────────────────────────────────────────
type BtnVariant = 'primary' | 'secondary' | 'danger' | 'ghost';
type BtnSize    = 'sm' | 'md' | 'lg';

interface BtnProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: BtnVariant;
  size?: BtnSize;
  loading?: boolean;
  icon?: ReactNode;
  children: ReactNode;
}

const btnBase = 'inline-flex items-center gap-2 font-semibold rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed';
const btnVariants: Record<BtnVariant, string> = {
  primary:   'bg-accent text-white hover:bg-accent-dark',
  secondary: 'bg-surface border border-border text-fg hover:bg-bg',
  danger:    'bg-red-500 text-white hover:bg-red-600',
  ghost:     'text-fg-muted hover:bg-bg hover:text-fg',
};
const btnSizes: Record<BtnSize, string> = {
  sm: 'px-3 py-1.5 text-xs',
  md: 'px-4 py-2 text-sm',
  lg: 'px-5 py-2.5 text-base',
};

export function Button({
  variant = 'primary', size = 'md', loading, icon, children, className = '', ...props
}: BtnProps) {
  return (
    <button
      className={`${btnBase} ${btnVariants[variant]} ${btnSizes[size]} ${className}`}
      disabled={loading || props.disabled}
      {...props}
    >
      {loading ? <Loader2 size={14} className="animate-spin" /> : icon}
      {children}
    </button>
  );
}

// ── Input ───────────────────────────────────────────────────
interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
}

export function Input({ label, error, hint, className = '', ...props }: InputProps) {
  return (
    <div className="flex flex-col gap-1">
      {label && <label className="text-sm font-medium text-fg">{label}</label>}
      <input
        className={`px-3 py-2 text-sm border rounded-lg bg-bg text-fg outline-none
          transition-colors placeholder:text-fg-muted
          focus:border-accent
          ${error ? 'border-red-400' : 'border-border'}
          ${className}`}
        {...props}
      />
      {error && <p className="text-xs text-red-500">{error}</p>}
      {hint  && <p className="text-xs text-fg-muted">{hint}</p>}
    </div>
  );
}

// ── Textarea ────────────────────────────────────────────────
export function Textarea({ label, error, ...props }: { label?: string; error?: string } & React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <div className="flex flex-col gap-1">
      {label && <label className="text-sm font-medium text-fg">{label}</label>}
      <textarea
        className={`px-3 py-2 text-sm border rounded-lg bg-bg text-fg outline-none
          transition-colors placeholder:text-fg-muted resize-none
          focus:border-accent
          ${error ? 'border-red-400' : 'border-border'}`}
        rows={3}
        {...props}
      />
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  );
}

// ── Select ──────────────────────────────────────────────────
interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  options: { value: string; label: string }[];
  placeholder?: string;
}

export function Select({ label, error, options, placeholder, className = '', ...props }: SelectProps) {
  return (
    <div className="flex flex-col gap-1">
      {label && <label className="text-sm font-medium text-fg">{label}</label>}
      <select
        className={`px-3 py-2 text-sm border rounded-lg bg-bg text-fg outline-none
          transition-colors focus:border-accent
          ${error ? 'border-red-400' : 'border-border'} ${className}`}
        {...props}
      >
        {placeholder && <option value="">{placeholder}</option>}
        {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  );
}

// ── Badge ───────────────────────────────────────────────────
type BadgeColor = 'gray' | 'green' | 'amber' | 'red' | 'blue' | 'purple' | 'orange';

const badgeColors: Record<BadgeColor, string> = {
  gray:   'bg-gray-100   text-gray-700',
  green:  'bg-green-100  text-green-700',
  amber:  'bg-amber-100  text-amber-700',
  red:    'bg-red-100    text-red-700',
  blue:   'bg-blue-100   text-blue-700',
  purple: 'bg-purple-100 text-purple-700',
  orange: 'bg-orange-100 text-orange-700',
};

export function Badge({ children, color = 'gray' }: { children: ReactNode; color?: BadgeColor }) {
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${badgeColors[color]}`}>
      {children}
    </span>
  );
}

// ── Modal ───────────────────────────────────────────────────
interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  size?: 'sm' | 'md' | 'lg';
}


export function Modal({ open, onClose, title, children, size = 'md' }: ModalProps) {
  if (!open) return null;
  return (
    <div
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
      style={{
        position: 'fixed', inset: 0, zIndex: 50,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '16px',
        background: 'rgba(15,23,42,0.55)',
        backdropFilter: 'blur(6px)',
      }}
    >
      <div
        style={{
          background: '#ffffff',
          borderRadius: '20px',
          border: '1px solid #e5e7eb',
          width: '100%',
          maxWidth: size === 'sm' ? '400px' : size === 'lg' ? '720px' : '560px',
          boxShadow: '0 24px 64px rgba(0,0,0,.18)',
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
        }}
      >
        {/* Header */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '18px 22px',
          borderBottom: '1px solid #f3f4f6',
          flexShrink: 0,
        }}>
          <h3 style={{ fontWeight: 700, fontSize: '1rem', color: '#111827' }}>{title}</h3>
          <button
            onClick={onClose}
            style={{
              width: 30, height: 30, borderRadius: 8, border: 'none',
              background: 'transparent', cursor: 'pointer', color: '#9ca3af',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              transition: 'all .15s',
            }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = '#f3f4f6'; (e.currentTarget as HTMLElement).style.color = '#111827'; }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'transparent'; (e.currentTarget as HTMLElement).style.color = '#9ca3af'; }}
          >
            <X size={16} />
          </button>
        </div>
        {/* Body */}
        <div style={{ padding: '22px', overflowY: 'auto', flex: 1 }}>{children}</div>
      </div>
    </div>
  );
}

// ── Card ────────────────────────────────────────────────────
export function Card({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <div className={`bg-surface border border-border rounded-xl p-5 ${className}`}>
      {children}
    </div>
  );
}

// ── Stat card ───────────────────────────────────────────────
export function StatCard({ label, value, sub, icon, color = 'blue' }: {
  label: string; value: string | number; sub?: string; icon?: ReactNode; color?: string;
}) {
  return (
    <div className="bg-surface border border-border rounded-xl p-4 flex items-start gap-3">
      {icon && (
        <div className={`p-2 rounded-lg bg-${color}-50 text-${color}-600`}>
          {icon}
        </div>
      )}
      <div>
        <p className="text-xs font-medium text-fg-muted uppercase tracking-wide">{label}</p>
        <p className="text-2xl font-bold text-fg mt-0.5">{value}</p>
        {sub && <p className="text-xs text-fg-muted mt-0.5">{sub}</p>}
      </div>
    </div>
  );
}

// ── Empty state ─────────────────────────────────────────────
export function Empty({ icon, title, sub, action }: {
  icon?: ReactNode; title: string; sub?: string; action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center py-16 gap-3 text-center">
      {icon && <div className="text-5xl opacity-20 mb-2">{icon}</div>}
      <p className="font-bold text-lg text-fg">{title}</p>
      {sub   && <p className="text-sm text-fg-muted max-w-xs">{sub}</p>}
      {action}
    </div>
  );
}

// ── Confirm dialog ───────────────────────────────────────────
export function Confirm({ open, onClose, onConfirm, title, message, loading }: {
  open: boolean; onClose: () => void; onConfirm: () => void;
  title: string; message: string; loading?: boolean;
}) {
  return (
    <Modal open={open} onClose={onClose} title={title} size="sm">
      <p className="text-sm text-fg-muted mb-5">{message}</p>
      <div className="flex gap-2 justify-end">
        <Button variant="secondary" onClick={onClose}>Cancelar</Button>
        <Button variant="danger" onClick={onConfirm} loading={loading}>Confirmar</Button>
      </div>
    </Modal>
  );
}
