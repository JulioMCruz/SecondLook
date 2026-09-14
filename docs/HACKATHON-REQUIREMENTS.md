# Hackathon requirements audit — September 13, 2026

Sources: https://app.burningtoken.dev/rules and https://app.burningtoken.dev/dashboard/tracks (read in authenticated Chrome).

Global deadline: September 13, 23:59 PDT (September 14, 06:59 UTC). A saved draft is not submitted. Public usable product required; video and repository are optional. General rules do not prescribe a 2–4 minute video. AI assistance and edited demo captures must be disclosed. Existing work must be distinguished from event work; repository history starts September 12 at Create Next App scaffold 0fee63e, with app work and September 13 sprint in subsequent commits. This history establishes recorded development dates, not independent proof that no prior work existed.

| Challenge | Required evidence | SecondLook evidence |
|---|---|---|
| RevenueCat | SDK, offer, entitlement; before/after purchase and failed purchase OR expired access; sandbox accepted | Test Store SDK checkout, failed then valid purchase (01:07–01:24), server entitlement (01:24–01:40); no real charge |
| Linkup | Search/retrieve, store findings, use them to decide next investigation; deployed end-to-end flow | Saved first search, gap and targeted query (00:19–01:07), passages/uncertainty (01:40–02:16), generated PDF (02:37–02:58) |
| Nebius | Token Factory in main flow; small representative evaluation measuring accuracy, time or cost; results/method and difficult case | Four saved EN/ES regression inputs, 4/4 expected labels and valid excerpt references; inference latency 4.669–5.626 seconds; universal Miami adoption claim remains insufficient |

Evaluation timing is real Nebius inference over cached search evidence, not full end-to-end latency. Exact citation matching checks provenance, not source truth or whether the inference is correct. Four examples are a small regression set, not a general accuracy benchmark. See evaluation/README.md and scripts/evaluate.mjs.

Eligibility requires every mandatory integration, before scoring. Scoring: shipping 35, usefulness 25, challenge-specific quality 25, integration 15. Extra token usage is not a scoring advantage.

New video: https://youtu.be/rt0JESuXu0k — PUBLIC, 3:18, 2160p available. Working-app captures are edited and labeled; ElevenLabs Tommy narration disclosed. Form video, integration timestamps and evaluation method updated and saved. Remaining administrative step: Submit for judging. No final submission performed by this audit.
