"use client"

import { useEffect, useState } from "react"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation"
import { apiGet } from "@/lib/api"
import { useToast } from "@/hooks/use-toast"

type CreditAssessment = {
  _id: string
  loanId: { _id: string; amount: number; client: { name: string } | string } | string
  character: number
  capacity: number
  capital: number
  collateral: number
  conditions: number
  totalScore: number
  officerNotes?: string
  createdAt?: string
}

export default function CreditAssessmentsPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [assessments, setAssessments] = useState<CreditAssessment[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let mounted = true
    ;(async () => {
      try {
        setLoading(true)
        const data = await apiGet<CreditAssessment[]>("/api/credit-assessments")
        if (mounted) setAssessments(data)
      } catch (e: any) {
        const msg = e?.message || "Failed to load credit assessments"
        if (mounted) toast({ title: "Error", description: msg })
      } finally {
        if (mounted) setLoading(false)
      }
    })()
    return () => {
      mounted = false
    }
  }, [toast])

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Credit Assessments</h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1">Review and manage credit evaluations</p>
        </div>

        <Card className="neumorphic p-3 sm:p-6 bg-card border-0">
          {loading ? (
            <p className="text-xs sm:text-sm text-muted-foreground">Loading assessments…</p>
          ) : assessments.length === 0 ? (
            <p className="text-xs sm:text-sm text-muted-foreground">No credit assessments found</p>
          ) : (
            <>
              {/* Desktop Table View */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left py-3 px-4 text-xs sm:text-sm font-semibold text-foreground">Loan ID</th>
                      <th className="text-left py-3 px-4 text-xs sm:text-sm font-semibold text-foreground">Client</th>
                      <th className="text-left py-3 px-4 text-xs sm:text-sm font-semibold text-foreground">Amount</th>
                      <th className="text-left py-3 px-4 text-xs sm:text-sm font-semibold text-foreground">Score</th>
                      <th className="text-left py-3 px-4 text-xs sm:text-sm font-semibold text-foreground">Status</th>
                      <th className="text-left py-3 px-4 text-xs sm:text-sm font-semibold text-foreground">Date</th>
                      <th className="text-left py-3 px-4 text-xs sm:text-sm font-semibold text-foreground">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {assessments.map((assessment) => {
                      const loanId = typeof assessment.loanId === "string" ? assessment.loanId : assessment.loanId._id
                      const amount =
                        typeof assessment.loanId === "string" ? "—" : assessment.loanId.amount
                      const clientName =
                        typeof assessment.loanId === "string"
                          ? "—"
                          : typeof assessment.loanId.client === "string"
                          ? assessment.loanId.client
                          : assessment.loanId.client.name
                      const created = assessment.createdAt
                        ? new Date(assessment.createdAt).toISOString().slice(0, 10)
                        : "—"
                      const meetsMin = assessment.totalScore >= 18
                      return (
                        <tr key={assessment._id} className="border-b border-border hover:bg-muted/50 transition-colors">
                          <td className="py-4 px-4 font-mono text-xs sm:text-sm">{loanId}</td>
                          <td className="py-4 px-4 font-semibold text-xs sm:text-sm">{clientName}</td>
                          <td className="py-4 px-4 font-semibold text-secondary text-xs sm:text-sm">
                            {typeof amount === "number" ? `KES ${amount.toLocaleString()}` : amount}
                          </td>
                          <td className="py-4 px-4">
                            <span className="text-lg sm:text-xl font-bold text-primary">{assessment.totalScore}/25</span>
                          </td>
                          <td className="py-4 px-4">
                            <Badge
                              variant="outline"
                              className={meetsMin ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}
                            >
                              {meetsMin ? "Approved" : "Below Min"}
                            </Badge>
                          </td>
                          <td className="py-4 px-4 text-muted-foreground text-xs sm:text-sm">{created}</td>
                          <td className="py-4 px-4">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => router.push(`/loans/${loanId}`)}
                              className="text-xs"
                            >
                              View Loan
                            </Button>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>

              {/* Mobile Card View */}
              <div className="md:hidden space-y-3">
                {assessments.map((assessment) => {
                  const loanId = typeof assessment.loanId === "string" ? assessment.loanId : assessment.loanId._id
                  const amount =
                    typeof assessment.loanId === "string" ? "—" : assessment.loanId.amount
                  const clientName =
                    typeof assessment.loanId === "string"
                      ? "—"
                      : typeof assessment.loanId.client === "string"
                      ? assessment.loanId.client
                      : assessment.loanId.client.name
                  const created = assessment.createdAt
                    ? new Date(assessment.createdAt).toISOString().slice(0, 10)
                    : "—"
                  const meetsMin = assessment.totalScore >= 18
                  return (
                    <div key={assessment._id} className="p-3 rounded-lg bg-muted/20 border border-border space-y-2">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-mono text-muted-foreground truncate">{loanId}</p>
                          <p className="text-sm font-semibold text-foreground mt-1">{clientName}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-lg font-bold text-primary">{assessment.totalScore}/25</p>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div>
                          <p className="text-muted-foreground">Amount</p>
                          <p className="font-semibold text-secondary">{typeof amount === "number" ? `KES ${amount.toLocaleString()}` : amount}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Date</p>
                          <p className="font-semibold">{created}</p>
                        </div>
                      </div>
                      <div className="flex items-center justify-between pt-2 border-t border-border">
                        <Badge
                          variant="outline"
                          className={meetsMin ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}
                        >
                          {meetsMin ? "Approved" : "Below Min"}
                        </Badge>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => router.push(`/loans/${loanId}`)}
                          className="text-xs h-8"
                        >
                          View Loan
                        </Button>
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
