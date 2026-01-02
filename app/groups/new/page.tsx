"use client"

import { DashboardLayout } from "@/components/dashboard-layout"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Plus, X, Shield, UserCheck } from "lucide-react"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { apiGet, apiPostJson, getCurrentUser } from "@/lib/api"
import { useToast } from "@/hooks/use-toast"

type Client = {
  _id: string
  name: string
  nationalId: string
}

export default function NewGroupPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [clients, setClients] = useState<Client[]>([])
  const [branches, setBranches] = useState<{ _id: string; name: string }[]>([])
  const [form, setForm] = useState({
    name: "",
    meetingDay: "Monday",
    meetingTime: "10:00",
    loanOfficerId: "",
    branchId: "",
    chairperson: "",
    secretary: "",
    treasurer: "",
  })

  const [blocked, setBlocked] = useState(false)
  useEffect(() => {
    const user = getCurrentUser()
    if (user?._id) setForm((f) => ({ ...f, loanOfficerId: user._id }))
    if (!user?.role || !["super_admin", "loan_officer"].includes(user.role)) {
      setBlocked(true)
    }

    // Fetch branches and clients
    ; (async () => {
      try {
        const branchesData = await apiGet<any>("/api/branches")
        setBranches(Array.isArray(branchesData) ? branchesData : branchesData?.data || [])

        const clientsData = await apiGet<any>("/api/clients?limit=1000")
        setClients(Array.isArray(clientsData) ? clientsData : clientsData?.data || [])
      } catch (e) {
        // optional
      }
    })()
  }, [])

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (blocked) {
      toast({ title: "Not allowed", description: "You do not have permission to create groups." })
      return
    }

    // Validate mandatory signatories
    if (!form.chairperson || !form.secretary || !form.treasurer) {
      toast({ 
        title: "Missing Signatories", 
        description: "All three signatory roles (Chairperson, Secretary, Treasurer) are mandatory.",
        variant: "destructive" 
      })
      return
    }

    // Validate unique signatories
    if (form.chairperson === form.secretary || form.chairperson === form.treasurer || form.secretary === form.treasurer) {
      toast({ 
        title: "Invalid Signatories", 
        description: "Each signatory role must be assigned to a different client.",
        variant: "destructive" 
      })
      return
    }

    if (!form.branchId) {
      toast({ 
        title: "Missing Branch", 
        description: "Branch is required.",
        variant: "destructive" 
      })
      return
    }

    try {
      const payload = {
        name: form.name,
        meetingDay: form.meetingDay,
        meetingTime: form.meetingTime,
        loanOfficerId: form.loanOfficerId,
        branchId: form.branchId,
        signatories: [
          { role: "chairperson", clientId: form.chairperson },
          { role: "secretary", clientId: form.secretary },
          { role: "treasurer", clientId: form.treasurer },
        ],
      }
      await apiPostJson("/api/groups", payload)
      toast({ title: "Group created", description: "Group created successfully and awaiting approval." })
      router.push("/groups")
    } catch (e: any) {
      toast({ title: "Error", description: e?.message || "Failed to create group" })
    }
  }

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto px-4 sm:px-0">
        <div className="mb-4 sm:mb-6">
          <Button variant="ghost" onClick={() => router.back()} className="mb-3 sm:mb-4 gap-2 h-8 sm:h-10">
            <ArrowLeft className="w-4 h-4" />
            Back
          </Button>
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Create Group</h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1">Set up a new lending group</p>
          {blocked && <p className="text-xs text-destructive mt-2">You do not have permission to create groups.</p>}
        </div>

        <Card className="neumorphic p-4 sm:p-8 bg-card border-0">
          <form className="space-y-4 sm:space-y-6" onSubmit={onSubmit}>
            <div>
              <label className="block text-xs sm:text-sm font-semibold text-foreground mb-2">Group Name *</label>
              <input
                type="text"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="w-full px-3 sm:px-4 py-2 sm:py-3 bg-background rounded-xl border-0 neumorphic-inset focus:outline-none focus:ring-2 focus:ring-secondary transition-all text-sm"
                placeholder="Enter group name"
                required
              />
            </div>

            <div>
              <label className="block text-xs sm:text-sm font-semibold text-foreground mb-2">Branch *</label>
              <select
                value={form.branchId}
                onChange={(e) => setForm({ ...form, branchId: e.target.value })}
                className="w-full px-3 sm:px-4 py-2 sm:py-3 bg-background rounded-xl border-0 neumorphic-inset focus:outline-none focus:ring-2 focus:ring-secondary transition-all text-sm"
                required
              >
                <option value="">Select branch (required)</option>
                {branches.map((b) => (
                  <option key={b._id} value={b._id}>
                    {b.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-6">
              <div>
                <label className="block text-xs sm:text-sm font-semibold text-foreground mb-2">Meeting Day *</label>
                <select
                  value={form.meetingDay}
                  onChange={(e) => setForm({ ...form, meetingDay: e.target.value })}
                  className="w-full px-3 sm:px-4 py-2 sm:py-3 bg-background rounded-xl border-0 neumorphic-inset focus:outline-none text-sm"
                >
                  {[
                    "Monday",
                    "Tuesday",
                    "Wednesday",
                    "Thursday",
                    "Friday",
                    "Saturday",
                    "Sunday",
                  ].map((d) => (
                    <option key={d} value={d}>
                      {d}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs sm:text-sm font-semibold text-foreground mb-2">Meeting Time *</label>
                <input
                  type="time"
                  value={form.meetingTime}
                  onChange={(e) => setForm({ ...form, meetingTime: e.target.value })}
                  className="w-full px-3 sm:px-4 py-2 sm:py-3 bg-background rounded-xl border-0 neumorphic-inset text-sm"
                />
              </div>
            </div>

            {/* Mandatory Signatories Section */}
            <div className="pt-4 border-t border-border">
              <div className="flex items-center gap-2 mb-4">
                <Shield className="w-5 h-5 text-primary" />
                <h3 className="text-lg font-bold text-foreground">Mandatory Signatories</h3>
              </div>
              <p className="text-xs text-muted-foreground mb-4">
                Each group must have exactly 3 different clients assigned as signatories. All roles are required.
              </p>

              <div className="space-y-4">
                <div>
                  <label className="block text-xs sm:text-sm font-semibold text-foreground mb-2 flex items-center gap-2">
                    <UserCheck className="w-4 h-4 text-primary" />
                    Chairperson *
                  </label>
                  <select
                    value={form.chairperson}
                    onChange={(e) => setForm({ ...form, chairperson: e.target.value })}
                    className="w-full px-3 sm:px-4 py-2 sm:py-3 bg-background rounded-xl border-0 neumorphic-inset focus:outline-none focus:ring-2 focus:ring-primary transition-all text-sm"
                    required
                  >
                    <option value="">Select Chairperson</option>
                    {clients.map((c) => (
                      <option key={c._id} value={c._id} disabled={c._id === form.secretary || c._id === form.treasurer}>
                        {c.name} - {c.nationalId}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs sm:text-sm font-semibold text-foreground mb-2 flex items-center gap-2">
                    <UserCheck className="w-4 h-4 text-secondary" />
                    Secretary *
                  </label>
                  <select
                    value={form.secretary}
                    onChange={(e) => setForm({ ...form, secretary: e.target.value })}
                    className="w-full px-3 sm:px-4 py-2 sm:py-3 bg-background rounded-xl border-0 neumorphic-inset focus:outline-none focus:ring-2 focus:ring-secondary transition-all text-sm"
                    required
                  >
                    <option value="">Select Secretary</option>
                    {clients.map((c) => (
                      <option key={c._id} value={c._id} disabled={c._id === form.chairperson || c._id === form.treasurer}>
                        {c.name} - {c.nationalId}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs sm:text-sm font-semibold text-foreground mb-2 flex items-center gap-2">
                    <UserCheck className="w-4 h-4 text-accent" />
                    Treasurer *
                  </label>
                  <select
                    value={form.treasurer}
                    onChange={(e) => setForm({ ...form, treasurer: e.target.value })}
                    className="w-full px-3 sm:px-4 py-2 sm:py-3 bg-background rounded-xl border-0 neumorphic-inset focus:outline-none focus:ring-2 focus:ring-accent transition-all text-sm"
                    required
                  >
                    <option value="">Select Treasurer</option>
                    {clients.map((c) => (
                      <option key={c._id} value={c._id} disabled={c._id === form.chairperson || c._id === form.secretary}>
                        {c.name} - {c.nationalId}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-end pt-2">
              <Button type="button" variant="outline" onClick={() => router.back()} className="px-6 sm:px-8 py-2 sm:py-3 text-sm sm:text-base">
                Cancel
              </Button>
              <Button type="submit" disabled={blocked} className="px-6 sm:px-8 py-2 sm:py-3 bg-secondary text-white neumorphic neumorphic-hover border-0 text-sm sm:text-base disabled:opacity-50">
                Create Group
              </Button>
            </div>
          </form>
        </Card>
      </div>
    </DashboardLayout>
  )
}
