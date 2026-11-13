// Painted architecture is aligned to authored collision geometry, never used
// as an excuse to put a thin unexplained slab into the street.
const TYPES=['merchant','workshop','stairs','cart','scaffold','seal','timber','barricade-extended','barricade-retracted','lantern-part','guild-plaque','stone-plinth'];
export function buildingRect(asset,a){
 if(Number.isFinite(a.walkY)&&Number.isFinite(a.supportY)&&Number.isFinite(asset.walk)){
  const h=(a.supportY-a.walkY)/(1-asset.walk);
  return{x:a.x,y:a.walkY-asset.walk*h,w:a.w,h};
 }
 return{x:a.x,y:a.y,w:a.w,h:a.h??a.w*asset.height/asset.width};
}
export class TownArt{
 constructor({fetcher=globalThis.fetch.bind(globalThis),imageFactory=()=>new Image()}={}){this.fetcher=fetcher;this.imageFactory=imageFactory;this.images=new Map();this.manifest=null;this.error=null;this.ready=this.load()}
 async load(){try{const response=await this.fetcher(new URL('../assets/town-v1/manifest.json',import.meta.url));if(!response.ok)throw Error('Не загрузилась архитектура города');const m=await response.json();if(m.schema!==1||TYPES.some(id=>!m.assets?.[id]?.url))throw Error('Неполный набор архитектуры');this.manifest=m;await Promise.all(TYPES.map(async id=>{const im=this.imageFactory();im.src=new URL('../assets/town-v1/'+m.assets[id].url,import.meta.url).href;await im.decode();if(!im.naturalWidth)throw Error('Пустое изображение '+id);this.images.set(id,im)}));return true}catch(e){this.error=e;console.error('Town architecture:',e);return false}}
 async ensure(){if(!await this.ready)throw this.error||Error('Архитектура ещё не подготовлена')}
 async retry(){this.error=null;this.ready=this.load();return this.ensure()}
 draw(c,type,x,y,w,h=null,flip=false){const im=this.images.get(type);if(!im)return false;const height=h??w*im.naturalHeight/im.naturalWidth;c.save();if(flip){c.translate(x+w,y);c.scale(-1,1);c.drawImage(im,0,0,w,height)}else c.drawImage(im,x,y,w,height);c.restore();return true}
 drawBuilding(c,a){const asset=this.manifest?.assets[a.type];if(!asset)return false;const b=buildingRect(asset,a);if(a.type==='merchant'||a.type==='workshop'){const windows=a.type==='merchant'?[[.30,.39],[.65,.39]]:[[.29,.57],[.45,.57]];for(const [x,y]of windows)this.warmLight(c,b.x+b.w*x,b.y+b.h*y,Math.min(22,b.w*.06),.12)}return this.draw(c,a.type,b.x,b.y,b.w,b.h,a.flip)}
 warmLight(c,x,y,r,opacity=.2){c.save();const light=c.createRadialGradient(x,y,1,x,y,r);light.addColorStop(0,'rgba(238,178,91,'+opacity+')');light.addColorStop(1,'rgba(238,178,91,0)');c.fillStyle=light;c.fillRect(x-r,y-r,r*2,r*2);c.restore()}
 drawStreetProp(c,a){
  if(!this.images.has('timber')||!this.images.has('stone-plinth'))return false;
  const{ x,y,w,h }=a,foot=y+h,postX=x+w*.36,postW=Math.max(5,w*.15),baseW=w*.72,baseH=11,shaftTop=y+8,shaftH=h-baseH-7,timber=this.images.get('timber');
  if(a.type==='lantern'&&!this.images.has('lantern-part')||a.type==='waypost'&&!this.images.has('guild-plaque'))return false;
  if(a.type==='lantern')this.warmLight(c,postX+w*.30,y+31,w*.50,.26);
  c.save();c.translate(postX,shaftTop);c.rotate(Math.PI/2);c.drawImage(timber,0,-postW/2,shaftH,postW);c.restore();
  this.draw(c,'stone-plinth',postX-baseW/2,foot-baseH,baseW,baseH);
  if(a.type==='lantern'){
   // The original timber attachment overlaps the post, concealing its crop
   // connection while retaining the painted hook, metalwork and warm glass.
   const scale=postW/45;return this.draw(c,'lantern-part',postX-postW/2,y+5,190*scale,280*scale);
  }
  const boardX=x+1,boardW=w-2,boardH=12,firstY=y+17,secondY=y+39,guild=String(a.clueId||a.id).includes('guild');
  c.drawImage(timber,boardX,firstY,boardW,boardH);c.drawImage(timber,boardX,secondY,boardW,boardH);
  c.save();c.fillStyle='#ead4aa';c.textBaseline='alphabetic';c.textAlign='center';
  if(guild){c.font='bold 6.7px Georgia';c.fillText('ГИЛЬДИИ',x+w/2,firstY+8.5,w-5);c.fillText('ВОРОТА →',x+w/2,secondY+8.5,w-5)}
  else{c.textAlign='left';c.font='bold 11px Georgia';c.fillText('S',x+4,firstY+10);c.font='bold 5.8px Georgia';c.fillText('ПРОХОД',x+16,firstY+8.8,w-19);c.textAlign='center';c.font='bold 6.5px Georgia';c.fillText('КРЫШИ ↑',x+w/2,secondY+8.5,w-5)}
  c.restore();const plaqueW=w*.56,plaqueH=plaqueW*97/64;this.draw(c,'guild-plaque',postX-postW/2,y+57,plaqueW,plaqueH);return true;
 }
 drawStairs(c,a,world){
  if(!this.images.has('stairs'))return false;
  const ids=new Set(a.collisionIds||[]),steps=[...world.solids,...world.ledges].filter(b=>ids.has(b.id)).sort((l,r)=>l.x-r.x);
  if(a.material==='wood'&&steps.length)return this.drawTimberStairs(c,a,steps);
  if(!steps.length)return this.draw(c,'stairs',a.x,a.y,a.w,a.h,a.direction===-1);
  // The contour comes from the actual tread colliders. Native art supplies
  // stone, mortar, ivy and depth; it never invents a different walkable slope.
  const bottom=Math.max(a.y+(a.h||0),...steps.map(s=>s.y+Math.min(s.h,20))),foundation=Math.max(bottom,...steps.map(s=>s.y+s.h)),left=steps[0].x,right=steps.at(-1).x+steps.at(-1).w;
  c.save();c.beginPath();c.moveTo(left,foundation);c.lineTo(left,steps[0].y);
  for(const step of steps){c.lineTo(step.x,step.y);c.lineTo(step.x+step.w,step.y)}
  c.lineTo(right,foundation);c.closePath();c.clip();
  const minY=Math.min(...steps.map(s=>s.y)),height=bottom-minY;
  this.draw(c,'stairs',left,minY,right-left,height,a.direction===-1);
  const masonry=this.images.get('stairs');for(let yy=bottom-2;yy<foundation;yy+=36)c.drawImage(masonry,8,masonry.naturalHeight-65,masonry.naturalWidth-16,60,left,yy,right-left,Math.min(36,foundation-yy));c.restore();
  // Muted warm edges connect collision and illustration at the intended scale.
  c.save();c.strokeStyle='#d3c4a4';c.lineWidth=1.2;c.beginPath();for(const s of steps){c.moveTo(s.x,s.y+.5);c.lineTo(s.x+s.w,s.y+.5)}c.stroke();c.strokeStyle='#30333a';c.lineWidth=1;c.beginPath();for(const s of steps){c.moveTo(s.x,s.y+3);c.lineTo(s.x+s.w,s.y+3)}c.stroke();c.restore();return true;
 }
 drawTimberStairs(c,a,steps){
  const im=this.images.get('timber');if(!im)return false;
  const beam=(x1,y1,x2,y2,width=10)=>{c.save();c.translate(x1,y1);c.rotate(Math.atan2(y2-y1,x2-x1));c.drawImage(im,0,-width/2,Math.hypot(x2-x1,y2-y1),width);c.restore()};
  const left=steps[0],right=steps.at(-1),foot=a.supportY??a.y+a.h;
  const endX=right.x+right.w,stringerY=x=>left.y+10+(right.y-left.y)*(x-left.x)/(endX-left.x);
  beam(left.x,left.y+10,right.x+right.w,right.y+10,12);
  for(let i=0;i<steps.length;i+=Math.max(1,Math.floor(steps.length/3))){const s=steps[i],x=s.x+s.w*.5;if(foot-s.y>14){const top=stringerY(x),qx=Math.min(endX,x+60);beam(x,top,x,foot,11);beam(x,Math.min(foot,top+75),qx,stringerY(qx),8)}}
  for(const s of steps){c.drawImage(im,s.x,s.y,s.w,Math.max(7,Math.min(s.h,10)));c.strokeStyle='#d4bc92';c.lineWidth=1;c.beginPath();c.moveTo(s.x,s.y+.5);c.lineTo(s.x+s.w,s.y+.5);c.stroke()}
  return true;
 }
 drawWorld(c,world,cam,layer='back'){
  if(this.error||!this.manifest||world.chapter!==0)return false;
  const width=cam.width||1280,height=cam.height||720;
  for(const a of world.architecture||[]){if((a.layer||'back')!==layer)continue;let rect=a;
   if(a.type==='scaffold'&&a.hazardId){const hazard=world.hazards.find(h=>h.id===a.hazardId);if(!hazard)continue;const asset=this.manifest.assets.scaffold,w=a.w||230,h=a.h||w*asset.height/asset.width;rect={...a,x:hazard.x+hazard.w/2-w*(asset.hazardOriginX??.57),y:hazard.y+hazard.h-h,w,h}}
   const viewRect=['merchant','workshop'].includes(rect.type)?buildingRect(this.manifest.assets[rect.type],rect):rect;
   if(viewRect.x+viewRect.w<cam.x-60||viewRect.x>cam.x+width+60||viewRect.y+(viewRect.h||500)<cam.y-80||viewRect.y>cam.y+height+80)continue;
   if(rect.type==='stairs')this.drawStairs(c,rect,world);else if(rect.type==='lantern'||rect.type==='waypost')this.drawStreetProp(c,rect);else this.drawBuilding(c,rect);
  }
  return true;
 }
 drawBlock(c,b,world){
  if(world?.chapter!==0||!this.manifest||this.error)return false;
  const a=world.architecture?.find(a=>(a.collisionIds||[]).includes(b.id)||a.colliderId===b.id||b.townGroup===a.id);
  // Matching artwork has already been drawn by drawWorld. Its colliders stay
  // invisible, including the collapsed wagon's former floating ceiling block.
  return!!(a&&this.images.has(a.type));
 }
 drawObject(c,o,world){
  if(world?.chapter===0&&o.type==='clue'&&o.architectureId&&this.images.has('guild-plaque')&&this.images.has('timber')){const a=world.architecture?.find(a=>a.id===o.architectureId);if(a?.type==='waypost')return true}
  if(world?.chapter!==0||o.id!=='mainpuzzle'||!this.images.has('seal'))return false;
  const im=this.images.get('seal'),height=112,width=height*im.naturalWidth/im.naturalHeight;
  return this.draw(c,'seal',o.x-width*.55,o.y-height,width,height);
 }
 drawHazard(c,h,state,world){
  if(world?.chapter!==0||h.type!=='piston'||!this.images.has('barricade-extended')||!this.images.has('barricade-retracted'))return false;
  const extended=this.manifest.assets['barricade-extended'],retracted=this.manifest.assets['barricade-retracted'],ground=h.y+h.h,base=h.h*(1-extended.ground)/extended.ground;
  const type=state.active?'barricade-extended':'barricade-retracted',asset=state.active?extended:retracted,height=base/(1-asset.ground),top=ground-height*asset.ground;
  c.save();if(state.warning){const g=c.createRadialGradient(h.x+h.w/2,ground-4,2,h.x+h.w/2,ground-4,h.w*.9);g.addColorStop(0,'#e4aa4f66');g.addColorStop(1,'#e4aa4f00');c.fillStyle=g;c.fillRect(h.x-30,ground-h.w,h.w+60,h.w*2)}
  // The iron box is embedded in the paving. Only its eight-pixel maintenance
  // lip remains below ground, while extended tips align to the damage box.
  c.beginPath();c.rect(h.x-12,top-2,h.w+24,ground+8-top+2);c.clip();this.draw(c,type,h.x-7,top,h.w+14,height);c.restore();return true;
 }
}
