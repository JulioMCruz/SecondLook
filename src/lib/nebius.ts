import OpenAI from "openai";
import type { Brief, Metrics, SearchPass } from "./types";

const DEFAULT_MODEL = "openai/gpt-oss-20b";

function client() {
  const apiKey = process.env.NEBIUS_API_KEY;
  if (!apiKey) throw new Error("NEBIUS_API_KEY missing");
  return new OpenAI({
    apiKey,
    baseURL: "https://api.tokenfactory.nebius.com/v1/",
  });
}

function model() {
  return process.env.NEBIUS_MODEL || DEFAULT_MODEL;
}

// Rough Token Factory list price fallback for the eval panel.
const USD_PER_MTOK = 0.15;

export async function writeBrief(input: {
  claim: string;
  firstLook: SearchPass;
  followUp: SearchPass;
}): Promise<{ brief: Brief; metrics: Metrics }> {
  const started = Date.now();
  const sys = `You write market-claim receipts for a small-business owner.
Only use the provided Linkup findings. Do not invent evidence.
Return strict JSON with keys:
verdict: Fact | Hypothesis | Unknown
summary: 2-4 sentences
facts: string[]
hypotheses: string[]
unknowns: string[]
where: string[] (places named in claim vs places in sources)
struggle: boolean (true if evidence is too thin or contradictory to close)
struggleNote: string
Rules:
- Fact only if primary sources clearly support the claim.
- Hypothesis if sources exist but are generic, old, or not local.
- Unknown if you cannot check the claim.
- Never recommend software to buy.`;

  const user = JSON.stringify({
    claim: input.claim,
    firstLook: {
      query: input.firstLook.query,
      answer: input.firstLook.answer,
      sources: input.firstLook.sources,
    },
    followUp: {
      query: input.followUp.query,
      answer: input.followUp.answer,
      sources: input.followUp.sources,
    },
  });

  const completion = await client().chat.completions.create({
    model: model(),
    temperature: 0.2,
    response_format: { type: "json_object" },
    messages: [
      { role: "system", content: sys },
      { role: "user", content: user },
    ],
  });

  const raw = completion.choices[0]?.message?.content || "{}";
  let parsed: Partial<Brief>;
  try {
    parsed = JSON.parse(raw) as Partial<Brief>;
  } catch {
    parsed = {
      verdict: "Unknown",
      summary: "The model returned unreadable JSON.",
      struggle: true,
      struggleNote: "Parse failure",
    };
  }

  const brief: Brief = {
    verdict:
      parsed.verdict === "Fact" || parsed.verdict === "Hypothesis" || parsed.verdict === "Unknown"
        ? parsed.verdict
        : "Unknown",
    summary: parsed.summary || "No summary.",
    facts: parsed.facts ?? [],
    hypotheses: parsed.hypotheses ?? [],
    unknowns: parsed.unknowns ?? [],
    where: parsed.where ?? [],
    struggle: Boolean(parsed.struggle),
    struggleNote: parsed.struggleNote,
  };

  const usage = completion.usage;
  const promptTokens = usage?.prompt_tokens ?? 0;
  const completionTokens = usage?.completion_tokens ?? 0;
  const totalTokens = usage?.total_tokens ?? promptTokens + completionTokens;
  const metrics: Metrics = {
    nebiousMs: Date.now() - started,
    promptTokens,
    completionTokens,
    totalTokens,
    estimatedUsd: (totalTokens / 1_000_000) * USD_PER_MTOK,
    model: completion.model || model(),
  };

  return { brief, metrics };
}
