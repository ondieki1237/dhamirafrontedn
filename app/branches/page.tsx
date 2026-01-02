"use client"

import { DashboardLayout } from "@/components/dashboard-layout"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { MapPin, Plus, Edit, Trash2 } from "lucide-react"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { apiGet, apiPostJson, getCurrentUser } from "@/lib/api"
import { useToast } from "@/hooks/use-toast"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

type Branch = {
  _id: string
  name: string
  code: string
  location?: string
  address?: string
  phone?: string
  email?: string
  createdAt?: string
}

export default function BranchesPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [branches, setBranches] = useState<Branch[]>([])
  const [loading, setLoading] = useState(true)
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
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
    // Only super_admin can access branches
    if (user?.role !== "super_admin") {
      setBlocked(true)
      toast({ 
        title: "Access Denied", 
        description: "Only Super Admins can manage branches.",
        variant: "destructive" 
      })
      router.push("/dashboard")
      return
    }
    fetchBranches()
  }, [])

  const fetchBranches = async () => {
    try {
      setLoading(true)
      const raw = await apiGet<any>("/api/branches")
      const data = Array.isArray(raw) ? raw : (raw?.data || raw?.branches || [])
      setBranches(data)
    } catch (e: any) {
      toast({ 
        title: "Error", 
        description: e?.message || "Failed to load branches",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

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
      
      await apiPostJson("/api/branches", payload)
      
      toast({ 
        title: "Success!", 
        description: `Branch "${form.name}" (${form.code}) has been created successfully.`,
      })
      
      // Reset form
      setForm({
        name: "",
        code: "",
        location: "",
        address: "",
        phone: "",
        email: "",
      })
      
      // Close dialog and refresh list
      setIsCreateDialogOpen(false)
      fetchBranches()
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

  if (blocked) {
    return null
  }

  return (
    <DashboardLayout>
      <div className="max-w-7xl mx-auto">
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <MapPin className="w-8 h-8 text-primary" />
            <div>
              <h1 className="text-3xl font-bold text-foreground">Branches</h1>
              <p className="text-sm text-muted-foreground mt-1">Manage all branch locations</p>
            </div>
          </div>
          <Button 
            onClick={() => setIsCreateDialogOpen(true)}
            className="gap-2 neumorphic neumorphic-hover"
          >
            <Plus className="w-4 h-4" />
            Create Branch
          </Button>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground animate-pulse">Loading branches...</p>
          </div>
        ) : branches.length === 0 ? (
          <Card className="neumorphic p-12 bg-card border-0 text-center">
            <MapPin className="w-16 h-16 text-muted-foreground mx-auto mb-4 opacity-50" />
            <h3 className="text-xl font-semibold text-foreground mb-2">No Branches Yet</h3>
            <p className="text-muted-foreground mb-6">Create your first branch to get started</p>
            <Button 
              onClick={() => setIsCreateDialogOpen(true)}
              className="gap-2"
            >
              <Plus className="w-4 h-4" />
              Create First Branch
            </Button>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {branches.map((branch) => (
              <Card key={branch._id} className="neumorphic p-6 bg-card border-0 hover:shadow-lg transition-shadow">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                      <MapPin className="w-6 h-6 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-bold text-foreground">{branch.name}</h3>
                      <Badge variant="outline" className="mt-1 font-mono text-xs">
                        {branch.code}
                      </Badge>
                    </div>
                  </div>
                </div>
                
                <div className="space-y-2 text-sm">
                  {branch.location && (
                    <div className="flex items-start gap-2">
                      <MapPin className="w-4 h-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                      <span className="text-muted-foreground">{branch.location}</span>
                    </div>
                  )}
                  {branch.address && (
                    <p className="text-muted-foreground text-xs">{branch.address}</p>
                  )}
                  {branch.phone && (
                    <p className="text-muted-foreground text-xs">📞 {branch.phone}</p>
                  )}
                  {branch.email && (
                    <p className="text-muted-foreground text-xs">✉️ {branch.email}</p>
                  )}
                </div>

                <div className="mt-4 pt-4 border-t border-border flex gap-2">
                  <Button 
                    variant="ghost" 
                    size="sm"
                    className="flex-1 gap-2 hover:bg-primary/10"
                  >
                    <Edit className="w-4 h-4" />
                    Edit
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Create Branch Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-2xl">
              <MapPin className="w-6 h-6 text-primary" />
              Create New Branch
            </DialogTitle>
          </DialogHeader>

          <form className="space-y-6 mt-4" onSubmit={onSubmit}>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-semibold text-foreground mb-2">Branch Name *</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full px-4 py-3 bg-background rounded-xl border-0 neumorphic-inset focus:outline-none focus:ring-2 focus:ring-primary transition-all"
                  placeholder="Nairobi Central Branch"
                  required
                  disabled={submitting}
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-foreground mb-2">Branch Code *</label>
                <input
                  type="text"
                  value={form.code}
                  onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })}
                  className="w-full px-4 py-3 bg-background rounded-xl border-0 neumorphic-inset focus:outline-none focus:ring-2 focus:ring-primary transition-all font-mono"
                  placeholder="NRB01"
                  required
                  disabled={submitting}
                />
                <p className="text-xs text-muted-foreground mt-1">Unique branch identifier</p>
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-foreground mb-2">Location/Region *</label>
              <input
                type="text"
                value={form.location}
                onChange={(e) => setForm({ ...form, location: e.target.value })}
                className="w-full px-4 py-3 bg-background rounded-xl border-0 neumorphic-inset focus:outline-none focus:ring-2 focus:ring-primary transition-all"
                placeholder="Nairobi, Kenya"
                required
                disabled={submitting}
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-foreground mb-2">Full Address</label>
              <textarea
                value={form.address}
                onChange={(e) => setForm({ ...form, address: e.target.value })}
                className="w-full px-4 py-3 bg-background rounded-xl border-0 neumorphic-inset focus:outline-none focus:ring-2 focus:ring-primary transition-all resize-none"
                placeholder="123 Main Street, Building Name, Floor 2"
                rows={3}
                disabled={submitting}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-semibold text-foreground mb-2">Phone Number</label>
                <input
                  type="tel"
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  className="w-full px-4 py-3 bg-background rounded-xl border-0 neumorphic-inset focus:outline-none focus:ring-2 focus:ring-primary transition-all"
                  placeholder="+254 700 000 000"
                  disabled={submitting}
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-foreground mb-2">Email</label>
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  className="w-full px-4 py-3 bg-background rounded-xl border-0 neumorphic-inset focus:outline-none focus:ring-2 focus:ring-primary transition-all"
                  placeholder="branch@example.com"
                  disabled={submitting}
                />
              </div>
            </div>

            <div className="flex gap-4 justify-end pt-4">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => setIsCreateDialogOpen(false)} 
                disabled={submitting}
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={submitting}
                className="gap-2 bg-primary text-white neumorphic neumorphic-hover border-0"
              >
                <Plus className="w-4 h-4" />
                {submitting ? "Creating..." : "Create Branch"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  )
}
