import MarketingSeoLanding, { createMarketingSeoMetadata } from '@/components/MarketingSeoLanding'
import { requireMarketingSeoPage } from '@/lib/marketingSeoPages'

const page = requireMarketingSeoPage('role-aware-intelligence')

export const metadata = createMarketingSeoMetadata(page)

export default function RoleAwareIntelligencePage() {
  return <MarketingSeoLanding page={page} />
}
