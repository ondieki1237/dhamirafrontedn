"use client"

import { useEffect, useMemo, useState } from "react"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Plus, Filter, Download, ArrowUpDown, ChevronUp, ChevronDown, CheckSquare, Square } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { apiGet, apiPostJson, getCurrentUser } from "@/lib/api"
import { useToast } from "@/hooks/use-toast"

type LoanItem = {
  _id: string
  client?: { name?: string } | string
  clientName?: string
  type: string
  amount: number
  status: "initiated" | "approved" | "disbursed" | "repaid" | "defaulted" | string
  createdAt?: string
}

const statusColors = {
  initiated: "bg-blue-100 text-blue-700 border-blue-200",
  approved: "bg-secondary/10 text-secondary border-secondary/20",
  disbursed: "bg-primary/10 text-primary border-primary/20",
  repaid: "bg-green-100 text-green-700 border-green-200",
  defaulted: "bg-destructive/10 text-destructive border-destructive/20",
}

export default function LoansPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [loans, setLoans] = useState<LoanItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [userRole, setUserRole] = useState<string | null>(null)
  const [sortConfig, setSortConfig] = useState<{ key: keyof LoanItem | "clientName"; direction: "asc" | "desc" } | null>(null)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [bulkSubmitting, setBulkSubmitting] = useState(false)

  useEffect(() => {
    const user = getCurrentUser()
    setUserRole(user?.role || null)
  }, [])

  // Only loan officers can initiate loans (maker role)
  const canInitiate = userRole && ["loan_officer"].includes(userRole)
  // Only admins can perform bulk actions (checker role)
  const canBulkAction = userRole && ["initiator_admin", "approver_admin"].includes(userRole)

  const fetchLoans = async () => {
    try {
      setLoading(true)
      const raw = await apiGet<any>("/api/loans")
      const normalized = Array.isArray(raw) ? raw : (raw?.data || [])
      setLoans(normalized)
    } catch (e: any) {
      const msg = e?.message || "Failed to load loans"
      setError(msg)
      toast({ title: "Error", description: msg })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchLoans()
  }, [])

  const sortedLoans = useMemo(() => {
    let sortableItems = [...loans]
    if (sortConfig !== null) {
      sortableItems.sort((a, b) => {
        let aValue: any = a[sortConfig.key as keyof LoanItem]
        let bValue: any = b[sortConfig.key as keyof LoanItem]

        if (sortConfig.key === "clientName") {
          aValue = typeof a.client === "string" ? a.client : a.client?.name || a.clientName || ""
          bValue = typeof b.client === "string" ? b.client : b.client?.name || b.clientName || ""
        }

        if (aValue < bValue) {
          return sortConfig.direction === "asc" ? -1 : 1
        }
        if (aValue > bValue) {
          return sortConfig.direction === "asc" ? 1 : -1
        }
        return 0
      })
    }
    return sortableItems
  }, [loans, sortConfig])

  const requestSort = (key: keyof LoanItem | "clientName") => {
    let direction: "asc" | "desc" = "asc"
    if (sortConfig && sortConfig.key === key && sortConfig.direction === "asc") {
      direction = "desc"
    }
    setSortConfig({ key, direction })
  }
  const toggleSelectAll = () => {
    if (selectedIds.size === loans.length) {
      setSelectedIds(new Set())
    } else {
      setSelectedIds(new Set(loans.map(l => l._id)))
    }
  }

  const toggleSelectOne = (id: string) => {
    const next = new Set(selectedIds)
    if (next.has(id)) next.delete(id)
    else next.add(id)
    setSelectedIds(next)
  }

  const handleBulkMarkFeePaid = async () => {
    const count = selectedIds.size
    // Only confirm if more than 5 are selected to reduce fatigue
    if (count > 5 && !window.confirm(`Mark registration fee as paid for all ${count} selected loans?`)) return

    try {
      setBulkSubmitting(true)
      await apiPostJson("/api/loans/mark-application-fee-paid-bulk", {
        loanIds: Array.from(selectedIds)
      })
      toast({ title: "Bulk update successful", description: `Processed ${count} loans.` })
      setSelectedIds(new Set())
      fetchLoans()
    } catch (e: any) {
      const msg = e?.message || "Unknown error"
      toast({
        title: "Bulk update failed",
        description: msg.includes("authorized") ? "Your session may have expired. Please log in again." : msg,
        variant: "destructive"
      })
    } finally {
      setBulkSubmitting(false)
    }
  }

  const renderSortIcon = (key: keyof LoanItem | "clientName") => {
    if (!sortConfig || sortConfig.key !== key) return <ArrowUpDown className="w-3 h-3 ml-1" />
    return sortConfig.direction === "asc" ? <ChevronUp className="w-3 h-3 ml-1" /> : <ChevronDown className="w-3 h-3 ml-1" />
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-foreground">All Loans</h1>
            <p className="text-xs sm:text-sm text-muted-foreground mt-1">Manage and track all loan applications</p>
          </div>
          <div className="flex items-center gap-3">
            <Button
              onClick={() => {
                if (canInitiate) router.push("/loans/initiate")
                else toast({ title: "Access denied", description: "You don't have permission to create loans" })
              }}
              className="gap-2 bg-primary text-white neumorphic neumorphic-hover border-0 w-full sm:w-auto text-sm sm:text-base"
            >
              <Plus className="w-4 h-4" />
              New Loan
            </Button>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 items-start sm:items-center">
          <Button variant="outline" className="gap-2 bg-transparent text-xs sm:text-sm">
            <Filter className="w-4 h-4" />
            Filter
          </Button>
          <Button variant="outline" className="gap-2 bg-transparent text-xs sm:text-sm">
            <Download className="w-4 h-4" />
            Export
          </Button>

          {selectedIds.size > 0 && canBulkAction && (
            <div className="flex items-center gap-2 animate-in slide-in-from-left-2 fade-in duration-200">
              <span className="text-xs font-semibold text-muted-foreground ml-2">{selectedIds.size} selected</span>
              <Button
                onClick={handleBulkMarkFeePaid}
                disabled={bulkSubmitting}
                className="gap-2 bg-orange-500 text-white neumorphic border-0 text-xs sm:text-sm h-9"
              >
                {bulkSubmitting ? "Processing..." : "Mark Fees Paid"}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSelectedIds(new Set())}
                className="text-xs text-muted-foreground hover:text-foreground"
              >
                Clear
              </Button>
            </div>
          )}
        </div>

        <Card className="neumorphic p-3 sm:p-6 bg-card border-0">
          {loading ? (
            <p className="text-xs sm:text-sm text-muted-foreground">Loading loans…</p>
          ) : error ? (
            <p className="text-xs sm:text-sm text-destructive">{error}</p>
          ) : (
            <>
              {/* Desktop Table View */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="py-3 px-4 text-left w-10">
                        <button
                          onClick={toggleSelectAll}
                          className="text-primary hover:scale-110 transition-transform"
                          title={selectedIds.size === loans.length ? "Deselect All" : "Select All"}
                        >
                          {selectedIds.size === loans.length ? <CheckSquare className="w-4 h-4" /> : <Square className="w-4 h-4" />}
                        </button>
                      </th>
                      <th className="text-left py-3 px-4 text-xs sm:text-sm font-semibold text-foreground cursor-pointer hover:bg-muted/50 transition-colors" onClick={() => requestSort("_id")}>
                        <div className="flex items-center">Loan ID {renderSortIcon("_id")}</div>
                      </th>
                      <th className="text-left py-3 px-4 text-xs sm:text-sm font-semibold text-foreground cursor-pointer hover:bg-muted/50 transition-colors" onClick={() => requestSort("clientName")}>
                        <div className="flex items-center">Client {renderSortIcon("clientName")}</div>
                      </th>
                      <th className="text-left py-3 px-4 text-xs sm:text-sm font-semibold text-foreground">Type</th>
                      <th className="text-left py-3 px-4 text-xs sm:text-sm font-semibold text-foreground cursor-pointer hover:bg-muted/50 transition-colors" onClick={() => requestSort("amount")}>
                        <div className="flex items-center">Amount {renderSortIcon("amount")}</div>
                      </th>
                      <th className="text-left py-3 px-4 text-xs sm:text-sm font-semibold text-foreground">Status</th>
                      <th className="text-left py-3 px-4 text-xs sm:text-sm font-semibold text-foreground cursor-pointer hover:bg-muted/50 transition-colors" onClick={() => requestSort("createdAt")}>
                        <div className="flex items-center">Date {renderSortIcon("createdAt")}</div>
                      </th>
                      <th className="text-left py-3 px-4 text-xs sm:text-sm font-semibold text-foreground">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sortedLoans.map((loan) => {
                      const clientName = typeof loan.client === "string" ? loan.client : loan.client?.name || loan.clientName || "—"
                      const created = loan.createdAt ? new Date(loan.createdAt).toISOString().slice(0, 10) : "—"
                      const amount = (loan as any).amountKES || loan.amount || 0
                      const isSelected = selectedIds.has(loan._id)
                      return (
                        <tr key={loan._id} className={`border-b border-border hover:bg-muted/30 transition-colors ${isSelected ? "bg-primary/5" : ""}`}>
                          <td className="py-4 px-4 text-left">
                            <button
                              onClick={() => toggleSelectOne(loan._id)}
                              className={`transition-transform hover:scale-110 ${isSelected ? "text-primary" : "text-muted-foreground/50"}`}
                            >
                              {isSelected ? <CheckSquare className="w-4 h-4" /> : <Square className="w-4 h-4" />}
                            </button>
                          </td>
                          <td className="py-4 px-4 font-mono text-xs sm:text-sm">{loan._id}</td>
                          <td className="py-4 px-4 font-semibold text-xs sm:text-sm">{clientName}</td>
                          <td className="py-4 px-4 text-muted-foreground capitalize text-xs sm:text-sm">{loan.type}</td>
                          <td className="py-4 px-4 font-semibold text-secondary text-xs sm:text-sm">KES {Number(amount).toLocaleString()}</td>
                          <td className="py-4 px-4">
                            <Badge variant="outline" className={statusColors[loan.status as keyof typeof statusColors] || ""}>
                              {loan.status}
                            </Badge>
                          </td>
                          <td className="py-4 px-4 text-muted-foreground text-xs sm:text-sm">{created}</td>
                          <td className="py-4 px-4">
                            <Link href={`/loans/${loan._id}`} className="inline-flex items-center text-xs text-primary underline hover:text-primary/80">
                              View
                            </Link>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>

              {/* Mobile Card View */}
              <div className="md:hidden space-y-3">
                {sortedLoans.map((loan) => {
                  const clientName = typeof loan.client === "string" ? loan.client : loan.client?.name || loan.clientName || "—"
                  const created = loan.createdAt ? new Date(loan.createdAt).toISOString().slice(0, 10) : "—"
                  const amount = (loan as any).amountKES || loan.amount || 0
                  const isSelected = selectedIds.has(loan._id)
                  return (
                    <div
                      key={loan._id}
                      onClick={() => toggleSelectOne(loan._id)}
                      className={`p-3 rounded-xl border transition-all cursor-pointer ${isSelected ? "bg-primary/5 border-primary/30 ring-1 ring-primary/20" : "bg-muted/20 border-border"}`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex gap-2">
                          <span className={isSelected ? "text-primary" : "text-muted-foreground/30"}>
                            {isSelected ? <CheckSquare className="w-4 h-4" /> : <Square className="w-4 h-4" />}
                          </span>
                          <div className="min-w-0">
                            <p className="text-[10px] font-mono text-muted-foreground truncate">{loan._id}</p>
                            <p className="text-sm font-semibold text-foreground mt-0.5">{clientName}</p>
                          </div>
                        </div>
                        <Badge variant="outline" className={statusColors[loan.status as keyof typeof statusColors] || ""}>
                          {loan.status}
                        </Badge>
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div>
                          <p className="text-muted-foreground">Type</p>
                          <p className="font-semibold capitalize">{loan.type}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Amount</p>
                          <p className="font-semibold text-secondary">KES {Number(amount).toLocaleString()}</p>
                        </div>
                      </div>
                      <div className="flex items-center justify-between pt-2 border-t border-border">
                        <p className="text-xs text-muted-foreground">{created}</p>
                        <Link href={`/loans/${loan._id}`} className="inline-flex items-center text-xs text-primary underline hover:text-primary/80 h-8">
                          View
                        </Link>
                      </div>
                    </div>
                  )
                })}
              </div>
            </>
          )}
        </Card>
      </div>
    </DashboardLayout>
  )
}
