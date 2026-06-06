import { TextareaHTMLAttributes } from 'react';
import './forms.css';

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
}

export function Textarea({ label, error, className = '', ...props }: TextareaProps) {
  return (
    <div className="ui-field">
      {label && <label className="ui-label">{label}</label>}
      <textarea
        className={`ui-control ui-textarea ${error ? 'is-error' : ''} ${className}`}
        rows={3}
        {...props}
      />
      {error && <p className="ui-error-msg">{error}</p>}
    </div>
  );
}
