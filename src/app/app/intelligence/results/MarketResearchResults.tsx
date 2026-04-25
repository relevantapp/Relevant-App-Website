'use client'

import { useCallback, useMemo, useRef } from 'react'
import { Target, TrendingUp } from 'lucide-react'
import type { BriefSource, BriefStatus, Priority, RichBullet } from '@/lib/intelligence/contracts'
import type { MarketResearchBrief } from '../types'
import HistoryButton from '../HistoryButton'
import AnswerBlock from './shared/AnswerBlock'
import BalanceView from './shared/BalanceView'
import ClaimFeedback from './shared/ClaimFeedback'
import { ClaimFeedbackProvider } from './shared/ClaimFeedbackContext'
import ClaimSpotlight from './shared/ClaimSpotlight'
import { ClaimSpotlightProvider, EVIDENCE_ROOM_ANCHOR_ID } from './shared/ClaimSpotlightContext'
import CopyModePicker from './shared/CopyModePicker'
import CounterCaseCard from './shared/CounterCaseCard'
import ExhibitShell from './shared/ExhibitShell'
import InsightSection from './shared/InsightSection'
import MethodologyDrawer from './shared/MethodologyDrawer'
import NextMoveActions from './shared/NextMoveActions'
import PdfExportSheet from './shared/PdfExportSheet'
import PlayerCard from './shared/PlayerCard'
import ProofStrip, { type ProofDriver } from './shared/ProofStrip'
import ResultCommandBar from './shared/ResultCommandBar'
import SearchPlanPanel from './shared/SearchPlanPanel'
import ShareButton from './shared/ShareButton'
import SourcesStrip from './shared/SourcesStrip'
import StatusBar from './shared/StatusBar'
import VerdictHero, { type EvidenceMeter, type TrustState } from './shared/VerdictHero'
import LogoMarketMap from './shared/viz/LogoMarketMap'
import MaturityCurve from './shared/viz/MaturityCurve'
import Quadrant from './shared/viz/Quadrant'
import QuoteWall from './shared/viz/QuoteWall'
import TrendTracker from './shared/viz/TrendTracker'
import WatchList from './shared/viz/WatchList'

interface MarketResearchResultsProps {
  brief: MarketResearchBrief
  onNewSearch: () => void
  savedBriefId?: string | null
}

function resolveTrustState(status: BriefStatus, confidence: MarketResearchBrief['confidence']): TrustState {
  const usedCount = status.sourceCounts?.used ?? status.sourceCount
  if (status.degraded) return 'degraded'
  if (confidence === 'low' || usedCount < 3) return 'low-evidence'
  return 'safe'
}

function buildEvidenceMeter(status: BriefStatus): EvidenceMeter {
  return status.sourceCounts ?? {
    found: status.sourceCount,
    ranked: status.sourceCount,
    used: status.sourceCount,
  }
}

function resolvePriority(index: number, bullet?: Pick<RichBullet, 'priority'>): Priority {
  if (bullet?.priority) return bullet.priority
  if (index < 2) return 'must'
  if (index < 4) return 'should'
  return 'fyi'
}

function findFreshestSource(sourceIds: string[], sourceMap: Map<string, BriefSource>): string | null {
  return sourceIds
    .map((sourceId) => sourceMap.get(sourceId)?.publishedAt ?? null)
    .filter((value): value is string => Boolean(value))
    .sort((left, right) => right.localeCompare(left))[0] ?? null
}

function buildProofDrivers(brief: MarketResearchBrief): ProofDriver[] {
  const sourceMap = new Map(brief.sources.map((source) => [source.id, source]))
  const counterSourceIds = new Set(brief.trust?.conflicts.flatMap((conflict) => conflict.againstSourceIds) ?? [])
  const bullets = [...brief.sections.trendSignals, ...brief.sections.keyFindings].slice(0, 4)

  return bullets.map((bullet, index) => ({
    id: `market-proof-${index + 1}`,
    title: bullet.text,
    detail: bullet.confidenceDriver ?? undefined,
    priority: resolvePriority(index, bullet),
    sourceIds: bullet.sourceIds,
    freshness: findFreshestSource(bullet.sourceIds, sourceMap),
    counter: bullet.sourceIds.some((sourceId) => counterSourceIds.has(sourceId)),
  }))
}

function buildSourceNumberMap(drivers: ProofDriver[]): Map<string, number> {
  const orderedSourceIds: string[] = []

  for (const driver of drivers) {
    for (const sourceId of driver.sourceIds) {
      if (!orderedSourceIds.includes(sourceId)) orderedSourceIds.push(sourceId)
    }
  }

  return new Map(orderedSourceIds.map((sourceId, index) => [sourceId, index + 1]))
}

export default function MarketResearchResults({ brief, onNewSearch, savedBriefId }: MarketResearchResultsProps) {
  const exportRef = useRef<HTMLDivElement>(null)
  const pdfRef = useRef<HTMLDivElement>(null)
  const proofDrivers = useMemo(() => buildProofDrivers(brief), [brief])
  const proofSourceNumberMap = useMemo(() => buildSourceNumberMap(proofDrivers), [proofDrivers])
  const trustState = resolveTrustState(brief.status, brief.confidence)
  const evidenceMeter = buildEvidenceMeter(brief.status)

  const sortedPlayers = useMemo(() => {
    const order = { leader: 0, challenger: 1, niche: 2, emerging: 3 }
    return [...brief.players].sort((left, right) => (order[left.category] ?? 4) - (order[right.category] ?? 4))
  }, [brief.players])

  const scrollToSource = useCallback((id: string) => {
    const el = document.getElementById(`source-${id}`)
    if (!el) return
    el.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' })
    el.classList.add('intel-source-highlighted')
    window.setTimeout(() => el.classList.remove('intel-source-highlighted'), 2000)
  }, [])
  const scrollToEvidence = useCallback(() => {
    const el = document.getElementById(EVIDENCE_ROOM_ANCHOR_ID)
    if (!el) return
    el.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }, [])

  const hasDominantMap = Boolean(brief.marketMap)

  return (
    <ClaimFeedbackProvider briefId={savedBriefId ?? null} researchType="market_research">
      <ClaimSpotlightProvider evidenceAnchorId={EVIDENCE_ROOM_ANCHOR_ID}>
        <div className="mx-auto w-full max-w-6xl">
          <ResultCommandBar
            workflowLabel="Market research"
            subject={hasDominantMap ? `${brief.marketMap?.segments.length ?? 0} market segments tracked` : 'Market brief'}
            onNewSearch={onNewSearch}
            onViewEvidence={scrollToEvidence}
          >
            <HistoryButton compact />
            <ShareButton briefId={savedBriefId ?? null} />
            <CopyModePicker brief={brief} exportRef={exportRef} pdfRef={pdfRef} />
            <MethodologyDrawer
              methodology={brief.methodology}
              trust={brief.trust}
              status={brief.status}
              sources={brief.sources}
              inputSummary={brief.researchPlan?.summary}
            />
          </ResultCommandBar>

          <div ref={exportRef} className="space-y-6">
            <VerdictHero
              verdict={brief.headline}
              subline={brief.bottomLine}
              confidence={brief.answer?.confidence.level ?? brief.confidence}
              trustState={trustState}
              generatedAt={brief.generatedAt}
              workflowLabel="Market research"
              evidenceMeter={evidenceMeter}
              subject={hasDominantMap ? `${brief.marketMap?.segments.length ?? 0} market segments tracked` : undefined}
            />

            {brief.answer?.recommendedNext && (
              <section className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] px-5 py-5">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div className="max-w-3xl">
                    <p className="kicker text-[var(--accent-amber)]">Recommended next move</p>
                    {brief.answer.recommendedNext.action && (
                      <p className="mt-2 text-[11px] uppercase tracking-[0.18em] text-[var(--text-soft)]">
                        {brief.answer.recommendedNext.action}
                      </p>
                    )}
                    <p className="mt-3 text-sm leading-relaxed text-[var(--text)]">
                      {brief.answer.recommendedNext.text}
                    </p>
                  </div>

                  <NextMoveActions
                    text={brief.answer.recommendedNext.copyable ?? brief.answer.recommendedNext.text}
                    headline={brief.headline}
                    actionLabel="Use this"
                  />
                </div>
              </section>
            )}

            <ProofStrip
              drivers={proofDrivers}
              sourceNumberMap={proofSourceNumberMap}
              onCitationClick={scrollToSource}
              label="Proof"
            />

            {brief.marketMap ? (
              <LogoMarketMap
                data={brief.marketMap}
                headline="The market shape matters more than a long prose overview."
                subhead="Lead with the map when the category has distinct clusters and the user needs to see where the wedge is opening up."
                asOf={brief.generatedAt}
                sources={brief.sources}
                playerDetails={brief.players}
              />
            ) : brief.trackedSignals?.length ? (
              <TrendTracker data={brief.trackedSignals} asOf={brief.generatedAt} sources={brief.sources} />
            ) : null}

            {brief.maturity && (
              <MaturityCurve
                data={brief.maturity}
                headline="The category is moving from hype toward practical evaluation."
                subhead="That matters because buyers are rewarding workflow proof over generic AI positioning."
                asOf={brief.generatedAt}
                sources={brief.sources}
              />
            )}

            {brief.marketOverview && (
              <section className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] px-5 py-5">
                <p className="kicker">Market overview</p>
                <p className="mt-3 text-sm leading-relaxed text-[var(--text-muted)]">{brief.marketOverview}</p>
                <ClaimFeedback className="mt-4" claimKey="market-overview" claimText={brief.marketOverview} />
              </section>
            )}

            {sortedPlayers.length > 0 && (
              <ExhibitShell
                headline="Player landscape supports the market map instead of replacing it."
                subhead="Use the player rows to inspect who fills each segment after you understand the market shape."
                asOf={brief.generatedAt}
                sources={brief.sources}
              >
                <div className="grid items-start gap-4 xl:grid-cols-[minmax(0,320px)_minmax(0,1fr)]">
                  <Quadrant players={sortedPlayers} label="Scale and momentum map" />
                  <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                    {sortedPlayers.map((player) => (
                      <PlayerCard
                        key={player.name}
                        name={player.name}
                        category={player.category}
                        description={player.description}
                        estimatedPosition={player.estimatedPosition}
                        feedbackKey={`player:${player.name}`}
                      />
                    ))}
                  </div>
                </div>
              </ExhibitShell>
            )}

            <BalanceView
              leftTitle="Opportunities"
              rightTitle="Threats"
              leftItems={brief.sections.opportunities}
              rightItems={brief.sections.threats}
              leftColor="green"
              rightColor="red"
              onSourceClick={scrollToSource}
            />

            <CounterCaseCard sources={brief.sources} trust={brief.trust} />

            {brief.answer && (
              <AnswerBlock
                answer={brief.answer}
                fallback={{
                  headline: brief.headline,
                  bottomLine: brief.bottomLine,
                  confidence: brief.confidence,
                  whyItMatters: brief.whyItMatters,
                }}
                sources={brief.sources}
                sticky={false}
              />
            )}

            {brief.quotes?.length ? (
              <QuoteWall
                data={brief.quotes}
                headline="The market is telling us that proof beats generic AI posture."
                subhead="These quotes add buyer texture to the category signal and show where skepticism still lives."
                asOf={brief.generatedAt}
                sources={brief.sources}
              />
            ) : null}

            {brief.watchList?.length ? (
              <WatchList
                data={brief.watchList}
                headline="The watch list turns the brief into a monitoring plan."
                subhead="These are the few signals worth rechecking before the category narrative hardens."
                asOf={brief.generatedAt}
                sources={brief.sources}
              />
            ) : null}

            <div className="grid gap-4 xl:grid-cols-2">
              <InsightSection
                title="Trend signals"
                icon={<TrendingUp className="h-4 w-4" style={{ color: 'var(--accent-teal)' }} />}
                bullets={brief.sections.trendSignals}
                onSourceClick={scrollToSource}
              />
              <InsightSection
                title="Key findings"
                icon={<Target className="h-4 w-4" style={{ color: 'var(--accent)' }} />}
                bullets={brief.sections.keyFindings}
                onSourceClick={scrollToSource}
              />
            </div>
          </div>

          <div id={EVIDENCE_ROOM_ANCHOR_ID} className="mt-8 space-y-6">
            <SearchPlanPanel plan={brief.researchPlan} />
            <SourcesStrip sources={brief.sources} />
            <StatusBar status={brief.status} />
          </div>

          <PdfExportSheet ref={pdfRef} title={brief.headline}>
            <VerdictHero
              verdict={brief.headline}
              subline={brief.bottomLine}
              confidence={brief.answer?.confidence.level ?? brief.confidence}
              trustState={trustState}
              generatedAt={brief.generatedAt}
              workflowLabel="Market research"
              evidenceMeter={evidenceMeter}
            />
            {brief.answer ? (
              <AnswerBlock
                answer={brief.answer}
                fallback={{
                  headline: brief.headline,
                  bottomLine: brief.bottomLine,
                  confidence: brief.confidence,
                  whyItMatters: brief.whyItMatters,
                }}
                sources={brief.sources}
                sticky={false}
              />
            ) : null}
            {brief.marketMap ? (
              <LogoMarketMap
                data={brief.marketMap}
                headline="The market shape matters more than a long prose overview."
                subhead="Lead with the map when the category has distinct clusters and the user needs to see where the wedge is opening up."
                asOf={brief.generatedAt}
                sources={brief.sources}
                playerDetails={brief.players}
              />
            ) : brief.trackedSignals?.length ? (
              <TrendTracker data={brief.trackedSignals} asOf={brief.generatedAt} sources={brief.sources} />
            ) : null}
          </PdfExportSheet>

          <ClaimSpotlight sources={brief.sources} evidenceAnchorId={EVIDENCE_ROOM_ANCHOR_ID} />
        </div>
      </ClaimSpotlightProvider>
    </ClaimFeedbackProvider>
  )
}
