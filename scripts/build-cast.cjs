/* Offline production build: characters are never disassembled or warped.
 * Equipment and its hand occlusion are baked into complete frames here.
 * The browser receives one image per pose, including both arms and weapon. */
const fs=require('node:fs'),path=require('node:path');
const {weaponAngle}=require('./weapon-pose.cjs');
let sharp;try{sharp=require('sharp')}catch{sharp=require(path.resolve(path.dirname(process.execPath),'../node_modules/sharp'))}
const root=path.resolve(__dirname,'..'),dir=path.join(root,'assets/cast-v1'),registration=JSON.parse(fs.readFileSync(path.join(root,'art/production/registration.json'),'utf8'));
const heroes=['misty','cody','hector','teddy'],weapons=['sword','sabre','bow','hammer','moonblade','royalbow'];
const manifest={schema:1,rendering:'whole-character-frames',version:'1.0.0',actors:{}};
const SW=640,SH=448,RX=320,RY=414;
const blank=(w,h)=>sharp({create:{width:w,height:h,channels:4,background:{r:0,g:0,b:0,alpha:0}}});
const sources=new Map();
async function cell(key,index,cols=4,rows=2){
 if(!sources.has(key))sources.set(key,await sharp(path.join(dir,key+'-source.png')).ensureAlpha().raw().toBuffer({resolveWithObject:true}));
 const {data,info}=sources.get(key),x=Math.round(index%cols*info.width/cols),y=Math.round(Math.floor(index/cols)*info.height/rows),w=Math.round((index%cols+1)*info.width/cols)-x,h=Math.round((Math.floor(index/cols)+1)*info.height/rows)-y;
 const buf=Buffer.alloc(w*h*4);let minX=w,minY=h,maxX=0,maxY=0,count=0;
 for(let yy=0;yy<h;yy++)for(let xx=0;xx<w;xx++){const from=((y+yy)*info.width+x+xx)*4,to=(yy*w+xx)*4,a=data[from+3];if(a<18)continue;data.copy(buf,to,from,from+4);if(a>100){minX=Math.min(minX,xx);minY=Math.min(minY,yy);maxX=Math.max(maxX,xx);maxY=Math.max(maxY,yy);count++}}
 if(count<300)throw Error('Empty source cell '+key+'/'+index);
 const {isolateFrame}=await import('../src/atlas.js'),component=isolateFrame(buf,w,{x:0,y:0,w,h});if(!component)throw Error('No connected character '+key+'/'+index);
 for(let yy=0;yy<h;yy++)for(let xx=0;xx<w;xx++){const at=yy*w+xx;if(component.selected.has(component.labels[at]))continue;let edge=false;if(buf[at*4+3]<100)for(let dy=-2;dy<=2&&!edge;dy++)for(let dx=-2;dx<=2;dx++){const x=xx+dx,y=yy+dy;if(x>=0&&x<w&&y>=0&&y<h&&component.selected.has(component.labels[y*w+x])){edge=true;break}}if(!edge)buf.fill(0,at*4,at*4+4)}
 return{key,index,w,h,buf,bounds:component,mark:registration[key]?.[index]||{}};
}
async function normalized(src,height,air=false,detail=1,groundAt=null){
 const stageW=SW*detail,stageH=SH*detail,rx=RX*detail,ry=RY*detail;
 const b=src.bounds,s=300*detail/height,rootX=src.mark.root?.[0]??(b.minX+b.maxX)/2,ground=groundAt??(air?b.minY+height:b.maxY+1);
 const w=Math.round(src.w*s),h=Math.round(src.h*s),left=Math.round(rx-rootX*s),top=Math.round(ry-ground*s);
 const resized=await sharp(src.buf,{raw:{width:src.w,height:src.h,channels:4}}).resize(w,h).png().toBuffer();
 // Clip only empty staging margins. All visible pixels must remain inside.
 const dl=Math.max(0,left),dt=Math.max(0,top),sl=Math.max(0,-left),st=Math.max(0,-top),cw=Math.min(w-sl,stageW-dl),ch=Math.min(h-st,stageH-dt);
 if((left+b.minX*s)<1||(left+b.maxX*s)>stageW-2||(top+b.minY*s)<1||(top+b.maxY*s)>stageH-2)throw Error('Character staging clips '+src.key+'/'+src.index+' '+JSON.stringify({left,top,b,s,rootX,ground}));
 const img=await blank(stageW,stageH).composite([{input:await sharp(resized).extract({left:sl,top:st,width:cw,height:ch}).png().toBuffer(),left:dl,top:dt}]).png().toBuffer();
 const point=p=>p?[left+p[0]*s,top+p[1]*s]:null;
 return{img,grip:point(src.mark.grip),offhand:point(src.mark.offhand),scale:s,detail};
}
const equipment={};
async function loadEquipment(){for(let i=0;i<6;i++){const src=await cell('weapons',i,3,2),b=src.bounds,png=await sharp(src.buf,{raw:{width:src.w,height:src.h,channels:4}}).extract({left:b.minX,top:b.minY,width:b.maxX-b.minX+1,height:b.height}).png().toBuffer();equipment[weapons[i]]={png,w:b.maxX-b.minX+1,h:b.height}}}
async function equipped(base,weapon,index){
 if(index===14)return base.img;if(!base.grip)throw Error('Missing weapon grip '+weapon+'/'+index);
 const detail=base.detail||1,width=SW*detail,height=SH*detail;
 const e=equipment[weapon],bow=weapon.includes('bow'),logical=[38,39,44,47,43,46][weapons.indexOf(weapon)],h=logical*300/96*detail,w=h*e.w/e.h;
 const handle=bow?[w*.72,h*.5]:[w*.5,h*.86];
 // A readied carry: blades point forward/up; heavy heads stay below the face.
 const gripForward=(base.grip[0]-RX*detail)/detail;
 const angle=weaponAngle(weapon,index,gripForward);
 const [gx,gy]=base.grip,rad=angle*Math.PI/180,co=Math.cos(rad),si=Math.sin(rad);
 const weaponPoint=(x,y)=>[gx+(x-handle[0])*co-(y-handle[1])*si,gy+(x-handle[0])*si+(y-handle[1])*co];
 let string='';if(bow){const a=weaponPoint(w*.1,3),b=weaponPoint(w*.24,h-3),p=index===20&&base.offhand?base.offhand:weaponPoint(w*.24,h*.5);string=`<path d="M${a} L${p} L${b}" fill="none" stroke="#dacbaf" stroke-width="1.6"/>`;if(index===20)string+=`<path d="M${p} L${gx+w*.9},${p[1]}" stroke="#d9d1b6" stroke-width="2"/>`}
 const svg=Buffer.from(`<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg"><g transform="translate(${gx} ${gy}) rotate(${angle}) translate(${-handle[0]} ${-handle[1]})"><image href="data:image/png;base64,${e.png.toString('base64')}" width="${w}" height="${h}"/></g>${string}</svg>`);
 const layers=[{input:svg,left:0,top:0}];
 // Restore the original glove pixels at the same coordinates, never move a limb.
 const radius=9*detail;for(const p of [base.grip,...(index===22||index===23?[base.offhand]:[])].filter(Boolean)){const left=Math.max(0,Math.round(p[0]-radius)),top=Math.max(0,Math.round(p[1]-radius));layers.push({input:await sharp(base.img).extract({left,top,width:radius*2,height:radius*2}).png().toBuffer(),left,top})}
 return sharp(base.img).composite(layers).png().toBuffer();
}
async function boundsOf(img){const {data,info}=await sharp(img).ensureAlpha().raw().toBuffer({resolveWithObject:true});let minX=info.width,minY=info.height,maxX=-1,maxY=-1;for(let y=0;y<info.height;y++)for(let x=0;x<info.width;x++)if(data[(y*info.width+x)*4+3]>18){minX=Math.min(minX,x);minY=Math.min(minY,y);maxX=Math.max(maxX,x);maxY=Math.max(maxY,y)}return{minX,minY,maxX,maxY}}
async function packActor(id,variants,logicalHeight){
 const count=Object.values(variants)[0].length,boxes=[];for(let i=0;i<count;i++){const bb=await Promise.all(Object.values(variants).map(v=>boundsOf(v[i])));if(bb.some(b=>b.minX<2||b.minY<2||b.maxX>SW-3||b.maxY>SH-3))throw Error('Equipment clips staging '+id+'/'+i);boxes.push({minX:Math.min(...bb.map(b=>b.minX)),minY:Math.min(...bb.map(b=>b.minY)),maxX:Math.max(...bb.map(b=>b.maxX)),maxY:Math.max(...bb.map(b=>b.maxY))})}
 let x=2,y=2,rowH=0;const frames=boxes.map(b=>{const w=b.maxX-b.minX+1,h=b.maxY-b.minY+1;if(x+w+2>2048){x=2;y+=rowH+4;rowH=0}const f={rect:[x,y,w,h],pivot:[RX-b.minX,RY-b.minY]};x+=w+4;rowH=Math.max(rowH,h);return f}),height=y+rowH+2,pages={};
 for(const [v,images]of Object.entries(variants)){const composite=[];for(let i=0;i<count;i++){const b=boxes[i],f=frames[i];composite.push({input:await sharp(images[i]).extract({left:b.minX,top:b.minY,width:f.rect[2],height:f.rect[3]}).png().toBuffer(),left:f.rect[0],top:f.rect[1]})}const url=id+'-'+v+'.webp';await blank(2048,height).composite(composite).webp({quality:92,alphaQuality:100,effort:5}).toFile(path.join(dir,url));pages[v]={url,width:2048,height}}
 const first=Object.keys(variants)[0];manifest.actors[id]={scale:logicalHeight/300,frames,pages,poster:{url:pages[first].url,frame:frames[0],scale:logicalHeight/300}};
}
async function main(){await loadEquipment();for(let hi=0;hi<heroes.length;hi++){const id=heroes[hi],idle=await cell(id+'-actions',0),height=idle.bounds.height,base=[],raw=[];for(let i=0;i<32;i++){const src=i>=28?await cell(id+'-run',(i-28)*2+1):i>=16&&i<20?await cell(id+'-run',(i-16)*2):i<8?await cell(id+'-walk',i):i<16?await cell(id+'-actions',i-8):i<24?await cell(id+'-special',i-16):await cell('crouch',hi*4+i-24,4,4);raw.push(src)}const baseline=indices=>Math.max(...indices.map(i=>raw[i].bounds.maxY))+1,walkGround=baseline([0,1,2,3,4,5,6,7]),runGround=baseline([16,28,17,29,18,30,19,31]),lowGround=baseline([24,25,26,27]);for(let i=0;i<32;i++)base.push(await normalized(raw[i],height,i===13,1,i<8?walkGround:i>=16&&i<20||i>=28?runGround:i>=24&&i<28?lowGround:null));const variants={};for(const w of weapons){variants[w]=[];for(let i=0;i<32;i++)variants[w].push(await equipped(base[i],w,i))}await packActor(id,variants,[80,78,90,70][hi]);
 const poster=await cell('posters',hi,2,2),pb=await normalized(poster,poster.bounds.height,false,2),a=manifest.actors[id],posters={};for(const w of weapons){const img=await equipped(pb,w,8),b=await boundsOf(img),url=id+'-portrait-'+w+'.webp',width=b.maxX-b.minX+1,height=b.maxY-b.minY+1;await sharp(img).extract({left:b.minX,top:b.minY,width,height}).webp({quality:95,alphaQuality:100}).toFile(path.join(dir,url));posters[w]=url;a.poster.frame={rect:[0,0,width,height],pivot:[RX*2-b.minX,RY*2-b.minY]}}a.poster.url=posters.sword;a.poster.variants=posters;
 // All portraits share union bounds so each weapon uses the same registration.
 const posed=await Promise.all(weapons.map(w=>equipped(pb,w,8))),bb=await Promise.all(posed.map(boundsOf)),b={minX:Math.min(...bb.map(b=>b.minX)),minY:Math.min(...bb.map(b=>b.minY)),maxX:Math.max(...bb.map(b=>b.maxX)),maxY:Math.max(...bb.map(b=>b.maxY))},width=b.maxX-b.minX+1,ph=b.maxY-b.minY+1;for(let i=0;i<6;i++)await sharp(posed[i]).extract({left:b.minX,top:b.minY,width,height:ph}).webp({quality:95,alphaQuality:100}).toFile(path.join(dir,posters[weapons[i]]));a.poster.frame={rect:[0,0,width,ph],pivot:[RX*2-b.minX,RY*2-b.minY]};a.poster.scale=a.scale/2;console.log('Built '+id)}
 const groups=[['enemies-a',['rat','raider','archer','guard'],[66,72,70,82]],['enemies-b',['automaton','specter','thorn'],[84,82,64]],['enemies-c',['hound','moth','sentinel'],[60,60,64]],['court',['bogdalina','ori'],[138,82]]];for(const [key,ids,sizes]of groups){const cols=key==='court'?4:5;for(let row=0;row<ids.length;row++){const idle=await cell(key,row*cols,cols,ids.length),list=[];for(let f=0;f<cols;f++)list.push((await normalized(await cell(key,row*cols+f,cols,ids.length),idle.bounds.height)).img);await packActor(ids[row],{default:list},sizes[row]);console.log('Built '+ids[row])}}
 fs.writeFileSync(path.join(dir,'manifest.json'),JSON.stringify(manifest,null,2)+'\n');console.log('Complete cast: '+Object.keys(manifest.actors).length);
}
main().catch(e=>{console.error(e);process.exitCode=1});
