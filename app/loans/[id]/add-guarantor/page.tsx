"use client"

import { DashboardLayout } from "@/components/dashboard-layout"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Upload } from "lucide-react"
import { useRouter, useParams } from "next/navigation"
import { useEffect, useState } from "react"
import { apiGet, apiPostJson, apiPostFormData } from "@/lib/api"
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
    idCopy: null as File | null,
    photo: null as File | null,
  })
  const [fileNames, setFileNames] = useState({ idCopy: "", photo: "" })
  const [submitting, setSubmitting] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let mounted = true
    ;(async () => {
      try {
        const [loanData, clientsData] = await Promise.all([
          apiGet<Loan>(`/api/loans/${loanId}`),
          apiGet<{ _id: string; name: string; nationalId: string }[]>("/api/clients"),
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

  const handleFileChange = (field: "idCopy" | "photo", file: File | null) => {
    setForm({ ...form, [field]: file })
    setFileNames({ ...fileNames, [field]: file?.name || "" })
  }

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      if (!form.clientId || !form.relationship) {
        toast({ title: "Error", description: "Client and relationship are required" })
        return
      }
      if (!form.idCopy || !form.photo) {
        toast({ title: "Error", description: "Both ID copy and photo are required" })
        return
      }

      setSubmitting(true)

      const idCopyFd = new FormData()
      idCopyFd.append("file", form.idCopy)
      const idCopyRes = await apiPostFormData<{ url: string }>("/api/upload", idCopyFd)
      const idCopyUrl = idCopyRes.url

      const photoFd = new FormData()
      photoFd.append("file", form.photo)
      const photoRes = await apiPostFormData<{ url: string }>("/api/upload", photoFd)
      const photoUrl = photoRes.url

      await apiPostJson("/api/guarantors", {
        loanId,
        clientId: form.clientId,
        relationship: form.relationship,
        idCopyUrl,
        photoUrl,
      })
      toast({ title: "Guarantor added", description: "The guarantor has been successfully added" })
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
        <div className="max-w-4xl mx-auto px-4 sm:px-0">
          <p className="text-xs sm:text-sm text-muted-foreground">Loading...</p>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto px-4 sm:px-0">
        <div className="mb-4 sm:mb-6">
          <Button variant="ghost" onClick={() => router.back()} className="mb-3 sm:mb-4 gap-2 h-8 sm:h-10">
            <ArrowLeft className="w-4 h-4" />
            Back
          </Button>
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Add Guarantor</h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1">Add a guarantor to this loan</p>
        </div>

        <Card className="neumorphic p-4 sm:p-8 bg-card border-0">
          <form className="space-y-4 sm:space-y-6" onSubmit={onSubmit}>
            <div>
              <label className="block text-xs sm:text-sm font-semibold text-foreground mb-2">
                Guarantor Client <span className="text-destructive">*</span>
              </label>
              <select
                value={form.clientId}
                onChange={(e) => setForm({ ...form, clientId: e.target.value })}
                required
                className="w-full px-3 sm:px-4 py-2 sm:py-3 bg-background rounded-xl border-0 neumorphic-inset focus:outline-none focus:ring-2 focus:ring-primary transition-all text-sm"
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
              <label className="block text-xs sm:text-sm font-semibold text-foreground mb-2">
                Relationship <span className="text-destructive">*</span>
              </label>
              <input
                type="text"
                value={form.relationship}
                onChange={(e) => setForm({ ...form, relationship: e.target.value })}
                className="w-full px-3 sm:px-4 py-2 sm:py-3 bg-background rounded-xl border-0 neumorphic-inset focus:outline-none focus:ring-2 focus:ring-primary transition-all text-sm"
                placeholder="e.g., Brother, Friend, Business Partner"
                required
              />
            </div>

            <div>
              <label className="block text-xs sm:text-sm font-semibold text-foreground mb-2">
                ID Copy <span className="text-destructive">*</span>
              </label>
              <div className="relative">
                <input
                  type="file"
                  accept="image/*,.pdf"
                  onChange={(e) => handleFileChange("idCopy", e.target.files?.[0] || null)}
                  className="hidden"
                  id="idCopy-input"
                  required
                />
                <label
                  htmlFor="idCopy-input"
                  className="flex items-center justify-center gap-2 w-full px-3 sm:px-4 py-4 sm:py-6 rounded-xl border-2 border-dashed border-border hover:border-primary transition-colors cursor-pointer bg-muted/20"
                >
                  <Upload className="w-4 h-4 text-muted-foreground" />
                  <div className="text-center">
                    {fileNames.idCopy ? (
                      <>
                        <p className="text-xs sm:text-sm font-semibold text-foreground">{fileNames.idCopy}</p>
                        <p className="text-xs text-muted-foreground">Click to change</p>
                      </>
                    ) : (
                      <>
                        <p className="text-xs sm:text-sm font-semibold text-foreground">Click to upload ID copy</p>
                        <p className="text-xs text-muted-foreground">PNG, JPG or PDF</p>
                      </>
                    )}
                  </div>
                </label>
              </div>
            </div>

            <div>
              <label className="block text-xs sm:text-sm font-semibold text-foreground mb-2">
                Photo <span className="text-destructive">*</span>
              </label>
              <div className="relative">
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleFileChange("photo", e.target.files?.[0] || null)}
                  className="hidden"
                  id="photo-input"
                  required
                />
                <label
                  htmlFor="photo-input"
                  className="flex items-center justify-center gap-2 w-full px-3 sm:px-4 py-4 sm:py-6 rounded-xl border-2 border-dashed border-border hover:border-primary transition-colors cursor-pointer bg-muted/20"
                >
                  <Upload className="w-4 h-4 text-muted-foreground" />
                  <div className="text-center">
                    {fileNames.photo ? (
                      <>
                        <p className="text-xs sm:text-sm font-semibold text-foreground">{fileNames.photo}</p>
                        <p className="text-xs text-muted-foreground">Click to change</p>
                      </>
                    ) : (
                      <>
                        <p className="text-xs sm:text-sm font-semibold text-foreground">Click to upload photo</p>
                        <p className="text-xs text-muted-foreground">PNG, JPG</p>
                      </>
                    )}
                  </div>
                </label>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-end pt-2">
              <Button type="button" variant="outline" onClick={() => router.back()} className="px-6 sm:px-8 py-2 sm:py-3 text-sm sm:text-base">
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={submitting}
                className="px-6 sm:px-8 py-2 sm:py-3 bg-primary text-white neumorphic neumorphic-hover border-0 text-sm sm:text-base"
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
