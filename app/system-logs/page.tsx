"use client"

import { DashboardLayout } from "@/components/dashboard-layout"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { apiGet, getCurrentUser } from "@/lib/api"
import { LogsResponse, LogEntry } from "@/lib/types/notifications"
import { useEffect, useState } from "react"
import { Terminal, RefreshCw, Filter, AlertCircle, Info, FileText, ChevronRight } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { useRouter } from "next/navigation"

export default function SystemLogsPage() {
    const [logs, setLogs] = useState<LogEntry[]>([])
    const [loading, setLoading] = useState(true)
    const [file, setFile] = useState<"all" | "error">("all")
    const [level, setLevel] = useState<string>("")
    const [limit, setLimit] = useState(100)
    const { toast } = useToast()
    const router = useRouter()
    const user = getCurrentUser()

    useEffect(() => {
        // RBAC check
        if (user && !["super_admin", "initiator_admin", "approver_admin"].includes(user.role)) {
            toast({ title: "Access Denied", description: "You do not have permission to view logs." })
            router.push("/dashboard")
            return
        }
        fetchLogs()
    }, [file, level, limit])

    const fetchLogs = async () => {
        try {
            setLoading(true)
            let query = `?file=${file}&limit=${limit}`
            if (level) query += `&level=${level}`

            const data = await apiGet<LogsResponse>(`/api/logs${query}`)
            setLogs(data.entries || [])
        } catch (e: any) {
            toast({ title: "Error", description: e?.message || "Failed to load logs" })
        } finally {
            setLoading(false)
        }
    }

    const getLevelBadge = (level: string) => {
        const l = level.toLowerCase()
        if (l.includes("error")) return <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">ERROR</Badge>
        if (l.includes("warn")) return <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">WARN</Badge>
        if (l.includes("info")) return <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">INFO</Badge>
        return <Badge variant="outline">{level.toUpperCase()}</Badge>
    }

    return (
        <DashboardLayout>
            <div className="space-y-6">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-3xl font-bold text-foreground flex items-center gap-3">
                            <Terminal className="w-8 h-8 text-primary" />
                            System Logs
                        </h1>
                        <p className="text-muted-foreground mt-1">Operational visibility into server-side activities.</p>
                    </div>
                    <div className="flex items-center gap-3">
                        <Button variant="outline" onClick={fetchLogs} disabled={loading} className="gap-2 rounded-xl h-11 px-6">
                            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
                            Refresh
                        </Button>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                    {/* Filters */}
                    <Card className="lg:col-span-1 p-6 space-y-6 neumorphic bg-card border-0 h-fit sticky top-6">
                        <div className="space-y-4">
                            <h3 className="font-bold flex items-center gap-2">
                                <Filter className="w-4 h-4 text-primary" />
                                Filters
                            </h3>

                            <div className="space-y-2">
                                <label className="text-xs font-semibold text-muted-foreground uppercase">Log File</label>
                                <div className="grid grid-cols-2 gap-2">
                                    <button
                                        onClick={() => setFile("all")}
                                        className={`py-2 rounded-lg text-sm border-0 transition-all ${file === 'all' ? 'bg-primary text-white shadow-lg' : 'bg-muted text-muted-foreground hover:bg-muted/80'}`}
                                    >
                                        All.log
                                    </button>
                                    <button
                                        onClick={() => setFile("error")}
                                        className={`py-2 rounded-lg text-sm border-0 transition-all ${file === 'error' ? 'bg-red-600 text-white shadow-lg' : 'bg-muted text-muted-foreground hover:bg-muted/80'}`}
                                    >
                                        Error.log
                                    </button>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-xs font-semibold text-muted-foreground uppercase">Level</label>
                                <select
                                    value={level}
                                    onChange={(e) => setLevel(e.target.value)}
                                    className="w-full px-3 py-2 bg-background rounded-lg border-0 neumorphic-inset focus:outline-none focus:ring-2 focus:ring-primary text-sm"
                                >
                                    <option value="">All Levels</option>
                                    <option value="info">Info</option>
                                    <option value="warn">Warning</option>
                                    <option value="error">Error</option>
                                </select>
                            </div>

                            <div className="space-y-2">
                                <label className="text-xs font-semibold text-muted-foreground uppercase">Limit</label>
                                <select
                                    value={limit}
                                    onChange={(e) => setLimit(Number(e.target.value))}
                                    className="w-full px-3 py-2 bg-background rounded-lg border-0 neumorphic-inset focus:outline-none focus:ring-2 focus:ring-primary text-sm"
                                >
                                    <option value={50}>50 lines</option>
                                    <option value={100}>100 lines</option>
                                    <option value={200}>200 lines</option>
                                    <option value={500}>500 lines</option>
                                </select>
                            </div>
                        </div>

                        <div className="pt-4 border-t border-border">
                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                <Info className="w-4 h-4" />
                                <span>Showing last {logs.length} entries</span>
                            </div>
                        </div>
                    </Card>

                    {/* Log List */}
                    <div className="lg:col-span-3 space-y-4">
                        {loading ? (
                            <div className="bg-card neumorphic p-20 rounded-2xl flex flex-col items-center justify-center text-muted-foreground">
                                <RefreshCw className="w-10 h-10 animate-spin mb-4" />
                                <p>Retrieving server logs...</p>
                            </div>
                        ) : logs.length === 0 ? (
                            <div className="bg-card neumorphic p-20 rounded-2xl text-center text-muted-foreground">
                                <FileText className="w-12 h-12 mx-auto mb-4 opacity-20" />
                                <p>No log entries matching your criteria.</p>
                            </div>
                        ) : (
                            <div className="space-y-2">
                                {logs.map((entry, idx) => (
                                    <Card key={idx} className="neumorphic bg-card border-0 p-4 transition-all hover:bg-muted/10 group">
                                        <div className="flex items-start gap-4">
                                            <div className="mt-1">
                                                {entry.level.toLowerCase().includes('error') ? (
                                                    <AlertCircle className="w-5 h-5 text-red-500" />
                                                ) : (
                                                    <FileText className="w-5 h-5 text-blue-500" />
                                                )}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-3 mb-1">
                                                    <span className="text-xs font-mono text-muted-foreground">{entry.timestamp}</span>
                                                    {getLevelBadge(entry.level)}
                                                </div>
                                                <p className="font-mono text-sm break-words text-foreground selection:bg-primary/20">
                                                    {entry.message}
                                                </p>
                                            </div>
                                        </div>
                                    </Card>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </DashboardLayout>
    )
}
