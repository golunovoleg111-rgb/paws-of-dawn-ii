/* Technical cutout packing only. The original painted source is preserved. */
const fs=require('node:fs'),path=require('node:path');
let sharp;try{sharp=require('sharp')}catch{sharp=require(path.resolve(path.dirname(process.execPath),'../node_modules/sharp'))}
const dir=path.resolve(__dirname,'../assets/town-v1');
const specs=[
 {id:'merchant',role:'two-storey merchant house and supported roof terrace',walkSourceY:136},
 {id:'workshop',role:'stone workshop and slate roof',walkSourceY:204},
 {id:'stairs',role:'supported masonry stair and retaining wall',highWalkSourceY:174,lowWalkSourceY:444},
 {id:'cart',role:'collapsed freight wagon with low crawlspace'},
 {id:'scaffold',role:'damaged chimney, hoist and falling rubble origin'},
 {id:'seal',role:'four-dial street gate lock on masonry pier'}
];
async function main(){
 const {isolateFrame}=await import('../src/atlas.js');
 const {data,info}=await sharp(path.join(dir,'source.png')).ensureAlpha().raw().toBuffer({resolveWithObject:true});
 if(info.width!==1536||info.height!==1024)throw Error('Town source must retain its approved 3 by 2 layout');
 const trapOnly=process.argv.includes('--trap-only'),dressingOnly=process.argv.includes('--dressing-only'),partial=trapOnly||dressingOnly,manifest=partial?JSON.parse(fs.readFileSync(path.join(dir,'manifest.json'),'utf8')):{schema:1,style:'painted-moonlit-fantasy',version:'1.0.0',source:{url:'source.png',columns:3,rows:2},assets:{}};
 if(!partial)for(let i=0;i<specs.length;i++){
  const spec=specs[i],standalone=fs.existsSync(path.join(dir,spec.id+'-source.png'));
  const input=standalone?await sharp(path.join(dir,spec.id+'-source.png')).ensureAlpha().raw().toBuffer({resolveWithObject:true}):{data,info};
  const sx=standalone?0:i%3*512,sy=standalone?0:Math.floor(i/3)*512,w=standalone?input.info.width:512,h=standalone?input.info.height:512,cell=Buffer.alloc(w*h*4);
  let clear=0;for(let y=0;y<h;y++)for(let x=0;x<w;x++){const from=((sy+y)*input.info.width+sx+x)*4,to=(y*w+x)*4;if(input.data[from+3]<20){clear++;continue}input.data.copy(cell,to,from,from+4)}
  if(clear<w*h*.15)throw Error('Opaque background in '+spec.id);
  const b=isolateFrame(cell,w,{x:0,y:0,w,h});if(!b)throw Error('Missing cutout '+spec.id);
  if(b.minX<4||b.minY<4||b.maxX>=w-4||b.maxY>=h-4)throw Error('Source silhouette clips the cell boundary: '+spec.id);
  for(let y=0;y<h;y++)for(let x=0;x<w;x++){const at=y*w+x;if(b.selected.has(b.labels[at]))continue;let edge=false;if(cell[at*4+3]<100)for(let dy=-2;dy<=2&&!edge;dy++)for(let dx=-2;dx<=2;dx++){const xx=x+dx,yy=y+dy;if(xx>=0&&xx<w&&yy>=0&&yy<h&&b.selected.has(b.labels[yy*w+xx])){edge=true;break}}if(!edge)cell.fill(0,at*4,at*4+4)}
  const pad=3,left=Math.max(0,b.minX-pad),top=Math.max(0,b.minY-pad),width=Math.min(w-left,b.maxX-left+pad+1),height=Math.min(h-top,b.maxY-top+pad+1);
  const url=spec.id+'.webp',png=await sharp(cell,{raw:{width:w,height:h,channels:4}}).extract({left,top,width,height}).png().toBuffer();
  await sharp(png).webp({quality:95,alphaQuality:100,effort:6}).toFile(path.join(dir,url));
  const entry={url,width,height,sourceUrl:standalone?spec.id+'-source.png':'source.png',sourceRect:[sx+left,sy+top,width,height],role:spec.role,padding:pad};
  if(spec.walkSourceY)entry.walk=(spec.walkSourceY-top)/height;
  if(spec.highWalkSourceY){entry.highWalk=(spec.highWalkSourceY-top)/height;entry.lowWalk=(spec.lowWalkSourceY-top)/height}
  if(spec.id==='scaffold')entry.hazardOriginX=.57;
  manifest.assets[spec.id]=entry;
  console.log(spec.id,width+'x'+height,'transparent '+(clear/w/h*100).toFixed(1)+'%');
 }
 if(!dressingOnly)await packBarricade(manifest,isolateFrame);
 await packDressing(manifest);
 // Painted grain for authored open stair treads, stringers and braces.
 await sharp(path.join(dir,'source.png')).extract({left:40,top:126,width:440,height:20}).webp({quality:95,alphaQuality:100}).toFile(path.join(dir,'timber.webp'));
 manifest.assets.timber={url:'timber.webp',width:440,height:20,sourceUrl:'source.png',sourceRect:[40,126,440,20],role:'painted timber surface for open stair structure',material:true};
 fs.writeFileSync(path.join(dir,'manifest.json'),JSON.stringify(manifest,null,2)+'\n');
}
async function packDressing(manifest){
 // These are deliberate connection parts: the lantern's timber attachment,
 // the merchant's real guild plaque, and a masonry plinth. Their edge cuts
 // are covered by joined architecture rather than presented as isolated art.
 const parts=[
  {id:'lantern-part',source:'scaffold-source.png',rect:[1020,480,190,280],role:'painted iron lantern and timber attachment'},
  {id:'guild-plaque',source:'source.png',rect:[438,270,64,97],role:'merchant guild scales plaque and hanging bracket'},
  {id:'stone-plinth',source:'source.png',rect:[1050,932,142,40],role:'masonry plinth beneath a timber street post'}
 ];
 for(const p of parts){const[x,y,w,h]=p.rect,url=p.id+'.webp';await sharp(path.join(dir,p.source)).extract({left:x,top:y,width:w,height:h}).webp({quality:95,alphaQuality:100}).toFile(path.join(dir,url));manifest.assets[p.id]={url,width:w,height:h,sourceUrl:p.source,sourceRect:p.rect,part:true,role:p.role};console.log(p.id,w+'x'+h)}
}
async function packBarricade(manifest,isolateFrame){
 const file='barricade-source.png',{data,info}=await sharp(path.join(dir,file)).ensureAlpha().raw().toBuffer({resolveWithObject:true});
 for(let i=0;i<2;i++){const id=i?'barricade-retracted':'barricade-extended',sx=Math.round(i*info.width/2),w=Math.round((i+1)*info.width/2)-sx,h=info.height,cell=Buffer.alloc(w*h*4);let clear=0;
  for(let y=0;y<h;y++)for(let x=0;x<w;x++){const from=(y*info.width+sx+x)*4,to=(y*w+x)*4;if(data[from+3]<20){clear++;continue}data.copy(cell,to,from,from+4)}
  if(clear<w*h*.2)throw Error('Opaque trap background');const b=isolateFrame(cell,w,{x:0,y:0,w,h});if(!b||b.minX<4||b.minY<4||b.maxX>=w-4||b.maxY>=h-4)throw Error('Clipped barricade state '+id);
  for(let y=0;y<h;y++)for(let x=0;x<w;x++){const at=y*w+x;if(b.selected.has(b.labels[at]))continue;let edge=false;if(cell[at*4+3]<100)for(let dy=-2;dy<=2&&!edge;dy++)for(let dx=-2;dx<=2;dx++){const xx=x+dx,yy=y+dy;if(xx>=0&&xx<w&&yy>=0&&yy<h&&b.selected.has(b.labels[yy*w+xx])){edge=true;break}}if(!edge)cell.fill(0,at*4,at*4+4)}
  const left=b.minX-3,top=b.minY-3,width=b.maxX-left+4,height=b.maxY-top+4,url=id+'.webp';await sharp(cell,{raw:{width:w,height:h,channels:4}}).extract({left,top,width,height}).webp({quality:95,alphaQuality:100,effort:5}).toFile(path.join(dir,url));
  manifest.assets[id]={url,width,height,sourceUrl:file,sourceRect:[sx+left,top,width,height],padding:3,ground:(440-top)/height,role:i?'retracted garrison street barricade':'extended garrison street barricade'};console.log(id,width+'x'+height)
 }
}
main().catch(e=>{console.error(e);process.exitCode=1});
