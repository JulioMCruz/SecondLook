import fs from 'node:fs';
import {loadTs} from '../tests/load-ts.mjs';
for (const file of ['.env.local','.env']) if(fs.existsSync(file)) process.loadEnvFile(file);
const {firstLook,secondLook} = loadTs('src/lib/research.ts');
const cases = [
{claim:'WhatsApp is owned by Meta.',locale:'en',expected:'supported'},
{claim:'WhatsApp pertenece a Meta.',locale:'es',expected:'supported'},
{claim:'All my competitors in Miami already use AI to answer WhatsApp messages.',locale:'en',expected:'insufficient'},
{claim:'Todos mis competidores en Miami ya usan IA para responder WhatsApp.',locale:'es',expected:'insufficient'},
];
fs.mkdirSync('evaluation',{recursive:true});
for(const [i,c] of cases.entries()) {
const t=Date.now();try {const first=await firstLook(c.claim,c.locale);const result=await secondLook(c.claim,{locale:c.locale,firstLook:first.pass,gap:first.gap});
const all=[...first.pass.sources,...result.followUp.sources];const citations=result.brief.findings.flatMap(f=>f.evidence);const valid=citations.every(e=>all.some(s=>s.id===e.sourceId&&s.snippet.includes(e.excerpt)));
const output={...c,first,...result,totalMs:Date.now()-t,validCitations:valid,expectedPresent:result.brief.findings.some(f=>f.status===c.expected)};
fs.writeFileSync(`evaluation/case-${i+1}.json`,JSON.stringify(output,null,2));console.log(JSON.stringify({case:i+1,locale:c.locale,states:result.brief.findings.map(f=>f.status),tokens:result.metrics.totalTokens,totalMs:output.totalMs,validCitations:valid,expectedPresent:output.expectedPresent}));
} catch(e){console.log(JSON.stringify({case:i+1,error:e.message}));process.exitCode=1;}}
