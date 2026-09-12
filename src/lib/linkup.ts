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
  const sources: SourceHit[] = (response.sources ?? []).map((s) => ({
    name: s.name,
    url: s.url,
    snippet: s.snippet,
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
