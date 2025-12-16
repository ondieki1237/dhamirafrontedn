"use client"

import { DashboardLayout } from "@/components/dashboard-layout"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"
import { useRouter, useParams } from "next/navigation"
import { useState, useEffect } from "react"
import { apiPostJson, apiGet } from "@/lib/api"
import { useToast } from "@/hooks/use-toast"

type Loan = {
  _id: string
  status: string
}

export default function CreditAssessmentPage() {
  const router = useRouter()
  const params = useParams()
  const { toast } = useToast()
  const loanId = params.id as string

  const [loan, setLoan] = useState<Loan | null>(null)
  const [form, setForm] = useState({
    character: 3,
    capacity: 3,
    capital: 3,
    collateral: 3,
    conditions: 3,
    officerNotes: "",
  })
  const [submitting, setSubmitting] = useState(false)
  const [loading, setLoading] = useState(true)

  const totalScore = form.character + form.capacity + form.capital + form.collateral + form.conditions

  useEffect(() => {
    let mounted = true
    ;(async () => {
      try {
        const loanData = await apiGet<Loan>(`/api/loans/${loanId}`)
        if (mounted) {
          if (loanData.status !== "initiated") {
            toast({ title: "Error", description: "Credit assessment can only be done on initiated loans" })
            router.push(`/loans/${loanId}`)
            return
          }
          setLoan(loanData)
          setLoading(false)
        }
      } catch (e: any) {
        if (mounted) {
          toast({ title: "Error", description: e?.message || "Failed to load loan" })
          router.push("/loans")
        }
      }
    })()
    return () => {
      mounted = false
    }
  }, [loanId, router, toast])

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (totalScore < 18) {
      if (!window.confirm("Total score is below the minimum requirement of 18. Continue anyway?")) {
        return
      }
    }

    try {
      setSubmitting(true)
      await apiPostJson("/api/credit-assessments", {
        loanId,
        ...form,
      })
      toast({ title: "Credit assessment completed" })
      router.push(`/loans/${loanId}`)
    } catch (e: any) {
      toast({ title: "Error", description: e?.message || "Failed to save assessment" })
    } finally {
      setSubmitting(false)
    }
  }

  const renderScoreInput = (field: keyof typeof form, label: string, description: string) => {
    if (field === "officerNotes") return null
    return (
      <Card key={field} className="neumorphic-inset p-6 bg-background border-0">
        <div className="mb-3">
          <h3 className="font-bold text-lg text-foreground">{label}</h3>
          <p className="text-sm text-muted-foreground">{description}</p>
        </div>
        <div className="flex items-center gap-4">
          <input
            type="range"
            min="1"
            max="5"
            value={form[field] as number}
            onChange={(e) => setForm({ ...form, [field]: Number(e.target.value) })}
            className="flex-1"
          />
          <div className="w-16 h-16 rounded-full bg-primary flex items-center justify-center neumorphic">
            <span className="text-2xl font-bold text-white">{form[field] as number}</span>
          </div>
        </div>
      </Card>
    )
  }

  if (loading) {
    return (
      <DashboardLayout>
        <div className="max-w-4xl mx-auto">
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <Button variant="ghost" onClick={() => router.back()} className="mb-4 gap-2">
            <ArrowLeft className="w-4 h-4" />
            Back
          </Button>
          <h1 className="text-3xl font-bold text-foreground">Credit Assessment (5 C's)</h1>
          <p className="text-muted-foreground mt-1">Evaluate creditworthiness using the 5 C's framework</p>
        </div>

        <Card className="neumorphic p-8 bg-card border-0 mb-6">
          <div className="text-center">
            <p className="text-sm text-muted-foreground mb-2">Total Score</p>
            <p className="text-5xl font-bold text-secondary mb-2">{totalScore}/25</p>
            {totalScore >= 18 ? (
              <p className="text-sm text-green-600 font-semibold">✓ Meets minimum requirement (18)</p>
            ) : (
              <p className="text-sm text-destructive font-semibold">✗ Below minimum requirement (18)</p>
            )}
          </div>
        </Card>

        <form className="space-y-6" onSubmit={onSubmit}>
          {renderScoreInput("character", "Character", "Borrower's reputation and track record")}
          {renderScoreInput("capacity", "Capacity", "Ability to repay the loan from income")}
          {renderScoreInput("capital", "Capital", "Borrower's savings and financial cushion")}
          {renderScoreInput("collateral", "Collateral", "Assets pledged to secure the loan")}
          {renderScoreInput("conditions", "Conditions", "Economic and market conditions")}

          <div>
            <label className="block text-sm font-semibold text-foreground mb-2">Officer Notes</label>
            <textarea
              rows={4}
              value={form.officerNotes}
              onChange={(e) => setForm({ ...form, officerNotes: e.target.value })}
              className="w-full px-4 py-3 bg-background rounded-xl border-0 neumorphic-inset focus:outline-none focus:ring-2 focus:ring-primary transition-all"
              placeholder="Additional observations or recommendations..."
            />
          </div>

          <div className="flex gap-4 justify-end">
            <Button type="button" variant="outline" onClick={() => router.back()} className="px-8 py-3">
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={submitting}
              className="px-8 py-3 bg-primary text-white neumorphic neumorphic-hover border-0"
            >
              {submitting ? "Saving..." : "Submit Assessment"}
            </Button>
          </div>
        </form>
      </div>
    </DashboardLayout>
  )
}
