"use client"

import { DashboardLayout } from "@/components/dashboard-layout"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Plus, X } from "lucide-react"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { apiPostJson, getCurrentUser } from "@/lib/api"
import { useToast } from "@/hooks/use-toast"

export default function NewGroupPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [members, setMembers] = useState([{ id: 1 }])
  const [form, setForm] = useState({
    name: "",
    meetingDay: "Monday",
    meetingTime: "10:00",
    loanOfficerId: "",
  })

  useEffect(() => {
    const user = getCurrentUser()
    if (user?._id) setForm((f) => ({ ...f, loanOfficerId: user._id }))
  }, [])

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const payload = {
        name: form.name,
        meetingDay: form.meetingDay,
        meetingTime: form.meetingTime,
        loanOfficerId: form.loanOfficerId,
      }
      await apiPostJson("/api/groups", payload)
      toast({ title: "Group created" })
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
        </div>

        <Card className="neumorphic p-4 sm:p-8 bg-card border-0">
          <form className="space-y-4 sm:space-y-6" onSubmit={onSubmit}>
            <div>
              <label className="block text-xs sm:text-sm font-semibold text-foreground mb-2">Group Name</label>
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
              <label className="block text-xs sm:text-sm font-semibold text-foreground mb-2">Description</label>
              <textarea
                rows={3}
                className="w-full px-3 sm:px-4 py-2 sm:py-3 bg-background rounded-xl border-0 neumorphic-inset focus:outline-none focus:ring-2 focus:ring-secondary transition-all text-sm"
                placeholder="Describe the group purpose..."
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-6">
              <div>
                <label className="block text-xs sm:text-sm font-semibold text-foreground mb-2">Meeting Day</label>
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
                <label className="block text-xs sm:text-sm font-semibold text-foreground mb-2">Meeting Time</label>
                <input
                  type="time"
                  value={form.meetingTime}
                  onChange={(e) => setForm({ ...form, meetingTime: e.target.value })}
                  className="w-full px-3 sm:px-4 py-2 sm:py-3 bg-background rounded-xl border-0 neumorphic-inset text-sm"
                />
              </div>
              <div>
                <label className="block text-xs sm:text-sm font-semibold text-foreground mb-2">Loan Officer</label>
                <input
                  type="text"
                  value={form.loanOfficerId}
                  onChange={(e) => setForm({ ...form, loanOfficerId: e.target.value })}
                  className="w-full px-3 sm:px-4 py-2 sm:py-3 bg-background rounded-xl border-0 neumorphic-inset text-sm"
                  placeholder="User ID"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-3 sm:mb-4 flex-col sm:flex-row gap-3 sm:gap-0">
                <label className="block text-xs sm:text-sm font-semibold text-foreground">Group Members</label>
                <Button
                  type="button"
                  onClick={() => setMembers([...members, { id: Date.now() }])}
                  className="gap-2 bg-secondary text-white neumorphic neumorphic-hover border-0 w-full sm:w-auto text-xs sm:text-sm py-2 sm:py-auto"
                >
                  <Plus className="w-4 h-4" />
                  Add Member
                </Button>
              </div>

              <div className="space-y-2 sm:space-y-3">
                {members.map((member, index) => (
                  <div key={member.id} className="flex gap-2 sm:gap-3">
                    <select className="flex-1 px-3 sm:px-4 py-2 sm:py-3 bg-background rounded-xl border-0 neumorphic-inset focus:outline-none focus:ring-2 focus:ring-secondary transition-all text-sm">
                      <option value="">Select member</option>
                      <option value="1">John Doe</option>
                      <option value="2">Jane Smith</option>
                    </select>
                    {members.length > 1 && (
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setMembers(members.filter((_, i) => i !== index))}
                        className="px-2 sm:px-3"
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-end pt-2">
              <Button type="button" variant="outline" onClick={() => router.back()} className="px-6 sm:px-8 py-2 sm:py-3 text-sm sm:text-base">
                Cancel
              </Button>
              <Button type="submit" className="px-6 sm:px-8 py-2 sm:py-3 bg-secondary text-white neumorphic neumorphic-hover border-0 text-sm sm:text-base">
                Create Group
              </Button>
            </div>
          </form>
        </Card>
      </div>
    </DashboardLayout>
  )
}
