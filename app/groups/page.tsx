"use client"

import { useEffect, useState } from "react"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Plus, Users, TrendingUp } from "lucide-react"
import { useRouter } from "next/navigation"
import { apiGet } from "@/lib/api"
import { useToast } from "@/hooks/use-toast"

type GroupItem = {
  _id: string
  name: string
  // Backend may include stats; we’ll show placeholders if missing
  membersCount?: number
  activeLoansCount?: number
  progress?: number
  totalLent?: number
}

export default function GroupsPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [groups, setGroups] = useState<GroupItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let mounted = true
    ;(async () => {
      try {
        setLoading(true)
        const data = await apiGet<GroupItem[]>("/api/groups")
        if (mounted) setGroups(data)
      } catch (e: any) {
        const msg = e?.message || "Failed to load groups"
        if (mounted) setError(msg)
        toast({ title: "Error", description: msg })
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
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">All Groups</h1>
            <p className="text-muted-foreground mt-1">Manage lending groups and their performance</p>
          </div>
          <Button
            onClick={() => router.push("/groups/new")}
            className="gap-2 bg-secondary text-white neumorphic neumorphic-hover border-0"
          >
            <Plus className="w-4 h-4" />
            New Group
          </Button>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {loading && <Card className="neumorphic p-6 border-0">Loading groups…</Card>}
          {error && !loading && (
            <Card className="neumorphic p-6 border-0 text-destructive">{error}</Card>
          )}
          {!loading && !error && groups.map((group, index) => (
            <Card
              key={group._id}
              className="neumorphic p-6 bg-card border-0 hover:shadow-lg transition-all duration-200 cursor-pointer"
              style={{ animationDelay: `${index * 50}ms` }}
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <p className="text-xs text-muted-foreground mb-1">{group._id}</p>
                  <h3 className="font-bold text-foreground mb-2">{group.name}</h3>
                  <div className="flex flex-wrap gap-3 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Users className="w-4 h-4" />
                      {group.membersCount ?? "—"} members
                    </span>
                    <span className="flex items-center gap-1">
                      <TrendingUp className="w-4 h-4" />
                      {group.activeLoansCount ?? "—"} loans
                    </span>
                  </div>
                </div>
                <div className="w-12 h-12 rounded-xl neumorphic flex items-center justify-center bg-secondary/10">
                  <Users className="w-6 h-6 text-secondary" />
                </div>
              </div>

              <div className="space-y-3">
                <div>
                  <div className="flex items-center justify-between text-sm mb-2">
                    <span className="text-muted-foreground">Total Lent</span>
                    <span className="font-bold text-primary">KES {(group.totalLent ?? 0).toLocaleString()}</span>
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between text-sm mb-2">
                    <span className="text-muted-foreground">Activity</span>
                    <span className="font-semibold text-secondary">{group.progress ?? 0}%</span>
                  </div>
                  <Progress value={group.progress ?? 0} className="h-2 bg-muted" />
                </div>
              </div>

              <Button variant="outline" className="w-full mt-4 bg-transparent">
                View Details
              </Button>
            </Card>
          ))}
        </div>
      </div>
    </DashboardLayout>
  )
}
