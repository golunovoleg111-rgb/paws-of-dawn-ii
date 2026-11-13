export const HERO_IDS=['misty','cody','hector','teddy'];
export const ENEMY_IDS=['rat','raider','archer','guard','automaton','specter','thorn','hound','moth','sentinel'];
export const ACTOR_IDS=[...HERO_IDS,'bogdalina','ori',...ENEMY_IDS];
export const WEAPON_IDS=['sword','sabre','bow','hammer','moonblade','royalbow'];
const phase=t=>((t%1)+1)%1;
export function heroFrame(action,time,progress,weapon,motion={}){
 const stride=phase((motion.stride??time*7)/(Math.PI*2));
 if(action==='walk')return Math.floor(stride*8);
 if(action==='run')return [16,28,17,29,18,30,19,31][Math.floor(stride*8)];
 if(action==='crouch')return motion.speed>3?24+Math.floor(stride*4):12;
 if(action==='jump')return 13;
 if(action==='interact')return 14;
 if(action==='hurt')return 15;
 if(action==='attack'){
  if(weapon.includes('bow'))return progress<.42?20:21;
  if(weapon==='hammer')return progress<.6?22:23;
  return progress<.33?9:progress<.65?10:11;
 }
 return 8;
}
export function enemyFrame(state,time){
 if(state==='windup')return 3;
 if(state==='attack')return 4;
 if(state==='recover'||state==='stun'||state==='rage')return 0;
 return state==='chase'||state==='patrol'||state==='search'?1+Math.floor(time*8)%2:0;
}
export function validateCast(manifest){
 if(manifest?.schema!==1||manifest.rendering!=='whole-character-frames')throw Error('Unsupported character library');
 for(const id of ACTOR_IDS){const a=manifest.actors?.[id];if(!a)throw Error('Missing character: '+id);
  if(!a.poster?.url||!a.frames?.length||!Number.isFinite(a.scale)||a.scale<=0)throw Error('Incomplete character: '+id);
  const expected=HERO_IDS.includes(id)?32:id==='bogdalina'||id==='ori'?4:5;
  if(a.frames.length!==expected)throw Error('Incomplete animation: '+id);
  for(const f of a.frames)if(![...f.rect,...f.pivot].every(Number.isFinite)||f.rect.length!==4||f.pivot.length!==2||f.rect[2]<=0||f.rect[3]<=0)throw Error('Invalid frame: '+id);
  if(HERO_IDS.includes(id))for(const w of WEAPON_IDS){if(!a.pages?.[w]?.url||!a.poster.variants?.[w])throw Error('Missing equipment: '+id+'/'+w)}
  else if(!a.pages?.default?.url)throw Error('Missing character texture: '+id);
 }
 return manifest;
}
