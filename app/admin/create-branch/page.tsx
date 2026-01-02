"use client"

import { DashboardLayout } from "@/components/dashboard-layout"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ArrowLeft, MapPin } from "lucide-react"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { apiPostJson, getCurrentUser } from "@/lib/api"
import { useToast } from "@/hooks/use-toast"

export default function CreateBranchPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [submitting, setSubmitting] = useState(false)
  const [blocked, setBlocked] = useState(false)
  const [form, setForm] = useState({
    name: "",
    code: "",
    location: "",
    address: "",
    phone: "",
    email: "",
  })

  useEffect(() => {
    const user = getCurrentUser()
    // Only super_admin can create branches
    if (user?.role !== "super_admin") {
      setBlocked(true)
    }
  }, [])

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (blocked) {
      toast({ 
        title: "Access Denied", 
        description: "Only Super Admins can create branches.",
        variant: "destructive" 
      })
      return
    }

    try {
      setSubmitting(true)
      const payload = {
        name: form.name,
        code: form.code,
        location: form.location,
        address: form.address,
        phone: form.phone,
        email: form.email,
      }
      
      const result = await apiPostJson("/api/branches", payload)
      
      toast({ 
        title: "Success!", 
        description: `Branch "${form.name}" (${form.code}) has been created successfully.`,
      })
      
      // Reset form for creating another branch
      setForm({
        name: "",
        code: "",
        location: "",
        address: "",
        phone: "",
        email: "",
      })
      
      // Optional: Navigate to branches list after a short delay
      // setTimeout(() => router.push("/admin/branches"), 1500)
    } catch (e: any) {
      toast({ 
        title: "Error", 
        description: e?.message || "Failed to create branch",
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
            <MapPin className="w-8 h-8 text-primary" />
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Create Branch</h1>
              <p className="text-xs sm:text-sm text-muted-foreground mt-1">Add a new physical location/region</p>
            </div>
          </div>
          {blocked && (
            <div className="mt-4 p-4 bg-destructive/10 border border-destructive/20 rounded-xl">
              <p className="text-sm text-destructive font-semibold">Access Denied</p>
              <p className="text-xs text-destructive/80 mt-1">You do not have permission to create branches.</p>
            </div>
          )}
        </div>

        <Card className="neumorphic p-4 sm:p-8 bg-card border-0">
          <form className="space-y-4 sm:space-y-6" onSubmit={onSubmit}>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-6">
              <div>
                <label className="block text-xs sm:text-sm font-semibold text-foreground mb-2">Branch Name *</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full px-3 sm:px-4 py-2 sm:py-3 bg-background rounded-xl border-0 neumorphic-inset focus:outline-none focus:ring-2 focus:ring-primary transition-all text-sm"
                  placeholder="Nairobi Central Branch"
                  required
                  disabled={blocked}
                />
              </div>
              <div>
                <label className="block text-xs sm:text-sm font-semibold text-foreground mb-2">Branch Code *</label>
                <input
                  type="text"
                  value={form.code}
                  onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })}
                  className="w-full px-3 sm:px-4 py-2 sm:py-3 bg-background rounded-xl border-0 neumorphic-inset focus:outline-none focus:ring-2 focus:ring-primary transition-all text-sm font-mono"
                  placeholder="NRB01"
                  required
                  disabled={blocked}
                />
                <p className="text-xs text-muted-foreground mt-1">Unique branch identifier</p>
              </div>
            </div>

            <div>
              <label className="block text-xs sm:text-sm font-semibold text-foreground mb-2">Location/Region *</label>
              <input
                type="text"
                value={form.location}
                onChange={(e) => setForm({ ...form, location: e.target.value })}
                className="w-full px-3 sm:px-4 py-2 sm:py-3 bg-background rounded-xl border-0 neumorphic-inset focus:outline-none focus:ring-2 focus:ring-primary transition-all text-sm"
                placeholder="Nairobi, Kenya"
                required
                disabled={blocked}
              />
            </div>

            <div>
              <label className="block text-xs sm:text-sm font-semibold text-foreground mb-2">Physical Address *</label>
              <textarea
                rows={3}
                value={form.address}
                onChange={(e) => setForm({ ...form, address: e.target.value })}
                className="w-full px-3 sm:px-4 py-2 sm:py-3 bg-background rounded-xl border-0 neumorphic-inset focus:outline-none focus:ring-2 focus:ring-primary transition-all text-sm"
                placeholder="Building, Street, Area..."
                required
                disabled={blocked}
              />
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
                <label className="block text-xs sm:text-sm font-semibold text-foreground mb-2">Email *</label>
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  className="w-full px-3 sm:px-4 py-2 sm:py-3 bg-background rounded-xl border-0 neumorphic-inset focus:outline-none focus:ring-2 focus:ring-primary transition-all text-sm"
                  placeholder="branch@example.com"
                  required
                  disabled={blocked}
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
                {submitting ? "Creating..." : "Create Branch"}
              </Button>
            </div>
          </form>
        </Card>
      </div>
    </DashboardLayout>
  )
}
