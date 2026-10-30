interface InputProps {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  icon?: React.ReactNode;
  className?: string;
  type?: string;
}

export function Input({ value, onChange, placeholder, icon, className = '', type = 'text' }: InputProps) {
  return (
    <div className={`relative ${className}`}>
      {icon && (
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-navy-400 pointer-events-none">
          {icon}
        </span>
      )}
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={`glass-input w-full h-10 rounded-xl text-sm ${icon ? 'pl-10 pr-3' : 'px-3'}`}
      />
    </div>
  );
}

interface SelectProps {
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
  placeholder?: string;
  className?: string;
  icon?: React.ReactNode;
}

export function Select({ value, onChange, options, placeholder, className = '', icon }: SelectProps) {
  return (
    <div className={`relative ${className}`}>
      {icon && (
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-navy-400 pointer-events-none z-10">
          {icon}
        </span>
      )}
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={`glass-input w-full h-10 rounded-xl text-sm appearance-none cursor-pointer ${icon ? 'pl-10 pr-9' : 'px-3 pr-9'}`}
      >
        {placeholder && <option value="">{placeholder}</option>}
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-navy-400 pointer-events-none">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M6 9l6 6 6-6" />
        </svg>
      </span>
    </div>
  );
}
