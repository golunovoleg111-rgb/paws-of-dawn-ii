export const PROP_SPACE={shop:{w:250,h:178,pad:130},npc:{w:65,h:82,pad:100},campfire:{w:65,h:72,pad:110},checkpoint:{w:62,h:92,pad:100},puzzle:{w:105,h:125,pad:140},shrine:{w:94,h:105,pad:130},clue:{w:52,h:72,pad:95},cage:{w:112,h:125,pad:120},exit:{w:110,h:162,pad:110},ingredient:{w:40,h:45,pad:95},crate:{w:44,h:44,pad:110},plate:{w:80,h:16,pad:110},chest:{w:58,h:48,pad:80},stash:{w:58,h:48,pad:80}};
const overlap=(a,b)=>a.x<b.x+b.w&&a.x+a.w>b.x&&a.y<b.y+b.h&&a.y+a.h>b.y;
export function propBounds(o){const s=PROP_SPACE[o.type];return s?{x:o.x-s.w/2,y:o.y-s.h,w:s.w,h:s.h}:null}
export function hazardNearObject(h,o){const space=PROP_SPACE[o.type];if(!space)return false;const pad=space.pad+(h.type==='rock'?18:0);return h.x+h.w>o.x-space.w/2-pad&&h.x<o.x+space.w/2+pad;}
export function finalizeLayout(world){const {solids,ledges,objects}=world,ground=solids.filter(b=>b.id?.startsWith('ground'));
 // Keep complete props clear of gallery undersides, roofs and progression barriers.
 for(const o of objects){const spec=PROP_SPACE[o.type];if(!spec||['crate','plate','ingredient','chest','stash'].includes(o.type))continue;
  const supports=[...ground,...ledges].filter(b=>Math.abs(b.y-o.y)<2&&o.x>=b.x-1&&o.x<=b.x+b.w+1);const support=supports.sort((a,b)=>a.w-b.w)[0];if(!support)continue;
  const clear=cx=>{const box={x:cx-spec.w/2-4,y:o.y-spec.h-8,w:spec.w+8,h:spec.h+7};return ![...ledges,...solids.filter(b=>b.ceiling)].some(b=>b!==support&&overlap(box,b))&&!objects.some(a=>a!==o&&['gate','breakwall'].includes(a.type)&&overlap(box,a));};
  if(clear(o.x))continue;const candidates=[];for(let cx=support.x+spec.w/2+6;cx<=support.x+support.w-spec.w/2-6;cx+=12)if(clear(cx))candidates.push(cx);if(candidates.length)o.x=candidates.sort((a,b)=>Math.abs(a-o.x)-Math.abs(b-o.x))[0];
 }
 const retained=[];
 for(const h of world.hazards){const support=ground.find(b=>h.x>=b.x&&h.x<b.x+b.w);if(!support)continue;const valid=x=>{const candidate={...h,x};return!objects.some(o=>hazardNearObject(candidate,o))&&!retained.some(a=>Math.abs(a.x-x)<140);};
  if(valid(h.x)){retained.push(h);continue}const candidates=[];for(let x=support.x+90;x+h.w<support.x+support.w-90;x+=16)if(valid(x))candidates.push(x);if(candidates.length){h.x=candidates.sort((a,b)=>Math.abs(a-h.x)-Math.abs(b-h.x))[0];retained.push(h)}
 }
 world.hazards=retained;
 world.sanctuaries=objects.filter(o=>['shop','campfire','npc'].includes(o.type)).map(o=>({x:o.x-(o.type==='shop'?155:100),y:o.y-120,w:o.type==='shop'?310:200,h:145}));
 for(const e of world.enemies){if(e.boss)continue;const clear=x=>!world.sanctuaries.some(z=>overlap({x,y:e.y,w:e.w,h:e.h},z));if(clear(e.x))continue;const candidates=[];for(let x=e.left+30;x<e.right-e.w-30;x+=24)if(clear(x))candidates.push(x);if(candidates.length){e.x=candidates.sort((a,b)=>Math.abs(a-e.x)-Math.abs(b-e.x))[0];e.home=e.x}}
 return world;
}
