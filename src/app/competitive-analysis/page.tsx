import MarketingSeoLanding, { createMarketingSeoMetadata } from '@/components/MarketingSeoLanding'
import { requireMarketingSeoPage } from '@/lib/marketingSeoPages'

const page = requireMarketingSeoPage('competitive-analysis')

export const metadata = createMarketingSeoMetadata(page)

export default function CompetitiveAnalysisPage() {
  return <MarketingSeoLanding page={page} />
}
