"use client"

import { DashboardLayout } from "@/components/dashboard-layout"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, Save, DollarSign } from "lucide-react"
import { useRouter, useParams } from "next/navigation"
import { useEffect, useState } from "react"
import { apiGet, apiPutJson, getCurrentUser } from "@/lib/api"
import { useToast } from "@/hooks/use-toast"
import { SavingsAdjustmentDialog } from "@/components/savings-adjustment-dialog"
import { EditGroupDialog } from "@/components/edit-group-dialog"
import { History, PlusCircle, Edit, User, Phone, Mail, MapPin, CreditCard, Calendar } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"

// Types kept loose to be resilient to backend changes
type Group = {
  _id: string
  name: string
  meetingDay?: string
  meetingTime?: string
  status?: string
  branchId?: string | { _id: string; name?: string; code?: string }
  loanOfficer?: string | { _id: string; username?: string; name?: string }
  loanOfficerId?: string | { _id: string; username?: string; name?: string }
  chairperson?: string | { _id: string; name?: string; nationalId?: string }
  secretary?: string | { _id: string; name?: string; nationalId?: string }
  treasurer?: string | { _id: string; name?: string; nationalId?: string }
  members?: Array<{ name?: string; nationalId?: string; _id: string; savings_balance_cents?: number }>
  signatories?: Array<{ role: string; memberNationalId: string }>
}

type ClientItem = {
  _id: string
  name?: string
  nationalId?: string
  groupId?: string | { _id?: string }
  savings_balance_cents?: number
}

export default function GroupDetailPage() {
  const router = useRouter()
  const params = useParams()
  const { toast } = useToast()
  const groupId = params.id as string

  const [group, setGroup] = useState<Group | null>(null)
  const [members, setMembers] = useState<ClientItem[]>([])
  const [loading, setLoading] = useState(true)
  const [membersLoading, setMembersLoading] = useState(false)

  const [isSavingsDialogOpen, setIsSavingsDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [targetClient, setTargetClient] = useState<{ id: string, name: string, balance: number } | null>(null)
  const [isMemberDialogOpen, setIsMemberDialogOpen] = useState(false)
  const [selectedMember, setSelectedMember] = useState<ClientItem | null>(null)
  const [savingsHistory, setSavingsHistory] = useState<any[]>([])
  const [historyLoading, setHistoryLoading] = useState(false)

  const user = getCurrentUser()
  const canApprove = user?.role && ["super_admin", "approver_admin"].includes(user.role)

  const fetchGroup = async () => {
    try {
      setLoading(true)
      // Prefer detail endpoint; fallback to list if not available
      let raw: any = null
      try {
        raw = await apiGet<any>(`/api/groups/${groupId}`)
      } catch {
        const listRaw = await apiGet<any>(`/api/groups`)
        const list = Array.isArray(listRaw) ? listRaw : listRaw?.data || listRaw?.items || []
        raw = list.find((g: any) => g._id === groupId) || null
      }
      const data = raw?.data || raw
      if (!data) {
        toast({ title: "Not found", description: "Group not found" })
        router.push("/groups")
        return
      }
      setGroup(data)
    } catch (e: any) {
      toast({ title: "Error", description: e?.message || "Failed to load group" })
    } finally {
      setLoading(false)
    }
  }

  const fetchMembers = async () => {
    try {
      setMembersLoading(true)
      // Try server-side filter first
      try {
        const raw = await apiGet<any>(`/api/clients?groupId=${groupId}`)
        const list = Array.isArray(raw) ? raw : (raw?.data || [])
        setMembers(list)
        return
      } catch {
        // fallback to fetching all clients and filtering
      }
      const raw = await apiGet<any>(`/api/clients`)
      const all = Array.isArray(raw) ? raw : (raw?.data || [])
      const filtered = (all || []).filter((c: any) => {
        if (!c) return false
        if (!c.groupId) return false
        if (typeof c.groupId === "string") return c.groupId === groupId
        return c.groupId._id === groupId
      })
      setMembers(filtered)
    } catch (e: any) {
      // silent; members are optional
    } finally {
      setMembersLoading(false)
    }
  }

  useEffect(() => {
    fetchGroup()
    fetchMembers()
    fetchGroupSavingsHistory()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [groupId])

  const fetchGroupSavingsHistory = async () => {
    try {
      setHistoryLoading(true)
      const raw = await apiGet<any>(`/api/savings?groupId=${groupId}`)
      const data = Array.isArray(raw) ? raw : (raw?.data || [])
      setSavingsHistory(data)
    } catch {
      // silent
    } finally {
      setHistoryLoading(false)
    }
  }

  if (loading) {
    return (
      <DashboardLayout>
        <div className="max-w-5xl mx-auto">
          <p className="text-muted-foreground">Loading group…</p>
        </div>
      </DashboardLayout>
    )
  }

  if (!group) {
    return (
      <DashboardLayout>
        <div className="max-w-5xl mx-auto">
          <p className="text-destructive">Group not found</p>
        </div>
      </DashboardLayout>
    )
  }

  const officerName = typeof group.loanOfficerId === "string" ? group.loanOfficerId : (group.loanOfficerId?.name || group.loanOfficerId?.username || group.loanOfficerId?._id || "—")

  return (
    <DashboardLayout>
      <div className="max-w-5xl mx-auto space-y-6">
        <div className="mb-6">
          <Button variant="ghost" onClick={() => router.push("/groups")} className="mb-4 gap-2">
            <ArrowLeft className="w-4 h-4" />
            Back to Groups
          </Button>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-foreground">{group.name}</h1>
              <p className="text-muted-foreground mt-1">Group Details & Signatories</p>
            </div>
            <div className="flex items-center gap-3">
              {canApprove && (
                <Button
                  onClick={() => setIsEditDialogOpen(true)}
                  variant="outline"
                  size="sm"
                  className="px-3 py-2 gap-2"
                >
                  <Edit className="w-4 h-4" />
                  Edit Group
                </Button>
              )}
              {canApprove && (
                <Button
                  onClick={() => router.push(`/savings`)}
                  variant="outline"
                  size="sm"
                  className="px-3 py-2 gap-2"
                >
                  <DollarSign className="w-4 h-4" />
                  Add Savings
                </Button>
              )}
              <Badge variant="outline" className="bg-secondary/10 text-secondary border-secondary/20">
                {group._id}
              </Badge>
            </div>
          </div>
        </div>

        <Card className="neumorphic p-6 bg-card border-0">
          <h2 className="text-xl font-bold mb-4">Group Information</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <p className="text-sm text-muted-foreground mb-1">Group Name</p>
              <p className="font-semibold">{group.name}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground mb-1">Status</p>
              <Badge variant="outline" className="bg-secondary/10 text-secondary border-secondary/20">
                {group.status?.toUpperCase() || "ACTIVE"}
              </Badge>
            </div>
            <div>
              <p className="text-sm text-muted-foreground mb-1">Meeting Day</p>
              <p className="font-semibold">{group.meetingDay || "—"}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground mb-1">Meeting Time</p>
              <p className="font-semibold">{group.meetingTime || "—"}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground mb-1">Branch</p>
              <p className="font-semibold">
                {typeof group.branchId === "string" 
                  ? group.branchId 
                  : (group.branchId?.name || "—")}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground mb-1">Loan Officer</p>
              <p className="font-semibold">{officerName}</p>
            </div>
          </div>

          {/* Current Signatories */}
          <div className="mt-6 pt-6 border-t border-border">
            <h3 className="text-lg font-bold mb-4">Current Signatories</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 rounded-lg bg-background neumorphic-inset">
                <p className="text-xs text-muted-foreground mb-2">Chairperson</p>
                <p className="font-semibold">
                  {typeof group.chairperson === "string" 
                    ? group.chairperson 
                    : group.chairperson?.name 
                      ? `${group.chairperson.name} (${group.chairperson.nationalId})` 
                      : "Not assigned"}
                </p>
              </div>
              <div className="p-4 rounded-lg bg-background neumorphic-inset">
                <p className="text-xs text-muted-foreground mb-2">Secretary</p>
                <p className="font-semibold">
                  {typeof group.secretary === "string" 
                    ? group.secretary 
                    : group.secretary?.name 
                      ? `${group.secretary.name} (${group.secretary.nationalId})` 
                      : "Not assigned"}
                </p>
              </div>
              <div className="p-4 rounded-lg bg-background neumorphic-inset">
                <p className="text-xs text-muted-foreground mb-2">Treasurer</p>
                <p className="font-semibold">
                  {typeof group.treasurer === "string" 
                    ? group.treasurer 
                    : group.treasurer?.name 
                      ? `${group.treasurer.name} (${group.treasurer.nationalId})` 
                      : "Not assigned"}
                </p>
              </div>
            </div>
          </div>
        </Card>

        {/* Group Savings Activities */}
        <Card className="neumorphic p-6 bg-card border-0">
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
            <History className="w-5 h-5 text-primary" />
            Group Savings Activities
          </h2>
          <div className="space-y-3">
            {historyLoading ? (
              <p className="text-sm text-muted-foreground animate-pulse">Loading activity history...</p>
            ) : savingsHistory.length === 0 ? (
              <p className="text-sm text-muted-foreground italic">No savings activity recorded for this group.</p>
            ) : (
              <div className="space-y-2">
                {savingsHistory.slice(0, 5).map((tx, idx) => (
                  <div key={tx._id || idx} className="p-3 rounded-xl bg-muted/20 border border-border text-sm flex justify-between items-center">
                    <div className="flex gap-2 items-center">
                      <Badge variant="outline" className={tx.amountKES < 0 ? "bg-red-50 text-red-700 border-red-200" : "bg-green-50 text-green-700 border-green-200"}>
                        {tx.amountKES < 0 ? "-" : "+"} KES {Math.abs(tx.amountKES).toLocaleString()}
                      </Badge>
                      <span className="font-medium">{tx.clientName || 'Client'}</span>
                    </div>
                    <span className="text-[10px] text-muted-foreground">{new Date(tx.createdAt).toLocaleDateString()}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </Card>

        {(membersLoading ? [] : members).length > 0 && (
          <Card className="neumorphic p-6 bg-card border-0">
            <h2 className="text-xl font-bold mb-4">Members</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {(members.length > 0 ? members : (group.members || [])).map((m, idx) => (
                <div 
                  key={(m._id as string) || idx} 
                  className="p-4 rounded-xl bg-muted/30 flex justify-between items-center hover:bg-muted/50 cursor-pointer transition-colors"
                  onClick={() => {
                    setSelectedMember(m)
                    setIsMemberDialogOpen(true)
                  }}
                >
                  <div>
                    <p className="font-semibold">{m.name || "—"}</p>
                    <p className="text-sm text-muted-foreground">ID: {m.nationalId || "—"}</p>
                    <p className="text-xs text-primary mt-1">
                      Savings: KES {((m.savings_balance_cents || 0) / 100).toLocaleString()}
                    </p>
                  </div>
                  {canApprove && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation()
                        setTargetClient({ id: m._id, name: m.name || 'Member', balance: m.savings_balance_cents || 0 })
                        setIsSavingsDialogOpen(true)
                      }}
                      className="h-8 w-8 p-0 rounded-full hover:bg-primary/10 hover:text-primary transition-colors"
                      title="Adjust Savings"
                    >
                      <PlusCircle className="w-5 h-5" />
                    </Button>
                  )}
                </div>
              ))}
            </div>
          </Card>
        )}
      </div>
      <SavingsAdjustmentDialog
        isOpen={isSavingsDialogOpen}
        onOpenChange={setIsSavingsDialogOpen}
        clientId={targetClient?.id || ""}
        clientName={targetClient?.name || ""}
        currentBalanceCents={targetClient?.balance || 0}
        onSuccess={() => {
          fetchMembers()
          fetchGroupSavingsHistory()
        }}
      />      <EditGroupDialog
        isOpen={isEditDialogOpen}
        onOpenChange={setIsEditDialogOpen}
        group={group}
        onSuccess={() => {
          fetchGroup()
          fetchMembers()
        }}
      />
      
      {/* Member Details Dialog */}
      <Dialog open={isMemberDialogOpen} onOpenChange={setIsMemberDialogOpen}>
        <DialogContent className="sm:max-w-md bg-card border-0 neumorphic">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <User className="w-5 h-5 text-primary" />
              Member Details
            </DialogTitle>
          </DialogHeader>

          {selectedMember && (
            <div className="space-y-4">
              <div className="text-center pb-4 border-b border-border">
                <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-3">
                  <User className="w-10 h-10 text-primary" />
                </div>
                <h3 className="text-xl font-bold">{selectedMember.name}</h3>
                <p className="text-sm text-muted-foreground">{selectedMember.nationalId}</p>
              </div>

              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <CreditCard className="w-4 h-4 text-primary mt-1" />
                  <div>
                    <p className="text-xs text-muted-foreground">National ID</p>
                    <p className="font-semibold">{selectedMember.nationalId || "—"}</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <DollarSign className="w-4 h-4 text-primary mt-1" />
                  <div>
                    <p className="text-xs text-muted-foreground">Savings Balance</p>
                    <p className="font-semibold text-green-600">
                      KES {((selectedMember.savings_balance_cents || 0) / 100).toLocaleString()}
                    </p>
                  </div>
                </div>

                {(selectedMember as any).phone && (
                  <div className="flex items-start gap-3">
                    <Phone className="w-4 h-4 text-primary mt-1" />
                    <div>
                      <p className="text-xs text-muted-foreground">Phone</p>
                      <p className="font-semibold">{(selectedMember as any).phone}</p>
                    </div>
                  </div>
                )}

                {(selectedMember as any).email && (
                  <div className="flex items-start gap-3">
                    <Mail className="w-4 h-4 text-primary mt-1" />
                    <div>
                      <p className="text-xs text-muted-foreground">Email</p>
                      <p className="font-semibold">{(selectedMember as any).email}</p>
                    </div>
                  </div>
                )}

                {(selectedMember as any).residence && (
                  <div className="flex items-start gap-3">
                    <MapPin className="w-4 h-4 text-primary mt-1" />
                    <div>
                      <p className="text-xs text-muted-foreground">Residence</p>
                      <p className="font-semibold">{(selectedMember as any).residence}</p>
                    </div>
                  </div>
                )}

                {(selectedMember as any).businessType && (
                  <div className="flex items-start gap-3">
                    <Calendar className="w-4 h-4 text-primary mt-1" />
                    <div>
                      <p className="text-xs text-muted-foreground">Business Type</p>
                      <p className="font-semibold">{(selectedMember as any).businessType}</p>
                    </div>
                  </div>
                )}
              </div>

              <div className="pt-4">
                <Button 
                  onClick={() => router.push(`/clients?q=${selectedMember.nationalId}`)}
                  className="w-full"
                >
                  View Full Profile
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  )
}
