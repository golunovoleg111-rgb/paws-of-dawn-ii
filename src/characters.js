import{HERO_IDS,ENEMY_IDS,ACTOR_IDS,heroFrame,enemyFrame,validateCast}from'./character-animation.js?v=070';

// The runtime draws a complete registered frame. There is no joint geometry,
// body-part assembly, substitute character or alternative rendering path.
export class CharacterLibrary{
 constructor({fetcher=globalThis.fetch.bind(globalThis),imageFactory=()=>new Image()}={}){this.fetcher=fetcher;this.imageFactory=imageFactory;this.images=new Map();this.loading=new Map();this.errors=new Map();this.manifest=null;this.weapon='sword';this.gear={};this.motion={};this.enemyMotion={};this.ready=this.load();}
 async load(){try{const r=await this.fetcher(new URL('../assets/cast-v1/manifest.json',import.meta.url));if(!r.ok)throw Error('Не удалось загрузить персонажей');this.manifest=validateCast(await r.json());await this.ensurePosters();return true}catch(e){console.error('Character library:',e);this.errors.set('library',e.message);return false}}
 async image(url){if(this.images.has(url))return this.images.get(url);if(this.loading.has(url))return this.loading.get(url);if(this.errors.has(url))throw Error(this.errors.get(url));
  const task=(async()=>{const image=this.imageFactory();image.src=new URL('../assets/cast-v1/'+url,import.meta.url).href;await image.decode();if(!image.naturalWidth)throw Error('Пустое изображение персонажа');this.images.set(url,image);return image})().catch(e=>{this.errors.set(url,e.message);throw e}).finally(()=>this.loading.delete(url));this.loading.set(url,task);return task;
 }
 async ensurePosters(weapon='sword'){if(!this.manifest)return;await Promise.all(ACTOR_IDS.map(id=>{const a=this.manifest.actors[id];return this.image(a.poster.variants?.[weapon]||a.poster.url)}))}
 async ensureActors(ids,weapon=this.weapon){if(!this.manifest)await this.ready;if(!this.manifest)throw Error('Персонажи ещё не подготовлены');const urls=[...new Set(ids)].map(id=>{const a=this.manifest.actors[id];if(!a)throw Error('Неизвестный персонаж '+id);return a.pages[HERO_IDS.includes(id)?weapon:'default'].url});this.pinned=new Set(urls);await Promise.all(urls.map(url=>this.image(url)));this.trim()}
 trim(){const protectedUrls=new Set(this.pinned);for(const a of Object.values(this.manifest.actors))for(const url of [a.poster.url,...Object.values(a.poster.variants||{})])if(this.images.has(url))protectedUrls.add(url);let bytes=[...this.images.values()].reduce((n,i)=>n+i.naturalWidth*i.naturalHeight*4,0);for(const [url,i]of this.images){if(bytes<=224*1024*1024)break;if(protectedUrls.has(url))continue;bytes-=i.naturalWidth*i.naturalHeight*4;this.images.delete(url)}}
 async ensureChapter(game){await this.ensureActors([...HERO_IDS,'ori','bogdalina',...game.world.objects.filter(o=>o.type==='cage').map(o=>HERO_IDS[o.hero]),...game.world.enemies.map(e=>e.type),...(game.run.chapter===9?['hound','specter']:[])],game.save.weapon)}
 status(){const ready=this.manifest?ACTOR_IDS.filter(id=>this.images.has(this.manifest.actors[id].poster.url)).length:0;return{ready,total:ACTOR_IDS.length,errors:this.errors.size,message:[...this.errors.values()][0]||''}}
 async retry(){await Promise.allSettled([...this.loading.values()]);this.errors.clear();this.ready=this.load();if(!await this.ready)throw Error('Не удалось загрузить персонажей');return true}
 setMotion(m){this.motion=m||{}}setEnemyMotion(m){this.enemyMotion=m||{}}setGear(g){this.gear=g||{}}setWeapon(w){this.weapon=w}
 frame(c,x,y,id,dir,index,{poster=false,weapon=this.weapon}={}){
  const actor=this.manifest?.actors[id];if(!actor)return false;
  const page=poster?actor.poster:actor.pages[HERO_IDS.includes(id)?weapon:'default'];const url=poster&&actor.poster.variants?.[weapon]?actor.poster.variants[weapon]:page?.url;if(!url)return false;
  const image=this.images.get(url);if(!image){this.image(url).catch(()=>{});return false}
  const f=poster?actor.poster.frame:actor.frames[index];if(!f)return false;
  c.save();c.translate(x,y);c.scale(dir,1);const scale=poster?actor.poster.scale:actor.scale;
  c.drawImage(image,...f.rect,-f.pivot[0]*scale,-f.pivot[1]*scale,f.rect[2]*scale,f.rect[3]*scale);c.restore();return true;
 }
 hero(c,x,y,hero,dir,action,time,progress=0){let p=progress;if(action==='interact'&&this.motion.interaction>0)p=1-this.motion.interaction/.5;return this.frame(c,x,y,HERO_IDS[hero],dir,heroFrame(action,time,p,this.weapon,this.motion))}
 enemy(c,x,y,type,dir,time,state){const frame=type==='bogdalina'?(state==='windup'?1:state==='attack'?2:state==='rage'?3:0):enemyFrame(state,time);return this.frame(c,x,y,type,dir,frame)}
 owl(c,x,y,time,pose='idle'){return this.frame(c,x,y,'ori',1,pose==='speak'?2:Math.floor(time*1.2)%7===6?1:0)}
 portrait(c,x,y,w,h,hero){const a=this.manifest?.actors[HERO_IDS[hero]],im=a&&this.images.get(a.poster.url);if(!im)return false;const f=a.poster.frame,size=Math.min(f.rect[2],f.rect[3]*.38),cx=f.pivot[0]+f.rect[3]*.08,sx=Math.max(0,Math.min(f.rect[2]-size,cx-size/2));c.drawImage(im,sx,0,size,size,x,y,w,h);return true}
 preview(c,x,y,id,time,action='idle'){
  const actor=ACTOR_IDS[id];if(action==='idle')return this.frame(c,x,y,actor,1,0,{poster:true});
  if(id<4)return this.frame(c,x,y,actor,1,heroFrame(action,time,time%1,this.weapon,{speed:40,stride:time*9}));
  if(id===4)return this.enemy(c,x,y,'bogdalina',1,time,action==='attack'?(time%1<.35?'windup':'attack'):'idle');
  if(id===5)return this.owl(c,x,y,time,'speak');
  return this.enemy(c,x,y,actor,1,time,action==='attack'?(time%1<.35?'windup':'attack'):action==='walk'?'patrol':action==='run'?'chase':'idle');
 }
 previewBounds(id,action='idle'){
  const a=this.manifest?.actors[ACTOR_IDS[id]];if(!a)return null;const scale=action==='idle'?a.poster.scale:a.scale;
  const indices=id<4?({walk:[0,1,2,3,4,5,6,7],run:[16,28,17,29,18,30,19,31],jump:[13],crouch:[12,24,25,26,27],interact:[14],attack:this.weapon.includes('bow')?[20,21]:this.weapon==='hammer'?[22,23]:[9,10,11]}[action]||[8]):id===4?action==='attack'?[1,2]:[0]:id===5?[0,1,2]:action==='attack'?[3,4]:action==='walk'||action==='run'?[1,2]:[0];
  const frames=action==='idle'?[a.poster.frame]:indices.map(i=>a.frames[i]).filter(Boolean);
  return{minX:Math.min(...frames.map(f=>-f.pivot[0]*scale)),maxX:Math.max(...frames.map(f=>(f.rect[2]-f.pivot[0])*scale)),minY:Math.min(-a.scale*300,...frames.map(f=>-f.pivot[1]*scale)),maxY:Math.max(0,...frames.map(f=>(f.rect[3]-f.pivot[1])*scale))};
 }
 fitPreview(c,width,height,id,time,action='idle',padding=14){const b=this.previewBounds(id,action);if(!b)return false;const s=Math.min((width-padding*2)/(b.maxX-b.minX),(height-padding*2)/(b.maxY-b.minY));c.save();c.translate(width/2-(b.minX+b.maxX)*s/2,height-padding-b.maxY*s);c.scale(s,s);const ok=this.preview(c,0,0,id,time,action);c.restore();return ok}
}
export function createCharacterLibrary(options){return new CharacterLibrary(options)}
