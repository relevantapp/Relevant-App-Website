import MarketingSeoLanding, { createMarketingSeoMetadata } from '@/components/MarketingSeoLanding'
import { requireMarketingSeoPage } from '@/lib/marketingSeoPages'

const page = requireMarketingSeoPage('business-case')

export const metadata = createMarketingSeoMetadata(page)

export default function BusinessCasePage() {
  return <MarketingSeoLanding page={page} />
}
