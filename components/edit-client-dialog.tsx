"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Save, X } from "lucide-react"
import { apiPutJson, apiGet, getCurrentUser } from "@/lib/api"
import { useToast } from "@/hooks/use-toast"

interface EditClientDialogProps {
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  client: any
  onSuccess?: () => void
}

export function EditClientDialog({
  isOpen,
  onOpenChange,
  client,
  onSuccess
}: EditClientDialogProps) {
  const { toast } = useToast()
  const user = getCurrentUser()
  const [submitting, setSubmitting] = useState(false)
  const [groups, setGroups] = useState<any[]>([])
  const [branches, setBranches] = useState<any[]>([])
  const [officers, setOfficers] = useState<any[]>([])
  const [form, setForm] = useState({
    name: "",
    phone: "",
    nationalId: "",
    businessType: "",
    businessLocation: "",
    residenceType: "",
    nextOfKin: {
      name: "",
      phone: "",
      relationship: ""
    },
    groupId: "",
    branchId: "",
    loanOfficer: ""
  })

  const isAdmin = user?.role && ["super_admin", "initiator_admin", "approver_admin"].includes(user.role)
  const canEditStructural = isAdmin

  useEffect(() => {
    if (client && isOpen) {
      setForm({
        name: client.name || "",
        phone: client.phone || "",
        nationalId: client.nationalId || "",
        businessType: client.businessType || "",
        businessLocation: client.businessLocation || "",
        residenceType: client.residenceType || "",
        nextOfKin: {
          name: client.nextOfKin?.name || "",
          phone: client.nextOfKin?.phone || "",
          relationship: client.nextOfKin?.relationship || ""
        },
        groupId: (typeof client.groupId === "string" ? client.groupId : client.groupId?._id) || "",
        branchId: (typeof client.branchId === "string" ? client.branchId : client.branchId?._id) || "",
        loanOfficer: (typeof client.loanOfficer === "string" ? client.loanOfficer : client.loanOfficer?._id) || ""
      })

      // Fetch data for admin dropdowns
      if (isAdmin) {
        fetchAdminData()
      }
    }
  }, [client, isOpen, isAdmin])

  const fetchAdminData = async () => {
    try {
      const [groupsData, branchesData, officersData] = await Promise.all([
        apiGet<any>("/api/groups"),
        apiGet<any>("/api/branches"),
        apiGet<any>("/api/loan-officers")
      ])

      // Handle multiple possible response formats
      const groupList = Array.isArray(groupsData) 
        ? groupsData 
        : (groupsData?.data || groupsData?.groups || [])
      const branchList = Array.isArray(branchesData) 
        ? branchesData 
        : (branchesData?.data || branchesData?.branches || [])
      const officerList = Array.isArray(officersData) 
        ? officersData 
        : (officersData?.data || officersData?.loanOfficers || [])

      setGroups(groupList)
      setBranches(branchList)
      setOfficers(officerList)

      console.log("Fetched admin data:", { groups: groupList.length, branches: branchList.length, officers: officerList.length })
    } catch (e) {
      console.error("Failed to fetch admin data:", e)
    }
  }

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    try {
      setSubmitting(true)

      // Build update payload based on permissions
      const payload: any = {
        name: form.name,
        phone: form.phone,
        businessType: form.businessType,
        businessLocation: form.businessLocation,
        residenceType: form.residenceType,
        nextOfKin: form.nextOfKin
      }

      // Only include nationalId if it hasn't changed (to avoid backend error)
      if (form.nationalId !== client.nationalId) {
        payload.nationalId = form.nationalId
      }

      // Admin-only fields
      if (canEditStructural) {
        if (form.groupId) payload.groupId = form.groupId
        if (form.branchId) payload.branchId = form.branchId
        if (form.loanOfficer) payload.loanOfficer = form.loanOfficer
      }

      await apiPutJson(`/api/clients/${client._id}`, payload)

      toast({
        title: "Success",
        description: "Client details updated successfully"
      })

      onOpenChange(false)
      onSuccess?.()
    } catch (e: any) {
      toast({
        title: "Error",
        description: e?.message || "Failed to update client",
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
            Edit Client: {client?.name}
          </DialogTitle>
        </DialogHeader>

        <form className="space-y-4 mt-4" onSubmit={onSubmit}>
          {/* Basic Information */}
          <div className="space-y-4">
            <h3 className="font-semibold text-sm text-muted-foreground uppercase">Basic Information</h3>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold mb-2">Full Name *</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full px-4 py-2 bg-background rounded-xl border-0 neumorphic-inset focus:outline-none focus:ring-2 focus:ring-primary text-sm"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-semibold mb-2">Phone Number *</label>
                <input
                  type="tel"
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  className="w-full px-4 py-2 bg-background rounded-xl border-0 neumorphic-inset focus:outline-none focus:ring-2 focus:ring-primary text-sm"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold mb-2">National ID</label>
              <input
                type="text"
                value={form.nationalId}
                onChange={(e) => setForm({ ...form, nationalId: e.target.value })}
                className="w-full px-4 py-2 bg-background rounded-xl border-0 neumorphic-inset focus:outline-none focus:ring-2 focus:ring-primary text-sm"
                disabled={client?.hasLoanHistory}
              />
              {client?.hasLoanHistory && (
                <p className="text-xs text-destructive mt-1">Cannot change National ID for clients with loan history</p>
              )}
            </div>
          </div>

          {/* Business Information */}
          <div className="space-y-4">
            <h3 className="font-semibold text-sm text-muted-foreground uppercase">Business Information</h3>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold mb-2">Business Type</label>
                <input
                  type="text"
                  value={form.businessType}
                  onChange={(e) => setForm({ ...form, businessType: e.target.value })}
                  className="w-full px-4 py-2 bg-background rounded-xl border-0 neumorphic-inset focus:outline-none focus:ring-2 focus:ring-primary text-sm"
                  placeholder="e.g., Retail, Agriculture"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold mb-2">Business Location</label>
                <input
                  type="text"
                  value={form.businessLocation}
                  onChange={(e) => setForm({ ...form, businessLocation: e.target.value })}
                  className="w-full px-4 py-2 bg-background rounded-xl border-0 neumorphic-inset focus:outline-none focus:ring-2 focus:ring-primary text-sm"
                  placeholder="e.g., Nairobi CBD"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold mb-2">Residence Type</label>
              <select
                value={form.residenceType}
                onChange={(e) => setForm({ ...form, residenceType: e.target.value })}
                className="w-full px-4 py-2 bg-background rounded-xl border-0 neumorphic-inset focus:outline-none focus:ring-2 focus:ring-primary text-sm"
              >
                <option value="">Select residence type</option>
                <option value="Owned">Owned</option>
                <option value="Rented">Rented</option>
                <option value="Family">Family Home</option>
              </select>
            </div>
          </div>

          {/* Next of Kin */}
          <div className="space-y-4">
            <h3 className="font-semibold text-sm text-muted-foreground uppercase">Next of Kin</h3>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold mb-2">Name</label>
                <input
                  type="text"
                  value={form.nextOfKin.name}
                  onChange={(e) => setForm({ ...form, nextOfKin: { ...form.nextOfKin, name: e.target.value } })}
                  className="w-full px-4 py-2 bg-background rounded-xl border-0 neumorphic-inset focus:outline-none focus:ring-2 focus:ring-primary text-sm"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold mb-2">Phone</label>
                <input
                  type="tel"
                  value={form.nextOfKin.phone}
                  onChange={(e) => setForm({ ...form, nextOfKin: { ...form.nextOfKin, phone: e.target.value } })}
                  className="w-full px-4 py-2 bg-background rounded-xl border-0 neumorphic-inset focus:outline-none focus:ring-2 focus:ring-primary text-sm"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold mb-2">Relationship</label>
              <input
                type="text"
                value={form.nextOfKin.relationship}
                onChange={(e) => setForm({ ...form, nextOfKin: { ...form.nextOfKin, relationship: e.target.value } })}
                className="w-full px-4 py-2 bg-background rounded-xl border-0 neumorphic-inset focus:outline-none focus:ring-2 focus:ring-primary text-sm"
                placeholder="e.g., Brother, Sister, Parent"
              />
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
                <label className="block text-sm font-semibold mb-2">Group</label>
                <select
                  value={form.groupId}
                  onChange={(e) => setForm({ ...form, groupId: e.target.value })}
                  className="w-full px-4 py-2 bg-background rounded-xl border-0 neumorphic-inset focus:outline-none focus:ring-2 focus:ring-primary text-sm"
                >
                  <option value="">Select group</option>
                  {groups.map((group) => (
                    <option key={group._id} value={group._id}>
                      {group.name} - {group.branchId?.name || "No Branch"}
                    </option>
                  ))}
                </select>
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
