import { LinkupClient } from "linkup-sdk";
import type { SearchPass, SourceHit } from "./types";

function client() {
  const apiKey = process.env.LINKUP_API_KEY;
  if (!apiKey) throw new Error("LINKUP_API_KEY missing");
  return new LinkupClient({ apiKey });
}

export async function runSearch(query: string, depth: "standard" | "deep"): Promise<SearchPass> {
  const startedAt = new Date().toISOString();
  const t0 = Date.now();
  const response = await client().search({
    query,
    depth,
    outputType: "sourcedAnswer",
  });
  const clean = (text: string) => text.replace(/&mdash;/g, "—").replace(/&amp;/g, "&").replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&#(\d+);/g, (_, n) => { const c = Number(n); return c <= 0x10ffff ? String.fromCodePoint(c) : ""; }).replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/\[([^\]]+)\]\([^)]+\)/g, "$1").replace(/[#*_`]/g, "").trim();
  const seen = new Set<string>();
  const sources: SourceHit[] = (response.sources ?? []).filter(s => {
    try { const u = new URL(s.url); if (!["http:", "https:"].includes(u.protocol) || seen.has(u.href)) return false; seen.add(u.href); return true; } catch { return false; }
  }).map((s) => ({
    name: clean(s.name),
    url: s.url,
    snippet: clean(s.snippet || ""),
  }));
  return {
    query,
    depth,
    startedAt,
    finishedAt: new Date().toISOString(),
    durationMs: Date.now() - t0,
    sources,
    answer: response.answer,
  };
}
