import { useState, useRef, useEffect } from "react"
import { Bell, BellOff, Check, X, Trash2 } from "lucide-react"
import { commonAPI } from "@/lib/api"

type Notification = {
  id: string
  title: string
  body?: string
  time: string
  read?: boolean
}

export default function NotificationBell() {
  const [open, setOpen] = useState(false)
  const [items, setItems] = useState<Notification[]>([])

  const ref = useRef<HTMLDivElement | null>(null)

  // Fetch notifications from backend
  const fetchNotifications = async () => {
    try {
      const res = await commonAPI.getNotifications()
      // Adapt backend response to frontend model if necessary
      // Assuming backend returns array of notifications directly
      if (Array.isArray(res.data)) {
        setItems(res.data)
      } else if (res.data && Array.isArray(res.data.notifications)) {
        setItems(res.data.notifications)
      }
    } catch (error) {
      console.error("Failed to fetch notifications", error)
    }
  }

  useEffect(() => {
    if (open) {
      fetchNotifications()
    }
  }, [open])

  // Initial fetch
  useEffect(() => {
    fetchNotifications()
    // Poll every 60 seconds
    const interval = setInterval(fetchNotifications, 60000)
    return () => clearInterval(interval)
  }, [])

  // read notificationsEnabled flag from admin settings or per-user fallback
  const readNotificationsEnabled = () => {
    try {
      const s = localStorage.getItem("admin_settings")
      if (s) {
        const parsed = JSON.parse(s)
        if (typeof parsed.notificationsEnabled === "boolean") return parsed.notificationsEnabled
      }
      const fallback = localStorage.getItem("notificationsEnabled")
      if (fallback !== null) return fallback === "true"
    } catch {}
    return true
  }

  const [notificationsEnabled, setNotificationsEnabled] = useState<boolean>(readNotificationsEnabled)

  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (!ref.current) return
      if (e.target instanceof Node && !ref.current.contains(e.target)) {
        setOpen(false)
      }
    }
    document.addEventListener("mousedown", onDoc)
    return () => document.removeEventListener("mousedown", onDoc)
  }, [])

  const unreadCount = items.filter((i) => !i.read).length

  const markAllRead = async () => {
    try {
      await commonAPI.markAllNotificationsRead()
      setItems((prev) => prev.map((i) => ({ ...i, read: true })))
    } catch (e) {
      console.error("Failed to mark all read", e)
    }
  }

  const markRead = async (id: string) => {
    try {
      await commonAPI.markNotificationRead(id)
      setItems((prev) => prev.map((i) => (i.id === id ? { ...i, read: true } : i)))
    } catch (e) {
      console.error("Failed to mark read", e)
    }
  }

  const deleteNotification = async (id: string) => {
    try {
      await commonAPI.deleteNotification(id)
      setItems((prev) => prev.filter((i) => i.id !== id))
    } catch (e) {
      console.error("Failed to delete notification", e)
    }
  }

  const setGlobalNotifications = (enabled: boolean) => {
    try {
      const s = localStorage.getItem("admin_settings")
      const parsed = s ? JSON.parse(s) : {}
      parsed.notificationsEnabled = enabled
      localStorage.setItem("admin_settings", JSON.stringify(parsed))
    } catch {}
    try {
      localStorage.setItem("notificationsEnabled", String(enabled))
    } catch {}
    setNotificationsEnabled(enabled)
  }

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((v) => !v)}
        className="p-2 rounded-full hover:bg-white/10 transition relative"
        aria-label="notifications"
      >
        {notificationsEnabled ? (
          <Bell className="w-5 h-5" />
        ) : (
          <BellOff className="w-5 h-5 text-white/60" />
        )}

        {notificationsEnabled && unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-xs w-5 h-5 rounded-full flex items-center justify-center text-white font-semibold">{unreadCount}</span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 mt-3 w-80 bg-[#0b1220] border border-white/10 rounded-xl shadow-lg z-50">
          <div className="p-3 border-b border-white/5 flex items-center justify-between">
            <div className="font-semibold">Notifications</div>
            <div className="flex items-center gap-2">
              {notificationsEnabled && (
                <button onClick={markAllRead} className="text-sm text-white/60 hover:text-white">Mark all read</button>
              )}
              <button onClick={() => setOpen(false)} className="text-white/60 hover:text-white"><X size={16} /></button>
            </div>
          </div>

          <div className="max-h-64 overflow-auto p-2">
            {!notificationsEnabled && (
              <div className="p-4 text-sm text-white/60">
                Notifications are disabled. <button onClick={() => setGlobalNotifications(true)} className="ml-2 text-blue-400 underline">Enable</button>
              </div>
            )}

            {notificationsEnabled && items.length === 0 && <div className="p-4 text-sm text-white/60">No notifications</div>}

            {notificationsEnabled && items.map((n) => (
              <div key={n.id} className={`p-3 border-b border-white/5 ${n.read ? 'bg-transparent' : 'bg-white/2'}`}>
                <div className="flex items-start justify-between">
                  <div>
                    <div className="font-medium text-white/90">{n.title}</div>
                    {n.body && <div className="text-sm text-white/70">{n.body}</div>}
                    <div className="text-xs text-white/50 mt-1">{n.time}</div>
                  </div>
                  <div className="pl-3 flex flex-col items-end gap-2">
                    {!n.read ? (
                      <button onClick={() => markRead(n.id)} className="text-green-400 text-sm flex items-center gap-1 hover:text-green-300 transition"><Check size={14}/> Read</button>
                    ) : (
                      <div className="text-sm text-white/40">Read</div>
                    )}
                    <button onClick={() => deleteNotification(n.id)} className="text-red-400 text-sm flex items-center gap-1 hover:text-red-300 transition"><Trash2 size={14}/> </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
          {notificationsEnabled && (
            <div className="p-3 border-t border-white/5 text-xs text-white/60 flex items-center justify-between">
              <div>Notifications are sent for important system events.</div>
              <button onClick={() => setGlobalNotifications(false)} className="text-sm text-amber-300">Disable</button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
