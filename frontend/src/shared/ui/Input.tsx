import type { InputHTMLAttributes, ReactNode, SelectHTMLAttributes, TextareaHTMLAttributes } from 'react'

const base =
  'w-full rounded-lg border bg-white px-3 py-2 text-stone-800 outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-100'

interface CampoProps {
  id: string
  label: string
  error?: string
  children: ReactNode
}

function Campo({ id, label, error, children }: CampoProps) {
  return (
    <div className="flex flex-col gap-1">
      <label htmlFor={id} className="text-sm font-medium text-stone-700">
        {label}
      </label>
      {children}
      {error && <p className="text-sm text-red-600">{error}</p>}
    </div>
  )
}

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  id: string
  label: string
  error?: string
}

export function Input({ id, label, error, className = '', ...props }: InputProps) {
  return (
    <Campo id={id} label={label} error={error}>
      <input
        id={id}
        aria-invalid={Boolean(error)}
        className={`${base} ${error ? 'border-red-400' : 'border-stone-300'} ${className}`}
        {...props}
      />
    </Campo>
  )
}

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  id: string
  label: string
  error?: string
}

export function Select({ id, label, error, className = '', children, ...props }: SelectProps) {
  return (
    <Campo id={id} label={label} error={error}>
      <select
        id={id}
        className={`${base} ${error ? 'border-red-400' : 'border-stone-300'} ${className}`}
        {...props}
      >
        {children}
      </select>
    </Campo>
  )
}

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  id: string
  label: string
  error?: string
}

export function Textarea({ id, label, error, className = '', ...props }: TextareaProps) {
  return (
    <Campo id={id} label={label} error={error}>
      <textarea
        id={id}
        rows={3}
        className={`${base} ${error ? 'border-red-400' : 'border-stone-300'} ${className}`}
        {...props}
      />
    </Campo>
  )
}
