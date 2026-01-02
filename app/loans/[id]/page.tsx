"use client"

import { DashboardLayout } from "@/components/dashboard-layout"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Check,
  DollarSign,
  ArrowLeft,
  CheckCircle2,
  Clock,
  AlertCircle,
  UserPlus,
  ClipboardCheck,
  Shield,
  Scale,
  X
} from "lucide-react"
import Link from "next/link"
import { useRouter, useParams } from "next/navigation"
import { useEffect, useState } from "react"
import { apiGet, apiPostJson, apiPutJson, getCurrentUser } from "@/lib/api"
import { useToast } from "@/hooks/use-toast"

type Loan = {
  _id: string
  client: { _id: string; name: string; nationalId: string } | string
  type: string
  amount: number
  term: number
  status: "initiated" | "approved" | "disbursed" | "repaid" | "defaulted" | string
  purpose?: string
  applicationFeePaid?: boolean
  createdAt: string
}

type Guarantor = {
  _id: string
  name?: string
  clientNationalId?: string
  phone?: string
  isMember?: boolean
  clientId: { _id: string; name: string; nationalId: string } | string | null
  relationship: string
  status: "pending" | "accepted" | "rejected"
}

type RepaymentScheduleItem = {
  _id: string
  dueDate: string
  amount: number
  principal: number
  interest: number
  balance: number
  status: "pending" | "paid" | "partial" | "overdue"
}

type RepaymentRecord = {
  _id: string
  amount: number
  date: string
  method: string
  reference?: string
}

type LoanTotals = {
  totalDue: number
  totalPaid: number
  outstanding: number
}

type LoanDetailResponse = {
  loan: Loan
  guarantors: Guarantor[]
  schedules: RepaymentScheduleItem[]
  repayments: RepaymentRecord[]
  totals: LoanTotals
  progress: number
  nextDue: RepaymentScheduleItem | null
  actions: { key: string; label: string }[]
}

export default function LoanDetailPage() {
  const router = useRouter()
  const params = useParams()
  const { toast } = useToast()
  const loanId = params.id as string

  const [data, setData] = useState<LoanDetailResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState(false)

  const user = getCurrentUser()

  const fetchLoanData = async () => {
    try {
      setLoading(true)
      const raw = await apiGet<any>(`/api/loans/${loanId}`)
      const res = (raw?.data || raw) as LoanDetailResponse

      // 1. Aggressive Client Recovery
      if (res && res.loan) {
        const c = res.loan.client
        // If client is a string (just the ID) or it's an object but name is missing
        const isIdOnly = typeof c === "string"
        const isMissingName = typeof c === "object" && !c?.name

        const clientId = isIdOnly ? (c as string) : (res.loan as any).clientId || (typeof c === "object" ? c?._id : null)

        if (clientId && (isIdOnly || isMissingName)) {
          console.log(`Loan Details: Client name missing for ID ${clientId}, attempting recovery...`)
          try {
            // Path A: Direct fetch
            const clientData = await apiGet<any>(`/api/clients/${clientId}`)
            const clientInfo = clientData?.data || clientData
            if (clientInfo && clientInfo.name) {
              res.loan.client = clientInfo
              console.log(`Loan Details: Recovered name ${clientInfo.name}`)
            } else {
              // Path B: Search global list as fallback
              const allClients = await apiGet<any>("/api/clients?limit=1000")
              const clientsArr = Array.isArray(allClients) ? allClients : (allClients?.data || [])
              const found = clientsArr.find((cl: any) => cl._id === clientId)
              if (found) {
                res.loan.client = found
                console.log(`Loan Details: Recovered name ${found.name} from global list`)
              }
            }
          } catch (e) {
            console.error("Aggressive client recovery failed", e)
          }
        }
      }

      // 2. Aggressive Guarantor Recovery (ensure we get all 3)
      if (!res.guarantors || res.guarantors.length < 3) {
        try {
          console.log(`Loan Details: Guarantors count ${res.guarantors?.length || 0}, fetching exhaustive list...`)
          const gData = await apiGet<any>(`/api/guarantors?loanId=${loanId}`)
          const exhaustiveGuarantors = Array.isArray(gData) ? gData : (gData?.data || [])

          if (exhaustiveGuarantors.length > (res.guarantors?.length || 0)) {
            res.guarantors = exhaustiveGuarantors
            console.log(`Loan Details: Successfully updated to ${exhaustiveGuarantors.length} guarantors.`)
          }
        } catch (e) {
          console.error("Guarantor recovery failed", e)
        }
      }

      // 3. Fetch Credit Assessment if missing
      // Backend returns creditAssessment field, not assessment
      if (!(res as any).creditAssessment) {
        try {
          const assessmentRes = await apiGet<any>(`/api/credit-assessments/${loanId}`)
          // Backend returns single object, not array
          if (assessmentRes && assessmentRes._id) {
            (res as any).creditAssessment = assessmentRes
            console.log("Loan Details: Found existing credit assessment manually.")
          }
        } catch (e) {
          console.error("Failed to fetch assessment manually", e)
        }
      }

      setData(res)
    } catch (e: any) {
      toast({ title: "Error", description: e?.message || "Failed to load loan data" })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchLoanData()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loanId])

  const handleApproveLoan = async () => {
    // Permission check: Only initiator_admin and approver_admin can approve
    if (!user?.role || !["initiator_admin", "approver_admin"].includes(user.role)) {
      toast({ 
        title: "Access Denied", 
        description: "Only Admins (Initiator/Approver) can approve loans.",
        variant: "destructive" 
      })
      return
    }

    if (!window.confirm("Approve this loan?")) return
    try {
      setActionLoading(true)
      await apiPutJson(`/api/loans/${loanId}/approve`, {})
      toast({ title: "Loan approved" })
      fetchLoanData()
    } catch (e: any) {
      toast({ title: "Error", description: e?.message || "Failed to approve loan" })
    } finally {
      setActionLoading(false)
    }
  }

  const handleDisburseLoan = async () => {
    // Permission check: Only initiator_admin and approver_admin can disburse
    if (!user?.role || !["initiator_admin", "approver_admin"].includes(user.role)) {
      toast({ 
        title: "Access Denied", 
        description: "Only Admins (Initiator/Approver) can disburse loans.",
        variant: "destructive" 
      })
      return
    }

    if (!window.confirm("Disburse this loan? This action is final.")) return
    try {
      setActionLoading(true)
      await apiPostJson(`/api/loans/${loanId}/disburse`, {})
      toast({ title: "Loan disbursed" })
      fetchLoanData()
    } catch (e: any) {
      toast({ title: "Error", description: e?.message || "Failed to disburse loan" })
    } finally {
      setActionLoading(false)
    }
  }

  if (loading) {
    return (
      <DashboardLayout>
        <div className="max-w-6xl mx-auto">
          <p className="text-muted-foreground">Loading loan details…</p>
        </div>
      </DashboardLayout>
    )
  }

  if (!data || !data.loan) {
    return (
      <DashboardLayout>
        <div className="max-w-6xl mx-auto">
          <p className="text-destructive">Loan not found</p>
        </div>
      </DashboardLayout>
    )
  }

  const { loan, guarantors, schedules, repayments, totals, progress, nextDue } = data
  let { actions } = data

  const canMarkFee = user?.role && ["super_admin", "approver_admin", "initiator_admin"].includes(user.role)
  const canApprove = user?.role && ["initiator_admin", "approver_admin"].includes(user.role)
  const canDisburse = user?.role && ["initiator_admin", "approver_admin"].includes(user.role)

  // Filter out operational actions for super_admin (they manage system, not operations)
  if (user?.role === "super_admin") {
    actions = actions.filter(a => !["approve", "disburse", "initiate"].includes(a.key))
  }

  // Manually inject mark-application-fee-paid if missing but authorized and state is initiated AND NOT PAID
  if (loan.status === "initiated" && canMarkFee && !loan.applicationFeePaid) {
    const hasFeeAction = actions.some(a => a.key === "mark-application-fee-paid")
    if (!hasFeeAction) {
      actions = [...actions, { key: "mark-application-fee-paid", label: "Mark Registration Fee Paid" }]
    }
  }

  // Manually inject credit-assessment button if status is initiated
  if (loan.status === "initiated" && canMarkFee) {
    const hasAssessAction = actions.some(a => a.key === "credit-assessment")
    if (!hasAssessAction) {
      actions = [{ key: "credit-assessment", label: "Perform Credit Assessment" }, ...actions]
    }
  }

  // Filter approve/disburse actions based on role
  actions = actions.filter(a => {
    if (a.key === "approve" && !canApprove) return false
    if (a.key === "disburse" && !canDisburse) return false
    return true
  })

  const clientName = typeof loan.client === "string"
    ? loan.client
    : (loan.client?.name || (loan as any).clientName || "—")

  const loanAmount = (loan as any).amountKES || loan.amount || (loan as any).principal_cents / 100 || (loan as any).loanAmount || 0
  const loanType = loan.type || (loan as any).loanType || "—"
  const loanStatus = loan.status
  const statusColors = {
    initiated: "bg-blue-100 text-blue-700 border-blue-200",
    approved: "bg-secondary/10 text-secondary border-secondary/20",
    disbursed: "bg-primary/10 text-primary border-primary/20",
    repaid: "bg-green-100 text-green-700 border-green-200",
    defaulted: "bg-destructive/10 text-destructive border-destructive/20",
  }

  const handleAction = async (actionKey: string) => {
    if (actionKey === "credit-assessment") {
      router.push(`/loans/${loanId}/assess`)
      return
    }

    // Skip confirmation for non-destructive, prerequisite actions
    const skipConfirm = ["mark-application-fee-paid"].includes(actionKey)

    if (!skipConfirm && !window.confirm(`Perform "${actionKey}" on this loan?`)) return

    try {
      setActionLoading(true)
      // Some actions might be POST, some PUT. We'll use PUT as default as per user request for individual mark-fee
      if (actionKey === "mark-application-fee-paid") {
        await apiPutJson(`/api/loans/${loanId}/mark-application-fee-paid`, {})
      } else {
        await apiPutJson(`/api/loans/${loanId}/${actionKey}`, {})
      }
      toast({ title: "Action successful" })
      fetchLoanData()
    } catch (e: any) {
      // log specific backend error if available
      const errorMsg = e?.message || e?.statusText || "Action failed"
      toast({
        title: "Action Failed",
        description: errorMsg,
        variant: "destructive"
      })
      console.error(`Action ${actionKey} failed:`, e)
    } finally {
      setActionLoading(false)
    }
  }

  return (
    <DashboardLayout>
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="mb-6">
          <Button variant="ghost" onClick={() => router.push("/loans")} className="mb-4 gap-2">
            <ArrowLeft className="w-4 h-4" />
            Back to Loans
          </Button>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-foreground">Loan Details</h1>
              <p className="text-muted-foreground mt-1">Manage loan workflow</p>
              {user?.role && (
                <p className="text-xs text-muted-foreground mt-1">
                  Your role: <span className="font-semibold">{user.role}</span>
                </p>
              )}
            </div>
            <Badge variant="outline" className={statusColors[loanStatus as keyof typeof statusColors] || ""}>
              {String(loanStatus).toUpperCase()}
            </Badge>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            {/* Loan Information */}
            <Card className="neumorphic p-6 bg-card border-0">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold">Loan Information</h2>
                <div className="text-right">
                  <p className="text-xs text-muted-foreground">Progress</p>
                  <p className="text-lg font-bold text-primary">{progress}%</p>
                </div>
              </div>

              <div className="w-full bg-muted rounded-full h-2 mb-6">
                <div
                  className="bg-primary h-2 rounded-full transition-all duration-500"
                  style={{ width: `${progress}%` }}
                />
              </div>

              <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
                <div>
                  <p className="text-sm text-muted-foreground">Loan ID</p>
                  <p className="font-mono font-semibold text-xs truncate" title={loan._id}>{loan._id}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Client</p>
                  <p className="font-semibold">{clientName}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Amount</p>
                  <p className="font-bold text-primary text-lg">KES {Number(loanAmount).toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Type</p>
                  <p className="font-semibold capitalize">{loanType}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Duration</p>
                  <p className="font-semibold">{loan.term != null ? `${loan.term} months` : "—"}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Date Created</p>
                  <p className="font-semibold">{loan.createdAt ? new Date(loan.createdAt).toLocaleDateString() : "—"}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Application Fee</p>
                  <Badge variant="outline" className={loan.applicationFeePaid ? "bg-green-100 text-green-700 border-green-200" : "bg-orange-100 text-orange-700 border-orange-200"}>
                    {loan.applicationFeePaid ? "Paid" : "Unpaid"}
                  </Badge>
                </div>
              </div>
              {loan.purpose && (
                <div className="mt-4 pt-4 border-t border-border">
                  <p className="text-sm text-muted-foreground mb-1">Purpose</p>
                  <p className="text-foreground">{loan.purpose}</p>
                </div>
              )}
            </Card>

            {/* Repayment Schedule */}
            {schedules && schedules.length > 0 && (
              <Card className="neumorphic p-6 bg-card border-0">
                <h2 className="text-xl font-bold mb-4">Repayment Schedule</h2>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border text-muted-foreground">
                        <th className="text-left py-2">Due Date</th>
                        <th className="text-right py-2">Amount</th>
                        <th className="text-right py-2">Principal</th>
                        <th className="text-right py-2">Interest</th>
                        <th className="text-center py-2">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {schedules.map((s) => (
                        <tr key={s._id} className="border-b border-border last:border-0 hover:bg-muted/30">
                          <td className="py-3">{new Date(s.dueDate).toLocaleDateString()}</td>
                          <td className="py-3 text-right font-semibold">KES {Number(s.amount).toLocaleString()}</td>
                          <td className="py-3 text-right">KES {Number(s.principal).toLocaleString()}</td>
                          <td className="py-3 text-right">KES {Number(s.interest).toLocaleString()}</td>
                          <td className="py-3 text-center">
                            <Badge variant="outline" className={
                              s.status === "paid" ? "bg-green-100 text-green-700 border-green-200" :
                                s.status === "partial" ? "bg-yellow-100 text-yellow-700 border-yellow-200" :
                                  s.status === "overdue" ? "bg-red-100 text-red-700 border-red-200" :
                                    "bg-blue-100 text-blue-700 border-blue-200"
                            }>
                              {s.status}
                            </Badge>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Card>
            )}

            {/* Repayments History */}
            {repayments && repayments.length > 0 && (
              <Card className="neumorphic p-6 bg-card border-0">
                <h2 className="text-xl font-bold mb-4">Repayment History</h2>
                <div className="space-y-3">
                  {repayments.map((r) => (
                    <div key={r._id} className="flex items-center justify-between p-3 bg-muted/20 rounded-lg border border-border/50">
                      <div>
                        <p className="font-bold text-secondary">KES {Number(r.amount).toLocaleString()}</p>
                        <p className="text-xs text-muted-foreground">{new Date(r.date).toLocaleDateString()} • {r.method}</p>
                      </div>
                      {r.reference && <Badge variant="outline" className="text-[10px]">{r.reference}</Badge>}
                    </div>
                  ))}
                </div>
              </Card>
            )}
          </div>

          <div className="space-y-6">
            {/* Prerequisites Checklist */}
            <Card className="neumorphic p-6 bg-card border-0 space-y-4">
              <h2 className="text-lg font-bold flex items-center gap-2">
                <Shield className="w-4 h-4 text-primary" />
                Prerequisites
              </h2>
              <div className="space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Application Fee</span>
                  <div className="flex items-center gap-2">
                    {loan.applicationFeePaid ? (
                      <Badge className="bg-green-100 text-green-700 border-green-200">Paid</Badge>
                    ) : (
                      <Badge variant="outline" className="bg-orange-100 text-orange-700 border-orange-200">Unpaid</Badge>
                    )}
                  </div>
                </div>

                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Guarantors (Min 3)</span>
                  <div className="flex items-center gap-2">
                    <span className={`font-bold ${guarantors.length >= 3 ? "text-green-600" : "text-orange-600"}`}>
                      {guarantors.length} / 3
                    </span>
                    {guarantors.length >= 3 ? (
                      <Check className="w-4 h-4 text-green-600" />
                    ) : (
                      <AlertCircle className="w-4 h-4 text-orange-600" />
                    )}
                  </div>
                </div>

                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Credit Assessment</span>
                  <div className="flex items-center gap-2">
                    {(data as any).creditAssessment ? (
                      <Badge className="bg-green-100 text-green-700 border-green-200">Completed</Badge>
                    ) : (
                      <Badge variant="outline" className="text-muted-foreground">Missing</Badge>
                    )}
                  </div>
                </div>
              </div>

              {loan.status === "initiated" && (!loan.applicationFeePaid || guarantors.length < 3) && (
                <p className="text-[10px] text-orange-600 bg-orange-50 p-2 rounded border border-orange-100 italic">
                  Complete all prerequisites to enable approval.
                </p>
              )}
            </Card>

            {/* Totals Summary */}
            <Card className="neumorphic p-6 bg-card border-0 space-y-4">
              <h2 className="text-lg font-bold">Totals Summary</h2>
              <div className="space-y-3">
                <div className="flex justify-between items-center p-3 bg-muted/20 rounded-lg">
                  <span className="text-sm text-muted-foreground">Total Due</span>
                  <span className="font-bold">KES {Number(totals?.totalDue || 0).toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg">
                  <span className="text-sm text-green-700">Total Paid</span>
                  <span className="font-bold text-green-700">KES {Number(totals?.totalPaid || 0).toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-primary/10 rounded-lg">
                  <span className="text-sm text-primary font-semibold">Outstanding</span>
                  <span className="font-bold text-primary">KES {Number(totals?.outstanding || 0).toLocaleString()}</span>
                </div>
              </div>

              {nextDue && (
                <div className="pt-4 border-t border-border">
                  <p className="text-xs text-muted-foreground mb-1 uppercase tracking-wider font-bold">Next Repayment</p>
                  <p className="text-lg font-bold text-foreground">KES {Number(nextDue.amount).toLocaleString()}</p>
                  <p className="text-xs text-muted-foreground">{new Date(nextDue.dueDate).toLocaleDateString()}</p>
                </div>
              )}
            </Card>

            {/* Actions Card */}
            {actions && actions.length > 0 && (
              <Card className="neumorphic p-6 bg-card border-0 space-y-4">
                <h2 className="text-lg font-bold">Actions</h2>
                <div className="grid grid-cols-1 gap-2">
                  {actions.map((act) => (
                    <Button
                      key={act.key}
                      onClick={() => handleAction(act.key)}
                      disabled={actionLoading}
                      className={`w-full gap-2 border-0 neumorphic neumorphic-hover ${act.key === 'approve' ? 'bg-secondary text-white' :
                        act.key === 'disburse' ? 'bg-primary text-white' :
                          act.key === 'mark-application-fee-paid' ? 'bg-orange-500 text-white' :
                            'bg-muted text-foreground'
                        }`}
                    >
                      {act.key === 'approve' && <Check className="w-4 h-4" />}
                      {act.key === 'disburse' && <DollarSign className="w-4 h-4" />}
                      {act.key === 'mark-application-fee-paid' && <ClipboardCheck className="w-4 h-4" />}
                      {act.key === 'credit-assessment' && <Scale className="w-4 h-4" />}
                      {act.label}
                    </Button>
                  ))}
                </div>
              </Card>
            )}

            {/* Guarantors List */}
            {guarantors.length > 0 && (
              <Card className="neumorphic p-6 bg-card border-0">
                <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
                  Guarantors
                  {guarantors.length < 3 && (
                    <Badge variant="outline" className="text-[10px] bg-red-50 text-red-600 border-red-200">Needs 3</Badge>
                  )}
                </h2>
                <div className="space-y-3">
                  {guarantors.length === 0 && (
                    <p className="text-xs text-muted-foreground italic">No guarantors found.</p>
                  )}
                  {guarantors.map((g, idx) => {
                    const gName = g.name ||
                      (typeof g.clientId === "object" ? (g.clientId as any)?.name : null) ||
                      (g as any).guarantorName || "—"
                    const statusColor =
                      g.status === "accepted" ? "bg-green-100 text-green-700" :
                        g.status === "rejected" ? "bg-red-100 text-red-700" :
                          "bg-yellow-100 text-yellow-700"
                    return (
                      <div key={idx} className="p-3 bg-muted/20 rounded-lg border border-border/50 space-y-1">
                        <div className="flex items-center justify-between">
                          <p className="font-semibold text-sm">{gName}</p>
                          <Badge variant="outline" className={`text-[10px] ${statusColor}`}>{g.status}</Badge>
                        </div>
                        <p className="text-xs text-muted-foreground line-clamp-1">{g.phone || g.relationship || "No details"}</p>
                      </div>
                    )
                  })}
                </div>
              </Card>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}
