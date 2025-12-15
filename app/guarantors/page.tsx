"use client"

import { DashboardLayout } from "@/components/dashboard-layout"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

export default function GuarantorsPage() {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Guarantors</h1>
          <p className="text-muted-foreground mt-1">Manage loan guarantors and their commitments</p>
        </div>

        <Card className="neumorphic p-12 bg-card border-0 text-center">
          <div className="max-w-md mx-auto">
            <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-primary/10 flex items-center justify-center">
              <span className="text-3xl">🤝</span>
            </div>
            <h2 className="text-2xl font-bold text-foreground mb-2">Guarantor Management</h2>
            <p className="text-muted-foreground mb-6">
              Manage guarantor information, track guarantor relationships, and monitor guarantee obligations.
            </p>
            <Badge variant="outline" className="bg-secondary/10 text-secondary border-secondary/20">
              Coming Soon
            </Badge>
          </div>
        </Card>
      </div>
    </DashboardLayout>
  )
}
