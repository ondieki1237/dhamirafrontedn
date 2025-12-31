"use client"

import { DashboardLayout } from "@/components/dashboard-layout"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Plus, Trash2, UserPlus, UserCheck } from "lucide-react"
import { useRouter } from "next/navigation"
import { useEffect, useMemo, useState } from "react"
import { apiGet, apiPostJson, getCurrentUser } from "@/lib/api"
import { useToast } from "@/hooks/use-toast"
import { useSearchParams } from "next/navigation"

type GuarantorFormItem = {
  name: string
  clientNationalId: string
  phone: string
  isMember: boolean
  relationship: string
}

export default function InitiateLoanPage() {
  const router = useRouter()
  const { toast } = useToast()
  const search = useSearchParams()
  const [clients, setClients] = useState<any[]>([])
  const [groupInfo, setGroupInfo] = useState<any | null>(null)
  const [groupLoading, setGroupLoading] = useState(false)
  const [groupInactiveReason, setGroupInactiveReason] = useState<string | null>(null)
  const [form, setForm] = useState({
    clientNationalId: "",
    groupId: "",
    product: "business",
    amountKES: "",
    term: "6",
    interestRatePercent: "",
    purpose: "",
    guarantors: [
      { name: "", clientNationalId: "", phone: "", isMember: true, relationship: "" },
      { name: "", clientNationalId: "", phone: "", isMember: true, relationship: "" },
      { name: "", clientNationalId: "", phone: "", isMember: true, relationship: "" },
    ] as GuarantorFormItem[],
  })
  const [submitting, setSubmitting] = useState(false)
  const [showSuccess, setShowSuccess] = useState(false)

  useEffect(() => {
    let mounted = true
      ; (async () => {
        try {
          const raw = await apiGet<any>("/api/clients?limit=1000")
          const list = Array.isArray(raw) ? raw : (raw?.data || [])
          if (mounted) setClients(list)
        } catch (e) {
          // ignore; form still usable
        }
      })()
    return () => {
      mounted = false
    }
  }, [])

  useEffect(() => {
    // Prefill from query params
    const clientNationalId = search?.get("clientNationalId")
    const groupId = search?.get("groupId")
    if (clientNationalId) setForm((f) => ({ ...f, clientNationalId }))
    if (groupId) setForm((f) => ({ ...f, groupId }))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    const gid = form.groupId
    if (!gid) {
      setGroupInfo(null)
      setGroupInactiveReason(null)
      return
    }
    let mounted = true
      ; (async () => {
        try {
          setGroupLoading(true)
          const raw = await apiGet(`/api/groups/${gid}`)
          if (!mounted) return
          const g = raw?.data || raw
          setGroupInfo(g)
          // If group explicitly carries an inactive reason field, expose it
          const reason = (g && (g.inactiveReason || g.reason || g.message)) || null
          if (reason) setGroupInactiveReason(String(reason))
          else setGroupInactiveReason(null)
        } catch (err: any) {
          // couldn't fetch group; clear info
          if (!mounted) return
          setGroupInfo(null)
          setGroupInactiveReason(null)
        } finally {
          if (mounted) setGroupLoading(false)
        }
      })()
    return () => {
      mounted = false
    }
  }, [form.groupId])

  const [userRole, setUserRole] = useState<string | null>(null)

  useEffect(() => {
    const u = getCurrentUser()
    setUserRole(u?.role || null)
  }, [])

  const canInitiate = userRole && ["super_admin", "initiator_admin"].includes(userRole)

  const selectedClient = useMemo(() => {
    return clients.find(c => c.nationalId === form.clientNationalId)
  }, [clients, form.clientNationalId])

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!canInitiate) {
      toast({ title: "Not allowed", description: "Only Initiator Admins can initiate loans." })
      return
    }

    const amountKES = Number(form.amountKES)
    if (selectedClient) {
      const savings = (selectedClient as any).savings_balance_cents || 0
      const threshold = amountKES * 20 // 20% of amount in cents (amountKES * 100 * 0.2 = amountKES * 20)
      if (savings < threshold) {
        toast({
          title: "Insufficient Savings",
          description: `Client must have at least KES ${(threshold / 100).toLocaleString()} (20%) in savings. Current: KES ${(savings / 100).toLocaleString()}`,
          variant: "destructive"
        })
        return
      }
    }

    try {
      setSubmitting(true)
      const payload: any = {}
      if (form.groupId) {
        payload.groupId = form.groupId
      } else {
        payload.clientNationalId = form.clientNationalId
      }
      payload.product = form.product
      payload.amountKES = amountKES
      payload.term = Number(form.term)
      if (form.interestRatePercent) payload.interestRatePercent = Number(form.interestRatePercent)
      if (form.purpose) payload.purpose = form.purpose

      const validGuarantors = form.guarantors.filter(g => g.name.trim() && g.clientNationalId.trim())
      if (validGuarantors.length < 3) {
        toast({
          title: "Insufficient Guarantors",
          description: "At least 3 guarantors are required for loan application.",
          variant: "destructive"
        })
        return
      }

      // Try to enrich guarantors with clientIds if they exist in our list
      const enrichedGuarantors = validGuarantors.map(g => {
        const client = clients.find(c => c.nationalId === g.clientNationalId)
        return {
          ...g,
          clientId: client ? client._id : null
        }
      })

      payload.guarantors = enrichedGuarantors

      await apiPostJson("/api/loans/initiate", payload)
      setShowSuccess(true)
    } catch (e: any) {
      let msg = e?.message || "Failed to initiate loan"

      // Specifically handle the duplicate key error for guarantors
      if (msg.includes("duplicate key error") || msg.includes("E11000")) {
        msg = "Guarantor Error: One or more of the selected guarantors are already assigned to this loan. Please ensure National IDs are unique."
      }

      if (msg.toLowerCase().includes("group not active") || msg.toLowerCase().includes("not_active") || msg.toLowerCase().includes("inactive")) {
        setGroupInactiveReason(msg)
      }
      toast({ title: "Error", description: msg, variant: "destructive" })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto px-4 sm:px-0">
        <div className="mb-4 sm:mb-6">
          <Button variant="ghost" onClick={() => router.back()} className="mb-3 sm:mb-4 gap-2 h-8 sm:h-10">
            <ArrowLeft className="w-4 h-4" />
            Back
          </Button>
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Initiate Loan</h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1">Start a new loan application</p>
        </div>

        <Card className="neumorphic p-4 sm:p-8 bg-card border-0">
          <form className="space-y-4 sm:space-y-6" onSubmit={onSubmit}>
            {!form.groupId && (
              <div>
                <label className="block text-xs sm:text-sm font-semibold text-foreground mb-2">Client (by National ID)</label>
                <select
                  value={form.clientNationalId}
                  onChange={(e) => setForm({ ...form, clientNationalId: e.target.value })}
                  required={!form.groupId}
                  className="w-full px-3 sm:px-4 py-2 sm:py-3 bg-background rounded-xl border-0 neumorphic-inset focus:outline-none focus:ring-2 focus:ring-primary transition-all text-sm"
                >
                  <option value="">Select a client</option>
                  {clients.map((c) => (
                    <option key={c.nationalId} value={c.nationalId}>
                      {c.name} — {c.nationalId}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div>
              <label className="block text-xs sm:text-sm font-semibold text-foreground mb-2">Group (optional)</label>
              <input
                type="text"
                value={form.groupId}
                onChange={(e) => setForm({ ...form, groupId: e.target.value })}
                placeholder="Group ID (for group loans)"
                className="w-full px-3 sm:px-4 py-2 sm:py-3 bg-background rounded-xl border-0 neumorphic-inset focus:outline-none focus:ring-2 focus:ring-primary transition-all text-sm"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-6">
              <div>
                <label className="block text-xs sm:text-sm font-semibold text-foreground mb-2">Product</label>
                <input
                  type="text"
                  value={form.product}
                  onChange={(e) => setForm({ ...form, product: e.target.value })}
                  className="w-full px-3 sm:px-4 py-2 sm:py-3 bg-background rounded-xl border-0 neumorphic-inset focus:outline-none focus:ring-2 focus:ring-primary transition-all text-sm"
                  placeholder="e.g., fafa"
                  required
                />
              </div>
              <div>
                <label className="block text-xs sm:text-sm font-semibold text-foreground mb-2">Loan Amount (KES)</label>
                <input
                  type="number"
                  value={form.amountKES}
                  onChange={(e) => setForm({ ...form, amountKES: e.target.value })}
                  className="w-full px-3 sm:px-4 py-2 sm:py-3 bg-background rounded-xl border-0 neumorphic-inset focus:outline-none focus:ring-2 focus:ring-primary transition-all text-sm"
                  placeholder="5000"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-6 pt-4 border-t border-border">
              <div>
                <label className="block text-xs sm:text-sm font-semibold text-foreground mb-2">Duration (months)</label>
                <input
                  type="number"
                  value={form.term}
                  onChange={(e) => setForm({ ...form, term: e.target.value })}
                  className="w-full px-3 sm:px-4 py-2 sm:py-3 bg-background rounded-xl border-0 neumorphic-inset focus:outline-none focus:ring-2 focus:ring-primary transition-all text-sm"
                  placeholder="6"
                  required
                />
              </div>
              <div>
                <label className="block text-xs sm:text-sm font-semibold text-foreground mb-2">Interest Rate (%)</label>
                <input
                  type="number"
                  value={form.interestRatePercent}
                  onChange={(e) => setForm({ ...form, interestRatePercent: e.target.value })}
                  className="w-full px-3 sm:px-4 py-2 sm:py-3 bg-background rounded-xl border-0 neumorphic-inset focus:outline-none focus:ring-2 focus:ring-primary transition-all text-sm"
                  placeholder="6"
                />
              </div>
            </div>

            <div className="space-y-4 pt-4 border-t border-border">
              <div className="flex items-center justify-between">
                <label className="block text-xs sm:text-sm font-semibold text-foreground">Guarantors (At least 3 required)</label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setForm({ ...form, guarantors: [...form.guarantors, { name: "", clientNationalId: "", phone: "", isMember: true, relationship: "" }] })}
                  className="h-8 gap-1 text-xs neumorphic"
                >
                  <Plus className="w-3 h-3" /> Add More
                </Button>
              </div>

              <div className="grid grid-cols-1 gap-4">
                {form.guarantors.map((g, idx) => (
                  <div key={idx} className="p-4 rounded-xl bg-background/50 border border-border/50 space-y-3 relative group">
                    <div className="flex items-center justify-between gap-4">
                      <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Guarantor {idx + 1}</span>
                      {form.guarantors.length > 3 && (
                        <button
                          type="button"
                          onClick={() => {
                            const next = [...form.guarantors];
                            next.splice(idx, 1);
                            setForm({ ...form, guarantors: next });
                          }}
                          className="text-destructive hover:scale-110 transition-transform p-1"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                      <input
                        type="text"
                        placeholder="Full Name"
                        value={g.name}
                        onChange={(e) => {
                          const next = [...form.guarantors];
                          next[idx].name = e.target.value;
                          setForm({ ...form, guarantors: next });
                        }}
                        className="px-3 py-2 bg-background rounded-lg border-0 neumorphic-inset focus:outline-none focus:ring-1 focus:ring-primary text-xs"
                        required
                      />
                      <input
                        type="text"
                        placeholder="National ID"
                        value={g.clientNationalId}
                        onChange={(e) => {
                          const next = [...form.guarantors];
                          next[idx].clientNationalId = e.target.value;
                          setForm({ ...form, guarantors: next });
                        }}
                        className="px-3 py-2 bg-background rounded-lg border-0 neumorphic-inset focus:outline-none focus:ring-1 focus:ring-primary text-xs"
                        required
                      />
                      <input
                        type="text"
                        placeholder="Phone Number"
                        value={g.phone}
                        onChange={(e) => {
                          const next = [...form.guarantors];
                          next[idx].phone = e.target.value;
                          setForm({ ...form, guarantors: next });
                        }}
                        className="px-3 py-2 bg-background rounded-xl border-0 neumorphic-inset focus:outline-none focus:ring-1 focus:ring-primary text-xs"
                      />
                      <div className="flex items-center gap-2 px-2 h-9 bg-background rounded-lg neumorphic-inset">
                        <span className="text-[10px] font-semibold text-muted-foreground">Member?</span>
                        <div className="flex flex-1 gap-1">
                          <button
                            type="button"
                            onClick={() => {
                              const next = [...form.guarantors];
                              next[idx].isMember = true;
                              setForm({ ...form, guarantors: next });
                            }}
                            className={`flex-1 py-1 rounded text-[10px] font-bold flex items-center justify-center gap-1 transition-all ${g.isMember ? "bg-primary text-white shadow-sm" : "text-muted-foreground hover:bg-muted"}`}
                          >
                            <UserCheck className="w-3 h-3" /> Yes
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              const next = [...form.guarantors];
                              next[idx].isMember = false;
                              setForm({ ...form, guarantors: next });
                            }}
                            className={`flex-1 py-1 rounded text-[10px] font-bold flex items-center justify-center gap-1 transition-all ${!g.isMember ? "bg-secondary text-white shadow-sm" : "text-muted-foreground hover:bg-muted"}`}
                          >
                            <UserPlus className="w-3 h-3" /> No
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs sm:text-sm font-semibold text-foreground mb-2">Purpose</label>
              <textarea
                rows={4}
                value={form.purpose}
                onChange={(e) => setForm({ ...form, purpose: e.target.value })}
                className="w-full px-3 sm:px-4 py-2 sm:py-3 bg-background rounded-xl border-0 neumorphic-inset focus:outline-none focus:ring-2 focus:ring-primary transition-all text-sm"
                placeholder="Describe the purpose of the loan..."
              />
            </div>

            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-end pt-2">
              <Button type="button" variant="outline" onClick={() => router.back()} className="px-6 sm:px-8 py-2 sm:py-3 text-sm sm:text-base">
                Cancel
              </Button>
              <Button type="submit" disabled={submitting} className="px-6 sm:px-8 py-2 sm:py-3 bg-primary text-white neumorphic neumorphic-hover border-0 text-sm sm:text-base">
                {submitting ? "Submitting..." : "Submit Loan"}
              </Button>
            </div>
          </form>
        </Card>
      </div>

      {showSuccess && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm animate-in fade-in duration-300">
          <Card className="max-w-md w-full p-8 neumorphic border-0 text-center space-y-6 scale-up-center">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <UserCheck className="w-10 h-10 text-green-600" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-foreground">Loan Successfully Initiated!</h2>
              <p className="text-muted-foreground mt-2">The application has been saved and is now awaiting assessment.</p>
            </div>
            <div className="flex flex-col gap-3 pt-4">
              <Button
                onClick={() => router.push("/loans")}
                className="w-full py-4 bg-primary text-white neumorphic neumorphic-hover border-0 font-bold"
              >
                View Loans List
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setForm({
                    clientNationalId: "",
                    groupId: "",
                    product: "business",
                    amountKES: "",
                    term: "6",
                    interestRatePercent: "",
                    purpose: "",
                    guarantors: [
                      { name: "", clientNationalId: "", phone: "", isMember: true, relationship: "" },
                      { name: "", clientNationalId: "", phone: "", isMember: true, relationship: "" },
                      { name: "", clientNationalId: "", phone: "", isMember: true, relationship: "" },
                    ],
                  });
                  setShowSuccess(false);
                }}
                className="w-full py-4 border-0 neumorphic"
              >
                Initiate Another Loan
              </Button>
            </div>
          </Card>
        </div>
      )}
    </DashboardLayout>
  )
}
