// Respawn points are authored world objects. Healing fires never create one.
export function checkpointPosition(point){return{id:point.id,x:point.x-20,y:point.y-72}}
export function restoreCheckpoint(world,run){
 const points=world.objects.filter(o=>o.type==='checkpoint');
 const current=points.find(o=>o.id===run.checkpoint?.id);
 if(current&&run.opened.includes(current.id))return checkpointPosition(current);
 // Older saves stored coordinates only. Keep an exact surviving checkpoint;
 // otherwise select an already visited point behind that position, never ahead.
 const previous=run.checkpoint;
 const exact=points.find(o=>run.opened.includes(o.id)&&Math.abs(o.x-20-previous?.x)<2&&Math.abs(o.y-72-previous?.y)<2);
 if(exact)return checkpointPosition(exact);
 const visited=points.filter(o=>run.opened.includes(o.id)&&o.x-20<=(previous?.x??world.spawn.x)+2).sort((a,b)=>b.x-a.x);
 return visited.length?checkpointPosition(visited[0]):{...world.spawn,id:'spawn'};
}
