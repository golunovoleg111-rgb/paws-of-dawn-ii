// The same closed passage blocks sight, patrols and projectiles as well as feet.
export function closedPassages(world,run){return (world.objects||[]).filter(o=>o.type==='gate'?(o.requires==='puzzle'?!run.solved:!run.opened.includes(o.id)):o.type==='breakwall'&&!run.destroyed.includes(o.id))}
export function sightBlocked(blocks,from,to){
 return blocks.some(b=>{
  // Slab intersection of a finite sight line and an architectural rectangle.
  let near=0,far=1;
  for(const axis of['x','y']){const size=axis==='x'?'w':'h',delta=to[axis]-from[axis];
   if(Math.abs(delta)<1e-9){if(from[axis]<b[axis]||from[axis]>b[axis]+b[size])return false;continue}
   const a=(b[axis]-from[axis])/delta,z=(b[axis]+b[size]-from[axis])/delta;
   near=Math.max(near,Math.min(a,z));far=Math.min(far,Math.max(a,z));if(near>far)return false;
  }
  return near<=far;
 });
}
