"use client"

import { DashboardLayout } from "@/components/dashboard-layout"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { DollarSign, TrendingUp, AlertCircle, CheckCircle2, Clock } from "lucide-react"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { apiGet, getCurrentUser } from "@/lib/api"
import { useToast } from "@/hooks/use-toast"
import Link from "next/link"

type PerformanceData = {
  loansInitiated: { count: number; amountCents: number }
  loansDisbursed: { count: number; amountCents: number }
  loansInArrears: { count: number; amountCents: number; clients: Array<{ _id: string; name: string; loanId: string; daysOverdue: number }> }
  loansRecovered: { count: number; principal: number; interest: number; totalCents: number }
  myGroups: Array<{ _id: string; name: string; memberCount: number }>
}

export default function LoanOfficerDashboardPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [data, setData] = useState<PerformanceData | null>(null)
  const [loading, setLoading] = useState(true)
  const [blocked, setBlocked] = useState(false)
  const user = getCurrentUser()

  useEffect(() => {
    // Only loan officers can access this dashboard
    if (user?.role !== "loan_officer") {
      setBlocked(true)
    }

    const fetchData = async () => {
      try {
        setLoading(true)
        const response = await apiGet<any>("/api/loan-officers/performance")
        setData(response?.data || response)
      } catch (e: any) {
        toast({ 
          title: "Error", 
          description: e?.message || "Failed to load performance data" 
        })
      } finally {
        setLoading(false)
      }
    }

    if (!blocked) {
      fetchData()
    }
  }, [blocked])

  if (blocked) {
    return (
      <DashboardLayout>
        <div className="max-w-6xl mx-auto p-8">
          <Card className="neumorphic p-8 bg-card border-0 text-center">
            <AlertCircle className="w-16 h-16 text-destructive mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-foreground mb-2">Access Denied</h2>
            <p className="text-muted-foreground">This dashboard is only available to Loan Officers.</p>
          </Card>
        </div>
      </DashboardLayout>
    )
  }

  if (loading) {
    return (
      <DashboardLayout>
        <div className="max-w-6xl mx-auto p-8">
          <div className="text-center">
            <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-muted-foreground">Loading your performance data...</p>
          </div>
        </div>
      </DashboardLayout>
    )
  }

  const statsData = [
    {
      title: "Loans Initiated",
      value: data?.loansInitiated?.count || 0,
      amount: data?.loansInitiated?.amountCents || 0,
      icon: Clock,
      color: "text-blue-600",
      bgColor: "bg-blue-50",
      description: "Applications in pipeline",
    },
    {
      title: "Loans Disbursed",
      value: data?.loansDisbursed?.count || 0,
      amount: data?.loansDisbursed?.amountCents || 0,
      icon: DollarSign,
      color: "text-secondary",
      bgColor: "bg-green-50",
      description: "Successfully sent to groups",
    },
    {
      title: "Loans in Arrears",
      value: data?.loansInArrears?.count || 0,
      amount: data?.loansInArrears?.amountCents || 0,
      icon: AlertCircle,
      color: "text-destructive",
      bgColor: "bg-red-50",
      description: "Require follow-up action",
    },
    {
      title: "Loans Recovered",
      value: data?.loansRecovered?.count || 0,
      amount: data?.loansRecovered?.totalCents || 0,
      icon: CheckCircle2,
      color: "text-primary",
      bgColor: "bg-blue-50",
      description: "Successfully paid back",
    },
  ]

  return (
    <DashboardLayout>
      <div className="max-w-6xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Performance Dashboard</h1>
          <p className="text-sm text-muted-foreground mt-1">Track your portfolio health and performance</p>
        </div>

        {/* KPI Cards */}
        <div className="grid gap-4 md:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
          {statsData.map((stat, index) => (
            <Card
              key={stat.title}
              className="neumorphic p-4 md:p-6 bg-card border-0 relative overflow-hidden group hover:shadow-lg transition-all"
            >
              <div className={`absolute top-0 right-0 w-32 h-32 ${stat.bgColor} rounded-full -mr-16 -mt-16 opacity-20 group-hover:scale-110 transition-transform duration-500`}></div>

              <div className="relative">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-xs font-medium text-muted-foreground">{stat.title}</p>
                  <div className={`w-10 h-10 rounded-xl ${stat.bgColor} flex items-center justify-center`}>
                    <stat.icon className={`w-5 h-5 ${stat.color}`} />
                  </div>
                </div>

                <div className="space-y-1">
                  <h3 className="text-2xl font-bold text-foreground">{stat.value}</h3>
                  <p className="text-xs text-muted-foreground">{stat.description}</p>
                  <p className={`text-sm font-semibold ${stat.color}`}>
                    KES {(stat.amount / 100).toLocaleString()}
                  </p>
                </div>
              </div>
            </Card>
          ))}
        </div>

        {/* My Groups */}
        <Card className="neumorphic p-6 bg-card border-0">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-xl font-bold text-foreground">My Groups</h2>
              <p className="text-sm text-muted-foreground mt-1">Groups under your management</p>
            </div>
            <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20">
              {data?.myGroups?.length || 0} Groups
            </Badge>
          </div>

          {!data?.myGroups || data.myGroups.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <p className="text-sm">No groups assigned yet</p>
            </div>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {data.myGroups.map((group) => (
                <Link
                  key={group._id}
                  href={`/groups/${group._id}`}
                  className="p-4 rounded-xl border border-border hover:border-primary/30 transition-all bg-muted/20 hover:bg-muted/40"
                >
                  <h3 className="font-semibold text-foreground">{group.name}</h3>
                  <p className="text-xs text-muted-foreground mt-1">
                    {group.memberCount || 0} members
                  </p>
                </Link>
              ))}
            </div>
          )}
        </Card>

        {/* Arrears Details */}
        {data?.loansInArrears && data.loansInArrears.count > 0 && (
          <Card className="neumorphic p-6 bg-card border-0">
            <div className="flex items-center gap-2 mb-4">
              <AlertCircle className="w-5 h-5 text-destructive" />
              <h2 className="text-xl font-bold text-foreground">Clients in Arrears</h2>
              <Badge variant="outline" className="bg-destructive/10 text-destructive border-destructive/20">
                {data.loansInArrears.count} Clients
              </Badge>
            </div>

            <div className="space-y-2">
              {data.loansInArrears.clients?.map((client) => (
                <Link
                  key={client._id}
                  href={`/loans/${client.loanId}`}
                  className="flex items-center justify-between p-3 rounded-lg border border-border hover:border-destructive/30 transition-all bg-muted/20 hover:bg-muted/40"
                >
                  <div>
                    <p className="font-semibold text-foreground">{client.name}</p>
                    <p className="text-xs text-muted-foreground">ID: {client._id}</p>
                  </div>
                  <Badge variant="outline" className="bg-destructive/10 text-destructive border-destructive/20">
                    {client.daysOverdue} days overdue
                  </Badge>
                </Link>
              ))}
            </div>
          </Card>
        )}
      </div>
    </DashboardLayout>
  )
}
