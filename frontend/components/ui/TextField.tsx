'use client';

import { useState } from 'react';
import { EyeOpenIcon, EyeOffIcon } from '@/components/icons';
import s from './TextField.module.css';

export interface TextFieldProps {
  id: string;
  label: string;
  type?: 'text' | 'email' | 'password';
  value: string;
  onChange: (value: string) => void;
  error?: string;
  icon?: React.ReactNode;
  autoComplete?: string;
  placeholder?: string;
  hint?: React.ReactNode;
}

export function TextField({
  id,
  label,
  type = 'text',
  value,
  onChange,
  error,
  icon,
  autoComplete,
  placeholder,
  hint,
}: TextFieldProps) {
  const [show, setShow] = useState(false);
  const isPassword = type === 'password';
  const inputType = isPassword ? (show ? 'text' : 'password') : type;

  return (
    <div className={`${s.field} ${error ? s['has-error'] : ''}`}>
      <div className={s['field-row']}>
        <label htmlFor={id}>{label}</label>
        {hint}
      </div>
      <div className={s['input-wrap']}>
        <input
          type={inputType}
          id={id}
          placeholder={placeholder}
          autoComplete={autoComplete}
          value={value}
          onChange={(e) => onChange(e.target.value)}
        />
        {icon}
        {isPassword && (
          <button
            className={s['eye-btn']}
            type="button"
            onClick={() => setShow(!show)}
            aria-label={show ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
          >
            {show ? <EyeOffIcon /> : <EyeOpenIcon />}
          </button>
        )}
      </div>
      {error && <div className={s['field-error']}>{error}</div>}
    </div>
  );
}
