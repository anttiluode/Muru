/* Muru Core v1 — deterministic, no-dependency active sensing and coupled attention.
 * MIT license; browser global MuruCore and Node module.exports.
 * Not a pretrained language model: both attention networks begin with seeded random weights.
 */
(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.MuruCore=api;})(typeof globalThis!=='undefined'?globalThis:this,function(){
'use strict';
const D=16,T=16,FAMILIES=['Bloom','Tide','Islands','Crystal','Vortex'];
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
function rng(seed){let a=(seed|0)>>>0;return()=>{a=(a+0x6D2B79F5)>>>0;let t=a;t=Math.imul(t^(t>>>15),t|1);t^=t+Math.imul(t^(t>>>7),t|61);return ((t^(t>>>14))>>>0)/4294967296;};}
function normal(rand){return Math.sqrt(-2*Math.log(Math.max(rand(),1e-12)))*Math.cos(2*Math.PI*rand());}
function mat(rand,scale=.20){return Array.from({length:D},()=>Array.from({length:D},()=>normal(rand)*scale));}
const copy=m=>m.map(r=>r.slice());
function project(a,m){const out=new Array(D).fill(0);for(let i=0;i<D;i++)for(let j=0;j<D;j++)out[j]+=a[i]*m[i][j];return out;}
function norm(v){const mean=v.reduce((s,x)=>s+x,0)/D;const std=Math.sqrt(v.reduce((s,x)=>s+(x-mean)**2,0)/D+1e-5);return v.map(x=>(x-mean)/std);}
function softmax(a){let max=Math.max(...a);const ex=a.map(x=>Math.exp(clamp(x-max,-100,0)));let s=ex.reduce((a,b)=>a+b,0);return ex.map(x=>x/s);}
function entropy(probs){return -probs.reduce((s,p)=>s+(p>0?p*Math.log(p):0),0);}
function keyFeatures(i,w,h){const x=(i%w+.5)/w,y=(Math.floor(i/w)+.5)/h;return [x,y,Math.sin(2*Math.PI*x),Math.cos(2*Math.PI*x),Math.sin(2*Math.PI*y),Math.cos(2*Math.PI*y),x*y,Math.abs(x-.5)+Math.abs(y-.5)];}
function familyValue(k,x,y,seed){
  const r=rng(seed+167);const px=(r()-.5)*.13,py=(r()-.5)*.13,ph=r()*Math.PI*2;
  x=x-.5+px;y=y-.5+py;
  const rad=Math.sqrt(x*x+y*y), ang=Math.atan2(y,x);
  let z=0;
  if(k===0)z=.50+.39*Math.cos(7*ang+ph)*Math.exp(-(((rad-.29)/.18)**2))+.15*Math.cos(22*rad+ph);
  if(k===1)z=.5+.34*Math.sin(17*x+4*Math.sin(8*y+ph))+.11*Math.cos(13*y-5*x);
  if(k===2)z=.50+.19*Math.sin(9*x+ph)*Math.cos(13*y)+.22*Math.sin(16*x-7*y)*Math.sin(5*y+ph);
  if(k===3)z=.43+.27*Math.cos(20*x+ph)*Math.cos(17*y-ph)+.18*Math.cos(13*(x+y));
  if(k===4)z=.50+.36*Math.sin(24*rad-4.3*ang+ph)*Math.exp(-.9*rad)+.10*Math.cos(18*rad);
  return clamp(z,.03,.97);
}
function makeScene(seed=1,w=24,h=16,kind){
  const rr=rng(seed+77519),truthKind=(kind===undefined?Math.floor(rr()*FAMILIES.length):kind);
  const templates=FAMILIES.map((_,k)=>Array.from({length:w*h},(_,i)=>familyValue(k,(i%w+.5)/w,(Math.floor(i/w)+.5)/h,seed)));
  const noise=rng(seed^0xabc983);
  const trueValues=templates[truthKind].map(v=>clamp(v+normal(noise)*.075,0,1));
  // The policy never receives trueValues. Only the sensor closure can read them.
  const sensor=Object.freeze({read(index){if(!Number.isInteger(index)||index<0||index>=w*h)throw Error('Invalid sensor index');return trueValues[index];}});
  const evaluate=(pred,observations)=>{let sq=0;for(let i=0;i<trueValues.length;i++){const v=observations.has(i)?observations.get(i):pred[i];sq+=(v-trueValues[i])**2;}const mse=sq/trueValues.length;return {mse,psnr:10*Math.log10(1/Math.max(1e-12,mse))};};
  const peek=()=>trueValues.slice(); // UI/debug only; not supplied to agent or its policies
  return {w,h,seed,kind:truthKind,templates,sensor,evaluate,peek};
}
class AttentionBrain{
 constructor(seed){const rand=rng(seed);this.baseV=mat(rand,.16);this.V=copy(this.baseV);this.Q=mat(rand,.20);this.K=mat(rand,.20);this.O=mat(rand,.20);this.M1=mat(rand,.12);this.M2=mat(rand,.12);this.last=Array.from({length:T},()=>new Array(D).fill(0));this.attention=new Array(T).fill(1/T);}
 forward(tokens){const x=tokens.map(t=>norm(t));const q=x.map(v=>project(v,this.Q)),k=x.map(v=>project(v,this.K)),v=x.map(v=>project(v,this.V));let attLast=[];
  const hidden=x.map((input,t)=>{const aggregate=new Array(D).fill(0);const combined=[];
   for(let h=0;h<2;h++){
    const offset=h*8,logits=[];for(let j=0;j<=t;j++){let dot=0;for(let f=0;f<8;f++)dot+=q[t][offset+f]*k[j][offset+f];logits.push(dot/Math.sqrt(8));}
    const a=softmax(logits);if(t===T-1)combined.push(a);
    for(let j=0;j<=t;j++)for(let f=0;f<8;f++)aggregate[offset+f]+=a[j]*v[j][offset+f];
   }
   if(t===T-1){attLast=new Array(T).fill(0);for(const head of combined)for(let j=0;j<head.length;j++)attLast[j]+=head[j]/2;}
   const out=project(aggregate,this.O);const residual=norm(input.map((z,i)=>z+.45*out[i]));const h1=project(residual,this.M1).map(Math.tanh);const ff=project(h1,this.M2);
   return norm(residual.map((z,i)=>z+.35*ff[i])).map(z=>Math.tanh(z*.65));
  });
  this.last=hidden;this.attention=attLast;return hidden;
 }
 writeFrom(other,gain,rate){if(gain<=0)return;for(let i=0;i<D;i++)for(let j=0;j<D;j++){
  const target=this.baseV[i][j]+gain*.36*other[i][j];
  this.V[i][j]=this.V[i][j]*(1-rate)+target*rate;
 }}
 drift(){let s=0;for(let i=0;i<D;i++)for(let j=0;j<D;j++)s+=(this.V[i][j]-this.baseV[i][j])**2;return Math.sqrt(s/(D*D));}
 energy(){let s=0;for(const row of this.last)for(const x of row)s+=x*x;return Math.sqrt(s/(T*D));}
}
class Muru{
 constructor(options={}){this.seed=options.seed||314159;this.w=options.w||24;this.h=options.h||16;this.rand=rng(this.seed^0x678ba);this.eye=new AttentionBrain(this.seed+7);this.body=new AttentionBrain(this.seed+11);this.preferences=new Array(8).fill(0);this.archive=[];this.episodes=0;this.steps=0;this.dreams=0;this.lastGain=0;this.coupling=.65;this.writeRate=.18;this.mode='mutual';this.policy='muru';this.lastChoice=-1;this.mood='watching';this.curiosity=1;this.newWorld(options.worldSeed||91,options.kind);}
 newWorld(seed=this.seed+this.episodes*37,kind){this.world=makeScene(seed,this.w,this.h,kind);this.episodes++;this.obs=new Map();this.lastChoice=-1;this.history=[];this.posterior=new Array(FAMILIES.length).fill(1/FAMILIES.length);this.logs=new Array(FAMILIES.length).fill(0);this.updateBrains(null,false);return this.snapshot();}
 // Token construction uses ONLY templates, observations and model state.
 tokens(){const tokens=[];for(let k=0;k<5;k++){const t=new Array(D).fill(0);t[0]=this.posterior[k]*3;t[1]=k/5;t[2]=Math.sin(k*1.9);t[3]=Math.cos(k*1.9);t[4]=entropy(this.posterior);t[10]=this.preferences[k];tokens.push(t);}
  const recent=this.history.slice(-11);for(let t=0;t<11;t++){
    const v=new Array(D).fill(0),o=recent[t];if(o){const f=keyFeatures(o.index,this.w,this.h);for(let j=0;j<f.length;j++)v[j]=f[j]*2-1;v[8]=o.value*2-1;v[9]=o.predicted*2-1;v[10]=clamp(o.gain,0,2);v[11]=(o.value-o.predicted)*2;v[12]=o.index/(this.w*this.h);v[13]=this.history.length/(this.w*this.h);v[14]=this.episodes/10;v[15]=1;}
    tokens.push(v);
  }return tokens;
 }
 updateBrains(input,allowWrite=true){const tokens=this.tokens();const bodyTokens=tokens.map((v,i)=>v.map((z,j)=>z*(j%3===0?-.8:1)+(j===7?this.preferences[i%8]:0)));
  const a=this.eye.forward(tokens),b=this.body.forward(bodyTokens);
  if(allowWrite&&(this.mode==='mutual'||this.mode==='eye-to-body'))this.body.writeFrom(a,this.coupling,this.writeRate);
  if(allowWrite&&(this.mode==='mutual'||this.mode==='body-to-eye'))this.eye.writeFrom(b,this.coupling,this.writeRate);
  this.energies={eye:this.eye.energy(),body:this.body.energy(),eyeDrift:this.eye.drift(),bodyDrift:this.body.drift()};
 }
 predict(){const p=new Array(this.w*this.h).fill(0);for(let k=0;k<FAMILIES.length;k++)for(let i=0;i<p.length;i++)p[i]+=this.posterior[k]*this.world.templates[k][i];return p;}
 posteriorVariance(index){let m=0,v=0;for(let k=0;k<FAMILIES.length;k++)m+=this.posterior[k]*this.world.templates[k][index];for(let k=0;k<FAMILIES.length;k++)v+=this.posterior[k]*(this.world.templates[k][index]-m)**2;return v;}
 neighborhoodDetail(index,pred){const x=index%this.w,y=Math.floor(index/this.w);let sum=0,n=0;
  for(const [dx,dy] of [[-1,0],[1,0],[0,-1],[0,1]]){const nx=x+dx,ny=y+dy;if(nx>=0&&nx<this.w&&ny>=0&&ny<this.h){sum+=Math.abs(pred[index]-pred[ny*this.w+nx]);n++;}}
  return sum/Math.max(n,1);
 }
 score(index,pred){if(this.obs.has(index))return -Infinity;
  const varScore=this.posteriorVariance(index),detail=this.neighborhoodDetail(index,pred);
  let score=varScore*3.8+detail*.15;
  if(this.policy==='muru'){
    const feat=keyFeatures(index,this.w,this.h);
    const preference=feat.reduce((s,z,j)=>s+z*this.preferences[j],0)/8;
    const row=this.eye.last[(index%T)],other=this.body.last[Math.floor(index/this.w)%T];
    const neural=feat.reduce((s,z,j)=>s+z*(row[j]-other[j]),0)/8;
    score+=.035*this.curiosity*neural+.06*preference;
    if(this.lastChoice>=0){const dx=index%this.w-this.lastChoice%this.w,dy=Math.floor(index/this.w)-Math.floor(this.lastChoice/this.w);score-=.004*Math.hypot(dx,dy)/Math.hypot(this.w,this.h);}
  }
  return score;
 }
 choose(){if(this.obs.size===this.w*this.h)return -1;
  if(this.policy==='random'){let k=Math.floor(this.rand()*(this.w*this.h-this.obs.size));for(let i=0;i<this.w*this.h;i++)if(!this.obs.has(i)){if(k--===0)return i;}}
  if(this.policy==='raster')for(let i=0;i<this.w*this.h;i++)if(!this.obs.has(i))return i;
  const pred=this.predict();let best=-Infinity,idx=-1;for(let i=0;i<pred.length;i++){const val=this.score(i,pred);if(val>best+1e-12){best=val;idx=i;}}return idx;
 }
 look(index){if(index===undefined)index=this.choose();if(!Number.isInteger(index)||index<0||index>=this.w*this.h||this.obs.has(index))return null;
  const oldEntropy=entropy(this.posterior),pred=this.predict(),value=this.world.sensor.read(index); // the ONLY sensing port
  const prior=pred[index];this.obs.set(index,value);
  for(let k=0;k<FAMILIES.length;k++){const e=value-this.world.templates[k][index];this.logs[k]-=.5*e*e/(.125*.125);}
  this.posterior=softmax(this.logs);
  const information=Math.max(0,oldEntropy-entropy(this.posterior));
  const error=Math.abs(value-prior);const gain=clamp(information,0,2);
  const features=keyFeatures(index,this.w,this.h);
  // Reward a look that reduces uncertainty about the world, NOT arbitrary unpredictability.
  if(this.policy==='muru'&&information>1e-5){for(let j=0;j<8;j++)this.preferences[j]=clamp(this.preferences[j]*.995+.09*information*(features[j]-.45),-1,1);}
  const event={index,value,predicted:prior,gain,error,step:++this.steps};
  this.history.push(event);this.archive.push(event);if(this.archive.length>300)this.archive.shift();this.lastChoice=index;this.lastGain=gain;
  this.mood=information>.22?'astonished':information>.035?'curious':error>.16?'puzzled':'content';
  this.updateBrains(event);return {...event,entropy:entropy(this.posterior),posterior:this.posterior.slice(),...this.world.evaluate(this.predict(),this.obs)};
 }
 dream(times=1){const n=clamp(times|0,0,60);for(let i=0;i<n;i++){
  if(this.archive.length){const remembered=this.archive[Math.floor(this.rand()*this.archive.length)];const f=keyFeatures(remembered.index,this.w,this.h);for(let j=0;j<8;j++)this.preferences[j]=clamp(this.preferences[j]*.999+.001*remembered.gain*(f[j]-.45),-1,1);}
  this.updateBrains(null);this.dreams++;
 }this.mood='dreaming';return this.snapshot();
 }
 setMode(mode){if(!['mutual','eye-to-body','body-to-eye','clamped'].includes(mode))throw Error('Invalid mode');this.mode=mode;}
 setPolicy(policy){if(!['muru','variance','random','raster'].includes(policy))throw Error('Invalid policy');this.policy=policy;}
 getMaps(){const predicted=this.predict(),truth=this.world.peek(),variance=predicted.map((_,i)=>this.posteriorVariance(i));return {predicted,truth,variance,seen:[...this.obs.entries()]};}
 snapshot(){return {posterior:this.posterior.slice(),entropy:entropy(this.posterior),looks:this.obs.size,mood:this.mood,energies:{...this.energies},preferences:this.preferences.slice(),lastChoice:this.lastChoice,kind:this.world.kind,seed:this.world.seed,psnr:this.world.evaluate(this.predict(),this.obs).psnr,episodes:this.episodes,dreams:this.dreams};}
 saveHabit(){return {version:1,preferences:this.preferences.slice(),archive:this.archive.slice(-200),episodes:this.episodes};}
 loadHabit(s){if(!s||s.version!==1||!Array.isArray(s.preferences)||s.preferences.length!==8)return false;this.preferences=s.preferences.map(x=>Number.isFinite(x)?clamp(x,-1,1):0);if(Array.isArray(s.archive))this.archive=s.archive.filter(x=>Number.isInteger(x.index)&&Number.isFinite(x.value)&&Number.isFinite(x.gain)).slice(-200);return true;}
 resetMind(){const seed=this.seed,worldSeed=this.world.seed,kind=this.world.kind;this.constructorReset(seed,worldSeed,kind);}
 constructorReset(seed,worldSeed,kind){const replacement=new Muru({seed,worldSeed,kind,w:this.w,h:this.h});Object.assign(this,replacement);}
}
function benchmark({seeds=[17,29,41,53,67],looks=16,w=24,h=16}={}){
 const policies=['random','raster','variance','muru'],modes=['mutual','clamped'];const results=[];
 for(const mode of modes)for(const policy of policies){let mse=0,psnr=0,entropySum=0,count=0;
  for(const s of seeds){const pet=new Muru({seed:s*17,worldSeed:s,w,h});pet.setMode(mode);pet.setPolicy(policy);for(let i=0;i<looks;i++)pet.look();const stats=pet.world.evaluate(pet.predict(),pet.obs);mse+=stats.mse;psnr+=stats.psnr;entropySum+=entropy(pet.posterior);count++;}
  results.push({mode,policy,looks,worlds:count,mse:mse/count,psnr:psnr/count,entropy:entropySum/count});
 }return results;
}
return {Muru,AttentionBrain,makeScene,benchmark,entropy,FAMILIES,rng,D,T};
});

