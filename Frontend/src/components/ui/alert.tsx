import { AlertCircle, X } from "lucide-react"

interface AlertProps {
  title?: string
  description?: string
  variant?: "default" | "destructive"
  onClose?: () => void
}

export function Alert({ title, description, variant = "default", onClose }: AlertProps) {
  const bgColor = variant === "destructive" ? "bg-red-500/10 border-red-500/50" : "bg-blue-500/10 border-blue-500/50"
  const textColor = variant === "destructive" ? "text-red-400" : "text-blue-400"

  return (
    <div className={`flex items-start gap-3 p-4 rounded-lg border ${bgColor} ${textColor}`}>
      <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
      <div className="flex-1">
        {title && <div className="font-semibold">{title}</div>}
        {description && <div className="text-sm opacity-90">{description}</div>}
      </div>
      {onClose && (
        <button onClick={onClose} className="text-white/50 hover:text-white">
          <X className="w-4 h-4" />
        </button>
      )}
    </div>
  )
}

export function AlertDescription({ children }: { children: React.ReactNode }) {
  return <div className="text-sm">{children}</div>
}
