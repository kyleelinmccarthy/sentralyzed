import type { ButtonHTMLAttributes } from 'react'

type Variant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger'
type Size = 'sm' | 'md' | 'lg'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
  size?: Size
  isLoading?: boolean
}

const variantStyles: Record<Variant, string> = {
  primary: 'bg-indigo text-white hover:bg-indigo/90',
  secondary: 'bg-slate-gray text-white hover:bg-slate-gray/90',
  outline:
    'border border-french-gray dark:border-dark-border text-jet dark:text-dark-text hover:bg-gray-50 dark:hover:bg-dark-card',
  ghost: 'text-jet dark:text-dark-text hover:bg-gray-100 dark:hover:bg-dark-card',
  danger: 'bg-coral text-white hover:bg-coral/90',
}

const sizeStyles: Record<Size, string> = {
  sm: 'px-3 py-1.5 text-sm',
  md: 'px-4 py-2 text-sm',
  lg: 'px-6 py-3 text-base',
}

export function Button({
  variant = 'primary',
  size = 'md',
  isLoading,
  className = '',
  children,
  disabled,
  ...props
}: ButtonProps) {
  return (
    <button
      className={`inline-flex items-center justify-center font-medium rounded-[8px] transition-colors
        ${variantStyles[variant]} ${sizeStyles[size]}
        ${disabled || isLoading ? 'opacity-50 cursor-not-allowed' : ''}
        ${className}`}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading ? (
        <svg className="animate-spin -ml-1 mr-2 h-4 w-4" viewBox="0 0 24 24" fill="none">
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
          />
        </svg>
      ) : null}
      {children}
    </button>
  )
}
