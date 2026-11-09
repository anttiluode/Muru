const test=require('node:test');const assert=require('node:assert/strict');
const {Muru,AttentionBrain,makeScene,benchmark,FAMILIES}=require('../core.js');
test('seeded world and observer are deterministic',()=>{const a=new Muru({seed:5,worldSeed:8}),b=new Muru({seed:5,worldSeed:8});for(let i=0;i<16;i++){const x=a.look(),y=b.look();assert.equal(x.index,y.index);assert.equal(x.value,y.value);}assert.deepEqual(a.posterior,b.posterior);assert.deepEqual(a.preferences,b.preferences);});
test('unobserved ground truth is never read when choosing',()=>{const a=new Muru({seed:9,worldSeed:11});a.world.sensor={read(){throw Error('FORBIDDEN hidden pixels');}};for(const p of ['muru','variance','raster','random']){a.setPolicy(p);const idx=a.choose();assert.ok(idx>=0);}assert.throws(()=>a.look(0),/FORBIDDEN/);});
test('prediction uses hypotheses and updates after evidence',()=>{const a=new Muru({seed:9,worldSeed:14});const prior=a.posterior.slice();const result=a.look();assert.ok(result);assert.notDeepEqual(a.posterior,prior);assert.ok(result.psnr>0);assert.equal(a.obs.size,1);});
test('mutual ring changes both value matrices',()=>{const a=new Muru({seed:123,worldSeed:20});for(let i=0;i<6;i++)a.look();assert.ok(a.eye.drift()>.01);assert.ok(a.body.drift()>.01);});
test('clamp freezes cross-writes exactly (but preserves residual state)',()=>{const a=new Muru({seed:123,worldSeed:20});a.setMode('clamped');const e=a.eye.drift(),b=a.body.drift();assert.equal(e,0);assert.equal(b,0);for(let i=0;i<8;i++)a.look();assert.equal(a.eye.drift(),e);assert.equal(a.body.drift(),b);});
test('one-way clamp is directional',()=>{const a=new Muru({seed:3,worldSeed:20});a.setMode('eye-to-body');const e=a.eye.drift(),b=a.body.drift();for(let i=0;i<6;i++)a.look();assert.equal(a.eye.drift(),e);assert.notEqual(a.body.drift(),b);});
test('state stays finite after a long coupled loop and dreams',()=>{const a=new Muru({seed:17,worldSeed:40});for(let i=0;i<100;i++)a.look();a.dream(60);for(const brain of [a.eye,a.body])for(const row of brain.V)for(const value of row)assert.ok(Number.isFinite(value));assert.ok(Number.isFinite(a.snapshot().entropy));});
test('new world preserves the small habit but clears observations',()=>{const a=new Muru({seed:17,worldSeed:40});for(let i=0;i<10;i++)a.look();const prefs=a.preferences.slice();a.newWorld(100);assert.equal(a.obs.size,0);assert.deepEqual(a.preferences,prefs);assert.equal(a.archive.length,10);});
test('habit can be saved, restored, or completely reset',()=>{const a=new Muru({seed:17,worldSeed:40});a.look();a.look();const data=a.saveHabit();const b=new Muru({seed:17,worldSeed:40});assert.equal(b.loadHabit(data),true);assert.deepEqual(b.preferences,a.preferences);assert.equal(b.archive.length,2);b.resetMind();assert.deepEqual(b.preferences,new Array(8).fill(0));assert.equal(b.archive.length,0);});
test('benchmark is measured and reproducible',()=>{const a=benchmark({seeds:[8,12],looks:5}),b=benchmark({seeds:[8,12],looks:5});assert.deepEqual(a,b);assert.equal(a.length,8);for(const row of a){assert.ok(Number.isFinite(row.psnr));assert.ok(row.entropy>=0);}});
test('truth hook is separate from the hypothesis map',()=>{const world=makeScene(5,24,16,3);assert.equal(world.templates.length,FAMILIES.length);assert.equal(world.sensor.read(4),world.peek()[4]);assert.equal(Object.hasOwn(world,'trueValues'),false);});

test('Eye sees only four recent pixels, not older observations or the external posterior',()=>{
 const a=new Muru({seed:88,worldSeed:42});for(let i=0;i<7;i++)a.look(i*17);
 assert.equal(a.eyeTokens().length,16);
 const before=a.eyeTokens();a.history[0].value=.0001;a.posterior=[1,0,0,0,0];
 assert.deepEqual(a.eyeTokens(),before);
 a.history.at(-1).value=.98;
 assert.notDeepEqual(a.eyeTokens(),before);
});
test('Body receives processed Eye activities and its own slow state, not raw Eye tokens',()=>{
 const a=new Muru({seed:81,worldSeed:33});
 const original=a.body.forward.bind(a.body);let captured=null;
 a.body.forward=(tokens)=>{captured=tokens.map(r=>r.slice());return original(tokens);};
 a.look(36);
 assert.deepEqual(captured,a.bodyMemory);
 assert.notDeepEqual(captured,a.eyeTokens());
 // No hidden data or raw measurements needed to process or dream between looks.
 a.world.sensor={read(){throw Error('No raw pixel access from Body');}};
 a.updateBrains(null,true);a.dream(3);
 assert.ok(a.energies.bodyMemoryRms>0);
});
test('Body memory has different time constants and survives a world change',()=>{
 const a=new Muru({seed:81,worldSeed:33});for(let i=0;i<8;i++)a.look();
 const rms=row=>Math.sqrt(row.reduce((s,x)=>s+x*x,0)/row.length);
 assert.ok(rms(a.bodyMemory[0])>rms(a.bodyMemory[15]));
 const preserved=JSON.stringify(a.bodyMemory),bodyWeights=JSON.stringify(a.body.V);
 a.newWorld(82);
 assert.equal(a.eye.drift(),0);
 assert.equal(JSON.stringify(a.bodyMemory),preserved);
 assert.equal(JSON.stringify(a.body.V),bodyWeights);
 assert.ok(a.body.drift()>0);
});
test('Body regulation is permitted only by Body-to-Eye feedback',()=>{
 for(const mode of ['mutual','eye-to-body','body-to-eye','clamped']){
  const a=new Muru({seed:81,worldSeed:33});a.setMode(mode);for(let i=0;i<8;i++)a.look();
  const enabled=['mutual','body-to-eye'].includes(mode);
  assert.equal(a.bodyGuide.some(v=>v!==0),enabled,mode);
  assert.equal(a.body.drift()>0,['mutual','eye-to-body'].includes(mode),mode);
  if(!enabled)assert.equal(a.bodyPlasticity,1);
 }
});
test('Eye fast synapses leak when Body feedback is clamped after adaptation',()=>{
 const a=new Muru({seed:81,worldSeed:33});for(let i=0;i<10;i++)a.look();
 const eyeBefore=a.eye.drift(),bodyBefore=a.body.drift();
 a.setMode('clamped');a.look();a.look();
 assert.ok(a.eye.drift()<eyeBefore);
 assert.equal(a.body.drift(),bodyBefore);
 assert.ok(a.bodyMemory[0].some(v=>Math.abs(v)>0));
});
test('Dream reuses private history but does not acquire or inject new sensory data',()=>{
 const a=new Muru({seed:81,worldSeed:33});for(let i=0;i<6;i++)a.look();
 const memory=JSON.stringify(a.bodyMemory),observed=a.obs.size;
 a.world.sensor={read(){throw Error('No sensor during dreams');}};a.dream(20);
 assert.equal(JSON.stringify(a.bodyMemory),memory);
 assert.equal(a.obs.size,observed);
});
test('v2 saves Body memories, restores them, and accepts legacy v1 habits',()=>{
 const a=new Muru({seed:81,worldSeed:33});for(let i=0;i<14;i++)a.look();
 const saved=a.saveHabit();assert.equal(saved.version,2);
 const b=new Muru({seed:81,worldSeed:33});assert.equal(b.loadHabit(saved),true);
 assert.deepEqual(b.bodyMemory,a.bodyMemory);assert.deepEqual(b.body.V,a.body.V);
 const c=new Muru({seed:81,worldSeed:33});assert.equal(c.loadHabit({...saved,version:1}),true);
 assert.equal(c.energies.bodyMemoryRms,0);
 assert.equal(c.body.drift(),0);
 assert.equal(c.loadHabit({...saved,bodyMemory:[[NaN]]}),true);
});
test('Identical observations give identical Bayesian beliefs, but controller states differ by clamp',()=>{
 const a=new Muru({seed:18,worldSeed:50}),b=new Muru({seed:18,worldSeed:50});b.setMode('clamped');
 for(let i=0;i<14;i++){const index=(i*47)%384;a.look(index);b.look(index);}
 assert.deepEqual(a.posterior,b.posterior);
 assert.deepEqual(a.obs,b.obs);
 assert.ok(a.eye.drift()>0);assert.equal(b.eye.drift(),0);
 assert.ok(a.body.drift()>0);assert.equal(b.body.drift(),0);
 assert.ok(a.bodyGuide.some(v=>v!==0));assert.ok(b.bodyGuide.every(v=>v===0));
});
