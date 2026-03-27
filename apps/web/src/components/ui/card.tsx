import type { HTMLAttributes } from 'react'

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  gradient?: string
}

export function Card({ className = '', gradient, children, ...props }: CardProps) {
  return (
    <div
      className={`bg-white rounded-[12px] shadow-[0_2px_8px_rgba(0,0,0,0.08)] ${className}`}
      style={gradient ? { background: gradient } : undefined}
      {...props}
    >
      {children}
    </div>
  )
}
