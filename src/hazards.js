export function hazardState(h,time){
 const cycle=((time+(h.phase||0))%4.8+4.8)%4.8;
 if(h.type==='rock'){const warning=cycle<1.3,falling=cycle>=1.3&&cycle<2.05,impact=cycle>=2.05&&cycle<2.3;const progress=falling?(cycle-1.3)/.75:impact?1:0;return{warning,active:falling||impact,impact,progress,box:{x:h.x,y:h.y-250+250*progress*progress,w:h.w,h:h.h}}}
 if(h.type==='lava')return{active:true,warning:false,box:h};
 if(h.type==='piston')return{active:cycle>1.2&&cycle<2.6,warning:cycle>.45&&cycle<=1.2,box:h};
 if(h.type==='watch')return{active:Math.sin(time*.8+h.phase)>.05,warning:Math.sin(time*.8+h.phase)>-.4,box:h};
 return{active:true,warning:false,box:h};
}
export function safeEnemyStep(e,nextX,world,run){
 if(e.type==='moth'||e.type==='sentinel')return true;
 if(!e.boss&&(world.sanctuaries||[]).some(z=>{if(!(nextX+e.w>z.x&&nextX<z.x+z.w&&e.y+e.h>z.y&&e.y<z.y+z.h))return false;const already=e.x+e.w>z.x&&e.x<z.x+z.w;return !already||Math.abs(nextX+e.w/2-z.x-z.w/2)<=Math.abs(e.x+e.w/2-z.x-z.w/2)}))return false;
 const feet=e.y+e.h,cx=nextX+e.w/2;
 const blocks=[...world.solids,...world.ledges.filter(b=>!b.hidden||run.revealed.includes(b.id))];
 return blocks.some(b=>cx>=b.x&&cx<=b.x+b.w&&Math.abs(b.y-feet)<18)&&!blocks.some(b=>!b.oneWay&&cx>b.x&&cx<b.x+b.w&&feet>b.y+22&&e.y<b.y+b.h)&&!world.hazards.some(h=>(h.type==='lava'||h.type==='spikes')&&cx>h.x-8&&cx<h.x+h.w+8);
}
