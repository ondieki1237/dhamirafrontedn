"use client"

import { useEffect, useState } from "react"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Plus, Filter, Download } from "lucide-react"
import { useRouter } from "next/navigation"
import { apiGet } from "@/lib/api"
import { useToast } from "@/hooks/use-toast"

type LoanItem = {
  _id: string
  client?: { name?: string } | string
  clientName?: string
  type: string
  amount: number
  status: "initiated" | "approved" | "disbursed" | "repaid" | "defaulted" | string
  createdAt?: string
}

const statusColors = {
  initiated: "bg-blue-100 text-blue-700 border-blue-200",
  approved: "bg-secondary/10 text-secondary border-secondary/20",
  disbursed: "bg-primary/10 text-primary border-primary/20",
  repaid: "bg-green-100 text-green-700 border-green-200",
  defaulted: "bg-destructive/10 text-destructive border-destructive/20",
}

export default function LoansPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [loans, setLoans] = useState<LoanItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let mounted = true
    ;(async () => {
      try {
        setLoading(true)
        const data = await apiGet<LoanItem[]>("/api/loans")
        if (mounted) setLoans(data)
      } catch (e: any) {
        const msg = e?.message || "Failed to load loans"
        if (mounted) setError(msg)
        toast({ title: "Error", description: msg })
      } finally {
        if (mounted) setLoading(false)
      }
    })()
    return () => {
      mounted = false
    }
  }, [toast])

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">All Loans</h1>
            <p className="text-muted-foreground mt-1">Manage and track all loan applications</p>
          </div>
          <Button
            onClick={() => router.push("/loans/initiate")}
            className="gap-2 bg-primary text-white neumorphic neumorphic-hover border-0"
          >
            <Plus className="w-4 h-4" />
            New Loan
          </Button>
        </div>

        <div className="flex gap-3">
          <Button variant="outline" className="gap-2 bg-transparent">
            <Filter className="w-4 h-4" />
            Filter
          </Button>
          <Button variant="outline" className="gap-2 bg-transparent">
            <Download className="w-4 h-4" />
            Export
          </Button>
        </div>

        <Card className="neumorphic p-6 bg-card border-0">
          <div className="overflow-x-auto">
            {loading ? (
              <p className="text-sm text-muted-foreground">Loading loans…</p>
            ) : error ? (
              <p className="text-sm text-destructive">{error}</p>
            ) : (
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-3 px-4 text-sm font-semibold text-foreground">Loan ID</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-foreground">Client</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-foreground">Type</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-foreground">Amount</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-foreground">Status</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-foreground">Date</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-foreground">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {loans.map((loan) => {
                    const clientName = typeof loan.client === "string" ? loan.client : loan.client?.name || loan.clientName || "—"
                    const created = loan.createdAt ? new Date(loan.createdAt).toISOString().slice(0, 10) : "—"
                    return (
                      <tr key={loan._id} className="border-b border-border hover:bg-muted/50 transition-colors">
                        <td className="py-4 px-4 font-mono text-sm">{loan._id}</td>
                        <td className="py-4 px-4 font-semibold">{clientName}</td>
                        <td className="py-4 px-4 text-muted-foreground capitalize">{loan.type}</td>
                        <td className="py-4 px-4 font-semibold text-secondary">KES {Number(loan.amount || 0).toLocaleString()}</td>
                        <td className="py-4 px-4">
                          <Badge variant="outline" className={statusColors[loan.status as keyof typeof statusColors] || ""}>
                            {loan.status}
                          </Badge>
                        </td>
                        <td className="py-4 px-4 text-muted-foreground">{created}</td>
                        <td className="py-4 px-4">
                          <Button variant="ghost" size="sm" onClick={() => router.push(`/loans/${loan._id}`)}>
                            View
                          </Button>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            )}
          </div>
        </Card>
      </div>
    </DashboardLayout>
  )
}
