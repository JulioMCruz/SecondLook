import OpenAI from "openai";
import type { Brief, Metrics, SearchPass } from "./types";

const DEFAULT_MODEL = "openai/gpt-oss-120b";

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

type AiRunner = {
  run: (model: string, input: Record<string, unknown>) => Promise<{ text?: string }>;
};

async function transcribeAudio(bytes: Uint8Array, _filename: string, _mime: string) {
  const { getCloudflareContext } = await import("@opennextjs/cloudflare");
  const ctx = await getCloudflareContext({ async: true });
  const ai = (ctx.env as { AI?: AiRunner }).AI;
  if (!ai) throw new Error("Voice transcription is not bound on this worker");

  const audio = Array.from(bytes);
  const models = ["@cf/openai/whisper-large-v3-turbo", "@cf/openai/whisper"];
  let last = "transcription failed";
  for (const sttModel of models) {
    try {
      const result = await ai.run(sttModel, { audio });
      const text = result?.text?.trim() || "";
      if (text) return { text, sttModel };
      last = `${sttModel} returned empty text`;
    } catch (err) {
      last = err instanceof Error ? err.message : "transcription failed";
    }
  }
  throw new Error(last);
}

async function polishClaim(raw: string) {
  const completion = await client().chat.completions.create({
    model: model(),
    temperature: 0.1,
    response_format: { type: "json_object" },
    messages: [
      {
        role: "system",
        content: `You turn a spoken transcript into one market claim a small-business owner was sold.
Return JSON: { "claim": string }.
Rules:
- One sentence, in the SAME language as the transcript (Spanish or English).
- Keep the speaker's meaning. Do not invent a company or city they did not say.
- No quotes around the whole claim.
- If the audio is not a claim, still compress it into the closest market claim.`,
      },
      { role: "user", content: raw },
    ],
  });
  const content = completion.choices[0]?.message?.content || "{}";
  let claim = raw;
  try {
    const parsed = JSON.parse(content) as { claim?: string };
    if (parsed.claim?.trim()) claim = parsed.claim.trim();
  } catch {
    claim = raw;
  }
  return {
    claim,
    polishModel: completion.model || model(),
    promptTokens: completion.usage?.prompt_tokens ?? 0,
    completionTokens: completion.usage?.completion_tokens ?? 0,
  };
}

export async function voiceToClaim(bytes: Uint8Array, filename: string, mime: string) {
  const started = Date.now();
  const stt = await transcribeAudio(bytes, filename, mime);
  const polished = await polishClaim(stt.text);
  return {
    raw: stt.text,
    claim: polished.claim,
    sttModel: stt.sttModel,
    polishModel: polished.polishModel,
    ms: Date.now() - started,
    promptTokens: polished.promptTokens,
    completionTokens: polished.completionTokens,
  };
}

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
