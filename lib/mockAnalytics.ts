export type AnalyticsOverview = {
  totalLoans: number
  totalDisbursedCents: number
  totalClients: number
  defaultRatePercent: number
  activeLoans: { count: number; amountCents: number }
  pendingApprovals: { count: number; amountCents: number }
  defaulted: { count: number; amountCents: number }
  trends: {
    totalLoansChangePercent: number
    totalDisbursedChangePercent: number
    totalClientsChangePercent: number
    defaultRateChangePercent: number
  }
}

// Returns realistic-looking mock analytics data. Values are deterministic for now.
export async function fetchMockAnalytics(): Promise<AnalyticsOverview> {
  // Simulate network delay
  await new Promise((r) => setTimeout(r, 80))

  return {
    totalLoans: 1234,
    totalDisbursedCents: 4520000000, // KES 45,200,000.00
    totalClients: 3456,
    defaultRatePercent: 2.4,
    activeLoans: { count: 856, amountCents: 3240000000 }, // KES 32,400,000.00
    pendingApprovals: { count: 142, amountCents: 580000000 }, // KES 5,800,000.00
    defaulted: { count: 29, amountCents: 120000000 }, // KES 1,200,000.00
    trends: {
      totalLoansChangePercent: 12,
      totalDisbursedChangePercent: 8,
      totalClientsChangePercent: 5,
      defaultRateChangePercent: -0.3,
    },
  }
}
