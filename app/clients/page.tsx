"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Plus, Filter, Download } from "lucide-react"
import { apiGet, getCurrentUser } from "@/lib/api"
import { useToast } from "@/hooks/use-toast"

type ClientItem = {
  _id: string
  name: string
  nationalId: string
  phone?: string
  groupId?: { name?: string }
}

export default function ClientsPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [clients, setClients] = useState<ClientItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const user = getCurrentUser()
  const canOnboard = user?.role && ["super_admin", "initiator_admin", "approver_admin", "loan_officer"].includes(user.role)

  useEffect(() => {
    let mounted = true
    ;(async () => {
      try {
        setLoading(true)
        const data = await apiGet<ClientItem[]>("/api/clients")
        if (mounted) setClients(data)
      } catch (e: any) {
        const msg = e?.message || "Failed to load clients"
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
            <h1 className="text-3xl font-bold text-foreground">All Clients</h1>
            <p className="text-muted-foreground mt-1">Manage your client database</p>
          </div>
          {canOnboard && (
            <Button
              onClick={() => router.push("/clients/new")}
              className="gap-2 bg-secondary text-white neumorphic neumorphic-hover border-0"
            >
              <Plus className="w-4 h-4" />
              New Client
            </Button>
          )}
        </div>

        <div className="flex gap-3">
          <Button variant="outline" className="gap-2 bg-transparent">
            <Filter className="w-4 h-4" />
            Filter
          </Button>
          <Button variant="outline" className="gap-2 bg-transparent">
            <Download className="w-4 h-4" />
            Export
          </Button>
        </div>

        <Card className="neumorphic p-6 bg-card border-0">
          <div className="overflow-x-auto">
            {loading ? (
              <p className="text-sm text-muted-foreground">Loading clients…</p>
            ) : error ? (
              <p className="text-sm text-destructive">{error}</p>
            ) : (
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-3 px-4 text-sm font-semibold text-foreground">Client ID</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-foreground">Name</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-foreground">National ID</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-foreground">Phone</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-foreground">Group</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-foreground">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {clients.map((client) => (
                    <tr key={client._id} className="border-b border-border hover:bg-muted/50 transition-colors">
                      <td className="py-4 px-4 font-mono text-sm">{client._id}</td>
                      <td className="py-4 px-4 font-semibold">{client.name}</td>
                      <td className="py-4 px-4 text-muted-foreground">{client.nationalId}</td>
                      <td className="py-4 px-4 text-muted-foreground">{client.phone || "—"}</td>
                      <td className="py-4 px-4 text-muted-foreground">{client.groupId?.name || "—"}</td>
                      <td className="py-4 px-4">
                        <Button variant="ghost" size="sm">
                          View
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </Card>
      </div>
    </DashboardLayout>
  )
}
