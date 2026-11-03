import type { Metadata } from "next"
import trendingData from "@/data/trending.json"
import TrendingResearch from "@/components/admin/trending-research"
import { isAdminAuthenticated } from "@/lib/admin/auth"
import type { TrendingData } from "@/lib/admin/trending"

export const dynamic = "force-dynamic"

export const metadata: Metadata = {
  title: "Trending research · FrostDew Admin",
  robots: { index: false, follow: false },
}

export default async function AdminTrendingPage() {
  // Defence in depth: never serialise research data for an unauthenticated request.
  if (!(await isAdminAuthenticated())) return null

  return <TrendingResearch data={trendingData as TrendingData} />
}
