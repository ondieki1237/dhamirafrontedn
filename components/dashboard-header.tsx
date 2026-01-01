"use client"

import { Bell, Search, LogOut, Loader2, Menu } from "lucide-react"
import { Input } from "@/components/ui/input"
import { useState, useEffect } from "react"
import { useRouter, useSearchParams, usePathname } from "next/navigation"
import { apiGet, apiPutJson } from "@/lib/api"
import { formatDistanceToNow, parseISO } from "date-fns"
import { Notification, NotificationsResponse } from "@/lib/types/notifications"
import { useIsMobile } from "@/hooks/use-media-query"
import { cn } from "@/lib/utils"

interface DashboardHeaderProps {
  onMenuClick?: () => void
}

export function DashboardHeader({ onMenuClick }: DashboardHeaderProps) {
  const [showNotifications, setShowNotifications] = useState(false)
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const searchParams = useSearchParams()
  const pathname = usePathname()
  const [q, setQ] = useState(searchParams?.get("q") || "")
  const isMobile = useIsMobile()

  useEffect(() => {
    setQ(searchParams?.get("q") || "")
  }, [searchParams])

  useEffect(() => {
    if (showNotifications) {
      fetchNotifications()
    }
  }, [showNotifications])

  const fetchNotifications = async () => {
    try {
      setLoading(true)
      // Fetch only unread notifications for the dropdown
      const data = await apiGet<NotificationsResponse>("/api/logs/notifications?unread=true&limit=5")
      setNotifications(data.items || [])
    } catch (e) {
      console.error("Failed to fetch notifications:", e)
    } finally {
      setLoading(false)
    }
  }

  const handleMarkAsRead = async (id: string) => {
    try {
      await apiPutJson(`/api/logs/notifications/${id}/read`, {})
      setNotifications(prev => prev.filter(n => n._id !== id))
    } catch (e) {
      console.error("Failed to mark notification as read:", e)
    }
  }

  const handleLogout = () => {
    try {
      // Clear local storage
      localStorage.removeItem("token")
      localStorage.removeItem("user")
      // Clear cookie by expiring it
      document.cookie = "token=; Path=/; Max-Age=0; SameSite=Lax; Secure"
    } catch { }
    router.push("/login")
  }

  return (
    <header className="bg-card border-b border-border px-3 md:px-8 py-3 md:py-4">
      <div className="flex items-center justify-between gap-2 md:gap-4">
        {/* Mobile Menu Button */}
        {isMobile && (
          <button
            onClick={onMenuClick}
            className="md:hidden w-10 h-10 rounded-lg flex items-center justify-center hover:bg-muted transition-colors touch-target"
            aria-label="Open menu"
          >
            <Menu className="w-5 h-5 text-foreground" />
          </button>
        )}

        {/* Search Bar */}
        <div className="flex-1 max-w-md">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder={isMobile ? "Search..." : "Search clients, loans, groups..."}
              className="pl-10 neumorphic-inset bg-background border-0 h-10 md:h-auto mobile-text-base"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  const next = q ? `${pathname}?q=${encodeURIComponent(q)}` : pathname
                  router.push(next)
                }
              }}
            />
          </div>
        </div>

        <div className="flex items-center gap-2 md:gap-3">
          <div className="relative">
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              className="relative w-10 h-10 rounded-full neumorphic neumorphic-hover flex items-center justify-center bg-background touch-target"
              aria-label="Notifications"
            >
              <Bell className="w-5 h-5 text-foreground" />
              {notifications.length > 0 && (
                <span className="absolute top-1 right-1 w-2 h-2 bg-secondary rounded-full"></span>
              )}
            </button>

            {showNotifications && (
              <>
                {/* Mobile overlay */}
                {isMobile && (
                  <div 
                    className="fixed inset-0 z-40" 
                    onClick={() => setShowNotifications(false)}
                  />
                )}
                <div className={cn(
                  "absolute right-0 mt-2 bg-card rounded-xl shadow-xl border border-border neumorphic z-50 animate-slide-up",
                  isMobile ? "w-[calc(100vw-2rem)] max-w-sm" : "w-80"
                )}>
                  <div className="p-4 border-b border-border">
                    <h3 className="font-semibold text-foreground">Notifications</h3>
                  </div>
                  <div className="max-h-96 overflow-y-auto">
                    {loading ? (
                      <div className="p-8 flex items-center justify-center">
                        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                      </div>
                    ) : notifications.length > 0 ? (
                      notifications.map((notif) => (
                        <div
                          key={notif._id}
                          className="p-4 border-b border-border hover:bg-muted/50 transition-colors cursor-pointer relative group touch-target"
                          onClick={() => handleMarkAsRead(notif._id)}
                        >
                          <p className="font-semibold text-sm text-foreground mb-1">{notif.title}</p>
                          <p className="text-sm text-muted-foreground mb-2 line-clamp-2">{notif.body}</p>
                          <p className="text-xs text-muted-foreground">
                            {formatDistanceToNow(parseISO(notif.createdAt), { addSuffix: true })}
                          </p>
                        </div>
                      ))
                    ) : (
                      <div className="p-8 text-center text-sm text-muted-foreground">
                        No recent notifications
                      </div>
                    )}
                  </div>
                  <div className="p-3 border-t border-border text-center">
                    <button
                      onClick={() => {
                        setShowNotifications(false)
                        router.push("/notifications")
                      }}
                      className="text-sm text-primary font-medium hover:underline touch-target"
                    >
                      View all notifications
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>

          <button
            onClick={handleLogout}
            className="w-10 h-10 rounded-full neumorphic neumorphic-hover flex items-center justify-center bg-background touch-target"
            title="Logout"
            aria-label="Logout"
          >
            <LogOut className="w-5 h-5 text-foreground" />
          </button>
        </div>
      </div>
    </header>
  )
}
