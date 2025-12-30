"use client"

import React, { useEffect, useState, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Plus, Filter, Download, X, DollarSign, History, PlusCircle } from "lucide-react"
import { apiGet, apiPutJson, getCurrentUser } from "@/lib/api"
import { useToast } from "@/hooks/use-toast"
import { SavingsAdjustmentDialog } from "@/components/savings-adjustment-dialog"

type ClientItem = {
  _id: string
  name: string
  nationalId: string
  phone?: string
  groupId?: { name?: string }
  status?: "legacy" | "pending" | "active"
}

type ClientHistory = {
  client: {
    _id: string
    name: string
    nationalId: string
    phone: string
    photoUrl?: string
    residence: string
    businessType: string
    businessLocation: string
    groupId?: { _id: string; name: string }
    savings_balance_cents?: number
    nextOfKin?: { name?: string; phone?: string; relationship?: string }
  }
  loans?: Array<{ _id: string; amount: number; status: string; createdAt: string; groupId?: any; initiatedBy?: any; approvedBy?: any }>
  assessments?: Array<{ _id: string; loanId?: string; totalScore: number; createdAt: string }>
  guarantors?: Array<{ _id: string; loanId?: string; clientId?: any; relationship: string; status: string }>
  repayments?: Array<{ _id: string; loanId?: string; amount: number; status: string; createdAt: string; paidBy?: any }>
  savingsHistory?: Array<{ _id: string; clientId: string; amountKES: number; notes: string; createdAt: string }>
}

export default function ClientsPage() {
  return (
    <Suspense fallback={<div />}>
      <DashboardLayout>
        <ClientsView />
      </DashboardLayout>
    </Suspense>
  )
}

function ClientsView() {
  const router = useRouter()
  const { toast } = useToast()
  const [clients, setClients] = useState<ClientItem[]>([])
  const search = useSearchParams()
  const q = search?.get("q") || ""
  const [visibleCount, setVisibleCount] = useState(20)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null)
  const [clientHistory, setClientHistory] = useState<ClientHistory | null>(null)
  const [historyLoading, setHistoryLoading] = useState(false)
  const [isSavingsDialogOpen, setIsSavingsDialogOpen] = useState(false)
  const user = getCurrentUser()
  const canOnboard = user?.role && ["super_admin", "loan_officer"].includes(user.role)
  const canApprove = user?.role && ["super_admin", "initiator_admin", "approver_admin"].includes(user.role)

  useEffect(() => {
    let mounted = true
      ; (async () => {
        try {
          setLoading(true)
          // Try server-side filtered endpoint first
          try {
            const path = q
              ? `/api/clients?search=${encodeURIComponent(q)}&limit=1000`
              : `/api/clients?limit=1000`
            const data: any = await apiGet(path)
            const list: ClientItem[] = Array.isArray(data)
              ? data
              : data?.items || data?.data || data?.clients || []
            if (q) {
              const normalize = (s: string) => s.replace(/\s+/g, " ").trim().toLowerCase()
              const sq = normalize(q)
              const exact = (list || []).filter((c) => {
                if (!c) return false
                const name = (c.name || "") && normalize(c.name || "")
                const nid = (c.nationalId || "").toLowerCase().trim()
                const id = (c._id || "").toLowerCase().trim()
                return name === sq || nid === sq || id === sq
              })
              if (mounted) setClients(exact)
            } else {
              if (mounted) setClients(list || [])
            }
            return
          } catch {
            // fallback to fetching all clients then client-side filter
          }
          const allRaw = await apiGet<any>("/api/clients?limit=1000")
          const all: ClientItem[] = Array.isArray(allRaw) ? allRaw : allRaw?.items || allRaw?.data || allRaw?.clients || []
          if (q) {
            const normalize = (s: string) => s.replace(/\s+/g, " ").trim().toLowerCase()
            const sq = normalize(q)
            const exact = (all || []).filter((c) => {
              if (!c) return false
              const name = (c.name || "") && normalize(c.name || "")
              const nid = (c.nationalId || "").toLowerCase().trim()
              const id = (c._id || "").toLowerCase().trim()
              return name === sq || nid === sq || id === sq
            })
            if (mounted) setClients(exact || [])
          } else {
            if (mounted) setClients(all || [])
          }
        } catch (e: any) {
          const msg = e?.message || "Failed to load clients"
          if (mounted) setError(msg)
          toast({ title: "Error", description: msg })
        } finally {
          if (mounted) setLoading(false)
        }
      })()
    return () => {
      mounted = false
    }
  }, [toast, q])

  const fetchClientHistory = async (clientId: string) => {
    try {
      setHistoryLoading(true)
      try {
        const data = await apiGet<ClientHistory>(`/api/clients/${clientId}/history`)
        // Ensure savings history is included if present in response
        setClientHistory(data)
        return
      } catch {
        // fallback to client detail endpoint and synthesize minimal history
      }
      const detail = await apiGet<any>(`/api/clients/${clientId}`)
      setClientHistory({ client: detail })
    } catch (e: any) {
      toast({ title: "Error", description: e?.message || "Failed to load client details" })
    } finally {
      setHistoryLoading(false)
    }
  }

  const handleViewClient = (clientId: string) => {
    setSelectedClientId(clientId)
    fetchClientHistory(clientId)
  }

  const handleApproveClient = async (clientId: string) => {
    if (!window.confirm("Approve this client?")) return
    try {
      await apiPutJson(`/api/clients/${clientId}/approve`, {})
      toast({ title: "Success", description: "Client approved successfully" })
      // Refresh the list
      const dataRaw = await apiGet<any>("/api/clients?limit=1000")
      const data = Array.isArray(dataRaw) ? dataRaw : dataRaw?.items || dataRaw?.data || dataRaw?.clients || []
      if (q) {
        const normalize = (s: string) => s.replace(/\s+/g, " ").trim().toLowerCase()
        const sq = normalize(q)
        const exact = (data || []).filter((c: ClientItem) => {
          if (!c) return false
          const name = (c.name || "") && normalize(c.name || "")
          const nid = (c.nationalId || "").toLowerCase().trim()
          const id = (c._id || "").toLowerCase().trim()
          return name === sq || nid === sq || id === sq
        })
        setClients(exact)
      } else {
        setClients(data)
      }
      if (selectedClientId === clientId) {
        fetchClientHistory(clientId)
      }
    } catch (e: any) {
      toast({ title: "Error", description: e?.message || "Failed to approve client" })
    }
  }

  const statusColors = {
    legacy: "bg-gray-100 text-gray-700 border-gray-200",
    pending: "bg-yellow-100 text-yellow-700 border-yellow-200",
    active: "bg-green-100 text-green-700 border-green-200",
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">All Clients</h1>
          <p className="text-muted-foreground mt-1">Manage your client database</p>
        </div>
        {canOnboard && (
          <Button
            onClick={() => router.push("/clients/new")}
            className="gap-2 bg-secondary text-white neumorphic neumorphic-hover border-0"
          >
            <Plus className="w-4 h-4" />
            New Client
          </Button>
        )}
      </div>

      <div className="flex gap-3">
        <Button variant="outline" className="gap-2 bg-transparent">
          <Filter className="w-4 h-4" />
          Filter
        </Button>
        <Button variant="outline" className="gap-2 bg-transparent">
          <Download className="w-4 h-4" />
          Export
        </Button>
      </div>

      <Card className="neumorphic p-6 bg-card border-0">
        <div className="overflow-x-auto">
          {loading ? (
            <p className="text-sm text-muted-foreground">Loading clients…</p>
          ) : error ? (
            <p className="text-sm text-destructive">{error}</p>
          ) : (
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-3 px-4 text-sm font-semibold text-foreground">Client ID</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-foreground">Name</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-foreground">National ID</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-foreground">Phone</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-foreground">Group</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-foreground">Status</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-foreground">Actions</th>
                </tr>
              </thead>
              <tbody>
                {clients.slice(0, visibleCount).map((client) => (
                  <tr key={client._id} className="border-b border-border hover:bg-muted/50 transition-colors">
                    <td className="py-4 px-4 font-mono text-sm">{client._id.substring(0, 8)}...</td>
                    <td className="py-4 px-4 font-semibold">{client.name}</td>
                    <td className="py-4 px-4 text-muted-foreground">{client.nationalId}</td>
                    <td className="py-4 px-4 text-muted-foreground">{client.phone || "—"}</td>
                    <td className="py-4 px-4 text-muted-foreground">{client.groupId?.name || "—"}</td>
                    <td className="py-4 px-4 text-muted-foreground">
                      {client.groupId ? (
                        <span
                          role="link"
                          tabIndex={0}
                          onKeyDown={(e) => (e.key === "Enter" ? (() => {
                            const id = typeof client.groupId === "string" ? client.groupId : (client.groupId as any)?._id
                            if (id) router.push(`/groups/${id}`)
                          })() : undefined)}
                          onClick={() => {
                            const id = typeof client.groupId === "string" ? client.groupId : (client.groupId as any)?._id
                            if (id) router.push(`/groups/${id}`)
                          }}
                          className="text-primary underline hover:text-primary/80 cursor-pointer"
                        >
                          {typeof client.groupId === "string" ? client.groupId : client.groupId?.name || "View Group"}
                        </span>
                      ) : (
                        "—"
                      )}
                    </td>
                    <td className="py-4 px-4">
                      <Badge variant="outline" className={statusColors[client.status || "active" as keyof typeof statusColors]}>
                        {(client.status || "active").toUpperCase()}
                      </Badge>
                    </td>
                    <td className="py-4 px-4">
                      <div className="flex gap-2">
                        <Button variant="ghost" size="sm" onClick={() => handleViewClient(client._id)}>
                          View
                        </Button>
                        {canApprove && client.status === "pending" && (
                          <Button variant="default" size="sm" onClick={() => handleApproveClient(client._id)} className="bg-green-600 hover:bg-green-700">
                            Approve
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </Card>
      {clients.length > visibleCount && (
        <div className="flex justify-center mt-4">
          <Button onClick={() => setVisibleCount((c) => c + 20)} className="px-6">
            View more
          </Button>
        </div>
      )}

      {/* Client Details Modal */}
      <Dialog open={!!selectedClientId} onOpenChange={(open) => !open && setSelectedClientId(null)}>
        <DialogContent className="w-[95vw] max-w-2xl h-[95vh] max-h-[95vh] overflow-y-auto p-4 sm:p-6 rounded-2xl">
          <DialogHeader className="sticky top-0 bg-card/95 backdrop-blur -mx-4 -mt-4 px-4 py-3 sm:px-6 mb-4 border-b">
            <DialogTitle className="flex items-center justify-between text-lg sm:text-xl">
              <span>Client Details</span>
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  onClick={() => {
                    if (clientHistory?.client?.nationalId) {
                      router.push(`/loans/initiate?clientNationalId=${clientHistory.client.nationalId}`)
                      setSelectedClientId(null)
                    }
                  }}
                  className="h-8"
                >
                  Create Loan
                </Button>
                <Button variant="ghost" size="sm" onClick={() => setSelectedClientId(null)} className="h-8 w-8">
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </DialogTitle>
          </DialogHeader>

          {historyLoading ? (
            <div className="py-8 text-center text-muted-foreground">Loading client details…</div>
          ) : clientHistory ? (
            <div className="space-y-6">
              {/* Client Info */}
              <div className="bg-muted/20 p-3 sm:p-4 rounded-xl">
                <h3 className="font-bold text-base sm:text-lg mb-4">Personal Information</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 text-xs sm:text-sm">
                  <div className="space-y-1">
                    <p className="text-muted-foreground text-xs">Name</p>
                    <p className="font-semibold break-words">{clientHistory.client.name}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-muted-foreground text-xs">National ID</p>
                    <p className="font-semibold break-words">{clientHistory.client.nationalId}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-muted-foreground text-xs">Phone</p>
                    <p className="font-semibold break-words">{clientHistory.client.phone || "—"}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-muted-foreground text-xs">Residence</p>
                    <p className="font-semibold capitalize">{clientHistory.client.residence || "—"}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-muted-foreground text-xs">Business Type</p>
                    <p className="font-semibold">{clientHistory.client.businessType || "—"}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-muted-foreground text-xs">Business Location</p>
                    <p className="font-semibold">{clientHistory.client.businessLocation || "—"}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-muted-foreground text-xs">Group</p>
                    <p className="font-semibold">{clientHistory.client.groupId?.name || "—"}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-muted-foreground text-xs">Savings Balance</p>
                    <p className="font-semibold text-primary">KES {((clientHistory.client.savings_balance_cents || 0) / 100).toLocaleString()}</p>
                  </div>
                </div>
                {clientHistory.client.nextOfKin && (
                  <div className="mt-4 p-2.5 sm:p-3 rounded-lg bg-card border border-border">
                    <p className="text-xs font-semibold mb-3 text-secondary">NEXT OF KIN</p>
                    <div className="text-xs sm:text-sm space-y-2">
                      <div><span className="text-muted-foreground">Name:</span> <span className="font-semibold block">{clientHistory.client.nextOfKin.name || "—"}</span></div>
                      <div><span className="text-muted-foreground">Phone:</span> <span className="font-semibold block break-words">{clientHistory.client.nextOfKin.phone || "—"}</span></div>
                      <div><span className="text-muted-foreground">Relationship:</span> <span className="font-semibold block">{clientHistory.client.nextOfKin.relationship || "—"}</span></div>
                    </div>
                  </div>
                )}
              </div>

              <div className="mt-4 flex gap-3">
                {user?.role && ["super_admin", "approver_admin"].includes(user.role) && (
                  <Button
                    onClick={() => setIsSavingsDialogOpen(true)}
                    className="flex-1 gap-2 bg-primary text-white neumorphic neumorphic-hover border-0"
                  >
                    <PlusCircle className="w-4 h-4" />
                    Adjust Savings
                  </Button>
                )}
              </div>

              {/* Savings Activities */}
              <div className="mt-6 border-t border-border pt-6">
                <h3 className="font-bold text-base sm:text-lg mb-3 flex items-center gap-2">
                  <History className="w-5 h-5 text-primary" />
                  Savings Activities
                </h3>
                <div className="space-y-2">
                  {!clientHistory.savingsHistory || clientHistory.savingsHistory.length === 0 ? (
                    <p className="text-sm text-muted-foreground italic bg-muted/10 p-4 rounded-xl text-center">No recent savings activity.</p>
                  ) : (
                    clientHistory.savingsHistory.map((tx, idx) => (
                      <div key={tx._id || idx} className="p-3 rounded-xl bg-muted/20 border border-border text-sm">
                        <div className="flex justify-between items-start mb-1">
                          <Badge variant="outline" className={tx.amountKES < 0 ? "bg-red-50 text-red-700 border-red-200" : "bg-green-50 text-green-700 border-green-200"}>
                            {tx.amountKES < 0 ? "-" : "+"} KES {Math.abs(tx.amountKES).toLocaleString()}
                          </Badge>
                          <span className="text-[10px] text-muted-foreground">{new Date(tx.createdAt).toLocaleDateString()}</span>
                        </div>
                        <p className="text-xs text-muted-foreground line-clamp-1">{tx.notes || "No notes provided"}</p>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Loans */}
              {Array.isArray(clientHistory.loans) && clientHistory.loans.length > 0 && (
                <div>
                  <h3 className="font-bold text-base sm:text-lg mb-3">Loans ({clientHistory.loans.length})</h3>
                  <div className="space-y-2">
                    {clientHistory.loans.map((loan) => (
                      <div key={loan._id} className="p-2.5 sm:p-3 rounded-lg bg-muted/20 border border-border">
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-2">
                          <p className="font-semibold text-xs sm:text-sm">KES {Number(loan.amount || 0).toLocaleString()}</p>
                          <Badge variant="outline" className="w-fit text-xs">{loan.status}</Badge>
                        </div>
                        <p className="text-xs text-muted-foreground">{new Date(loan.createdAt).toLocaleDateString()}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Assessments */}
              {Array.isArray(clientHistory.assessments) && clientHistory.assessments.length > 0 && (
                <div>
                  <h3 className="font-bold text-base sm:text-lg mb-3">Credit Assessments ({clientHistory.assessments.length})</h3>
                  <div className="space-y-2">
                    {clientHistory.assessments.map((assessment) => (
                      <div key={assessment._id} className="p-2.5 sm:p-3 rounded-lg bg-muted/20 border border-border">
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                          <p className="font-semibold text-xs sm:text-sm">Score: <span className="text-primary">{assessment.totalScore}/25</span></p>
                          <p className="text-xs text-muted-foreground">{new Date(assessment.createdAt).toLocaleDateString()}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Guarantors */}
              {Array.isArray(clientHistory.guarantors) && clientHistory.guarantors.length > 0 && (
                <div>
                  <h3 className="font-bold text-base sm:text-lg mb-3">Guarantor for ({clientHistory.guarantors.length})</h3>
                  <div className="space-y-2">
                    {clientHistory.guarantors.map((g) => (
                      <div key={g._id} className="p-2.5 sm:p-3 rounded-lg bg-muted/20 border border-border">
                        <p className="font-semibold text-xs sm:text-sm break-words">{typeof g.clientId === "string" ? g.clientId : (g.clientId?.name || "—")}</p>
                        <div className="flex flex-col sm:flex-row sm:items-center gap-2 mt-2">
                          <p className="text-xs text-muted-foreground">Relationship: {g.relationship}</p>
                          <Badge variant="outline" className="text-xs w-fit">{g.status}</Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Repayments */}
              {Array.isArray(clientHistory.repayments) && clientHistory.repayments.length > 0 && (
                <div>
                  <h3 className="font-bold text-base sm:text-lg mb-3">Repayments ({clientHistory.repayments.length})</h3>
                  <div className="space-y-2">
                    {clientHistory.repayments.map((r) => (
                      <div key={r._id} className="p-2.5 sm:p-3 rounded-lg bg-muted/20 border border-border">
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-1">
                          <p className="font-semibold text-xs sm:text-sm">KES {Number(r.amount || 0).toLocaleString()}</p>
                          <Badge variant="outline" className="text-xs w-fit">{r.status}</Badge>
                        </div>
                        <p className="text-xs text-muted-foreground">{new Date(r.createdAt).toLocaleDateString()}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="py-8 text-center text-destructive">Failed to load client details</div>
          )}
        </DialogContent>
      </Dialog>
      <SavingsAdjustmentDialog
        isOpen={isSavingsDialogOpen}
        onOpenChange={setIsSavingsDialogOpen}
        clientId={clientHistory?.client?._id || ""}
        clientName={clientHistory?.client?.name || ""}
        onSuccess={() => {
          if (selectedClientId) fetchClientHistory(selectedClientId)
        }}
      />
    </div>
  )
}
