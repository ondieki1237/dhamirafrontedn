"use client"

import { DashboardLayout } from "@/components/dashboard-layout"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Shield, Plus, Search, Edit, Trash2, Eye } from "lucide-react"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { apiGet, apiDelete, getCurrentUser } from "@/lib/api"
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
  isActive?: boolean
}

export default function AdminUsersPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [admins, setAdmins] = useState<Admin[]>([])
  const [filteredAdmins, setFilteredAdmins] = useState<Admin[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedRole, setSelectedRole] = useState<string>("all")
  const [blocked, setBlocked] = useState(false)

  useEffect(() => {
    const user = getCurrentUser()
    // Only super_admin can view admin users
    if (user?.role !== "super_admin") {
      setBlocked(true)
    }
    fetchAdmins()
  }, [])

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

  const fetchAdmins = async () => {
    try {
      setLoading(true)
      const raw = await apiGet<any>("/api/admins")
      const data = Array.isArray(raw) ? raw : (raw?.data || raw?.admins || [])
      setAdmins(data)
      setFilteredAdmins(data)
    } catch (e: any) {
      toast({
        title: "Error",
        description: e?.message || "Failed to load admin users",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
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
      fetchAdmins()
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
            <p className="text-muted-foreground">You do not have permission to view admin users.</p>
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
                <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Admin Users</h1>
                <p className="text-sm text-muted-foreground mt-1">
                  Manage admin users and their permissions
                </p>
              </div>
            </div>
            <Button 
              onClick={() => router.push("/admin/create-admin")}
              className="gap-2 bg-primary text-white neumorphic neumorphic-hover"
            >
              <Plus className="w-4 h-4" />
              Create Admin
            </Button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
          <Card className="p-4 neumorphic">
            <p className="text-sm text-muted-foreground">Total Admins</p>
            <p className="text-2xl font-bold text-foreground mt-1">{admins.length}</p>
          </Card>
          <Card className="p-4 neumorphic">
            <p className="text-sm text-muted-foreground">Initiator Admins</p>
            <p className="text-2xl font-bold text-foreground mt-1">
              {admins.filter(a => a.role === "initiator_admin").length}
            </p>
          </Card>
          <Card className="p-4 neumorphic">
            <p className="text-sm text-muted-foreground">Approver Admins</p>
            <p className="text-2xl font-bold text-foreground mt-1">
              {admins.filter(a => a.role === "approver_admin").length}
            </p>
          </Card>
        </div>

        {/* Filters */}
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

        {/* Table */}
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
              <p className="text-sm text-muted-foreground mt-2">
                {searchQuery || selectedRole !== "all" 
                  ? "Try adjusting your filters" 
                  : "Create your first admin user to get started"}
              </p>
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
                        <div className="flex items-center gap-2">
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-8 w-8 p-0"
                            onClick={() => router.push(`/admin/users/${admin._id}`)}
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-8 w-8 p-0"
                            onClick={() => router.push(`/admin/users/${admin._id}/edit`)}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          {admin.role !== "super_admin" && (
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-8 w-8 p-0 text-destructive hover:text-destructive hover:bg-destructive/10"
                              onClick={() => handleDelete(admin._id, admin.name)}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      </div>
    </DashboardLayout>
  )
}
