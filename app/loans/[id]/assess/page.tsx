"use client"

import { DashboardLayout } from "@/components/dashboard-layout"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"
import { useRouter, useParams } from "next/navigation"
import { useState, useEffect } from "react"
import { apiPostJson, apiGet } from "@/lib/api"
import { useToast } from "@/hooks/use-toast"
import { Badge } from "@/components/ui/badge"
import {
  User,
  Wallet,
  History,
  Users,
  Info,
  AlertCircle,
  AlertTriangle,
  CheckCircle2,
  TrendingUp,
  MessageSquare,
  Shield
} from "lucide-react"

type Loan = {
  _id: string
  status: string
  client: any
  clientId: string
  loanType: string
  initiatedBy?: any
  cycle: number
}

export default function CreditAssessmentPage() {
  const router = useRouter()
  const params = useParams()
  const { toast } = useToast()
  const loanId = params.id as string

  const [loan, setLoan] = useState<Loan | null>(null)
  const [form, setForm] = useState({
    character: 3,
    capacity: 3,
    capital: 3,
    collateral: 3,
    conditions: 3,
    officerNotes: "",
  })
  const [submitting, setSubmitting] = useState(false)
  const [loading, setLoading] = useState(true)

  const [clientStats, setClientStats] = useState({
    totalSavings: 0,
    previousLoans: [] as any[],
    group: null as any,
    officer: null as any,
    guarantors: [] as any[]
  })
  const [staff, setStaff] = useState<any[]>([])
  const [selectedOfficerId, setSelectedOfficerId] = useState<string>("")
  const [previousAssessments, setPreviousAssessments] = useState<any[]>([])

  const totalScore = form.character + form.capacity + form.capital + form.collateral + form.conditions

  useEffect(() => {
    let mounted = true
      ; (async () => {
        try {
          setLoading(true)
          const rawLoan = await apiGet<any>(`/api/loans/${loanId}`)
          const loanData = rawLoan.loan || rawLoan.data?.loan || rawLoan

          if (mounted) {
            // Aggressive Name Recovery for Assessment Page
            if (loanData) {
              const c = loanData.client
              const isIdOnly = typeof c === "string"
              const isMissingName = typeof c === "object" && !c?.name
              const clientId = isIdOnly ? (c as string) : (loanData.clientId || (typeof c === "object" ? c?._id : null))

              if (clientId && (isIdOnly || isMissingName)) {
                console.log(`Assessment: Applicant name missing for ID ${clientId}, recovering...`)
                try {
                  const clientRes = await apiGet<any>(`/api/clients/${clientId}`)
                  const clientInfo = clientRes?.data || clientRes
                  if (clientInfo && clientInfo.name) {
                    loanData.client = clientInfo
                    console.log(`Assessment: Recovered name ${clientInfo.name}`)
                  }
                } catch (e) {
                  console.error("Assessment name recovery failed", e)
                }
              }
            }

            if (loanData.status !== "initiated") {
              toast({ title: "Note", description: "Credit assessment is usually done on initiated loans." })
            }
            setLoan(loanData)

            // Fetch Staff/Officers for selection
            try {
              const staffRaw = await apiGet<any>("/api/loan-officers")
              const staffList = Array.isArray(staffRaw) ? staffRaw : (staffRaw?.data || staffRaw?.officers || [])
              if (mounted) setStaff(staffList)
            } catch (e) {
              console.error("Failed to fetch staff list from /api/loan-officers, trying analytics fallback", e)
              try {
                const altRaw = await apiGet<any>("/api/analytics/officers")
                const altList = altRaw?.officers || altRaw?.data?.officers || []
                if (mounted) setStaff(altList)
              } catch (e2) {
                console.error("Fallback staff fetch also failed", e2)
              }
            }

            // Fetch Additional Contextual Data
            const clientId = loanData.clientId || (typeof loanData.client === 'string' ? loanData.client : loanData.client?._id)

            if (clientId) {
              // Path A: Client Financials & History
              const [clientRes, assessmentsRes, gRes] = await Promise.all([
                apiGet<any>(`/api/clients/${clientId}`).catch(() => null),
                apiGet<any>(`/api/credit-assessments?loanId=${loanId}`).catch(() => []),
                apiGet<any>(`/api/guarantors?loanId=${loanId}`).catch(() => [])
              ])

              if (mounted) {
                const client = clientRes?.data || clientRes
                setPreviousAssessments(Array.isArray(assessmentsRes) ? assessmentsRes : assessmentsRes?.data || [])

                const initOfficer = loanData.initiatedBy || "Internal System"
                setClientStats(prev => ({
                  ...prev,
                  totalSavings: client?.savingsBalance || 0,
                  officer: initOfficer,
                  guarantors: Array.isArray(gRes) ? gRes : (gRes?.data || [])
                }))

                // Pre-set selected officer if initiator is an object with ID
                if (typeof initOfficer === 'object' && initOfficer._id) {
                  setSelectedOfficerId(initOfficer._id)
                }

                // Fetch Previous Loans if possible
                try {
                  const allLoans = await apiGet<any>(`/api/loans?clientId=${clientId}`)
                  const loansArr = Array.isArray(allLoans) ? allLoans : allLoans?.data || []
                  if (mounted) setClientStats(ps => ({ ...ps, previousLoans: loansArr.filter((l: any) => l._id !== loanId) }))
                } catch (e) { }

                // Fetch Group if member
                const gid = client?.groupId || (typeof client?.group === 'string' ? client.group : client?.group?._id)
                if (gid) {
                  try {
                    const gData = await apiGet<any>(`/api/groups/${gid}`)
                    if (mounted) setClientStats(ps => ({ ...ps, group: gData?.data || gData }))
                  } catch (e) { }
                }
              }
            }
            setLoading(false)
          }
        } catch (e: any) {
          if (mounted) {
            toast({ title: "Error", description: e?.message || "Failed to load assessment context" })
            router.push(`/loans/${loanId}`)
          }
        }
      })()
    return () => {
      mounted = false
    }
  }, [loanId, router, toast])

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Removed duplicate assessment check - allow multiple assessments

    if (totalScore < 18) {
      if (!window.confirm("Total score is below the minimum requirement of 18. Continue anyway?")) {
        return
      }
    }

    try {
      setSubmitting(true)
      await apiPostJson("/api/credit-assessments", {
        loanId,
        officerId: selectedOfficerId,
        ...form,
      })
      toast({ title: "Credit assessment completed" })
      router.push(`/loans/${loanId}`)
    } catch (e: any) {
      const errorMsg = e?.message || ""
      if (errorMsg.includes("409") || errorMsg.toLowerCase().includes("conflict") || errorMsg.toLowerCase().includes("already exists")) {
        toast({ title: "Conflict", description: "This loan has already been assessed. Please refresh the page.", variant: "destructive" })
      } else if (errorMsg.includes("400") || errorMsg.toLowerCase().includes("bad request")) {
        toast({ title: "Invalid Request", description: errorMsg || "Please check your inputs and try again.", variant: "destructive" })
      } else {
        toast({ title: "Error", description: errorMsg || "Failed to save assessment", variant: "destructive" })
      }
    } finally {
      setSubmitting(false)
    }
  }

  const renderScoreInput = (field: keyof typeof form, label: string, description: string) => {
    if (field === "officerNotes") return null
    return (
      <Card key={field} className="neumorphic-inset p-6 bg-background border-0">
        <div className="mb-3">
          <h3 className="font-bold text-lg text-foreground">{label}</h3>
          <p className="text-sm text-muted-foreground">{description}</p>
        </div>
        <div className="flex items-center gap-4">
          <input
            type="range"
            min="1"
            max="5"
            value={form[field] as number}
            onChange={(e) => setForm({ ...form, [field]: Number(e.target.value) })}
            className="flex-1"
          />
          <div className="w-16 h-16 rounded-full bg-primary flex items-center justify-center neumorphic">
            <span className="text-2xl font-bold text-white">{form[field] as number}</span>
          </div>
        </div>
      </Card>
    )
  }

  if (loading) {
    return (
      <DashboardLayout>
        <div className="max-w-4xl mx-auto">
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <Button variant="ghost" onClick={() => router.back()} className="mb-4 gap-2">
            <ArrowLeft className="w-4 h-4" />
            Back
          </Button>
          <h1 className="text-3xl font-bold text-foreground">Credit Assessment (5 C's)</h1>
          <p className="text-muted-foreground mt-1">Evaluate creditworthiness using the 5 C's framework</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* Main Score Board */}
          <Card className="lg:col-span-1 neumorphic p-6 bg-card border-0 flex flex-col items-center justify-center">
            <p className="text-xs text-muted-foreground mb-1 uppercase tracking-wider font-semibold">Total Credit Score</p>
            <p className="text-5xl font-black text-primary mb-2">{totalScore}/25</p>
            {totalScore >= 18 ? (
              <Badge className="bg-green-100 text-green-700 hover:bg-green-100 border-0 px-3 py-1">
                <CheckCircle2 className="w-3 h-3 mr-1" /> Meets Requirement
              </Badge>
            ) : (
              <Badge variant="outline" className="bg-orange-100 text-orange-700 border-0 px-3 py-1">
                <AlertTriangle className="w-3 h-3 mr-1" /> Below Minimum (18)
              </Badge>
            )}
          </Card>

          {/* Contextual Intelligence Sidebar */}
          <Card className="lg:col-span-2 neumorphic p-6 bg-card border-0 grid grid-cols-2 gap-6 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-3 opacity-10">
              <TrendingUp className="w-16 h-16" />
            </div>

            <div className="space-y-4">
              <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-2">
                <Info className="w-3 h-3" /> Background Context
              </h3>

              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center text-blue-600">
                  <User className="w-4 h-4" />
                </div>
                <div className="flex-1">
                  <p className="text-[10px] text-muted-foreground">Loan Officer</p>
                  {staff.length > 0 ? (
                    <select
                      value={selectedOfficerId}
                      onChange={(e) => setSelectedOfficerId(e.target.value)}
                      className="text-sm font-bold bg-transparent border-0 focus:ring-0 p-0 w-full"
                    >
                      <option value="">Select Officer...</option>
                      {staff.map((s: any) => (
                        <option key={s.id || s._id} value={s.id || s._id}>{s.name}</option>
                      ))}
                    </select>
                  ) : (
                    <p className="text-sm font-bold truncate">
                      {typeof clientStats.officer === 'object' ? clientStats.officer.name : clientStats.officer || "—"}
                    </p>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-green-100 flex items-center justify-center text-green-600">
                  <Wallet className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-[10px] text-muted-foreground">Current Savings</p>
                  <p className="text-sm font-bold">KES {Number(clientStats.totalSavings || 0).toLocaleString()}</p>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-orange-100 flex items-center justify-center text-orange-600">
                  <History className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-[10px] text-muted-foreground">Previous Loans</p>
                  <p className="text-sm font-bold">{clientStats.previousLoans.length} Loans (Cycle {loan?.cycle || 1})</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-pink-100 flex items-center justify-center text-pink-600">
                  <Shield className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-[10px] text-muted-foreground">Guarantors</p>
                  <p className={`text-sm font-bold ${clientStats.guarantors.length < 3 ? 'text-red-500' : ''}`}>
                    {clientStats.guarantors.length} Verified (Min 3)
                  </p>
                </div>
              </div>
            </div>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">

            <form className="space-y-6" onSubmit={onSubmit}>
              <div className="space-y-6">
                <h2 className="text-xl font-bold text-foreground">5 C's Qualitative Scoring</h2>
                {renderScoreInput("character", "Character", "Borrower's reputation and integrity track record")}
                {renderScoreInput("capacity", "Capacity", "Evaluation of repayment ability from verified income")}
                {renderScoreInput("capital", "Capital", "Net worth and financial cushion of the member")}
                {renderScoreInput("collateral", "Collateral", "Assets or guarantors pledged to secure the loan")}
                {renderScoreInput("conditions", "Conditions", "Market status and purpose-specific economic environment")}
              </div>

              <div className="p-1">
                <label className="block text-sm font-bold text-foreground mb-3 flex items-center gap-2">
                  <MessageSquare className="w-4 h-4" /> Final Recommendation Notes
                </label>
                <textarea
                  rows={4}
                  value={form.officerNotes}
                  onChange={(e) => setForm({ ...form, officerNotes: e.target.value })}
                  className="w-full px-5 py-4 bg-background rounded-2xl border-0 neumorphic-inset focus:outline-none focus:ring-2 focus:ring-primary transition-all text-sm"
                  placeholder="Detail your recommendation logic here for the approving committee..."
                />
              </div>

              <div className="flex gap-4 justify-end pt-4 border-t border-border">
                <Button type="button" variant="ghost" onClick={() => router.back()} className="px-8 h-12">
                  Discard Changes
                </Button>
                <Button
                  type="submit"
                  disabled={submitting}
                  className={`px-10 h-12 text-white neumorphic neumorphic-hover border-0 font-bold bg-primary`}
                >
                  {submitting ? "Processing..." : "Submit Formal Assessment"}
                </Button>
              </div>
            </form>
          </div>

          {/* Previous History Vertical Log */}
          <div className="lg:col-span-1 space-y-4">
            <h2 className="text-lg font-bold flex items-center gap-2">
              <History className="w-4 h-4" /> Previous Comments
            </h2>
            <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
              {previousAssessments.length === 0 ? (
                <p className="text-sm text-muted-foreground italic bg-muted/20 p-4 rounded-xl border border-dashed border-border text-center">
                  No previous assessments recorded for this loan.
                </p>
              ) : (
                previousAssessments.map((pa, i) => (
                  <Card key={i} className="neumorphic flex flex-col p-4 bg-card border-0 space-y-2">
                    <div className="flex justify-between items-start">
                      <span className="text-[10px] font-bold text-primary bg-primary/5 px-2 py-0.5 rounded">Score: {pa.totalScore || pa.character + pa.capacity + pa.capital + pa.collateral + pa.conditions}</span>
                      <span className="text-[9px] text-muted-foreground">{new Date(pa.createdAt).toLocaleDateString()}</span>
                    </div>
                    <p className="text-xs text-foreground leading-relaxed italic">"{pa.officerNotes || 'No notes provided'}"</p>
                    <div className="border-t border-border mt-1 pt-2">
                      <p className="text-[9px] text-muted-foreground text-right">— Officer Assessment</p>
                    </div>
                  </Card>
                ))
              )}
            </div>

            <Card className="bg-primary/5 border-0 p-4 rounded-2xl space-y-2">
              <h4 className="text-xs font-bold text-primary flex items-center gap-1 uppercase tracking-tighter">
                <AlertCircle className="w-3 h-3" /> Important Metric
              </h4>
              <p className="text-[11px] text-muted-foreground leading-snug">
                The 5 C's framework is a global standard. A score below 18 requires exceptional justification for approval.
              </p>
            </Card>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}
