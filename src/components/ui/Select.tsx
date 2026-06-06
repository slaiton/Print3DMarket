import { SelectHTMLAttributes } from 'react';
import './forms.css';

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  options: { value: string; label: string }[];
  placeholder?: string;
}

export function Select({ label, error, options, placeholder, className = '', ...props }: SelectProps) {
  return (
    <div className="ui-field">
      {label && <label className="ui-label">{label}</label>}
      <select
        className={`ui-control ui-select ${error ? 'is-error' : ''} ${className}`}
        {...props}
      >
        {placeholder && <option value="">{placeholder}</option>}
        {options.map(o => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
      {error && <p className="ui-error-msg">{error}</p>}
    </div>
  );
}
