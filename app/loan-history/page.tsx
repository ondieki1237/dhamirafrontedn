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
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Skeleton } from "@/components/ui/skeleton"
import { format } from "date-fns"
import { 
  DollarSign, 
  TrendingUp, 
  TrendingDown, 
  Clock, 
  CheckCircle2,
  XCircle,
  AlertCircle,
  ChevronLeft,
  ChevronRight
} from "lucide-react"

interface LoanHistoryItem {
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
  total_due_cents: number
  total_paid_cents: number
  outstanding_cents: number
  term: number
  cycle: number
  loanType: "individual" | "group"
  initiatedBy?: { username: string }
  approvedBy?: Array<{ username: string }>
  disbursedBy?: { username: string }
  createdAt: string
  disbursedAt?: string
  dueDate?: string
}

interface Statistics {
  overall: {
    totalLoans: number
    totalPrincipal: number
    totalDue: number
    totalPaid: number
    totalOutstanding: number
  }
  byStatus: Array<{
    _id: string
    count: number
    totalPrincipal: number
    totalDue?: number
    totalPaid?: number
    totalOutstanding: number
  }>
  byProduct?: Array<{
    _id: string
    count: number
    totalPrincipal: number
  }>
}

export default function LoanHistoryPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [user, setUser] = useState<any>(null)
  const [loans, setLoans] = useState<LoanHistoryItem[]>([])
  const [statistics, setStatistics] = useState<Statistics | null>(null)
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(0)
  const [total, setTotal] = useState(0)
  
  const [filters, setFilters] = useState({
    status: "",
    product: "",
    loanType: "",
    startDate: "",
    endDate: "",
    limit: 50,
  })

  useEffect(() => {
    const userData = getCurrentUser()
    if (!userData) {
      router.push("/login")
      return
    }
    
    // Restrict to super admin only
    if (userData.role !== "super_admin") {
      toast({
        title: "Access Denied",
        description: "Only super administrators can view loan history.",
        variant: "destructive",
      })
      router.push("/dashboard")
      return
    }
    
    setUser(userData)
  }, [router, toast])

  useEffect(() => {
    if (user) {
      fetchLoanHistory()
    }
  }, [user, filters, page])

  const fetchLoanHistory = async () => {
    try {
      setLoading(true)
      const queryParams = new URLSearchParams({
        page: page.toString(),
        limit: filters.limit.toString(),
        ...(filters.status && { status: filters.status }),
        ...(filters.product && { product: filters.product }),
        ...(filters.loanType && { loanType: filters.loanType }),
        ...(filters.startDate && { startDate: filters.startDate }),
        ...(filters.endDate && { endDate: filters.endDate }),
      })

      const data = await apiGet(`/api/loans/history?${queryParams}`)
      setLoans(data.data)
      setStatistics(data.statistics)
      setTotalPages(data.totalPages)
      setTotal(data.total)
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to fetch loan history",
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
      loanType: "",
      startDate: "",
      endDate: "",
      limit: 50,
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
          <h1 className="text-3xl font-bold text-foreground">Loan History</h1>
          <p className="text-muted-foreground mt-1">
            Comprehensive overview of all loans in the system
          </p>
        </div>

        {/* Statistics Cards */}
        {statistics && (
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Total Loans
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2">
                  <DollarSign className="w-5 h-5 text-primary" />
                  <span className="text-2xl font-bold">
                    {statistics.overall.totalLoans.toLocaleString()}
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
                    {formatCurrency(statistics.overall.totalPrincipal)}
                  </span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Total Due
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2">
                  <Clock className="w-5 h-5 text-blue-600" />
                  <span className="text-2xl font-bold">
                    {formatCurrency(statistics.overall.totalDue)}
                  </span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Total Paid
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-green-600" />
                  <span className="text-2xl font-bold">
                    {formatCurrency(statistics.overall.totalPaid)}
                  </span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Outstanding
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2">
                  <TrendingDown className="w-5 h-5 text-orange-600" />
                  <span className="text-2xl font-bold">
                    {formatCurrency(statistics.overall.totalOutstanding)}
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
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
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
                <Label>Loan Type</Label>
                <Select
                  value={filters.loanType || "all"}
                  onValueChange={(value) => {
                    setFilters({ ...filters, loanType: value === "all" ? "" : value })
                    setPage(1)
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="All Types" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value="individual">Individual</SelectItem>
                    <SelectItem value="group">Group</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Start Date</Label>
                <Input
                  type="date"
                  value={filters.startDate}
                  onChange={(e) => {
                    setFilters({ ...filters, startDate: e.target.value })
                    setPage(1)
                  }}
                />
              </div>

              <div className="space-y-2">
                <Label>End Date</Label>
                <Input
                  type="date"
                  value={filters.endDate}
                  onChange={(e) => {
                    setFilters({ ...filters, endDate: e.target.value })
                    setPage(1)
                  }}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Loans Table */}
        <Card>
          <CardHeader>
            <CardTitle>
              Loans ({loading ? "..." : total.toLocaleString()})
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
                <p className="text-muted-foreground">No loans found matching your filters</p>
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
                              {loan.clientId.nationalId}
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
