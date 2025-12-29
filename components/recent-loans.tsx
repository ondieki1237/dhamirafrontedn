"use client"

import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { MoreVertical } from "lucide-react"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"

type RecentLoan = {
  id: string
  client: string
  type?: string
  amount?: string
  amountCents?: number
  status?: string
  date?: string
}

const recentStatusColors = {
  initiated: "bg-blue-100 text-blue-700 border-blue-200",
  approved: "bg-secondary/10 text-secondary border-secondary/20",
  disbursed: "bg-primary/10 text-primary border-primary/20",
  repaid: "bg-green-100 text-green-700 border-green-200",
  defaulted: "bg-destructive/10 text-destructive border-destructive/20",
}

const statusColors = {
  initiated: "bg-blue-100 text-blue-700 border-blue-200",
  approved: "bg-secondary/10 text-secondary border-secondary/20",
  disbursed: "bg-primary/10 text-primary border-primary/20",
  repaid: "bg-green-100 text-green-700 border-green-200",
  defaulted: "bg-destructive/10 text-destructive border-destructive/20",
}

export function RecentLoans() {
  const router = useRouter()
  const [loans, setLoans] = useState<RecentLoan[]>([])
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let mounted = true
    ;(async () => {
      try {
        const API = (process.env.NEXT_PUBLIC_API_URL || "").replace(/\/+$/, "")
        const url = API ? `${API}/api/loans?limit=5` : "/api/loans?limit=5"
        const res = await fetch(url)
        if (!res.ok) throw new Error(`loans endpoint ${res.status}`)
        const data = await res.json()
        if (!mounted) return
        const list: RecentLoan[] = (Array.isArray(data) ? data : data?.items || data?.data || []).map((l: any) => ({
          id: l._id || l.id || l.loanId || "",
          client: l.client?.name || l.clientName || l.client || (l.applicant && (l.applicant.name || l.applicant)) || "Unknown",
          type: l.type || l.product || l.loanType || "",
          amount: l.amountString || (l.amountKES ? `KES ${l.amountKES}` : undefined),
          amountCents: l.amountCents,
          status: l.status,
          date: l.createdAt ? new Date(l.createdAt).toLocaleDateString() : l.date || "",
        }))
        setLoans(list)
      } catch (e: any) {
        setError(e?.message || "Failed to load loans")
      }
    })()
    return () => {
      mounted = false
    }
  }, [])

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
        {error && <div className="text-sm text-destructive">{error}</div>}
        {(loans.length === 0 && !error) ? (
          <div className="text-sm text-muted-foreground">No recent loans</div>
        ) : (
          loans.map((loan, index) => (
            <div
              key={loan.id || index}
              className="p-4 rounded-lg neumorphic-inset bg-background hover:shadow-md transition-all duration-200 group"
              style={{ animationDelay: `${index * 50}ms` }}
            >
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="font-semibold text-foreground">{loan.client}</h3>
                    <Badge variant="outline" className={recentStatusColors[loan.status as keyof typeof recentStatusColors] || ""}>
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
                  <p className="text-lg font-bold text-secondary">{loan.amount ?? (loan.amountCents ? `KES ${Number(loan.amountCents / 100).toLocaleString()}` : "—")}</p>
                  <button className="w-8 h-8 rounded-lg neumorphic-hover flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <MoreVertical className="w-4 h-4 text-muted-foreground" />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </Card>
  )
}
