"use client"

import { DollarSign, Users, TrendingUp, AlertCircle } from "lucide-react"
import { Card } from "@/components/ui/card"

const stats = [
  {
    title: "Total Loans",
    value: "KES 4,285,000",
    change: "+12.5%",
    trend: "up",
    icon: DollarSign,
    color: "text-primary",
  },
  {
    title: "Active Clients",
    value: "1,248",
    change: "+8.2%",
    trend: "up",
    icon: Users,
    color: "text-secondary",
  },
  {
    title: "Disbursed Today",
    value: "KES 245,000",
    change: "+23.1%",
    trend: "up",
    icon: TrendingUp,
    color: "text-secondary",
  },
  {
    title: "Pending Approvals",
    value: "14",
    change: "-4.3%",
    trend: "down",
    icon: AlertCircle,
    color: "text-primary",
  },
]

export function DashboardStats() {
  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
      {stats.map((stat, index) => (
        <Card
          key={stat.title}
          className="neumorphic neumorphic-hover p-6 bg-card border-0 relative overflow-hidden group"
          style={{ animationDelay: `${index * 100}ms` }}
        >
          <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-primary/5 to-transparent rounded-full -mr-16 -mt-16 group-hover:scale-110 transition-transform duration-500"></div>

          <div className="relative">
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm font-medium text-muted-foreground">{stat.title}</p>
              <div
                className={`w-10 h-10 rounded-xl neumorphic-inset flex items-center justify-center ${stat.color} bg-background/50`}
              >
                <stat.icon className="w-5 h-5" />
              </div>
            </div>

            <div className="space-y-2">
              <h3 className="text-2xl font-bold text-foreground">{stat.value}</h3>
              <p
                className={`text-xs font-medium flex items-center gap-1 ${stat.trend === "up" ? "text-secondary" : "text-destructive"}`}
              >
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
