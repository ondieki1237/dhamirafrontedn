"use client"

import { DashboardLayout } from "@/components/dashboard-layout"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Shield } from "lucide-react"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { apiGet, apiPostJson, getCurrentUser } from "@/lib/api"
import { useToast } from "@/hooks/use-toast"

export default function CreateAdminPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [branches, setBranches] = useState<{ _id: string; name: string }[]>([])
  const [submitting, setSubmitting] = useState(false)
  const [blocked, setBlocked] = useState(false)
  const [form, setForm] = useState({
    name: "",
    username: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
    branchId: "",
    role: "initiator_admin", // Default to initiator_admin
  })

  useEffect(() => {
    const user = getCurrentUser()
    // Only super_admin can create admins
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
        description: "Only Super Admins can create admin users.",
        variant: "destructive" 
      })
      return
    }

    // Validate passwords match
    if (form.password !== form.confirmPassword) {
      toast({ 
        title: "Password Mismatch", 
        description: "Passwords do not match.",
        variant: "destructive" 
      })
      return
    }

    // Validate password strength
    if (form.password.length < 8) {
      toast({ 
        title: "Weak Password", 
        description: "Password must be at least 8 characters long.",
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
        username: form.username,
        email: form.email,
        phone: form.phone,
        password: form.password,
        branchId: form.branchId,
        role: form.role,
      }
      
      const result = await apiPostJson("/api/admins", payload)
      
      const roleLabel = form.role === "initiator_admin" ? "Initiator Admin" : "Approver Admin"
      toast({ 
        title: "Success!", 
        description: `${roleLabel} "${form.name}" has been created successfully.`,
      })
      
      // Reset form for creating another admin
      setForm({
        name: "",
        username: "",
        email: "",
        phone: "",
        password: "",
        confirmPassword: "",
        branchId: "",
        role: "initiator_admin",
      })
      
      // Optional: Navigate to admin list after a short delay
      // setTimeout(() => router.push("/admin/users"), 1500)
    } catch (e: any) {
      toast({ 
        title: "Error", 
        description: e?.message || "Failed to create admin user",
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
            <Shield className="w-8 h-8 text-primary" />
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Create Admin User</h1>
              <p className="text-xs sm:text-sm text-muted-foreground mt-1">Add a new Branch Controller (Admin)</p>
            </div>
          </div>
          {blocked && (
            <div className="mt-4 p-4 bg-destructive/10 border border-destructive/20 rounded-xl">
              <p className="text-sm text-destructive font-semibold">Access Denied</p>
              <p className="text-xs text-destructive/80 mt-1">You do not have permission to create admin users.</p>
            </div>
          )}
        </div>

        <Card className="neumorphic p-4 sm:p-8 bg-card border-0">
          <form className="space-y-4 sm:space-y-6" onSubmit={onSubmit}>
            <div>
              <label className="block text-xs sm:text-sm font-semibold text-foreground mb-2">Full Name *</label>
              <input
                type="text"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="w-full px-3 sm:px-4 py-2 sm:py-3 bg-background rounded-xl border-0 neumorphic-inset focus:outline-none focus:ring-2 focus:ring-primary transition-all text-sm"
                placeholder="John Doe"
                required
                disabled={blocked}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-6">
              <div>
                <label className="block text-xs sm:text-sm font-semibold text-foreground mb-2">Username *</label>
                <input
                  type="text"
                  value={form.username}
                  onChange={(e) => setForm({ ...form, username: e.target.value })}
                  className="w-full px-3 sm:px-4 py-2 sm:py-3 bg-background rounded-xl border-0 neumorphic-inset focus:outline-none focus:ring-2 focus:ring-primary transition-all text-sm"
                  placeholder="johndoe"
                  required
                  disabled={blocked}
                />
              </div>
              <div>
                <label className="block text-xs sm:text-sm font-semibold text-foreground mb-2">Email *</label>
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  className="w-full px-3 sm:px-4 py-2 sm:py-3 bg-background rounded-xl border-0 neumorphic-inset focus:outline-none focus:ring-2 focus:ring-primary transition-all text-sm"
                  placeholder="john@example.com"
                  required
                  disabled={blocked}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-6">
              <div>
                <label className="block text-xs sm:text-sm font-semibold text-foreground mb-2">Phone *</label>
                <input
                  type="tel"
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  className="w-full px-3 sm:px-4 py-2 sm:py-3 bg-background rounded-xl border-0 neumorphic-inset focus:outline-none focus:ring-2 focus:ring-primary transition-all text-sm"
                  placeholder="+254 700 000 000"
                  required
                  disabled={blocked}
                />
              </div>
              <div>
                <label className="block text-xs sm:text-sm font-semibold text-foreground mb-2">Branch *</label>
                <select
                  value={form.branchId}
                  onChange={(e) => setForm({ ...form, branchId: e.target.value })}
                  className="w-full px-3 sm:px-4 py-2 sm:py-3 bg-background rounded-xl border-0 neumorphic-inset focus:outline-none focus:ring-2 focus:ring-primary transition-all text-sm"
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

            <div>
              <label className="block text-xs sm:text-sm font-semibold text-foreground mb-2">Admin Role *</label>
              <select
                value={form.role}
                onChange={(e) => setForm({ ...form, role: e.target.value })}
                className="w-full px-3 sm:px-4 py-2 sm:py-3 bg-background rounded-xl border-0 neumorphic-inset focus:outline-none focus:ring-2 focus:ring-primary transition-all text-sm"
                required
                disabled={blocked}
              >
                <option value="initiator_admin">Initiator Admin (Maker)</option>
                <option value="approver_admin">Approver Admin (Checker)</option>
              </select>
              <p className="text-xs text-muted-foreground mt-1">
                {form.role === "initiator_admin" 
                  ? "Can create and submit items for approval" 
                  : "Can approve and authorize transactions"}
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-6">
              <div>
                <label className="block text-xs sm:text-sm font-semibold text-foreground mb-2">Password *</label>
                <input
                  type="password"
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  className="w-full px-3 sm:px-4 py-2 sm:py-3 bg-background rounded-xl border-0 neumorphic-inset focus:outline-none focus:ring-2 focus:ring-primary transition-all text-sm"
                  placeholder="Min. 8 characters"
                  required
                  disabled={blocked}
                  minLength={8}
                />
              </div>
              <div>
                <label className="block text-xs sm:text-sm font-semibold text-foreground mb-2">Confirm Password *</label>
                <input
                  type="password"
                  value={form.confirmPassword}
                  onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })}
                  className="w-full px-3 sm:px-4 py-2 sm:py-3 bg-background rounded-xl border-0 neumorphic-inset focus:outline-none focus:ring-2 focus:ring-primary transition-all text-sm"
                  placeholder="Re-enter password"
                  required
                  disabled={blocked}
                  minLength={8}
                />
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-end pt-2">
              <Button type="button" variant="outline" onClick={() => router.back()} className="px-6 sm:px-8 py-2 sm:py-3 text-sm sm:text-base">
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={submitting || blocked} 
                className="px-6 sm:px-8 py-2 sm:py-3 bg-primary text-white neumorphic neumorphic-hover border-0 text-sm sm:text-base disabled:opacity-50"
              >
                {submitting ? "Creating..." : "Create Admin"}
              </Button>
            </div>
          </form>
        </Card>
      </div>
    </DashboardLayout>
  )
}
