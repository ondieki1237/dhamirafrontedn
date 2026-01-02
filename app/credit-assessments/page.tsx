"use client"

import { useEffect, useState } from "react"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation"
import { apiGet, getCurrentUser } from "@/lib/api"
import { useToast } from "@/hooks/use-toast"

type LoanPendingAssessment = {
  _id: string
  clientId: {
    _id: string
    name: string
    nationalId: string
    phone: string
  }
  groupId?: {
    _id: string
    name: string
  }
  product: string
  principal_cents: number
  status: string
  createdAt: string
}

export default function CreditAssessmentsPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [loans, setLoans] = useState<LoanPendingAssessment[]>([])
  const [loading, setLoading] = useState(true)
  const user = getCurrentUser()

  // Only admins can perform credit assessments (part of approval process)
  const canAccess = user?.role && ["initiator_admin", "approver_admin"].includes(user.role)

  useEffect(() => {
    if (!canAccess) {
      toast({ title: "Access Denied", description: "Only admins can perform credit assessments" })
      router.push("/dashboard")
      return
    }

    let mounted = true
      ; (async () => {
        try {
          setLoading(true)
          const response = await apiGet<any>("/api/loans?status=initiated")
          const loansList = Array.isArray(response) ? response : (response?.data || [])

          // Filter out loans that already have a credit assessment
          const pendingLoans = loansList.filter((loan: any) => !loan.creditAssessment)

          if (mounted) setLoans(pendingLoans)
        } catch (e: any) {
          const msg = e?.message || "Failed to load loans pending assessment"
          if (mounted) toast({ title: "Error", description: msg })
        } finally {
          if (mounted) setLoading(false)
        }
      })()
    return () => {
      mounted = false
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [toast])

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Loans Pending Assessment</h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1">Loans that need credit evaluation</p>
        </div>

        <Card className="neumorphic p-3 sm:p-6 bg-card border-0">
          {loading ? (
            <p className="text-xs sm:text-sm text-muted-foreground">Loading loans…</p>
          ) : loans.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-sm text-muted-foreground">No loans pending assessment</p>
              <p className="text-xs text-muted-foreground mt-2">All initiated loans have been assessed</p>
            </div>
          ) : (
            <>
              {/* Desktop Table View */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left py-3 px-4 text-xs sm:text-sm font-semibold text-foreground">Client</th>
                      <th className="text-left py-3 px-4 text-xs sm:text-sm font-semibold text-foreground">Group</th>
                      <th className="text-left py-3 px-4 text-xs sm:text-sm font-semibold text-foreground">Product</th>
                      <th className="text-left py-3 px-4 text-xs sm:text-sm font-semibold text-foreground">Amount</th>
                      <th className="text-left py-3 px-4 text-xs sm:text-sm font-semibold text-foreground">Date</th>
                      <th className="text-left py-3 px-4 text-xs sm:text-sm font-semibold text-foreground">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loans.map((loan) => {
                      const clientName = typeof loan.clientId === 'object' ? loan.clientId.name : '—'
                      const groupName = loan.groupId && typeof loan.groupId === 'object' ? loan.groupId.name : '—'
                      const amount = loan.principal_cents / 100
                      const created = new Date(loan.createdAt).toISOString().slice(0, 10)

                      return (
                        <tr key={loan._id} className="border-b border-border hover:bg-muted/50 transition-colors">
                          <td className="py-4 px-4 font-semibold text-xs sm:text-sm">{clientName}</td>
                          <td className="py-4 px-4 text-xs sm:text-sm text-muted-foreground">{groupName}</td>
                          <td className="py-4 px-4">
                            <Badge variant="outline" className="uppercase text-xs">
                              {loan.product}
                            </Badge>
                          </td>
                          <td className="py-4 px-4 font-semibold text-secondary text-xs sm:text-sm">
                            KES {amount.toLocaleString()}
                          </td>
                          <td className="py-4 px-4 text-muted-foreground text-xs sm:text-sm">{created}</td>
                          <td className="py-4 px-4">
                            <Button
                              variant="default"
                              size="sm"
                              onClick={() => router.push(`/loans/${loan._id}/assess`)}
                              className="text-xs bg-primary hover:bg-primary/90"
                            >
                              Assess
                            </Button>
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
                  const clientName = typeof loan.clientId === 'object' ? loan.clientId.name : '—'
                  const groupName = loan.groupId && typeof loan.groupId === 'object' ? loan.groupId.name : '—'
                  const amount = loan.principal_cents / 100
                  const created = new Date(loan.createdAt).toISOString().slice(0, 10)

                  return (
                    <div key={loan._id} className="p-3 rounded-lg bg-muted/20 border border-border space-y-2">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-foreground">{clientName}</p>
                          <p className="text-xs text-muted-foreground mt-1">{groupName}</p>
                        </div>
                        <Badge variant="outline" className="uppercase text-xs">
                          {loan.product}
                        </Badge>
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div>
                          <p className="text-muted-foreground">Amount</p>
                          <p className="font-semibold text-secondary">KES {amount.toLocaleString()}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Date</p>
                          <p className="font-semibold">{created}</p>
                        </div>
                      </div>
                      <div className="pt-2 border-t border-border">
                        <Button
                          variant="default"
                          size="sm"
                          onClick={() => router.push(`/loans/${loan._id}/assess`)}
                          className="w-full text-xs h-8 bg-primary hover:bg-primary/90"
                        >
                          Assess Now
                        </Button>
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
