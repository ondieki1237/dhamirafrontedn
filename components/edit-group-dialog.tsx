"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Save, X } from "lucide-react"
import { apiPutJson, apiGet, getCurrentUser } from "@/lib/api"
import { useToast } from "@/hooks/use-toast"

interface EditGroupDialogProps {
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  group: any
  onSuccess?: () => void
}

export function EditGroupDialog({
  isOpen,
  onOpenChange,
  group,
  onSuccess
}: EditGroupDialogProps) {
  const { toast } = useToast()
  const user = getCurrentUser()
  const [submitting, setSubmitting] = useState(false)
  const [branches, setBranches] = useState<any[]>([])
  const [officers, setOfficers] = useState<any[]>([])
  const [clients, setClients] = useState<any[]>([])
  const [form, setForm] = useState({
    name: "",
    meetingDay: "",
    meetingTime: "",
    branchId: "",
    loanOfficer: "",
    status: "",
    chairperson: "",
    secretary: "",
    treasurer: ""
  })

  const isAdmin = user?.role && ["admin", "super_admin", "initiator_admin", "approver_admin"].includes(user.role)
  const canEditStructural = isAdmin

  useEffect(() => {
    if (group && isOpen) {
      // Extract loan officer ID from either loanOfficer or loanOfficerId field
      const loanOfficerValue = group.loanOfficer || group.loanOfficerId
      const loanOfficerId = typeof loanOfficerValue === "string" 
        ? loanOfficerValue 
        : loanOfficerValue?._id || ""

      setForm({
        name: group.name || "",
        meetingDay: group.meetingDay || "",
        meetingTime: group.meetingTime || "",
        branchId: (typeof group.branchId === "string" ? group.branchId : group.branchId?._id) || "",
        loanOfficer: loanOfficerId,
        status: group.status || "active",
        chairperson: (typeof group.chairperson === "string" ? group.chairperson : group.chairperson?._id) || "",
        secretary: (typeof group.secretary === "string" ? group.secretary : group.secretary?._id) || "",
        treasurer: (typeof group.treasurer === "string" ? group.treasurer : group.treasurer?._id) || ""
      })

      // Fetch data for dropdowns
      fetchAdminData()
    }
  }, [group, isOpen])

  const fetchAdminData = async () => {
    try {
      const promises = [
        apiGet<any>("/api/branches"),
        apiGet<any>("/api/loan-officers"),
        apiGet<any>("/api/clients")
      ]

      const [branchesData, officersData, clientsData] = await Promise.all(promises)

      // Handle multiple possible response formats
      const branchList = Array.isArray(branchesData) 
        ? branchesData 
        : (branchesData?.data || branchesData?.branches || [])
      const officerList = Array.isArray(officersData) 
        ? officersData 
        : (officersData?.data || officersData?.loanOfficers || [])
      const clientList = Array.isArray(clientsData) 
        ? clientsData 
        : (clientsData?.data || clientsData?.clients || [])

      setBranches(branchList)
      setOfficers(officerList)
      setClients(clientList)

      console.log("Fetched data:", { branches: branchList.length, officers: officerList.length, clients: clientList.length })
    } catch (e) {
      console.error("Failed to fetch data:", e)
    }
  }

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Validate signatories uniqueness
    const signatories = [form.chairperson, form.secretary, form.treasurer].filter(Boolean)
    const uniqueSignatories = new Set(signatories)
    
    if (signatories.length > 0 && uniqueSignatories.size !== signatories.length) {
      toast({
        title: "Duplicate Signatories",
        description: "Chairperson, Secretary, and Treasurer must be different people",
        variant: "destructive"
      })
      return
    }

    // For active groups, all 3 signatories are required
    if (form.status === "active" && signatories.length !== 3) {
      toast({
        title: "Incomplete Signatories",
        description: "Active groups must have exactly 3 signatories (Chairperson, Secretary, Treasurer)",
        variant: "destructive"
      })
      return
    }

    try {
      setSubmitting(true)

      // Build update payload based on permissions
      const payload: any = {
        name: form.name,
        meetingDay: form.meetingDay,
        meetingTime: form.meetingTime,
        chairperson: form.chairperson,
        secretary: form.secretary,
        treasurer: form.treasurer
      }

      // Admin-only fields
      if (canEditStructural) {
        if (form.branchId) payload.branchId = form.branchId
        if (form.loanOfficer) payload.loanOfficerId = form.loanOfficer
        if (form.status) payload.status = form.status
      }

      await apiPutJson(`/api/groups/${group._id}`, payload)

      toast({
        title: "Success",
        description: "Group details updated successfully"
      })

      onOpenChange(false)
      onSuccess?.()
    } catch (e: any) {
      toast({
        title: "Error",
        description: e?.message || "Failed to update group",
        variant: "destructive"
      })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl bg-card border-0 neumorphic max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl font-bold">
            Edit Group: {group?.name}
          </DialogTitle>
        </DialogHeader>

        <form className="space-y-4 mt-4" onSubmit={onSubmit}>
          {/* Basic Information */}
          <div className="space-y-4">
            <h3 className="font-semibold text-sm text-muted-foreground uppercase">Basic Information</h3>
            
            <div>
              <label className="block text-sm font-semibold mb-2">Group Name *</label>
              <input
                type="text"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="w-full px-4 py-2 bg-background rounded-xl border-0 neumorphic-inset focus:outline-none focus:ring-2 focus:ring-primary text-sm"
                required
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold mb-2">Meeting Day</label>
                <select
                  value={form.meetingDay}
                  onChange={(e) => setForm({ ...form, meetingDay: e.target.value })}
                  className="w-full px-4 py-2 bg-background rounded-xl border-0 neumorphic-inset focus:outline-none focus:ring-2 focus:ring-primary text-sm"
                >
                  <option value="">Select day</option>
                  <option value="Monday">Monday</option>
                  <option value="Tuesday">Tuesday</option>
                  <option value="Wednesday">Wednesday</option>
                  <option value="Thursday">Thursday</option>
                  <option value="Friday">Friday</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold mb-2">Meeting Time</label>
                <input
                  type="time"
                  value={form.meetingTime}
                  onChange={(e) => setForm({ ...form, meetingTime: e.target.value })}
                  className="w-full px-4 py-2 bg-background rounded-xl border-0 neumorphic-inset focus:outline-none focus:ring-2 focus:ring-primary text-sm"
                />
              </div>
            </div>
          </div>

          {/* Signatories Section */}
          <div className="space-y-4 border-t border-border pt-4">
            <h3 className="font-semibold text-sm text-muted-foreground uppercase">Group Signatories *</h3>
            <p className="text-xs text-muted-foreground">Active groups require exactly 3 unique signatories</p>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold mb-2">Chairperson *</label>
                <select
                  value={form.chairperson}
                  onChange={(e) => setForm({ ...form, chairperson: e.target.value })}
                  className="w-full px-4 py-2 bg-background rounded-xl border-0 neumorphic-inset focus:outline-none focus:ring-2 focus:ring-primary text-sm"
                  required={form.status === "active"}
                >
                  <option value="">Select chairperson</option>
                  {clients.map((client) => (
                    <option key={client._id} value={client._id}>
                      {client.name} - {client.nationalId}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold mb-2">Secretary *</label>
                <select
                  value={form.secretary}
                  onChange={(e) => setForm({ ...form, secretary: e.target.value })}
                  className="w-full px-4 py-2 bg-background rounded-xl border-0 neumorphic-inset focus:outline-none focus:ring-2 focus:ring-primary text-sm"
                  required={form.status === "active"}
                >
                  <option value="">Select secretary</option>
                  {clients.map((client) => (
                    <option key={client._id} value={client._id}>
                      {client.name} - {client.nationalId}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold mb-2">Treasurer *</label>
                <select
                  value={form.treasurer}
                  onChange={(e) => setForm({ ...form, treasurer: e.target.value })}
                  className="w-full px-4 py-2 bg-background rounded-xl border-0 neumorphic-inset focus:outline-none focus:ring-2 focus:ring-primary text-sm"
                  required={form.status === "active"}
                >
                  <option value="">Select treasurer</option>
                  {clients.map((client) => (
                    <option key={client._id} value={client._id}>
                      {client.name} - {client.nationalId}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Admin-Only Fields */}
          {canEditStructural && (
            <div className="space-y-4 border-t border-border pt-4">
              <h3 className="font-semibold text-sm text-primary uppercase">Admin Controls - Reassignment</h3>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold mb-2">Branch</label>
                  <select
                    value={form.branchId}
                    onChange={(e) => setForm({ ...form, branchId: e.target.value })}
                    className="w-full px-4 py-2 bg-background rounded-xl border-0 neumorphic-inset focus:outline-none focus:ring-2 focus:ring-primary text-sm"
                  >
                    <option value="">Select branch</option>
                    {branches.map((branch) => (
                      <option key={branch._id} value={branch._id}>
                        {branch.name} ({branch.code})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold mb-2">Loan Officer</label>
                  <select
                    value={form.loanOfficer}
                    onChange={(e) => setForm({ ...form, loanOfficer: e.target.value })}
                    className="w-full px-4 py-2 bg-background rounded-xl border-0 neumorphic-inset focus:outline-none focus:ring-2 focus:ring-primary text-sm"
                  >
                    <option value="">Select loan officer</option>
                    {officers.map((officer) => (
                      <option key={officer._id} value={officer._id}>
                        {officer.name} - {officer.branchId?.name || "No Branch"}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold mb-2">Group Status</label>
                <select
                  value={form.status}
                  onChange={(e) => setForm({ ...form, status: e.target.value })}
                  className="w-full px-4 py-2 bg-background rounded-xl border-0 neumorphic-inset focus:outline-none focus:ring-2 focus:ring-primary text-sm"
                >
                  <option value="pending">Pending</option>
                  <option value="active">Active</option>
                  <option value="suspended">Suspended</option>
                </select>
                <p className="text-xs text-muted-foreground mt-1">
                  Change status to suspend group activities
                </p>
              </div>

              <p className="text-xs text-muted-foreground bg-muted/30 p-3 rounded-lg">
                ⚠️ When reassigning to a new branch, ensure the loan officer also belongs to that branch.
              </p>
            </div>
          )}

          <div className="flex gap-3 justify-end pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={submitting}>
              <X className="w-4 h-4 mr-2" />
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={submitting} 
              className="bg-primary text-white neumorphic neumorphic-hover border-0"
            >
              <Save className="w-4 h-4 mr-2" />
              {submitting ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
