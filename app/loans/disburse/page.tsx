"use client"

import { useEffect, useState } from "react"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, DollarSign } from "lucide-react"
import { useRouter } from "next/navigation"
import { apiGet, apiPostJson, getCurrentUser } from "@/lib/api"
import { useToast } from "@/hooks/use-toast"

type Loan = {
    _id: string
    client: { name: string; nationalId: string } | string
    type: string
    amount: number
    term: number
    status: string
    createdAt: string
}

export default function DisburseLoanPage() {
    const router = useRouter()
    const { toast } = useToast()
    const [loans, setLoans] = useState<Loan[]>([])
    const [loading, setLoading] = useState(true)
    const [disbursing, setDisbursing] = useState<string | null>(null)
    const user = getCurrentUser()

    const canDisburse = user?.role && ["approver_admin", "super_admin"].includes(user.role)

    useEffect(() => {
        if (!canDisburse) {
            toast({ title: "Access Denied", description: "Only authorized admins can access this page" })
            router.push("/loans")
            return
        }
        fetchLoans()
    }, [])

    const fetchLoans = async () => {
        try {
            setLoading(true)
            const data = await apiGet<Loan[]>("/api/loans")
            // Filter for loans ready for disbursement
            const approvedLoans = (data || []).filter((loan) => loan.status === "approved")
            setLoans(approvedLoans)
        } catch (e: any) {
            toast({ title: "Error", description: e?.message || "Failed to load loans" })
        } finally {
            setLoading(false)
        }
    }

    const handleDisburse = async (loanId: string) => {
        if (!window.confirm("Trigger M-Pesa disbursement for this loan?")) return
        try {
            setDisbursing(loanId)
            await apiPostJson(`/api/loans/${loanId}/disburse`, {})
            toast({ title: "Success", description: "Disbursement triggered successfully" })
            fetchLoans()
        } catch (e: any) {
            toast({ title: "Error", description: e?.message || "Failed to disburse loan" })
        } finally {
            setDisbursing(null)
        }
    }

    return (
        <DashboardLayout>
            <div className="max-w-6xl mx-auto">
                <div className="mb-6">
                    <Button variant="ghost" onClick={() => router.back()} className="mb-4 gap-2">
                        <ArrowLeft className="w-4 h-4" />
                        Back
                    </Button>
                    <h1 className="text-3xl font-bold text-foreground">Pending Disbursements</h1>
                    <p className="text-muted-foreground mt-1">Review and disburse funds for approved loans</p>
                </div>

                {loading ? (
                    <Card className="neumorphic p-6 bg-card border-0">
                        <p className="text-muted-foreground">Loading loans...</p>
                    </Card>
                ) : loans.length === 0 ? (
                    <Card className="neumorphic p-6 bg-card border-0">
                        <p className="text-muted-foreground">No loans pending disbursement</p>
                    </Card>
                ) : (
                    <div className="space-y-4">
                        {loans.map((loan) => {
                            const clientName = typeof loan.client === "string" ? loan.client : (loan.client as any)?.name || "—"

                            return (
                                <Card key={loan._id} className="neumorphic p-6 bg-card border-0">
                                    <div className="flex items-center justify-between">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-4 mb-4">
                                                <div>
                                                    <p className="text-sm text-muted-foreground">Loan ID</p>
                                                    <p className="font-mono font-semibold">{loan._id.substring(0, 8)}...</p>
                                                </div>
                                                <div>
                                                    <p className="text-sm text-muted-foreground">Client</p>
                                                    <p className="font-semibold">{clientName}</p>
                                                </div>
                                                <div>
                                                    <p className="text-sm text-muted-foreground">Status</p>
                                                    <Badge className="bg-green-100 text-green-700 border-green-200">
                                                        {loan.status.toUpperCase()}
                                                    </Badge>
                                                </div>
                                            </div>
                                            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                                                <div>
                                                    <p className="text-sm text-muted-foreground">Amount</p>
                                                    <p className="font-bold text-primary text-lg">KES {loan.amount.toLocaleString()}</p>
                                                </div>
                                                <div>
                                                    <p className="text-sm text-muted-foreground">Duration</p>
                                                    <p className="font-semibold">{loan.term} months</p>
                                                </div>
                                                <div>
                                                    <p className="text-sm text-muted-foreground">Date Approved</p>
                                                    <p className="font-semibold">{new Date(loan.createdAt).toLocaleDateString()}</p>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex flex-col gap-2 ml-6">
                                            <Button
                                                onClick={() => handleDisburse(loan._id)}
                                                disabled={disbursing === loan._id}
                                                className="gap-2 bg-primary text-white"
                                            >
                                                <DollarSign className="w-4 h-4" />
                                                {disbursing === loan._id ? "Disbursing..." : "Disburse Funds"}
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                onClick={() => router.push(`/loans/${loan._id}`)}
                                            >
                                                View Details
                                            </Button>
                                        </div>
                                    </div>
                                </Card>
                            )
                        })}
                    </div>
                )}
            </div>
        </DashboardLayout>
    )
}
