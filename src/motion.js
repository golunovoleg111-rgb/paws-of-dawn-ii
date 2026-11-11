const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
export const CAMERA_ZOOM=1.34;
export function cameraTarget(p,world){const width=1280/CAMERA_ZOOM,height=720/CAMERA_ZOOM;return{x:clamp(p.x+15-width*.43+p.dir*45,0,Math.max(0,world.width-width)),y:clamp(p.y+p.h-height*.72,0,Math.max(0,world.height-height)),zoom:CAMERA_ZOOM,width,height}}
export function twoBone(root,end,a,b,bend=1){let dx=end.x-root.x,dy=end.y-root.y,d=Math.hypot(dx,dy)||.001;const r=clamp(d,Math.abs(a-b)+.01,a+b-.01),along=(a*a-b*b+r*r)/(2*r),off=Math.sqrt(Math.max(0,a*a-along*along));dx/=d;dy/=d;return{x:root.x+dx*along-dy*off*bend,y:root.y+dy*along+dx*off*bend}}
export function strikePhase(id){return id.includes('bow')?.42:id==='hammer'?.6:id==='sabre'?.5:.56}
export function bowDrawAmount(phase){if(phase>=.42)return Math.max(0,1-(phase-.42)/.08);const t=Math.max(0,phase/.42);return t*t*(3-2*t)}
export function weaponTiming(id){return id==='hammer'?.76:id.includes('bow')?.58:id==='sabre'?.25:id==='moonblade'?.31:.38}
export function rigPose({action='idle',time=0,phase=0,stride=time*8,speed=0,weapon='sword',interact=0}={}){
 const run=action==='run'||action==='walk',crouch=action==='crouch',air=action==='jump',attack=action==='attack',hammer=weapon==='hammer',bow=weapon.includes('bow');
 const cycle=stride,amount=run?clamp(speed?speed/245:1,.2,1.2):crouch&&speed>3?.3:0,bob=amount*Math.cos(cycle*2)*1.3,hip={x:0,y:(crouch?-17:-36)+bob};
 let feet=[{x:-5,y:0},{x:7,y:0}];if(amount)feet=[0,Math.PI].map(a=>({x:Math.cos(cycle+a)*18*amount,y:-Math.max(0,Math.sin(cycle+a))*12*amount}));if(air)feet=[{x:-12,y:-8},{x:16,y:-16}];if(crouch)feet=[{x:-15+Math.cos(cycle)*5*amount,y:-Math.max(0,Math.sin(cycle))*4*amount},{x:18-Math.cos(cycle)*5*amount,y:-Math.max(0,-Math.sin(cycle))*4*amount}];
 const lean=(run?amount*.11:0)+(crouch?.68:0),shoulder=crouch?{x:14,y:-29}:{x:lean*25,y:hip.y-25},head=crouch?{x:22,y:-39}:{x:shoulder.x+2,y:shoulder.y-13};
 let hands=[{x:-7-Math.cos(cycle)*11*amount,y:shoulder.y+24},{x:9+Math.cos(cycle)*11*amount,y:shoulder.y+24}],weaponAngle=.22;
 if(air)hands=[{x:-18,y:shoulder.y+8},{x:19,y:shoulder.y+3}];
 if(crouch)hands=[{x:8,y:shoulder.y+20},{x:26,y:shoulder.y+13}];
 if(attack){const wind=phase<.36?phase/.36:1,release=clamp((phase-.36)/.32,0,1),recover=clamp((phase-.68)/.32,0,1),ease=release*release*(3-2*release);if(bow){hands=[{x:28,y:shoulder.y+3},{x:14-17*bowDrawAmount(phase),y:shoulder.y+3}];weaponAngle=0}else{const arc=-2.3*wind+4.2*ease-1.9*recover;hands[1]={x:7+Math.sin(arc)*24,y:shoulder.y+10+Math.cos(arc)*22};weaponAngle=arc+.3;if(hammer)hands[0]={x:hands[1].x-5,y:hands[1].y-6}}}
 if(action==='interact'||interact>0){const reach=Math.sin(Math.PI*clamp(interact||phase,0,1));hands=[{x:15+reach*11,y:shoulder.y+12},{x:20+reach*10,y:shoulder.y+6}];weaponAngle=.6}
 return{hip,shoulder,head,feet,hands,lean,weaponAngle,bow,attack,phase,cloth:Math.sin(time*3.2)*.12+amount*.3,tail:Math.sin(time*2.7)*.13-amount*.15};
}
