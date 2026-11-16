const overlap=(a,b)=>a.x<b.x+b.w&&a.x+a.w>b.x&&a.y<b.y+b.h&&a.y+a.h>b.y;
export function stepUpStairs(p,b,blocks){const rise=p.y+p.h-b.y;if(b.kind!=='stairs'||!p.ground||Math.abs(p.vx)<.01||rise<=0||rise>16||b.optional&&p.stairRoute!==b.townGroup)return false;const candidate={x:p.x,y:b.y-p.h,w:p.w,h:p.h};if(blocks.some(a=>a!==b&&!a.oneWay&&overlap(candidate,a)))return false;p.y=candidate.y;p.vy=0;return true}
export function enterStair(p,flight,end){p.stairRoute=flight.id;p.x=(end==='left'?flight.x-16:flight.x+flight.w+16)-p.w/2;p.y=(end==='left'?(flight.direction>0?flight.low:flight.high):(flight.direction>0?flight.high:flight.low))-p.h;p.vx=p.vy=0;p.dash=0;p.ground=true;}
export function traverseStair(p,flight,move,speed,dt,solids=[]){
 const oldX=p.x,center=p.x+p.w/2+move*speed*.74*dt,t=Math.max(0,Math.min(1,(center-flight.x)/flight.w)),step=flight.direction>0?Math.ceil(t*flight.count):Math.floor(t*flight.count),rise=(flight.low-flight.high)*step/flight.count,feet=flight.direction>0?flight.low-rise:flight.high+rise;
 const candidate={x:center-p.w/2,y:feet-p.h,w:p.w,h:p.h};
 if(solids.some(b=>!b.oneWay&&b.kind!=='stairs'&&overlap(candidate,b)))return false;
 p.x=candidate.x;p.y=candidate.y;p.vx=move*speed*.74;p.vy=0;p.ground=true;p.jumps=0;
 if(center<flight.x-20||center>flight.x+flight.w+20)p.stairRoute=null;
 return Math.abs(p.x-oldX)>0;
}
