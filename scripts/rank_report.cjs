/* Generate a deterministic, reproducible numeric report for Muru's pillar experiment.
   Run: node scripts/rank_report.cjs [--json] */
const {runRankExperiment}=require('../diagnostics.js');
const result=runRankExperiment();
if(process.argv.includes('--json')){process.stdout.write(JSON.stringify(result,null,2)+'\n');process.exit(0);}
function at(series,t,event){return series.samples.find(x=>x.look===t&&x.event===event);}
console.log('MURU V3 — 5 SEEDS / SAME SENSOR READINGS / COUPLING INTERVENTIONS');
console.log('Parameters: '+JSON.stringify(result.config));
console.log('Every regime and seed received the same observation indices and values.');
for(const key of ['eye','body','memory']){
 console.log('\n'+key.toUpperCase()+' / ΔW for weights, raw bank for memory');
 console.log('intervention | rank 24 | rank 48 pre | rank 48 reset | rank 96 | uniformity 96 | top share 96 | rms 96');
 for(const s of result.series){
  const pre=at(s,48,'look'),reset=at(s,48,'world_switch'),end=at(s,96,'look'),mid=at(s,24,'look');
  if(!pre||!reset||!end||!mid)throw Error('Missing checkpoint');
  const f=n=>Number(n).toFixed(3);
  console.log([s.id,f(mid[key].effectiveRank),f(pre[key].effectiveRank),f(reset[key].effectiveRank),f(end[key].effectiveRank),f(end[key].rowUniformity),f(end[key].topShare),f(end[key].rms)].join(' | '));
 }
}
console.log('\nREPORT_OK');

