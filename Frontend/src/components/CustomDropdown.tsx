"use client"

import { useState, useRef, useEffect } from "react"

export default function CustomDropdown({
  items,
  value,
  onChange,
  placeholder,
}: {
  items: string[]
  value: string
  onChange: (v: string) => void
  placeholder?: string
}) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    function onDoc(e: MouseEvent) {
      if (!ref.current) return
      if (!ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener("click", onDoc)
    return () => document.removeEventListener("click", onDoc)
  }, [])

  return (
    <div className="relative inline-block" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((s) => !s)}
        className="px-3 py-2 bg-white/10 text-white rounded-md border border-white/10 hover:bg-white/20 flex items-center gap-2"
      >
        <span className="text-sm">{value || placeholder || "Select"}</span>
        <svg className="w-3 h-3 text-white/70" viewBox="0 0 20 20" fill="currentColor"><path d="M5.23 7.21a.75.75 0 011.06.02L10 10.94l3.71-3.71a.75.75 0 111.06 1.06l-4.24 4.24a.75.75 0 01-1.06 0L5.21 8.29a.75.75 0 01.02-1.08z"/></svg>
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-48 bg-[#0b1228] border border-white/10 rounded-md shadow-lg z-50 py-1">
          {items.map((it) => (
            <div
              key={it}
              onClick={() => {
                onChange(it)
                setOpen(false)
              }}
              className="px-3 py-2 text-sm text-white/90 hover:bg-white/5 cursor-pointer"
            >
              {it}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
