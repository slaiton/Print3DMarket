import { ReactNode } from 'react';

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
