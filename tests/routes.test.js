import test from'node:test';import assert from'node:assert/strict';import{freshSave}from'../src/model.js';import{SKILLS,CHAPTERS}from'../src/data.js';import{Game}from'../src/engine.js';
test('main terrain routes are physically traversable with the chapter hero and required abilities',()=>{
 for(let n=0;n<10;n++){
 const s={...freshSave(),hero:CHAPTERS[n].hero,rescued:[0,1,2,3],completed:Array.from({length:10},(_,i)=>i),skills:SKILLS.map(a=>a.id),xp:0};const g=new Game(s);g.begin(n,false);g.world.enemies=[];g.world.hazards=[];g.run.solved=true;g.run.phoenix=true;g.keys.KeyD=true;g.keys.Space=true;let stuck=0,last=0,max=0;
 for(let i=0;i<160*120&&g.mode==='play';i++){
  const p=g.p,w=g.world,feet=p.y+p.h;const tunnel=w.solids.find(b=>b.ceiling&&p.x>b.x-70&&p.x<b.x+b.w+15);g.keys.KeyS=!!tunnel;
  const support=[...w.solids,...w.ledges.filter(b=>!b.hidden||g.run.revealed.includes(b.id))].find(b=>Math.abs(b.y-feet)<5&&p.x+p.w>b.x&&p.x<b.x+b.w);
  const step=w.ledges.find(b=>b.x>p.x+5&&b.x<p.x+120&&feet-b.y>25&&feet-b.y<180);
  if(p.ground&&!tunnel&&(support&&support.x+support.w-p.x<100||step||stuck>30))g.pressed.Space=true;
  if(!p.ground&&g.hero===1&&p.jumps===1&&p.vy> -30)g.pressed.Space=true;
  if(w.objects.some(o=>o.type==='breakwall'&&!g.run.destroyed.includes(o.id)&&o.x-p.x<140&&o.x>p.x-40)||w.objects.some(o=>o.requires==='phase'&&!g.run.opened.includes(o.id)&&o.x-p.x<95&&o.x>p.x-40)||g.hero===0&&w.anchors.some(a=>a.direction===1&&a.x>p.x&&Math.hypot(a.x-p.x,a.y-p.y)<370)||g.hero===3&&!g.run.scentSeen)g.pressed.KeyQ=true;
  g.update(1/120);max=Math.max(max,p.x);if(Math.abs(p.x-last)<.1)stuck++;else stuck=0;last=p.x;if(p.x>w.width-150)break;if(g.run.deaths)break;
 }
 assert.equal(g.run.deaths,0,'chapter '+n+' fell at '+Math.round(max));assert.ok(g.p.x>g.world.width-180,'chapter '+n+' stuck at '+Math.round(g.p.x)+' / '+g.world.width+' y '+Math.round(g.p.y));
 }
});

