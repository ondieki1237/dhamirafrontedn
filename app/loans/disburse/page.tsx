"use client"

import { useEffect, useState } from "react"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, DollarSign, Phone } from "lucide-react"
import { useRouter } from "next/navigation"
import { apiGet, apiPutJson, getCurrentUser } from "@/lib/api"
import { useToast } from "@/hooks/use-toast"

type Loan = {
    _id: string
    clientId: {
        _id: string
        name: string
        nationalId: string
        phone: string
    } | string
    product: string
    principal_cents: number
    term: number
    status: string
    createdAt: string
    approvedAt?: string
}

export default function DisburseLoanPage() {
    const router = useRouter()
    const { toast } = useToast()
    const [loans, setLoans] = useState<Loan[]>([])
    const [loading, setLoading] = useState(true)
    const [disbursing, setDisbursing] = useState<string | null>(null)
    const user = getCurrentUser()

    // Admins can disburse loans (checker role in maker-checker model)
    const canDisburse = user?.role && ["admin", "approver_admin", "initiator_admin"].includes(user.role)

    useEffect(() => {
        if (!canDisburse) {
            toast({ title: "Access Denied", description: "Only admins can disburse loans", variant: "destructive" })
            router.push("/loans")
            return
        }
        fetchLoans()
    }, [])

    const fetchLoans = async () => {
        try {
            setLoading(true)
            const response = await apiGet<any>("/api/loans?status=approved")
            let loansList = Array.isArray(response) ? response : (response?.data || [])
            
            // Maker-Checker: Filter out loans initiated by current admin
            if (user?._id) {
                loansList = loansList.filter((loan: any) => {
                    const initiatorId = typeof loan.initiatedBy === 'object' ? loan.initiatedBy?._id : loan.initiatedBy
                    const registeredById = typeof loan.registeredBy === 'object' ? loan.registeredBy?._id : loan.registeredBy
                    // Exclude loans created by current admin
                    return initiatorId !== user._id && registeredById !== user._id
                })
                console.log(`Disbursement: Filtered out loans initiated by current admin`)
            }
            
            setLoans(loansList)
        } catch (e: any) {
            toast({ title: "Error", description: e?.message || "Failed to load loans", variant: "destructive" })
        } finally {
            setLoading(false)
        }
    }

    const handleDisburse = async (loanId: string) => {
        if (!window.confirm("Initiate M-Pesa B2C disbursement for this loan?\\n\\nThis will transfer funds to the client's mobile number.")) return
        try {
            setDisbursing(loanId)
            const result = await apiPutJson(`/api/loans/${loanId}/disburse`, {})
            toast({
                title: "Disbursement Initiated",
                description: `Transaction ID: ${result.transactionId || 'Created'}. M-Pesa payment is being processed.`
            })
            // Refresh the list after successful initiation
            fetchLoans()
        } catch (e: any) {
            toast({ title: "Disbursement Failed", description: e?.message || "Failed to disburse loan", variant: "destructive" })
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
                    <p className="text-muted-foreground mt-1">Review and disburse funds for approved loans via M-Pesa B2C</p>
                </div>

                {loading ? (
                    <Card className="neumorphic p-6 bg-card border-0">
                        <p className="text-muted-foreground">Loading loans...</p>
                    </Card>
                ) : loans.length === 0 ? (
                    <Card className="neumorphic p-6 bg-card border-0 text-center py-12">
                        <p className="text-muted-foreground text-lg">No loans pending disbursement</p>
                        <p className="text-sm text-muted-foreground mt-2">All approved loans have been disbursed</p>
                    </Card>
                ) : (
                    <div className="space-y-4">
                        {loans.map((loan) => {
                            const client = typeof loan.clientId === 'object' ? loan.clientId : null
                            const clientName = client?.name || "—"
                            const clientPhone = client?.phone || "—"
                            const amount = loan.principal_cents / 100

                            return (
                                <Card key={loan._id} className="neumorphic p-6 bg-card border-0 hover:shadow-lg transition-shadow">
                                    <div className="flex items-center justify-between gap-6">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-6 mb-4 flex-wrap">
                                                <div>
                                                    <p className="text-xs text-muted-foreground">Loan ID</p>
                                                    <p className="font-mono font-semibold text-sm">{loan._id.substring(0, 12)}...</p>
                                                </div>
                                                <div>
                                                    <p className="text-xs text-muted-foreground">Client</p>
                                                    <p className="font-semibold">{clientName}</p>
                                                </div>
                                                <div>
                                                    <p className="text-xs text-muted-foreground">Phone</p>
                                                    <p className="font-semibold flex items-center gap-1">
                                                        <Phone className="w-3 h-3" />
                                                        {clientPhone}
                                                    </p>
                                                </div>
                                                <div>
                                                    <p className="text-xs text-muted-foreground">Status</p>
                                                    <Badge className="bg-green-100 text-green-700 border-green-200">
                                                        {loan.status.toUpperCase()}
                                                    </Badge>
                                                </div>
                                            </div>
                                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                                <div>
                                                    <p className="text-xs text-muted-foreground">Principal Amount</p>
                                                    <p className="font-bold text-primary text-lg">KES {amount.toLocaleString()}</p>
                                                </div>
                                                <div>
                                                    <p className="text-xs text-muted-foreground">Product</p>
                                                    <Badge variant="outline" className="uppercase text-xs">{loan.product}</Badge>
                                                </div>
                                                <div>
                                                    <p className="text-xs text-muted-foreground">Term</p>
                                                    <p className="font-semibold">{loan.term} {loan.product === 'fafa' ? 'weeks' : 'months'}</p>
                                                </div>
                                                <div>
                                                    <p className="text-xs text-muted-foreground">Approved Date</p>
                                                    <p className="font-semibold text-sm">{new Date(loan.approvedAt || loan.createdAt).toLocaleDateString()}</p>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex flex-col gap-2">
                                            <Button
                                                onClick={() => handleDisburse(loan._id)}
                                                disabled={disbursing === loan._id}
                                                className="gap-2 bg-primary text-white hover:bg-primary/90 min-w-[140px]"
                                            >
                                                <DollarSign className="w-4 h-4" />
                                                {disbursing === loan._id ? "Processing..." : "Disburse Now"}
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                onClick={() => router.push(`/loans/${loan._id}`)}
                                                className="text-xs"
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
