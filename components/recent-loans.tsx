"use client"

import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { MoreVertical } from "lucide-react"
import { useRouter } from "next/navigation"

const loans = [
  {
    id: "L-2024-001",
    client: "Jane Wanjiru",
    type: "Business",
    amount: "KES 50,000",
    status: "approved",
    date: "2024-01-15",
  },
  {
    id: "L-2024-002",
    client: "John Kamau",
    type: "Emergency",
    amount: "KES 8,000",
    status: "disbursed",
    date: "2024-01-14",
  },
  {
    id: "L-2024-003",
    client: "Mary Atieno",
    type: "School Fees",
    amount: "KES 25,000",
    status: "initiated",
    date: "2024-01-14",
  },
  {
    id: "L-2024-004",
    client: "Peter Omondi",
    type: "Business",
    amount: "KES 75,000",
    status: "repaid",
    date: "2024-01-13",
  },
]

const statusColors = {
  initiated: "bg-blue-100 text-blue-700 border-blue-200",
  approved: "bg-secondary/10 text-secondary border-secondary/20",
  disbursed: "bg-primary/10 text-primary border-primary/20",
  repaid: "bg-green-100 text-green-700 border-green-200",
  defaulted: "bg-destructive/10 text-destructive border-destructive/20",
}

export function RecentLoans() {
  const router = useRouter()

  return (
    <Card className="neumorphic p-6 bg-card border-0">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold text-foreground">Recent Loans</h2>
          <p className="text-sm text-muted-foreground mt-1">Latest loan applications and updates</p>
        </div>
        <button onClick={() => router.push("/loans")} className="text-sm text-primary font-medium hover:underline">
          View All
        </button>
      </div>

      <div className="space-y-3">
        {loans.map((loan, index) => (
          <div
            key={loan.id}
            className="p-4 rounded-lg neumorphic-inset bg-background hover:shadow-md transition-all duration-200 group"
            style={{ animationDelay: `${index * 50}ms` }}
          >
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <h3 className="font-semibold text-foreground">{loan.client}</h3>
                  <Badge variant="outline" className={statusColors[loan.status as keyof typeof statusColors]}>
                    {loan.status}
                  </Badge>
                </div>
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <span className="font-mono">{loan.id}</span>
                  <span>•</span>
                  <span>{loan.type}</span>
                  <span>•</span>
                  <span>{loan.date}</span>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <p className="text-lg font-bold text-secondary">{loan.amount}</p>
                <button className="w-8 h-8 rounded-lg neumorphic-hover flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <MoreVertical className="w-4 h-4 text-muted-foreground" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </Card>
  )
}
