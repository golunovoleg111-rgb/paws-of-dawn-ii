import test from'node:test';import assert from'node:assert/strict';
import{authorTown,stepUpStairs}from'../src/town-layout.js';
import{buildWorld}from'../src/world.js';import{finalizeLayout,hazardNearObject,propBounds}from'../src/layout.js';
import{Game}from'../src/engine.js';import{freshSave}from'../src/model.js';
const overlap=(a,b)=>a.x<b.x+b.w&&a.x+a.w>b.x&&a.y<b.y+b.h&&a.y+a.h>b.y;
const town=()=>finalizeLayout(authorTown(buildWorld(0,9)));
function ready(){const g=new Game(freshSave());g.begin(0,false);g.world=town();g.world.enemies=[];g.world.hazards=[];g.run.solved=true;return g}

test('town street is continuously supported and every roof is owned by a building',()=>{
 const w=town();assert.equal(w.layoutRevision,'town-streets-1');assert.equal(w.zones[0].name,'Площадь фонарщика');
 assert.equal(w.ledges.some(b=>/^alcove|^upper|^approach|^causeway/.test(b.id)),false);
 for(let x=0;x<w.width;x+=5)assert.ok(w.solids.some(b=>!b.ceiling&&x>=b.x&&x<=b.x+b.w),'unsupported street at '+x);
 for(const b of w.ledges.filter(b=>b.kind==='roof')){const a=w.architecture.find(a=>a.collisionIds?.includes(b.id));assert.ok(a&&['merchant','workshop'].includes(a.type));assert.equal(a.walkY,b.y);assert.equal(a.supportY,b.supportY);assert.ok(a.supportY>b.y+150)}
});

test('street route is walkable without repeated forced jumps; crawlspace still teaches S',()=>{
 const g=ready();g.keys.KeyD=true;for(let i=0;i<70*120&&g.p.x<g.world.width-140;i++){
  const p=g.p;g.keys.KeyS=p.x>590&&p.x<835;g.update(1/120);assert.equal(g.run.deaths,0,'unexpected fall at '+Math.round(p.x));
 }
 assert.ok(g.p.x>g.world.width-180,'walk blocked at '+Math.round(g.p.x));
 assert.equal(g.world.solids.find(b=>b.id==='low-ceiling').context,'Обрушенная грузовая повозка');
});

test('open roof stairs can be entered with a jump and climbed in both directions',()=>{
 for(const id of ['haberdasher','watchhouse']){
  const g=ready(),a=g.world.architecture.find(a=>a.id==='town-stair-'+id),roof=g.world.ledges.find(b=>b.id==='town-roof-'+id),dir=a.direction;
  g.p.x=dir>0?a.x-44:a.x+a.w+14;g.p.y=a.supportY-g.p.h;g.p.vx=g.p.vy=0;g.p.ground=true;g.p.dir=dir;
  g.keys[dir>0?'KeyD':'KeyA']=true;g.keys.Space=true;g.pressed.Space=true;
  let reached=false;for(let i=0;i<6*120;i++){g.update(1/120);if(g.p.ground&&Math.abs(g.p.y+g.p.h-roof.y)<1&&g.p.x+g.p.w>roof.x&&g.p.x<roof.x+roof.w){reached=true;break}}
  assert.equal(reached,true,'roof inaccessible: '+id+' at '+Math.round(g.p.x)+','+Math.round(g.p.y));
 }
});

test('stair assistance cannot pull pedestrians onto an optional overhead flight or through a wall',()=>{
 const p={x:10,y:28,w:30,h:72,vx:100,vy:0,ground:true},b={x:35,y:90,w:20,h:8,kind:'stairs',optional:true,townGroup:'roof',oneWay:true};
 assert.equal(stepUpStairs(p,b,[b]),false);p.stairRoute='roof';assert.equal(stepUpStairs(p,b,[b]),true);assert.equal(p.y+p.h,90);
 p.y=28;const roof={x:0,y:0,w:100,h:25,oneWay:false};assert.equal(stepUpStairs(p,b,[b,roof]),false);
 const wall={...b,kind:'stone',optional:false};assert.equal(stepUpStairs(p,wall,[wall]),false);
});

test('interactive props and hazards retain clear space and each falling hazard has a visible source',()=>{
 const w=town();for(const h of w.hazards){assert.ok(h.origin&&h.context);for(const o of w.objects)assert.equal(hazardNearObject(h,o),false,h.id+' near '+o.id);if(h.type==='rock')assert.ok(w.architecture.some(a=>a.type==='scaffold'&&a.hazardId===h.id))}
 for(const o of w.objects.filter(o=>['shop','shrine','puzzle','campfire','checkpoint','npc'].includes(o.type))){const box=propBounds(o);box.h-=1;for(const b of [...w.ledges,...w.solids.filter(b=>b.ceiling)])assert.equal(overlap(box,b),false,o.id+' obscured by '+b.id)}
 for(const id of ['stash1','chest2','stash3','chest4','stash5','chest6','stash7']){const o=w.objects.find(o=>o.id===id);assert.ok(o&&o.supportId);const b=[...w.solids,...w.ledges].find(b=>b.id===o.supportId);assert.equal(o.y,b.y);assert.ok(o.x>=b.x&&o.x<=b.x+b.w)}
 assert.ok(w.hazards.some(h=>h.type==='rock'));assert.ok(w.hazards.some(h=>h.type==='piston'));
});

test('town authoring is idempotent and does not alter other chapters',()=>{
 const w=town(),count=w.solids.length+ w.ledges.length+ w.objects.length;assert.equal(authorTown(w),w);assert.equal(w.solids.length+w.ledges.length+w.objects.length,count);
 const other=buildWorld(1,9),before=JSON.stringify(other);assert.equal(authorTown(other),other);assert.equal(JSON.stringify(other),before);
});

test('road plaques explain the wagon and guild mechanism without revealing its code',()=>{
 for(const id of ['town-entry-plaque','town-guild-charter']){
  const g=ready(),o=g.world.objects.find(o=>o.id===id);assert.ok(o);assert.equal(o.mechanismClue,false);
  const a=g.world.architecture.find(a=>a.id===o.architectureId);assert.equal(a.type,'waypost');assert.equal(a.clueId,o.id);assert.ok(o.x>=a.x&&o.x<=a.x+a.w);
  const floor=g.world.solids.find(b=>b.id===o.supportId);assert.equal(o.y,floor.y);
  const events=[];g.onEvent=e=>events.push(e);g.p.x=o.x-15;g.p.y=o.y-g.p.h;
  g.interact();assert.equal(events.find(e=>e.type==='dialogue')?.title,o.name,'nearby NPC or checkpoint intercepted plaque '+id);assert.equal(!!g.run.clue,false);g.mode='play';
  g.world.objects=[o];
  const fish=g.save.fish,xp=g.save.xp,looted=[...g.save.looted];g.interact();assert.equal(g.mode,'panel');assert.equal(!!g.run.clue,false);
  g.mode='play';g.interact();assert.equal(!!g.run.clue,false);assert.equal(g.save.fish,fish);assert.equal(g.save.xp,xp);assert.deepEqual(g.save.looted,looted);
 }
 const g=ready(),imprint=g.world.objects.find(o=>o.id==='clue');assert.equal(imprint.mechanismClue,true);assert.match(imprint.text,/III · I · IV · II/);
 g.world.objects=[imprint];g.p.x=imprint.x-15;g.p.y=imprint.y-g.p.h;g.interact();assert.equal(g.run.clue,true);
 const w=town(),wagon=w.architecture.find(a=>a.id==='town-wagon'),entry=w.objects.find(o=>o.id==='town-entry-plaque'),charter=w.objects.find(o=>o.id==='town-guild-charter'),mechanism=w.objects.find(o=>o.id==='mainpuzzle');
 assert.ok(entry.x<wagon.x);assert.match(entry.text,/Удерживай S/);assert.match(entry.text,/пробелом/);
 assert.ok(charter.x<mechanism.x&&mechanism.x-charter.x<350);assert.match(charter.text,/I — портные, II — каменщики, III — фонарщики, IV — кузнецы/);
 assert.equal(new Set(w.objects.map(o=>o.id)).size,w.objects.length);
});
