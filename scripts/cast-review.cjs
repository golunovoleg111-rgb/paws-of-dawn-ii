// Local-only authoring server. It writes only the registration file below.
const http=require('http'),fs=require('fs'),path=require('path');const root=process.cwd(),dir=path.join(root,'work/art-review'),target=path.join(dir,'registration.json');fs.mkdirSync(dir,{recursive:true});
const types={'.html':'text/html; charset=utf-8','.js':'text/javascript','.png':'image/png','.webp':'image/webp','.json':'application/json'};
http.createServer((req,res)=>{const u=new URL(req.url,'http://127.0.0.1');if(u.pathname==='/registration'){
 if(req.method==='GET'){res.writeHead(200,{'Content-Type':'application/json'});return res.end(fs.existsSync(target)?fs.readFileSync(target):'{}')}
 if(req.method==='POST'){let body='';req.on('data',b=>{body+=b;if(body.length>1500)req.destroy()});req.on('end',()=>{try{const p=JSON.parse(body);if(!/^[a-z-]+$/.test(p.key)||!Number.isInteger(p.frame)||p.frame<0||p.frame>30||!['root','grip','offhand'].includes(p.kind)||![p.x,p.y].every(n=>Number.isFinite(n)&&n>=0&&n<=4000))throw Error('Invalid mark');const all=fs.existsSync(target)?JSON.parse(fs.readFileSync(target)):{};all[p.key]||={};all[p.key][p.frame]||={};all[p.key][p.frame][p.kind]=[Math.round(p.x),Math.round(p.y)];fs.writeFileSync(target,JSON.stringify(all,null,2));res.writeHead(200);res.end('saved')}catch(e){res.writeHead(400);res.end(e.message)}});return}
 }
 const file=path.resolve(root,'.'+decodeURIComponent(u.pathname==='/'?'/.qa.html':u.pathname));if(!file.startsWith(root+path.sep)){res.writeHead(403);return res.end()};fs.readFile(file,(e,b)=>{res.writeHead(e?404:200,{'Content-Type':types[path.extname(file)]||'application/octet-stream','Cache-Control':'no-store'});res.end(e?'not found':b)});
}).listen(8767,'127.0.0.1',()=>console.log('Local character review http://127.0.0.1:8767'));
