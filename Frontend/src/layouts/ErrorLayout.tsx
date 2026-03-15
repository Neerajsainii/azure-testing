import type { ReactNode } from "react"

export default function ErrorLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
      <div className="max-w-md w-full text-center">
        {children}
      </div>
    </div>
  )
}
