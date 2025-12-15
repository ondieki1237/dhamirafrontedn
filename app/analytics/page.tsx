"use client"

import { DashboardLayout } from "@/components/dashboard-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { BarChart3, Users, DollarSign, AlertTriangle } from "lucide-react"

export default function AnalyticsPage() {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Advanced Analytics</h1>
          <p className="text-muted-foreground mt-1">Comprehensive insights and performance metrics</p>
        </div>

        <Tabs defaultValue="portfolio" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3 lg:grid-cols-6 gap-2">
            <TabsTrigger value="portfolio">Portfolio</TabsTrigger>
            <TabsTrigger value="demographics">Demographics</TabsTrigger>
            <TabsTrigger value="repayments">Repayments</TabsTrigger>
            <TabsTrigger value="performance">Loan Performance</TabsTrigger>
            <TabsTrigger value="officers">Officers</TabsTrigger>
            <TabsTrigger value="risk">Risk Analysis</TabsTrigger>
          </TabsList>

          <TabsContent value="portfolio" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <Card className="neumorphic border-0">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Loans</CardTitle>
                  <BarChart3 className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">1,234</div>
                  <p className="text-xs text-muted-foreground">+12% from last month</p>
                </CardContent>
              </Card>
              <Card className="neumorphic border-0">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Disbursed</CardTitle>
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">KES 45.2M</div>
                  <p className="text-xs text-muted-foreground">+8% from last month</p>
                </CardContent>
              </Card>
              <Card className="neumorphic border-0">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Clients</CardTitle>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">3,456</div>
                  <p className="text-xs text-muted-foreground">+5% from last month</p>
                </CardContent>
              </Card>
              <Card className="neumorphic border-0">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Default Rate</CardTitle>
                  <AlertTriangle className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">2.4%</div>
                  <p className="text-xs text-green-600">-0.3% from last month</p>
                </CardContent>
              </Card>
            </div>

            <Card className="neumorphic border-0">
              <CardHeader>
                <CardTitle>Portfolio Overview</CardTitle>
                <CardDescription>Breakdown of loans by status and type</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <p className="text-sm font-medium">Active Loans</p>
                      <p className="text-xs text-muted-foreground">Currently disbursed</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold">856</p>
                      <p className="text-xs text-muted-foreground">KES 32.4M</p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <p className="text-sm font-medium">Pending Approval</p>
                      <p className="text-xs text-muted-foreground">Awaiting review</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold">142</p>
                      <p className="text-xs text-muted-foreground">KES 5.8M</p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <p className="text-sm font-medium">Defaulted</p>
                      <p className="text-xs text-muted-foreground">Overdue payments</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold">29</p>
                      <p className="text-xs text-muted-foreground">KES 1.2M</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="demographics" className="space-y-4">
            <Card className="neumorphic border-0">
              <CardHeader>
                <CardTitle>Client Demographics</CardTitle>
                <CardDescription>Distribution and characteristics of clients</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <h4 className="text-sm font-semibold mb-2">Top Business Types</h4>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Retail</span>
                        <span className="text-sm font-bold">1,245 clients</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Agriculture</span>
                        <span className="text-sm font-bold">892 clients</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Services</span>
                        <span className="text-sm font-bold">567 clients</span>
                      </div>
                    </div>
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold mb-2">Savings Metrics</h4>
                    <div className="grid grid-cols-3 gap-4">
                      <div>
                        <p className="text-xs text-muted-foreground">Average</p>
                        <p className="text-lg font-bold">KES 12,500</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Maximum</p>
                        <p className="text-lg font-bold">KES 85,000</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Minimum</p>
                        <p className="text-lg font-bold">KES 1,200</p>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="repayments" className="space-y-4">
            <Card className="neumorphic border-0">
              <CardHeader>
                <CardTitle>Repayment Analytics</CardTitle>
                <CardDescription>Trends and payment method breakdown</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <h4 className="text-sm font-semibold mb-2">Payment Methods</h4>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm">M-Pesa</span>
                        <span className="text-sm font-bold">KES 18.4M (68%)</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Bank Transfer</span>
                        <span className="text-sm font-bold">KES 6.2M (23%)</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Cash</span>
                        <span className="text-sm font-bold">KES 2.4M (9%)</span>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="performance" className="space-y-4">
            <Card className="neumorphic border-0">
              <CardHeader>
                <CardTitle>Loan Performance by Type</CardTitle>
                <CardDescription>Metrics per loan category</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 neumorphic-inset rounded-xl">
                    <div>
                      <p className="font-semibold">Business Loans</p>
                      <p className="text-xs text-muted-foreground">642 active loans</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold">KES 24.5M</p>
                      <p className="text-xs text-green-600">1.8% default rate</p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between p-4 neumorphic-inset rounded-xl">
                    <div>
                      <p className="font-semibold">Emergency Loans</p>
                      <p className="text-xs text-muted-foreground">156 active loans</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold">KES 5.2M</p>
                      <p className="text-xs text-green-600">2.1% default rate</p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between p-4 neumorphic-inset rounded-xl">
                    <div>
                      <p className="font-semibold">School Fees</p>
                      <p className="text-xs text-muted-foreground">58 active loans</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold">KES 2.7M</p>
                      <p className="text-xs text-green-600">0.9% default rate</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="officers" className="space-y-4">
            <Card className="neumorphic border-0">
              <CardHeader>
                <CardTitle>Officer Performance</CardTitle>
                <CardDescription>Productivity metrics per loan officer</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-4 neumorphic-inset rounded-xl">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center text-white font-bold">
                        JM
                      </div>
                      <div>
                        <p className="font-semibold">John Mwangi</p>
                        <p className="text-xs text-muted-foreground">Loan Officer</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold">245 loans</p>
                      <p className="text-xs text-muted-foreground">KES 12.4M disbursed</p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between p-4 neumorphic-inset rounded-xl">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center text-white font-bold">
                        AK
                      </div>
                      <div>
                        <p className="font-semibold">Alice Kamau</p>
                        <p className="text-xs text-muted-foreground">Loan Officer</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold">198 loans</p>
                      <p className="text-xs text-muted-foreground">KES 9.8M disbursed</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="risk" className="space-y-4">
            <Card className="neumorphic border-0">
              <CardHeader>
                <CardTitle>Risk Analysis</CardTitle>
                <CardDescription>Risk indicators and flagged clients</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="p-4 neumorphic-inset rounded-xl">
                    <div className="flex items-center gap-2 mb-2">
                      <AlertTriangle className="w-5 h-5 text-yellow-600" />
                      <h4 className="font-semibold">Overdue Loans</h4>
                    </div>
                    <p className="text-2xl font-bold">47 loans</p>
                    <p className="text-xs text-muted-foreground">KES 2.1M total overdue amount</p>
                  </div>
                  <div className="p-4 neumorphic-inset rounded-xl">
                    <div className="flex items-center gap-2 mb-2">
                      <AlertTriangle className="w-5 h-5 text-red-600" />
                      <h4 className="font-semibold">High-Risk Clients</h4>
                    </div>
                    <p className="text-2xl font-bold">23 clients</p>
                    <p className="text-xs text-muted-foreground">2+ defaults on record</p>
                  </div>
                  <div className="p-4 neumorphic-inset rounded-xl">
                    <div className="flex items-center gap-2 mb-2">
                      <AlertTriangle className="w-5 h-5 text-orange-600" />
                      <h4 className="font-semibold">Low Savings Clients</h4>
                    </div>
                    <p className="text-2xl font-bold">156 clients</p>
                    <p className="text-xs text-muted-foreground">Below KES 5,000 savings threshold</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  )
}
