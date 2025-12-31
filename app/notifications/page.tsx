"use client"

import { DashboardLayout } from "@/components/dashboard-layout"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { apiGet, apiPutJson, apiDelete } from "@/lib/api"
import { formatDistanceToNow, parseISO } from "date-fns"
import { Notification, NotificationsResponse } from "@/lib/types/notifications"
import { useEffect, useState } from "react"
import { Bell, Check, Trash2, Loader2, MailOpen, Mail } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

export default function NotificationsPage() {
    const [notifications, setNotifications] = useState<Notification[]>([])
    const [loading, setLoading] = useState(true)
    const [filter, setFilter] = useState<"all" | "unread">("all")
    const { toast } = useToast()

    useEffect(() => {
        fetchNotifications()
    }, [filter])

    const fetchNotifications = async () => {
        try {
            setLoading(true)
            const query = filter === "unread" ? "?unread=true" : ""
            const data = await apiGet<NotificationsResponse>(`/api/logs/notifications${query}`)
            setNotifications(data.items || [])
        } catch (e: any) {
            toast({ title: "Error", description: e?.message || "Failed to load notifications" })
        } finally {
            setLoading(false)
        }
    }

    const handleMarkAsRead = async (id: string) => {
        try {
            await apiPutJson(`/api/logs/notifications/${id}/read`, {})
            setNotifications(prev => prev.map(n => n._id === id ? { ...n, read: true } : n))
            if (filter === "unread") {
                setNotifications(prev => prev.filter(n => n._id !== id))
            }
        } catch (e: any) {
            toast({ title: "Error", description: e?.message || "Failed to mark as read" })
        }
    }

    const handleDelete = async (id: string) => {
        if (!window.confirm("Delete this notification?")) return
        try {
            await apiDelete(`/api/logs/notifications/${id}`)
            setNotifications(prev => prev.filter(n => n._id !== id))
            toast({ title: "Success", description: "Notification deleted" })
        } catch (e: any) {
            toast({ title: "Error", description: e?.message || "Failed to delete notification" })
        }
    }

    return (
        <DashboardLayout>
            <div className="max-w-4xl mx-auto space-y-6">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-3xl font-bold text-foreground flex items-center gap-3">
                            <Bell className="w-8 h-8 text-primary" />
                            Notifications
                        </h1>
                        <p className="text-muted-foreground mt-1">Manage your system alerts and notifications.</p>
                    </div>
                    <div className="flex bg-muted p-1 rounded-xl w-fit">
                        <button
                            onClick={() => setFilter("all")}
                            className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${filter === "all" ? "bg-background shadow font-bold" : "text-muted-foreground"}`}
                        >
                            All
                        </button>
                        <button
                            onClick={() => setFilter("unread")}
                            className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${filter === "unread" ? "bg-background shadow font-bold" : "text-muted-foreground"}`}
                        >
                            Unread
                        </button>
                    </div>
                </div>

                <Card className="neumorphic bg-card border-0 overflow-hidden">
                    {loading ? (
                        <div className="py-20 flex flex-col items-center justify-center text-muted-foreground">
                            <Loader2 className="w-10 h-10 animate-spin mb-4" />
                            <p>Loading notifications...</p>
                        </div>
                    ) : notifications.length === 0 ? (
                        <div className="py-20 text-center text-muted-foreground">
                            <Bell className="w-12 h-12 mx-auto mb-4 opacity-20" />
                            <p>No notifications found.</p>
                        </div>
                    ) : (
                        <div className="divide-y divide-border">
                            {notifications.map((notif) => (
                                <div
                                    key={notif._id}
                                    className={`p-6 transition-colors hover:bg-muted/30 relative group ${!notif.read ? "bg-primary/5" : ""}`}
                                >
                                    <div className="flex justify-between items-start gap-4">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2 mb-1">
                                                {!notif.read ? (
                                                    <Badge className="bg-primary text-white hover:bg-primary border-0">New</Badge>
                                                ) : null}
                                                <h3 className={`font-semibold text-lg ${!notif.read ? "text-foreground" : "text-muted-foreground"}`}>
                                                    {notif.title}
                                                </h3>
                                            </div>
                                            <p className="text-muted-foreground mb-3 text-sm sm:text-base leading-relaxed">
                                                {notif.body}
                                            </p>
                                            <p className="text-xs text-muted-foreground flex items-center gap-2">
                                                {formatDistanceToNow(parseISO(notif.createdAt), { addSuffix: true })}
                                                {notif.type && <span className="px-2 py-0.5 bg-muted rounded-full">#{notif.type}</span>}
                                            </p>
                                        </div>
                                        <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                            {!notif.read && (
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => handleMarkAsRead(notif._id)}
                                                    className="text-primary hover:text-primary hover:bg-primary/10"
                                                    title="Mark as read"
                                                >
                                                    <Check className="w-4 h-4" />
                                                </Button>
                                            )}
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => handleDelete(notif._id)}
                                                className="text-red-500 hover:text-red-600 hover:bg-red-50"
                                                title="Delete"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </Card>
            </div>
        </DashboardLayout>
    )
}
