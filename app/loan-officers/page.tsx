"use client"

import { DashboardLayout } from "@/components/dashboard-layout"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { UserPlus, Users, Phone, Mail, CreditCard, Shield, RefreshCw } from "lucide-react"
import { useEffect, useState } from "react"
import { apiGet, apiPostJson, getCurrentUser } from "@/lib/api"
import { useToast } from "@/hooks/use-toast"
import { useRouter } from "next/navigation"

export default function LoanOfficersPage() {
    const { toast } = useToast()
    const router = useRouter()
    const [officers, setOfficers] = useState<any[]>([])
    const [branches, setBranches] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [submitting, setSubmitting] = useState(false)
    const [form, setForm] = useState({
        name: "",
        phone: "",
        email: "",
        nationalId: "",
        branchId: "",
    })

    useEffect(() => {
        const user = getCurrentUser()
        if (user && user.role !== "super_admin") {
            toast({
                title: "Access Denied",
                description: "Officer management is restricted to system administrators.",
                variant: "destructive"
            })
            router.push("/dashboard")
            return
        }
        fetchOfficers()
        fetchBranches()
    }, [])

    const fetchBranches = async () => {
        try {
            const data = await apiGet<any>("/api/branches")
            console.log("Branches response:", data)
            const list = Array.isArray(data) ? data : (data?.data || data?.branches || [])
            console.log("Branch list:", list)
            setBranches(list)
        } catch (e: any) {
            console.error("Failed to load branches:", e)
        }
    }

    const fetchOfficers = async () => {
        try {
            setLoading(true)
            let data: any
            try {
                data = await apiGet<any>("/api/loan-officers")
            } catch (e) {
                console.warn("Main officers list endpoint failed, trying analytics fallback...", e)
                try {
                    const fallbackData = await apiGet<any>("/api/analytics/officers")
                    data = fallbackData.officers || fallbackData.data?.officers || fallbackData
                } catch (e2) {
                    throw new Error("Unable to retrieve officers list from any source.")
                }
            }

            const list = Array.isArray(data) ? data : (data?.data || data?.officers || [])
            setOfficers(list)
        } catch (e: any) {
            console.error("fetchOfficers Error:", e)
            toast({
                title: "Data Loading Error",
                description: e?.message || "Failed to load officers list. Check your connection or administrative token.",
                variant: "destructive"
            })
        } finally {
            setLoading(false)
        }
    }

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault()
        try {
            setSubmitting(true)
            const result = await apiPostJson("/api/loan-officers", form)

            // Show detailed success toast
            toast({
                title: "✅ Officer Created Successfully",
                description: (
                    <div className="mt-2 p-3 bg-secondary/10 rounded-lg space-y-1 text-xs">
                        <p><strong>Name:</strong> {result.name}</p>
                        <p><strong>ID/Username:</strong> {result.nationalId}</p>
                        <p><strong>Role:</strong> Loan Officer</p>
                        <p className="text-[10px] mt-2 opacity-70 italic text-secondary">The officer can now log in using their ID.</p>
                    </div>
                ),
            })

            setForm({ name: "", phone: "", email: "", nationalId: "", branchId: "" })
            fetchOfficers()
        } catch (e: any) {
            toast({ title: "Error", description: e?.message || "Failed to create officer", variant: "destructive" })
        } finally {
            setSubmitting(false)
        }
    }

    return (
        <DashboardLayout>
            <div className="space-y-6">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-3xl font-bold text-foreground flex items-center gap-3">
                            <Users className="w-8 h-8 text-primary" />
                            Loan Officer Management
                        </h1>
                        <p className="text-muted-foreground mt-1">Register and manage administrative staff credentials.</p>
                    </div>
                    <Button variant="outline" onClick={fetchOfficers} disabled={loading} className="gap-2 rounded-xl h-11 px-6">
                        <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
                        Refresh List
                    </Button>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Registration Form */}
                    <Card className="lg:col-span-1 p-6 space-y-6 neumorphic bg-card border-0 h-fit sticky top-6">
                        <div className="space-y-4">
                            <h2 className="text-xl font-bold flex items-center gap-2">
                                <UserPlus className="w-5 h-5 text-primary" />
                                Register New Officer
                            </h2>
                            <p className="text-xs text-muted-foreground bg-primary/5 p-3 rounded-lg border border-primary/10">
                                Username will be the National ID. Default password is <span className="font-bold">12345678</span>.
                            </p>

                            <form onSubmit={handleCreate} className="space-y-4">
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-muted-foreground uppercase">Full Name</label>
                                    <input
                                        type="text"
                                        value={form.name}
                                        onChange={(e) => setForm({ ...form, name: e.target.value })}
                                        className="w-full px-4 py-3 bg-background rounded-xl border-0 neumorphic-inset focus:outline-none focus:ring-2 focus:ring-primary text-sm"
                                        placeholder="e.g. Alice Officer"
                                        required
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-muted-foreground uppercase">Phone Number</label>
                                    <input
                                        type="text"
                                        value={form.phone}
                                        onChange={(e) => setForm({ ...form, phone: e.target.value })}
                                        className="w-full px-4 py-3 bg-background rounded-xl border-0 neumorphic-inset focus:outline-none focus:ring-2 focus:ring-primary text-sm"
                                        placeholder="0712345678"
                                        required
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-muted-foreground uppercase">Email Address</label>
                                    <input
                                        type="email"
                                        value={form.email}
                                        onChange={(e) => setForm({ ...form, email: e.target.value })}
                                        className="w-full px-4 py-3 bg-background rounded-xl border-0 neumorphic-inset focus:outline-none focus:ring-2 focus:ring-primary text-sm"
                                        placeholder="alice@example.com"
                                        required
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-muted-foreground uppercase">National ID (Username)</label>
                                    <input
                                        type="text"
                                        value={form.nationalId}
                                        onChange={(e) => setForm({ ...form, nationalId: e.target.value })}
                                        className="w-full px-4 py-3 bg-background rounded-xl border-0 neumorphic-inset focus:outline-none focus:ring-2 focus:ring-primary text-sm"
                                        placeholder="ID12345678"
                                        required
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-muted-foreground uppercase">Branch</label>
                                    <select
                                        value={form.branchId}
                                        onChange={(e) => setForm({ ...form, branchId: e.target.value })}
                                        className="w-full px-4 py-3 bg-background rounded-xl border-0 neumorphic-inset focus:outline-none focus:ring-2 focus:ring-primary text-sm"
                                        required
                                    >
                                        <option value="">Select Branch</option>
                                        {branches.map((branch) => (
                                            <option key={branch._id} value={branch._id}>
                                                {branch.name}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                <Button type="submit" disabled={submitting} className="w-full h-12 bg-primary text-white neumorphic neumorphic-hover border-0 font-bold mt-2">
                                    {submitting ? "Processing..." : "Create Account"}
                                </Button>
                            </form>
                        </div>
                    </Card>

                    {/* Officers List */}
                    <div className="lg:col-span-2 space-y-4">
                        <h2 className="text-xl font-bold flex items-center gap-2">
                            <Shield className="w-5 h-5 text-primary" />
                            Active Officers
                        </h2>
                        {loading ? (
                            <div className="p-20 text-center text-muted-foreground">Loading officers...</div>
                        ) : officers.length === 0 ? (
                            <div className="bg-card neumorphic p-20 rounded-2xl text-center text-muted-foreground">
                                <Users className="w-12 h-12 mx-auto mb-4 opacity-10" />
                                <p>No loan officers registered yet.</p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {officers.map((officer, i) => (
                                    <Card key={i} className="neumorphic bg-card border-0 p-5 space-y-4 hover:scale-[1.01] transition-transform">
                                        <div className="flex items-start justify-between">
                                            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-lg">
                                                {officer.name?.split(" ").map((n: any) => n[0]).join("").substring(0, 2).toUpperCase()}
                                            </div>
                                            <Badge className="bg-orange-100 text-orange-700 hover:bg-orange-100 border-0">
                                                Loan Officer
                                            </Badge>
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-lg">{officer.name}</h3>
                                            <p className="text-xs text-muted-foreground flex items-center gap-1">
                                                <CreditCard className="w-3 h-3" /> {officer.nationalId || officer.username || "No ID"}
                                            </p>
                                        </div>
                                        <div className="space-y-2 pt-2 border-t border-border">
                                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                                <Phone className="w-4 h-4 text-primary" />
                                                {officer.phone || "—"}
                                            </div>
                                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                                <Mail className="w-4 h-4 text-primary" />
                                                <span className="truncate">{officer.email || "—"}</span>
                                            </div>
                                        </div>
                                    </Card>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </DashboardLayout>
    )
}
