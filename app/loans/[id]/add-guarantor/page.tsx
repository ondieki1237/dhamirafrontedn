"use client"

import { DashboardLayout } from "@/components/dashboard-layout"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"
import { useRouter, useParams } from "next/navigation"
import { useEffect, useState } from "react"
import { apiGet, apiPostJson } from "@/lib/api"
import { useToast } from "@/hooks/use-toast"

type Loan = {
  _id: string
  status: string
}

export default function AddGuarantorPage() {
  const router = useRouter()
  const params = useParams()
  const { toast } = useToast()
  const loanId = params.id as string

  const [loan, setLoan] = useState<Loan | null>(null)
  const [clients, setClients] = useState<{ _id: string; name: string; nationalId: string }[]>([])
  const [form, setForm] = useState({
    clientId: "",
    relationship: "",
    idCopyUrl: "",
    photoUrl: "",
  })
  const [submitting, setSubmitting] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let mounted = true
    ;(async () => {
      try {
        const [loanData, clientsData] = await Promise.all([
          apiGet<Loan>(`/api/loans/${loanId}`),
          apiGet<{ _id: string; name: string; nationalId: string }[]>("/api/clients")
        ])
        if (mounted) {
          if (loanData.status !== "initiated") {
            toast({ title: "Error", description: "Guarantors can only be added to initiated loans" })
            router.push(`/loans/${loanId}`)
            return
          }
          setLoan(loanData)
          setClients(clientsData)
          setLoading(false)
        }
      } catch (e: any) {
        if (mounted) {
          toast({ title: "Error", description: e?.message || "Failed to load data" })
          router.push("/loans")
        }
      }
    })()
    return () => {
      mounted = false
    }
  }, [loanId, router, toast])

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      setSubmitting(true)
      await apiPostJson("/api/guarantors", {
        loanId,
        clientId: form.clientId,
        relationship: form.relationship,
        idCopyUrl: form.idCopyUrl || "/uploads/placeholder.jpg",
        photoUrl: form.photoUrl || "/uploads/placeholder.jpg",
      })
      toast({ title: "Guarantor added" })
      router.push(`/loans/${loanId}`)
    } catch (e: any) {
      toast({ title: "Error", description: e?.message || "Failed to add guarantor" })
    } finally {
      setSubmitting(false)
    }
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
          <h1 className="text-3xl font-bold text-foreground">Add Guarantor</h1>
          <p className="text-muted-foreground mt-1">Add a guarantor to this loan</p>
        </div>

        <Card className="neumorphic p-8 bg-card border-0">
          <form className="space-y-6" onSubmit={onSubmit}>
            <div>
              <label className="block text-sm font-semibold text-foreground mb-2">
                Guarantor Client <span className="text-destructive">*</span>
              </label>
              <select
                value={form.clientId}
                onChange={(e) => setForm({ ...form, clientId: e.target.value })}
                required
                className="w-full px-4 py-3 bg-background rounded-xl border-0 neumorphic-inset focus:outline-none focus:ring-2 focus:ring-primary transition-all"
              >
                <option value="">Select a client</option>
                {clients.map((c) => (
                  <option key={c._id} value={c._id}>
                    {c.name} — {c.nationalId}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold text-foreground mb-2">
                Relationship <span className="text-destructive">*</span>
              </label>
              <input
                type="text"
                value={form.relationship}
                onChange={(e) => setForm({ ...form, relationship: e.target.value })}
                className="w-full px-4 py-3 bg-background rounded-xl border-0 neumorphic-inset focus:outline-none focus:ring-2 focus:ring-primary transition-all"
                placeholder="e.g., Brother, Friend, Business Partner"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-foreground mb-2">ID Copy URL (optional)</label>
              <input
                type="text"
                value={form.idCopyUrl}
                onChange={(e) => setForm({ ...form, idCopyUrl: e.target.value })}
                className="w-full px-4 py-3 bg-background rounded-xl border-0 neumorphic-inset focus:outline-none focus:ring-2 focus:ring-primary transition-all"
                placeholder="/uploads/id-copy.jpg"
              />
              <p className="text-xs text-muted-foreground mt-1">Upload ID copy separately and paste URL here</p>
            </div>

            <div>
              <label className="block text-sm font-semibold text-foreground mb-2">Photo URL (optional)</label>
              <input
                type="text"
                value={form.photoUrl}
                onChange={(e) => setForm({ ...form, photoUrl: e.target.value })}
                className="w-full px-4 py-3 bg-background rounded-xl border-0 neumorphic-inset focus:outline-none focus:ring-2 focus:ring-primary transition-all"
                placeholder="/uploads/photo.jpg"
              />
              <p className="text-xs text-muted-foreground mt-1">Upload photo separately and paste URL here</p>
            </div>

            <div className="flex gap-4 justify-end">
              <Button type="button" variant="outline" onClick={() => router.back()} className="px-8 py-3">
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={submitting}
                className="px-8 py-3 bg-primary text-white neumorphic neumorphic-hover border-0"
              >
                {submitting ? "Adding..." : "Add Guarantor"}
              </Button>
            </div>
          </form>
        </Card>
      </div>
    </DashboardLayout>
  )
}
