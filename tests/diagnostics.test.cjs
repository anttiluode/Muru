const test=require('node:test');const assert=require('node:assert/strict');
const {matrixStats,runRankExperiment}=require('../diagnostics.js');
function close(actual,expected,eps=1e-7){assert.ok(Math.abs(actual-expected)<eps,'expected '+actual+' ≈ '+expected);}
test('zero matrix has no rank or row coherence',()=>{const x=matrixStats(Array.from({length:16},()=>Array(16).fill(0)));assert.equal(x.effectiveRank,0);assert.equal(x.rowUniformity,0);});
test('a pillar matrix of identical rows has rank one and row uniformity one',()=>{
 const x=matrixStats(Array.from({length:16},()=>Array.from({length:16},(_,i)=>Math.sin(i))));
 close(x.effectiveRank,1);close(x.stableRank,1);close(x.topShare,1);close(x.rowUniformity,1);
});
test('identity matrix has full rank and low row uniformity',()=>{
 const x=matrixStats(Array.from({length:16},(_,i)=>Array.from({length:16},(_,j)=>+(i===j))));
 close(x.effectiveRank,16);close(x.stableRank,16);close(x.topShare,1/16);close(x.rowUniformity,1/16);
});
test('two orthogonal nonzero rows have rank two',()=>{
 const m=Array.from({length:16},()=>new Array(16).fill(0));m[0][0]=1;m[1][1]=1;
 close(matrixStats(m).effectiveRank,2);
});
test('scaling a matrix preserves effective rank and row uniformity',()=>{
 const m=Array.from({length:16},(_,i)=>Array.from({length:16},(_,j)=>Math.sin(i*.2+j*.43)));
 const a=matrixStats(m),b=matrixStats(m.map(row=>row.map(x=>x*1e-3)));
 close(a.effectiveRank,b.effectiveRank);close(a.rowUniformity,b.rowUniformity);
});
test('the two worlds and post-clamp interventions replay exactly matching observations',()=>{
 const out=runRankExperiment({seeds:[5,7],firstWorldLooks:12,secondWorldLooks:8,clampAfter:6,sampleEvery:2});
 assert.equal(out.perSeed.length,2);
 const [mutual,later,clamped]=out.perSeed[0].regimes;
 assert.deepEqual(mutual.map(x=>[x.look,x.event]),later.map(x=>[x.look,x.event]));
 assert.deepEqual(mutual.map(x=>[x.look,x.event]),clamped.map(x=>[x.look,x.event]));
 assert.equal(out.perSeed[0].matchedObservations,true);
 assert.ok(mutual.at(-1).eye.rms>0);
 assert.equal(clamped.at(-1).eye.effectiveRank,0);
 assert.equal(clamped.at(-1).body.effectiveRank,0);
 const idx=mutual.findIndex(x=>x.event==='world_switch');
 assert.ok(idx>=0);assert.equal(mutual[idx].look,12);
 assert.equal(mutual[idx].eye.effectiveRank,0);
 assert.ok(mutual[idx].body.effectiveRank>0);
 assert.ok(mutual[idx].memory.effectiveRank>0);
 close(later[idx].eye.effectiveRank,0);
 const before=later.findLast(x=>x.look===6);
 assert.ok(before.body.rms>0);
 // After clamping, the already written Body weights remain unchanged.
 close(later.at(-1).body.rms,before.body.rms);
 // The Body still receives processed signals when weight feedback is clamped.
 assert.ok(later.at(-1).memory.rms>0);
});
test('bad shapes and ill-defined run lengths fail immediately',()=>{
 assert.throws(()=>matrixStats([[1],[1,2]]),/Invalid matrix/);
 assert.throws(()=>runRankExperiment({seeds:[],firstWorldLooks:4}),/Invalid/);
 assert.throws(()=>runRankExperiment({clampAfter:48}),/Invalid/);
});
