import{atlasCell,isolateFrame}from'./animation.js?v=050';
import{rigPose,blendRigPose,bowDrawAmount}from'./motion.js?v=050';
export const BODY_PROFILES=[
 {name:'misty',scale:1,body:27,head:22,headH:26,limb:1,metal:'#8a919f',dark:'#292c39'},
 {name:'cody',scale:1,body:26,head:22,headH:25,limb:.95,metal:'#9c7c55',dark:'#49352c'},
 {name:'hector',scale:1.08,body:33,head:26,headH:27,limb:1.2,metal:'#a89b79',dark:'#333a3b'},
 {name:'teddy',scale:.94,body:26,head:23,headH:25,limb:.95,metal:'#9c8f69',dark:'#3e4030'},
 {name:'rat',scale:.66,body:25,head:27,headH:23,limb:.95,metal:'#8d7965',dark:'#493837'},
 {name:'guard',scale:.78,body:32,head:27,headH:24,limb:1.15,metal:'#969797',dark:'#39353c'}
];
export class ArticulatedCast{
 constructor(){this.sheets={};this.states=new WeakMap();this.errors=0;this.motion={};this.gear={};this.weapon='sword';this.promises=BODY_PROFILES.map(p=>this.load(p.name,'assets/rigs/'+p.name+'.webp',3,3));this.promises.push(this.load('cores','assets/rigs/cores-v05.webp',2,2));this.promises.push(this.load('weapons','assets/rigs/weapons.webp',3,2));}
 async load(name,url,cols,rows){try{const im=new Image();im.src=url;await im.decode();const cv=document.createElement('canvas');cv.width=im.width;cv.height=im.height;const c=cv.getContext('2d',{willReadFrequently:true});c.drawImage(im,0,0);const pixels=c.getImageData(0,0,cv.width,cv.height).data;
  this.sheets[name]=Array.from({length:cols*rows},(_,i)=>{const cell=atlasCell(i,cols,cv.width,cv.height,rows),b=isolateFrame(pixels,cv.width,cell);if(!b)throw Error('Empty rig part');const part=document.createElement('canvas');part.width=b.maxX-b.minX+1;part.height=b.maxY-b.minY+1;const pc=part.getContext('2d'),rgba=pc.createImageData(part.width,part.height);
   for(let y=0;y<part.height;y++)for(let x=0;x<part.width;x++){const xx=x+b.minX,yy=y+b.minY;let keep=b.selected.has(b.labels[yy*cell.w+xx]);if(!keep)for(let dy=-1;dy<=1&&!keep;dy++)for(let dx=-1;dx<=1;dx++){const nx=xx+dx,ny=yy+dy;if(nx>=0&&nx<cell.w&&ny>=0&&ny<cell.h&&b.selected.has(b.labels[ny*cell.w+nx])){keep=true;break}}if(keep){const source=((cell.y+yy)*cv.width+cell.x+xx)*4,dest=(y*part.width+x)*4;for(let a=0;a<4;a++)rgba.data[dest+a]=pixels[source+a];}}
   pc.putImageData(rgba,0,0);if(i===2&&BODY_PROFILES.slice(0,4).some(p=>p.name===name)){const sleeve=document.createElement("canvas");sleeve.width=part.width;sleeve.height=Math.floor(part.height*.7);sleeve.getContext("2d").drawImage(part,0,-Math.floor(part.height*.3));return sleeve}return part;});return true;
 }catch(e){this.errors++;console.warn('Rig unavailable',name,e.message);return false}}
 part(c,s,i,x,y,w,h,angle=0,px=.5,py=0){if(!s?.[i])return;c.save();c.translate(x,y);c.rotate(angle);c.drawImage(s[i],-w*px,-h*py,w,h);c.restore()}
 segment(c,s,i,a,b,width,start=.12,end=.9){const length=Math.hypot(b.x-a.x,b.y-a.y);this.part(c,s,i,a.x,a.y,width,length/(end-start),Math.atan2(b.y-a.y,b.x-a.x)-Math.PI/2,.5,start)}
 joint(c,p,r,profile){const g=c.createRadialGradient(p.x-r*.25,p.y-r*.3,.1,p.x,p.y,r);g.addColorStop(0,profile.metal);g.addColorStop(.5,profile.dark);g.addColorStop(1,profile.dark);c.fillStyle=g;c.beginPath();c.arc(p.x,p.y,r,0,Math.PI*2);c.fill()}
 // Continuous head/neck/chest skin, bent in overlapping strips only below the neck.
 core(c,image,p,hero){const shoulderV=[.48,.48,.46,.46][hero],hipV=.91,H=28/(hipV-shoulderV),W=[29,28,35,29][hero],strips=64;for(let i=0;i<strips;i++){const v=i/strips,dy=(v-shoulderV)*H,a=dy>0?p.lean:0;c.save();c.translate(p.shoulder.x-Math.sin(a)*dy,p.shoulder.y+Math.cos(a)*dy);c.transform(1,0,-Math.sin(a),Math.cos(a),0,0);c.drawImage(image,0,v*image.height,image.width,image.height/strips+.6,-W/2,0,W,H/strips+.16);c.restore()}}
 weaponDraw(c,id,x,y,angle=0,phase=0){const index=['sword','sabre','bow','hammer','moonblade','royalbow'].indexOf(id),p=this.sheets.weapons?.[Math.max(0,index)];if(!p)return;const bow=id.includes('bow'),height=id==='hammer'?54:bow?47:id==='moonblade'?51:43,width=height*p.width/p.height;c.save();c.translate(x,y);c.rotate(angle);c.drawImage(p,-width*.5,-height*(bow?.5:.84),width,height);if(bow&&phase>0&&phase<.54){const pull=bowDrawAmount(phase)*10;c.strokeStyle='#e4d9b7';c.lineWidth=.5;c.beginPath();c.moveTo(width*.24,-height*.46);c.lineTo(-pull,0);c.lineTo(width*.24,height*.46);c.stroke();c.fillStyle='#d6c5a2';c.fillRect(-pull,-.4,29+pull,.8)}c.restore()}
 draw(c,x,y,hero,dir,action,time,phase=0,motion=null){const profile=BODY_PROFILES[hero],s=profile&&this.sheets[profile.name];if(!s||!this.sheets.weapons||(hero<4&&!this.sheets.cores))return false;const m=motion||this.motion;
  let pose=rigPose({action,time,phase,stride:m.stride??time*(action==='walk'?4:7),speed:m.speed??(action==='run'?245:action==='walk'?110:0),weapon:this.weapon,interact:action==='interact'?1-(m.interaction||.25)/.5:0,widthScale:profile.body/27});
  const states=this.states.get(c)||new Map();this.states.set(c,states);const key=hero+':'+(m.id||'single'),old=m.snap?null:states.get(key),dt=old?Math.min(.1,Math.max(0,time-old.time)):.1;
  pose=blendRigPose(old?.pose,pose,old?1-Math.exp(-dt*25):1);states.set(key,{time,pose});const p=pose;
  c.save();c.translate(x,y);c.scale(dir*profile.scale,profile.scale);if(!m.hideShadow&&action!=='jump'){c.fillStyle='#07101b44';c.beginPath();c.ellipse(0,1,17,2.5,0,0,7);c.fill();}
  this.part(c,s,8,p.hip.x-4,p.hip.y-3,34,hero===3?14:10,p.tail,1,.5);
  const capeRoot={x:p.shoulder.x-4,y:p.shoulder.y-2};this.segment(c,s,7,capeRoot,p.capeEnd,29,.05,.98);
  const leg=(i,back)=>{const l=p.legs[i];c.save();if(back)c.filter='brightness(.68)';this.joint(c,l.joint,3.4*profile.limb,profile);this.joint(c,l.end,3.2*profile.limb,profile);this.segment(c,s,5,l.joint,l.end,8.2*profile.limb,.12,.95);this.segment(c,s,4,l.root,l.joint,10.5*profile.limb,.08,.9);this.part(c,s,6,l.end.x,l.end.y+7,14*profile.limb,12,0,.31,1);c.restore()};
  const arm=(i,back)=>{const a=p.arms[i];c.save();if(back)c.filter='brightness(.72)';this.joint(c,a.root,4.4*profile.limb,profile);this.joint(c,a.joint,3.6*profile.limb,profile);this.segment(c,s,2,a.root,a.joint,9.4*profile.limb,.13,.91);this.segment(c,s,3,a.joint,a.end,7.4*profile.limb,.1,.88);c.restore()};
  leg(0,true);arm(0,true);leg(1,false);
  if(hero<4)this.core(c,this.sheets.cores[hero],p,hero);else this.segment(c,s,1,p.shoulder,p.hip,profile.body,.12,.9);
  if(this.gear.body){c.save();c.translate(p.shoulder.x,p.shoulder.y);c.rotate(p.lean);c.strokeStyle=this.gear.body==='ironcoat'?'#b8c5ce':this.gear.body==='royalcloak'?'#cfad70':'#8e77ae';c.lineWidth=2;c.beginPath();c.moveTo(-7,5);c.lineTo(-6,20);c.lineTo(6,20);c.stroke();c.restore()}
  if(hero>=4)this.part(c,s,0,p.neck.x,p.neck.y-5,profile.head,profile.headH,Math.sin(time*1.8)*.008+p.lean*.04,.5,.8);
  const grip=p.hands[1];if(action!=='interact'&&!m.hideWeapon)this.weaponDraw(c,this.weapon,grip.x,grip.y,p.weaponAngle,action==='attack'?phase:0);arm(1,false);
  if(this.gear.boots){c.strokeStyle='#d4bc86';c.lineWidth=1.2;for(const l of p.legs){c.beginPath();c.moveTo(l.end.x-3,l.end.y-2);c.lineTo(l.end.x+4,l.end.y-2);c.stroke()}}
  if(this.gear.charm){c.fillStyle=this.gear.charm==='predatorfang'?'#e6d8b8':'#88d2d8';c.beginPath();c.arc(p.shoulder.x+1,p.shoulder.y+9,1.6,0,7);c.fill()}
  c.restore();return true;
 }
}
