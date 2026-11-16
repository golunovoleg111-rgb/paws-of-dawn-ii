export const PROP_SPACE={shop:{w:250,h:178,pad:130},npc:{w:65,h:82,pad:100},campfire:{w:65,h:72,pad:110},checkpoint:{w:62,h:92,pad:100},puzzle:{w:105,h:125,pad:140},shrine:{w:94,h:105,pad:130},clue:{w:52,h:72,pad:95},cage:{w:112,h:125,pad:120},exit:{w:110,h:162,pad:110},ingredient:{w:40,h:45,pad:95},crate:{w:44,h:44,pad:110},plate:{w:80,h:16,pad:110},chest:{w:58,h:48,pad:80},stash:{w:58,h:48,pad:80}};
const overlap=(a,b)=>a.x<b.x+b.w&&a.x+a.w>b.x&&a.y<b.y+b.h&&a.y+a.h>b.y;
// These are named safe nodes, not a repeated percentage pattern. Coordinates
// refer to each chapter's authored ground section and remain stable per seed.
const CAMPUS=[
 {shop:[0,430,'Лавка на площади фонарщика'],checkpoint:[5,80,'Площадь четырёх гильдий'],rest:[4,165,'Очаг каменщиков']},
 {shop:[1,180,'Склад у затопленного причала'],checkpoint:[4,160,'Дежурная насосная'],rest:[6,180,'Укрытие за водосбросом']},
 {shop:[1,150,'Лавка смотрителя звёзд'],checkpoint:[4,130,'Пост хранителя линзы'],rest:[6,170,'Укрытие под разрушенным куполом']},
 {shop:[2,160,'Кладовая наладчика'],checkpoint:[5,130,'Пульт главной шестерни'],rest:[7,160,'Площадка ремонтной бригады']},
 {shop:[1,160,'Дом садовника'],checkpoint:[4,160,'Сухой садовый павильон'],rest:[6,170,'Очаг у садовой печи']},
 {shop:[0,430,'Лавка каменотёса'],checkpoint:[5,150,'Укрытие у грузовых весов'],rest:[7,180,'Рабочий лагерь в штольне']},
 {shop:[1,180,'Лавка мостового смотрителя'],checkpoint:[4,160,'Опора каменного маяка'],rest:[6,180,'Подветренный уступ']},
 {shop:[1,160,'Стол переплётчика'],checkpoint:[4,160,'Нижний каталог'],rest:[6,180,'Комната хранителя архива']},
 {shop:[1,160,'Погребок свечника'],checkpoint:[5,160,'Притвор перед органом'],rest:[7,160,'Келья звонаря']},
 {shop:[1,180,'Последний обоз'],checkpoint:[5,180,'Караульная у внутренней стены'],rest:[7,180,'Очаг освобождённых стражей']}
];
const supportFor=(world,x)=>world.solids.find(b=>b.id?.startsWith('ground')&&x>=b.x&&x<b.x+b.w);
export function enforceWorldPolicy(world){
 const ground=world.solids.filter(b=>b.id?.startsWith('ground')).sort((a,b)=>a.x-b.x),plan=CAMPUS[world.chapter];
 const place=(o,spec)=>{const b=ground[spec[0]];o.x=b.x+spec[1];o.y=b.y;o.name=spec[2];o.supportId=b.id;return o};
 const ori=world.objects.find(o=>o.id==='ori'),shop=world.objects.find(o=>o.id==='trader');
 if(shop){place(shop,plan.shop);shop.merchant='ori';shop.speaker='Ори';shop.dialogue=ori?.text||shop.dialogue||'';shop.dialogueTitle='Ори · '+shop.name;shop.checkpoint=false}
 world.objects=world.objects.filter(o=>o.id!=='ori'&&o.id!=='trader2'&&(o.type!=='checkpoint'||['checkpoint0.5','bosscheckpoint'].includes(o.id)));
 const mid=world.objects.find(o=>o.id==='checkpoint0.5');if(mid){place(mid,plan.checkpoint);mid.checkpoint=true;mid.role='midpoint'}
 const boss=world.objects.find(o=>o.id==='bosscheckpoint');if(boss){const b=ground.at(-1);boss.x=b.x+110;boss.y=b.y;boss.supportId=b.id;boss.name='Укрытие перед стражем';boss.checkpoint=true;boss.role='boss-approach'}
 for(const o of world.objects.filter(o=>o.type==='campfire')){place(o,plan.rest);o.checkpoint=false;o.healOnly=true}
 // A lock fills a real 160px doorway. A finite structural lintel joins it to
 // a tall gatehouse wall, so jumping onto a side balcony cannot bypass it.
 world.solids=world.solids.filter(b=>b.kind!=='door-lintel');world.doorways=[];
 for(const o of world.objects.filter(o=>['gate','breakwall'].includes(o.type))){
  if(world.chapter===0&&o.id==='puzzlegate')o.x=5870;
  const floor=supportFor(world,o.x)||ground.reduce((a,b)=>Math.abs(b.x-o.x)<Math.abs(a.x-o.x)?b:a),floorY=floor.y;
  o.w=o.type==='gate'?72:60;o.h=160;o.y=floorY-o.h;
  const center=o.x+o.w/2,wallTop=Math.max(0,floorY-560),id='door-lintel-'+o.id,frameId='doorway-'+o.id,style=o.type==='breakwall'?'rubble':o.requires==='phase'?'moon-glass':world.chapter===0?'guild-gate':'moon-gate';
  o.door={floorY,openingHeight:o.h,wallTop,wallThickness:110,frameId,style,supportId:floor.id};
  world.solids.push({id,x:center-55,y:wallTop,w:110,h:o.y-wallTop,oneWay:false,kind:'door-lintel',supportsDoor:o.id,visualOwner:frameId});
  world.doorways.push({id:frameId,gateId:o.id,solidIds:[id],x:center-120,y:wallTop,w:240,h:floorY-wallTop,openingX:o.x,openingY:o.y,openingW:o.w,openingH:o.h,floorY,style});
 }
 const removed=world.ledges.filter(b=>!b.townOwned&&world.doorways.some(d=>b.x<d.openingX+d.openingW+80&&b.x+b.w>d.openingX-80&&b.y<d.openingY+72));
 world.ledges=world.ledges.filter(b=>!removed.includes(b));
 for(const o of world.objects){if(!['chest','stash','ingredient','fish'].includes(o.type))continue;const b=removed.find(b=>o.x>=b.x&&o.x<=b.x+b.w&&Math.abs(o.y-b.y)<45);if(b){const floor=supportFor(world,o.x);if(floor)o.y=floor.y-(o.type==='fish'?34:0)}}
 world.restPolicy={checkpointIds:['checkpoint0.5','bosscheckpoint'],shopId:'trader',campfires:'healing-only',merchant:'ori'};
 return world;
}

// Rebuilt after placement safety moves a trap: visible origin and damage always
// agree. originX is the falling box's centre; originY is its initial top edge.
export function attachHazardSources(world){
 for(const h of world.hazards){const floor=supportFor(world,h.x);if(!floor)continue;const originX=h.x+h.w/2,originY=h.type==='rock'?h.y-250:h.y;let type,context,attached;
  if(h.type==='rock'){type=world.chapter===0?'scaffold':world.chapter===5?'cliff-fault':'ceiling-rubble';attached=type==='scaffold'?'scaffold':type==='cliff-fault'?'cliff':'vault';context=world.chapter===0?'Повреждённая кладка строительных лесов':world.chapter===5?'Трещина в нависающей скале':world.chapter===2?'Разрушенный свод обсерватории':'Осыпающийся свод собора'}
  else if(h.type==='lava'){type=world.chapter===5?'magma-channel':'furnace-conduit';attached=world.chapter===5?'floor-channel':'furnace';context=world.chapter===5?'Открытая магматическая жила в каменоломне':world.chapter===3?'Выпускной жёлоб литейного тигля':'Печь нижней кузницы цитадели'}
  else if(h.type==='spore'){type='spore-pod';attached='plant';context='Заражённый семенной мешок у корней'}
  else if(h.type==='watch'){type='watch-seal';attached='wall-seal';context=world.chapter===7?'Наблюдающая печать архивного каталога':'Печать тишины соборного пролёта'}
  else if(h.type==='wind'){type='canyon-draft';attached='canyon';context='Сквозной поток между опорами подвесного моста'}
  else{type=world.chapter===3?'pressure-cylinder':'guard-barricade';attached='floor-channel';context=world.chapter===3?'Пневматический пресс мануфактуры':'Встроенное в дорогу стражевое заграждение'}
  const rock=h.type==='rock',lava=h.type==='lava',w=rock?230:lava?125:h.w+24,sourceH=rock?278:lava?110:Math.max(50,h.h+20);
  h.source={id:'hazard-source-'+h.id,type,x:rock?originX-w*.57:originX-w/2,y:rock?floor.y-sourceH:originY-sourceH+10,w,h:sourceH,originX,originY,floorY:floor.y,supportId:floor.id,visible:true,context,attachedTo:{kind:attached,id:floor.id}};
  h.context=context;h.origin=type;
 }
 return world;
}
export function propBounds(o){const s=PROP_SPACE[o.type];return s?{x:o.x-s.w/2,y:o.y-s.h,w:s.w,h:s.h}:null}
export function hazardNearObject(h,o){const space=PROP_SPACE[o.type];if(!space)return false;const pad=space.pad+(h.type==='rock'?18:0);return h.x+h.w>o.x-space.w/2-pad&&h.x<o.x+space.w/2+pad;}
export function finalizeLayout(world){enforceWorldPolicy(world);const {solids,ledges,objects}=world,ground=solids.filter(b=>b.id?.startsWith('ground'));
 // Keep complete props clear of gallery undersides, roofs and progression barriers.
 for(const o of objects){const spec=PROP_SPACE[o.type];if(!spec||['crate','plate','ingredient','chest','stash'].includes(o.type))continue;
  const supports=[...ground,...ledges].filter(b=>Math.abs(b.y-o.y)<2&&o.x>=b.x-1&&o.x<=b.x+b.w+1);const support=supports.sort((a,b)=>a.w-b.w)[0];if(!support)continue;
  const clear=cx=>{const box={x:cx-spec.w/2-4,y:o.y-spec.h-8,w:spec.w+8,h:spec.h+7};return ![...ledges,...solids.filter(b=>b.ceiling||b.kind==='door-lintel')].some(b=>b!==support&&overlap(box,b))&&!objects.some(a=>a!==o&&['gate','breakwall'].includes(a.type)&&overlap(box,a));};
  if(clear(o.x))continue;const candidates=[];for(let cx=support.x+spec.w/2+6;cx<=support.x+support.w-spec.w/2-6;cx+=12)if(clear(cx))candidates.push(cx);if(candidates.length)o.x=candidates.sort((a,b)=>Math.abs(a-o.x)-Math.abs(b-o.x))[0];
 }
 const retained=[];
 for(const h of world.hazards){const support=ground.find(b=>h.x>=b.x&&h.x<b.x+b.w);if(!support)continue;const valid=x=>{const candidate={...h,x};return!objects.some(o=>hazardNearObject(candidate,o))&&!retained.some(a=>Math.abs(a.x-x)<140);};
  if(valid(h.x)){retained.push(h);continue}const candidates=[];for(let x=support.x+90;x+h.w<support.x+support.w-90;x+=16)if(valid(x))candidates.push(x);if(candidates.length){h.x=candidates.sort((a,b)=>Math.abs(a-h.x)-Math.abs(b-h.x))[0];retained.push(h)}
 }
 world.hazards=retained;
 world.sanctuaries=objects.filter(o=>['shop','campfire','npc'].includes(o.type)).map(o=>({x:o.x-(o.type==='shop'?155:100),y:o.y-120,w:o.type==='shop'?310:200,h:145}));
 for(const e of world.enemies){if(e.boss)continue;const clear=x=>![...world.sanctuaries,...solids.filter(b=>!b.oneWay&&!b.id?.startsWith('ground')),...objects.filter(o=>['gate','breakwall'].includes(o.type))].some(z=>overlap({x,y:e.y,w:e.w,h:e.h},z));if(clear(e.x))continue;const candidates=[];for(let x=e.left+30;x<e.right-e.w-30;x+=24)if(clear(x))candidates.push(x);if(candidates.length){e.x=candidates.sort((a,b)=>Math.abs(a-e.x)-Math.abs(b-e.x))[0];e.home=e.x}}
 return attachHazardSources(world);
}
