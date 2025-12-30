"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { DashboardStats } from "@/components/dashboard-stats"
import { RecentLoans } from "@/components/recent-loans"
import { QuickActions } from "@/components/quick-actions"
import { ClientsOverview } from "@/components/clients-overview"
import { Plus } from "lucide-react"
import { getCurrentUser } from "@/lib/api"

export default function DashboardPage() {
  const router = useRouter()
  const [role, setRole] = useState<string | null>(null)
  useEffect(() => {
    const user = getCurrentUser()
    setRole(user?.role || null)
  }, [])
  const canInitiate = role && ["super_admin", "initiator_admin"].includes(role)

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Dashboard</h1>
            <p className="text-xs sm:text-sm text-muted-foreground mt-1">Welcome back! Here's your overview</p>
          </div>
        </div>

        {canInitiate && (
          <Card className="neumorphic p-3 sm:p-4 bg-card border-0">
            <div className="flex">
              <Button
                onClick={() => router.push("/loans/initiate")}
                className="gap-2 bg-primary text-white neumorphic neumorphic-hover border-0 w-full sm:w-auto text-sm sm:text-base"
              >
                <Plus className="w-4 h-4" />
                New Loan
              </Button>
            </div>
          </Card>
        )}

        <DashboardStats />

        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <RecentLoans />
          </div>
          <div>
            <QuickActions />
          </div>
        </div>

        <ClientsOverview />
      </div>
    </DashboardLayout>
  )
}
