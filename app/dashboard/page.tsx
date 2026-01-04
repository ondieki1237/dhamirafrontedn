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
  const canInitiate = role && ["admin", "initiator_admin", "approver_admin"].includes(role)

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Dashboard</h1>
            <p className="text-xs sm:text-sm text-muted-foreground mt-1">Welcome back! Here's your overview</p>
          </div>
        </div>

        {/* Mobile: Quick Actions after welcome, Desktop: hidden here */}
        <div className="lg:hidden">
          <QuickActions />
        </div>

        <DashboardStats />

        {/* Desktop: Recent Loans on left, Quick Actions on right */}
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <RecentLoans />
          </div>
          <div className="hidden lg:block">
            <QuickActions />
          </div>
        </div>

        <ClientsOverview />
      </div>
    </DashboardLayout>
  )
}
