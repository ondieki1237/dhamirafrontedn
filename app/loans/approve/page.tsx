"use client"

import { DashboardLayout } from "@/components/dashboard-layout"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Check, X } from "lucide-react"
import { useRouter } from "next/navigation"

const pendingLoans = [
  {
    id: "L001",
    client: "John Doe",
    amount: 50000,
    type: "Individual",
    date: "2024-01-10",
    duration: 12,
  },
  {
    id: "L002",
    client: "Jane Smith",
    amount: 75000,
    type: "Group",
    date: "2024-01-12",
    duration: 18,
  },
]

export default function ApproveLoanPage() {
  const router = useRouter()

  return (
    <DashboardLayout>
      <div className="max-w-6xl mx-auto">
        <div className="mb-6">
          <Button variant="ghost" onClick={() => router.back()} className="mb-4 gap-2">
            <ArrowLeft className="w-4 h-4" />
            Back
          </Button>
          <h1 className="text-3xl font-bold text-foreground">Approve Loans</h1>
          <p className="text-muted-foreground mt-1">Review and approve pending loan applications</p>
        </div>

        <div className="space-y-4">
          {pendingLoans.map((loan) => (
            <Card key={loan.id} className="neumorphic p-6 bg-card border-0">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-4 mb-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Loan ID</p>
                      <p className="font-bold text-foreground">{loan.id}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Client</p>
                      <p className="font-bold text-foreground">{loan.client}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Amount</p>
                      <p className="font-bold text-primary">KSH {loan.amount.toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Type</p>
                      <p className="font-semibold text-foreground">{loan.type}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Duration</p>
                      <p className="font-semibold text-foreground">{loan.duration} months</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Date</p>
                      <p className="font-semibold text-foreground">{loan.date}</p>
                    </div>
                  </div>
                </div>

                <div className="flex gap-3">
                  <Button className="gap-2 bg-red-500 text-white neumorphic neumorphic-hover border-0 hover:bg-red-600">
                    <X className="w-4 h-4" />
                    Reject
                  </Button>
                  <Button className="gap-2 bg-primary text-white neumorphic neumorphic-hover border-0">
                    <Check className="w-4 h-4" />
                    Approve
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </DashboardLayout>
  )
}
