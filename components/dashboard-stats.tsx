"use client"

import { useEffect, useState } from "react"
import { DollarSign, Users, TrendingUp, AlertCircle } from "lucide-react"
import { Card } from "@/components/ui/card"
import { apiGet } from "@/lib/api"

function centsToKES(cents: number) {
  return `KES ${Number(cents / 100).toLocaleString()}`
}

export function DashboardStats() {
  const [data, setData] = useState<any | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let mounted = true
      ; (async () => {
        try {
          const json = await apiGet<any>("/api/analytics/overview")
          if (mounted) {
            setData(json)
            setError(null)
          }
        } catch (e: any) {
          if (mounted) {
            setError(e?.message || "Failed to load analytics")
            setData(null)
          }
        }
      })()
    return () => {
      mounted = false
    }
  }, [])

  if (error) {
    return (
      <div className="p-4">
        <div className="text-sm text-destructive mb-2">Analytics unavailable: {error}</div>
        <div className="text-xs text-muted-foreground">Ensure the backend exposes <code>/api/analytics/overview</code> (and other analytics endpoints) and restart the server.</div>
      </div>
    )
  }

  if (!data) {
    return <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">Loading analytics…</div>
  }

  const stats = [
    {
      title: "Total Loans",
      value: data.totalLoans.toLocaleString(),
      change: `${data.trends.totalLoansChangePercent}%`,
      trend: data.trends.totalLoansChangePercent >= 0 ? "up" : "down",
      icon: DollarSign,
      color: "text-primary",
    },
    {
      title: "Total Disbursed",
      value: centsToKES(data.totalDisbursedCents),
      change: `${data.trends.totalDisbursedChangePercent}%`,
      trend: data.trends.totalDisbursedChangePercent >= 0 ? "up" : "down",
      icon: TrendingUp,
      color: "text-secondary",
    },
    {
      title: "Total Clients",
      value: data.totalClients.toLocaleString(),
      change: `${data.trends.totalClientsChangePercent}%`,
      trend: data.trends.totalClientsChangePercent >= 0 ? "up" : "down",
      icon: Users,
      color: "text-secondary",
    },
    {
      title: "Default Rate",
      value: `${data.defaultRatePercent}%`,
      change: `${data.trends.defaultRateChangePercent}%`,
      trend: data.trends.defaultRateChangePercent >= 0 ? "up" : "down",
      icon: AlertCircle,
      color: "text-primary",
    },
  ]

  return (
    <div className="grid gap-4 md:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
      {stats.map((stat, index) => (
        <Card
          key={stat.title}
          className="neumorphic neumorphic-hover p-4 md:p-6 bg-card border-0 relative overflow-hidden group"
          style={{ animationDelay: `${index * 100}ms` }}
        >
          <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-primary/5 to-transparent rounded-full -mr-16 -mt-16 group-hover:scale-110 transition-transform duration-500"></div>

          <div className="relative">
            <div className="flex items-center justify-between mb-3 md:mb-4">
              <p className="text-xs md:text-sm font-medium text-muted-foreground">{stat.title}</p>
              <div className={`w-9 h-9 md:w-10 md:h-10 rounded-xl neumorphic-inset flex items-center justify-center ${stat.color} bg-background/50`}>
                <stat.icon className="w-4 h-4 md:w-5 md:h-5" />
              </div>
            </div>

            <div className="space-y-1 md:space-y-2">
              <h3 className="text-xl md:text-2xl font-bold text-foreground break-words">{stat.value}</h3>
              <p className={`text-xs font-medium flex items-center gap-1 ${stat.trend === "up" ? "text-secondary" : "text-destructive"}`}>
                <TrendingUp className={`w-3 h-3 ${stat.trend === "down" && "rotate-180"}`} />
                {stat.change} from last month
              </p>
            </div>
          </div>
        </Card>
      ))}
    </div>
  )
}
