import { InputHTMLAttributes } from 'react';
import './forms.css';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
}

export function Input({ label, error, hint, className = '', ...props }: InputProps) {
  return (
    <div className="ui-field">
      {label && <label className="ui-label">{label}</label>}
      <input
        className={`ui-control ${error ? 'is-error' : ''} ${className}`}
        {...props}
      />
      {error && <p className="ui-error-msg">{error}</p>}
      {hint  && <p className="ui-hint">{hint}</p>}
    </div>
  );
}
