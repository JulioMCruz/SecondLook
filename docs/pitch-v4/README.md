# Editorial PDF pitch revision

Builds on pitch-v3 with a new Matthew (Friendly, Warm and Resonant) ElevenLabs narration, retimed captions and a three-page editorial PDF sequence. Duration: 196 seconds; output: 3840×2160 at 30 fps. Publication details are recorded after delivery.

The fixture reconstructs only the published report content from the downloaded SecondLook PDF for record 4c5dd055. It contains the original summary, finding, three quotes and URLs, missing evidence, research update and seller questions. User identity is a placeholder; the original export includes a date only, no time. Search query/timing fields are placeholders required by the record type and must not be presented as measured research data. The original 51-source search is not reconstructed. No new research or AI-generated finding was added.

Run `node scripts/export-pitch-pdf.mjs` from the app root. The same `briefPdf` generator serves application preview, download and email. English is used by the demo fixture; Spanish app reports retain their locale.

## Validation

11 application tests pass. TypeScript and production build passed for the PDF change. HyperFrames 0.8.37 check reports zero errors or warnings, with 65/65 contrast checks passing. Seven key frames were visually reviewed, including all three PDF pages. Narration uses Multilingual v2, speed 1, stability 50, similarity 75, style 0 and speaker boost. Audio is normalized to -16 LUFS with a -1.5 dBTP target. Captions are aligned to the new recording.

Rebuild: `python3 build_v4.py`. Render: `npm run render -- --quality high --resolution 4k --crf 16 --fps 30 --workers 4 --output secondlook-pitch-v4-4k-final.mp4`.
