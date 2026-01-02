"use client"

import React, { useEffect, useState, Suspense } from "react"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { FileCheck, User, Clock, CheckCircle, XCircle, Download, Filter } from "lucide-react"
import { apiGet, getCurrentUser } from "@/lib/api"
import { useToast } from "@/hooks/use-toast"
import { useRouter } from "next/navigation"

type AuditLog = {
  id: string | number
  action: string
  user: string
  entityType: string
  entityId: string
  status: "success" | "failed"
  timestamp: string
  details: string
}

// Mock data as fallback
const mockAuditLogs: AuditLog[] = [
  {
    id: 1,
    action: "LOAN_APPROVE",
    user: "Jane Approver",
    entityType: "Loan",
    entityId: "LN-2024-0156",
    status: "success",
    timestamp: "2025-12-15 14:23:45",
    details: "Approved business loan for KES 50,000",
  },
  {
    id: 2,
    action: "LOGIN",
    user: "John Mwangi",
    entityType: "User",
    entityId: "USR-45",
    status: "success",
    timestamp: "2025-12-15 14:15:22",
    details: "User logged in successfully",
  },
  {
    id: 3,
    action: "LOAN_DISBURSE",
    user: "Peter Officer",
    entityType: "Loan",
    entityId: "LN-2024-0155",
    status: "success",
    timestamp: "2025-12-15 13:45:12",
    details: "Disbursed KES 30,000 to client Alice Wanjiru",
  },
  {
    id: 4,
    action: "CLIENT_CREATE",
    user: "Sarah Initiator",
    entityType: "Client",
    entityId: "CL-789",
    status: "success",
    timestamp: "2025-12-15 12:30:08",
    details: "Created new client profile",
  },
  {
    id: 5,
    action: "REPAYMENT_RECORD",
    user: "John Mwangi",
    entityType: "Repayment",
    entityId: "RP-2024-0892",
    status: "success",
    timestamp: "2025-12-15 11:20:45",
    details: "Recorded repayment of KES 5,000 via M-Pesa",
  },
]

export default function AuditLogsPage() {
  const { toast } = useToast()
  const router = useRouter()
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>(mockAuditLogs)
  const [loading, setLoading] = useState(false)
  const user = getCurrentUser()

  // Audit logs are sensitive - only super_admin and admins should access
  const canAccess = user?.role && ["super_admin", "initiator_admin", "approver_admin"].includes(user.role)

  useEffect(() => {
    if (!canAccess) {
      toast({ title: "Access Denied", description: "Only administrators can view audit logs" })
      router.push("/dashboard")
      return
    }
    fetchAuditLogs()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const fetchAuditLogs = async () => {
    try {
      setLoading(true)
      // Try to fetch from backend, fallback to mock data if not available
      const raw = await apiGet<any>("/api/audit-logs")
      const data = Array.isArray(raw) ? raw : (raw?.data || [])
      setAuditLogs(data)
    } catch (e: any) {
      // Use mock data as fallback
      console.log("Using mock audit logs data")
    } finally {
      setLoading(false)
    }
  }

  const actionColors = {
    LOAN_APPROVE: "bg-green-100 text-green-700 border-green-200",
    LOAN_DISBURSE: "bg-blue-100 text-blue-700 border-blue-200",
    LOAN_INITIATE: "bg-yellow-100 text-yellow-700 border-yellow-200",
    CLIENT_CREATE: "bg-purple-100 text-purple-700 border-purple-200",
    REPAYMENT_RECORD: "bg-teal-100 text-teal-700 border-teal-200",
    LOGIN: "bg-gray-100 text-gray-700 border-gray-200",
    GROUP_CREATE: "bg-indigo-100 text-indigo-700 border-indigo-200",
  }

  return (
    <Suspense fallback={<div />}>
      <DashboardLayout>
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Audit Logs</h1>
              <p className="text-xs sm:text-sm text-muted-foreground mt-1">Track all system activities and user actions</p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" className="gap-2 bg-transparent text-xs sm:text-sm">
                <Filter className="w-4 h-4" />
                Filter
              </Button>
              <Button variant="outline" className="gap-2 bg-transparent text-xs sm:text-sm">
                <Download className="w-4 h-4" />
                Export
              </Button>
            </div>
          </div>

          <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2 md:grid-cols-3">
            <Card className="neumorphic border-0">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-4 sm:p-6">
                <CardTitle className="text-xs sm:text-sm font-medium">Total Actions Today</CardTitle>
                <FileCheck className="h-3 h-4 sm:h-4 sm:w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent className="p-4 sm:p-6 pt-0 sm:pt-0">
                <div className="text-xl sm:text-2xl font-bold">{auditLogs.length}</div>
                <p className="text-xs text-muted-foreground">System activity</p>
              </CardContent>
            </Card>
            <Card className="neumorphic border-0">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-4 sm:p-6">
                <CardTitle className="text-xs sm:text-sm font-medium">Success Rate</CardTitle>
                <CheckCircle className="h-3 h-4 sm:h-4 sm:w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent className="p-4 sm:p-6 pt-0 sm:pt-0">
                <div className="text-xl sm:text-2xl font-bold">
                  {((auditLogs.filter(log => log.status === "success").length / auditLogs.length) * 100).toFixed(1)}%
                </div>
                <p className="text-xs text-green-600">All successful</p>
              </CardContent>
            </Card>
            <Card className="neumorphic border-0">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-4 sm:p-6">
                <CardTitle className="text-xs sm:text-sm font-medium">Failed Actions</CardTitle>
                <XCircle className="h-3 h-4 sm:h-4 sm:w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent className="p-4 sm:p-6 pt-0 sm:pt-0">
                <div className="text-xl sm:text-2xl font-bold">
                  {auditLogs.filter(log => log.status === "failed").length}
                </div>
                <p className="text-xs text-muted-foreground">Errors to review</p>
              </CardContent>
            </Card>
          </div>

          <Card className="neumorphic p-3 sm:p-6 bg-card border-0">
            <h2 className="text-lg sm:text-xl font-bold mb-4">Recent Activity</h2>
            {loading ? (
              <p className="text-sm text-muted-foreground">Loading audit logs...</p>
            ) : (
              <div className="space-y-3">
                {auditLogs.map((log) => (
                  <div
                    key={log.id}
                    className="flex flex-col sm:flex-row sm:items-center justify-between p-3 sm:p-4 bg-muted/30 rounded-xl hover:bg-muted/50 transition-colors gap-2 sm:gap-0"
                  >
                    <div className="flex-1">
                      <div className="flex flex-wrap items-center gap-2 mb-2">
                        <Badge variant="outline" className={actionColors[log.action as keyof typeof actionColors] || "bg-gray-100 text-gray-700"}>
                          {log.action}
                        </Badge>
                        <Badge variant="outline" className={log.status === "success" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}>
                          {log.status}
                        </Badge>
                      </div>
                      <p className="text-xs sm:text-sm font-semibold text-foreground mb-1">{log.details}</p>
                      <div className="flex flex-wrap gap-3 sm:gap-4 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <User className="w-3 h-3" />
                          {log.user}
                        </span>
                        <span className="flex items-center gap-1">
                          <FileCheck className="w-3 h-3" />
                          {log.entityType}: {log.entityId}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {log.timestamp}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>
      </DashboardLayout>
    </Suspense>
  )
}
