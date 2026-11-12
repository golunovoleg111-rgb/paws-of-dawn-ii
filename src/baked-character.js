// Every frame is a complete Blender render, including the held weapon.
// There is deliberately no limb positioning, joint painting or texture warping here.
export function bakedFrame(clip,action,time,phase=0,motion={}){
 const loop=action==='walk'||action==='run'||action==='crouch';
 if(loop){if(action==='crouch'&&!(motion.speed>3))return 0;const stride=motion.stride??time*(action==='walk'?4:7);return Math.floor(((stride/(Math.PI*2))%1+1)%1*clip.count)}
 if(action==='attack'||action==='interact'||action==='jump')return Math.min(clip.count-1,Math.max(0,Math.floor(phase*clip.count)));
 return Math.floor(Math.max(0,time)*clip.fps)%clip.count;
}
export class BakedMisty{
 constructor({inspection=false}={}){this.inspection=inspection;this.sheets={};this.loading={};this.order=[];this.failed=new Set();this.errors=0;this.ready=false;this.pending=this.load()}
 async load(){try{const response=await fetch(new URL('../assets/characters/misty-baked/manifest.json',import.meta.url));if(!response.ok)throw Error('Misty manifest unavailable');this.manifest=await response.json();if(!await this.requestWeapon('sword'))throw Error('Misty image unavailable');this.ready=true;return true}catch(e){this.errors++;console.warn('Baked Misty unavailable',e.message);return false}}
 async requestWeapon(weapon){if(this.sheets[weapon])return true;if(this.loading[weapon])return this.loading[weapon];if(!this.manifest||this.failed.has(weapon))return false;
  this.loading[weapon]=(async()=>{const image=new Image();image.src=new URL('../assets/characters/misty-baked/'+weapon+'.webp',import.meta.url).href;await image.decode();this.sheets[weapon]=image;this.order.push(weapon);while(this.order.length>2){const old=this.order.shift();delete this.sheets[old]}return true})().catch(e=>{this.errors++;this.failed.add(weapon);console.warn('Misty equipment unavailable',weapon,e.message);return false}).finally(()=>delete this.loading[weapon]);return this.loading[weapon];
 }
 draw(c,x,y,dir,action,time,phase=0,weapon='sword',motion={}){
  if(!this.ready)return false;if(!this.sheets[weapon]){this.requestWeapon(weapon);return false}
  const m=this.manifest,key=weapon+'-'+action,clip=m.clips[key]||m.clips[weapon+'-idle'];if(!clip)return false;
  const index=bakedFrame(clip,action,time,phase,motion),cell=clip.start+index,scale=m.scale;
  if(this.inspection&&weapon==='sword'&&action==='walk'&&!this.inspectionLoading){this.inspectionLoading=true;const image=new Image();image.src=new URL('../assets/characters/misty-baked/walk-preview.webp',import.meta.url).href;image.decode().then(()=>this.inspectionSheet=image).catch(()=>{})}
  const large=weapon==='sword'&&action==='walk'&&this.inspectionSheet,image=large||this.sheets[weapon],sw=large?512:m.width,sh=large?640:m.height,frame=large?index:cell,sx=frame%m.columns*sw,sy=Math.floor(frame/m.columns)*sh;
  c.save();c.translate(x,y);c.scale(dir,1);c.imageSmoothingEnabled=true;
  c.drawImage(image,sx,sy,sw,sh,-m.pivot[0]*scale,-m.pivot[1]*scale,m.width*scale,m.height*scale);
  c.restore();return true;
 }
}
