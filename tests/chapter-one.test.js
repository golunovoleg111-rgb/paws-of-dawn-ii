import test from'node:test';import assert from'node:assert/strict';
import{buildWorld}from'../src/world.js';
import{safeEnemyStep}from'../src/hazards.js';
import{enterStair,traverseStair}from'../src/stairs.js';
import{Game}from'../src/engine.js';import{freshSave}from'../src/model.js';import{closedPassages}from'../src/passages.js';
import{existsSync,readFileSync}from'node:fs';import{roofHeightAt}from'../src/chapter-one-frontage.js';

const overlap=(a,b)=>a.x<b.x+b.w&&a.x+a.w>b.x&&a.y<b.y+b.h&&a.y+a.h>b.y;
const bounds=[0,1350,2600,4000,5400,7000,8100,9550,10850,12400];
const section=(world,o)=>world.zones.findIndex(z=>o.x>=z.x&&o.x<z.end);

test('the new first chapter follows the nine consecutive scenes instead of repainting the former town',()=>{
 const world=buildWorld(0,42);assert.equal(world.layoutRevision,'chapter-one-sketch-01');assert.equal(world.width,12400);assert.equal(world.zones.length,9);
 assert.deepEqual(world.zones.map(z=>z.x).concat(world.zones.at(-1).end),bounds);
 assert.ok(world.spawn.x<bounds[1]);assert.ok(world.objects.find(o=>o.type==='exit').x>=bounds[8]);
 assert.equal(world.ledges.some(b=>/^alcove|^upper|^approach|^causeway/.test(b.id)),false);
 assert.equal(world.architecture.some(a=>a.id==='town-wagon'||a.id==='town-roof-haberdasher'),false);
 for(const roof of world.ledges.filter(b=>b.kind==='roof')){const building=world.architecture.find(a=>a.id===roof.owner);assert.ok(building,'roof lacks its building '+roof.id);assert.equal(building.walkY,roof.y,'painted roof height differs '+roof.id);assert.ok(building.x<=roof.x&&building.x+building.w>=roof.x+roof.w,'roof extends outside its supporting building '+roof.id)}
});

test('the single owl shop and both return points occupy the approved scenes',()=>{
 for(const seed of[1,42,901]){const world=buildWorld(0,seed),shops=world.objects.filter(o=>o.type==='shop'),points=world.objects.filter(o=>o.type==='checkpoint');
  assert.equal(shops.length,1);assert.equal(section(world,shops[0]),1);assert.equal(world.objects.filter(o=>o.type==='npc').length,0);
  assert.equal(points.length,2);assert.deepEqual(points.map(o=>section(world,o)).sort((a,b)=>a-b),[4,7]);
  for(const fire of world.objects.filter(o=>o.type==='campfire'))assert.equal(fire.checkpoint,false);
 }
});

test('return points, the merchant and the exit have clear protected approaches, including during pursuit',()=>{
 const world=buildWorld(0,42),protectedObjects=world.objects.filter(o=>['checkpoint','shop','exit'].includes(o.type));
 for(const o of protectedObjects){const protection=world.sanctuaries.find(z=>o.x>=z.x&&o.x<=z.x+z.w&&o.y>=z.y&&o.y<=z.y+z.h);assert.ok(protection,'missing safe approach '+o.id);
  const spawn={x:o.x-20,y:o.y-72,w:30,h:72};assert.ok(!world.solids.filter(b=>!b.oneWay).some(b=>overlap(spawn,b)),'blocked return '+o.id);
  for(const e of world.enemies){assert.ok(!overlap(e,protection),'enemy starts inside '+o.id);const patrol={x:e.left,y:e.y,w:e.right-e.left,h:e.h};assert.ok(!overlap(patrol,protection),'patrol crosses '+o.id)}
  const enemy={type:'guard',x:protection.x-60,y:o.y-60,w:36,h:60,boss:true};assert.equal(safeEnemyStep(enemy,protection.x-20,world,{solved:false,opened:[],destroyed:[],revealed:[]}),false,'guard enters '+o.id);
 }
});

test('forge heat and falling masonry have real architectural sources in their approved districts',()=>{
 const world=buildWorld(0,42),heat=world.hazards.filter(h=>h.type==='lava'),rubble=world.hazards.filter(h=>h.type==='rock');assert.ok(heat.length>0&&rubble.length>0);
 for(const h of heat){assert.equal(section(world,h),2);assert.ok(h.context);assert.ok(h.source?.attachedTo?.id);assert.ok(h.source.originY<=h.y+1)}
 for(const h of rubble){assert.equal(section(world,h),3);assert.ok(h.source?.originY<h.y-150);assert.equal(h.source.originX,h.x+h.w/2);assert.ok(h.source?.attachedTo?.id)}
 for(const h of world.hazards){for(const o of world.objects.filter(o=>['checkpoint','shop','puzzle','exit'].includes(o.type)))assert.ok(h.x+h.w<o.x-90||h.x>o.x+90,'hazard covers interaction '+o.id)}
});

test('drawn stair flights have a contiguous sequence of small physical treads and clear landings',()=>{
 const world=buildWorld(0,42),treads=[...world.solids,...world.ledges].filter(b=>b.kind==='stairs'),groups=new Map();assert.ok(treads.length>0);
 for(const b of treads){const group=b.townGroup||b.group||b.owner;assert.ok(group,'a stair tread has no architectural owner');if(!groups.has(group))groups.set(group,[]);groups.get(group).push(b);assert.ok(b.w>=8&&b.h>0)}
 for(const [id,flight]of groups){flight.sort((a,b)=>a.x-b.x);for(let i=1;i<flight.length;i++){assert.ok(Math.abs(flight[i].y-flight[i-1].y)<=16,'too tall riser '+id);assert.ok(flight[i].x<=flight[i-1].x+flight[i-1].w+1,'gap between treads '+id)}}
 for(const endpoint of world.objects.filter(o=>o.type==='stair')){const flight=world.staircases.find(s=>s.id===endpoint.group);assert.ok(flight,'stair endpoint missing its flight');assert.ok(['left','right'].includes(endpoint.end));const body={x:endpoint.x-15,y:endpoint.y-72,w:30,h:72};assert.ok(!world.solids.filter(b=>!b.oneWay).some(b=>overlap(body,b)),'stair landing inside a wall '+endpoint.id)}
});

test('every authored staircase can be walked both ways without forced jumps or passage through solid walls',()=>{
 const world=buildWorld(0,42);
 for(const flight of world.staircases)for(const end of['left','right']){
  const move=end==='left'?1:-1,p={x:0,y:0,w:30,h:72,ground:true};enterStair(p,flight,end);
  const initial=p.x,expectedFeet=end==='left'?(flight.direction>0?flight.high:flight.low):(flight.direction>0?flight.low:flight.high);
  for(let frame=0;frame<1000&&p.stairRoute;frame++){
   assert.ok(traverseStair(p,flight,move,245,1/120,world.solids),'stair blocked '+flight.id+' from '+end);
   assert.ok(p.ground);assert.equal(p.vy,0);assert.ok(!world.solids.filter(b=>!b.oneWay).some(b=>overlap(p,b)),'stair crosses solid '+flight.id);
  }
  assert.equal(p.stairRoute,null,'stair never exits '+flight.id);assert.ok(move*(p.x-initial)>flight.w);assert.ok(Math.abs(p.y+p.h-expectedFeet)<.001);
 }
});

test('mandatory blockage, clue loop, sluice lever and return alley require meaningful route choices',()=>{
 const world=buildWorld(0,42),mason=world.solids.find(b=>b.id==='mason-street-collapse'),clue=world.objects.find(o=>o.id==='clue'),mechanism=world.objects.find(o=>o.id==='mainpuzzle'),door=world.objects.find(o=>o.id==='puzzlegate');
 assert.ok(mason&&mason.y+mason.h===760&&mason.y<760-100);assert.ok(world.staircases.some(s=>s.x<mason.x&&s.x+s.w<=mason.x));assert.ok(world.ledges.some(b=>b.owner==='mason-house'&&b.y<=mason.y&&b.x<mason.x&&b.x+b.w>mason.x+mason.w));
 assert.equal(section(world,clue),4);assert.ok(clue.y<mechanism.y-100);assert.ok(mechanism.requiresClue);assert.equal(section(world,door),5);assert.ok(world.links.some(link=>link.from===mechanism.id&&link.to===door.id));
 const sluice=world.objects.find(o=>o.id==='drain-gate'),wheel=world.objects.find(o=>o.type==='lever'&&o.controls===sluice?.id);assert.ok(sluice&&wheel);assert.equal(section(world,sluice),6);assert.ok(wheel.x>sluice.x&&wheel.y<sluice.door.floorY);
 const alley=world.objects.filter(o=>o.type==='shortcut');assert.equal(alley.length,2);assert.equal(alley[0].key,alley[1].key);assert.deepEqual(alley.map(o=>section(world,o)).sort((a,b)=>a-b),[4,7]);assert.equal(alley.filter(o=>o.opensFromHere).length,1);assert.equal(section(world,alley.find(o=>o.opensFromHere)),7);
 assert.ok(world.routes.deadEnds.includes(mason.id)&&world.routes.deadEnds.includes(sluice.id));
});

const interactiveGame=()=>{const events=[],g=new Game(freshSave(),e=>events.push(e));g.begin(0,false);g.world.enemies=[];g.world.hazards=[];return{g,events}};
const standAt=(g,o)=>{g.p.x=o.x-15;g.p.y=o.y-72;g.p.h=72;g.p.vx=g.p.vy=0;g.p.ground=true};
test('the guild puzzle requires finding the balcony record rather than walking straight into its menu',()=>{
 const{g,events}=interactiveGame(),puzzle=g.world.objects.find(o=>o.id==='mainpuzzle'),record=g.world.objects.find(o=>o.id==='clue');
 standAt(g,puzzle);g.interact();assert.ok(events.some(e=>e.type==='dialogue'));assert.equal(events.filter(e=>e.type==='puzzle').length,0);assert.equal(g.run.solved,false);
 g.closePanel();standAt(g,record);g.interact();assert.equal(g.run.clue,true);
 g.closePanel();standAt(g,puzzle);g.interact();assert.equal(events.filter(e=>e.type==='puzzle').length,1);
});

test('the sluice can only be opened at its upper wheel and the return alley stays closed from its near side',()=>{
 const{g}=interactiveGame(),wheel=g.world.objects.find(o=>o.type==='lever'),near=g.world.objects.find(o=>o.type==='shortcut'&&!o.opensFromHere),far=g.world.objects.find(o=>o.type==='shortcut'&&o.opensFromHere);
 assert.ok(closedPassages(g.world,g.run).some(o=>o.id===wheel.controls));standAt(g,wheel);g.interact();assert.ok(!closedPassages(g.world,g.run).some(o=>o.id===wheel.controls));
 standAt(g,near);const before=g.p.x;g.interact();assert.equal(g.p.x,before);assert.equal(g.run.opened.includes(near.key),false);g.closePanel();
 standAt(g,far);g.interact();assert.ok(g.run.opened.includes(far.key));assert.equal(g.p.x,far.to.x);assert.equal(g.p.y,far.to.y);
 g.interact();assert.equal(g.p.x,near.to.x);assert.equal(g.p.y,near.to.y);
 const save=JSON.parse(JSON.stringify(g.save)),resumed=new Game(save);resumed.begin(0,true);assert.ok(resumed.run.opened.includes(far.key));
});

test('teaching is a one-time interactive panel event rather than repeated text in the scenery',()=>{
 const{g,events}=interactiveGame(),lesson=g.world.tutorials[0];g.p.x=lesson.x+2;g.p.y=688;g.update(1/120);assert.equal(g.mode,'panel');assert.equal(events.filter(e=>e.type==='tutorial').length,1);assert.ok(g.run.tutorials.includes(lesson.id));g.closePanel();g.update(1/120);assert.equal(events.filter(e=>e.type==='tutorial').length,1);assert.equal(g.mode,'play');
});

test('the first route is traversable from spawn through its real detour, clue loop and bridge without position teleports',()=>{
 const g=new Game(freshSave());g.begin(0,false);g.world.hazards=[];g.world.enemies=[];
 const step=()=>{if(g.mode==='panel')g.closePanel();g.update(1/120);assert.equal(g.run.deaths,0,'route fell at '+Math.round(g.p.x))};
 const walkTo=(center,limit=120*45)=>{
  let stuck=0,last=g.p.x;
  for(let frame=0;frame<limit&&Math.abs(g.p.x+15-center)>3;frame++){
   const dir=Math.sign(center-g.p.x-15),ceiling=g.world.solids.find(b=>b.ceiling&&g.p.x>b.x-65&&g.p.x<b.x+b.w+12);
   g.keys={KeyD:dir>0,KeyA:dir<0,KeyS:!!ceiling};
   const bridge=g.world.architecture.find(a=>a.id==='canal-bridge'),gap=bridge.gap;
   if(dir>0&&g.p.ground&&g.p.x+g.p.w>gap[0]-48&&g.p.x<gap[1]&&Math.abs(g.p.y+g.p.h-760)<5){g.keys.Space=true;g.pressed.Space=true}else if(g.p.vy<0)g.keys.Space=true;
   step();stuck=Math.abs(g.p.x-last)<.05?stuck+1:0;last=g.p.x;assert.ok(stuck<180,'route blocked at '+Math.round(g.p.x)+' toward '+center+' feet '+Math.round(g.p.y+g.p.h));
  }
  assert.ok(Math.abs(g.p.x+15-center)<=3,'route did not reach '+center);g.keys={};
 };
 const flight=(id,from='left')=>{const f=g.world.staircases.find(s=>s.id===id),entry=g.world.objects.find(o=>o.type==='stair'&&o.group===id&&o.end===from),other=g.world.objects.find(o=>o.type==='stair'&&o.group===id&&o.end!==from);assert.ok(f&&entry&&other);walkTo(entry.x);g.interact();assert.equal(g.p.stairRoute,id);walkTo(other.x+(from==='left'?10:-10));assert.equal(g.p.stairRoute,null)};
 // Encounter the masonry obstruction before choosing to backtrack to its stairs.
 const collapse=g.world.solids.find(b=>b.id==='mason-street-collapse');walkTo(collapse.x-24);const reached=g.p.x;g.keys={KeyD:true};for(let i=0;i<120;i++)step();assert.ok(g.p.x<=collapse.x-g.p.w+.01);assert.ok(g.p.x>=reached);
 flight('mason-bypass-up');walkTo(4980);flight('mason-bypass-down');
 const mechanism=g.world.objects.find(o=>o.id==='mainpuzzle');walkTo(mechanism.x);g.interact();assert.equal(g.mode,'panel');assert.equal(g.run.clue,false);g.closePanel();
 // The failed first visit sends the player back through the courtyard to the record.
 flight('guild-clue-up');const clue=g.world.objects.find(o=>o.id==='clue');walkTo(clue.x);g.interact();assert.ok(g.run.clue);g.closePanel();flight('guild-clue-down');
 walkTo(mechanism.x);g.interact();assert.equal(g.mode,'panel');g.solvePuzzle();
 walkTo(11700);assert.ok(g.run.opened.includes('checkpoint0.5'));assert.ok(g.run.opened.includes('bosscheckpoint'));assert.ok(g.p.x>g.world.zones[8].x);assert.ok(g.run.seconds>0);
});

test('gate openings are enclosed in connected street walls or the canal bridge rather than isolated floating props',()=>{
 const world=buildWorld(0,42),fronts=[...world.frontages].sort((a,b)=>a.x-b.x);assert.ok(fronts.length>=8);
 // Street elevations cover the route continuously except for the deliberate canal vista.
 for(let x=0;x<world.width;x+=16){if(x>=8100&&x<9550)continue;const f=fronts.find(f=>x>=f.x&&x<=f.x+f.w);assert.ok(f,'missing city mass at '+x);assert.equal(f.groundY,760);assert.ok(roofHeightAt(f,x)<f.groundY-100)}
 for(const a of world.architecture.filter(a=>a.type==='gatehouse')){
  const gate=world.objects.find(o=>o.id===a.gateId),opening=gate?{x:gate.x,y:gate.y,w:gate.w,h:gate.h}:{x:a.openingX,y:a.openingY,w:a.openingW,h:a.openingH};
  const f=fronts.find(f=>(f.openings||[]).some(o=>o.id===a.id));
  if(f){assert.equal(opening.y+opening.h,f.groundY);assert.ok(f.x<=opening.x-50&&f.x+f.w>=opening.x+opening.w+50,'gate lacks wall wings '+a.id);assert.ok(roofHeightAt(f,opening.x+opening.w/2)<=opening.y-30,'gate has no masonry lintel '+a.id)}
  else{const bridge=world.architecture.find(b=>b.type==='bridge'&&b.x<=a.x&&b.x+b.w>=a.x+a.w&&b.supportY===opening.y+opening.h);assert.ok(bridge,'isolated gate arch '+a.id)}
 }
 assert.equal(existsSync(new URL('../src/town-layout.js',import.meta.url)),false,'retired town layout must not remain available');
 assert.doesNotMatch(readFileSync(new URL('../src/world.js',import.meta.url),'utf8'),/authorTown|town-layout\.js/);
});

test('defeating the local commander opens the northern gate and permits the real exit interaction',()=>{
 const events=[],g=new Game(freshSave(),e=>events.push(e));g.begin(0,false);const boss=g.world.enemies.find(e=>e.boss),exit=g.world.objects.find(o=>o.type==='exit');g.world.hazards=[];g.world.enemies=[boss];g.solvePuzzle();
 assert.ok(closedPassages(g.world,g.run).some(o=>o.id==='north-gate'));g.hit(boss,999,true);assert.equal(boss.hp<=0,true);assert.ok(g.run.opened.includes('north-gate'));assert.ok(!closedPassages(g.world,g.run).some(o=>o.id==='north-gate'));
 standAt(g,exit);g.interact();assert.ok(g.save.completed.includes(0));assert.ok(events.some(e=>e.type==='clear'));
});

test('saving midway on stairs preserves the flight while a defeat clears it before returning to safety',()=>{
 const g=new Game(freshSave());g.begin(0,false);const flight=g.world.staircases[0];enterStair(g.p,flight,'left');
 for(let i=0;i<50;i++)traverseStair(g.p,flight,1,245,1/120,g.world.solids);g.persist();
 const resumed=new Game(JSON.parse(JSON.stringify(g.save)));resumed.begin(0,true);
 assert.equal(resumed.p.stairRoute,flight.id);assert.equal(resumed.p.x,g.p.x);assert.equal(resumed.p.y,g.p.y);
 resumed.die();assert.equal(resumed.p.stairRoute,null);assert.equal(resumed.p.x,resumed.world.spawn.x);
 resumed.update(1/120);assert.ok(Math.abs(resumed.p.x-resumed.world.spawn.x)<1);
});

test('an incoming enemy projectile is stopped at a protected checkpoint approach before reaching its occupant',()=>{
 const{g}=interactiveGame(),point=g.world.objects.find(o=>o.id==='checkpoint0.5'),safe=g.world.sanctuaries.find(z=>point.x>=z.x&&point.x<=z.x+z.w);standAt(g,point);g.p.inv=0;const hp=g.p.hp;
 g.world.shots=[{x:safe.x-18,y:point.y-40,w:14,h:14,vx:420,vy:0,t:4,owner:'enemy',damage:2}];
 for(let frame=0;frame<240;frame++)g.update(1/120);
 assert.equal(g.p.hp,hp);assert.equal(g.world.shots.length,0);
});
