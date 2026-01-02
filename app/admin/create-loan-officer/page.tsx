"use client"

import { DashboardLayout } from "@/components/dashboard-layout"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Users } from "lucide-react"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { apiGet, apiPostJson, getCurrentUser } from "@/lib/api"
import { useToast } from "@/hooks/use-toast"

export default function CreateLoanOfficerPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [branches, setBranches] = useState<{ _id: string; name: string }[]>([])
  const [submitting, setSubmitting] = useState(false)
  const [blocked, setBlocked] = useState(false)
  const [form, setForm] = useState({
    name: "",
    nationalId: "",
    email: "",
    phone: "",
    branchId: "",
  })

  useEffect(() => {
    const user = getCurrentUser()
    // Only super_admin can create loan officers
    if (user?.role !== "super_admin") {
      setBlocked(true)
    }

    // Fetch branches
    ; (async () => {
      try {
        const branchesData = await apiGet<any>("/api/branches")
        setBranches(Array.isArray(branchesData) ? branchesData : branchesData?.data || [])
      } catch (e) {
        // optional
      }
    })()
  }, [])

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (blocked) {
      toast({ 
        title: "Access Denied", 
        description: "Only Super Admins can create loan officers.",
        variant: "destructive" 
      })
      return
    }

    if (!form.branchId) {
      toast({ 
        title: "Missing Branch", 
        description: "Branch assignment is required.",
        variant: "destructive" 
      })
      return
    }

    try {
      setSubmitting(true)
      const payload = {
        name: form.name,
        nationalId: form.nationalId,
        email: form.email,
        phone: form.phone,
        branchId: form.branchId,
      }
      
      const response = await apiPostJson("/api/loan-officers", payload)
      
      toast({ 
        title: "Success!", 
        description: `Loan Officer "${form.name}" has been created successfully. Username: ${form.nationalId}, Default password: 12345678`,
      })
      
      // Reset form for creating another loan officer
      setForm({
        name: "",
        nationalId: "",
        email: "",
        phone: "",
        branchId: "",
      })
      
      // Optional: Navigate to loan officers list after a short delay
      // setTimeout(() => router.push("/loan-officers"), 1500)
    } catch (e: any) {
      toast({ 
        title: "Error", 
        description: e?.message || "Failed to create loan officer",
        variant: "destructive"
      })
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
          <div className="flex items-center gap-3">
            <Users className="w-8 h-8 text-secondary" />
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Create Loan Officer</h1>
              <p className="text-xs sm:text-sm text-muted-foreground mt-1">Add a new Loan Officer to your team</p>
            </div>
          </div>
          {blocked && (
            <div className="mt-4 p-4 bg-destructive/10 border border-destructive/20 rounded-xl">
              <p className="text-sm text-destructive font-semibold">Access Denied</p>
              <p className="text-xs text-destructive/80 mt-1">You do not have permission to create loan officers.</p>
            </div>
          )}
        </div>

        <Card className="neumorphic p-4 sm:p-8 bg-card border-0">
          <form className="space-y-4 sm:space-y-6" onSubmit={onSubmit}>
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl">
              <p className="text-sm text-blue-900 font-semibold mb-1">Default Credentials</p>
              <p className="text-xs text-blue-700">
                Username will be the National ID. Default password: <span className="font-mono font-bold">12345678</span>
              </p>
              <p className="text-xs text-blue-600 mt-1">Officer should change password after first login.</p>
            </div>

            <div>
              <label className="block text-xs sm:text-sm font-semibold text-foreground mb-2">Full Name *</label>
              <input
                type="text"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="w-full px-3 sm:px-4 py-2 sm:py-3 bg-background rounded-xl border-0 neumorphic-inset focus:outline-none focus:ring-2 focus:ring-secondary transition-all text-sm"
                placeholder="Jane Doe"
                required
                disabled={blocked}
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
                  disabled={blocked}
                />
                <p className="text-xs text-muted-foreground mt-1">Will be used as username</p>
              </div>
              <div>
                <label className="block text-xs sm:text-sm font-semibold text-foreground mb-2">Phone *</label>
                <input
                  type="tel"
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  className="w-full px-3 sm:px-4 py-2 sm:py-3 bg-background rounded-xl border-0 neumorphic-inset focus:outline-none focus:ring-2 focus:ring-secondary transition-all text-sm"
                  placeholder="+254 700 000 000"
                  required
                  disabled={blocked}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-6">
              <div>
                <label className="block text-xs sm:text-sm font-semibold text-foreground mb-2">Email *</label>
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  className="w-full px-3 sm:px-4 py-2 sm:py-3 bg-background rounded-xl border-0 neumorphic-inset focus:outline-none focus:ring-2 focus:ring-secondary transition-all text-sm"
                  placeholder="jane@example.com"
                  required
                  disabled={blocked}
                />
              </div>
              <div>
                <label className="block text-xs sm:text-sm font-semibold text-foreground mb-2">Assigned Branch *</label>
                <select
                  value={form.branchId}
                  onChange={(e) => setForm({ ...form, branchId: e.target.value })}
                  className="w-full px-3 sm:px-4 py-2 sm:py-3 bg-background rounded-xl border-0 neumorphic-inset focus:outline-none focus:ring-2 focus:ring-secondary transition-all text-sm"
                  required
                  disabled={blocked}
                >
                  <option value="">Select branch</option>
                  {branches.map((b) => (
                    <option key={b._id} value={b._id}>
                      {b.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-end pt-2">
              <Button type="button" variant="outline" onClick={() => router.back()} className="px-6 sm:px-8 py-2 sm:py-3 text-sm sm:text-base">
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={submitting || blocked} 
                className="px-6 sm:px-8 py-2 sm:py-3 bg-secondary text-white neumorphic neumorphic-hover border-0 text-sm sm:text-base disabled:opacity-50"
              >
                {submitting ? "Creating..." : "Create Loan Officer"}
              </Button>
            </div>
          </form>
        </Card>
      </div>
    </DashboardLayout>
  )
}
