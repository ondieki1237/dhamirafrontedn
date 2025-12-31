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
import { History, PlusCircle } from "lucide-react"

// Types kept loose to be resilient to backend changes
type Group = {
  _id: string
  name: string
  meetingDay?: string
  meetingTime?: string
  loanOfficerId?: string | { _id: string; username?: string; name?: string }
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
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({
    chairperson: "",
    secretary: "",
    treasurer: "",
  })

  const [isSavingsDialogOpen, setIsSavingsDialogOpen] = useState(false)
  const [targetClient, setTargetClient] = useState<{ id: string, name: string, balance: number } | null>(null)
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

      // If existing signatories, prefill
      const existing = (data.signatories || []).reduce((acc: Record<string, string>, s: { role: string; memberNationalId: string }) => {
        acc[s.role] = s.memberNationalId
        return acc
      }, {})
      setForm({
        chairperson: existing.chairperson || "",
        secretary: existing.secretary || "",
        treasurer: existing.treasurer || "",
      })
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

  const onAssign = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      setSaving(true)
      const payload = {
        signatoryAssignments: [
          { role: "chairperson", memberNationalId: form.chairperson },
          { role: "secretary", memberNationalId: form.secretary },
          { role: "treasurer", memberNationalId: form.treasurer },
        ],
      }
      await apiPutJson(`/api/groups/${groupId}/assign-signatories`, payload)
      toast({ title: "Signatories assigned" })
      fetchGroup()
    } catch (e: any) {
      toast({ title: "Error", description: e?.message || "Failed to assign signatories" })
    } finally {
      setSaving(false)
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
              <Button
                onClick={() => router.push(`/loans/initiate?groupId=${group._id}`)}
                size="sm"
                className="px-3 py-2"
              >
                Initiate Group Loan
              </Button>
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
          <h2 className="text-xl font-bold mb-4">Assign Signatories</h2>
          <form className="space-y-6" onSubmit={onAssign}>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label className="block text-sm font-semibold text-foreground mb-2">Chairperson (National ID)</label>
                <input
                  type="text"
                  value={form.chairperson}
                  onChange={(e) => setForm({ ...form, chairperson: e.target.value })}
                  className="w-full px-4 py-3 bg-background rounded-xl border-0 neumorphic-inset focus:outline-none focus:ring-2 focus:ring-secondary"
                  placeholder="e.g., 12345678"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-foreground mb-2">Secretary (National ID)</label>
                <input
                  type="text"
                  value={form.secretary}
                  onChange={(e) => setForm({ ...form, secretary: e.target.value })}
                  className="w-full px-4 py-3 bg-background rounded-xl border-0 neumorphic-inset focus:outline-none focus:ring-2 focus:ring-secondary"
                  placeholder="e.g., 87654321"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-foreground mb-2">Treasurer (National ID)</label>
                <input
                  type="text"
                  value={form.treasurer}
                  onChange={(e) => setForm({ ...form, treasurer: e.target.value })}
                  className="w-full px-4 py-3 bg-background rounded-xl border-0 neumorphic-inset focus:outline-none focus:ring-2 focus:ring-secondary"
                  placeholder="e.g., 11223344"
                  required
                />
              </div>
            </div>
            <div className="flex gap-4 justify-end">
              <Button type="button" variant="outline" onClick={() => router.back()} className="px-8 py-3">
                Cancel
              </Button>
              <Button type="submit" disabled={saving} className="px-8 py-3 bg-secondary text-white neumorphic neumorphic-hover border-0 gap-2">
                <Save className="w-4 h-4" />
                {saving ? "Saving..." : "Assign Signatories"}
              </Button>
            </div>
          </form>
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
                <div key={(m._id as string) || idx} className="p-4 rounded-xl bg-muted/30 flex justify-between items-center">
                  <div>
                    <p className="font-semibold">{m.name || "—"}</p>
                    <p className="text-sm text-muted-foreground">ID: {m.nationalId || "—"}</p>
                  </div>
                  {canApprove && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
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
      />
    </DashboardLayout >
  )
}
