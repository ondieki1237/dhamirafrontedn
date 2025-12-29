"use client"

import { DashboardLayout } from "@/components/dashboard-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { BarChart3, Users, DollarSign, AlertTriangle } from "lucide-react"
import { useEffect, useState } from "react"

function centsToKES(cents?: number) {
  if (!cents && cents !== 0) return "—"
  return `KES ${Number(cents / 100).toLocaleString()}`
}

export default function AnalyticsPage() {
  const [overview, setOverview] = useState<any | null>(null)
  const [portfolio, setPortfolio] = useState<any | null>(null)
  const [demographics, setDemographics] = useState<any | null>(null)
  const [repayments, setRepayments] = useState<any | null>(null)
  const [performance, setPerformance] = useState<any | null>(null)
  const [officers, setOfficers] = useState<any | null>(null)
  const [risk, setRisk] = useState<any | null>(null)
  const [errors, setErrors] = useState<Record<string, string>>({})

  useEffect(() => {
    let mounted = true
    ;(async () => {
      const API = (process.env.NEXT_PUBLIC_API_URL || "").replace(/\/+$/, "")
      const endpoints = [
        { key: "overview", url: API ? `${API}/api/analytics/overview` : "/api/analytics/overview" },
        { key: "portfolio", url: API ? `${API}/api/analytics/portfolio` : "/api/analytics/portfolio" },
        { key: "demographics", url: API ? `${API}/api/analytics/demographics?range=365` : "/api/analytics/demographics?range=365" },
        { key: "repayments", url: API ? `${API}/api/analytics/repayments?range=30` : "/api/analytics/repayments?range=30" },
        { key: "performance", url: API ? `${API}/api/analytics/loan-performance?vintageMonths=12` : "/api/analytics/loan-performance?vintageMonths=12" },
        { key: "officers", url: API ? `${API}/api/analytics/officers?range=30` : "/api/analytics/officers?range=30" },
        { key: "risk", url: API ? `${API}/api/analytics/risk?range=365` : "/api/analytics/risk?range=365" },
      ]

      const results = await Promise.allSettled(
        endpoints.map((e) => fetch(e.url).then(async (r) => ({ key: e.key, ok: r.ok, body: await r.json() })).catch((err) => ({ key: e.key, ok: false, error: err.message })))
      )

      if (!mounted) return

      const nextErrors: Record<string, string> = {}
      for (const r of results) {
        if (r.status === "fulfilled") {
          const v: any = r.value
          if (!v.ok) {
            nextErrors[v.key] = `endpoint returned error`
            continue
          }
          switch (v.key) {
            case "overview":
              setOverview(v.body)
              break
            case "portfolio":
              setPortfolio(v.body)
              break
            case "demographics":
              setDemographics(v.body)
              break
            case "repayments":
              setRepayments(v.body)
              break
            case "performance":
              setPerformance(v.body)
              break
            case "officers":
              setOfficers(v.body)
              break
            case "risk":
              setRisk(v.body)
              break
          }
        } else {
          nextErrors[(r as any).reason?.key || "unknown"] = (r as any).reason?.error || "fetch failed"
        }
      }
      setErrors(nextErrors)
    })()
    return () => {
      mounted = false
    }
  }, [])

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
                      <div className="text-2xl font-bold">{overview?.totalLoans?.toLocaleString() ?? "—"}</div>
                      <p className="text-xs text-muted-foreground">{overview?.trends?.totalLoansChangePercent ? `${overview.trends.totalLoansChangePercent}% from last month` : ""}</p>
                    </CardContent>
              </Card>
              <Card className="neumorphic border-0">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Disbursed</CardTitle>
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{centsToKES(overview?.totalDisbursedCents)}</div>
                  <p className="text-xs text-muted-foreground">{overview?.trends?.totalDisbursedChangePercent ? `${overview.trends.totalDisbursedChangePercent}% from last month` : ""}</p>
                </CardContent>
              </Card>
              <Card className="neumorphic border-0">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Clients</CardTitle>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{overview?.totalClients?.toLocaleString() ?? "—"}</div>
                  <p className="text-xs text-muted-foreground">{overview?.trends?.totalClientsChangePercent ? `${overview.trends.totalClientsChangePercent}% from last month` : ""}</p>
                </CardContent>
              </Card>
              <Card className="neumorphic border-0">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Default Rate</CardTitle>
                  <AlertTriangle className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{overview?.defaultRatePercent ?? "—"}%</div>
                  <p className="text-xs text-green-600">{overview?.trends?.defaultRateChangePercent ? `${overview.trends.defaultRateChangePercent}% from last month` : ""}</p>
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
                        <p className="text-sm font-bold">{portfolio?.byStatus?.active?.count ?? "—"}</p>
                        <p className="text-xs text-muted-foreground">{centsToKES(portfolio?.byStatus?.active?.amountCents)}</p>
                      </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <p className="text-sm font-medium">Pending Approval</p>
                      <p className="text-xs text-muted-foreground">Awaiting review</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold">{portfolio?.byStatus?.pending?.count ?? "—"}</p>
                      <p className="text-xs text-muted-foreground">{centsToKES(portfolio?.byStatus?.pending?.amountCents)}</p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <p className="text-sm font-medium">Defaulted</p>
                      <p className="text-xs text-muted-foreground">Overdue payments</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold">{portfolio?.byStatus?.defaulted?.count ?? "—"}</p>
                      <p className="text-xs text-muted-foreground">{centsToKES(portfolio?.byStatus?.defaulted?.amountCents)}</p>
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
                      <h4 className="text-sm font-semibold mb-2">Age Buckets</h4>
                      <div className="space-y-2">
                        {demographics?.ageBuckets
                          ? Object.entries(demographics.ageBuckets).map(([k, v]) => (
                              <div key={k} className="flex items-center justify-between">
                                <span className="text-sm">{k}</span>
                                <span className="text-sm font-bold">{v}</span>
                              </div>
                            ))
                          : <div className="text-sm text-muted-foreground">No demographics data</div>}
                      </div>
                    </div>
                    <div>
                      <h4 className="text-sm font-semibold mb-2">Gender</h4>
                      {demographics?.gender ? (
                        <div className="space-y-2">
                          {Object.entries(demographics.gender).map(([k, v]) => (
                            <div key={k} className="flex items-center justify-between">
                              <span className="text-sm">{k}</span>
                              <span className="text-sm font-bold">{v}</span>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-sm text-muted-foreground">No gender data</div>
                      )}
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
                      {repayments?.byMethod ? (
                        Object.entries(repayments.byMethod).map(([m, cents]) => (
                          <div key={m} className="flex items-center justify-between">
                            <span className="text-sm">{m}</span>
                            <span className="text-sm font-bold">{centsToKES(cents)}</span>
                          </div>
                        ))
                      ) : (
                        <div className="text-sm text-muted-foreground">No repayments data</div>
                      )}
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
                  {performance?.vintage ? (
                    performance.vintage.map((v: any) => (
                      <div key={v.month} className="flex items-center justify-between p-4 neumorphic-inset rounded-xl">
                        <div>
                          <p className="font-semibold">{v.month}</p>
                          <p className="text-xs text-muted-foreground">{v.disbursedCount} disbursed</p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-bold">{centsToKES(v.disbursedCents)}</p>
                          <p className="text-xs text-green-600">{v.nplPercent}% default rate</p>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-sm text-muted-foreground">No performance data</div>
                  )}
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
                  {officers?.officers ? (
                    officers.officers.map((o: any) => (
                      <div key={o.id} className="flex items-center justify-between p-4 neumorphic-inset rounded-xl">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center text-white font-bold">{(o.name || "").split(" ").map((s: string) => s[0]).slice(0,2).join("")}</div>
                          <div>
                            <p className="font-semibold">{o.name}</p>
                            <p className="text-xs text-muted-foreground">Loan Officer</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-bold">{o.loansInitiated ?? o.loans ?? "—"} loans</p>
                          <p className="text-xs text-muted-foreground">{centsToKES(o.disbursedCents)}</p>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-sm text-muted-foreground">No officer data</div>
                  )}
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
                    <p className="text-2xl font-bold">{risk?.delinquencyBuckets ? Object.values(risk.delinquencyBuckets).reduce((a: number, b: any) => a + Number(b), 0) : "—"} loans</p>
                    <p className="text-xs text-muted-foreground">{centsToKES(risk?.expectedLossCents)}</p>
                  </div>
                  <div className="p-4 neumorphic-inset rounded-xl">
                    <div className="flex items-center gap-2 mb-2">
                      <AlertTriangle className="w-5 h-5 text-red-600" />
                      <h4 className="font-semibold">High-Risk Clients</h4>
                    </div>
                    <p className="text-2xl font-bold">{(risk && risk.scoreBuckets) ? Object.values(risk.scoreBuckets).slice(-1)[0] : "—"} clients</p>
                    <p className="text-xs text-muted-foreground">Based on score distribution</p>
                  </div>
                  <div className="p-4 neumorphic-inset rounded-xl">
                    <div className="flex items-center gap-2 mb-2">
                      <AlertTriangle className="w-5 h-5 text-orange-600" />
                      <h4 className="font-semibold">Low Savings Clients</h4>
                    </div>
                    <p className="text-2xl font-bold">{risk?.topRiskDrivers ? Math.round((risk.topRiskDrivers.find((d: any) => d.driver === 'lowSavings')?.impact || 0) * 100) : "—"} clients</p>
                    <p className="text-xs text-muted-foreground">Based on risk drivers</p>
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
