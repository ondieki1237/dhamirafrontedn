"use client"

import { useEffect, useState } from "react"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Plus, Filter, Download } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { apiGet, getCurrentUser } from "@/lib/api"
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
  const [userRole, setUserRole] = useState<string | null>(null)

  useEffect(() => {
    const user = getCurrentUser()
    setUserRole(user?.role || null)
  }, [])

  const canInitiate = userRole && ["initiator_admin", "loan_officer"].includes(userRole)

  useEffect(() => {
    let mounted = true
    ;(async () => {
      try {
        setLoading(true)
        const data = await apiGet<any>("/api/loans")
        const normalized = Array.isArray(data) ? data : data?.items || data?.data || data?.loans || []
        if (mounted) setLoans(normalized)
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
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-foreground">All Loans</h1>
            <p className="text-xs sm:text-sm text-muted-foreground mt-1">Manage and track all loan applications</p>
          </div>
          <div className="flex items-center gap-3">
            <Button
              onClick={() => {
                if (canInitiate) router.push("/loans/initiate")
                else toast({ title: "Access denied", description: "You don't have permission to create loans" })
              }}
              className="gap-2 bg-primary text-white neumorphic neumorphic-hover border-0 w-full sm:w-auto text-sm sm:text-base"
            >
              <Plus className="w-4 h-4" />
              New Loan
            </Button>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
          <Button variant="outline" className="gap-2 bg-transparent text-xs sm:text-sm">
            <Filter className="w-4 h-4" />
            Filter
          </Button>
          <Button variant="outline" className="gap-2 bg-transparent text-xs sm:text-sm">
            <Download className="w-4 h-4" />
            Export
          </Button>
        </div>

        <Card className="neumorphic p-3 sm:p-6 bg-card border-0">
          {loading ? (
            <p className="text-xs sm:text-sm text-muted-foreground">Loading loans…</p>
          ) : error ? (
            <p className="text-xs sm:text-sm text-destructive">{error}</p>
          ) : (
            <>
              {/* Desktop Table View */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left py-3 px-4 text-xs sm:text-sm font-semibold text-foreground">Loan ID</th>
                      <th className="text-left py-3 px-4 text-xs sm:text-sm font-semibold text-foreground">Client</th>
                      <th className="text-left py-3 px-4 text-xs sm:text-sm font-semibold text-foreground">Type</th>
                      <th className="text-left py-3 px-4 text-xs sm:text-sm font-semibold text-foreground">Amount</th>
                      <th className="text-left py-3 px-4 text-xs sm:text-sm font-semibold text-foreground">Status</th>
                      <th className="text-left py-3 px-4 text-xs sm:text-sm font-semibold text-foreground">Date</th>
                      <th className="text-left py-3 px-4 text-xs sm:text-sm font-semibold text-foreground">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loans.map((loan) => {
                      const clientName = typeof loan.client === "string" ? loan.client : loan.client?.name || loan.clientName || "—"
                      const created = loan.createdAt ? new Date(loan.createdAt).toISOString().slice(0, 10) : "—"
                      return (
                        <tr key={loan._id} className="border-b border-border hover:bg-muted/50 transition-colors">
                          <td className="py-4 px-4 font-mono text-xs sm:text-sm">{loan._id}</td>
                          <td className="py-4 px-4 font-semibold text-xs sm:text-sm">{clientName}</td>
                          <td className="py-4 px-4 text-muted-foreground capitalize text-xs sm:text-sm">{loan.type}</td>
                          <td className="py-4 px-4 font-semibold text-secondary text-xs sm:text-sm">KES {Number(loan.amount || 0).toLocaleString()}</td>
                          <td className="py-4 px-4">
                            <Badge variant="outline" className={statusColors[loan.status as keyof typeof statusColors] || ""}>
                              {loan.status}
                            </Badge>
                          </td>
                          <td className="py-4 px-4 text-muted-foreground text-xs sm:text-sm">{created}</td>
                          <td className="py-4 px-4">
                            <Link href={`/loans/${loan._id}`} className="inline-flex items-center text-xs text-primary underline hover:text-primary/80">
                              View
                            </Link>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>

              {/* Mobile Card View */}
              <div className="md:hidden space-y-3">
                {loans.map((loan) => {
                  const clientName = typeof loan.client === "string" ? loan.client : loan.client?.name || loan.clientName || "—"
                  const created = loan.createdAt ? new Date(loan.createdAt).toISOString().slice(0, 10) : "—"
                  return (
                    <div key={loan._id} className="p-3 rounded-lg bg-muted/20 border border-border space-y-2">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-mono text-muted-foreground truncate">{loan._id}</p>
                          <p className="text-sm font-semibold text-foreground mt-1">{clientName}</p>
                        </div>
                        <Badge variant="outline" className={statusColors[loan.status as keyof typeof statusColors] || ""}>
                          {loan.status}
                        </Badge>
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div>
                          <p className="text-muted-foreground">Type</p>
                          <p className="font-semibold capitalize">{loan.type}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Amount</p>
                          <p className="font-semibold text-secondary">KES {Number(loan.amount || 0).toLocaleString()}</p>
                        </div>
                      </div>
                      <div className="flex items-center justify-between pt-2 border-t border-border">
                        <p className="text-xs text-muted-foreground">{created}</p>
                        <Link href={`/loans/${loan._id}`} className="inline-flex items-center text-xs text-primary underline hover:text-primary/80 h-8">
                          View
                        </Link>
                      </div>
                    </div>
                  )
                })}
              </div>
            </>
          )}
        </Card>
      </div>
    </DashboardLayout>
  )
}
