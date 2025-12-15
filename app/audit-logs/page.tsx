"use client"

import { DashboardLayout } from "@/components/dashboard-layout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { FileCheck, User, Clock, CheckCircle, XCircle } from "lucide-react"

const auditLogs = [
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
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Audit Logs</h1>
            <p className="text-muted-foreground mt-1">Track all system activities and user actions</p>
          </div>
          <FileCheck className="w-8 h-8 text-primary" />
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <Card className="neumorphic border-0">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Actions Today</CardTitle>
              <FileCheck className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">156</div>
              <p className="text-xs text-muted-foreground">+24 from yesterday</p>
            </CardContent>
          </Card>
          <Card className="neumorphic border-0">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Users</CardTitle>
              <User className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">18</div>
              <p className="text-xs text-muted-foreground">Currently online</p>
            </CardContent>
          </Card>
          <Card className="neumorphic border-0">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
              <CheckCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">98.5%</div>
              <p className="text-xs text-green-600">Excellent performance</p>
            </CardContent>
          </Card>
        </div>

        <Card className="neumorphic border-0">
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {auditLogs.map((log) => (
                <div key={log.id} className="flex items-start gap-4 p-4 neumorphic-inset rounded-xl">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                      log.status === "success" ? "bg-green-100" : "bg-red-100"
                    }`}
                  >
                    {log.status === "success" ? (
                      <CheckCircle className="w-5 h-5 text-green-600" />
                    ) : (
                      <XCircle className="w-5 h-5 text-red-600" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge variant="outline" className="font-mono text-xs">
                        {log.action}
                      </Badge>
                      <Badge variant="secondary" className="text-xs">
                        {log.entityType}
                      </Badge>
                    </div>
                    <p className="text-sm font-medium text-foreground">{log.details}</p>
                    <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <User className="w-3 h-3" />
                        {log.user}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {log.timestamp}
                      </span>
                      <span className="font-mono">{log.entityId}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}
