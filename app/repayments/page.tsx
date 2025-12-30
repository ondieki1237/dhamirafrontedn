"use client"

import { useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { DollarSign } from "lucide-react"
import { apiGet, apiPostJson, getCurrentUser } from "@/lib/api"
import { useToast } from "@/hooks/use-toast"

type LoanItem = {
  _id: string
  client?: { name?: string } | string
  clientName?: string
  type: string
  amount: number
}

type Repayment = {
  _id: string
  loanId: string
  amount: number
  paymentMethod: string
  transactionId?: string
  createdAt?: string
}

export default function RepaymentsPage() {
  const { toast } = useToast()
  const router = useRouter()
  const [loans, setLoans] = useState<LoanItem[]>([])
  const [loadingLoans, setLoadingLoans] = useState(true)
  const [tab, setTab] = useState<"individual" | "group">("individual")
  const [selectedLoanId, setSelectedLoanId] = useState<string>("")
  const [history, setHistory] = useState<Repayment[]>([])
  const [loadingHistory, setLoadingHistory] = useState(false)
  const [form, setForm] = useState({ amount: "", paymentMethod: "mpesa", transactionId: "" })
  const [submitting, setSubmitting] = useState(false)
  const [userRole, setUserRole] = useState<string | null>(null)

  useEffect(() => {
    const u = getCurrentUser()
    setUserRole(u?.role || null)
  }, [])

  const canRecord = userRole && ["super_admin", "initiator_admin"].includes(userRole)

  function normalizeHistoryPayload(payload: any): Repayment[] {
    if (!payload) return []
    if (Array.isArray(payload)) return payload
    if (payload.repayments && Array.isArray(payload.repayments)) return payload.repayments
    // Some APIs return { history: [...] } or { data: [...] }
    if (payload.history && Array.isArray(payload.history)) return payload.history
    if (payload.data && Array.isArray(payload.data)) return payload.data
    return []
  }

  useEffect(() => {
    let mounted = true
      ; (async () => {
        try {
          setLoadingLoans(true)
          const data = await apiGet<any>("/api/loans")
          // Normalize possible response shapes: array | { items | data | loans }
          const normalized = Array.isArray(data)
            ? data
            : data?.items || data?.data || data?.loans || []
          if (mounted) setLoans(normalized)
        } catch (e: any) {
          toast({ title: "Error", description: e?.message || "Failed to load loans" })
        } finally {
          if (mounted) setLoadingLoans(false)
        }
      })()
    return () => {
      mounted = false
    }
  }, [toast])

  const groupLoans = useMemo(() => loans.filter((l) => (l.type || "").toLowerCase() === "group"), [loans])
  const individualLoans = useMemo(() => loans.filter((l) => (l.type || "").toLowerCase() !== "group"), [loans])
  const visibleLoans = tab === "group" ? groupLoans : individualLoans

  useEffect(() => {
    // Reset selection when tab changes
    setSelectedLoanId("")
    setHistory([])
  }, [tab])

  useEffect(() => {
    let mounted = true
      ; (async () => {
        if (!selectedLoanId) return
        try {
          setLoadingHistory(true)
          const data = await apiGet<any>(`/api/repayments/loan/${selectedLoanId}`)
          if (mounted) setHistory(normalizeHistoryPayload(data))
        } catch (e: any) {
          toast({ title: "Error", description: e?.message || "Failed to load repayment history" })
        } finally {
          if (mounted) setLoadingHistory(false)
        }
      })()
    return () => {
      mounted = false
    }
  }, [selectedLoanId, toast])

  const recordRepayment = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!canRecord) {
      toast({ title: "Not allowed", description: "Only Initiator Admins can record manual repayments." })
      return
    }
    if (!selectedLoanId) {
      toast({ title: "Select a loan", description: "Please choose a loan first" })
      return
    }
    const amountNum = Number(form.amount)
    if (!amountNum || amountNum <= 0) {
      toast({ title: "Invalid amount", description: "Enter a valid amount greater than 0" })
      return
    }
    try {
      setSubmitting(true)
      console.log("Payload:", {
        loanId: selectedLoanId,
        amount: amountNum,
        paymentMethod: form.paymentMethod,
        transactionId: form.transactionId || undefined,
      })
      await apiPostJson("/api/repayments", {
        loanId: selectedLoanId,
        amount: amountNum,
        paymentMethod: form.paymentMethod,
        transactionId: form.transactionId || undefined,
      })
      toast({ title: "Repayment recorded" })
      // Refresh history
      const data = await apiGet<any>(`/api/repayments/loan/${selectedLoanId}`)
      setHistory(normalizeHistoryPayload(data))
      setForm({ amount: "", paymentMethod: form.paymentMethod, transactionId: "" })
    } catch (e: any) {
      console.error("Error during repayment:", e)
      toast({ title: "Error", description: e?.message || "Failed to record repayment" })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Repayments</h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1">Record payments and view history for loans</p>
        </div>

        {/* M-Pesa Paybill Instructions */}
        <Card className="neumorphic p-4 sm:p-6 bg-card border-0 bg-blue-50/50 dark:bg-blue-950/20">
          <h3 className="font-bold text-base sm:text-lg mb-3 flex items-center gap-2">
            <DollarSign className="w-5 h-5" />
            M-Pesa Paybill Instructions
          </h3>
          <div className="space-y-2 text-xs sm:text-sm text-muted-foreground">
            <p className="font-semibold text-foreground">For clients paying via M-Pesa:</p>
            <ol className="list-decimal list-inside space-y-1 ml-2">
              <li>Go to M-Pesa menu on your phone</li>
              <li>Select "Lipa na M-Pesa" → "Paybill"</li>
              <li>Enter Business Number: <span className="font-mono font-bold text-primary">600000</span></li>
              <li>Enter Account Number: <span className="font-semibold text-foreground">Your Loan ID</span></li>
              <li>Enter Amount</li>
              <li>Enter your M-Pesa PIN and confirm</li>
            </ol>
            <p className="text-xs mt-3 text-muted-foreground italic">
              Note: Payments are automatically recorded when received via M-Pesa. Manual recording below is for cash/bank transfers.
            </p>
          </div>
        </Card>

        {/* Tabs for Individuals / Groups */}
        <div className="flex w-full rounded-xl bg-muted/30 p-1 border border-border max-w-xs">
          <button
            className={`flex-1 px-3 py-2 rounded-lg text-xs sm:text-sm ${tab === "individual" ? "bg-background shadow font-semibold" : "text-muted-foreground"}`}
            onClick={() => setTab("individual")}
            type="button"
          >
            Individuals
          </button>
          <button
            className={`flex-1 px-3 py-2 rounded-lg text-xs sm:text-sm ${tab === "group" ? "bg-background shadow font-semibold" : "text-muted-foreground"}`}
            onClick={() => setTab("group")}
            type="button"
          >
            Groups
          </button>
        </div>

        <Card className="neumorphic p-4 sm:p-6 bg-card border-0">
          <form className="space-y-4 sm:space-y-6" onSubmit={recordRepayment}>
            <div>
              <label className="block text-xs sm:text-sm font-semibold text-foreground mb-2">Select Loan</label>
              <select
                value={selectedLoanId}
                onChange={(e) => setSelectedLoanId(e.target.value)}
                className="w-full px-3 sm:px-4 py-2 sm:py-3 bg-background rounded-xl border-0 neumorphic-inset focus:outline-none focus:ring-2 focus:ring-primary transition-all text-sm"
              >
                <option value="">{loadingLoans ? "Loading loans…" : visibleLoans.length ? "Choose a loan" : "No loans found"}</option>
                {visibleLoans.map((l) => {
                  const clientName = typeof l.client === "string" ? l.client : l.client?.name || l.clientName || "—"
                  return (
                    <option key={l._id} value={l._id}>
                      {clientName} — KES {Number(l.amount || 0).toLocaleString()} ({l._id})
                    </option>
                  )
                })}
              </select>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
              <div>
                <label className="block text-xs sm:text-sm font-semibold text-foreground mb-2">Amount</label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={form.amount}
                  onChange={(e) => setForm({ ...form, amount: e.target.value })}
                  className="w-full px-3 sm:px-4 py-2 sm:py-3 bg-background rounded-xl border-0 neumorphic-inset focus:outline-none focus:ring-2 focus:ring-primary transition-all text-sm"
                  placeholder="e.g., 5000"
                />
              </div>
              <div>
                <label className="block text-xs sm:text-sm font-semibold text-foreground mb-2">Method</label>
                <select
                  value={form.paymentMethod}
                  onChange={(e) => setForm({ ...form, paymentMethod: e.target.value })}
                  className="w-full px-3 sm:px-4 py-2 sm:py-3 bg-background rounded-xl border-0 neumorphic-inset focus:outline-none focus:ring-2 focus:ring-primary transition-all text-sm"
                >
                  <option value="mpesa">M-Pesa</option>
                  <option value="cash">Cash</option>
                  <option value="bank">Bank</option>
                </select>
              </div>
              <div>
                <label className="block text-xs sm:text-sm font-semibold text-foreground mb-2">Transaction ID</label>
                <input
                  type="text"
                  value={form.transactionId}
                  onChange={(e) => setForm({ ...form, transactionId: e.target.value })}
                  className="w-full px-3 sm:px-4 py-2 sm:py-3 bg-background rounded-xl border-0 neumorphic-inset focus:outline-none focus:ring-2 focus:ring-primary transition-all text-sm"
                  placeholder="e.g., QWE123ABC"
                />
              </div>
            </div>

            <div className="flex justify-end">
              <Button type="submit" disabled={submitting || !selectedLoanId} className="px-6 sm:px-8">
                {submitting ? "Recording…" : "Record Repayment"}
              </Button>
            </div>
          </form>
        </Card>

        <Card className="neumorphic p-4 sm:p-6 bg-card border-0">
          <h2 className="text-lg sm:text-xl font-semibold text-foreground mb-3 sm:mb-4">Repayment History</h2>
          {!selectedLoanId ? (
            <p className="text-xs sm:text-sm text-muted-foreground">Select a loan to view repayment history.</p>
          ) : loadingHistory ? (
            <p className="text-xs sm:text-sm text-muted-foreground">Loading history…</p>
          ) : history.length === 0 ? (
            <p className="text-xs sm:text-sm text-muted-foreground">No repayments recorded for this loan yet.</p>
          ) : (
            <div className="space-y-2">
              {/* Desktop Table */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left py-3 px-4 text-xs sm:text-sm font-semibold text-foreground">Date</th>
                      <th className="text-left py-3 px-4 text-xs sm:text-sm font-semibold text-foreground">Amount</th>
                      <th className="text-left py-3 px-4 text-xs sm:text-sm font-semibold text-foreground">Method</th>
                      <th className="text-left py-3 px-4 text-xs sm:text-sm font-semibold text-foreground">Transaction</th>
                    </tr>
                  </thead>
                  <tbody>
                    {history.map((r) => {
                      const date = r.createdAt ? new Date(r.createdAt).toLocaleString() : "—"
                      return (
                        <tr key={r._id} className="border-b border-border">
                          <td className="py-3 px-4 text-xs sm:text-sm text-muted-foreground">{date}</td>
                          <td className="py-3 px-4 text-xs sm:text-sm font-semibold text-secondary">KES {Number(r.amount || 0).toLocaleString()}</td>
                          <td className="py-3 px-4 text-xs sm:text-sm capitalize">{r.paymentMethod}</td>
                          <td className="py-3 px-4 text-xs sm:text-sm font-mono">{r.transactionId || "—"}</td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>

              {/* Mobile Cards */}
              <div className="md:hidden space-y-3">
                {history.map((r) => {
                  const date = r.createdAt ? new Date(r.createdAt).toLocaleString() : "—"
                  return (
                    <div key={r._id} className="p-3 rounded-lg bg-muted/20 border border-border space-y-2">
                      <div className="flex items-center justify-between">
                        <p className="text-xs text-muted-foreground">{date}</p>
                        <Badge variant="outline" className="bg-secondary/10 text-secondary border-secondary/20">
                          {r.paymentMethod}
                        </Badge>
                      </div>
                      <div className="flex items-center justify-between">
                        <p className="text-xs text-muted-foreground">Amount</p>
                        <p className="text-sm font-semibold text-secondary">KES {Number(r.amount || 0).toLocaleString()}</p>
                      </div>
                      <div className="flex items-center justify-between">
                        <p className="text-xs text-muted-foreground">Transaction</p>
                        <p className="text-xs font-mono">{r.transactionId || "—"}</p>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </Card>
      </div>
    </DashboardLayout>
  )
}
