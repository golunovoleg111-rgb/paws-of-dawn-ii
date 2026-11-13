const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
export const CAMERA_ZOOM=1.85;
export function cameraTarget(p,world){const width=1280/CAMERA_ZOOM,height=720/CAMERA_ZOOM;return{x:clamp(p.x+15-width*.43+p.dir*45,0,Math.max(0,world.width-width)),y:clamp(p.y+p.h-height*.72,0,Math.max(0,world.height-height)),zoom:CAMERA_ZOOM,width,height}}
export function strikePhase(id){return id.includes('bow')?.42:id==='hammer'?.6:id==='sabre'?.5:.56}
export function weaponTiming(id){return id==='hammer'?.76:id.includes('bow')?.58:id==='sabre'?.25:id==='moonblade'?.31:.38}
export function strideAmplitude(speed=110,crouch=false){return crouch?12:speed>150?30:20}
export function strideAdvance(distance,speed=110,crouch=false){return Math.abs(distance)*Math.PI*2/(crouch?40:speed>150?100:66)}
