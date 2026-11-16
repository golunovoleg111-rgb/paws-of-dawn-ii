import test from'node:test';import assert from'node:assert/strict';import{readFileSync,existsSync}from'node:fs';
import{buildWorld}from'../src/world.js';import{overlaps,Game}from'../src/engine.js';import{freshSave}from'../src/model.js';import{WorldProps,doorArtRect}from'../src/world-props.js';
test('all chapters have two safe return points, one merchant and no duplicate owl',()=>{
 for(let chapter=0;chapter<10;chapter++)for(const seed of[1,42,901]){const w=buildWorld(chapter,seed),points=w.objects.filter(o=>o.type==='checkpoint');
  assert.equal(points.length,2);assert.equal(w.objects.filter(o=>o.type==='shop').length,1);assert.equal(w.objects.filter(o=>o.type==='npc').length,0);
  assert.ok(w.objects.filter(o=>o.type==='campfire').every(o=>o.healOnly&&o.checkpoint===false));
  for(const p of points){const box={x:p.x-20,y:p.y-72,w:30,h:72};assert.ok(!w.solids.filter(b=>!b.oneWay).some(b=>overlaps(box,b)),`blocked checkpoint ${chapter}/${p.id}`)}
  for(const h of w.hazards){assert.ok(h.source?.visible&&h.source.context&&h.source.attachedTo.id);assert.equal(h.source.originX,h.x+h.w/2)}
  for(const d of w.doorways){const door=w.objects.find(o=>o.id===d.gateId);assert.equal(door.h,160);assert.equal(door.y+door.h,door.door.floorY);assert.ok(w.solids.some(b=>b.supportsDoor===door.id&&b.y>0&&b.h>0));}
  for(const e of w.enemies)assert.ok(!w.objects.filter(o=>['gate','breakwall'].includes(o.type)).some(o=>overlaps(e,o)),`enemy in door ${chapter}/${e.id}`);
 }
});
test('resuming a saved player inside new masonry safely returns without losing injury or currency',()=>{
 const save=freshSave(),g=new Game(save);g.begin(0,false);const wall=g.world.solids.find(b=>b.kind==='door-lintel');save.run.player={x:wall.x+10,y:wall.y+20,h:72,hp:2};const fish=save.fish;
 const resumed=new Game(save);resumed.begin(0,true);assert.equal(resumed.p.x,resumed.world.spawn.x);assert.equal(resumed.p.hp,2);assert.equal(save.fish,fish);
});
test('world art is complete, registered to the physical aperture and loaded before use',async()=>{
 const manifest=JSON.parse(readFileSync(new URL('../assets/world-props-v1/manifest.json',import.meta.url)));
 for(const a of Object.values(manifest.assets))assert.ok(existsSync(new URL('../assets/world-props-v1/'+a.url,import.meta.url)));
 const props=new WorldProps({fetcher:async()=>({ok:true,json:async()=>manifest}),imageFactory:()=>({naturalWidth:768,decode:async()=>{}})});await props.ensure();
 const door=buildWorld(0).objects.find(o=>o.type==='gate'),a=manifest.assets['gate-open'],r=doorArtRect(a,door),[l,t,right,bottom]=a.opening;
 assert.ok(Math.abs(r.x+l*r.w-door.x)<.001);assert.ok(Math.abs(r.y+bottom*r.h-door.door.floorY)<.001);assert.ok(Math.abs((right-l)*r.w-door.w)<.001);assert.ok(Math.abs(r.y+t*r.h-door.y)<.001);
});
