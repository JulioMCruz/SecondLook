import type { CheckPayload, Gap, SearchPass } from "./types";
import { runSearch } from "./linkup";
import { planResearch, writeBrief } from "./nebius";

function host(url: string) {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return "";
  }
}

export function findGap(claim: string, firstLook: SearchPass): Gap {
  const placeMatch = claim.match(
    /\b(in|near|around)\s+([A-Z][A-Za-z]+(?:\s[A-Z][A-Za-z]+)*)\b/,
  );
  const place = placeMatch?.[2];
  const hosts = firstLook.sources.map((s) => host(s.url));
  const marketing = hosts.filter((h) =>
    /medium|substack|forbes|hubspot|g2\.com|capterra|saas/i.test(h),
  );
  const localHits = place
    ? firstLook.sources.filter((s) =>
        (s.name + s.snippet + s.url).toLowerCase().includes(place.toLowerCase()),
      )
    : [];

  if (place && localHits.length === 0) {
    return {
      label: `Local evidence missing for ${place}`,
      reason: `First look returned ${firstLook.sources.length} sources, none clearly about ${place}.`,
      followUpQuery: `Is this claim true specifically in ${place}? "${claim}" Find local operators, city news, or regulator sources. Flag if evidence is only national or vendor marketing.`,
    };
  }

  if (firstLook.sources.length < 2) {
    return {
      label: "Too few sources",
      reason: "First look did not gather enough independent sources.",
      followUpQuery: `Find at least two independent sources that confirm or contradict: "${claim}". Prefer primary reporting over vendor blogs.`,
    };
  }

  if (marketing.length >= Math.max(2, Math.floor(firstLook.sources.length * 0.6))) {
    return {
      label: "Mostly vendor marketing",
      reason: "Sources skew toward SaaS/marketing pages, not operators.",
      followUpQuery: `Ignore vendor landing pages. Find operator, newsroom, or research sources about: "${claim}"`,
    };
  }

  return {
    label: "Need a contradicting pass",
    reason: "First look has some coverage; follow-up should hunt for counter-evidence.",
    followUpQuery: `Find evidence AGAINST this claim, or showing it is overstated: "${claim}". If none, say so and cite the strongest remaining doubt.`,
  };
}

export async function firstLook(claim: string, locale: "en" | "es" = "en") {
  const query = `Market claim to check for a small business owner: "${claim}". Find evidence for and against. Note geography, dates, and whether sources are vendors or operators.`;
  const pass = await runSearch(query, "standard");
  pass.sources = pass.sources.map((s, i) => ({...s, id: `F${i + 1}`}));
  const gap = await planResearch(claim, pass, locale);
  return { pass, gap };
}

export async function secondLook(claim: string, payload: CheckPayload) {
  if (!payload.firstLook || !payload.gap) {
    throw new Error("first look missing");
  }
  const followUp = await runSearch(payload.gap.followUpQuery, "standard");
  followUp.sources = followUp.sources.map((s, i) => ({...s, id: `S${i + 1}`}));
  const { brief, metrics } = await writeBrief({
    locale: payload.locale,
    claim,
    firstLook: payload.firstLook,
    followUp,
  });
  return { followUp, brief, metrics };
}
