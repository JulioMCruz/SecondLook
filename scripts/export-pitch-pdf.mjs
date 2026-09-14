import fs from 'node:fs';
import { loadTs } from '../tests/load-ts.mjs';
const { briefPdf } = loadTs('src/lib/brief-pdf.ts');
const record = JSON.parse(fs.readFileSync('docs/pitch-v4/assessment-from-pdf.json', 'utf8'));
fs.mkdirSync('tmp/pdf-review', { recursive: true });
fs.writeFileSync('docs/pitch-v4/secondlook-evidence-brief-en.pdf', Buffer.from(briefPdf(record)));
// Deliberately overflow several pages to inspect pagination and link preservation.
const long = structuredClone(record);
long.payload.brief.findings[0].explanation = ('Long evidence paragraph for pagination verification. ').repeat(150);
long.payload.firstLook.sources[0].url += '?reference=' + 'very-long-path-'.repeat(100);
long.payload.brief.questionsForSeller[2] += ' Final question end marker.';
fs.writeFileSync('tmp/pdf-review/long.pdf', Buffer.from(briefPdf(long)));
const es = structuredClone(record);
es.payload.brief.locale = 'es'; es.payload.brief.summary = 'La evidencia disponible no permite verificar la afirmación.';
fs.writeFileSync('tmp/pdf-review/spanish.pdf', Buffer.from(briefPdf(es)));
console.log('Exported original-case, overflow and Spanish-header PDFs.');
