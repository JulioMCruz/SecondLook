import fs from 'node:fs';
import {loadTs} from '../tests/load-ts.mjs';
for (const file of ['.env.local','.env']) if(fs.existsSync(file)) process.loadEnvFile(file);
const {firstLook,secondLook} = loadTs('src/lib/research.ts');
const {writeBrief,curateSources} = loadTs('src/lib/nebius.ts');
const cases = [
{claim:'WhatsApp is owned by Meta.',locale:'en',expected:'supported'},
{claim:'WhatsApp pertenece a Meta.',locale:'es',expected:'supported'},
{claim:'All my competitors in Miami already use AI to answer WhatsApp messages.',locale:'en',expected:'insufficient'},
{claim:'Todos mis competidores en Miami ya usan IA para responder WhatsApp.',locale:'es',expected:'insufficient'},
];
fs.mkdirSync('evaluation',{recursive:true});
for(const [i,c] of cases.entries()) {
const t=Date.now();try {
const cached = process.env.REPLAY === '1' ? JSON.parse(fs.readFileSync(`evaluation/case-${i+1}.json`,'utf8')) : null;
const first = cached?.first || await firstLook(c.claim,c.locale);
const result = cached ? {followUp:cached.followUp,...await writeBrief({claim:c.claim,locale:c.locale,firstLook:first.pass,followUp:cached.followUp})} : await secondLook(c.claim,{locale:c.locale,firstLook:first.pass,gap:first.gap});
const all=[...first.pass.sources,...result.followUp.sources];const citations=result.brief.findings.flatMap(f=>f.evidence);const valid=citations.every(e=>all.some(s=>s.id===e.sourceId&&s.snippet.includes(e.excerpt)));
const output={...c,first,...result,totalMs:Date.now()-t,validCitations:valid,expectedPresent:result.brief.findings.length === 1 && result.brief.findings.every(f=>f.status===c.expected)};
if(!output.validCitations || !output.expectedPresent) process.exitCode=1;
first.pass.sources=curateSources(first.pass.sources); first.pass.answer=first.pass.answer?.slice(0,6000); result.followUp.sources=curateSources(result.followUp.sources);result.followUp.answer=result.followUp.answer?.slice(0,6000);
fs.writeFileSync(`evaluation/case-${i+1}.json`,JSON.stringify(output,null,2));console.log(JSON.stringify({case:i+1,locale:c.locale,states:result.brief.findings.map(f=>f.status),tokens:result.metrics.totalTokens,totalMs:output.totalMs,validCitations:valid,expectedPresent:output.expectedPresent}));
} catch(e){console.log(JSON.stringify({case:i+1,error:e.message}));process.exitCode=1;}}
