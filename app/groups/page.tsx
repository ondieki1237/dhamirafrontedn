"use client"

import { useEffect, useState } from "react"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Plus, Users, TrendingUp, Edit } from "lucide-react"
import { useRouter } from "next/navigation"
import { apiGet, apiPutJson, getCurrentUser } from "@/lib/api"
import { useToast } from "@/hooks/use-toast"
import { EditGroupDialog } from "@/components/edit-group-dialog"

type GroupItem = {
  _id: string
  name: string
  status?: "legacy" | "provisional" | "active" | "pending" | "suspended"
  meetingDay?: string
  meetingTime?: string
  branchId?: string | { _id: string; name?: string; code?: string }
  loanOfficer?: string | { _id: string; name?: string }
  chairperson?: string | { _id: string; name?: string; nationalId?: string }
  secretary?: string | { _id: string; name?: string; nationalId?: string }
  treasurer?: string | { _id: string; name?: string; nationalId?: string }
  // Backend may include stats; we’ll show placeholders if missing
  membersCount?: number
  activeLoansCount?: number
  progress?: number
  totalLent?: number
}

export default function GroupsPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [groups, setGroups] = useState<GroupItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [groupToEdit, setGroupToEdit] = useState<any>(null)
  const user = getCurrentUser()
  // Only loan officers can create groups (maker role)
  const canCreate = user?.role && ["loan_officer"].includes(user.role)
  // Only admins can approve groups (checker role)
  const canApprove = user?.role && ["initiator_admin", "approver_admin"].includes(user.role)
  // Only admins can edit groups
  const canEdit = user?.role && ["initiator_admin", "approver_admin", "super_admin"].includes(user.role)

  useEffect(() => {
    let mounted = true
      ; (async () => {
        try {
          setLoading(true)
          const raw = await apiGet<any>("/api/groups")
          const normalized = Array.isArray(raw) ? raw : (raw?.data || [])
          if (mounted) setGroups(normalized)
        } catch (e: any) {
          const msg = e?.message || "Failed to load groups"
          if (mounted) setError(msg)
          toast({ title: "Error", description: msg })
        } finally {
          if (mounted) setLoading(false)
        }
      })()
    return () => {
      mounted = false
    }
  }, [toast])

  const handleApproveGroup = async (groupId: string) => {
    if (!window.confirm("Approve this group?")) return
    try {
      await apiPutJson(`/api/groups/${groupId}/approve`, {})
      toast({ title: "Success", description: "Group approved successfully" })
      // Refresh the list
      const data = await apiGet<GroupItem[]>("/api/groups")
      setGroups(data)
    } catch (e: any) {
      toast({ title: "Error", description: e?.message || "Failed to approve group" })
    }
  }

  const statusColors = {
    legacy: "bg-gray-100 text-gray-700 border-gray-200",
    provisional: "bg-yellow-100 text-yellow-700 border-yellow-200",
    active: "bg-green-100 text-green-700 border-green-200",
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-foreground">All Groups</h1>
            <p className="text-xs sm:text-sm text-muted-foreground mt-1">Manage lending groups and their performance</p>
          </div>
          {canCreate && (
            <Button
              onClick={() => router.push("/groups/new")}
              className="gap-2 bg-secondary text-white neumorphic neumorphic-hover border-0 w-full sm:w-auto text-sm sm:text-base py-2 sm:py-auto"
            >
              <Plus className="w-4 h-4" />
              New Group
            </Button>
          )}
        </div>

        <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
          {loading && <Card className="neumorphic p-6 border-0 text-xs sm:text-sm">Loading groups…</Card>}
          {error && !loading && (
            <Card className="neumorphic p-6 border-0 text-destructive text-xs sm:text-sm">{error}</Card>
          )}
          {!loading && !error && groups.map((group, index) => (
            <Card
              key={group._id}
              className="neumorphic p-4 sm:p-6 bg-card border-0 hover:shadow-lg transition-all duration-200"
              style={{ animationDelay: `${index * 50}ms` }}
            >
              <div className="flex items-start justify-between mb-4 gap-2">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2">
                    <p className="text-xs text-muted-foreground truncate">{group._id.substring(0, 8)}...</p>
                    <Badge variant="outline" className={statusColors[group.status || "active" as keyof typeof statusColors]}>
                      {(group.status || "active").toUpperCase()}
                    </Badge>
                  </div>
                  <h3 className="font-bold text-sm sm:text-base text-foreground mb-2 break-words">{group.name}</h3>
                  <div className="flex flex-wrap gap-2 sm:gap-3 text-xs sm:text-sm text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Users className="w-3 h-3 sm:w-4 sm:h-4" />
                      {group.membersCount ?? "—"} members
                    </span>
                    <span className="flex items-center gap-1">
                      <TrendingUp className="w-3 h-3 sm:w-4 sm:h-4" />
                      {group.activeLoansCount ?? "—"} loans
                    </span>
                  </div>
                </div>
                <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl neumorphic flex-shrink-0 flex items-center justify-center bg-secondary/10">
                  <Users className="w-5 h-5 sm:w-6 sm:h-6 text-secondary" />
                </div>
              </div>

              <div className="space-y-3">
                <div>
                  <div className="flex items-center justify-between text-xs sm:text-sm mb-2">
                    <span className="text-muted-foreground">Total Lent</span>
                    <span className="font-bold text-primary">KES {(group.totalLent ?? 0).toLocaleString()}</span>
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between text-xs sm:text-sm mb-2">
                    <span className="text-muted-foreground">Activity</span>
                    <span className="font-semibold text-secondary">{group.progress ?? 0}%</span>
                  </div>
                  <Progress value={group.progress ?? 0} className="h-2 bg-muted" />
                </div>
              </div>

              <div className="flex gap-2 mt-4">
                <Button variant="outline" className="flex-1 bg-transparent text-xs sm:text-sm py-2 sm:py-3" onClick={() => router.push(`/groups/${group._id}`)}>
                  View Details
                </Button>
                {canEdit && (
                  <Button 
                    variant="outline" 
                    className="bg-transparent text-xs sm:text-sm py-2 sm:py-3 px-3"
                    onClick={(e) => {
                      e.stopPropagation()
                      setGroupToEdit(group)
                      setIsEditDialogOpen(true)
                    }}
                  >
                    <Edit className="w-4 h-4" />
                  </Button>
                )}
              </div>
              {canApprove && group.status === "provisional" && (
                <Button
                  variant="default"
                  className="w-full mt-2 bg-green-600 hover:bg-green-700 text-white text-xs sm:text-sm py-2 sm:py-3"
                  onClick={(e) => {
                    e.stopPropagation()
                    handleApproveGroup(group._id)
                  }}
                >
                  Approve Group
                </Button>
              )}
            </Card>
          ))}
        </div>
      </div>
      <EditGroupDialog
        isOpen={isEditDialogOpen}
        onOpenChange={setIsEditDialogOpen}
        group={groupToEdit}
        onSuccess={() => {
          // Refresh groups list
          apiGet<any>("/api/groups").then(raw => {
            const normalized = Array.isArray(raw) ? raw : (raw?.data || [])
            setGroups(normalized)
          }).catch(e => {
            console.error("Failed to refresh groups:", e)
          })
        }}
      />
    </DashboardLayout>
  )
}
