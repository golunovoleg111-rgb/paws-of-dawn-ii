import{rigPose,blendRigPose}from'../../src/motion.js';import fs from'node:fs';
const clips=[];
for(const weapon of['sword','sabre','bow','hammer','moonblade','royalbow'])
 for(const[action,count]of[['idle',8],['walk',24],['run',24],['crouch',16],['jump',12],['interact',12],['attack',20]]){
  const frames=[];
  for(let i=0;i<count;i++){
   const phase=i/count,p=rigPose({action,weapon,time:phase,phase,stride:phase*Math.PI*2,speed:action==='run'?245:action==='walk'?110:action==='crouch'?93:0,interact:action==='interact'?phase:0});
   if(action==='idle')p.hip.y+=Math.sin(phase*Math.PI*2)*.35;
   if(action==='jump'){
    const idle=rigPose({weapon}),k=Math.sin(phase*Math.PI);
    p.feet=p.feet.map((f,j)=>({x:idle.feet[j].x+(f.x-idle.feet[j].x)*k,y:idle.feet[j].y+(f.y-idle.feet[j].y)*k}));
    p.hands=p.hands.map((h,j)=>({x:idle.hands[j].x+(h.x-idle.hands[j].x)*k,y:idle.hands[j].y+(h.y-idle.hands[j].y)*k}));
   }
   frames.push(blendRigPose(null,p,1));
  }
  clips.push({weapon,action,count,frames});
 }
fs.writeFileSync(new URL('./poses.json',import.meta.url),JSON.stringify(clips));
console.log(clips.length+' clips / '+clips.reduce((n,c)=>n+c.count,0)+' complete poses');
