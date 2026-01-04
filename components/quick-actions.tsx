"use client"

import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { UserPlus, DollarSign, Users, FileCheck } from "lucide-react"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { getCurrentUser } from "@/lib/api"

type Action = { icon: any; label: string; color: string; route: string; roles?: string[] }

const actions: Action[] = [
  {
    icon: UserPlus,
    label: "New Client",
    color: "bg-secondary",
    route: "/clients/new",
    roles: ["loan_officer"], // Only loan officers create clients
  },
  {
    icon: DollarSign,
    label: "Create Loan",
    color: "bg-primary",
    route: "/loans/initiate",
    roles: ["admin", "initiator_admin", "approver_admin"], // Admins create loans
  },
  {
    icon: DollarSign,
    label: "Add Savings",
    color: "bg-blue-600",
    route: "/savings",
    roles: ["admin", "approver_admin", "initiator_admin"], // Admins manage savings
  },
  {
    icon: Users,
    label: "Create Group",
    color: "bg-secondary",
    route: "/groups/new",
    roles: ["loan_officer"], // Only loan officers create groups
  },
  {
    icon: FileCheck,
    label: "Approve Loan",
    color: "bg-primary",
    route: "/loans/approve",
    roles: ["admin", "approver_admin", "initiator_admin"], // Admins approve (checker role)
  },
  {
    icon: DollarSign,
    label: "Disburse Loan",
    color: "bg-green-600",
    route: "/loans/disburse",
    roles: ["admin", "approver_admin", "initiator_admin"], // Admins disburse (checker role)
  },
]

export function QuickActions() {
  const router = useRouter()
  const [role, setRole] = useState<string | null>(null)

  useEffect(() => {
    const user = getCurrentUser()
    setRole(user?.role ?? null)
  }, [])

  return (
    <Card className="neumorphic p-4 md:p-6 bg-card border-0">
      <div className="mb-4 md:mb-6">
        <h2 className="text-lg md:text-xl font-bold text-foreground">Quick Actions</h2>
        <p className="text-xs md:text-sm text-muted-foreground mt-1">Common tasks at your fingertips</p>
      </div>

      <div className="space-y-2 md:space-y-3">
        {actions
          .filter((a) => !a.roles || (role ? a.roles.includes(role) : false))
          .map((action, index) => (
            <Button
              key={action.label}
              onClick={() => router.push(action.route)}
              className={`w-full justify-start gap-3 h-12 md:h-14 neumorphic neumorphic-hover neumorphic-active ${action.color} text-white border-0 touch-target`}
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <div className="w-9 h-9 md:w-10 md:h-10 rounded-lg bg-white/20 flex items-center justify-center flex-shrink-0">
                <action.icon className="w-4 h-4 md:w-5 md:h-5" />
              </div>
              <span className="font-semibold text-sm md:text-base">{action.label}</span>
            </Button>
          ))}
      </div>
    </Card>
  )
}
