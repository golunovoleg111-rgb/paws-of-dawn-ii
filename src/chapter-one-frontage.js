// A street elevation is one connected architectural mass. Painted individual
// houses are detail bays within it, not freestanding stage props in a void.
export function frontageProfile(frontage){
 const ground=frontage.groundY??frontage.y+frontage.h;
 const points=frontage.profile?.length?frontage.profile:[{x:frontage.x,y:frontage.y},{x:frontage.x+frontage.w,y:frontage.y}];
 return{ground,points:[...points].sort((a,b)=>a.x-b.x)};
}
export function roofHeightAt(frontage,x){
 const{points}=frontageProfile(frontage);if(x<=points[0].x)return points[0].y;
 for(let i=1;i<points.length;i++){const a=points[i-1],b=points[i];if(x<=b.x)return b.x===a.x?b.y:a.y+(b.y-a.y)*(x-a.x)/(b.x-a.x)}
 return points.at(-1).y;
}
function openingPath(c,o){c.moveTo(o.x,o.y);c.lineTo(o.x+o.w,o.y);c.lineTo(o.x+o.w,o.y+o.h+3);c.lineTo(o.x,o.y+o.h+3);c.closePath()}
function wallPath(c,f){const{ground,points}=frontageProfile(f);c.moveTo(points[0].x,ground+8);c.lineTo(points[0].x,points[0].y);for(const p of points.slice(1))c.lineTo(p.x,p.y);c.lineTo(points.at(-1).x,ground+8);c.closePath();for(const o of f.openings||[])openingPath(c,o);}
function archWindow(c,x,y,w,h,lit){
 c.save();c.beginPath();c.moveTo(x,y+h);c.lineTo(x,y+w*.45);c.quadraticCurveTo(x+w*.5,y-w*.28,x+w,y+w*.45);c.lineTo(x+w,y+h);c.closePath();const glass=c.createLinearGradient(0,y,0,y+h);glass.addColorStop(0,lit?'#b49462':'#475865');glass.addColorStop(1,lit?'#6f684f':'#344750');c.fillStyle=glass;c.fill();c.strokeStyle='#afa58c';c.lineWidth=4;c.stroke();c.strokeStyle='#414641';c.lineWidth=2;c.beginPath();c.moveTo(x+w*.5,y+4);c.lineTo(x+w*.5,y+h);c.moveTo(x+2,y+h*.55);c.lineTo(x+w-2,y+h*.55);c.stroke();c.restore();
}
export function drawCityFrontage(c,world,cam,art){
 const left=cam.x-140,right=cam.x+(cam.width||1280)+140;
 for(const f of world.frontages||[]){if(f.x+f.w<left||f.x>right)continue;const{ground,points}=frontageProfile(f),top=Math.min(...points.map(p=>p.y));
  c.save();c.beginPath();wallPath(c,f);c.clip('evenodd');
  // Source phase remains fixed to the building, while only visible tiles draw.
  const tx=f.x+Math.max(0,Math.floor((left-f.x)/480))*480,tw=Math.min(f.x+f.w,right+480)-tx;
  art.tile(c,'masonry',tx,top,tw,ground-top+12);
  const shade=c.createLinearGradient(0,top,0,ground);shade.addColorStop(0,'#d3c7aa0b');shade.addColorStop(.58,'#4f5e6908');shade.addColorStop(1,'#36455330');c.fillStyle=shade;c.fillRect(tx,top,tw,ground-top+10);
  // Irregular bay rhythm and paired high windows make a continuous street,
  // while keeping apparent entrances separate from the playable openings.
  for(let x=f.x+72;x<f.x+f.w-28;x+=164){if(x<left-70||x>right+70)continue;const roof=roofHeightAt(f,x),wy=ground-181;if(wy>roof+38&&!((f.openings||[]).some(o=>x+29>o.x-18&&x-2<o.x+o.w+18))){archWindow(c,x,wy,27,47,(Math.floor((x-f.x)/164)%3)===1);if(ground-roof>310)archWindow(c,x,wy-103,27,43,false)}
   art.tile(c,'masonry',x+62,roof+8,14,Math.max(0,ground-roof-5));c.strokeStyle='#d2c4a02b';c.lineWidth=1;c.beginPath();c.moveTo(x+62,roof+8);c.lineTo(x+62,ground);c.stroke();
  }
  // The long plinth grounds houses, retaining walls and gate wings together.
  art.tile(c,'masonry',f.x,ground-24,f.w,34);c.restore();
  c.save();c.strokeStyle='#393e3e';c.lineWidth=9;c.beginPath();c.moveTo(points[0].x,points[0].y+8);for(const p of points.slice(1))c.lineTo(p.x,p.y+8);c.stroke();c.strokeStyle='#b9ad92';c.lineWidth=3;c.beginPath();c.moveTo(points[0].x,points[0].y);for(const p of points.slice(1))c.lineTo(p.x,p.y);c.stroke();c.restore();
 }
 return true;
}

// Stone stairs are built on a single retaining structure, with an arch where
// the side route passes beneath. They never rest on a row of tiny wooden legs.
export function drawMasonryStairSupport(c,steps,art){
 if(!steps.length)return;const first=steps[0],last=steps.at(-1),floor=Math.max(...steps.map(s=>s.supportY??s.y+8)),x1=first.x,x2=last.x+last.w,y1=first.y+7,y2=last.y+7;
 const rise=Math.abs(y2-y1),width=x2-x1,arch=width>230&&rise>95;
 c.save();c.beginPath();c.moveTo(x1,y1);for(const s of steps){c.lineTo(s.x,s.y+7);c.lineTo(s.x+s.w,s.y+7)}c.lineTo(x2,floor+9);c.lineTo(x1,floor+9);c.closePath();
 if(arch){const highLeft=y1<y2,center=x1+width*(highLeft?.28:.72),aw=Math.min(104,width*.35),spring=floor-34,archTop=Math.min(y1,y2)+70;c.moveTo(center-aw/2,floor+10);c.lineTo(center-aw/2,spring);c.bezierCurveTo(center-aw/2,archTop,center+aw/2,archTop,center+aw/2,spring);c.lineTo(center+aw/2,floor+10);c.closePath()}
 c.clip('evenodd');art.tile(c,'masonry',x1,Math.min(y1,y2),width,floor-Math.min(y1,y2)+12);c.restore();
 if(arch){const highLeft=y1<y2,center=x1+width*(highLeft?.28:.72),aw=Math.min(104,width*.35),spring=floor-34,archTop=Math.min(y1,y2)+70;c.save();c.strokeStyle='#b2a58b';c.lineWidth=10;c.beginPath();c.moveTo(center-aw/2,floor+3);c.lineTo(center-aw/2,spring);c.bezierCurveTo(center-aw/2,archTop,center+aw/2,archTop,center+aw/2,spring);c.lineTo(center+aw/2,floor+3);c.stroke();c.restore()}
}
