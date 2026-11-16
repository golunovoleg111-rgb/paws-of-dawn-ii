import test from'node:test';import assert from'node:assert/strict';import{readFileSync,existsSync}from'node:fs';
import{ChapterOneArt,facadeRect,passageRect,stairGroups}from'../src/chapter-one-art.js';
import{drawCityFrontage,frontageProfile,roofHeightAt}from'../src/chapter-one-frontage.js';
const town=JSON.parse(readFileSync(new URL('../assets/town-v1/manifest.json',import.meta.url))),props=JSON.parse(readFileSync(new URL('../assets/world-props-v1/manifest.json',import.meta.url)));
const ready=async cast=>{const a=new ChapterOneArt({cast,fetcher:async url=>({ok:true,json:async()=>url.href.includes('town-v1')?town:props}),imageFactory:()=>({naturalWidth:512,naturalHeight:512,decode:async()=>{}})});await a.ensure();return a};
function context(){const draws=[],calls=[];const c=new Proxy({drawImage(...args){draws.push(args)},createPattern(){return null},createLinearGradient(){return{addColorStop(){}}},createRadialGradient(){return{addColorStop(){}}}},{get(target,key){if(key in target)return target[key];return(...args)=>calls.push([key,...args])}});return{c,draws,calls}}
test('first-chapter materials load exclusively from existing project assets',async()=>{const a=await ready();for(const image of a.images.values())assert.ok(existsSync(new URL(image.src)));assert.ok(a.images.size>=25)});
test('facade roof and doorway aperture register exactly to their physical routes',()=>{
 const a={x:100,w:400,walkY:500,supportY:760},r=facadeRect(town.assets.merchant,a);assert.ok(Math.abs(r.y+r.h*town.assets.merchant.walk-500)<.001);assert.ok(Math.abs(r.y+r.h-760)<.001);
 const door={x:900,y:600,w:84,h:160,door:{floorY:760,openingHeight:160}},d=passageRect(props.assets['gate-open'],door),[l,t,right,b]=props.assets['gate-open'].opening;
 assert.ok(Math.abs(d.x+d.w*l-door.x)<.001);assert.ok(Math.abs(d.x+d.w*right-door.x-door.w)<.001);assert.ok(Math.abs(d.y+d.h*t-door.y)<.001);assert.ok(Math.abs(d.y+d.h*b-760)<.001);
});
test('optional stairs draw separate exact-height treads rather than a stretched stair picture',async()=>{
 const a=await ready(),steps=[0,1,2].map(i=>({x:100+i*32,y:740-i*12,w:32,h:8,kind:'stairs',material:'wood',optional:true,stairGroup:'roof',supportY:760}));assert.equal(stairGroups({solids:steps,ledges:[]}).length,1);
 const{c,draws}=context();for(const step of steps)a.drawBlock(c,step,{}, {y:400,height:390});assert.equal(draws.length,3);for(let i=0;i<steps.length;i++){assert.equal(draws[i][1],steps[i].x);assert.equal(draws[i][2],steps[i].y);assert.equal(draws[i][3],steps[i].w)}
});
test('stone treads use masonry and paving rather than the timber appearance of roof stairs',async()=>{
 const a=await ready(),{c,draws}=context();a.drawBlock(c,{x:250,y:700,w:26,h:7,kind:'stairs',material:'stone',optional:true},{},{y:400,height:390});assert.ok(draws.length>=2);assert.ok(draws.every(([image])=>image!==a.images.get('timber')));
});
test('gatehouse reads explicit opening geometry and follows the same door object as the physics',async()=>{
 const a=await ready(),{c,draws}=context(),door={id:'gate',x:7460,y:600,w:84,h:160,door:{floorY:760,openingHeight:160}},frame={id:'frame',type:'gatehouse',gateId:'gate',x:7320,y:290,w:364,h:470,supportY:760,openingX:1,openingW:1,openingY:1,openingH:1};a.drawStructure(c,frame,{objects:[door]});const expected=passageRect(props.assets['gate-open'],door),paint=draws.find(([image])=>image===a.images.get('gate-open'));assert.ok(paint);assert.equal(paint[1],expected.x);assert.equal(paint[2],expected.y);assert.equal(paint[3],expected.w);assert.equal(paint[4],expected.h);
 const entry={...frame,gateId:undefined,openingX:116,openingY:580,openingW:94,openingH:180};draws.length=0;a.drawStructure(c,entry,{objects:[]});const native=props.assets['gate-open'],entryPaint=draws.find(([image])=>image===a.images.get('gate-open'));assert.ok(Math.abs(entryPaint[1]+entryPaint[3]*native.opening[0]-116)<.001);
});
test('shop draws one owl; return point uses a bench and lamp without old checkpoint sprites or world text',async()=>{
 let owls=0;const a=await ready({owl(){owls++}}),{c,draws,calls}=context(),game={world:{clock:0},run:{opened:[],destroyed:[]},save:{looted:[]}};
 a.drawObject(c,{type:'shop',x:300,y:760},game);assert.equal(owls,1);draws.length=0;a.drawObject(c,{type:'checkpoint',x:600,y:760},game);assert.ok(draws.length>3);assert.ok(draws.every(([image])=>!image.src.includes('checkpoint')));assert.ok(calls.every(([name])=>name!=='fillText'));
});
test('rubble has no flashing warning graphic and its moving image follows the active damage box',async()=>{
 const a=await ready(),{c,draws,calls}=context(),h={type:'rock',x:300,y:730,w:30,h:30,phase:0,source:{originX:315,originY:450}},game={world:{clock:.5}};
 a.drawHazard(c,h,game);assert.equal(draws.length,0);game.world.clock=1.675;a.drawHazard(c,h,game);assert.equal(draws.length,1);assert.ok(Math.abs(draws[0][2]-519)<.001);assert.ok(calls.every(([name])=>!['fillText','strokeRect','setLineDash'].includes(name)));
});
test('continuous frontages retain their stepped elevation and cut out real passage holes',()=>{
 const f={id:'street',x:0,y:300,w:1200,h:460,groundY:760,profile:[{x:0,y:420},{x:300,y:420},{x:300,y:300},{x:800,y:300},{x:800,y:470},{x:1200,y:470}],openings:[{x:620,y:600,w:84,h:160}]},tiles=[],{c,calls}=context();
 assert.equal(frontageProfile(f).ground,760);assert.equal(roofHeightAt(f,400),300);assert.equal(roofHeightAt(f,900),470);
 drawCityFrontage(c,{frontages:[f]},{x:200,width:700},{tile(...args){tiles.push(args)}});assert.ok(tiles.some(([,id,x,y,w,h])=>id==='masonry'&&x<=620&&x+w>=704&&y<=300&&y+h>=760));assert.ok(calls.some(([id,mode])=>id==='clip'&&mode==='evenodd'));assert.ok(calls.some(([id,x,y])=>id==='moveTo'&&x===620&&y===600));
});
test('wide workshops use multiple correctly proportioned bays rather than a squashed cottage',async()=>{
 const a=await ready(),{c,draws}=context();a.drawStructure(c,{type:'workshop',x:2840,y:390,w:790,h:370,walkY:570,supportY:760},{});const bays=draws.filter(([image])=>image===a.images.get('workshop'));assert.ok(bays.length>=2);for(const draw of bays)assert.ok(Math.abs(draw[3]/draw[4]-town.assets.workshop.width/town.assets.workshop.height)<.0001);
});
test('a gatehouse paints grounded wings across its full elevation instead of an isolated narrow tower',async()=>{
 const a=await ready(),{c}=context(),areas=[],original=a.tile.bind(a);a.tile=(ctx,id,x,y,w,h)=>{areas.push({id,x,y,w,h});return original(ctx,id,x,y,w,h)};a.drawStructure(c,{type:'gatehouse',x:20,y:310,w:310,h:450,supportY:760,openingX:116,openingY:580,openingW:94,openingH:180},{objects:[]});assert.ok(areas.some(r=>r.id==='masonry'&&r.x===20&&r.y===310&&r.w===310&&r.h>=450));
});
