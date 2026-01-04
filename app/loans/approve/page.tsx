"use client"

import { useEffect, useState } from "react"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, Check, X } from "lucide-react"
import { useRouter } from "next/navigation"
import { apiGet, apiPutJson, getCurrentUser } from "@/lib/api"
import { useToast } from "@/hooks/use-toast"

type Loan = {
  _id: string
  client: { name: string; nationalId: string } | string
  type: string
  amount: number
  term: number
  status: string
  createdAt: string
  purpose?: string
}

export default function ApproveLoanPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [loans, setLoans] = useState<Loan[]>([])
  const [loading, setLoading] = useState(true)
  const user = getCurrentUser()

  // Admins can approve loans (checker role in maker-checker model)
  const canApprove = user?.role && ["admin", "approver_admin", "initiator_admin"].includes(user.role)

  useEffect(() => {
    if (!canApprove) {
      toast({ title: "Access Denied", description: "Only admins can approve loans" })
      router.push("/loans")
      return
    }
    fetchLoans()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const fetchLoans = async () => {
    try {
      setLoading(true)
      // Request populated initiatedBy field for maker-checker validation
      const data = await apiGet<any>("/api/loans?populate=initiatedBy,client")
      const loansList = Array.isArray(data) ? data : (data?.data || [])
      // Filter for loans that are in "initiated" status (pending approval)
      const pendingLoans = loansList.filter((loan: any) => loan.status === "initiated")
      console.log("Loans pending approval:", pendingLoans)
      setLoans(pendingLoans)
    } catch (e: any) {
      toast({ title: "Error", description: e?.message || "Failed to load loans" })
    } finally {
      setLoading(false)
    }
  }

  const handleApprove = async (loanId: string) => {
    const target = loans.find((l) => l._id === loanId) as any
    
    // Extract initiator ID from various possible fields
    const initiatorId = target?.initiatedBy?._id 
      || target?.initiatedBy?.id 
      || target?.initiatedBy 
      || target?.createdBy?._id 
      || target?.createdBy
    
    console.log("Approval check - Current user:", user?._id, "Initiator:", initiatorId)
    
    // Maker-checker: Cannot approve your own loan
    if (user?._id && initiatorId && user._id === initiatorId) {
      toast({ 
        title: "Maker-Checker Violation", 
        description: "You cannot approve a loan you initiated. Another admin must approve it.",
        variant: "destructive"
      })
      return
    }

    if (!window.confirm("Approve this loan?")) return
    try {
      await apiPutJson(`/api/loans/${loanId}/approve`, {})
      toast({ title: "Success", description: "Loan approved successfully" })
      fetchLoans()
    } catch (e: any) {
      toast({ title: "Error", description: e?.message || "Failed to approve loan" })
    }
  }

  const handleReject = async (loanId: string) => {
    const target = loans.find((l) => l._id === loanId) as any
    
    // Extract initiator ID from various possible fields
    const initiatorId = target?.initiatedBy?._id 
      || target?.initiatedBy?.id 
      || target?.initiatedBy 
      || target?.createdBy?._id 
      || target?.createdBy
    
    console.log("Rejection check - Current user:", user?._id, "Initiator:", initiatorId)
    
    // Maker-checker: Cannot reject your own loan
    if (user?._id && initiatorId && user._id === initiatorId) {
      toast({ 
        title: "Maker-Checker Violation", 
        description: "You cannot reject a loan you initiated. Another admin must review it.",
        variant: "destructive"
      })
      return
    }

    if (!window.confirm("Reject this loan? This action cannot be undone.")) return
    try {
      await apiPutJson(`/api/loans/${loanId}/reject`, {})
      toast({ title: "Success", description: "Loan rejected" })
      fetchLoans()
    } catch (e: any) {
      toast({ title: "Error", description: e?.message || "Failed to reject loan" })
    }
  }

  return (
    <DashboardLayout>
      <div className="max-w-6xl mx-auto">
        <div className="mb-6">
          <Button variant="ghost" onClick={() => router.back()} className="mb-4 gap-2">
            <ArrowLeft className="w-4 h-4" />
            Back
          </Button>
          <h1 className="text-3xl font-bold text-foreground">Approve Loans</h1>
          <p className="text-muted-foreground mt-1">Review and approve pending loan applications</p>
        </div>

        {loading ? (
          <Card className="neumorphic p-6 bg-card border-0">
            <p className="text-muted-foreground">Loading loans...</p>
          </Card>
        ) : loans.length === 0 ? (
          <Card className="neumorphic p-6 bg-card border-0">
            <p className="text-muted-foreground">No loans pending approval</p>
          </Card>
        ) : (
          <div className="space-y-4">
            {loans.map((loan) => {
              const clientName = (typeof loan.client === "string" ? loan.client : (loan.client as any)?.name) || (loan as any).clientName || "—"
              const clientId = typeof loan.client === "string" ? "" : loan.client?.nationalId || ""
              const anyLoan = loan as any
              const initiatorId = anyLoan?.initiatedBy?._id || anyLoan?.initiatedBy?.id || anyLoan?.initiatedBy || anyLoan?.createdBy || anyLoan?.createdById
              const isInitiator = user?._id && initiatorId && user._id === initiatorId

              return (
                <Card key={loan._id} className="neumorphic p-6 bg-card border-0">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-4 mb-4">
                        <div>
                          <p className="text-sm text-muted-foreground">Loan ID</p>
                          <p className="font-mono font-semibold">{loan._id}</p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Client</p>
                          <p className="font-semibold">{clientName}</p>
                          {clientId && <p className="text-xs text-muted-foreground">{clientId}</p>}
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Status</p>
                          <Badge variant="outline" className="bg-yellow-100 text-yellow-700 border-yellow-200">
                            {loan.status.toUpperCase()}
                          </Badge>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div>
                          <p className="text-sm text-muted-foreground">Amount</p>
                          <p className="font-bold text-primary text-lg">KES {loan.amount.toLocaleString()}</p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Type</p>
                          <p className="font-semibold capitalize">{loan.type}</p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Duration</p>
                          <p className="font-semibold">{loan.term} months</p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Date</p>
                          <p className="font-semibold">{new Date(loan.createdAt).toLocaleDateString()}</p>
                        </div>
                      </div>
                      {loan.purpose && (
                        <div className="mt-4">
                          <p className="text-sm text-muted-foreground mb-1">Purpose</p>
                          <p className="text-sm">{loan.purpose}</p>
                        </div>
                      )}
                    </div>
                    <div className="flex flex-col gap-2 ml-6">
                      {loan.status === "initiated" && (
                        <>
                          <Button
                            onClick={() => handleApprove(loan._id)}
                            className="gap-2 bg-green-600 hover:bg-green-700 text-white"
                            disabled={isInitiator}
                          >
                            <Check className="w-4 h-4" />
                            Approve
                          </Button>
                          <Button
                            variant="outline"
                            onClick={() => handleReject(loan._id)}
                            className="gap-2 text-red-600 border-red-200 hover:bg-red-50"
                            disabled={isInitiator}
                          >
                            <X className="w-4 h-4" />
                            Reject
                          </Button>
                          {isInitiator && (
                            <p className="text-xs text-muted-foreground mt-1">You initiated this loan and cannot approve or reject it.</p>
                          )}
                        </>
                      )}
                      <Button
                        variant="ghost"
                        onClick={() => router.push(`/loans/${loan._id}`)}
                      >
                        View Details
                      </Button>
                    </div>
                  </div>
                </Card>
              )
            })}
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}
