/* Muru browser laboratory. Offline: no external imports, calls, uploads or dependencies. */
(function(){'use strict';
const $=id=>document.getElementById(id);
const C=window.MuruCore;if(!C){document.body.textContent='Missing core.js';return;}
let pet=new C.Muru({seed:1047,worldSeed:71}),showTruth=false,playing=false,worldSerial=71,trace=[];
const storage='muru.v1.habit'; // Keep v1 storage key for automatic migration to v2.try{pet.loadHabit(JSON.parse(localStorage.getItem(storage)));}catch(_){}
function persist(){try{localStorage.setItem(storage,JSON.stringify(pet.saveHabit()));}catch(_){}}
const ctx=(id)=>$(id).getContext('2d');
function color(v,brightness=1){v=Math.max(0,Math.min(1,v));const low=[14,55,59],mid=[41,138,121],hi=[190,250,178],top=[254,224,146];let a,b,t;
 if(v<.42){a=low;b=mid;t=v/.42;}else if(v<.75){a=mid;b=hi;t=(v-.42)/.33;}else{a=hi;b=top;t=(v-.75)/.25;}
 return `rgb(${a.map((z,i)=>Math.round((z+(b[i]-z)*t)*brightness)).join(',')})`;
}
function renderWorld(){const canvas=$('world'),c=ctx('world'),W=canvas.width,H=canvas.height;
 const {predicted,truth,variance,seen}=pet.getMaps(),w=pet.w,h=pet.h,cw=W/w,ch=H/h;
 c.fillStyle='#091b17';c.fillRect(0,0,W,H);
 const obs=new Map(seen),maxVar=Math.max(.002,...variance);
 for(let i=0;i<w*h;i++){
  const x=(i%w)*cw,y=Math.floor(i/w)*ch;
  const seenHere=obs.has(i),value=showTruth?truth[i]:(seenHere?obs.get(i):predicted[i]);
  c.fillStyle=color(value,showTruth?1:seenHere?1:.57);c.fillRect(x,y,cw+.6,ch+.6);
  if(!showTruth&&!seenHere){const a=Math.min(.52,.08+variance[i]/maxVar*.40);c.fillStyle=`rgba(10,27,25,${a})`;c.fillRect(x,y,cw+.2,ch+.2);}
  if(seenHere){c.fillStyle='#d1ffe842';c.fillRect(x,y,cw,ch);c.strokeStyle='#ecffcb99';c.lineWidth=2;c.strokeRect(x+2,y+2,cw-4,ch-4);}
 }
 c.strokeStyle='#e6ffe70b';c.lineWidth=1;for(let x=1;x<w;x++){c.beginPath();c.moveTo(x*cw,0);c.lineTo(x*cw,H);c.stroke();}for(let y=1;y<h;y++){c.beginPath();c.moveTo(0,y*ch);c.lineTo(W,y*ch);c.stroke();}
 const path=pet.history.slice(-30);if(path.length){c.beginPath();for(let j=0;j<path.length;j++){const i=path[j].index,x=(i%w+.5)*cw,y=(Math.floor(i/w)+.5)*ch;if(j)c.lineTo(x,y);else c.moveTo(x,y);}c.strokeStyle='#e6fff89c';c.lineWidth=2;c.stroke();}
 if(pet.lastChoice>=0){const i=pet.lastChoice,x=(i%w+.5)*cw,y=(Math.floor(i/w)+.5)*ch;
  c.fillStyle='#f3ffe5';c.beginPath();c.ellipse(x,y,12,10,0,0,Math.PI*2);c.fill();c.fillStyle='#063b32';c.beginPath();c.arc(x-4,y-1,2.5,0,7);c.arc(x+4,y-1,2.5,0,7);c.fill();
  c.strokeStyle='#e4ffd2';c.lineWidth=2;c.beginPath();c.arc(x,y,19,0,Math.PI*2);c.stroke();
 }
 $('worldHint').textContent=showTruth?'You are seeing the hidden answer. Muru cannot.':pet.obs.size?`Last look: ${pet.mood} · ${pet.obs.size}/${pet.w*pet.h} cells observed`:'Muru has never seen this place.';
}
function renderPortrait(time){const canvas=$('portrait'),c=ctx('portrait'),t=time/1000;
 c.clearRect(0,0,canvas.width,canvas.height);
 for(let i=0;i<10;i++){const x=95+73*Math.sin(i*2.9+t*.12),y=72+57*Math.cos(i*1.7+t*.15);c.fillStyle=`rgba(159,242,196,${.12+(i%3)*.06})`;c.beginPath();c.arc(x,y,i%3+1,0,7);c.fill();}
 const cy=83+Math.sin(t*2)*3;
 c.fillStyle='#0b352b';c.beginPath();c.ellipse(95,139,57,11,0,0,7);c.fill();
 c.fillStyle='#c2ffbf';c.strokeStyle='#8ce2a5';c.lineWidth=3;
 c.beginPath();c.moveTo(48,cy-17);c.quadraticCurveTo(30,cy-64,52,cy-63);c.quadraticCurveTo(72,cy-67,78,cy-44);c.quadraticCurveTo(97,cy-55,112,cy-44);c.quadraticCurveTo(126,cy-72,147,cy-58);c.quadraticCurveTo(156,cy-42,143,cy-19);c.bezierCurveTo(170,cy+14,139,cy+43,96,cy+45);c.bezierCurveTo(44,cy+45,25,cy+17,48,cy-17);c.fill();c.stroke();
 c.fillStyle='#5b9b76';c.beginPath();c.ellipse(92,cy+11,40,30,0,0,7);c.fill();
 const blinking=Math.sin(t*.7)> .988;
 c.strokeStyle='#092f26';c.lineWidth=4;c.lineCap='round';
 if(blinking){for(const x of [77,111]){c.beginPath();c.moveTo(x-6,cy-1);c.lineTo(x+6,cy-1);c.stroke();}}
 else{for(const x of [76,111]){c.fillStyle='#072e23';c.beginPath();c.ellipse(x,cy-4,6.5,10,0,0,7);c.fill();c.fillStyle='#effff4';c.beginPath();c.arc(x-2,cy-7,2.8,0,7);c.fill();}}
 c.fillStyle='#db997e';for(const x of [61,128]){c.beginPath();c.arc(x,cy+12,8,0,7);c.fill();}
 c.strokeStyle='#134e3c';c.lineWidth=2;c.beginPath();c.arc(94,cy+13,5,.1,Math.PI-.1);c.stroke();
 if(pet.mood==='dreaming'){c.fillStyle='#f5d8a0';c.font='16px sans-serif';c.fillText('✦',151,50);} 
 requestAnimationFrame(renderPortrait);
}
function renderTrace(){const canvas=$('trace'),c=ctx('trace'),W=canvas.width,H=canvas.height;c.clearRect(0,0,W,H);
 c.fillStyle='#092118';c.fillRect(0,0,W,H);c.strokeStyle='#335347';c.lineWidth=1;c.font='14px sans-serif';c.fillStyle='#8bbaaa';
 for(let i=0;i<5;i++){const y=22+i*(H-48)/4;c.beginPath();c.moveTo(40,y);c.lineTo(W-18,y);c.stroke();c.fillText((1.61-i*1.61/4).toFixed(2),5,y+5);}
 if(!trace.length)return;
 function curve(key,max,color){c.strokeStyle=color;c.lineWidth=3;c.beginPath();trace.forEach((p,i)=>{const x=40+i/Math.max(24,trace.length-1)*(W-65),y=H-26-Math.min(1,Math.max(0,p[key]/max))*(H-48);if(i)c.lineTo(x,y);else c.moveTo(x,y);});c.stroke();}
 curve('entropy',Math.log(5),'#64e6ca');curve('psnr',32,'#fbb094');
 c.fillStyle='#abcdbf';c.font='13px sans-serif';c.fillText('LOOK 0',40,H-8);c.fillText(`LOOK ${Math.max(trace.length-1,24)}`,W-105,H-8);
}
function renderMatrices(){function draw(id,values,scale){const canvas=$(id),c=ctx(id),size=canvas.width/C.D;
  for(let i=0;i<C.D;i++)for(let j=0;j<C.D;j++){const value=values[i][j],z=Math.min(1,Math.abs(value)/scale);c.fillStyle=value>=0?`rgb(${Math.round(15+z*111)},${Math.round(38+z*195)},${Math.round(32+z*163)})`:`rgb(${Math.round(32+z*197)},${Math.round(36+z*95)},${Math.round(41+z*101)})`;c.fillRect(j*size,i*size,size+.5,size+.5);}}
 const delta=brain=>brain.V.map((row,i)=>row.map((v,j)=>v-brain.baseV[i][j]));
 draw('eyeMatrix',delta(pet.eye),.26);draw('bodyMatrix',delta(pet.body),.26);draw('bodyMemory',pet.bodyMemory,.55);
 $('eyeDrift').textContent=pet.eye.drift().toFixed(4);$('bodyDrift').textContent=pet.body.drift().toFixed(4);
 $('memoryRms').textContent=pet.energies.bodyMemoryRms.toFixed(4);
 $('regulation').textContent=`${pet.bodyGuide.some(x=>x!==0)?'ON':'OFF'} · Eye plasticity ×${pet.bodyPlasticity.toFixed(2)}`;
}
function renderBeliefs(){const root=$('hypotheses');root.replaceChildren();C.FAMILIES.forEach((name,i)=>{
 const container=document.createElement('div'),header=document.createElement('div'),label=document.createElement('span'),pct=document.createElement('strong'),bg=document.createElement('div'),bar=document.createElement('div');
 header.className='bar-header';label.textContent=name;pct.textContent=(pet.posterior[i]*100).toFixed(1)+'%';header.append(label,pct);bg.className='bar-bg';bar.className='bar-fg';bar.style.width=(pet.posterior[i]*100).toFixed(3)+'%';bg.append(bar);container.append(header,bg);root.append(container);
 });const winner=pet.posterior.indexOf(Math.max(...pet.posterior));$('beliefCaption').textContent=pet.obs.size?`Most likely: ${C.FAMILIES[winner]}. The world really is ${C.FAMILIES[pet.world.kind]}, but Muru only knows what its measurements support.`:'A blank slate: all five candidate worlds equally plausible.';
}
function renderHabit(){const root=$('habit');root.replaceChildren();pet.preferences.forEach(x=>{const bar=document.createElement('span');bar.className=x<0?'negative':'';bar.style.height=`${Math.round(7+Math.abs(x)*42)}px`;bar.title=x.toFixed(4);root.append(bar);});$('dreamCounter').textContent=`${pet.dreams} dream ticks · ${pet.archive.length} remembered observations. Habits and Body's slow memory persist in browser storage; the Eye's short sensory trace resets on reload.`;}
function render(){const s=pet.snapshot();$('looks').innerHTML=`${s.looks} <small>/ ${pet.w*pet.h}</small>`;$('uncertainty').innerHTML=`${s.entropy.toFixed(3)} <small>nats</small>`;$('psnr').innerHTML=`${s.psnr.toFixed(2)} <small>dB PSNR</small>`;$('drift').innerHTML=`${((s.energies.eyeDrift+s.energies.bodyDrift)/2).toFixed(4)} <small>RMS</small>`;
 $('mood').textContent=s.mood;$('sceneLabel').textContent=`WORLD #${s.seed} · ${s.looks} samples`;$('linkLabel').textContent={mutual:'mutual write','eye-to-body':'eye → body','body-to-eye':'body → eye',clamped:'no write'}[pet.mode];
 renderWorld();renderTrace();renderMatrices();renderBeliefs();renderHabit();
}
function syncControls(){pet.setPolicy($('policy').value);pet.setMode($('mode').value);pet.coupling=Number($('coupling').value);pet.curiosity=Number($('curiosity').value);$('couplingValue').textContent=pet.coupling.toFixed(2);$('curiosityValue').textContent=pet.curiosity.toFixed(2);}
function look(index){const event=pet.look(index);if(event){trace.push({entropy:event.entropy,psnr:event.psnr});persist();render();}return event;}
$('look').addEventListener('click',()=>look());
$('world').addEventListener('click',e=>{if(playing)return;const rect=e.currentTarget.getBoundingClientRect();const x=Math.floor((e.clientX-rect.left)/rect.width*pet.w),y=Math.floor((e.clientY-rect.top)/rect.height*pet.h);look(y*pet.w+x);});
$('world').addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();look();}});
$('play').addEventListener('click',async()=>{if(playing){playing=false;return;}playing=true;const button=$('play');button.textContent='■ Stop exploring';
 for(let i=0;i<20&&playing;i++){if(!look())break;await new Promise(resolve=>setTimeout(resolve,85));}
 playing=false;button.textContent='▶ Explore 20';});
$('dream').addEventListener('click',()=>{pet.dream(20);persist();render();});
$('newWorld').addEventListener('click',()=>{playing=false;worldSerial+=Math.floor(7+Math.random()*10000);pet.newWorld(worldSerial);trace=[{entropy:Math.log(C.FAMILIES.length),psnr:pet.snapshot().psnr}];render();});
$('peek').addEventListener('change',e=>{showTruth=e.target.checked;renderWorld();});
$('reset').addEventListener('click',()=>{playing=false;pet.resetMind();trace=[];syncControls();try{localStorage.removeItem(storage);}catch(_){}render();});
$('download').addEventListener('click',()=>{const data=JSON.stringify({...pet.saveHabit(),meta:{project:'Muru v2',date:new Date().toISOString(),notAPretrainedModel:true}},null,2);const url=URL.createObjectURL(new Blob([data],{type:'application/json'}));const a=document.createElement('a');a.href=url;a.download='muru-v2-memory.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);});
$('policy').addEventListener('change',()=>{syncControls();render();});$('mode').addEventListener('change',()=>{syncControls();render();});
for(const id of ['coupling','curiosity'])$(id).addEventListener('input',()=>{syncControls();render();});
$('benchmark').addEventListener('click',async()=>{const button=$('benchmark'),out=$('benchmarkResults');button.disabled=true;out.textContent='Running 5 worlds × 4 policies × 2 coupling modes × 12 looks…';await new Promise(r=>setTimeout(r,50));
 try{const result=C.benchmark({seeds:[17,29,41,53,67],looks:12});const table=document.createElement('table'),head=document.createElement('tr');for(const s of ['Coupling','Policy','PSNR ↑','Entropy ↓']){const th=document.createElement('th');th.textContent=s;head.append(th);}table.append(head);
 result.forEach(r=>{const tr=document.createElement('tr');for(const val of [r.mode,r.policy,r.psnr.toFixed(2)+' dB',r.entropy.toFixed(4)]){const td=document.createElement('td');td.textContent=val;tr.append(td);}table.append(tr);});out.replaceChildren(table);
 const note=document.createElement('p');note.textContent='The Bayesian variance policy has direct access to the candidate hypothesis predictions, not the hidden answers. Score uses hidden truth only AFTER measurement. Real learning advantage is not assumed.';out.append(note);
 }catch(e){out.textContent='Benchmark failed: '+e.message;}finally{button.disabled=false;}});
syncControls();trace=[{entropy:Math.log(C.FAMILIES.length),psnr:pet.snapshot().psnr}];render();requestAnimationFrame(renderPortrait);
})();
