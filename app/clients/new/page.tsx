"use client"

import { DashboardLayout } from "@/components/dashboard-layout"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { ArrowLeft } from "lucide-react"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { apiGet, apiPostFormData, getCurrentUser } from "@/lib/api"
import { useToast } from "@/hooks/use-toast"

export default function NewClientPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [groups, setGroups] = useState<{ _id: string; name: string }[]>([])
  const [submitting, setSubmitting] = useState(false)
  const [showSuccess, setShowSuccess] = useState(false)
  const [form, setForm] = useState({
    name: "",
    nationalId: "",
    phone: "",
    residence: "owned",
    businessType: "",
    businessLocation: "",
    nextOfKinName: "",
    nextOfKinPhone: "",
    nextOfKinRelationship: "",
    groupId: "",
    photo: null as File | null,
  })
  const [blocked, setBlocked] = useState(false)

  useEffect(() => {
    let mounted = true
    ;(async () => {
      try {
        const data = await apiGet<{ _id: string; name: string }[]>("/api/groups")
        if (mounted) setGroups(data)
      } catch (e) {
        // optional; groups select can remain empty
      }
    })()

    const user = getCurrentUser()
    if (!user?.role || !["super_admin", "initiator_admin", "approver_admin", "loan_officer"].includes(user.role)) {
      setBlocked(true)
    }
    return () => {
      mounted = false
    }
  }, [])

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      if (blocked) {
        toast({ title: "Not allowed", description: "You do not have permission to onboard clients." })
        return
      }
      setSubmitting(true)
      const fd = new FormData()
      Object.entries(form).forEach(([k, v]) => {
        if (k === "photo") return
        if (typeof v === "string") fd.append(k, v)
      })
      if (form.photo) fd.append("photo", form.photo)

      const res = await apiPostFormData<{ message: string }>("/api/clients/onboard", fd)
      toast({ title: "Success", description: res?.message || "Client onboarded successfully" })
      setShowSuccess(true)
    } catch (e: any) {
      toast({ title: "Error", description: e?.message || "Failed to onboard client" })
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
          <h1 className="text-3xl font-bold text-foreground">New Client</h1>
          <p className="text-muted-foreground mt-1">Add a new client to the system</p>
          {blocked && <p className="text-sm text-destructive mt-2">You do not have permission to onboard clients.</p>}
        </div>

        <Card className="neumorphic p-8 bg-card border-0">
          <form className="space-y-6" onSubmit={onSubmit}>
            <div>
              <label className="block text-sm font-semibold text-foreground mb-2">Full Name *</label>
              <input
                type="text"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="w-full px-4 py-3 bg-background rounded-xl border-0 neumorphic-inset focus:outline-none focus:ring-2 focus:ring-secondary transition-all"
                placeholder="Enter full name"
                required
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-semibold text-foreground mb-2">National ID *</label>
                <input
                  type="text"
                  value={form.nationalId}
                  onChange={(e) => setForm({ ...form, nationalId: e.target.value })}
                  className="w-full px-4 py-3 bg-background rounded-xl border-0 neumorphic-inset focus:outline-none focus:ring-2 focus:ring-secondary transition-all"
                  placeholder="12345678"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-foreground mb-2">Phone Number *</label>
                <input
                  type="tel"
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  className="w-full px-4 py-3 bg-background rounded-xl border-0 neumorphic-inset focus:outline-none focus:ring-2 focus:ring-secondary transition-all"
                  placeholder="+254 700 000 000"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-semibold text-foreground mb-2">Residence *</label>
                <select
                  value={form.residence}
                  onChange={(e) => setForm({ ...form, residence: e.target.value })}
                  className="w-full px-4 py-3 bg-background rounded-xl border-0 neumorphic-inset focus:outline-none focus:ring-2 focus:ring-secondary transition-all"
                >
                  <option value="owned">Owned</option>
                  <option value="rented">Rented</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-foreground mb-2">Group</label>
                <select
                  value={form.groupId}
                  onChange={(e) => setForm({ ...form, groupId: e.target.value })}
                  className="w-full px-4 py-3 bg-background rounded-xl border-0 neumorphic-inset focus:outline-none focus:ring-2 focus:ring-secondary transition-all"
                >
                  <option value="">Select group (optional)</option>
                  {groups.map((g) => (
                    <option key={g._id} value={g._id}>
                      {g.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-semibold text-foreground mb-2">Business Type</label>
                <input
                  type="text"
                  value={form.businessType}
                  onChange={(e) => setForm({ ...form, businessType: e.target.value })}
                  className="w-full px-4 py-3 bg-background rounded-xl border-0 neumorphic-inset focus:outline-none focus:ring-2 focus:ring-secondary transition-all"
                  placeholder="Retail / Agriculture / Services"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-foreground mb-2">Business Location</label>
                <input
                  type="text"
                  value={form.businessLocation}
                  onChange={(e) => setForm({ ...form, businessLocation: e.target.value })}
                  className="w-full px-4 py-3 bg-background rounded-xl border-0 neumorphic-inset focus:outline-none focus:ring-2 focus:ring-secondary transition-all"
                  placeholder="Town / Area"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label className="block text-sm font-semibold text-foreground mb-2">Next of Kin Name</label>
                <input
                  type="text"
                  value={form.nextOfKinName}
                  onChange={(e) => setForm({ ...form, nextOfKinName: e.target.value })}
                  className="w-full px-4 py-3 bg-background rounded-xl border-0 neumorphic-inset focus:outline-none focus:ring-2 focus:ring-secondary transition-all"
                  placeholder="Full name"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-foreground mb-2">Next of Kin Phone</label>
                <input
                  type="tel"
                  value={form.nextOfKinPhone}
                  onChange={(e) => setForm({ ...form, nextOfKinPhone: e.target.value })}
                  className="w-full px-4 py-3 bg-background rounded-xl border-0 neumorphic-inset focus:outline-none focus:ring-2 focus:ring-secondary transition-all"
                  placeholder="+254 7xx xxx xxx"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-foreground mb-2">Relationship</label>
                <input
                  type="text"
                  value={form.nextOfKinRelationship}
                  onChange={(e) => setForm({ ...form, nextOfKinRelationship: e.target.value })}
                  className="w-full px-4 py-3 bg-background rounded-xl border-0 neumorphic-inset focus:outline-none focus:ring-2 focus:ring-secondary transition-all"
                  placeholder="Sister / Brother / Spouse"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-foreground mb-2">Photo</label>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => setForm({ ...form, photo: e.target.files?.[0] || null })}
                className="w-full px-4 py-2 bg-background rounded-xl border-0 neumorphic-inset focus:outline-none"
                required
              />
            </div>

            <div className="flex gap-4 justify-end">
              <Button type="button" variant="outline" onClick={() => router.back()} className="px-8 py-3">
                Cancel
              </Button>
              <Button type="submit" disabled={submitting} className="px-8 py-3 bg-secondary text-white neumorphic neumorphic-hover border-0">
                {submitting ? "Creating..." : "Create Client"}
              </Button>
            </div>
          </form>
        </Card>
      </div>

      <AlertDialog
        open={showSuccess}
        onOpenChange={(open) => {
          if (!open) {
            setShowSuccess(false)
            router.push("/clients")
          }
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Client onboarded</AlertDialogTitle>
            <AlertDialogDescription>The client has been saved successfully.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction onClick={() => router.push("/clients")}>Close</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </DashboardLayout>
  )
}
