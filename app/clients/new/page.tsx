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
  const [groups, setGroups] = useState<{ _id: string; name: string; branchId?: string }[]>([])
  const [branches, setBranches] = useState<{ _id: string; name: string }[]>([])
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
    branchId: "",
    groupId: "",
    photo: null as File | null,
  })
  const [blocked, setBlocked] = useState(false)

  useEffect(() => {
    let mounted = true
      ; (async () => {
        try {
          // Fetch branches
          const branchesData = await apiGet<{ _id: string; name: string }[]>("/api/branches")
          if (mounted) setBranches(Array.isArray(branchesData) ? branchesData : branchesData?.data || [])

          // Fetch groups
          const groupsData = await apiGet<{ _id: string; name: string; branchId?: string }[]>("/api/groups")
          if (mounted) setGroups(Array.isArray(groupsData) ? groupsData : groupsData?.data || [])
        } catch (e) {
          // optional; can remain empty
        }
      })()

    const user = getCurrentUser()
    if (!user?.role || !["super_admin", "loan_officer"].includes(user.role)) {
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

      // Validate mandatory fields
      if (!form.branchId) {
        toast({ title: "Missing Information", description: "Branch is required. Please select a branch.", variant: "destructive" })
        return
      }
      if (!form.groupId) {
        toast({ title: "Missing Information", description: "Group is required. Please select a group.", variant: "destructive" })
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
      <div className="max-w-4xl mx-auto px-4 sm:px-0">
        <div className="mb-4 sm:mb-6">
          <Button variant="ghost" onClick={() => router.back()} className="mb-3 sm:mb-4 gap-2 h-8 sm:h-10">
            <ArrowLeft className="w-4 h-4" />
            Back
          </Button>
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground">New Client</h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1">Add a new client to the system</p>
          {blocked && <p className="text-xs text-destructive mt-2">You do not have permission to onboard clients.</p>}
        </div>

        <Card className="neumorphic p-4 sm:p-8 bg-card border-0">
          <form className="space-y-4 sm:space-y-6" onSubmit={onSubmit}>
            <div>
              <label className="block text-xs sm:text-sm font-semibold text-foreground mb-2">Full Name *</label>
              <input
                type="text"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="w-full px-3 sm:px-4 py-2 sm:py-3 bg-background rounded-xl border-0 neumorphic-inset focus:outline-none focus:ring-2 focus:ring-secondary transition-all text-sm"
                placeholder="Enter full name"
                required
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-6">
              <div>
                <label className="block text-xs sm:text-sm font-semibold text-foreground mb-2">National ID *</label>
                <input
                  type="text"
                  value={form.nationalId}
                  onChange={(e) => setForm({ ...form, nationalId: e.target.value })}
                  className="w-full px-3 sm:px-4 py-2 sm:py-3 bg-background rounded-xl border-0 neumorphic-inset focus:outline-none focus:ring-2 focus:ring-secondary transition-all text-sm"
                  placeholder="12345678"
                  required
                />
              </div>
              <div>
                <label className="block text-xs sm:text-sm font-semibold text-foreground mb-2">Phone Number *</label>
                <input
                  type="tel"
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  className="w-full px-3 sm:px-4 py-2 sm:py-3 bg-background rounded-xl border-0 neumorphic-inset focus:outline-none focus:ring-2 focus:ring-secondary transition-all text-sm"
                  placeholder="+254 700 000 000"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-6">
              <div>
                <label className="block text-xs sm:text-sm font-semibold text-foreground mb-2">Branch *</label>
                <select
                  value={form.branchId}
                  onChange={(e) => {
                    setForm({ ...form, branchId: e.target.value, groupId: "" })
                  }}
                  className="w-full px-3 sm:px-4 py-2 sm:py-3 bg-background rounded-xl border-0 neumorphic-inset focus:outline-none focus:ring-2 focus:ring-secondary transition-all text-sm"
                  required
                >
                  <option value="">Select branch (required)</option>
                  {branches.map((b) => (
                    <option key={b._id} value={b._id}>
                      {b.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs sm:text-sm font-semibold text-foreground mb-2">Group *</label>
                <select
                  value={form.groupId}
                  onChange={(e) => setForm({ ...form, groupId: e.target.value })}
                  className="w-full px-3 sm:px-4 py-2 sm:py-3 bg-background rounded-xl border-0 neumorphic-inset focus:outline-none focus:ring-2 focus:ring-secondary transition-all text-sm"
                  required
                  disabled={!form.branchId}
                >
                  <option value="">Select group (required)</option>
                  {groups
                    .filter(g => !form.branchId || g.branchId === form.branchId)
                    .map((g) => (
                    <option key={g._id} value={g._id}>
                      {g.name}
                    </option>
                  ))}
                </select>
                {!form.branchId && <p className="text-xs text-muted-foreground mt-1">Select a branch first</p>}
              </div>
              <div>
                <label className="block text-xs sm:text-sm font-semibold text-foreground mb-2">Residence *</label>
                <select
                  value={form.residence}
                  onChange={(e) => setForm({ ...form, residence: e.target.value })}
                  className="w-full px-3 sm:px-4 py-2 sm:py-3 bg-background rounded-xl border-0 neumorphic-inset focus:outline-none focus:ring-2 focus:ring-secondary transition-all text-sm"
                >
                  <option value="owned">Owned</option>
                  <option value="rented">Rented</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-6">
              <div>
                <label className="block text-xs sm:text-sm font-semibold text-foreground mb-2">Business Type</label>
                <input
                  type="text"
                  value={form.businessType}
                  onChange={(e) => setForm({ ...form, businessType: e.target.value })}
                  className="w-full px-3 sm:px-4 py-2 sm:py-3 bg-background rounded-xl border-0 neumorphic-inset focus:outline-none focus:ring-2 focus:ring-secondary transition-all text-sm"
                  placeholder="Retail / Agriculture / Services"
                  required
                />
              </div>
              <div>
                <label className="block text-xs sm:text-sm font-semibold text-foreground mb-2">Business Location</label>
                <input
                  type="text"
                  value={form.businessLocation}
                  onChange={(e) => setForm({ ...form, businessLocation: e.target.value })}
                  className="w-full px-3 sm:px-4 py-2 sm:py-3 bg-background rounded-xl border-0 neumorphic-inset focus:outline-none focus:ring-2 focus:ring-secondary transition-all text-sm"
                  placeholder="Town / Area"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-6">
              <div>
                <label className="block text-xs sm:text-sm font-semibold text-foreground mb-2">Next of Kin Name</label>
                <input
                  type="text"
                  value={form.nextOfKinName}
                  onChange={(e) => setForm({ ...form, nextOfKinName: e.target.value })}
                  className="w-full px-3 sm:px-4 py-2 sm:py-3 bg-background rounded-xl border-0 neumorphic-inset focus:outline-none focus:ring-2 focus:ring-secondary transition-all text-sm"
                  placeholder="Full name"
                  required
                />
              </div>
              <div>
                <label className="block text-xs sm:text-sm font-semibold text-foreground mb-2">Next of Kin Phone</label>
                <input
                  type="tel"
                  value={form.nextOfKinPhone}
                  onChange={(e) => setForm({ ...form, nextOfKinPhone: e.target.value })}
                  className="w-full px-3 sm:px-4 py-2 sm:py-3 bg-background rounded-xl border-0 neumorphic-inset focus:outline-none focus:ring-2 focus:ring-secondary transition-all text-sm"
                  placeholder="+254 7xx xxx xxx"
                  required
                />
              </div>
              <div>
                <label className="block text-xs sm:text-sm font-semibold text-foreground mb-2">Relationship</label>
                <input
                  type="text"
                  value={form.nextOfKinRelationship}
                  onChange={(e) => setForm({ ...form, nextOfKinRelationship: e.target.value })}
                  className="w-full px-3 sm:px-4 py-2 sm:py-3 bg-background rounded-xl border-0 neumorphic-inset focus:outline-none focus:ring-2 focus:ring-secondary transition-all text-sm"
                  placeholder="Sister / Brother / Spouse"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs sm:text-sm font-semibold text-foreground mb-2">Photo</label>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => setForm({ ...form, photo: e.target.files?.[0] || null })}
                className="w-full px-3 sm:px-4 py-2 bg-background rounded-xl border-0 neumorphic-inset focus:outline-none text-sm"
                required
              />
            </div>

            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-end pt-2">
              <Button type="button" variant="outline" onClick={() => router.back()} className="px-6 sm:px-8 py-2 sm:py-3 text-sm sm:text-base">
                Cancel
              </Button>
              <Button type="submit" disabled={submitting} className="px-6 sm:px-8 py-2 sm:py-3 bg-secondary text-white neumorphic neumorphic-hover border-0 text-sm sm:text-base">
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
