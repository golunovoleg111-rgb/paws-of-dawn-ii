export function createCast(){let visualTime=0,reducedMotion=false,selected=0,hat=0,equippedWeapon='sword';const heroes=[{name:'Мисти'},{name:'Гектор'},{name:'Коди'}];
/* Storybook character illustration. Curves, articulated poses and original silhouettes.
   Logical game sizes and collision boxes are unchanged; render at 2× for clean edges. */
const INK='#30313c';
function artPath(c,fill,commands,stroke=INK,width=1.25){c.beginPath();for(const a of commands){const [op,...v]=a;if(op==='M')c.moveTo(...v);else if(op==='L')c.lineTo(...v);else if(op==='Q')c.quadraticCurveTo(...v);else if(op==='C')c.bezierCurveTo(...v);else if(op==='Z')c.closePath()}if(fill){c.fillStyle=fill;c.fill()}if(stroke){c.strokeStyle=stroke;c.lineWidth=width;c.lineJoin='round';c.lineCap='round';c.stroke()}}
function artOval(c,x,y,rx,ry,fill,stroke=null,width=1){c.beginPath();c.ellipse(x,y,rx,ry,0,0,Math.PI*2);c.fillStyle=fill;c.fill();if(stroke){c.strokeStyle=stroke;c.lineWidth=width;c.stroke()}}
function artLine(c,points,color=INK,width=1){artPath(c,null,points,color,width)}
const CAT_PALETTES=[
 {fur:'#303441',shade:'#202633',light:'#626777',muzzle:'#9696a2',iris:'#b9df86',cloth:'#77729f',clothDark:'#514a77',metal:'#a7b8c4',metalDark:'#627989',trim:'#ddd5ab'},
 {fur:'#918576',shade:'#665c54',light:'#c5b8a0',muzzle:'#e5d6b9',iris:'#8dc9bb',cloth:'#456c7a',clothDark:'#304c60',metal:'#b5c5c8',metalDark:'#69818c',trim:'#e9c47b'},
 {fur:'#cf854b',shade:'#a25c38',light:'#edb975',muzzle:'#f5dab0',iris:'#7ac5b3',cloth:'#4e8d7c',clothDark:'#2e665d',metal:'#c7b79c',metalDark:'#897967',trim:'#f3d399'}
];
function drawCatHead(c,id,t=0,expression='calm',boss=false){
 const h=boss?{fur:'#655463',shade:'#443749',light:'#96808b',muzzle:'#c9abb0',iris:'#efba67'}:CAT_PALETTES[id];const broad=boss?1.12:id===1?1.08:1;
 c.save();c.scale(broad,1);
 // Tapered ears, cheek tufts and an asymmetric muzzle: never a square mask.
 artPath(c,h.fur,[['M',-15,-52],['Q',-18,-61,-18,-71],['Q',-16,-73,-7,-63],['Q',1,-66,8,-62],['Q',15,-74,18,-72],['Q',20,-66,17,-53],['Q',21,-49,19,-44],['L',22,-42],['L',16,-41],['L',17,-37],['Q',8,-34,2,-35],['Q',-5,-34,-11,-38],['L',-16,-37],['L',-15,-41],['L',-21,-43],['Q',-17,-46,-15,-52],['Z']]);
 artPath(c,h.shade,[['M',-15,-56],['Q',-11,-62,-5,-62],['Q',-9,-53,-8,-46],['Q',-6,-40,1,-37],['Q',-10,-36,-15,-42],['L',-20,-43],['Q',-16,-47,-15,-56],['Z']],null);
 artPath(c,'#c88d96',[['M',-15,-68],['Q',-10,-64,-8,-59],['L',-14,-58],['Z']],null);artPath(c,'#d2a0a3',[['M',15,-68],['L',15,-57],['L',10,-60],['Z']],null);
 artPath(c,h.light,[['M',-7,-61],['Q',1,-64,8,-60],['Q',5,-59,3,-56],['Q',-1,-61,-7,-61],['Z']],null);
 if(id===1||boss){artPath(c,h.light,[['M',-15,-46],['L',-20,-40],['L',-15,-40],['L',-17,-34],['L',-11,-36],['L',-9,-30],['Q',-2,-35,4,-32],['L',10,-35],['L',16,-33],['L',15,-39],['L',20,-39],['L',16,-47],['Q',10,-41,4,-41],['Q',-6,-40,-15,-46],['Z']],INK,.8);artLine(c,[['M',-12,-40],['Q',-9,-37,-7,-36]],h.shade,.8);artLine(c,[['M',11,-39],['L',9,-35]],h.shade,.8);}
 if(id===2&&!boss){for(const [x,angle]of [[-5,-1],[2,0],[9,1]])artPath(c,h.shade,[['M',x-1,-62],['Q',x+3,-59,x+angle,-54],['L',x-3,-58],['Z']],null);artLine(c,[['M',-14,-49],['L',-9,-47]],h.shade,2);}
 // Rounded cheeks; the near eye is wider in this three-quarter view.
 artOval(c,3,-42,7,4.4,h.muzzle);artOval(c,11,-42.5,6.5,4,h.muzzle);
 const blink=(t+id*.83)%4.7>4.51,angry=expression==='attack'||boss;
 if(blink){artLine(c,[['M',-6,-51],['Q',-2,-49,2,-51]],INK,1.3);artLine(c,[['M',7,-51],['Q',11,-49,15,-52]],INK,1.3)}else{
 for(const [x,w]of [[-2,4.3],[11,4.8]]){artPath(c,'#efe8d1',[['M',x-w,-52],['Q',x,-56+(angry?2:0),x+w,-52.5],['Q',x+1,-47,x-w,-49.5],['Z']],INK,.7);artOval(c,x+.6,-51,2.3,3,h.iris);artOval(c,x+1,-51,0.95,2.8,'#24323c');artOval(c,x+.1,-52.1,.85,.95,'#fff9dd');}
 }
 artLine(c,[['M',-7,-55],['Q',-3,angry?-52:-57,2,-55]],h.shade,1.3);artLine(c,[['M',7,-55],['Q',12,angry?-53:-57,16,-56]],h.shade,1.3);
 artPath(c,'#b9818b',[['M',5,-44.7],['Q',8,-46,10,-44.8],['Q',8.2,-41.8,7,-42],['Z']],INK,.6);
 artLine(c,[['M',7,-42],['L',7,-40.5],['Q',4,-38.5,2.5,-40]],INK,.65);artLine(c,[['M',7,-40.5],['Q',10,-38.8,12,-40.5]],INK,.65);
 for(let j=0;j<2;j++){artLine(c,[['M',-1,-42+j*2],['Q',-9,-44+j*3,-16,-42+j*3]],'#e0d2c6aa',.6);artLine(c,[['M',13,-42+j*2],['L',23,-44+j*4]],'#e0d2c6aa',.6)}
 if(boss){artLine(c,[['M',-7,-59],['L',-2,-47]],'#ceacaf',1.4);artPath(c,'#f7e8ce',[['M',2,-39],['L',3.3,-35.5],['L',4.5,-39],['Z']],null);}
 c.restore();
}
function cat(c,x,y,scale=1,id=selected,cos=hat,dir=1,frame=0,action='idle',attackPhase=null){
 const h=CAT_PALETTES[id],t=reducedMotion?0:visualTime||0,moving=Math.abs(frame)>.001,step=Math.sin(frame),jump=action==='jump';
 c.save();c.translate(x,y);c.scale(scale*dir,scale);c.lineCap='round';c.lineJoin='round';
 artOval(c,0,1,19,3,'#23313b29');
 const bodyWidth=id===1?1.13:id===0?.91:1,bob=moving?-Math.abs(Math.cos(frame))*1.1:Math.sin(t*2.6+id)*.55;
 // A loose tail follows the stride with a delayed flick.
 artPath(c,null,[['M',-9,-24],['C',-31,-16,-31,-28,-29,-33+Math.sin(t*3+id)*3]],INK,6);artPath(c,null,[['M',-9,-24],['C',-31,-16,-31,-28,-29,-33+Math.sin(t*3+id)*3]],h.fur,3.8);
 const flutter=Math.sin(t*6+id)*(moving?3:1.5);
 artPath(c,h.clothDark,[['M',-9,-43+bob],['Q',-21,-38,-20+flutter,-13],['Q',-15,-9,-7,-14],['L',1,-38],['Z']]);artPath(c,h.cloth,[['M',-11,-41],['Q',-16,-27,-17+flutter,-17],['Q',-13,-16,-10,-18],['L',-5,-39],['Z']],null);
 // Legs bend at knee and ankle, rather than sliding rectangular feet.
 for(const side of [-1,1]){const hip=side===-1?-6:6,swing=moving?step*side:0,footX=hip+swing*8,footY=jump?-5:Math.min(0,-swing*3),kneeX=hip+swing*4-1,kneeY=jump?-13:-12;
 artPath(c,h.metalDark,[['M',hip-4,-23],['Q',kneeX-5,kneeY-2,footX-4,footY-5],['Q',footX+1,footY-1,footX+5,footY-5],['L',kneeX+5,kneeY-2],['L',hip+4,-23],['Z']]);
 artOval(c,kneeX,kneeY,4.4,4.2,h.metal,INK,.8);artPath(c,'#465364',[['M',footX-4,footY-7],['Q',footX+1,footY-8,footX+4,footY-5],['Q',footX+11,footY-3,footX+8,footY],['L',footX-5,footY],['Q',footX-7,footY-2,footX-4,footY-7],['Z']]);artLine(c,[['M',footX-3,footY-4],['Q',footX+3,footY-5,footX+7,footY-2]],'#a6b5be',.7);}
 c.save();c.translate(0,bob);c.scale(bodyWidth,1);
 artPath(c,h.cloth,[['M',-11,-31],['Q',-14,-23,-13,-16],['Q',1,-12,14,-17],['L',11,-32],['Z']]);
 artPath(c,h.metal,[['M',-11,-42],['Q',0,-47,12,-41],['Q',15,-31,10,-21],['Q',0,-18,-10,-22],['Q',-15,-30,-11,-42],['Z']]);
 artPath(c,h.metalDark,[['M',4,-43],['Q',15,-36,10,-22],['Q',4,-20,0,-21],['Q',7,-27,4,-43],['Z']],null);
 artPath(c,'#f1ede044',[['M',-9,-39],['Q',-3,-42,0,-40],['L',-3,-25],['Q',-7,-27,-9,-39],['Z']],null);
 // Embossed personal heraldry: crescent, sun or leaf.
 if(id===0){artOval(c,-2,-33,4,4,h.cloth);artOval(c,0,-34,3.5,3.6,h.metal)}else if(id===1){artOval(c,-2,-33,3,3,h.trim);for(let j=0;j<6;j++){const a=j*Math.PI/3;artLine(c,[['M',-2+Math.cos(a)*4,-33+Math.sin(a)*4],['L',-2+Math.cos(a)*6,-33+Math.sin(a)*6]],h.trim,.8)}}else artPath(c,h.cloth,[['M',-4,-28],['Q',-8,-37,3,-38],['Q',4,-30,-4,-28],['Z']],null);
 artPath(c,'#5f4b47',[['M',-12,-23],['Q',0,-21,12,-23],['L',12,-19],['Q',0,-17,-12,-20],['Z']],INK,.7);artOval(c,0,-21,2.7,2.1,h.trim,INK,.6);
 // Rounded pauldrons and the rear arm counter-swing.
 artOval(c,-13,-38,6,5,h.metal,INK,1);artPath(c,h.metalDark,[['M',-17,-35],['Q',-20,-29,-15+(moving?step*3:0),-24],['L',-11,-26],['L',-10,-36],['Z']]);artOval(c,-14+(moving?step*3:0),-25,3.5,4,h.fur,INK,.7);
 drawCatHead(c,id,t,action);
 // Scarf, hats and cape remain layered cosmetics, independent of the armour.
 drawCatCosmetic(c,cos,t,h);
 c.save();c.translate(13,-36);const ap=attackPhase==null?(Math.sin(t*14)+1)/2:Math.max(0,Math.min(1,attackPhase));
 const swingAngle=ap<.2?-.35-ap/.2*1.3:ap<.65?-1.65+(ap-.2)/.45*3.15:1.5-(ap-.65)/.35*1.34;c.rotate(action==='attack'?swingAngle:jump?-.45:moving?step*.12+(id===1?.3:0):id===1?.38:.16);
 artPath(c,h.metal,[['M',-3,0],['Q',6,-1,6,5],['L',6,12],['Q',2,16,-1,11],['L',-5,5],['Z']]);artOval(c,3,13,3.5,3.3,h.fur,INK,.8);
 drawWeapon(c,id,3,12,h);c.restore();
 artPath(c,h.metal,[['M',9,-41],['Q',15,-45,19,-39],['L',19,-35],['Q',14,-33,9,-37],['Z']]);artLine(c,[['M',11,-40],['Q',15,-42,17,-39]],'#f3eddd',.8);
 if(id===1)drawShield(c,-17,-29,1,h);c.restore();c.restore();
}
function drawWeapon(c,id,x,y,h){if(equippedWeapon.includes('bow')){c.save();c.translate(x,y);artPath(c,null,[['M',2,-38],['Q',-20,-12,2,12]],'#b79a67',3);artPath(c,null,[['M',2,-38],['L',-3,-12],['L',2,12]],'#ded0ad',.7);artLine(c,[['M',-10,-12],['L',23,-12]],'#d4c19b',1);c.restore();return}id=equippedWeapon==='hammer'?1:equippedWeapon==='sabre'?2:0;c.save();c.translate(x,y);if(id===1){artLine(c,[['M',0,7],['L',0,-24]],'#443a36',4);artLine(c,[['M',0,7],['L',0,-24]],'#a4825b',2);artPath(c,h.metalDark,[['M',-8,-34],['L',-6,-40],['Q',1,-43,8,-37],['L',10,-28],['L',5,-23],['L',-5,-25],['Z']]);artPath(c,h.metal,[['M',-5,-37],['L',1,-39],['L',6,-35],['L',7,-29],['L',1,-27],['L',-5,-30],['Z']]);artLine(c,[['M',0,-39],['L',0,-28]],h.trim,2)}else{
 artPath(c,id===0?'#c5d9e5':'#dbdfd3',[['M',-2,-3],['L',-2,-30],['Q',-1,-37,id===0?2:7,-42],['Q',id===0?5:9,-25,3,-3],['Z']]);artLine(c,[['M',0,-7],['L',0,-29]],'#fbfbdf',1);artPath(c,h.trim,[['M',-7,-3],['Q',0,-8,8,-3],['L',7,0],['Q',0,-3,-7,0],['Z']],INK,.7);artLine(c,[['M',0,0],['L',0,8]],'#70574b',3);artOval(c,0,9,2.8,2.4,h.trim,INK,.7);
 }c.restore()}
function drawShield(c,x,y,s,h){c.save();c.translate(x,y);c.scale(s,s);artPath(c,h.trim,[['M',-8,-12],['Q',0,-16,8,-12],['L',8,2],['Q',5,10,0,13],['Q',-7,9,-9,2],['Z']]);artPath(c,h.clothDark,[['M',-5,-10],['Q',0,-12,5,-10],['L',5,1],['Q',3,7,0,9],['Q',-5,6,-6,0],['Z']],null);artLine(c,[['M',0,-8],['L',0,6],['M',-4,-2],['L',4,-2]],h.trim,1.4);c.restore()}
function drawCatCosmetic(c,cos,t,h){
 if(cos===1){artPath(c,'#bb5e69',[['M',-10,-39],['Q',2,-35,13,-40],['L',13,-36],['Q',1,-31,-11,-35],['Z']],INK,.7);artPath(c,'#cf7780',[['M',-8,-36],['Q',-17,-28,-23+Math.sin(t*5)*2,-27],['L',-20,-34],['L',-23,-37],['Q',-15,-34,-8,-39],['Z']],INK,.7)}
 if(cos===2){artPath(c,'#b48a59',[['M',-20,-62],['Q',0,-69,22,-62],['Q',1,-57,-20,-62],['Z']]);artPath(c,'#a27b50',[['M',-12,-64],['L',-10,-77],['Q',1,-83,12,-76],['L',14,-63],['Q',2,-60,-12,-64],['Z']]);artLine(c,[['M',-11,-66],['Q',0,-63,13,-66]],'#654e45',3)}
 if(cos===3){artPath(c,'#e8c36c',[['M',-13,-64],['L',-16,-75],['L',-7,-70],['L',0,-80],['L',7,-71],['L',16,-77],['L',14,-64],['Q',0,-60,-13,-64],['Z']]);for(let i=-1;i<=1;i++)artOval(c,i*9,-66.2,1.4,1.7,i===0?'#b8788f':'#f9e5a4')}
 if(cos===4){artPath(c,'#726392',[['M',-21,-62],['Q',0,-68,23,-62],['Q',0,-56,-21,-62],['Z']]);artPath(c,'#8072a1',[['M',-12,-64],['Q',-8,-79,6,-89],['Q',2,-78,14,-64],['Q',1,-61,-12,-64],['Z']]);artOval(c,0,-72,1.8,2.2,'#e9cf86')}
 if(cos===5){artPath(c,'#eee4cc',[['M',-15,-67],['Q',1,-77,17,-67],['L',15,-62],['Q',0,-58,-15,-63],['Z']]);artLine(c,[['M',-14,-63],['Q',0,-59,15,-63]],'#416a83',3);artOval(c,1,-66,2,2.5,'#d8bc78')}
 if(cos===6){artPath(c,'#b96778',[['M',-15,-64],['Q',-16,-79,0,-79],['Q',16,-78,16,-64],['Z']]);artPath(c,'#eee1cd',[['M',-16,-66],['Q',0,-63,16,-66],['L',16,-62],['Q',0,-59,-16,-62],['Z']],INK,.8);artOval(c,0,-81,4,4,'#eee1cd',INK,.7)}
 if(cos===7){artPath(c,'#719abb',[['M',-11,-41],['Q',-21,-25,-22,-12],['Q',-17,-16,-10,-12],['L',-5,-38],['Z']],INK,.8);artOval(c,-9,-39,2.5,2.4,'#edd59c')}
}
function drawBogdanus(c,x,y,s=1,dir=-1,state='idle',t=visualTime){
 t=reducedMotion?0:t;c.save();c.translate(x,y);c.scale(s*dir,s);const h={metal:'#777589',metalDark:'#49495f',trim:'#e1ba75',clothDark:'#713e57'};
 artOval(c,0,1,39,5,'#20233535');const stomp=state==='charge'?Math.sin(t*13)*4:0;
 artPath(c,'#743d55',[['M',-24,-81],['Q',-41,-64,-43,-15],['Q',-30,-7,-15,-13],['L',2,-70],['Z']]);artPath(c,'#a15a6b',[['M',-31,-77],['Q',-33,-43,-38,-20],['L',-28,-23],['L',-23,-72],['Z']],null);
 for(const side of [-1,1]){const xx=side*14,sy=side*stomp;artPath(c,'#4c4a60',[['M',xx-9,-37],['L',xx+10,-36],['L',xx+8+sy,-9],['L',xx-10+sy,-8],['Z']]);artOval(c,xx,-25,9,8,'#7f7d90',INK,1.5);artPath(c,'#373849',[['M',xx-10+sy,-13],['Q',xx+2+sy,-16,xx+9+sy,-10],['Q',xx+17+sy,-5,xx+14+sy,0],['L',xx-12+sy,0],['Q',xx-15+sy,-5,xx-10+sy,-13],['Z']]);}
 const breath=state==='tired'?Math.sin(t*5)*1.5:Math.sin(t*2)*.8;c.save();c.translate(0,breath);
 artPath(c,h.metalDark,[['M',-27,-78],['Q',2,-92,28,-77],['Q',35,-58,26,-36],['Q',1,-28,-26,-37],['Q',-34,-57,-27,-78],['Z']],INK,2);artPath(c,h.metal,[['M',-20,-76],['Q',0,-85,21,-75],['Q',28,-57,20,-43],['Q',0,-37,-21,-44],['Q',-28,-61,-20,-76],['Z']],null);
 artPath(c,'#b7a3ad55',[['M',-18,-72],['Q',-8,-79,-3,-74],['L',-8,-45],['Q',-18,-51,-18,-72],['Z']],null);artPath(c,'#573d54',[['M',-13,-68],['Q',1,-75,14,-68],['L',10,-49],['Q',0,-41,-11,-51],['Z']],h.trim,1);artOval(c,0,-60,5,5,h.trim);artOval(c,2,-62,4.6,4.6,'#573d54');
 artLine(c,[['M',-28,-37],['Q',0,-32,28,-37]],'#48363e',7);artOval(c,0,-35,6,4,h.trim,INK,1);
 c.save();c.translate(0,-14);c.scale(1.6,1.6);drawCatHead(c,1,t,state==='tired'?'calm':'attack',true);drawCatCosmetic(c,3,t,h);c.restore();
 artPath(c,'#8d8799',[['M',-32,-78],['Q',-42,-71,-37,-57],['Q',-29,-54,-19,-62],['L',-19,-76],['Z']],INK,1.5);artPath(c,'#9c92a0',[['M',22,-78],['Q',41,-78,40,-62],['L',27,-56],['L',18,-64],['Z']],INK,1.5);
 artPath(c,'#625567',[['M',30,-60],['Q',44,-49,38,-30],['L',28,-30],['L',23,-58],['Z']]);artOval(c,33,-31,7,7,'#8b7280',INK,1.2);
 artLine(c,[['M',36,-27],['L',45,-78]],'#392f39',8);artLine(c,[['M',36,-27],['L',45,-78]],'#a28160',4);
 artPath(c,'#c0ad97',[['M',44,-92],['Q',60,-90,65,-75],['L',54,-69],['Q',45,-79,36,-75],['L',38,-91],['Z']],INK,1.8);artLine(c,[['M',52,-88],['Q',60,-84,63,-76]],'#f0dbc0',1.5);
 drawShield(c,-34,-43,1.7,h);c.restore();c.restore();
}
function owl(c,x,y,s=1){const t=reducedMotion?0:visualTime||0;c.save();c.translate(x,y);c.scale(s,s);artOval(c,0,1,18,3,'#23313b25');const nod=Math.sin(t*1.8)*1;
 artPath(c,'#81718b',[['M',-15,-37],['Q',-24,-23,-15,-5],['Q',0,5,17,-5],['Q',24,-22,15,-37],['Z']]);artPath(c,'#c3ad8c',[['M',-11,-31],['Q',0,-36,13,-30],['Q',19,-18,10,-4],['Q',0,2,-10,-5],['Q',-17,-17,-11,-31],['Z']],null);
 for(let i=0;i<3;i++)for(let j=0;j<3;j++)artLine(c,[['M',-8+j*7,-20+i*5],['Q',-6+j*7,-17+i*5,-4+j*7,-20+i*5]],'#9e856d',.8);
 artPath(c,'#6f6380',[['M',-14,-30],['Q',-27,-22,-21,-6],['Q',-16,-7,-12,-16],['Z']]);artPath(c,'#80708a',[['M',15,-30],['Q',27,-21,22,-5],['Q',14,-8,12,-17],['Z']]);
 c.save();c.translate(0,nod);artPath(c,'#9d8c94',[['M',-18,-38],['Q',-23,-58,-13,-51],['Q',0,-56,14,-50],['Q',23,-58,21,-39],['Q',22,-28,0,-25],['Q',-22,-27,-18,-38],['Z']]);
 artOval(c,-7,-39,10,10,'#e4d4b3');artOval(c,10,-39,10,10,'#e4d4b3');const blink=t%5.2>5.02;
 for(const xx of [-7,10]){if(blink)artLine(c,[['M',xx-4,-38],['Q',xx,-35,xx+4,-38]],INK,1.6);else{artOval(c,xx+1,-39,4.6,5.8,'#657b75');artOval(c,xx+2,-39,2.6,4.4,'#30333e');artOval(c,xx+.5,-41,1.3,1.4,'#fff3d0')}artOval(c,xx,-39,10.2,10.5,'#ffffff00','#a88e63',1.1)}artLine(c,[['M',2.5,-40],['Q',3.5,-43,4.2,-40]],'#a88e63',1.1);
 artPath(c,'#d3a96b',[['M',-1,-34],['Q',4,-37,7,-33],['L',3,-27],['Z']],INK,.7);
 artPath(c,'#76628b',[['M',-24,-52],['Q',0,-59,28,-52],['Q',2,-46,-24,-52],['Z']]);artPath(c,'#877499',[['M',-12,-53],['Q',-10,-67,8,-72],['Q',4,-62,16,-53],['Z']]);artLine(c,[['M',-11,-55],['Q',2,-51,14,-55]],'#cfb57f',2);c.restore();
 artLine(c,[['M',-9,-2],['L',-12,2],['M',-9,-2],['L',-6,2],['M',8,-2],['L',5,2],['M',8,-2],['L',11,2]],'#be9667',2);c.restore();
}
function drawMouse(c,x,y,s=1,dir=1,t=0,guard=false,hurt=false){c.save();c.translate(x,y);c.scale(s*dir,s);const fur=hurt?'#ecd1b5':guard?'#8e8d98':'#a3949e',walk=Math.sin(t*9),h={trim:'#cab17b',clothDark:'#526a72'};
 artOval(c,0,1,17,2.5,'#26313c22');artPath(c,null,[['M',-8,-10],['C',-26,-2,-29,-17,-20,-19]],'#4c3e4c',3);artPath(c,null,[['M',-8,-10],['C',-26,-2,-29,-17,-20,-19]],'#c596a2',1.8);
 artLine(c,[['M',-6,-11],['L',-8+walk*3,-3],['L',-12+walk*3,0]],'#554650',4);artLine(c,[['M',5,-11],['L',6-walk*3,-3],['L',11-walk*3,0]],'#554650',4);
 artPath(c,guard?'#768891':'#8b635f',[['M',-9,-22],['Q',-16,-15,-10,-7],['Q',1,-3,11,-9],['Q',14,-17,7,-24],['Z']]);artLine(c,[['M',-9,-10],['Q',0,-8,10,-11]],'#4e3f46',3);artOval(c,1,-9,2,1.7,'#d5b580');
 c.save();c.translate(0,Math.sin(t*9)*.4);artOval(c,-9,-29,8.5,9,fur,INK,1);artOval(c,-9,-29,5.2,5.9,'#d4abb3');artOval(c,6,-31,7.7,8.5,fur,INK,1);artOval(c,6,-31,4.6,5.6,'#d4abb3');
 artPath(c,fur,[['M',-10,-28],['Q',-3,-35,6,-29],['Q',9,-25,16,-22],['Q',22,-19,16,-16],['Q',8,-13,0,-16],['Q',-12,-16,-10,-28],['Z']]);artPath(c,'#d7c1b5',[['M',5,-22],['Q',13,-23,18,-20],['Q',18,-15,7,-17],['Z']],null);artOval(c,18,-20,2.2,1.8,'#815b6e');artOval(c,5,-26,2,2.8,'#282f3b');artOval(c,5.3,-27,.7,.8,'#f5e6c6');artLine(c,[['M',2,-30],['L',8,-29]],'#60515d',1);artLine(c,[['M',12,-18],['L',20,-14],['M',12,-19],['L',23,-19]],'#e5d4c4',.65);
 if(!guard){artPath(c,'#8a4c60',[['M',-12,-32],['Q',-4,-35,7,-32],['L',7,-29.5],['Q',-1,-32,-11,-29],['Z']],INK,.7);artPath(c,'#9d5c6c',[['M',-11,-29],['L',-20,-30],['L',-17,-24],['L',-12,-27],['Z']],INK,.6)}else{artPath(c,'#758893',[['M',-12,-30],['Q',-11,-39,0,-38],['Q',10,-37,11,-30],['L',14,-28],['Q',0,-30,-13,-27],['Z']]);artLine(c,[['M',-8,-34],['Q',-1,-38,7,-33]],'#ced3c8',1.1)}c.restore();
 artLine(c,[['M',10,-14],['L',17,-12]],fur,4);artLine(c,[['M',17,-8],['L',19,-31]],'#76604b',2);artPath(c,'#d2d6c6',[['M',17,-29],['L',20,-38],['L',23,-29],['Z']],INK,.7);if(guard)drawShield(c,-10,-15,.7,h);c.restore()}
function drawBat(c,x,y,s=1,dir=1,t=0,hurt=false){c.save();c.translate(x,y);c.scale(s*dir,s);const wing=Math.sin(t*12)*10;
 for(const side of [-1,1]){c.save();c.scale(side,1);artPath(c,hurt?'#ded0dc':'#7e6f94',[['M',5,-16],['Q',18,-27-wing,31,-21-wing],['Q',24,-15-wing/2,29,-3],['Q',20,-11,17,-3],['Q',12,-11,6,-6],['Z']]);artLine(c,[['M',7,-14],['Q',15,-19,29,-21-wing],['M',16,-18],['L',17,-4]],'#b9a1b9',.8);c.restore()}
 artPath(c,'#655773',[['M',-8,-13],['L',-8,-29],['L',-2,-23],['Q',2,-25,4,-23],['L',10,-29],['L',9,-13],['Q',9,0,1,1],['Q',-9,0,-8,-13],['Z']]);artOval(c,1,-8,5,6,'#9d879d');for(const x of [-3,5]){artOval(c,x,-17,2.4,3,'#f2cd91');artOval(c,x+.4,-17,.9,2,'#333243')}artPath(c,'#c897aa',[['M',0,-12],['L',3,-12],['L',1,-9],['Z']],null);artLine(c,[['M',-2,-6],['Q',1,-4,4,-6]],INK,.8);c.restore()}
function drawPortrait(c,speaker){c.clearRect(0,0,100,100);artOval(c,50,51,47,47,'#354452');const id=heroes.findIndex(h=>h.name===speaker);c.save();if(id>=0){c.translate(46,135);c.scale(1.65,1.65);cat(c,0,0,1,id,hat,1,0)}else if(speaker==='Богданус'){c.translate(50,148);c.scale(1.02,1.02);drawBogdanus(c,0,0,1,1,'idle',visualTime)}else owl(c,50,110,1.38);c.restore()}
function drawYarn(c,x,y){artOval(c,x+9,y+9,9,9,'#b18da8',INK,.8);artLine(c,[['M',x+3,y+4],['Q',x+17,y+8,x+5,y+16],['M',x+6,y+1],['Q',x+2,y+12,x+16,y+12],['M',x+16,y+3],['Q',x+8,y+3,x+3,y+14]],'#e2bbca',.8);artPath(c,null,[['M',x+1,y+10],['Q',x-8,y+6,x-9,y+14]],'#bc93ac',1.2)}
function drawTreat(c,x,y){artPath(c,'#efd28b',[['M',x-6,y],['Q',x-13,y-6,x-14,y-5],['L',x-14,y+5],['Q',x-10,y+5,x-6,y],['Z']],'#aa895e',.6);artOval(c,x,y,8,4.5,'#f2d693','#aa895e',.6);artOval(c,x+4,y-1,.8,1,'#4a5147');artLine(c,[['M',x-1,y-3],['Q',x+2,y,x-1,y+3]],'#c6a372',.7)}


function drawSpitz(c,x,y,s,dir,state,t){c.save();c.translate(x,y);c.scale(s*dir,s);const step=state==='run'?Math.sin(t*15):0;artOval(c,0,1,21,3,'#16232e44');artPath(c,null,[['M',-10,-23],['C',-38,-16,-35,-47,-22,-42],['C',-10,-38,-22,-28,-24,-37]],'#d6b990',10);artPath(c,null,[['M',-10,-23],['C',-38,-16,-35,-47,-22,-42]],'#f3dfb7',6);for(const d of [-1,1]){const xx=d*7+step*d*5;artPath(c,'#6e5b4e',[['M',d*7-4,-20],['L',xx-4,-4],['Q',xx-5,1,xx+8,0],['L',xx+6,-6],['L',d*7+4,-20],['Z']]);}artPath(c,'#517973',[['M',-12,-42],['Q',0,-48,14,-40],['L',14,-19],['Q',1,-13,-14,-20],['Z']]);artLine(c,[['M',-12,-25],['L',14,-24]],'#bf9d66',4);artPath(c,'#d9bc8f',[['M',-16,-53],['L',-17,-73],['L',-5,-65],['Q',2,-68,9,-64],['L',20,-74],['L',18,-51],['L',23,-43],['L',17,-43],['L',21,-37],['L',13,-38],['L',10,-30],['L',4,-34],['L',-4,-30],['L',-7,-36],['L',-15,-33],['L',-15,-40],['L',-21,-42],['Z']]);artPath(c,'#f7e7c7',[['M',-11,-57],['Q',3,-67,15,-55],['L',19,-43],['Q',8,-32,-9,-39],['Z']],null);for(const xx of [-4,11]){artOval(c,xx,-52,2.7,3.1,'#372e2f');artOval(c,xx-.8,-53,.9,1,'#fff8df')}artOval(c,7,-44,4,2.7,'#3c3033');artLine(c,[['M',7,-42],['L',7,-39],['Q',3,-36,0,-39],['M',7,-39],['Q',12,-36,14,-39]],'#50403b',.8);artPath(c,'#a5686f',[['M',5,-37],['L',6,-33],['Q',9,-31,10,-37],['Z']],null);artLine(c,[['M',15,-27],['L',27,-24]],'#d6b990',5);drawWeapon(c,0,26,-24,CAT_PALETTES[2]);c.restore();}
function drawQueen(c,x,y,dir,t,state){c.save();c.translate(x,y);c.scale(dir,1);const sway=Math.sin(t*2)*3;artOval(c,0,2,49,6,'#16152366');artPath(c,'#342436',[['M',-18,-78],['Q',-28,-30,-47+sway,0],['Q',-15,8,4,0],['Q',28,7,49+sway,0],['Q',25,-43,21,-77],['Z']],INK,1.7);artPath(c,'#744253',[['M',-11,-75],['Q',-18,-30,-31,0],['Q',0,5,26,-1],['Q',12,-43,13,-77],['Z']],null);artLine(c,[['M',0,-66],['Q',-1,-27,-8,0]],'#c28b90',1);artPath(c,'#b0a6af',[['M',-15,-83],['Q',0,-94,17,-83],['L',13,-60],['Q',1,-52,-12,-60],['Z']]);artPath(c,'#473448',[['M',-12,-79],['Q',0,-86,14,-79],['L',8,-61],['Q',0,-57,-7,-62],['Z']],null);artOval(c,2,-74,3,4,'#d4a6b4');artPath(c,'#d7cbd0',[['M',-18,-96],['Q',-26,-108,-22,-121],['L',-12,-113],['Q',0,-122,14,-113],['L',24,-123],['Q',26,-110,20,-97],['L',23,-91],['L',16,-91],['Q',2,-80,-13,-90],['L',-20,-88],['Z']]);artPath(c,'#f0e0da',[['M',-13,-103],['Q',0,-115,16,-104],['Q',21,-91,7,-89],['Q',-11,-86,-13,-103],['Z']],null);for(const xx of [-5,12]){artPath(c,'#8e677c',[['M',xx-5,-102],['Q',xx,-105,xx+5,-101],['L',xx+3,-97],['Q',xx,-99,xx-5,-98],['Z']],null);artOval(c,xx,-100,1.6,2,'#e9c87b');artLine(c,[['M',xx-5,-106],['L',xx+3,-104]],'#4c354b',1.2)}artOval(c,5,-94,3,1.9,'#af798a');artLine(c,[['M',4,-92],['Q',9,-88,13,-91]],'#704859',.8);artPath(c,'#a48962',[['M',-21,-115],['L',-27,-135],['L',-12,-126],['L',1,-145],['L',11,-127],['L',26,-138],['L',23,-115],['Q',0,-109,-21,-115],['Z']]);artOval(c,1,-120,3,4,'#bb748e');artLine(c,[['M',19,-79],['Q',36,-69,42,-85]],'#c9b6b9',7);artLine(c,[['M',42,-70],['L',42,-129]],'#b89a65',3);artOval(c,42,-134,8,9,'#744e72','#d4b67e',1.5);artOval(c,42,-134,4,5,state==='windup'?'#ffe0a9':'#d6acc9');artPath(c,'#493049',[['M',-20,-84],['Q',-39,-75,-32,-54],['L',-22,-60],['Z']]);c.restore();}


function drawMonster(c,x,y,type,dir,t){c.save();c.translate(x,y);c.scale(dir,1);if(type==='thorn'){artPath(c,'#405c4e',[['M',-16,0],['Q',0,-20,-5,-30],['Q',-26,-40,-27,-19],['L',-15,-23],['Q',-5,-16,-8,0],['Z']]);artPath(c,'#718466',[['M',2,0],['Q',10,-15,23,-10],['Q',28,-31,11,-29],['Q',3,-19,2,0],['Z']]);artOval(c,0,-34,16,13,'#785c80',INK,1.4);for(let i=0;i<5;i++){const a=i*1.25;artLine(c,[['M',Math.cos(a)*13,-34+Math.sin(a)*10],['L',Math.cos(a)*21,-34+Math.sin(a)*18]],'#b49bba',3)}artOval(c,4,-34,6,7,'#e6c193');artOval(c,5,-34,2,5,'#3b3144')}else if(type==='sentinel'){artOval(c,0,-28,18,17,'#6f7181',INK,1.4);artOval(c,0,-28,12,11,'#b4a17c',INK,1);artOval(c,3,-28,7,8,'#a5c6c5');artOval(c,5,-28,2.5,6,'#304353');artLine(c,[['M',-20,-28],['Q',0,-49,23,-28],['Q',0,-7,-20,-28]],'#d5bd8f',2);artLine(c,[['M',0,-50],['L',0,-45],['M',0,-11],['L',0,-5]],'#c9b487',2)}else if(type==='specter'){artPath(c,'#60506e',[['M',-16,-34],['Q',-7,-58,12,-42],['Q',16,-16,26,0],['L',13,-5],['L',7,2],['L',-4,-4],['L',-18,0],['Q',-7,-19,-16,-34],['Z']]);artPath(c,'#24283b',[['M',-10,-33],['Q',0,-44,11,-33],['Q',14,-22,0,-19],['Q',-13,-23,-10,-33],['Z']],null);artOval(c,-3,-30,2,1.4,'#d6c1df');artOval(c,7,-30,2,1.4,'#d6c1df');artLine(c,[['M',12,-23],['Q',20,-18,23,-31]],'#b19eba',3)}else{const step=Math.sin(t*15);for(let i=0;i<4;i++)artLine(c,[['M',-12+i*8,-15],['L',-16+i*8+(i%2?step:-step)*4,-2]],'#424051',5);artPath(c,'#625e72',[['M',-19,-24],['Q',-1,-34,15,-22],['L',20,-8],['Q',0,-5,-18,-13],['Z']]);artPath(c,'#716a81',[['M',9,-29],['L',9,-46],['L',19,-37],['L',26,-42],['L',27,-29],['L',37,-22],['Q',29,-14,18,-20],['Z']]);artOval(c,25,-31,2,2,'#e3c397');artPath(c,null,[['M',-17,-21],['Q',-36,-10,-34,-30]],'#676072',6)}c.restore();}

return{setWeapon(id){equippedWeapon=id},hero(c,x,y,hero,dir,action,t,phase=0){visualTime=t;if(hero===3)drawSpitz(c,x,y,1,dir,action,t);else cat(c,x,y,1,[0,2,1][hero],0,dir,action==='run'?t*13:0,action==='run'?'idle':action,phase)},enemy(c,x,y,type,dir,t,state){visualTime=t;if(type==='bogdalina')drawQueen(c,x,y,dir,t,state);else if(['thorn','specter','sentinel','hound'].includes(type))drawMonster(c,x,y,type,dir,t);else if(type==='moth')drawBat(c,x,y,1.25,dir,t);else if(['guard','automaton','sentinel'].includes(type))drawMouse(c,x,y,type==='automaton'?1.65:1.3,dir,t,true);else drawMouse(c,x,y,type==='hound'?1.2:1.1,dir,t,false)},owl(c,x,y,t){visualTime=t;owl(c,x,y,.95)}};
}
