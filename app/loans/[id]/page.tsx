"use client"

import { DashboardLayout } from "@/components/dashboard-layout"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, Check, X, UserPlus, ClipboardCheck, DollarSign } from "lucide-react"
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
  status: "initiated" | "approved" | "disbursed" | "repaid" | "defaulted"
  purpose?: string
  createdAt: string
}

type Guarantor = {
  _id: string
  clientId: { name: string; nationalId: string } | string
  relationship: string
  status: "pending" | "accepted" | "rejected"
  idCopyUrl?: string
  photoUrl?: string
}

type CreditAssessment = {
  _id: string
  character: number
  capacity: number
  capital: number
  collateral: number
  conditions: number
  totalScore: number
  officerNotes?: string
}

export default function LoanDetailPage() {
  const router = useRouter()
  const params = useParams()
  const { toast } = useToast()
  const loanId = params.id as string

  const [loan, setLoan] = useState<Loan | null>(null)
  const [guarantors, setGuarantors] = useState<Guarantor[]>([])
  const [assessment, setAssessment] = useState<CreditAssessment | null>(null)
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState(false)

  const user = getCurrentUser()

  const fetchLoanData = async () => {
    try {
      setLoading(true)
      const [loanData, guarantorsData, assessmentData] = await Promise.all([
        apiGet<Loan>(`/api/loans/${loanId}`),
        apiGet<Guarantor[]>(`/api/guarantors?loanId=${loanId}`).catch(() => []),
        apiGet<CreditAssessment>(`/api/credit-assessments/${loanId}`).catch(() => null),
      ])
      setLoan(loanData)
      setGuarantors(guarantorsData)
      setAssessment(assessmentData)
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

  if (!loan) {
    return (
      <DashboardLayout>
        <div className="max-w-6xl mx-auto">
          <p className="text-destructive">Loan not found</p>
        </div>
      </DashboardLayout>
    )
  }

  const clientName =
    typeof loan.client === "string"
      ? loan.client
      : ((loan as any)?.client?.name ?? (loan as any)?.clientName ?? "—")
  const clientId =
    typeof loan.client === "string" ? loan.client : ((loan as any)?.client?._id ?? "")
  const acceptedGuarantors = guarantors.filter((g) => g.status === "accepted")
  const canApprove = user?.role === "approver_admin"
  const loanStatus = ((loan as any)?.status ?? "initiated") as string
  const canDisburse =
    user?.role && ["super_admin", "approver_admin"].includes(user.role) &&
    loanStatus === "approved" && assessment && acceptedGuarantors.length >= 1

  const statusColors = {
    initiated: "bg-blue-100 text-blue-700 border-blue-200",
    approved: "bg-secondary/10 text-secondary border-secondary/20",
    disbursed: "bg-primary/10 text-primary border-primary/20",
    repaid: "bg-green-100 text-green-700 border-green-200",
    defaulted: "bg-destructive/10 text-destructive border-destructive/20",
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

        {/* Loan Information */}
        <Card className="neumorphic p-6 bg-card border-0">
          <h2 className="text-xl font-bold mb-4">Loan Information</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
            <div>
              <p className="text-sm text-muted-foreground">Loan ID</p>
              <p className="font-mono font-semibold">{loan._id}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Client</p>
              <p className="font-semibold">{clientName}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Amount</p>
              <p className="font-bold text-primary text-lg">KES {Number((loan as any)?.amount ?? 0).toLocaleString()}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Type</p>
              <p className="font-semibold capitalize">{(loan as any)?.type ?? "—"}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Duration</p>
              <p className="font-semibold">{(loan as any)?.term != null ? `${(loan as any).term} months` : "—"}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Date Created</p>
              <p className="font-semibold">{(loan as any)?.createdAt ? new Date((loan as any).createdAt).toLocaleDateString() : "—"}</p>
            </div>
          </div>
          {loan.purpose && (
            <div className="mt-4">
              <p className="text-sm text-muted-foreground mb-1">Purpose</p>
              <p className="text-foreground">{loan.purpose}</p>
            </div>
          )}
        </Card>

        {/* Workflow Steps */}
        <Card className="neumorphic p-6 bg-card border-0">
          <h2 className="text-xl font-bold mb-4">Loan Workflow</h2>
          <div className="space-y-4">
            {/* Step 1: Initiate */}
            <div className="flex items-start gap-4 pb-4 border-b border-border">
              <div className="w-8 h-8 rounded-full bg-green-500 flex items-center justify-center text-white font-bold">
                ✓
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-foreground">Loan Initiated</h3>
                <p className="text-sm text-muted-foreground">Loan application created</p>
              </div>
              <Badge variant="outline" className="bg-green-100 text-green-700">
                Completed
              </Badge>
            </div>

            {/* Step 2: Add Guarantors */}
            <div className="flex items-start gap-4 pb-4 border-b border-border">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${
                  acceptedGuarantors.length >= 1
                    ? "bg-green-500 text-white"
                    : "bg-blue-500 text-white"
                }`}
              >
                {acceptedGuarantors.length >= 1 ? "✓" : "2"}
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-foreground">Add Guarantors</h3>
                <p className="text-sm text-muted-foreground">
                  {acceptedGuarantors.length} accepted / {guarantors.length} total
                </p>
              </div>
              {loanStatus === "initiated" && (
                <Button
                  size="sm"
                  onClick={() => router.push(`/loans/${loanId}/add-guarantor`)}
                  className="gap-2"
                >
                  <UserPlus className="w-4 h-4" />
                  Add Guarantor
                </Button>
              )}
            </div>

            {/* Step 3: Credit Assessment */}
            <div className="flex items-start gap-4 pb-4 border-b border-border">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${
                  assessment ? "bg-green-500 text-white" : "bg-gray-300 text-gray-600"
                }`}
              >
                {assessment ? "✓" : "3"}
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-foreground">Credit Assessment</h3>
                <p className="text-sm text-muted-foreground">
                  {assessment ? `Score: ${assessment.totalScore}/25` : "Not completed"}
                </p>
              </div>
              {(loanStatus === "initiated" || assessment) && (
                <Button
                  size="sm"
                  onClick={() => router.push(`/loans/${loanId}/assess`)}
                  className="gap-2"
                  disabled={assessment !== null}
                >
                  <ClipboardCheck className="w-4 h-4" />
                  {assessment ? "View Assessment" : "Create Assessment"}
                </Button>
              )}
            </div>

            {/* Step 4: Approve */}
            <div className="flex items-start gap-4 pb-4 border-b border-border">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${
                  loanStatus === "approved" || loanStatus === "disbursed"
                    ? "bg-green-500 text-white"
                    : "bg-gray-300 text-gray-600"
                }`}
              >
                {loanStatus === "approved" || loanStatus === "disbursed" ? "✓" : "4"}
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-foreground">Approve Loan</h3>
                <p className="text-sm text-muted-foreground">
                  {loanStatus === "approved" || loanStatus === "disbursed"
                    ? "Loan approved"
                    : "Waiting for approval"}
                </p>
              </div>
              {loanStatus === "initiated" && canApprove && assessment && acceptedGuarantors.length >= 1 ? (
                <Button
                  size="sm"
                  onClick={handleApproveLoan}
                  className="gap-2 bg-secondary text-white"
                  disabled={actionLoading}
                >
                  <Check className="w-4 h-4" />
                  Approve
                </Button>
              ) : loanStatus === "initiated" && (!assessment || acceptedGuarantors.length < 1) ? (
                <Badge variant="outline" className="bg-yellow-100 text-yellow-700">Prerequisites Required</Badge>
              ) : null}
            </div>

            {/* Step 5: Disburse */}
            <div className="flex items-start gap-4">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${
                  loanStatus === "disbursed" ? "bg-green-500 text-white" : "bg-gray-300 text-gray-600"
                }`}
              >
                {loanStatus === "disbursed" ? "✓" : "5"}
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-foreground">Disburse Loan</h3>
                <p className="text-sm text-muted-foreground">
                    {loanStatus === "disbursed" ? "Funds disbursed" : "Waiting for disbursement"}
                </p>
                  {loanStatus === "approved" && !canDisburse && user?.role && (
                  <p className="text-xs text-destructive mt-1">
                    Only super_admin or approver_admin can disburse
                  </p>
                )}
              </div>
              {canDisburse && (
                <Button
                  size="sm"
                  onClick={handleDisburseLoan}
                  className="gap-2 bg-primary text-white"
                  disabled={actionLoading}
                >
                  <DollarSign className="w-4 h-4" />
                  Disburse
                </Button>
              )}
            </div>
          </div>
        </Card>

        {/* Guarantors List */}
        {guarantors.length > 0 && (
          <Card className="neumorphic p-6 bg-card border-0">
            <h2 className="text-xl font-bold mb-4">Guarantors ({guarantors.length})</h2>
            <div className="space-y-3">
              {guarantors.map((g) => {
                const gName = typeof g.clientId === "string" ? g.clientId : ((g as any)?.clientId?.name ?? "—")
                const statusColor =
                  g.status === "accepted"
                    ? "bg-green-100 text-green-700"
                    : g.status === "rejected"
                    ? "bg-red-100 text-red-700"
                    : "bg-yellow-100 text-yellow-700"
                return (
                  <div key={g._id} className="flex items-center justify-between p-4 bg-muted/30 rounded-lg">
                    <div>
                      <p className="font-semibold">{gName}</p>
                      <p className="text-sm text-muted-foreground">Relationship: {g.relationship}</p>
                    </div>
                    <Badge variant="outline" className={statusColor}>
                      {g.status}
                    </Badge>
                  </div>
                )
              })}
            </div>
          </Card>
        )}

        {/* Credit Assessment Details */}
        {assessment && (
          <Card className="neumorphic p-6 bg-card border-0">
            <h2 className="text-xl font-bold mb-4">Credit Assessment (5 C's)</h2>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-4">
              <div className="text-center">
                <p className="text-sm text-muted-foreground">Character</p>
                <p className="text-2xl font-bold text-primary">{assessment.character}/5</p>
              </div>
              <div className="text-center">
                <p className="text-sm text-muted-foreground">Capacity</p>
                <p className="text-2xl font-bold text-primary">{assessment.capacity}/5</p>
              </div>
              <div className="text-center">
                <p className="text-sm text-muted-foreground">Capital</p>
                <p className="text-2xl font-bold text-primary">{assessment.capital}/5</p>
              </div>
              <div className="text-center">
                <p className="text-sm text-muted-foreground">Collateral</p>
                <p className="text-2xl font-bold text-primary">{assessment.collateral}/5</p>
              </div>
              <div className="text-center">
                <p className="text-sm text-muted-foreground">Conditions</p>
                <p className="text-2xl font-bold text-primary">{assessment.conditions}/5</p>
              </div>
            </div>
            <div className="pt-4 border-t border-border">
              <p className="text-sm text-muted-foreground mb-1">Total Score</p>
              <p className="text-3xl font-bold text-secondary">
                {assessment.totalScore}/25
                {assessment.totalScore >= 18 && (
                  <span className="text-sm ml-2 text-green-600">(Meets minimum requirement)</span>
                )}
              </p>
            </div>
            {assessment.officerNotes && (
              <div className="mt-4 pt-4 border-t border-border">
                <p className="text-sm text-muted-foreground mb-1">Officer Notes</p>
                <p className="text-foreground">{assessment.officerNotes}</p>
              </div>
            )}
          </Card>
        )}
      </div>
    </DashboardLayout>
  )
}
