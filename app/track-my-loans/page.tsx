"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { DashboardLayout } from "@/components/dashboard-layout"
import { apiGet, getCurrentUser } from "@/lib/api"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { useToast } from "@/hooks/use-toast"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Skeleton } from "@/components/ui/skeleton"
import { format } from "date-fns"
import { 
  DollarSign, 
  TrendingUp, 
  Clock, 
  CheckCircle2,
  XCircle,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  Users
} from "lucide-react"

interface LoanItem {
  _id: string
  clientId: {
    _id: string
    name: string
    nationalId: string
    phone: string
  }
  groupId?: {
    _id: string
    name: string
  }
  product: "fafa" | "business"
  status: string
  principal_cents: number
  outstanding_cents: number
  term: number
  cycle: number
  loanType: "individual" | "group"
  initiatedBy?: { username: string }
  approvedBy?: Array<{ username: string }>
  createdAt: string
  disbursedAt?: string
  dueDate?: string
}

interface MyGroup {
  id: string
  name: string
}

interface Statistics {
  totalLoans: number
  totalPrincipal: number
  totalOutstanding: number
  byStatus: Array<{
    _id: string
    count: number
    totalPrincipal: number
    totalOutstanding: number
  }>
}

export default function TrackMyLoansPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [user, setUser] = useState<any>(null)
  const [loans, setLoans] = useState<LoanItem[]>([])
  const [myGroups, setMyGroups] = useState<MyGroup[]>([])
  const [statistics, setStatistics] = useState<Statistics | null>(null)
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(0)
  const [total, setTotal] = useState(0)
  
  const [filters, setFilters] = useState({
    status: "",
    product: "",
    groupId: "",
    limit: 20,
  })

  useEffect(() => {
    const userData = getCurrentUser()
    if (!userData) {
      router.push("/login")
      return
    }
    
    // Restrict to loan officers only
    if (userData.role !== "loan_officer") {
      toast({
        title: "Access Denied",
        description: "This page is only available to loan officers.",
        variant: "destructive",
      })
      router.push("/dashboard")
      return
    }
    
    setUser(userData)
  }, [router, toast])

  useEffect(() => {
    if (user) {
      fetchMyLoans()
    }
  }, [user, filters, page])

  const fetchMyLoans = async () => {
    try {
      setLoading(true)
      const queryParams = new URLSearchParams({
        page: page.toString(),
        limit: filters.limit.toString(),
        ...(filters.status && { status: filters.status }),
        ...(filters.product && { product: filters.product }),
        ...(filters.groupId && { groupId: filters.groupId }),
      })

      const data = await apiGet(`/api/loans/my-loans?${queryParams}`)
      setLoans(data.data)
      setMyGroups(data.myGroups || [])
      setStatistics(data.statistics)
      setTotalPages(data.totalPages)
      setTotal(data.total)
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to fetch your loans",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const formatCurrency = (cents: number) => {
    return new Intl.NumberFormat("en-KE", {
      style: "currency",
      currency: "KES",
    }).format(cents / 100)
  }

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { variant: any; icon: any }> = {
      initiated: { variant: "secondary", icon: Clock },
      approved: { variant: "default", icon: CheckCircle2 },
      disbursement_pending: { variant: "secondary", icon: Clock },
      disbursed: { variant: "default", icon: TrendingUp },
      repaid: { variant: "default", icon: CheckCircle2 },
      defaulted: { variant: "destructive", icon: XCircle },
      cancelled: { variant: "destructive", icon: XCircle },
    }

    const config = statusConfig[status] || { variant: "secondary", icon: AlertCircle }
    const Icon = config.icon

    return (
      <Badge variant={config.variant} className="flex items-center gap-1">
        <Icon className="w-3 h-3" />
        {status.replace(/_/g, " ").toUpperCase()}
      </Badge>
    )
  }

  const clearFilters = () => {
    setFilters({
      status: "",
      product: "",
      groupId: "",
      limit: 20,
    })
    setPage(1)
  }

  if (!user) {
    return null
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-foreground">Track My Loans</h1>
          <p className="text-muted-foreground mt-1">
            Monitor loans for your assigned groups
          </p>
        </div>

        {/* My Groups Section */}
        {myGroups.length === 0 ? (
          <Card className="bg-yellow-50 border-yellow-200">
            <CardContent className="pt-6">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5" />
                <div>
                  <p className="font-medium text-yellow-900">No Groups Assigned</p>
                  <p className="text-sm text-yellow-800 mt-1">
                    You have no groups assigned. Contact your administrator to assign groups to you.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5" />
                My Assigned Groups ({myGroups.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {myGroups.map((group) => (
                  <Badge key={group.id} variant="secondary" className="px-3 py-1">
                    {group.name}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Statistics Cards */}
        {statistics && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Total Loans
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2">
                  <DollarSign className="w-5 h-5 text-blue-600" />
                  <span className="text-2xl font-bold">
                    {statistics.totalLoans.toLocaleString()}
                  </span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Total Principal
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-green-600" />
                  <span className="text-2xl font-bold">
                    {formatCurrency(statistics.totalPrincipal)}
                  </span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Total Outstanding
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2">
                  <Clock className="w-5 h-5 text-orange-600" />
                  <span className="text-2xl font-bold">
                    {formatCurrency(statistics.totalOutstanding)}
                  </span>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Filters */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Filters</CardTitle>
              <Button variant="outline" size="sm" onClick={clearFilters}>
                Clear Filters
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Status</Label>
                <Select
                  value={filters.status || "all"}
                  onValueChange={(value) => {
                    setFilters({ ...filters, status: value === "all" ? "" : value })
                    setPage(1)
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="All Statuses" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Statuses</SelectItem>
                    <SelectItem value="initiated">Initiated</SelectItem>
                    <SelectItem value="approved">Approved</SelectItem>
                    <SelectItem value="disbursement_pending">Disbursement Pending</SelectItem>
                    <SelectItem value="disbursed">Disbursed</SelectItem>
                    <SelectItem value="repaid">Repaid</SelectItem>
                    <SelectItem value="defaulted">Defaulted</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Product</Label>
                <Select
                  value={filters.product || "all"}
                  onValueChange={(value) => {
                    setFilters({ ...filters, product: value === "all" ? "" : value })
                    setPage(1)
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="All Products" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Products</SelectItem>
                    <SelectItem value="fafa">FAFA</SelectItem>
                    <SelectItem value="business">Business</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Group</Label>
                <Select
                  value={filters.groupId || "all"}
                  onValueChange={(value) => {
                    setFilters({ ...filters, groupId: value === "all" ? "" : value })
                    setPage(1)
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="All Groups" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Groups</SelectItem>
                    {myGroups.map((group) => (
                      <SelectItem key={group.id} value={group.id}>
                        {group.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Loans Table */}
        <Card>
          <CardHeader>
            <CardTitle>
              My Loans ({loading ? "..." : total.toLocaleString()})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-3">
                {[...Array(5)].map((_, i) => (
                  <Skeleton key={i} className="h-16 w-full" />
                ))}
              </div>
            ) : loans.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-muted-foreground">
                  {myGroups.length === 0 
                    ? "No groups assigned yet" 
                    : "No loans found for your groups"}
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Client</TableHead>
                      <TableHead>Group</TableHead>
                      <TableHead>Product</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Principal</TableHead>
                      <TableHead className="text-right">Outstanding</TableHead>
                      <TableHead>Initiated By</TableHead>
                      <TableHead>Created</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {loans.map((loan) => (
                      <TableRow key={loan._id}>
                        <TableCell>
                          <div>
                            <p className="font-medium">{loan.clientId.name}</p>
                            <p className="text-xs text-muted-foreground">
                              {loan.clientId.phone}
                            </p>
                          </div>
                        </TableCell>
                        <TableCell>
                          {loan.groupId ? loan.groupId.name : "-"}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">
                            {loan.product.toUpperCase()}
                          </Badge>
                        </TableCell>
                        <TableCell>{getStatusBadge(loan.status)}</TableCell>
                        <TableCell className="text-right font-medium">
                          {formatCurrency(loan.principal_cents)}
                        </TableCell>
                        <TableCell className="text-right font-medium">
                          {formatCurrency(loan.outstanding_cents)}
                        </TableCell>
                        <TableCell>
                          {loan.initiatedBy?.username || "-"}
                        </TableCell>
                        <TableCell>
                          {format(new Date(loan.createdAt), "MMM dd, yyyy")}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between mt-4">
                <p className="text-sm text-muted-foreground">
                  Page {page} of {totalPages}
                </p>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage(page - 1)}
                    disabled={page === 1}
                  >
                    <ChevronLeft className="w-4 h-4" />
                    Previous
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage(page + 1)}
                    disabled={page === totalPages}
                  >
                    Next
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}
