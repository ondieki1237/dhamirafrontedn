"use client"

import { Bell, Search, LogOut } from "lucide-react"
import { Input } from "@/components/ui/input"
import { useState } from "react"
import { useRouter } from "next/navigation"

export function DashboardHeader() {
  const [showNotifications, setShowNotifications] = useState(false)
  const router = useRouter()

  const notifications = [
    { id: 1, title: "New loan application", message: "John Kamau submitted a loan request", time: "5 min ago" },
    { id: 2, title: "Payment received", message: "Jane Wanjiru paid KES 5,000", time: "1 hour ago" },
    { id: 3, title: "Loan approved", message: "Mary Atieno loan approved by approver", time: "2 hours ago" },
  ]

  const handleLogout = () => {
    try {
      // Clear local storage
      localStorage.removeItem("token")
      localStorage.removeItem("user")
      // Clear cookie by expiring it
      document.cookie = "token=; Path=/; Max-Age=0; SameSite=Lax; Secure"
    } catch {}
    router.push("/login")
  }

  return (
    <header className="bg-card border-b border-border px-4 md:px-8 py-4">
      <div className="flex items-center justify-between gap-4">
        <div className="flex-1 max-w-md">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search clients, loans, groups..."
              className="pl-10 neumorphic-inset bg-background border-0"
            />
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative">
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              className="relative w-10 h-10 rounded-full neumorphic neumorphic-hover flex items-center justify-center bg-background"
            >
              <Bell className="w-5 h-5 text-foreground" />
              <span className="absolute top-1 right-1 w-2 h-2 bg-secondary rounded-full"></span>
            </button>

            {showNotifications && (
              <div className="absolute right-0 mt-2 w-80 bg-card rounded-xl shadow-xl border border-border neumorphic z-50 animate-slide-up">
                <div className="p-4 border-b border-border">
                  <h3 className="font-semibold text-foreground">Notifications</h3>
                </div>
                <div className="max-h-96 overflow-y-auto">
                  {notifications.map((notif) => (
                    <div
                      key={notif.id}
                      className="p-4 border-b border-border hover:bg-muted/50 transition-colors cursor-pointer"
                    >
                      <p className="font-semibold text-sm text-foreground mb-1">{notif.title}</p>
                      <p className="text-sm text-muted-foreground mb-2">{notif.message}</p>
                      <p className="text-xs text-muted-foreground">{notif.time}</p>
                    </div>
                  ))}
                </div>
                <div className="p-3 border-t border-border text-center">
                  <button className="text-sm text-primary font-medium hover:underline">View all notifications</button>
                </div>
              </div>
            )}
          </div>

          <button
            onClick={handleLogout}
            className="w-10 h-10 rounded-full neumorphic neumorphic-hover flex items-center justify-center bg-background"
            title="Logout"
          >
            <LogOut className="w-5 h-5 text-foreground" />
          </button>
        </div>
      </div>
    </header>
  )
}
