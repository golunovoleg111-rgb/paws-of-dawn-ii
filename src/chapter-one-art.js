import{hazardState}from'./hazards.js?v=110';
import{drawCityFrontage,drawMasonryStairSupport}from'./chapter-one-frontage.js?v=110';
// First-chapter artwork follows the new collision plan. Existing painted assets
// are materials, not a second layout that can diverge from the playable street.
export function facadeRect(asset,a){
 if(Number.isFinite(a.walkY)&&Number.isFinite(a.supportY)&&Number.isFinite(asset.walk)){
  const h=(a.supportY-a.walkY)/(1-asset.walk);return{x:a.x,y:a.walkY-asset.walk*h,w:a.w,h};
 }
 return{x:a.x,y:a.y,w:a.w,h:a.h??a.w*asset.height/asset.width};
}
export function passageRect(asset,o){
 const opening=asset.opening||[.25,.38,.75,1],floor=o.door?.floorY??o.y+o.h,height=o.door?.openingHeight??o.h??160;
 const[l,t,r,b]=opening,w=o.w/(r-l),h=height/(b-t);return{x:o.x-l*w,y:floor-height-t*h,w,h};
}
export function stairGroups(world){
 const groups=new Map();for(const b of[...(world.solids||[]),...(world.ledges||[])]){
  if(b.kind!=='stairs')continue;const id=b.stairGroup||b.townGroup||b.owner;if(!id)continue;
  if(!groups.has(id))groups.set(id,[]);groups.get(id).push(b);
 }
 return [...groups].map(([id,steps])=>({id,steps:steps.sort((a,b)=>a.x-b.x)}));
}

const TOWN=['merchant','workshop','cart','scaffold','seal','timber','lantern-part','guild-plaque','stone-plinth'];
const WORLD=['fish','gate-open','gate-closed','rock-fault','furnace-conduit','tower-wall'];
const CROPS=['paving','masonry','slate','chest','crate','campfire','rock','clue','distant-town'];
export class ChapterOneArt{
 constructor({cast=null,fetcher=globalThis.fetch.bind(globalThis),imageFactory=()=>new Image()}={}){
  this.cast=cast;this.fetcher=fetcher;this.imageFactory=imageFactory;this.assets=new Map();this.images=new Map();this.patterns=new Map();this.stairCache=new WeakMap();this.error=null;this.ready=this.load();
 }
 async load(){
  try{
   const manifests=await Promise.all(['town-v1','world-props-v1'].map(async folder=>{const r=await this.fetcher(new URL('../assets/'+folder+'/manifest.json',import.meta.url));if(!r.ok)throw Error('Не загрузились материалы первой главы');return{folder,manifest:await r.json()}}));
   const jobs=[];
   for(let i=0;i<manifests.length;i++){const{folder,manifest}=manifests[i];for(const id of i?WORLD:TOWN){const spec=manifest.assets?.[id];if(!spec?.url)throw Error('Нет материала '+id);this.assets.set(id,spec);jobs.push(this.loadImage(id,'../assets/'+folder+'/'+spec.url))}}
   for(const id of CROPS)jobs.push(this.loadImage(id,'../assets/chapter-one/'+id+'.webp'));
   jobs.push(this.loadImage('shop','../assets/shop-v04.webp'));
   await Promise.all(jobs);return true;
  }catch(error){this.error=error;console.error('Chapter one art:',error);return false}
 }
 async loadImage(id,url){const image=this.imageFactory();image.src=new URL(url,import.meta.url).href;await image.decode();if(!image.naturalWidth)throw Error('Пустой материал '+id);this.images.set(id,image);if(!this.assets.has(id))this.assets.set(id,{width:image.naturalWidth,height:image.naturalHeight});}
 async ensure(){if(!await this.ready)throw this.error||Error('Первая глава ещё загружается')}
 async retry(){this.error=null;this.patterns.clear();this.ready=this.load();return this.ensure()}
 draw(c,id,x,y,w,h=null,flip=false){
  const image=this.images.get(id);if(!image)return false;const a=this.assets.get(id),height=h??w*a.height/a.width;c.save();
  if(flip){c.translate(x+w,y);c.scale(-1,1);c.drawImage(image,0,0,w,height)}else c.drawImage(image,x,y,w,height);
  c.restore();return true;
 }
 tile(c,id,x,y,w,h){
  const image=this.images.get(id);if(!image||w<=0||h<=0)return false;
  if(id==='masonry'){
   let pattern=this.patterns.get(id);if(!pattern&&typeof c.createPattern==='function'){pattern=c.createPattern(image,'repeat');if(pattern)this.patterns.set(id,pattern)}
   if(pattern){c.save();c.fillStyle=pattern;c.fillRect(x,y,w,h);c.restore();return true}
   const tw=image.naturalWidth||image.width||63,th=image.naturalHeight||image.height||105;c.save();c.beginPath();c.rect(x,y,w,h);c.clip();for(let yy=Math.floor(y/th)*th;yy<y+h;yy+=th)for(let xx=Math.floor(x/tw)*tw;xx<x+w;xx+=tw)c.drawImage(image,xx,yy,tw,th);c.restore();return true;
  }
  c.save();c.beginPath();c.rect(x,y,w,h);c.clip();c.translate(x,y);
  const tw=id==='paving'?480:id==='masonry'?480:id==='slate'?385:440,th=id==='masonry'?104:id==='slate'?24:id==='paving'?18:20;
  for(let yy=0;yy<h;yy+=th)for(let xx=0;xx<w;xx+=tw)c.drawImage(image,xx,yy,tw,th);
  c.restore();return true;
 }
 glow(c,x,y,r,color){c.save();const g=c.createRadialGradient(x,y,1,x,y,r);g.addColorStop(0,color);g.addColorStop(1,'#00000000');c.fillStyle=g;c.fillRect(x-r,y-r,r*2,r*2);c.restore()}
 drawBackground(c,world,cam,W=1280,H=720){
  c.save();c.fillStyle='#74808c';c.fillRect(0,0,W,H);const image=this.images.get('distant-town');
  if(image){const shift=Math.min(100,cam.x*.014);c.globalAlpha=.78;c.filter='none';c.drawImage(image,-shift,-H*.05,W+120,H*1.08);c.filter='none';c.globalAlpha=1}
  const haze=c.createLinearGradient(0,0,0,H);haze.addColorStop(0,'#82919d14');haze.addColorStop(.55,'#9aa5ad35');haze.addColorStop(1,'#52616f9c');c.fillStyle=haze;c.fillRect(0,0,W,H);
  // A distant aqueduct stays behind the canal and northern-gate streets.
  if(cam.x>7800){c.globalAlpha=.20;c.fillStyle='#c2c7c7';const base=H*.53;for(let i=0;i<8;i++){const x=i*190-(cam.x*.028%190);c.fillRect(x,base-125,28,170);c.beginPath();c.moveTo(x,base-125);c.quadraticCurveTo(x+110,base-210,x+190,base-125);c.lineTo(x+190,base-103);c.quadraticCurveTo(x+110,base-168,x+28,base-103);c.closePath();c.fill()}}
  c.restore();
 }
 drawArchitecture(c,world,cam,layer='back'){
  if(!this.images.size)return false;
  if(layer==='back')drawCityFrontage(c,world,cam,this);
  for(const a of world.architecture||[]){if((a.layer||'back')!==layer)continue;const x=a.x,w=a.w||200;if(x+w<cam.x-180||x>cam.x+(cam.width||1280)+180)continue;
   this.drawStructure(c,a,world);
  }
  if(layer==='back'){let groups=this.stairCache.get(world);if(!groups){groups=stairGroups(world);this.stairCache.set(world,groups)}for(const group of groups)this.drawStairStructure(c,group,cam)}
  return true;
 }
 drawStructure(c,a,world){
  const kind=a.type,ground=a.supportY??a.y+(a.h||0);
  if(['merchant','workshop','house','watchhouse','apothecary'].includes(kind)){
   const id=kind==='merchant'||kind==='house'||kind==='apothecary'?'merchant':'workshop',rect=facadeRect(this.assets.get(id),a);
   c.save();if(a.decorative){c.globalAlpha=.73;c.filter='none'}else c.filter='none';
   const native=this.assets.get(id),bayWidth=rect.h*native.width/native.height,count=Math.max(1,Math.round(rect.w/bayWidth)),spacing=rect.w/count;
   // A wide workshop is a connected row of correctly proportioned bays, not a
   // single cottage flattened horizontally to span an entire district.
   const wallY=Number.isFinite(a.walkY)?a.walkY+7:rect.y+rect.h*.22;this.tile(c,'masonry',rect.x,wallY,rect.w,Math.max(1,ground-wallY));
   for(let i=0;i<count;i++){const x=rect.x+(i+.5)*spacing-bayWidth/2;this.draw(c,id,x,rect.y,bayWidth,rect.h,a.flip&&i%2===0)}
   if(Number.isFinite(a.walkY)){this.tile(c,'slate',rect.x,a.walkY-3,rect.w,13);this.tile(c,'masonry',rect.x,ground-19,rect.w,20)}c.restore();
   if(a.tower){this.draw(c,'tower-wall',a.x+a.w*.5,a.y-a.h*.25,a.w*.38,a.h*.8)}
   return true;
  }
  if(kind==='cart')return this.draw(c,'cart',a.x,a.y,a.w,a.h,a.flip);
  if(kind==='scaffold'){
   const hazard=world.hazards?.find(h=>h.id===a.hazardId),originX=hazard?.source?.originX??a.x+a.w*.57,originY=hazard?.source?.originY??a.y+20;
   // Build the repair frame without the old painted warning banner. The
   // fractured, supported cornice itself is the physical source of the fall.
   const inset=a.w*.12;for(const x of[a.x+inset,a.x+a.w-inset])this.beam(c,x,a.y+38,x,ground,11);
   for(const y of[a.y+a.h*.35,a.y+a.h*.69,ground-14])this.beam(c,a.x+4,y,a.x+a.w-4,y,12);
   this.beam(c,a.x+inset,a.y+a.h*.35,a.x+a.w-inset,a.y+a.h*.69,9);this.beam(c,a.x+a.w-inset,a.y+a.h*.69,a.x+inset,ground-14,9);
   this.draw(c,'rock-fault',originX-a.w*.48,originY-72,a.w*.96,82);return true;
  }
  if(kind==='forge'||kind==='furnace'){
   this.glow(c,a.x+a.w*.3,ground-a.h*.35,a.w*.42,'#e8a25b25');return this.draw(c,'furnace-conduit',a.x,a.y,a.w,a.h,a.flip);
  }
  if(kind==='gatehouse'||kind==='gate'||kind==='arch'){
   const actual=world.objects?.find(o=>o.id===a.gateId),opening=actual?{x:actual.x,y:actual.y,w:actual.w,h:actual.h}:a.opening||{x:a.openingX??a.x+a.w*.27,y:a.openingY??ground-(a.openingH||170),w:a.openingW??a.w*.46,h:a.openingH||170},o={...opening,door:{floorY:opening.y+opening.h,openingHeight:opening.h}};
   const rect=passageRect(this.assets.get('gate-open'),o),top=a.wallTop??a.y;
   // The portal belongs to a broad, grounded gatehouse. The whole elevation
   // joins its neighbours, with only the actual passage cut out of the wall.
   c.save();c.beginPath();c.rect(a.x,top,a.w,Math.max(1,ground-top+5));c.rect(opening.x,opening.y,opening.w,opening.h+8);c.clip('evenodd');this.tile(c,'masonry',a.x,top,a.w,Math.max(1,ground-top+6));c.restore();
   this.tile(c,'slate',a.x,top-4,a.w,15);this.tile(c,'masonry',a.x,ground-24,Math.max(0,opening.x-a.x),28);this.tile(c,'masonry',opening.x+opening.w,ground-24,Math.max(0,a.x+a.w-opening.x-opening.w),28);
   // Stone pilasters break the wing masses without creating detached towers.
   for(const x of[a.x+8,a.x+a.w-32]){this.tile(c,'masonry',x,top+10,24,Math.max(1,ground-top-10));c.save();c.strokeStyle='#c2b29666';c.lineWidth=1;c.beginPath();c.moveTo(x,top+10);c.lineTo(x,ground);c.stroke();c.restore()}
   this.draw(c,'gate-open',rect.x,rect.y,rect.w,rect.h);return true;
  }
  if(kind==='bridge')return this.drawBridge(c,a);
  if(kind==='canal'||kind==='water'){
   c.save();const y=a.y,h=a.h||160,g=c.createLinearGradient(0,y,0,y+h);g.addColorStop(0,'#65858b');g.addColorStop(1,'#304e59');c.fillStyle=g;c.fillRect(a.x,y,a.w,h);c.strokeStyle='#b5c7bf35';c.lineWidth=1;for(let i=0;i<9;i++){const yy=y+12+i*16;c.beginPath();c.moveTo(a.x+20+(i%3)*23,yy);c.lineTo(a.x+a.w-25-(i%4)*17,yy);c.stroke()}c.restore();return true;
  }
  if(kind==='lantern')return this.drawLantern(c,a.x,ground,a.h||145);
  if(kind==='bench'||kind==='rest')return this.drawBench(c,a.x,ground,a.w||110);
  if(kind==='fence'||kind==='railing')return this.drawFence(c,a.x,ground,a.w,a.h||68);
  if(kind==='chain'||kind==='cable')return this.drawCable(c,a);
  if(kind==='alley'||kind==='shortcut'){
   const x=a.x,y=a.y,w=a.w,h=a.h;c.save();const shade=c.createLinearGradient(x,y,x+w,y);shade.addColorStop(0,'#28313c');shade.addColorStop(.5,'#4c555e');shade.addColorStop(1,'#222f3c');c.fillStyle=shade;c.beginPath();c.moveTo(x,y+h);c.lineTo(x,y+h*.28);c.quadraticCurveTo(x+w*.5,y-h*.15,x+w,y+h*.28);c.lineTo(x+w,y+h);c.closePath();c.fill();c.strokeStyle='#7b817e';c.lineWidth=7;c.stroke();c.strokeStyle='#9d9b8d';c.lineWidth=2;c.stroke();c.restore();return true;
  }
  if(kind==='wall'||kind==='retaining-wall')return this.tile(c,'masonry',a.x,a.y,a.w,a.h);
  return false;
 }
 drawCable(c,a){
  const x2=a.x2??a.x+a.w,y2=a.y2??a.y;c.save();c.lineWidth=3;c.strokeStyle='#3e3d3b';c.beginPath();c.moveTo(a.x,a.y);c.quadraticCurveTo((a.x+x2)/2,Math.max(a.y,y2)+18,x2,y2);c.stroke();c.lineWidth=1;c.strokeStyle='#b3a17d';c.stroke();for(const[x,y]of[[a.x,a.y],[x2,y2]]){c.strokeStyle='#857555';c.lineWidth=3;c.beginPath();c.arc(x,y,9,0,Math.PI*2);c.stroke()}c.restore();return true;
 }
 drawBridge(c,a){
  const x=a.x,y=a.y+20,w=a.w,h=Math.max(70,(a.h||170)-20);this.drawStructure(c,{type:'water',x,y:y+55,w,h:h+100},{});c.save();c.globalAlpha=.78;c.beginPath();c.rect(x,y,w,h);c.moveTo(x+w*.12,y+h);c.lineTo(x+w*.12,y+h*.7);c.bezierCurveTo(x+w*.12,y+h*.08,x+w*.88,y+h*.08,x+w*.88,y+h*.7);c.lineTo(x+w*.88,y+h);c.closePath();c.clip('evenodd');this.tile(c,'masonry',x,y,w,h);c.restore();
  c.save();c.strokeStyle='#969d95';c.lineWidth=13;c.beginPath();c.moveTo(x+w*.12,y+h);c.lineTo(x+w*.12,y+h*.7);c.bezierCurveTo(x+w*.12,y+h*.08,x+w*.88,y+h*.08,x+w*.88,y+h*.7);c.lineTo(x+w*.88,y+h);c.stroke();c.strokeStyle='#4d4d49';c.lineWidth=2;c.stroke();c.restore();
  // Parapets sit behind the walking lane; only the actual bridge blocks paint
  // its foreground deck, so the missing board interval never looks solid.
  const gap=a.gap||[a.x+a.w,a.x+a.w];this.drawFence(c,x,a.y-6,Math.max(0,gap[0]-x-18),52);this.drawFence(c,gap[1]+18,a.y-6,Math.max(0,x+w-gap[1]-18),52);return true;
 }
 drawStairStructure(c,{steps},cam){
  if(!steps.length||!steps[0].optional)return;const first=steps[0],last=steps.at(-1);if(last.x+last.w<cam.x-80||first.x>cam.x+(cam.width||1280)+80)return;
  const x1=first.x+first.w*.25,x2=last.x+last.w*.75,y1=first.y+12,y2=last.y+12,angle=Math.atan2(y2-y1,x2-x1),length=Math.hypot(x2-x1,y2-y1),floor=first.supportY??last.supportY;
  const stone=first.material==='stone';
  if(stone)drawMasonryStairSupport(c,steps,this);else{c.save();c.translate(x1,y1);c.rotate(angle);this.draw(c,'timber',-4,-5,length+8,12);c.restore()}
  // The handrail and posts are in the rear depth plane; every tread below is
  // still painted separately at the exact physical step height.
  for(let x=first.x+10;x<=last.x+last.w-5;x+=72){const t=(x-x1)/(x2-x1),y=y1+(y2-y1)*t;if(!stone&&Number.isFinite(floor)&&floor>y+8)this.beam(c,x,y,x,floor,6);if(stone){c.save();c.strokeStyle='#5d686b';c.lineWidth=3;c.beginPath();c.moveTo(x,y);c.lineTo(x,y-47);c.stroke();c.restore()}else this.beam(c,x,y-47,x,y,4)}
  c.save();c.translate(x1,y1-47);c.rotate(angle);if(stone){c.fillStyle='#6e7775';c.fillRect(-3,-2,length+6,4)}else this.draw(c,'timber',-3,-3,length+6,6);c.restore();
 }
 drawBlock(c,b,world,cam){
  if(!this.images.size)return false;const viewW=cam.width||1280;if(Number.isFinite(cam.x)&&(b.x+b.w<cam.x-100||b.x>cam.x+viewW+100))return true;
  if(Number.isFinite(cam.x)&&b.w>viewW+960){const x=Math.max(b.x,b.x+Math.floor((cam.x-b.x-120)/480)*480),end=Math.min(b.x+b.w,cam.x+viewW+480);b={...b,x,w:end-x}}
  const top=b.y,height=Math.max(0,Math.min(b.h,cam.y+(cam.height||720)+60-top));if(!height)return true;
  if(b.kind==='door-lintel'){this.tile(c,'masonry',b.x,b.y,b.w,height);return true}
  if(b.kind==='rubble'){
   this.draw(c,'rock',b.x,b.y+Math.min(48,height*.2),b.w,Math.max(20,height-Math.min(48,height*.2)));this.draw(c,'rock-fault',b.x-4,b.y,b.w+8,Math.min(85,height*.55));return true;
  }
  const stairs=b.kind==='stairs',wood=b.material==='wood'||b.structure==='wood-stair'||b.kind==='bridge'||b.kind==='wood';
  if(stairs&&b.material==='stone'){this.tile(c,'masonry',b.x,top,b.w,Math.min(10,b.h||8));this.tile(c,'paving',b.x,top-1,b.w,5);return true}
  if(stairs&&b.optional||wood){const thickness=stairs?Math.min(9,b.h||8):Math.max(12,Math.min(22,b.h));this.draw(c,'timber',b.x,top,b.w,thickness);c.save();c.strokeStyle='#c6b28d';c.lineWidth=1;c.beginPath();c.moveTo(b.x,top+.5);c.lineTo(b.x+b.w,top+.5);c.stroke();c.restore();return true}
  if(b.kind==='roof'||b.kind==='balcony'){this.tile(c,'slate',b.x,top,b.w,Math.min(height,24));if(b.kind==='balcony')this.draw(c,'timber',b.x,top+20,b.w,9);return true}
  if(!b.oneWay||stairs||['stone','ground','causeway','retaining-wall'].includes(b.kind)){
   this.tile(c,'masonry',b.x,top,b.w,height);this.tile(c,'paving',b.x,top-3,b.w,18);c.save();const shade=c.createLinearGradient(0,top+22,0,top+Math.max(23,Math.min(height,220)));shade.addColorStop(0,'#1d293100');shade.addColorStop(1,'#1a273d7a');c.fillStyle=shade;c.fillRect(b.x,top+20,b.w,Math.max(0,height-20));c.strokeStyle='#d5c7a3';c.lineWidth=.9;c.beginPath();c.moveTo(b.x,top+.5);c.lineTo(b.x+b.w,top+.5);c.stroke();c.restore();return true;
  }
  this.draw(c,'timber',b.x,top,b.w,Math.min(18,height));return true;
 }
 drawBench(c,x,ground,w=100){this.draw(c,'timber',x-w/2,ground-26,w,9);this.draw(c,'timber',x-w/2+7,ground-16,8,16);this.draw(c,'timber',x+w/2-15,ground-16,8,16);this.draw(c,'timber',x-w/2+5,ground-53,w-10,7);this.draw(c,'timber',x-w/2+8,ground-53,5,30);this.draw(c,'timber',x+w/2-13,ground-53,5,30);return true}
 beam(c,x1,y1,x2,y2,width=8){c.save();c.translate(x1,y1);c.rotate(Math.atan2(y2-y1,x2-x1));this.draw(c,'timber',0,-width/2,Math.hypot(x2-x1,y2-y1),width);c.restore();return true}
 drawLantern(c,x,ground,h=145){this.draw(c,'stone-plinth',x-15,ground-10,30,10);this.draw(c,'timber',x-4,ground-h,8,h-6);this.draw(c,'timber',x-3,ground-h,40,6);this.draw(c,'lantern-part',x+9,ground-h+3,30,45);this.glow(c,x+24,ground-h+28,52,'#e9ba7529');return true}
 drawFence(c,x,ground,w,h=65){for(let xx=x;xx<=x+w;xx+=70)this.draw(c,'timber',xx-3,ground-h,6,h);this.draw(c,'timber',x,ground-h+10,w,6);this.draw(c,'timber',x,ground-22,w,6);return true}
 drawObject(c,o,game){
  if(!this.images.size||this.error)return false;
  const cam=game.camera;if(cam&&(o.x<cam.x-200||o.x>cam.x+(cam.width||1280)+200))return true;
  const x=o.x,y=o.y,t=game.world.clock,opened=game.run.opened.includes(o.id);
  if(o.type==='fish'){if(!game.save.looted.includes(game.run.chapter+'-'+o.id)){const a=this.assets.get('fish'),w=24;this.draw(c,'fish',x-w/2,y-w*a.height/a.width/2,w)}return true}
  if(o.type==='shop'){
   this.glow(c,x,y-88,100,'#e8bd6725');c.save();c.translate(x,y-43);c.scale(.84,.84);this.cast?.owl(c,0,0,t);c.restore();this.draw(c,'shop',x-135,y-180,270,180);return true;
  }
  if(o.type==='checkpoint'){this.drawBench(c,x+36,y,95);this.drawLantern(c,x-45,y,150);return true}
  if(o.type==='campfire'){this.drawBench(c,x+30,y,90);this.draw(c,'campfire',x-64,y-47,64,47);return true}
  if(o.type==='shortcut'){
   const w=72,h=135;this.drawStructure(c,{type:'alley',x:x-w/2,y:y-h,w,h},game.world);const unlocked=game.run.opened.includes(o.key)||game.run.shortcuts?.includes(o.key);if(!unlocked){this.draw(c,'timber',x-w*.45,y-h*.48,w*.9,7);this.draw(c,'guild-plaque',x-10,y-h*.46,20,30)}this.drawLantern(c,x-w*.65,y,145);return true;
  }
  if(o.type==='gate'||o.type==='breakwall'||o.type==='door'){
   let clear=o.type==='breakwall'?game.run.destroyed.includes(o.id):o.requires==='puzzle'?game.run.solved:opened;const spec=this.assets.get('gate-open'),h=o.h||160,w=o.w||72,floor=o.door?.floorY??o.y+h,rect=passageRect(spec,{...o,w,h,door:{...o.door,floorY:floor,openingHeight:h}});
   this.draw(c,clear?'gate-open':'gate-closed',rect.x,rect.y,rect.w,rect.h);return true;
  }
  if(o.type==='puzzle'){this.draw(c,'seal',x-68,y-139,136,139);return true}
  if(o.type==='chest'||o.type==='stash'){if(!opened)this.draw(c,'chest',x-28,y-43,56,43);return true}
  if(o.type==='crate'){this.draw(c,'crate',x,y-(o.h||44),o.w||44,o.h||44);return true}
  if(o.type==='clue'){this.draw(c,'timber',x-3,y-92,6,92);this.draw(c,'guild-plaque',x-24,y-87,48,73);return true}
  if(o.type==='exit'||o.type==='stair')return true;
  if(o.type==='shrine'){this.draw(c,'stone-plinth',x-27,y-12,54,12);this.draw(c,'chest',x-22,y-46,44,34);this.draw(c,'guild-plaque',x-13,y-70,26,39);return true}
  if(o.type==='lever'){
   this.draw(c,'stone-plinth',x-18,y-10,36,10);this.beam(c,x,y-10,x-13,y-63,9);c.save();c.strokeStyle='#9c896a';c.lineWidth=5;c.beginPath();c.arc(x-13,y-63,22,0,Math.PI*2);c.stroke();c.lineWidth=3;for(let i=0;i<4;i++){const a=i*Math.PI/2;c.beginPath();c.moveTo(x-13,y-63);c.lineTo(x-13+Math.cos(a)*21,y-63+Math.sin(a)*21);c.stroke()}c.restore();return true;
  }
  if(o.type==='npc')return true;
  return false;
 }
 drawHazard(c,h,game){
  if(!this.images.size||this.error)return false;
  const s=h.source,t=game.world.clock;
  if(h.type==='lava'||h.type==='heat'){
   // A confined, steady-hot trough, not a warning effect or flashing marker.
   c.save();c.fillStyle='#4f4237';c.fillRect(h.x-5,h.y-4,h.w+10,h.h+7);c.fillStyle='#b54d26';c.fillRect(h.x,h.y,h.w,h.h);c.strokeStyle='#e8a45c';c.lineWidth=1.4;c.beginPath();for(let i=0;i<=h.w;i+=5){const y=h.y+3+Math.sin(i*.13+t*.8)*1.1;if(!i)c.moveTo(h.x+i,y);else c.lineTo(h.x+i,y)}c.stroke();c.restore();return true;
  }
  if(h.type==='rock'){
   const state=game.hazardState?.(h)||h.state||hazardState(h,t);
   if(state?.active){const b=state.box;this.draw(c,'rock',b.x-1,b.y-1,b.w+2,b.h+2)}
   return true;
  }
  if(h.type==='piston'||h.type==='spikes'){
   c.save();this.draw(c,'timber',h.x-8,h.y+h.h-5,h.w+16,10);c.fillStyle='#857b6b';c.strokeStyle='#49463f';c.lineWidth=1;for(let x=h.x;x<h.x+h.w;x+=14){c.beginPath();c.moveTo(x,h.y+h.h);c.lineTo(x+7,h.y+2);c.lineTo(x+13,h.y+h.h);c.closePath();c.fill();c.stroke()}c.restore();return true;
  }
  return true;
 }
}
