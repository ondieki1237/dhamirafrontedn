"use client"

import { DashboardLayout } from "@/components/dashboard-layout"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Plus, Shield, Users, Edit, Trash2, Eye, Search } from "lucide-react"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { apiGet, apiPostJson, apiDelete, getCurrentUser } from "@/lib/api"
import { useToast } from "@/hooks/use-toast"

interface Admin {
  _id: string
  name: string
  username: string
  idNumber?: string
  email: string
  phone: string
  role: string
  branchId: {
    _id: string
    name: string
  } | string
  createdAt: string
}

export default function ManageAdminsPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [branches, setBranches] = useState<{ _id: string; name: string }[]>([])
  const [admins, setAdmins] = useState<Admin[]>([])
  const [filteredAdmins, setFilteredAdmins] = useState<Admin[]>([])
  const [submitting, setSubmitting] = useState(false)
  const [loading, setLoading] = useState(true)
  const [blocked, setBlocked] = useState(false)
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedRole, setSelectedRole] = useState<string>("all")
  const [form, setForm] = useState({
    name: "",
    idNumber: "",
    email: "",
    phone: "",
    branchId: "",
    role: "initiator_admin", // Default to initiator_admin
  })

  useEffect(() => {
    const user = getCurrentUser()
    // Only super_admin can create admins
    if (user?.role !== "super_admin") {
      setBlocked(true)
    }

    fetchData()
  }, [toast])

  useEffect(() => {
    // Filter admins based on search and role
    let filtered = admins

    if (searchQuery) {
      filtered = filtered.filter(admin => 
        admin.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        admin.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        admin.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (admin.idNumber && admin.idNumber.includes(searchQuery))
      )
    }

    if (selectedRole !== "all") {
      filtered = filtered.filter(admin => admin.role === selectedRole)
    }

    setFilteredAdmins(filtered)
  }, [searchQuery, selectedRole, admins])

  const fetchData = async () => {
    try {
      setLoading(true)
      // Fetch branches
      const branchesRaw = await apiGet<any>("/api/branches")
      console.log("Branches API response:", branchesRaw)
      const branchesData = Array.isArray(branchesRaw) ? branchesRaw : (branchesRaw?.data || branchesRaw?.branches || [])
      console.log("Processed branches:", branchesData)
      setBranches(branchesData)

      // Fetch admins
      const adminsRaw = await apiGet<any>("/api/admins")
      const adminsData = Array.isArray(adminsRaw) ? adminsRaw : (adminsRaw?.data || adminsRaw?.admins || [])
      setAdmins(adminsData)
      setFilteredAdmins(adminsData)
    } catch (e: any) {
      console.error("Failed to fetch data:", e)
      toast({
        title: "Warning",
        description: e?.message || "Failed to load data. Please refresh the page.",
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
        description: "Only Super Admins can create admin users.",
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
        username: form.idNumber, // Use ID number as username
        idNumber: form.idNumber,
        email: form.email,
        phone: form.phone,
        password: "12345678", // Auto-generated default password
        branchId: form.branchId,
        role: form.role,
      }
      
      const result = await apiPostJson("/api/admins", payload)
      
      const roleLabel = form.role === "initiator_admin" ? "Initiator Admin" : "Approver Admin"
      toast({ 
        title: "Success!", 
        description: `${roleLabel} "${form.name}" has been created successfully. Default password: 12345678`,
      })
      
      // Reset form for creating another admin
      setForm({
        name: "",
        idNumber: "",
        email: "",
        phone: "",
        branchId: "",
        role: "initiator_admin",
      })
      
      // Hide form and refresh admin list
      setShowCreateForm(false)
      fetchData()
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
const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete admin "${name}"?`)) {
      return
    }

    try {
      await apiDelete(`/api/admins/${id}`)
      toast({
        title: "Success",
        description: `Admin "${name}" has been deleted.`
      })
      fetchData()
    } catch (e: any) {
      toast({
        title: "Error",
        description: e?.message || "Failed to delete admin user",
        variant: "destructive"
      })
    }
  }

  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case "super_admin":
        return "default"
      case "initiator_admin":
        return "secondary"
      case "approver_admin":
        return "outline"
      default:
        return "secondary"
    }
  }

  const getRoleLabel = (role: string) => {
    switch (role) {
      case "super_admin":
        return "Super Admin"
      case "initiator_admin":
        return "Initiator Admin"
      case "approver_admin":
        return "Approver Admin"
      default:
        return role
    }
  }

  const getBranchName = (branchId: any) => {
    if (typeof branchId === "string") return branchId
    return branchId?.name || "N/A"
  }

  if (blocked) {
    return (
      <DashboardLayout>
        <div className="max-w-4xl mx-auto px-4 py-8">
          <Card className="p-8 text-center bg-destructive/10 border-destructive/20">
            <Shield className="w-16 h-16 mx-auto mb-4 text-destructive" />
            <h1 className="text-2xl font-bold text-destructive mb-2">Access Denied</h1>
            <p className="text-muted-foreground">You do not have permission to manage admin users.</p>
          </Card>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Header */}
        <div className="mb-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-3">
              <Shield className="w-8 h-8 text-primary" />
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Manage Admins</h1>
                <p className="text-sm text-muted-foreground mt-1">
                  Create and manage admin users
                </p>
              </div>
            </div>
            <Button 
              onClick={() => setShowCreateForm(!showCreateForm)}
              className="gap-2 bg-primary text-white neumorphic neumorphic-hover"
            >
              {showCreateForm ? (
                <>
                  <Users className="w-4 h-4" />
                  View Admins
                </>
              ) : (
                <>
                  <Plus className="w-4 h-4" />
                  Create Admin
                </>
              )}
            </Button>
          </div>
        </div>

        {showCreateForm ? (
          /* Create Admin Form */
  
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
              <div>
                <label className="block text-xs sm:text-sm font-semibold text-foreground mb-2">Phone Number *</label>
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
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-6">
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
              <div>
                <label className="block text-xs sm:text-sm font-semibold text-foreground mb-2">ID Number *</label>
                <input
                  type="text"
                  value={form.idNumber}
                  onChange={(e) => setForm({ ...form, idNumber: e.target.value })}
                  className="w-full px-3 sm:px-4 py-2 sm:py-3 bg-background rounded-xl border-0 neumorphic-inset focus:outline-none focus:ring-2 focus:ring-primary transition-all text-sm"
                  placeholder="12345678"
                  required
                  disabled={blocked}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  This will be used as the login username
                </p>
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

            <div className="p-4 bg-muted/50 rounded-xl border border-border">
              <p className="text-xs sm:text-sm font-semibold text-foreground mb-1">Default Login Credentials</p>
              <p className="text-xs text-muted-foreground">Username: <span className="font-mono font-semibold text-foreground">ID Number</span></p>
              <p className="text-xs text-muted-foreground">Password: <span className="font-mono font-semibold text-foreground">12345678</span></p>
              <p className="text-xs text-amber-600 dark:text-amber-500 mt-2">⚠️ Admin should change password after first login</p>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-end pt-2">
              <Button type="button" variant="outline" onClick={() => setShowCreateForm(false)} className="px-6 sm:px-8 py-2 sm:py-3 text-sm sm:text-base">
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
        ) : (
          <>
            <Card className="p-4 mb-6 neumorphic">
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <input
                    type="text"
                    placeholder="Search by name, email, username, or ID..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 bg-background rounded-xl border-0 neumorphic-inset focus:outline-none focus:ring-2 focus:ring-primary transition-all text-sm"
                  />
                </div>
                <select
                  value={selectedRole}
                  onChange={(e) => setSelectedRole(e.target.value)}
                  className="px-4 py-2 bg-background rounded-xl border-0 neumorphic-inset focus:outline-none focus:ring-2 focus:ring-primary transition-all text-sm"
                >
                  <option value="all">All Roles</option>
                  <option value="super_admin">Super Admin</option>
                  <option value="initiator_admin">Initiator Admin</option>
                  <option value="approver_admin">Approver Admin</option>
                </select>
              </div>
            </Card>

            <Card className="neumorphic overflow-hidden">
              {loading ? (
                <div className="p-12 text-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
                  <p className="text-muted-foreground">Loading admin users...</p>
                </div>
              ) : filteredAdmins.length === 0 ? (
                <div className="p-12 text-center">
                  <Shield className="w-16 h-16 mx-auto mb-4 text-muted-foreground opacity-50" />
                  <p className="text-lg font-semibold text-foreground">No admin users found</p>
                  <p className="text-sm text-muted-foreground mt-2 mb-4">
                    {searchQuery || selectedRole !== "all" 
                      ? "Try adjusting your filters" 
                      : "Create your first admin user to get started"}
                  </p>
                  {!searchQuery && selectedRole === "all" && (
                    <Button 
                      onClick={() => setShowCreateForm(true)}
                      className="gap-2 bg-primary text-white"
                    >
                      <Plus className="w-4 h-4" />
                      Create First Admin
                    </Button>
                  )}
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-muted/50 border-b border-border">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                          Name
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                          ID Number
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                          Email
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                          Phone
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                          Branch
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                          Role
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {filteredAdmins.map((admin) => (
                        <tr key={admin._id} className="hover:bg-muted/30 transition-colors">
                          <td className="px-4 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <div>
                                <p className="text-sm font-semibold text-foreground">{admin.name}</p>
                                <p className="text-xs text-muted-foreground">{admin.username}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap">
                            <p className="text-sm text-foreground font-mono">
                              {admin.idNumber || admin.username}
                            </p>
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap">
                            <p className="text-sm text-foreground">{admin.email}</p>
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap">
                            <p className="text-sm text-foreground">{admin.phone}</p>
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap">
                            <p className="text-sm text-foreground">{getBranchName(admin.branchId)}</p>
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap">
                            <Badge variant={getRoleBadgeVariant(admin.role)}>
                              {getRoleLabel(admin.role)}
                            </Badge>
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap">
                            {admin.role !== "super_admin" && (
                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-8 w-8 p-0 text-destructive hover:text-destructive hover:bg-destructive/10"
                                onClick={() => handleDelete(admin._id, admin.name)}
                                title="Delete admin"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </Card>
          </>
        )}
      </div>
    </DashboardLayout>
  )
}
