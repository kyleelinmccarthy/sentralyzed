import { forwardRef, type HTMLAttributes } from 'react'

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  gradient?: string
}

export const Card = forwardRef<HTMLDivElement, CardProps>(function Card(
  { className = '', gradient, children, ...props },
  ref,
) {
  return (
    <div
      ref={ref}
      className={`bg-light-surface dark:bg-dark-card rounded-xl border border-light-border dark:border-dark-border shadow-[0_1px_3px_rgba(0,0,0,0.04)] dark:shadow-none ${className}`}
      style={gradient ? { background: gradient, border: 'none' } : undefined}
      {...props}
    >
      {children}
    </div>
  )
})
