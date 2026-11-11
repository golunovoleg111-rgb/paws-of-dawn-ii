const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
export const CAMERA_ZOOM=1.85;
export function cameraTarget(p,world){const width=1280/CAMERA_ZOOM,height=720/CAMERA_ZOOM;return{x:clamp(p.x+15-width*.43+p.dir*45,0,Math.max(0,world.width-width)),y:clamp(p.y+p.h-height*.72,0,Math.max(0,world.height-height)),zoom:CAMERA_ZOOM,width,height}}
export function twoBone(root,end,a,b,bend=1){let dx=end.x-root.x,dy=end.y-root.y,d=Math.hypot(dx,dy)||.001;const r=clamp(d,Math.abs(a-b)+.01,a+b-.01),along=(a*a-b*b+r*r)/(2*r),off=Math.sqrt(Math.max(0,a*a-along*along));dx/=d;dy/=d;return{x:root.x+dx*along-dy*off*bend,y:root.y+dy*along+dx*off*bend}}
export function strikePhase(id){return id.includes('bow')?.42:id==='hammer'?.6:id==='sabre'?.5:.56}
export function bowDrawAmount(phase){if(phase>=.42)return Math.max(0,1-(phase-.42)/.08);const t=Math.max(0,phase/.42);return t*t*(3-2*t)}
export function weaponTiming(id){return id==='hammer'?.76:id.includes('bow')?.58:id==='sabre'?.25:id==='moonblade'?.31:.38}
export function solveLimb(root,target,a,b,bend=1){
 const dx=target.x-root.x,dy=target.y-root.y,d=Math.hypot(dx,dy)||1;
 const reach=clamp(d,Math.abs(a-b)+.05,a+b-.05),end={x:root.x+dx/d*reach,y:root.y+dy/d*reach};
 return{root,joint:twoBone(root,end,a,b,bend),end};
}
const smooth=t=>{t=clamp(t,0,1);return t*t*(3-2*t)};
const lerp=(a,b,t)=>a+(b-a)*t;
// Ground contact moves backwards relative to the body; the return swing is airborne.
export function strideAmplitude(speed=110,crouch=false){return crouch?4:speed>150?18:12}
export function strideAdvance(distance,speed=110,crouch=false){return Math.abs(distance)*Math.PI*.6/strideAmplitude(speed,crouch)}
export function stepFoot(stride,amplitude=12,lift=9){const t=((stride/(Math.PI*2))%1+1)%1;if(t<.6)return{x:amplitude*(1-2*t/.6),y:0};const u=(t-.6)/.4;return{x:amplitude*(2*smooth(u)-1),y:-Math.sin(u*Math.PI)*lift}}
export function rigPose({action='idle',time=0,phase=0,stride=time*7,speed=0,weapon='sword',interact=0,widthScale=1}={}){
 const locomotion=action==='walk'||action==='run',crouch=action==='crouch',air=action==='jump',attack=action==='attack',bow=weapon.includes('bow'),hammer=weapon==='hammer';
 const amount=locomotion?clamp((speed||120)/245,.2,1):crouch&&speed>3?.28:0;
 let hip={x:0,y:-40+Math.cos(stride*2)*amount},feet=[{x:-5,y:0},{x:6,y:0}];
 if(amount)feet=[0,Math.PI].map(a=>stepFoot(stride+a,strideAmplitude(speed),action==='run'?12:8));
 if(air)feet=[{x:-11,y:-5},{x:13,y:-12}];
 if(crouch){hip={x:-7,y:-18};feet=[-14,19].map((x,i)=>{const f=amount?stepFoot(stride+i*Math.PI,4,3):{x:0,y:0};return{x:x+f.x,y:f.y}});}
 // Feet stay planted. Lower the pelvis if a stride would otherwise stretch a leg.
 if(!crouch)for(let i=0;i<2;i++){const dx=feet[i].x-(hip.x+(i?3:-3)),dy=Math.sqrt(Math.max(1,34*34-dx*dx));hip.y=Math.max(hip.y,feet[i].y-7-dy);}
 const shoulder=crouch?{x:9,y:-38}:{x:locomotion?amount*3:0,y:hip.y-28};
 const torsoAngle=Math.atan2(hip.y-shoulder.y,hip.x-shoulder.x)-Math.PI/2;const neck=bodyPoint(shoulder,1.5,4,torsoAngle);
 const head={...neck};
 const roots=armRoots(shoulder,torsoAngle,widthScale);
 let hands=[{x:roots[0].x-2-feet[0].x*.5,y:roots[0].y+27},{x:roots[1].x+4-feet[1].x*.5,y:roots[1].y+27}],weaponAngle=.12;
 if(bow&&!attack)hands[1]={x:roots[1].x+9,y:roots[1].y+24};
 if(air)hands=[{x:roots[0].x-14,y:roots[0].y+16},{x:roots[1].x+15,y:roots[1].y+13}];
 if(crouch)hands=[{x:roots[0].x+10,y:roots[0].y+17},{x:roots[1].x+12,y:roots[1].y+17}];
 if(attack){
  if(bow){hands=[{x:shoulder.x+17-17*bowDrawAmount(phase),y:shoulder.y+6},{x:shoulder.x+38,y:shoulder.y+5}];weaponAngle=0;}
  else{
   const w=smooth(phase/.33),strike=smooth((phase-.33)/.32),recover=smooth((phase-.65)/.35),root=roots[1];
   const high={x:root.x-9,y:root.y-19},end={x:root.x+(hammer?18:27),y:root.y+5},rest={x:root.x+4,y:root.y+27};
   let hand={x:lerp(rest.x,high.x,w),y:lerp(rest.y,high.y,w)};
   if(phase>.33)hand={x:lerp(high.x,end.x,strike),y:lerp(high.y,end.y,strike)-Math.sin(strike*Math.PI)*7};
   if(phase>.65)hand={x:lerp(end.x,rest.x,recover),y:lerp(end.y,rest.y,recover)};
   hands[1]=hand;weaponAngle=lerp(.12,-.8,w)+2.2*strike-1.28*recover;
   if(hammer)hands[0]={x:hand.x-Math.sin(weaponAngle)*7,y:hand.y+Math.cos(weaponAngle)*7};
  }
 }
 if(action==='interact'||interact>0){const reach=Math.sin(Math.PI*clamp(interact||phase,0,1));hands=[{x:roots[0].x+18,y:roots[0].y+11},{x:roots[1].x+19+reach*5,y:roots[1].y+9}];weaponAngle=.4;}
 const arms=hands.map((h,i)=>solveLimb(roots[i],h,16,15,i?1:-1));
 hands=arms.map(a=>a.end);
 const legs=feet.map((f,i)=>solveLimb({x:hip.x+(i?3:-3),y:hip.y},{x:f.x,y:f.y-7},18,17,-1));
 const capeEnd={x:hip.x-18-amount*12+Math.sin(time*3)*2,y:-5};
 return{hip,shoulder,neck,head,feet,hands,arms,legs,lean:torsoAngle,weaponAngle,bow,attack,phase,capeEnd,cloth:Math.sin(time*3)*.08,tail:Math.sin(time*2.5)*.08-amount*.1,crouch,widthScale};
}

export function bodyPoint(origin,x,y,angle){return{x:origin.x+x*Math.cos(angle)-y*Math.sin(angle),y:origin.y+x*Math.sin(angle)+y*Math.cos(angle)}}
export function armRoots(shoulder,angle,widthScale=1){return[bodyPoint(shoulder,-8*widthScale,4,angle),bodyPoint(shoulder,10*widthScale,4,angle)]}
export function blendRigPose(old,next,k=1){const p={...next};if(old){const pt=(a,b)=>({x:lerp(a.x,b.x,k),y:lerp(a.y,b.y,k)});p.hip=pt(old.hip,next.hip);p.lean=lerp(old.lean,next.lean,k);p.hands=next.hands.map((h,i)=>pt(old.hands[i],h));p.feet=next.feet.map((f,i)=>pt(old.feet[i],f));p.weaponAngle=lerp(old.weaponAngle,next.weaponAngle,k);p.capeEnd=pt(old.capeEnd,next.capeEnd);p.tail=lerp(old.tail,next.tail,k);}p.shoulder=bodyPoint(p.hip,0,-28,p.lean);p.neck=bodyPoint(p.shoulder,1.5,4,p.lean);p.head={...p.neck};const roots=armRoots(p.shoulder,p.lean,p.widthScale);p.arms=p.hands.map((h,i)=>solveLimb(roots[i],h,16,15,i?1:-1));p.hands=p.arms.map(a=>a.end);p.legs=p.feet.map((f,i)=>solveLimb({x:p.hip.x+(i?3:-3),y:p.hip.y},{x:f.x,y:f.y-7},18,17,-1));p.feet=p.legs.map(l=>({x:l.end.x,y:l.end.y+7}));{const dx=p.capeEnd.x-p.shoulder.x+4,dy=p.capeEnd.y-p.shoulder.y+2;p.capeEnd.y=Math.min(p.capeEnd.y,-4-14.5*Math.abs(dx)/(Math.hypot(dx,dy)||1));}return p;}