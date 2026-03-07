"use client";

import { useState, useEffect, useCallback, useRef } from "react";

// ── Types ───────────────────────────────────────────────────────────────────

export interface SignalSource {
  url: string;
  label: string;
}

export interface PublicSignal {
  id: string;
  headline: string;
  what_happened: string[];
  why_it_matters: string[];
  what_to_do: string[];
  image_url: string | null;
  sources: SignalSource[];
  impact_type: string;
  signal_date: string;
  synthesis: string;
}

interface PublicSignalsResponse {
  signals: PublicSignal[];
  source: "live" | "fallback";
}

interface UsePublicSignalsReturn {
  signals: PublicSignal[];
  loading: boolean;
  error: string | null;
}

// ── Constants ───────────────────────────────────────────────────────────────

const REFRESH_INTERVAL_MS = 5 * 60 * 1000; // 5 minutes
const API_ENDPOINT = "/api/public-signals";

// ── Hook ────────────────────────────────────────────────────────────────────

export function usePublicSignals(): UsePublicSignalsReturn {
  const [signals, setSignals] = useState<PublicSignal[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchSignals = useCallback(async (isInitial: boolean) => {
    if (isInitial) {
      setLoading(true);
    }
    setError(null);

    try {
      const response = await fetch(API_ENDPOINT);

      if (!response.ok) {
        throw new Error(`Failed to fetch signals: ${response.status}`);
      }

      const data: PublicSignalsResponse = await response.json();
      setSignals(data.signals);
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "An unexpected error occurred";
      setError(message);
    } finally {
      if (isInitial) {
        setLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    fetchSignals(true);

    intervalRef.current = setInterval(() => {
      fetchSignals(false);
    }, REFRESH_INTERVAL_MS);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [fetchSignals]);

  return { signals, loading, error };
}
