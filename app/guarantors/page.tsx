"use client"

import { useEffect, useState } from "react"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Check, X } from "lucide-react"
import { apiGet, apiPutJson } from "@/lib/api"
import { useToast } from "@/hooks/use-toast"

type Guarantor = {
  _id: string
  loanId: { _id: string; amount: number; type: string } | string
  clientId: { name: string; nationalId: string } | string
  relationship: string
  status: "pending" | "accepted" | "rejected"
  createdAt?: string
}

export default function GuarantorsPage() {
  const { toast } = useToast()
  const [guarantors, setGuarantors] = useState<Guarantor[]>([])
  const [loading, setLoading] = useState(true)

  const fetchGuarantors = async () => {
    try {
      setLoading(true)
      const data = await apiGet<Guarantor[]>("/api/guarantors")
      setGuarantors(data)
    } catch (e: any) {
      toast({ title: "Error", description: e?.message || "Failed to load guarantors" })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchGuarantors()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleAccept = async (id: string) => {
    try {
      await apiPutJson(`/api/guarantors/${id}/accept`, {})
      toast({ title: "Guarantor accepted" })
      fetchGuarantors()
    } catch (e: any) {
      toast({ title: "Error", description: e?.message || "Failed to accept guarantor" })
    }
  }

  const handleReject = async (id: string) => {
    if (!window.confirm("Reject this guarantor?")) return
    try {
      await apiPutJson(`/api/guarantors/${id}/reject`, {})
      toast({ title: "Guarantor rejected" })
      fetchGuarantors()
    } catch (e: any) {
      toast({ title: "Error", description: e?.message || "Failed to reject guarantor" })
    }
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Guarantors</h1>
          <p className="text-muted-foreground mt-1">Manage loan guarantors and their commitments</p>
        </div>

        <Card className="neumorphic p-6 bg-card border-0">
          <div className="overflow-x-auto">
            {loading ? (
              <p className="text-sm text-muted-foreground">Loading guarantors…</p>
            ) : guarantors.length === 0 ? (
              <p className="text-sm text-muted-foreground">No guarantors found</p>
            ) : (
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-3 px-4 text-sm font-semibold text-foreground">Guarantor</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-foreground">Loan ID</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-foreground">Loan Amount</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-foreground">Relationship</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-foreground">Status</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-foreground">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {guarantors.map((g) => {
                    const clientName = typeof g.clientId === "string" ? g.clientId : g.clientId.name
                    const loanId = typeof g.loanId === "string" ? g.loanId : g.loanId._id
                    const loanAmount = typeof g.loanId === "string" ? "—" : g.loanId.amount
                    const statusColor =
                      g.status === "accepted"
                        ? "bg-green-100 text-green-700"
                        : g.status === "rejected"
                        ? "bg-red-100 text-red-700"
                        : "bg-yellow-100 text-yellow-700"
                    return (
                      <tr key={g._id} className="border-b border-border hover:bg-muted/50 transition-colors">
                        <td className="py-4 px-4 font-semibold">{clientName}</td>
                        <td className="py-4 px-4 font-mono text-sm">{loanId}</td>
                        <td className="py-4 px-4 font-semibold text-secondary">
                          {typeof loanAmount === "number" ? `KES ${loanAmount.toLocaleString()}` : loanAmount}
                        </td>
                        <td className="py-4 px-4 text-muted-foreground">{g.relationship}</td>
                        <td className="py-4 px-4">
                          <Badge variant="outline" className={statusColor}>
                            {g.status}
                          </Badge>
                        </td>
                        <td className="py-4 px-4">
                          {g.status === "pending" && (
                            <div className="flex gap-2">
                              <Button size="sm" variant="ghost" onClick={() => handleAccept(g._id)} className="text-green-600">
                                <Check className="w-4 h-4" />
                              </Button>
                              <Button size="sm" variant="ghost" onClick={() => handleReject(g._id)} className="text-red-600">
                                <X className="w-4 h-4" />
                              </Button>
                            </div>
                          )}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            )}
          </div>
        </Card>
      </div>
    </DashboardLayout>
  )
}
