import { NextResponse } from "next/server";

interface Source {
  url: string;
  label: string;
}

interface SignalRow {
  id: string;
  headline: string;
  what_happened: string[];
  why_it_matters: string[];
  what_to_do: string[];
  image_url: string | null;
  sources: Source[];
  impact_type: string;
  signal_date: string;
  synthesis: string;
}

const SELECT_COLUMNS = [
  "id",
  "headline",
  "what_happened",
  "why_it_matters",
  "what_to_do",
  "image_url",
  "sources",
  "impact_type",
  "signal_date",
  "synthesis",
].join(",");

function getFallbackSignals(): SignalRow[] {
  const today = new Date().toISOString().slice(0, 10);

  return [
    {
      id: "fb-001-a1b2-c3d4-e5f6-000000000001",
      headline: "Fed signals rate pause through Q3 2026",
      what_happened: [
        "The Federal Reserve indicated it will hold benchmark interest rates steady through the third quarter of 2026, citing persistent but moderating inflation.",
        "Chair Powell emphasized a data-dependent approach while acknowledging improved labor market balance.",
      ],
      why_it_matters: [
        "Borrowing costs for businesses and consumers remain elevated, affecting capital allocation decisions.",
        "Extended rate pauses compress margins for rate-sensitive sectors while giving equity markets room to re-price growth.",
      ],
      what_to_do: [
        "Re-evaluate debt-heavy portfolio positions for duration risk.",
        "Consider locking in current fixed-rate financing before any policy shift.",
      ],
      image_url: null,
      sources: [
        { url: "https://www.federalreserve.gov", label: "Federal Reserve" },
      ],
      impact_type: "COMPETITIVE",
      signal_date: today,
      synthesis:
        "The prolonged rate pause creates a window of predictability for capital planning but demands vigilance on inflation indicators that could trigger a pivot.",
    },
    {
      id: "fb-002-a1b2-c3d4-e5f6-000000000002",
      headline: "Enterprise AI spending projected up 40% YoY",
      what_happened: [
        "Gartner's latest forecast projects enterprise AI infrastructure and services spend will reach $320B in 2026, a 40% increase year-over-year.",
        "Spending is led by generative AI integration, ML-ops tooling, and domain-specific model fine-tuning.",
      ],
      why_it_matters: [
        "Companies without AI strategies risk falling behind as competitors capture efficiency gains and new revenue streams.",
        "Talent competition in AI/ML roles is intensifying, driving up hiring costs across the industry.",
      ],
      what_to_do: [
        "Audit current AI adoption maturity and identify high-ROI use cases within your organization.",
        "Build partnerships with AI vendors early to secure favorable pricing and priority support.",
      ],
      image_url: null,
      sources: [
        { url: "https://www.gartner.com", label: "Gartner Research" },
      ],
      impact_type: "OPPORTUNITY",
      signal_date: today,
      synthesis:
        "The accelerating enterprise AI spend wave rewards early movers disproportionately—organizations should prioritize pilots that can scale within two quarters.",
    },
    {
      id: "fb-003-a1b2-c3d4-e5f6-000000000003",
      headline: "Supply chain transparency bill clears Senate committee",
      what_happened: [
        "The bipartisan Supply Chain Accountability Act advanced out of the Senate Commerce Committee with a 17-9 vote.",
        "The bill mandates real-time disclosure of tier-1 and tier-2 supplier sourcing for companies above $500M revenue.",
      ],
      why_it_matters: [
        "Affected companies will need to invest in supply chain mapping and reporting infrastructure.",
        "Non-compliance penalties include up to 2% of annual revenue, creating material financial risk.",
      ],
      what_to_do: [
        "Begin a supply chain audit to identify visibility gaps in tier-2 and tier-3 suppliers.",
        "Evaluate supply chain management platforms that support automated compliance reporting.",
      ],
      image_url: null,
      sources: [
        {
          url: "https://www.congress.gov",
          label: "U.S. Congress",
        },
      ],
      impact_type: "RISK",
      signal_date: today,
      synthesis:
        "Proactive supply chain mapping is shifting from a best-practice to a regulatory requirement—companies that invest now will avoid scramble costs later.",
    },
    {
      id: "fb-004-a1b2-c3d4-e5f6-000000000004",
      headline: "New data privacy framework proposed for AI systems",
      what_happened: [
        "The EU Commission published a draft addendum to the AI Act establishing strict data-handling rules for foundation models operating in European markets.",
        "The framework introduces mandatory algorithmic impact assessments and user data provenance tracking.",
      ],
      why_it_matters: [
        "Companies deploying AI in the EU will face additional compliance costs and potential deployment delays.",
        "The framework may set a global precedent, influencing regulations in the US, UK, and Asia-Pacific.",
      ],
      what_to_do: [
        "Review your AI data pipelines for EU-facing products and identify gaps against the proposed rules.",
        "Engage legal counsel to prepare impact assessments ahead of the expected 18-month implementation window.",
      ],
      image_url: null,
      sources: [
        {
          url: "https://digital-strategy.ec.europa.eu",
          label: "EU Digital Strategy",
        },
      ],
      impact_type: "REGULATORY",
      signal_date: today,
      synthesis:
        "AI regulation is tightening globally with the EU leading—companies that build compliance-first AI infrastructure will gain durable market access advantages.",
    },
    {
      id: "fb-005-a1b2-c3d4-e5f6-000000000005",
      headline: "Three major retailers adopt same-day AI pricing",
      what_happened: [
        "Walmart, Target, and Kroger have each rolled out AI-driven dynamic pricing engines that adjust in-store and online prices multiple times per day.",
        "Early results show 3-6% margin improvement and 12% reduction in markdowns across participating categories.",
      ],
      why_it_matters: [
        "Dynamic pricing is becoming table-stakes in retail, pressuring mid-market retailers to adopt or lose margin.",
        "Consumer trust could erode if price volatility feels unpredictable—transparency will be a differentiator.",
      ],
      what_to_do: [
        "Benchmark your pricing update cadence against competitors adopting real-time AI pricing.",
        "Develop a customer communication strategy that frames dynamic pricing as value-driven rather than extractive.",
      ],
      image_url: null,
      sources: [
        { url: "https://www.reuters.com", label: "Reuters" },
      ],
      impact_type: "STRATEGIC",
      signal_date: today,
      synthesis:
        "AI-powered pricing is moving from competitive advantage to competitive necessity in retail—laggards risk margin erosion and market share loss.",
    },
    {
      id: "fb-006-a1b2-c3d4-e5f6-000000000006",
      headline: "Global semiconductor shortage eases as new fabs come online",
      what_happened: [
        "TSMC's Arizona fab and Samsung's Taylor, TX facility have begun volume production, adding 15% to global advanced-node capacity.",
        "Lead times for automotive and industrial chips have dropped below 12 weeks for the first time since 2022.",
      ],
      why_it_matters: [
        "Hardware-dependent product roadmaps can accelerate as component availability improves and pricing stabilizes.",
        "Geopolitical supply diversification reduces single-region dependency risk for critical technology inputs.",
      ],
      what_to_do: [
        "Renegotiate supplier contracts to capture improved pricing from expanded capacity.",
        "Revisit product timelines that were delayed due to chip constraints and evaluate acceleration opportunities.",
      ],
      image_url: null,
      sources: [
        { url: "https://www.semiconductors.org", label: "SIA" },
      ],
      impact_type: "OPPORTUNITY",
      signal_date: today,
      synthesis:
        "The easing semiconductor shortage creates a strategic window to lock in favorable supply agreements and accelerate hardware-dependent product launches.",
    },
  ];
}

export async function GET(): Promise<NextResponse> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  const cacheHeaders = {
    "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600",
  };

  if (!supabaseUrl || !supabaseAnonKey) {
    return NextResponse.json(
      { signals: getFallbackSignals(), source: "fallback" },
      { headers: cacheHeaders }
    );
  }

  try {
    const url = new URL(
      `/rest/v1/public_signal_showcase?select=${SELECT_COLUMNS}&order=signal_date.desc&limit=8`,
      supabaseUrl
    );

    const response = await fetch(url.toString(), {
      headers: {
        apikey: supabaseAnonKey,
        Authorization: `Bearer ${supabaseAnonKey}`,
        Accept: "application/json",
      },
      next: { revalidate: 300 },
    });

    if (!response.ok) {
      console.error(
        `Supabase request failed: ${response.status} ${response.statusText}`
      );
      return NextResponse.json(
        { signals: getFallbackSignals(), source: "fallback" },
        { headers: cacheHeaders }
      );
    }

    const signals: SignalRow[] = await response.json();

    if (!signals.length) {
      return NextResponse.json(
        { signals: getFallbackSignals(), source: "fallback" },
        { headers: cacheHeaders }
      );
    }

    return NextResponse.json(
      { signals, source: "live" },
      { headers: cacheHeaders }
    );
  } catch (err: unknown) {
    const message =
      err instanceof Error ? err.message : "Unknown error fetching signals";
    console.error("Public signals fetch error:", message);

    return NextResponse.json(
      { signals: getFallbackSignals(), source: "fallback" },
      { headers: cacheHeaders }
    );
  }
}
