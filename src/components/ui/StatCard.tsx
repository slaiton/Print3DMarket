import { ReactNode } from 'react';

interface StatCardProps {
  label: string;
  value: string | number;
  sub?: string;
  icon?: ReactNode;
  color?: string;
}

export function StatCard({ label, value, sub, icon, color = 'blue' }: StatCardProps) {
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
