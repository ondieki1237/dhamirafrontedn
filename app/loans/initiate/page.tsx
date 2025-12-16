"use client"

import { DashboardLayout } from "@/components/dashboard-layout"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"
import { useRouter } from "next/navigation"
import { useEffect, useMemo, useState } from "react"
import { apiGet, apiPostJson } from "@/lib/api"
import { useToast } from "@/hooks/use-toast"

export default function InitiateLoanPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [clients, setClients] = useState<{ name: string; nationalId: string }[]>([])
  const [form, setForm] = useState({
    clientNationalId: "",
    type: "business",
    amount: "",
    term: "6",
    purpose: "",
  })
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    let mounted = true
    ;(async () => {
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

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      setSubmitting(true)
      const payload = {
        clientNationalId: form.clientNationalId,
        type: form.type,
        amount: Number(form.amount),
        term: Number(form.term),
      }
      await apiPostJson("/api/loans/initiate", payload)
      toast({ title: "Loan initiated" })
      router.push("/loans")
    } catch (e: any) {
      toast({ title: "Error", description: e?.message || "Failed to initiate loan" })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <Button variant="ghost" onClick={() => router.back()} className="mb-4 gap-2">
            <ArrowLeft className="w-4 h-4" />
            Back
          </Button>
          <h1 className="text-3xl font-bold text-foreground">Initiate Loan</h1>
          <p className="text-muted-foreground mt-1">Start a new loan application</p>
        </div>

        <Card className="neumorphic p-8 bg-card border-0">
          <form className="space-y-6" onSubmit={onSubmit}>
            <div>
              <label className="block text-sm font-semibold text-foreground mb-2">Client (by National ID)</label>
              <select
                value={form.clientNationalId}
                onChange={(e) => setForm({ ...form, clientNationalId: e.target.value })}
                required
                className="w-full px-4 py-3 bg-background rounded-xl border-0 neumorphic-inset focus:outline-none focus:ring-2 focus:ring-primary transition-all"
              >
                <option value="">Select a client</option>
                {clients.map((c) => (
                  <option key={c.nationalId} value={c.nationalId}>
                    {c.name} — {c.nationalId}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-semibold text-foreground mb-2">Loan Amount</label>
                <input
                  type="number"
                  value={form.amount}
                  onChange={(e) => setForm({ ...form, amount: e.target.value })}
                  className="w-full px-4 py-3 bg-background rounded-xl border-0 neumorphic-inset focus:outline-none focus:ring-2 focus:ring-primary transition-all"
                  placeholder="50000"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-foreground mb-2">Loan Type</label>
                <select
                  value={form.type}
                  onChange={(e) => setForm({ ...form, type: e.target.value })}
                  className="w-full px-4 py-3 bg-background rounded-xl border-0 neumorphic-inset focus:outline-none focus:ring-2 focus:ring-primary transition-all"
                >
                  <option value="business">Business</option>
                  <option value="emergency">Emergency</option>
                  <option value="school_fees">School Fees</option>
                  <option value="other">Other</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-foreground mb-2">Duration (months)</label>
              <input
                type="number"
                value={form.term}
                onChange={(e) => setForm({ ...form, term: e.target.value })}
                className="w-full px-4 py-3 bg-background rounded-xl border-0 neumorphic-inset focus:outline-none focus:ring-2 focus:ring-primary transition-all"
                placeholder="6"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-foreground mb-2">Purpose</label>
              <textarea
                rows={4}
                value={form.purpose}
                onChange={(e) => setForm({ ...form, purpose: e.target.value })}
                className="w-full px-4 py-3 bg-background rounded-xl border-0 neumorphic-inset focus:outline-none focus:ring-2 focus:ring-primary transition-all"
                placeholder="Describe the purpose of the loan..."
              />
            </div>

            <div className="flex gap-4 justify-end">
              <Button type="button" variant="outline" onClick={() => router.back()} className="px-8 py-3">
                Cancel
              </Button>
              <Button type="submit" disabled={submitting} className="px-8 py-3 bg-primary text-white neumorphic neumorphic-hover border-0">
                {submitting ? "Submitting..." : "Submit Loan"}
              </Button>
            </div>
          </form>
        </Card>
      </div>
    </DashboardLayout>
  )
}
