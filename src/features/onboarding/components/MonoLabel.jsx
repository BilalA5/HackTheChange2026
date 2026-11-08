export default function MonoLabel({ as: Tag = 'div', children, className = '' }) {
  return <Tag className={`font-mono text-[10px] uppercase tracking-[.16em] ${className}`}>{children}</Tag>;
}
