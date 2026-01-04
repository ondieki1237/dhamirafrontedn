"use client"

import { DashboardLayout } from "@/components/dashboard-layout"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Plus, DollarSign, History, MinusCircle, PlusCircle, Search, Users, Loader2, Eye, TrendingUp, TrendingDown, Calendar } from "lucide-react"
import { useRouter, useSearchParams } from "next/navigation"
import { useEffect, useState, Suspense } from "react"
import { apiGet, getCurrentUser } from "@/lib/api"
import { useToast } from "@/hooks/use-toast"
import { Badge } from "@/components/ui/badge"
import { SavingsAdjustmentDialog } from "@/components/savings-adjustment-dialog"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"

function SavingsPageContent() {
    const router = useRouter()
    const searchParams = useSearchParams()
    const { toast } = useToast()
    const [clients, setClients] = useState<any[]>([])
    const [history, setHistory] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [mounted, setMounted] = useState(false)
    const [user, setUser] = useState<any>(null)
    const [searchQuery, setSearchQuery] = useState("")
    const [activeTab, setActiveTab] = useState("clients")

    // Modal state
    const [isDialogOpen, setIsDialogOpen] = useState(false)
    const [selectedClient, setSelectedClient] = useState<any>(null)
    const [isViewDialogOpen, setIsViewDialogOpen] = useState(false)
    const [viewingClient, setViewingClient] = useState<any>(null)
    const [clientLoans, setClientLoans] = useState<any[]>([])
    const [clientSavingsHistory, setClientSavingsHistory] = useState<any[]>([])
    const [loadingDetails, setLoadingDetails] = useState(false)

    const fetchData = async () => {
        try {
            setLoading(true)
            // Fetch Clients (matching user's request: page=1&limit=100)
            const clientsDataRaw = await apiGet<any>("/api/clients?page=1&limit=100")
            const clientsData = Array.isArray(clientsDataRaw) ? clientsDataRaw : (clientsDataRaw?.data || [])

            // Fetch Savings History
            const historyDataRaw = await apiGet<any>("/api/savings")
            const historyData = Array.isArray(historyDataRaw) ? historyDataRaw : (historyDataRaw?.data || [])

            setClients(clientsData)
            setHistory(historyData)
        } catch (e: any) {
            toast({ title: "Error", description: e?.message || "Failed to load data" })
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        setMounted(true)
        setUser(getCurrentUser())
        fetchData()
    }, [])

    const filteredClients = clients.filter(c =>
        c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.nationalId?.includes(searchQuery) ||
        c.phone?.includes(searchQuery)
    )

    const handleAdjust = (client: any) => {
        setSelectedClient(client)
        setIsDialogOpen(true)
    }

    const handleView = async (client: any) => {
        setViewingClient(client)
        setIsViewDialogOpen(true)
        setLoadingDetails(true)
        
        try {
            // Fetch ALL loans and filter on client side to ensure we only get this client's loans
            const loansRaw = await apiGet<any>("/api/loans")
            const allLoans = Array.isArray(loansRaw) ? loansRaw : (loansRaw?.data || [])
            
            // Filter to only show loans for this specific client
            const clientLoans = allLoans.filter((loan: any) => {
                // Check if loan belongs to this client
                const loanClientId = loan.clientId?._id || loan.clientId
                const loanClientNationalId = loan.clientId?.nationalId || loan.clientNationalId
                return loanClientId === client._id || loanClientNationalId === client.nationalId
            })
            setClientLoans(clientLoans)
            
            // Fetch client's savings history
            const savingsRaw = await apiGet<any>(`/api/savings?clientId=${client._id}`)
            const savingsData = Array.isArray(savingsRaw) ? savingsRaw : (savingsRaw?.data || [])
            setClientSavingsHistory(savingsData)
        } catch (e: any) {
            toast({ title: "Error", description: e?.message || "Failed to load client details" })
        } finally {
            setLoadingDetails(false)
        }
    }

    if (!mounted) return null // Prevent hydration mismatch by not rendering anything role-dependent on server

    return (
        <DashboardLayout>
            <div className="max-w-6xl mx-auto space-y-8 pb-10">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <Button variant="ghost" onClick={() => router.back()} className="mb-2 gap-2 p-0 hover:bg-transparent">
                            <ArrowLeft className="w-4 h-4" />
                            Back to dashboard
                        </Button>
                        <h1 className="text-3xl font-bold text-foreground flex items-center gap-3">
                            <DollarSign className="w-8 h-8 text-primary" />
                            Savings Management
                        </h1>
                        <p className="text-muted-foreground mt-1">Manage client savings balances and view transaction history.</p>
                    </div>
                </div>

                <div className="space-y-6">
                    <div className="flex items-center justify-between gap-4">
                        <div className="flex bg-muted p-1 rounded-xl w-fit">
                            <button
                                onClick={() => setActiveTab("clients")}
                                className={`px-6 py-2 rounded-lg text-sm font-semibold transition-all ${activeTab === "clients" ? "bg-background shadow font-bold" : "text-muted-foreground"}`}
                            >
                                Clients
                            </button>
                            <button
                                onClick={() => setActiveTab("history")}
                                className={`px-6 py-2 rounded-lg text-sm font-semibold transition-all ${activeTab === "history" ? "bg-background shadow font-bold" : "text-muted-foreground"}`}
                            >
                                History
                            </button>
                        </div>

                        {activeTab === "clients" && (
                            <div className="relative w-full max-w-sm">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                <Input
                                    placeholder="Search by name, ID or phone..."
                                    className="pl-10 neumorphic-inset bg-background border-0 h-11"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                />
                            </div>
                        )}
                    </div>

                    {activeTab === "clients" ? (
                        <Card className="neumorphic bg-card border-0 overflow-hidden">
                            {loading && clients.length === 0 ? (
                                <div className="p-20 flex flex-col items-center justify-center text-muted-foreground">
                                    <Loader2 className="w-10 h-10 animate-spin mb-4" />
                                    <p>Loading clients...</p>
                                </div>
                            ) : filteredClients.length === 0 ? (
                                <div className="p-20 text-center text-muted-foreground">
                                    <Users className="w-12 h-12 mx-auto mb-4 opacity-20" />
                                    <p>No clients found matching your search.</p>
                                </div>
                            ) : (
                                <div className="overflow-x-auto">
                                    <table className="w-full text-left border-collapse">
                                        <thead>
                                            <tr className="bg-muted/50 border-b border-border">
                                                <th className="px-6 py-4 text-sm font-semibold">Name</th>
                                                <th className="px-6 py-4 text-sm font-semibold">Group</th>
                                                <th className="px-6 py-4 text-sm font-semibold text-right">Current Savings</th>
                                                <th className="px-6 py-4 text-sm font-semibold text-center">Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-border">
                                            {filteredClients.map((client) => (
                                                <tr key={client._id} className="hover:bg-muted/30 transition-colors group">
                                                    <td className="px-6 py-4">
                                                        <p className="font-bold text-foreground">{client.name}</p>
                                                        <p className="text-xs text-muted-foreground">{client.nationalId}</p>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <Badge variant="outline" className="bg-muted/50 text-muted-foreground border-border font-medium">
                                                            {client.groupId?.name || "No Group"}
                                                        </Badge>
                                                    </td>
                                                    <td className="px-6 py-4 text-right">
                                                        <p className="font-bold text-primary">
                                                            KES {((client.savings_balance_cents || 0) / 100).toLocaleString()}
                                                        </p>
                                                    </td>
                                                    <td className="px-6 py-4 text-center">
                                                        <div className="flex items-center justify-center gap-2">
                                                            <Button
                                                                size="sm"
                                                                variant="outline"
                                                                onClick={() => handleView(client)}
                                                                className="h-9 px-4 rounded-lg border-primary/20 hover:bg-primary/10 hover:border-primary shadow-sm transition-transform active:scale-95"
                                                            >
                                                                <Eye className="w-4 h-4 mr-2" />
                                                                View
                                                            </Button>
                                                            {user?.role && ["admin", "initiator_admin", "approver_admin", "accountant"].includes(user.role) && (
                                                                <Button
                                                                    size="sm"
                                                                    onClick={() => handleAdjust(client)}
                                                                    className="h-9 px-4 rounded-lg bg-primary hover:bg-primary/90 text-white shadow-sm transition-transform active:scale-95"
                                                                >
                                                                    <PlusCircle className="w-4 h-4 mr-2" />
                                                                    Adjust
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
                    ) : (
                        <Card className="neumorphic bg-card border-0 overflow-hidden">
                            {loading && history.length === 0 ? (
                                <div className="p-20 flex flex-col items-center justify-center text-muted-foreground">
                                    <Loader2 className="w-10 h-10 animate-spin mb-4" />
                                    <p>Loading history...</p>
                                </div>
                            ) : history.length === 0 ? (
                                <div className="p-20 text-center text-muted-foreground">
                                    <History className="w-12 h-12 mx-auto mb-4 opacity-20" />
                                    <p>No savings transactions found.</p>
                                </div>
                            ) : (
                                <div className="overflow-x-auto">
                                    <table className="w-full text-left border-collapse">
                                        <thead>
                                            <tr className="bg-muted/50 border-b border-border">
                                                <th className="px-6 py-4 text-sm font-semibold">Client</th>
                                                <th className="px-6 py-4 text-sm font-semibold">Amount</th>
                                                <th className="px-6 py-4 text-sm font-semibold">Description</th>
                                                <th className="px-6 py-4 text-sm font-semibold">Date</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-border">
                                            {history.map((tx: any, idx) => (
                                                <tr key={tx._id || idx} className="hover:bg-muted/30 transition-colors">
                                                    <td className="px-6 py-4">
                                                        <p className="font-medium text-foreground">{tx.clientName || tx.clientId}</p>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <Badge variant="outline" className={tx.amountKES < 0 ? "bg-red-50 text-red-700 border-red-200" : "bg-green-50 text-green-700 border-green-200"}>
                                                            {tx.amountKES < 0 ? "-" : "+"} KES {Math.abs(tx.amountKES).toLocaleString()}
                                                        </Badge>
                                                    </td>
                                                    <td className="px-6 py-4 text-sm text-muted-foreground">
                                                        {tx.notes || tx.description || "—"}
                                                    </td>
                                                    <td className="px-6 py-4 text-xs text-muted-foreground whitespace-nowrap">
                                                        {new Date(tx.createdAt).toLocaleDateString()} {new Date(tx.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </Card>
                    )}
                </div>
            </div>

            {selectedClient && (
                <SavingsAdjustmentDialog
                    isOpen={isDialogOpen}
                    onOpenChange={setIsDialogOpen}
                    clientId={selectedClient._id}
                    clientName={selectedClient.name}
                    currentBalanceCents={selectedClient.savings_balance_cents || 0}
                    onSuccess={fetchData}
                />
            )}

            {/* Detailed View Dialog */}
            {viewingClient && (
                <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
                    <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                        <DialogHeader>
                            <DialogTitle className="text-2xl font-bold flex items-center gap-2">
                                <DollarSign className="w-6 h-6 text-primary" />
                                Financial Details - {viewingClient.name}
                            </DialogTitle>
                        </DialogHeader>
                        
                        <div className="space-y-6 mt-4">
                            {/* Client Summary */}
                            <Card className="p-4 bg-primary/5 border-primary/20">
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                    <div>
                                        <p className="text-xs text-muted-foreground mb-1">National ID</p>
                                        <p className="font-semibold">{viewingClient.nationalId}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-muted-foreground mb-1">Phone</p>
                                        <p className="font-semibold">{viewingClient.phone || "—"}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-muted-foreground mb-1">Group</p>
                                        <p className="font-semibold">{viewingClient.groupId?.name || "No Group"}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-muted-foreground mb-1">Current Savings</p>
                                        <p className="text-lg font-bold text-primary">
                                            KES {((viewingClient.savings_balance_cents || 0) / 100).toLocaleString()}
                                        </p>
                                    </div>
                                </div>
                            </Card>

                            {/* Loan Status Section */}
                            <div>
                                <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                                    <TrendingUp className="w-5 h-5 text-primary" />
                                    Loan Status
                                </h3>
                                {loadingDetails ? (
                                    <div className="p-8 text-center">
                                        <Loader2 className="w-8 h-8 animate-spin mx-auto text-primary" />
                                        <p className="text-sm text-muted-foreground mt-2">Loading loan data...</p>
                                    </div>
                                ) : clientLoans.length === 0 ? (
                                    <Card className="p-6 text-center text-muted-foreground">
                                        <p>No loans found for this client</p>
                                    </Card>
                                ) : (
                                    <div className="space-y-3">
                                        {clientLoans.map((loan) => (
                                            <Card key={loan._id} className="p-4 hover:shadow-md transition-shadow">
                                                <div className="flex items-start justify-between">
                                                    <div className="flex-1">
                                                        <div className="flex items-center gap-2 mb-2">
                                                            <Badge variant={loan.status === "active" ? "default" : loan.status === "completed" ? "secondary" : "outline"}>
                                                                {loan.status}
                                                            </Badge>
                                                            <span className="text-xs font-semibold text-foreground">
                                                                {loan.product ? loan.product.toUpperCase() : "Business"} Loan
                                                            </span>
                                                        </div>
                                                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                                                            <div>
                                                                <p className="text-xs text-muted-foreground">Amount</p>
                                                                <p className="font-semibold">KES {(loan.amount || 0).toLocaleString()}</p>
                                                            </div>
                                                            <div>
                                                                <p className="text-xs text-muted-foreground">Outstanding</p>
                                                                <p className="font-semibold text-amber-600">
                                                                    KES {(loan.outstandingBalance || loan.amount || 0).toLocaleString()}
                                                                </p>
                                                            </div>
                                                            <div>
                                                                <p className="text-xs text-muted-foreground">Interest Rate</p>
                                                                <p className="font-semibold">{loan.interestRate || 0}%</p>
                                                            </div>
                                                            <div>
                                                                <p className="text-xs text-muted-foreground">Date</p>
                                                                <p className="font-semibold">
                                                                    {loan.createdAt ? new Date(loan.createdAt).toLocaleDateString() : "—"}
                                                                </p>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </Card>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* Savings History Section */}
                            <div>
                                <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                                    <History className="w-5 h-5 text-primary" />
                                    Savings History
                                </h3>
                                {loadingDetails ? (
                                    <div className="p-8 text-center">
                                        <Loader2 className="w-8 h-8 animate-spin mx-auto text-primary" />
                                        <p className="text-sm text-muted-foreground mt-2">Loading savings history...</p>
                                    </div>
                                ) : clientSavingsHistory.length === 0 ? (
                                    <Card className="p-6 text-center text-muted-foreground">
                                        <p>No savings transactions found for this client</p>
                                    </Card>
                                ) : (
                                    <Card className="overflow-hidden">
                                        <div className="max-h-[300px] overflow-y-auto">
                                            <table className="w-full text-sm">
                                                <thead className="bg-muted/50 sticky top-0">
                                                    <tr>
                                                        <th className="px-4 py-3 text-left font-semibold">Date & Time</th>
                                                        <th className="px-4 py-3 text-left font-semibold">Amount</th>
                                                        <th className="px-4 py-3 text-left font-semibold">Description</th>
                                                        <th className="px-4 py-3 text-left font-semibold">Balance After</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-border">
                                                    {clientSavingsHistory.map((tx: any, idx) => {
                                                        const isPositive = (tx.amountKES || tx.amount || 0) >= 0
                                                        return (
                                                            <tr key={tx._id || idx} className="hover:bg-muted/30">
                                                                <td className="px-4 py-3 whitespace-nowrap">
                                                                    <div className="flex items-center gap-2">
                                                                        <Calendar className="w-3 h-3 text-muted-foreground" />
                                                                        <div>
                                                                            <p className="font-medium">
                                                                                {new Date(tx.createdAt).toLocaleDateString()}
                                                                            </p>
                                                                            <p className="text-xs text-muted-foreground">
                                                                                {new Date(tx.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                                            </p>
                                                                        </div>
                                                                    </div>
                                                                </td>
                                                                <td className="px-4 py-3">
                                                                    <div className="flex items-center gap-1">
                                                                        {isPositive ? (
                                                                            <TrendingUp className="w-4 h-4 text-green-600" />
                                                                        ) : (
                                                                            <TrendingDown className="w-4 h-4 text-red-600" />
                                                                        )}
                                                                        <span className={`font-semibold ${isPositive ? "text-green-600" : "text-red-600"}`}>
                                                                            {isPositive ? "+" : "-"} KES {Math.abs(tx.amountKES || tx.amount || 0).toLocaleString()}
                                                                        </span>
                                                                    </div>
                                                                </td>
                                                                <td className="px-4 py-3 text-muted-foreground">
                                                                    {tx.notes || tx.description || "—"}
                                                                </td>
                                                                <td className="px-4 py-3 font-semibold">
                                                                    KES {((tx.balanceAfter || 0) / 100).toLocaleString()}
                                                                </td>
                                                            </tr>
                                                        )
                                                    })}
                                                </tbody>
                                            </table>
                                        </div>
                                    </Card>
                                )}
                            </div>
                        </div>
                    </DialogContent>
                </Dialog>
            )}
        </DashboardLayout>
    )
}

export default function SavingsPage() {
  return (
    <Suspense fallback={<div className="p-8">Loading...</div>}>
      <SavingsPageContent />
    </Suspense>
  )
}
