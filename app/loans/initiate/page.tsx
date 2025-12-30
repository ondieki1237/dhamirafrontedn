"use client"

import { DashboardLayout } from "@/components/dashboard-layout"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"
import { useRouter } from "next/navigation"
import { useEffect, useMemo, useState } from "react"
import { apiGet, apiPostJson, getCurrentUser } from "@/lib/api"
import { useToast } from "@/hooks/use-toast"
import { useSearchParams } from "next/navigation"

export default function InitiateLoanPage() {
  const router = useRouter()
  const { toast } = useToast()
  const search = useSearchParams()
  const [clients, setClients] = useState<{ name: string; nationalId: string }[]>([])
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
    guarantors: [] as Array<{ clientNationalId: string; relationship: string; idCopyUrl?: string; photoUrl?: string; hasRepaidFafaBefore?: boolean }>,
  })
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    let mounted = true
      ; (async () => {
        try {
          const data = await apiGet<{ name: string; nationalId: string }[]>("/api/clients")
          if (mounted) setClients(data)
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
          const g = await apiGet(`/api/groups/${gid}`)
          if (!mounted) return
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
      if (Array.isArray(form.guarantors) && form.guarantors.length > 0) payload.guarantors = form.guarantors
      await apiPostJson("/api/loans/initiate", payload)
      toast({ title: "Loan initiated" })
      router.push("/loans")
    } catch (e: any) {
      const msg = e?.message || "Failed to initiate loan"
      if (msg.toLowerCase().includes("group not active") || msg.toLowerCase().includes("not_active") || msg.toLowerCase().includes("inactive")) {
        setGroupInactiveReason(msg)
      }
      toast({ title: "Error", description: msg })
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

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
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
              <div>
                <label className="block text-xs sm:text-sm font-semibold text-foreground mb-2">Guarantors (optional)</label>
                <input
                  type="text"
                  value={form.guarantors.map(g => g.clientNationalId).join(",")}
                  onChange={(e) => {
                    const ids = e.target.value.split(",").map(s => s.trim()).filter(Boolean)
                    setForm({ ...form, guarantors: ids.map(id => ({ clientNationalId: id, relationship: "" })) })
                  }}
                  className="w-full px-3 sm:px-4 py-2 sm:py-3 bg-background rounded-xl border-0 neumorphic-inset focus:outline-none focus:ring-2 focus:ring-primary transition-all text-sm"
                  placeholder="comma-separated national IDs"
                />
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
    </DashboardLayout>
  )
}
