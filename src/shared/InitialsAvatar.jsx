function initialsOf(name = '') {
  return name
    .trim()
    .split(/\s+/)
    .map((part) => part[0] ?? '')
    .join('')
    .slice(0, 2)
    .toUpperCase();
}

export default function InitialsAvatar({ name, size = 34, className = '' }) {
  return (
    <span
      title={name}
      className={`grid shrink-0 place-items-center rounded-full bg-[#3a3a3a] font-semibold text-white ${className}`}
      style={{ width: size, height: size, fontSize: size * 0.37 }}
    >
      {initialsOf(name)}
    </span>
  );
}
