"use client"

import { DashboardLayout } from "@/components/dashboard-layout"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { CheckCircle, XCircle, User, Phone, CreditCard, Users } from "lucide-react"
import { useEffect, useState } from "react"
import { apiGet, apiPutJson, getCurrentUser } from "@/lib/api"
import { useToast } from "@/hooks/use-toast"
import { useRouter } from "next/navigation"

type PendingClient = {
  _id: string
  name: string
  nationalId: string
  phone?: string
  status: string
  groupId?: { _id: string; name: string }
  branchId?: { _id: string; name: string }
  residence?: string
  businessType?: string
  businessLocation?: string
  createdAt?: string
}

type PendingGroup = {
  _id: string
  name: string
  meetingDay?: string
  meetingTime?: string
  status: string
  branchId?: { _id: string; name: string }
  loanOfficer?: { _id: string; name?: string; username?: string }
  createdAt?: string
}

export default function PendingApprovalsPage() {
  const { toast } = useToast()
  const router = useRouter()
  const [pendingClients, setPendingClients] = useState<PendingClient[]>([])
  const [pendingGroups, setPendingGroups] = useState<PendingGroup[]>([])
  const [loading, setLoading] = useState(true)
  const [processing, setProcessing] = useState<string | null>(null)

  useEffect(() => {
    const user = getCurrentUser()
    if (!user?.role || !["admin", "initiator_admin", "approver_admin", "super_admin"].includes(user.role)) {
      toast({
        title: "Access Denied",
        description: "Only admins can access pending approvals.",
        variant: "destructive"
      })
      router.push("/dashboard")
      return
    }
    fetchPendingItems()
  }, [])

  const fetchPendingItems = async () => {
    try {
      setLoading(true)
      
      // Fetch pending clients
      const clientsRaw = await apiGet<any>("/api/clients?status=pending&limit=1000")
      const clientsList = Array.isArray(clientsRaw) ? clientsRaw : (clientsRaw?.data || [])
      setPendingClients(clientsList.filter((c: any) => c.status === "pending"))

      // Fetch pending groups
      const groupsRaw = await apiGet<any>("/api/groups?status=pending&limit=1000")
      const groupsList = Array.isArray(groupsRaw) ? groupsRaw : (groupsRaw?.data || [])
      setPendingGroups(groupsList.filter((g: any) => g.status === "pending"))
    } catch (e: any) {
      console.error("Failed to load pending items:", e)
      toast({ 
        title: "Error", 
        description: e?.message || "Failed to load pending approvals" 
      })
    } finally {
      setLoading(false)
    }
  }

  const handleApproveClient = async (clientId: string) => {
    try {
      setProcessing(clientId)
      await apiPutJson(`/api/clients/${clientId}`, { status: "active" })
      toast({ 
        title: "Client Approved", 
        description: "Client has been activated successfully" 
      })
      fetchPendingItems()
    } catch (e: any) {
      toast({ 
        title: "Error", 
        description: e?.message || "Failed to approve client",
        variant: "destructive"
      })
    } finally {
      setProcessing(null)
    }
  }

  const handleRejectClient = async (clientId: string) => {
    if (!window.confirm("Are you sure you want to reject this client?")) return
    
    try {
      setProcessing(clientId)
      await apiPutJson(`/api/clients/${clientId}`, { status: "rejected" })
      toast({ 
        title: "Client Rejected", 
        description: "Client has been rejected" 
      })
      fetchPendingItems()
    } catch (e: any) {
      toast({ 
        title: "Error", 
        description: e?.message || "Failed to reject client",
        variant: "destructive"
      })
    } finally {
      setProcessing(null)
    }
  }

  const handleApproveGroup = async (groupId: string) => {
    try {
      setProcessing(groupId)
      await apiPutJson(`/api/groups/${groupId}`, { status: "active" })
      toast({ 
        title: "Group Approved", 
        description: "Group has been activated successfully" 
      })
      fetchPendingItems()
    } catch (e: any) {
      toast({ 
        title: "Error", 
        description: e?.message || "Failed to approve group",
        variant: "destructive"
      })
    } finally {
      setProcessing(null)
    }
  }

  const handleRejectGroup = async (groupId: string) => {
    if (!window.confirm("Are you sure you want to reject this group?")) return
    
    try {
      setProcessing(groupId)
      await apiPutJson(`/api/groups/${groupId}`, { status: "rejected" })
      toast({ 
        title: "Group Rejected", 
        description: "Group has been rejected" 
      })
      fetchPendingItems()
    } catch (e: any) {
      toast({ 
        title: "Error", 
        description: e?.message || "Failed to reject group",
        variant: "destructive"
      })
    } finally {
      setProcessing(null)
    }
  }

  if (loading) {
    return (
      <DashboardLayout>
        <div className="max-w-7xl mx-auto">
          <p className="text-muted-foreground">Loading pending approvals...</p>
        </div>
      </DashboardLayout>
    )
  }

  const totalPending = pendingClients.length + pendingGroups.length

  return (
    <DashboardLayout>
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-foreground">Pending Approvals</h1>
          <p className="text-muted-foreground mt-1">
            Review and approve pending clients and groups
          </p>
          <div className="mt-3">
            <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200 text-base px-3 py-1">
              {totalPending} Pending Item{totalPending !== 1 ? 's' : ''}
            </Badge>
          </div>
        </div>

        {totalPending === 0 ? (
          <Card className="neumorphic p-8 bg-card border-0 text-center">
            <div className="flex flex-col items-center gap-3">
              <CheckCircle className="w-16 h-16 text-green-500" />
              <h3 className="text-xl font-bold">All Clear!</h3>
              <p className="text-muted-foreground">No pending approvals at the moment.</p>
            </div>
          </Card>
        ) : (
          <>
            {/* Pending Clients */}
            {pendingClients.length > 0 && (
              <Card className="neumorphic p-6 bg-card border-0">
                <div className="flex items-center gap-2 mb-4">
                  <User className="w-5 h-5 text-primary" />
                  <h2 className="text-xl font-bold">Pending Clients ({pendingClients.length})</h2>
                </div>
                <div className="space-y-3">
                  {pendingClients.map((client) => (
                    <div
                      key={client._id}
                      className="p-3 sm:p-4 rounded-xl bg-muted/20 border border-border flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3"
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-2 sm:gap-3 mb-2 flex-wrap">
                          <h3 className="text-base sm:text-lg font-semibold">{client.name}</h3>
                          <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200 text-xs">
                            Pending
                          </Badge>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2 sm:gap-3 text-xs sm:text-sm">
                          <div className="flex items-center gap-2">
                            <CreditCard className="w-3 h-3 sm:w-4 sm:h-4 text-muted-foreground" />
                            <span className="text-muted-foreground">ID:</span>
                            <span className="font-medium">{client.nationalId}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Phone className="w-3 h-3 sm:w-4 sm:h-4 text-muted-foreground" />
                            <span className="text-muted-foreground">Phone:</span>
                            <span className="font-medium">{client.phone || "—"}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Users className="w-3 h-3 sm:w-4 sm:h-4 text-muted-foreground" />
                            <span className="text-muted-foreground">Group:</span>
                            <span className="font-medium">
                              {typeof client.groupId === "object" ? client.groupId?.name : "—"}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-muted-foreground">Branch:</span>
                            <span className="font-medium">
                              {typeof client.branchId === "object" ? client.branchId?.name : "—"}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 w-full sm:w-auto sm:ml-4">
                        <Button
                          size="sm"
                          onClick={() => handleApproveClient(client._id)}
                          disabled={processing === client._id}
                          className="bg-green-600 hover:bg-green-700 text-white gap-2 flex-1 sm:flex-none text-xs sm:text-sm"
                        >
                          <CheckCircle className="w-3 h-3 sm:w-4 sm:h-4" />
                          {processing === client._id ? "Processing..." : "Approve"}
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleRejectClient(client._id)}
                          disabled={processing === client._id}
                          className="border-red-200 text-red-700 hover:bg-red-50 gap-2 flex-1 sm:flex-none text-xs sm:text-sm"
                        >
                          <XCircle className="w-3 h-3 sm:w-4 sm:h-4" />
                          Reject
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            )}

            {/* Pending Groups */}
            {pendingGroups.length > 0 && (
              <Card className="neumorphic p-6 bg-card border-0">
                <div className="flex items-center gap-2 mb-4">
                  <Users className="w-5 h-5 text-primary" />
                  <h2 className="text-xl font-bold">Pending Groups ({pendingGroups.length})</h2>
                </div>
                <div className="space-y-3">
                  {pendingGroups.map((group) => (
                    <div
                      key={group._id}
                      className="p-3 sm:p-4 rounded-xl bg-muted/20 border border-border flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3"
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-2 sm:gap-3 mb-2 flex-wrap">
                          <h3 className="text-base sm:text-lg font-semibold">{group.name}</h3>
                          <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200 text-xs">
                            Pending
                          </Badge>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2 sm:gap-3 text-xs sm:text-sm">
                          <div>
                            <span className="text-muted-foreground">Meeting:</span>
                            <span className="font-medium ml-1">
                              {group.meetingDay} {group.meetingTime}
                            </span>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Branch:</span>
                            <span className="font-medium ml-1">
                              {typeof group.branchId === "object" ? group.branchId?.name : "—"}
                            </span>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Officer:</span>
                            <span className="font-medium ml-1">
                              {typeof group.loanOfficer === "object" 
                                ? (group.loanOfficer?.name || group.loanOfficer?.username)
                                : "—"}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 w-full sm:w-auto sm:ml-4">
                        <Button
                          size="sm"
                          onClick={() => handleApproveGroup(group._id)}
                          disabled={processing === group._id}
                          className="bg-green-600 hover:bg-green-700 text-white gap-2 flex-1 sm:flex-none text-xs sm:text-sm"
                        >
                          <CheckCircle className="w-3 h-3 sm:w-4 sm:h-4" />
                          {processing === group._id ? "Processing..." : "Approve"}
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleRejectGroup(group._id)}
                          disabled={processing === group._id}
                          className="border-red-200 text-red-700 hover:bg-red-50 gap-2 flex-1 sm:flex-none text-xs sm:text-sm"
                        >
                          <XCircle className="w-3 h-3 sm:w-4 sm:h-4" />
                          Reject
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            )}
          </>
        )}
      </div>
    </DashboardLayout>
  )
}
