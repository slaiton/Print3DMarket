import { ReactNode } from 'react';

interface EmptyProps {
  icon?: ReactNode;
  title: string;
  sub?: string;
  action?: ReactNode;
}

export function Empty({ icon, title, sub, action }: EmptyProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 gap-3 text-center">
      {icon && <div className="text-5xl opacity-20 mb-2">{icon}</div>}
      <p className="font-bold text-lg text-fg">{title}</p>
      {sub    && <p className="text-sm text-fg-muted max-w-xs">{sub}</p>}
      {action}
    </div>
  );
}
