"use client"

import { DashboardLayout } from "@/components/dashboard-layout"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Plus, DollarSign, History, MinusCircle, PlusCircle } from "lucide-react"
import { useRouter, useSearchParams } from "next/navigation"
import { useEffect, useState } from "react"
import { apiGet, apiPostJson, getCurrentUser } from "@/lib/api"
import { useToast } from "@/hooks/use-toast"
import { Badge } from "@/components/ui/badge"

export default function SavingsPage() {
    const router = useRouter()
    const searchParams = useSearchParams()
    const { toast } = useToast()
    const [clients, setClients] = useState<any[]>([])
    const [history, setHistory] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [submitting, setSubmitting] = useState(false)
    const [mounted, setMounted] = useState(false)
    const [user, setUser] = useState<any>(null)

    const [form, setForm] = useState({
        clientId: "",
        amountKES: "",
        type: "add" as "add" | "deduct",
        notes: "Weekly savings deposit",
    })

    useEffect(() => {
        setMounted(true)
        setUser(getCurrentUser())

        const cId = searchParams.get("clientId")
        if (cId) {
            setForm(f => ({ ...f, clientId: cId }))
        }

        let isMounted = true
        const fetchData = async () => {
            try {
                // Fetch Clients
                const clientsDataRaw = await apiGet<any>("/api/clients?limit=1000")
                const clientsData = Array.isArray(clientsDataRaw) ? clientsDataRaw : (clientsDataRaw?.items || clientsDataRaw?.data || [])

                // Fetch Savings History
                const historyDataRaw = await apiGet<any>("/api/savings")
                const historyData = Array.isArray(historyDataRaw) ? historyDataRaw : (historyDataRaw?.items || historyDataRaw?.data || [])

                if (isMounted) {
                    setClients(clientsData)
                    setHistory(historyData)
                    setLoading(false)
                }
            } catch (e: any) {
                if (isMounted) {
                    toast({ title: "Error", description: e?.message || "Failed to load data" })
                    setLoading(false)
                }
            }
        }
        fetchData()
        return () => { isMounted = false }
    }, [toast])

    const canAddSavings = user?.role && ["super_admin", "approver_admin"].includes(user.role)

    const onSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!canAddSavings) {
            toast({ title: "Not allowed", description: "Only Approver Admins can adjust savings." })
            return
        }

        try {
            setSubmitting(true)
            const amount = Number(form.amountKES)
            const finalAmount = form.type === "deduct" ? -Math.abs(amount) : Math.abs(amount)

            await apiPostJson("/api/savings", {
                clientId: form.clientId,
                amountKES: finalAmount,
                notes: form.notes
            })

            toast({ title: "Success", description: `Savings ${form.type === "add" ? "added" : "deducted"} successfully` })

            // Refresh data
            setLoading(true)
            const historyDataRaw = await apiGet<any>("/api/savings")
            const historyData = Array.isArray(historyDataRaw) ? historyDataRaw : (historyDataRaw?.items || historyDataRaw?.data || [])
            setHistory(historyData)

            // Reset form partly
            setForm({ ...form, amountKES: "", notes: "" })
            setLoading(false)
        } catch (e: any) {
            toast({ title: "Error", description: e?.message || "Failed to log savings adjustment" })
        } finally {
            setSubmitting(false)
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
                        <p className="text-muted-foreground mt-1">View transaction history and manage client savings deposits.</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* History List - All Users */}
                    <div className="lg:col-span-2 space-y-4">
                        <div className="flex items-center gap-2 mb-2">
                            <History className="w-5 h-5 text-primary" />
                            <h2 className="text-xl font-bold text-foreground">Transaction History</h2>
                        </div>

                        <Card className="neumorphic bg-card border-0 overflow-hidden">
                            {loading ? (
                                <div className="p-10 text-center text-muted-foreground">Loading history...</div>
                            ) : history.length === 0 ? (
                                <div className="p-10 text-center text-muted-foreground">No savings transactions found.</div>
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
                    </div>

                    {/* Adjustment Form - Only Approver/Admin */}
                    <div className="space-y-4">
                        <div className="flex items-center gap-2 mb-2">
                            <PlusCircle className="w-5 h-5 text-primary" />
                            <h2 className="text-xl font-bold text-foreground">New Adjustment</h2>
                        </div>

                        <Card className="neumorphic p-6 bg-card border-0 relative">
                            {!canAddSavings ? (
                                <div className="text-center py-10">
                                    <div className="w-12 h-12 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                                        <Plus className="w-6 h-6 text-muted-foreground" />
                                    </div>
                                    <p className="font-semibold text-foreground">Restricted Access</p>
                                    <p className="text-xs text-muted-foreground mt-2 px-4">
                                        Only Super Admins and Approver Admins can manually adjust savings.
                                    </p>
                                </div>
                            ) : (
                                <form className="space-y-5" onSubmit={onSubmit}>
                                    <div className="grid grid-cols-2 gap-2 p-1 bg-muted rounded-xl">
                                        <button
                                            type="button"
                                            onClick={() => setForm({ ...form, type: 'add' })}
                                            className={`flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-medium transition-all ${form.type === 'add' ? 'bg-primary text-white shadow-md' : 'text-muted-foreground hover:bg-background/50'}`}
                                        >
                                            <PlusCircle className="w-4 h-4" />
                                            Add
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setForm({ ...form, type: 'deduct' })}
                                            className={`flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-medium transition-all ${form.type === 'deduct' ? 'bg-red-600 text-white shadow-md' : 'text-muted-foreground hover:bg-background/50'}`}
                                        >
                                            <MinusCircle className="w-4 h-4" />
                                            Deduct
                                        </button>
                                    </div>

                                    <div>
                                        <label className="block text-xs font-semibold text-muted-foreground uppercase mb-2 ml-1">Select Client</label>
                                        <select
                                            value={form.clientId}
                                            onChange={(e) => setForm({ ...form, clientId: e.target.value })}
                                            required
                                            className="w-full px-4 py-3 bg-background rounded-xl border-0 neumorphic-inset focus:outline-none focus:ring-2 focus:ring-primary transition-all text-sm"
                                        >
                                            <option value="">Choose a client</option>
                                            {clients.map((c) => (
                                                <option key={c._id} value={c._id}>
                                                    {c.name} — Bal: KES {((c.savings_balance_cents || 0) / 100).toLocaleString()}
                                                </option>
                                            ))}
                                        </select>
                                    </div>

                                    <div>
                                        <label className="block text-xs font-semibold text-muted-foreground uppercase mb-2 ml-1">Amount (KES)</label>
                                        <div className="relative">
                                            <input
                                                type="number"
                                                value={form.amountKES}
                                                onChange={(e) => setForm({ ...form, amountKES: e.target.value })}
                                                className="w-full pl-10 pr-4 py-3 bg-background rounded-xl border-0 neumorphic-inset focus:outline-none focus:ring-2 focus:ring-primary transition-all text-sm"
                                                placeholder="0.00"
                                                required
                                            />
                                            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground font-semibold">KES</span>
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-xs font-semibold text-muted-foreground uppercase mb-2 ml-1">Description / Reason</label>
                                        <textarea
                                            rows={3}
                                            value={form.notes}
                                            onChange={(e) => setForm({ ...form, notes: e.target.value })}
                                            className="w-full px-4 py-3 bg-background rounded-xl border-0 neumorphic-inset focus:outline-none focus:ring-2 focus:ring-primary transition-all text-sm resize-none"
                                            placeholder="e.g. Weekly deposit, Administrative correction..."
                                            required
                                        />
                                    </div>

                                    <Button
                                        type="submit"
                                        disabled={submitting || !form.clientId || !form.amountKES}
                                        className={`w-full py-4 h-auto rounded-xl font-bold shadow-lg transition-transform active:scale-95 border-0 ${form.type === 'add' ? 'bg-primary text-white' : 'bg-red-600 text-white'}`}
                                    >
                                        {submitting ? "Processing..." : `Log ${form.type === 'add' ? 'Addition' : 'Deduction'}`}
                                    </Button>
                                </form>
                            )}
                        </Card>
                    </div>
                </div>
            </div>
        </DashboardLayout>
    )
}
