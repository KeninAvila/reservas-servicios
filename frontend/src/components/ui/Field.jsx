const baseInput =
  'w-full px-4 py-3 bg-white border border-sand rounded-xl text-sm text-ink placeholder:text-ink/35 ' +
  'transition-all duration-200 focus:outline-none focus:border-brand-500 focus:ring-4 focus:ring-brand-600/10 ' +
  'disabled:bg-cream disabled:text-ink/40';

export function Label({ children, hint }) {
  return (
    <span className="block mb-1.5 text-xs font-semibold text-ink/60 tracking-wide">
      {children}
      {hint && <span className="font-normal text-ink/40"> — {hint}</span>}
    </span>
  );
}

export function Input({ label, hint, icon: Icon, className = '', ...props }) {
  const input = (
    <div className="relative">
      {Icon && <Icon size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink/35 pointer-events-none" />}
      <input className={`${baseInput} ${Icon ? 'pl-10' : ''} ${className}`} {...props} />
    </div>
  );
  if (!label) return input;
  return (
    <label className="block">
      <Label hint={hint}>{label}</Label>
      {input}
    </label>
  );
}

export function TextArea({ label, hint, className = '', ...props }) {
  const area = <textarea className={`${baseInput} resize-none ${className}`} {...props} />;
  if (!label) return area;
  return (
    <label className="block">
      <Label hint={hint}>{label}</Label>
      {area}
    </label>
  );
}

export function Select({ label, hint, className = '', children, ...props }) {
  const select = (
    <select className={`${baseInput} appearance-none bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2216%22%20height%3D%2216%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22%231b1f1d%22%20stroke-opacity%3D%220.4%22%20stroke-width%3D%222%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%3E%3Cpath%20d%3D%22m6%209%206%206%206-6%22%2F%3E%3C%2Fsvg%3E')] bg-no-repeat bg-[right_0.9rem_center] pr-10 ${className}`} {...props}>
      {children}
    </select>
  );
  if (!label) return select;
  return (
    <label className="block">
      <Label hint={hint}>{label}</Label>
      {select}
    </label>
  );
}

export function ErrorNote({ children }) {
  if (!children) return null;
  return (
    <div className="px-4 py-3 bg-danger-50 border border-danger-100 text-danger-700 text-xs rounded-xl leading-relaxed animate-fadeIn">
      {children}
    </div>
  );
}
