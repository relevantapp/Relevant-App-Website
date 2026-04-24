import MarketingSeoLanding, { createMarketingSeoMetadata } from '@/components/MarketingSeoLanding'
import { requireMarketingSeoPage } from '@/lib/marketingSeoPages'

const page = requireMarketingSeoPage('market-research')

export const metadata = createMarketingSeoMetadata(page)

export default function MarketResearchPage() {
  return <MarketingSeoLanding page={page} />
}
