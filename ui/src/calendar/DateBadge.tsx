/** Visual date marker only; parent elements own clicks and keyboard interaction. */
export function DateBadge({day, today = false, size = 'regular', className = ''}: {
  day: number | ''; today?: boolean; size?: 'regular' | 'mini'; className?: string;
}) {
  return <span className={`cc-date-badge cc-date-badge-${size}${today ? ' cc-date-badge-today' : ''}${className ? ` ${className}` : ''}`}>{day}</span>;
}
