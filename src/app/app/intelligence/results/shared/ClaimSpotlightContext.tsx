'use client'

import { createContext, useCallback, useContext, useMemo, useRef, useState, type ReactNode } from 'react'

/**
 * Claim Spotlight Context
 *
 * Exposes an imperative API for opening a side-rail that shows the exact
 * sources backing a specific claim. Intended to be consumed by `CitedText`
 * and any other component that wants to emit "spotlight this claim" events.
 *
 * Safe-by-default: when components are used outside a provider, the hook
 * returns a no-op controller so nothing throws and the popover fallback in
 * `CitedText` remains the user-facing affordance.
 */

export interface ClaimSpotlightHint {
  /** Inline snippet text captured at the citation site. Used when source.excerpt is absent. */
  snippet?: string | null
  /** Human-readable label for the claim (often the span text), used for a11y labeling. */
  claimLabel?: string
}

export interface ClaimSpotlightState {
  claimId: string
  sourceIds: string[]
  hint: ClaimSpotlightHint | null
}

export interface ClaimSpotlightController {
  /** Opens the spotlight for a claim. Safe to call repeatedly; later calls replace the active claim. */
  openForClaim: (claimId: string, sourceIds: string[], hint?: ClaimSpotlightHint) => void
  /** Closes the spotlight unless pinned. Pass `force` to bypass the pin. */
  close: (force?: boolean) => void
  /** Pins the spotlight so it stays open until the user explicitly closes or unpins it. */
  pin: () => void
  /** Unpin without closing. */
  unpin: () => void
  isOpen: boolean
  pinned: boolean
  active: ClaimSpotlightState | null
  /** Anchor id the spotlight's "Open evidence room" link should point at. Always the same value — exposed for convenience. */
  evidenceAnchorId: string
}

/** Anchor id that the evidence room must use so spotlight links can jump to it. */
export const EVIDENCE_ROOM_ANCHOR_ID = 'intel-evidence-room'

const noopController: ClaimSpotlightController = {
  openForClaim: () => {},
  close: () => {},
  pin: () => {},
  unpin: () => {},
  isOpen: false,
  pinned: false,
  active: null,
  evidenceAnchorId: EVIDENCE_ROOM_ANCHOR_ID,
}

const ClaimSpotlightContext = createContext<ClaimSpotlightController | null>(null)

interface ClaimSpotlightProviderProps {
  children: ReactNode
  /** Optional override of the evidence-room anchor id. Rare — downstream agents should rely on the default. */
  evidenceAnchorId?: string
}

export function ClaimSpotlightProvider({ children, evidenceAnchorId = EVIDENCE_ROOM_ANCHOR_ID }: ClaimSpotlightProviderProps) {
  const [active, setActive] = useState<ClaimSpotlightState | null>(null)
  const [pinned, setPinned] = useState(false)
  const pinnedRef = useRef(false)
  pinnedRef.current = pinned

  const openForClaim = useCallback(
    (claimId: string, sourceIds: string[], hint?: ClaimSpotlightHint) => {
      setActive({ claimId, sourceIds: Array.from(new Set(sourceIds)), hint: hint ?? null })
    },
    [],
  )

  const close = useCallback((force?: boolean) => {
    if (!force && pinnedRef.current) return
    setActive(null)
    setPinned(false)
  }, [])

  const pin = useCallback(() => {
    setPinned(true)
  }, [])

  const unpin = useCallback(() => {
    setPinned(false)
  }, [])

  const value = useMemo<ClaimSpotlightController>(
    () => ({
      openForClaim,
      close,
      pin,
      unpin,
      isOpen: active !== null,
      pinned,
      active,
      evidenceAnchorId,
    }),
    [openForClaim, close, pin, unpin, active, pinned, evidenceAnchorId],
  )

  return <ClaimSpotlightContext.Provider value={value}>{children}</ClaimSpotlightContext.Provider>
}

/**
 * Access the claim spotlight controller. Returns a no-op controller when used outside a provider.
 * Components can call this unconditionally without guarding — the fallback keeps them inert.
 */
export function useClaimSpotlight(): ClaimSpotlightController {
  return useContext(ClaimSpotlightContext) ?? noopController
}

/** True only when a real provider is wrapping the component tree. */
export function useHasClaimSpotlightProvider(): boolean {
  return useContext(ClaimSpotlightContext) !== null
}
