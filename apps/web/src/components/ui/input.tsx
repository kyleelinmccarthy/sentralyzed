import { forwardRef, type InputHTMLAttributes } from 'react'

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, className = '', id, ...props }, ref) => {
    return (
      <div className="w-full">
        {label ? (
          <label htmlFor={id} className="block text-sm font-medium text-jet mb-1">
            {label}
          </label>
        ) : null}
        <input
          ref={ref}
          id={id}
          className={`w-full px-3 py-2 rounded-[8px] border text-sm
            ${error ? 'border-coral' : 'border-french-gray'}
            focus:outline-none focus:ring-2 focus:ring-indigo/50 focus:border-indigo
            placeholder:text-french-gray
            ${className}`}
          {...props}
        />
        {error ? <p className="mt-1 text-sm text-coral">{error}</p> : null}
      </div>
    )
  },
)

Input.displayName = 'Input'
