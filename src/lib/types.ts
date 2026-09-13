export type CheckStatus = "draft" | "first_look" | "unlocked" | "expired";
export type Verdict = "Fact" | "Hypothesis" | "Unknown";
export type NodeState = "idle" | "running" | "done" | "locked";

export type SourceHit = {
  name: string;
  url: string;
  snippet: string;
};

export type SearchPass = {
  query: string;
  depth: "standard" | "deep";
  startedAt: string;
  finishedAt: string;
  durationMs: number;
  sources: SourceHit[];
  answer?: string;
};

export type Gap = {
  label: string;
  reason: string;
  followUpQuery: string;
};

export type Brief = {
  verdict: Verdict;
  summary: string;
  facts: string[];
  hypotheses: string[];
  unknowns: string[];
  where: string[];
  struggle: boolean;
  struggleNote?: string;
};

export type Metrics = {
  nebiousMs: number;
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
  estimatedUsd: number;
  model: string;
};

export type CheckPayload = {
  claim: string;
  firstLook?: SearchPass;
  gap?: Gap;
  followUp?: SearchPass;
  brief?: Brief;
  metrics?: Metrics;
  entitlementActive?: boolean;
  lastPurchaseStatus?: "success" | "fail" | "cancel" | "expired";
  reportEmailedTo?: string;
  reportEmailedAt?: string;
  reportEmailError?: string;
  reportEmailCopiedToNotify?: boolean;
};

export type CheckRecord = {
  id: string;
  userId: string;
  claim: string;
  status: CheckStatus;
  payload: CheckPayload;
  createdAt: string;
  updatedAt: string;
};

export type SessionUser = {
  id: string;
  email: string;
};
