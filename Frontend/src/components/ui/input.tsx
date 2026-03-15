import React from "react"

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  helperText?: string
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, helperText, className = "", ...props }, ref) => {
    return (
      <div className="flex flex-col gap-1">
        {label && <label className="text-sm font-medium text-white/80">{label}</label>}
        <input
          ref={ref}
          className={`px-4 py-2 rounded-lg bg-white/10 border border-white/20 text-white placeholder-white/50 focus:outline-none focus:border-white/50 transition-colors ${className} ${
            error ? "border-red-500" : ""
          }`}
          {...props}
        />
        {error && <span className="text-sm text-red-500">{error}</span>}
        {helperText && <span className="text-sm text-white/50">{helperText}</span>}
      </div>
    )
  }
)

Input.displayName = "Input"
