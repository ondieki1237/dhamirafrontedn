"use client"

import { Card } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Users, TrendingUp } from "lucide-react"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { apiGet } from "@/lib/api"

type GroupStat = {
  id?: string
  name: string
  members: number
  loans: number
  progress: number
}

export function ClientsOverview() {
  const router = useRouter()
  const [groups, setGroups] = useState<GroupStat[]>([])
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let mounted = true
      ; (async () => {
        try {
          const data = await apiGet<any>("/api/groups?limit=6")
          if (!mounted) return
          const list = (Array.isArray(data) ? data : data?.items || data?.data || []).map((g: any) => {
            const members = g.members?.length ?? g.memberCount ?? g.membersCount ?? 0
            const loans = g.loans?.length ?? g.loansCount ?? g.loanCount ?? 0
            const progress = g.activityProgress ?? (members ? Math.round((loans / members) * 100) : 0)
            return {
              id: g._id || g.id,
              name: g.name || g.groupName || "Unnamed Group",
              members,
              loans,
              progress,
            }
          })
          setGroups(list)
        } catch (e: any) {
          setError(e?.message || "Failed to load groups")
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
          <h2 className="text-xl font-bold text-foreground">Active Groups</h2>
          <p className="text-sm text-muted-foreground mt-1">Group performance and activity</p>
        </div>
        <button onClick={() => router.push("/groups")} className="text-sm text-primary font-medium hover:underline">
          View All Groups
        </button>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {error && <div className="text-sm text-destructive">{error}</div>}
        {(groups.length === 0 && !error) ? (
          <div className="text-sm text-muted-foreground">No active groups</div>
        ) : (
          groups.map((group, index) => (
            <div
              key={group.id || group.name}
              className="p-5 rounded-lg neumorphic-inset bg-background hover:shadow-md transition-all duration-200"
              style={{ animationDelay: `${index * 50}ms` }}
            >
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="font-semibold text-foreground mb-1">{group.name}</h3>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Users className="w-4 h-4" />
                      {group.members} members
                    </span>
                    <span className="flex items-center gap-1">
                      <TrendingUp className="w-4 h-4" />
                      {group.loans} loans
                    </span>
                  </div>
                </div>
                <div className="w-12 h-12 rounded-xl neumorphic flex items-center justify-center bg-secondary/10">
                  <Users className="w-6 h-6 text-secondary" />
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Activity</span>
                  <span className="font-semibold text-secondary">{group.progress}%</span>
                </div>
                <Progress value={group.progress} className="h-2 bg-muted" />
              </div>
            </div>
          ))
        )}
      </div>
    </Card>
  )
}
