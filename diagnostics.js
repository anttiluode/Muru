/* Muru rank laboratory v3 — independent, deterministic, no dependencies.
 * Measures effective rank of weight CHANGES, not total random weight matrices.
 * Also measures the Body's private slow memory. No truth information enters policies.
 */
(function(root,factory){
  const api=factory(typeof module!=='undefined'&&module.exports?require('./core.js'):root.MuruCore);
  if(typeof module!=='undefined'&&module.exports)module.exports=api;
  else root.MuruDiagnostics=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(Core){
 'use strict';
 function matrixStats(m){
  if(!Array.isArray(m)||!m.length||!Array.isArray(m[0]))throw Error('Expected matrix');
  const rows=m.length,cols=m[0].length;
  if(!cols||m.some(row=>!Array.isArray(row)||row.length!==cols||row.some(x=>!Number.isFinite(x))))throw Error('Invalid matrix');
  const gram=Array.from({length:cols},()=>new Array(cols).fill(0));
  const mean=new Array(cols).fill(0);let energy=0;
  for(const row of m)for(let j=0;j<cols;j++){
   mean[j]+=row[j]/rows;energy+=row[j]*row[j];
   for(let k=j;k<cols;k++)gram[j][k]+=row[j]*row[k];
  }
  if(energy<=1e-24)return {effectiveRank:0,stableRank:0,topShare:0,rowUniformity:0,rms:0};
  for(let j=0;j<cols;j++)for(let k=j+1;k<cols;k++)gram[k][j]=gram[j][k];
  // Symmetric Jacobi eigensolver for the small (16 x 16) Gram matrix M^T M.
  // Eigenvalues are squared singular values; no matrix library is needed.
  for(let sweep=0;sweep<28;sweep++){
   let maxOff=0;
   for(let p=0;p<cols-1;p++)for(let q=p+1;q<cols;q++){
    const a=gram[p][q],abs=Math.abs(a);if(abs>maxOff)maxOff=abs;
    if(abs<1e-14*energy/cols)continue;
    const tau=(gram[q][q]-gram[p][p])/(2*a);
    const t=(tau>=0?1:-1)/(Math.abs(tau)+Math.sqrt(1+tau*tau));
    const c=1/Math.sqrt(1+t*t),s=t*c;
    const pp=gram[p][p],qq=gram[q][q];
    gram[p][p]=pp-t*a;gram[q][q]=qq+t*a;gram[p][q]=0;gram[q][p]=0;
    for(let k=0;k<cols;k++)if(k!==p&&k!==q){
     const kp=gram[k][p],kq=gram[k][q];
     gram[k][p]=gram[p][k]=c*kp-s*kq;
     gram[k][q]=gram[q][k]=s*kp+c*kq;
    }
   }
   if(maxOff<1e-12*energy)break;
  }
  const eig=gram.map((r,i)=>Math.max(0,r[i]));
  const sum=eig.reduce((a,b)=>a+b,0);
  if(sum<=0)throw Error('Spectral decomposition failed');
  const p=eig.map(x=>x/sum);
  let entropy=0;for(const x of p)if(x>0)entropy-=x*Math.log(x);
  const topShare=Math.max(...p);
  let meanEnergy=0;for(const x of mean)meanEnergy+=x*x;
  return {effectiveRank:Math.exp(entropy),stableRank:1/topShare,topShare,
   rowUniformity:Math.max(0,Math.min(1,rows*meanEnergy/energy)),
   rms:Math.sqrt(energy/(rows*cols))};
 }
 function delta(brain){return brain.V.map((row,i)=>row.map((x,j)=>x-brain.baseV[i][j]));}
 function capture(pet,look,event){
  const state=pet.snapshot();
  return {look,event,eye:matrixStats(delta(pet.eye)),body:matrixStats(delta(pet.body)),
   memory:matrixStats(pet.bodyMemory),eyeDrift:state.energies.eyeDrift,
   bodyDrift:state.energies.bodyDrift,entropy:state.entropy,psnr:state.psnr};
 }
 const regimes=[
  {id:'mutual',label:'Mutual throughout'},
  {id:'clamp_later',label:'Clamp after look 24'},
  {id:'clamped',label:'Clamped from start'}
 ];
 function avg(arr){const n=arr.length,m=arr.reduce((a,b)=>a+b,0)/n;return {mean:m,sd:Math.sqrt(arr.reduce((a,b)=>a+(b-m)**2,0)/n)};}
 function runRankExperiment(options={}){
  const seeds=options.seeds===undefined?[17,29,41,53,67]:options.seeds;
  const first=options.firstWorldLooks===undefined?48:options.firstWorldLooks;
  const second=options.secondWorldLooks===undefined?48:options.secondWorldLooks;
  const clampAfter=options.clampAfter===undefined?24:options.clampAfter;
  const sampleEvery=options.sampleEvery===undefined?4:options.sampleEvery;
  if(!Array.isArray(seeds)||!seeds.length||seeds.length>8||seeds.some(x=>!Number.isSafeInteger(x)||x<1||x>100000)||
   !Number.isInteger(first)||first<4||first>128||!Number.isInteger(second)||second<1||second>128||
   !Number.isInteger(clampAfter)||clampAfter<1||clampAfter>=first||
   !Number.isInteger(sampleEvery)||sampleEvery<1||sampleEvery>16)throw Error('Invalid experiment parameters');
  const perSeed=[];
  for(const seed of seeds){
   const pets=regimes.map(()=>new Core.Muru({seed:seed*17+1047,worldSeed:seed}));
   pets[2].setMode('clamped');
   const records=regimes.map(()=>[]);
   function record(look,event){pets.forEach((pet,k)=>records[k].push(capture(pet,look,event)));}
   record(0,'start');
   for(let t=1;t<=first+second;t++){
    if(t===clampAfter+1)pets[1].setMode('clamped');
    if(t===first+1){for(const pet of pets)pet.newWorld(seed+10000);record(first,'world_switch');}
    const inWorld=t<=first?t-1:t-first-1;
    const index=(73*inWorld+(seed*17+(t>first?31:0)))%(24*16);
    const event=pets.map(pet=>pet.look(index));
    if(event.some(e=>!e||e.index!==index||e.value!==event[0].value))throw Error('Observation mismatch');
    for(let k=1;k<pets.length;k++){
     if(pets[k].posterior.some((x,i)=>Math.abs(x-pets[0].posterior[i])>1e-12))throw Error('Belief mismatch');
    }
    if(t%sampleEvery===0||t===clampAfter||t===first||t===first+second)record(t,'look');
   }
   perSeed.push({seed,matchedObservations:true,regimes:records});
  }
  const keys=['eye','body','memory'],metrics=['effectiveRank','stableRank','topShare','rowUniformity','rms'];
  const series=regimes.map((regime,k)=>{
   const base=perSeed[0].regimes[k];
   return {...regime,samples:base.map((sample,i)=>{
    const out={look:sample.look,event:sample.event};
    for(const key of keys){
     out[key]={};
     for(const metric of metrics){
      const values=perSeed.map(x=>x.regimes[k][i][key][metric]);
      out[key][metric]=avg(values).mean;
      out[key][metric+'Sd']=avg(values).sd;
     }
    }
    for(const metric of ['eyeDrift','bodyDrift','entropy','psnr'])
     out[metric]=avg(perSeed.map(x=>x.regimes[k][i][metric])).mean;
    return out;
   })};
  });
  return {version:3,config:{seeds,firstWorldLooks:first,secondWorldLooks:second,clampAfter,sampleEvery,
   sampling:'Same predetermined locations and hidden values for all three arms; worlds change after firstWorldLooks; no training'},
   definitions:{
    effectiveRank:'exp(-sum p*ln(p)), with p = squared singular values / total. Zero matrix has effective rank 0.',
    rowUniformity:'row_count * squared norm of mean row / squared Frobenius norm (0..1). Identical rows give 1.',
    measured:'Eye/Body are W_V minus their initial random W_V; memory is Body slow-memory matrix. Not a measure of knowledge.'
   },regimes,series,perSeed};
 }
 return {matrixStats,runRankExperiment};
});
