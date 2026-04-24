import MarketingSeoLanding, { createMarketingSeoMetadata } from '@/components/MarketingSeoLanding'
import { requireMarketingSeoPage } from '@/lib/marketingSeoPages'

const page = requireMarketingSeoPage('meeting-prep')

export const metadata = createMarketingSeoMetadata(page)

export default function MeetingPrepPage() {
  return <MarketingSeoLanding page={page} />
}
