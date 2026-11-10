import{CHAPTERS,ENEMY_TYPES}from'./data.js?v=021';import{seeded}from'./model.js?v=021';
// Authored terrain contours. Deep fronts are solid architecture, not a stream of floating tiles.
const CONTOURS=[
 [[0,900,700],[1000,740,700],[1840,900,620],[2840,800,700],[3750,850,790],[4720,900,700],[5740,900,620],[6750,900,700],[7760,1140,700]],
 [[0,780,740],[880,800,820],[1790,900,740],[2800,700,660],[3600,950,740],[4650,800,820],[5560,900,740],[6580,800,660],[7490,1000,740],[8600,1000,740]],
 [[0,800,1000],[900,780,920],[1790,800,840],[2690,700,760],[3500,920,680],[4540,820,760],[5470,900,840],[6480,800,760],[7400,1000,680],[8520,1480,680]],
 [[0,820,780],[920,800,620],[1820,820,780],[2740,800,620],[3650,900,700],[4660,800,540],[5570,850,700],[6530,820,540],[7460,900,700],[8470,950,620],[9540,1260,620]],
 [[0,900,800],[1000,800,720],[1900,850,800],[2860,800,880],[3780,850,800],[4740,800,720],[5650,850,640],[6620,900,720],[7640,950,800],[8700,1500,800]],
 [[0,920,1040],[1030,850,960],[1990,840,880],[2940,820,960],[3870,950,1040],[4930,850,960],[5900,900,880],[6920,850,800],[7890,950,880],[8960,900,800],[9970,1230,800]],
 [[0,900,800],[1180,840,720],[2300,800,640],[3380,900,720],[4560,900,640],[5740,850,720],[6860,900,640],[8020,950,720],[9250,850,640],[10380,1420,640]],
 [[0,900,980],[1000,800,900],[1900,800,820],[2800,900,740],[3810,800,820],[4720,850,900],[5680,900,820],[6690,850,740],[7650,900,820],[8660,2140,820]],
 [[0,900,950],[1010,800,870],[1920,900,790],[2930,800,870],[3840,900,950],[4860,900,870],[5880,800,790],[6800,900,710],[7820,950,790],[8890,900,710],[9910,2090,710]],
 [[0,950,1050],[1060,900,970],[2140,850,890],[3110,900,810],[4130,950,890],[5200,900,810],[6220,850,730],[7190,950,810],[8260,1000,730],[9390,1000,650],[10520,2280,650]]
];
const ob=(id,type,x,y,extra={})=>({id,type,x,y,...extra});
export function buildWorld(chapter,seed=1){const d=CHAPTERS[chapter],r=seeded(seed+chapter*919),[width,height]=d.size,solids=[],ledges=[],objects=[],enemies=[],hazards=[],anchors=[],zones=[];const terrain=CONTOURS[chapter];terrain.forEach(([x,w,y],i)=>{solids.push({id:'ground'+i,x,y,w,h:height-y+250,kind:'stone',oneWay:false});zones.push({x,end:x+w,y,name:['Окраина','Верхняя улица','Подземная галерея','Сторожевая площадь','Старый мост','Убежище','Внутренний двор','Святилище','Последний переход','Зал стража','Центральная башня'][i%11],index:i});
 // Tall route transitions in the clock factory have intermediate balconies; double jump offers a direct route.
 if(i>0){const prev=terrain[i-1],end=prev[0]+prev[1],gap=x-end;if(prev[2]-y>35&&prev[2]-y<=100)ledges.push({id:'approach'+i,x:end-100,y:prev[2]-55,w:Math.max(200,gap+120),h:34,oneWay:true,kind:'balcony'});if(prev[2]-y>100)ledges.push({id:'step'+i,x:end-50,y:prev[2]-80,w:120,h:26,oneWay:true,kind:'balcony'});if(gap>180&&chapter===6){anchors.push({id:'anchor'+i,x:x+45,y:Math.min(y,prev[2])-130,direction:1},{id:'anchorback'+i,x:end-45,y:Math.min(y,prev[2])-130,direction:-1});}else if(gap>180)ledges.push({id:'bridge'+i,x:end+70,y:Math.min(y,prev[2])-60,w:170,h:28,oneWay:true,kind:chapter===7?'hidden':'bridge',hidden:chapter===7});}
 // Designed side chambers: alternating high and low alcoves, with coins and clues.
 if(i>0&&i<terrain.length-1){const bx=x+Math.min(w-320,260),by=y-85;ledges.push({id:'alcove'+i,x:bx,y:by,w:190+(i%3)*25,h:30,oneWay:true,kind:'balcony'});if(i%2===0){ledges.push({id:'upper'+i,x:bx+180,y:by-85,w:210,h:34,oneWay:true,kind:'balcony'});objects.push(ob('chest'+i,'chest',bx+270,by-85,{fish:45+chapter*8,rarity:i%4===0?'relic':'cache'}))}else objects.push(ob('stash'+i,'stash',bx+80,by,{item:i%3===0?'bomb':'ration'}));}
 if(i>0&&i<terrain.length-1){const type=d.enemies[i%d.enemies.length],t=ENEMY_TYPES[type];for(let k=0;k<(i%3===0?3:2);k++){const ex=x+120+k*180;if(ex>x+w-50)break;enemies.push({id:'enemy'+i+'-'+k,type,x:ex,y:y-(t.h||46)-(t.fly?90:0),w:t.w||36,h:t.h||46,home:ex,homeY:y-(t.h||46)-(t.fly?90:0),left:x+45,right:x+w-45,hp:t.hp,maxHp:t.hp,dir:k%2?1:-1,state:'patrol',timer:r(),cool:1+r(),vy:0,hit:0,elite:chapter>3&&k===0&&i%4===0});}}
 if(i>1&&i<terrain.length-1){const hx=x+w*.7;if(chapter===4)hazards.push({id:'spore'+i,type:'spore',x:hx,y:y-50,w:90,h:50,phase:r()*6});else if(chapter===7||chapter===8)hazards.push({id:'watch'+i,type:'watch',x:hx,y:y-150,w:170,h:150,phase:r()*6});else hazards.push({id:'trap'+i,type:chapter===3?'piston':chapter===6?'wind':'spikes',x:hx,y:y-20,w:65,h:20,phase:r()*6});}
 for(let k=0;k<4;k++)objects.push(ob('fish'+i+'-'+k,'fish',x+90+k*65,y-34,{fish:6+chapter}));
 });
 const supportAt=x=>{const p=solids.find(b=>x>=b.x&&x<=b.x+b.w);return p||solids.reduce((a,b)=>Math.abs(b.x-x)<Math.abs(a.x-x)?b:a)};
 const at=(fraction,type,id,extra={})=>{const b=supportAt(width*fraction),x=Math.max(b.x+50,Math.min(b.x+b.w-60,width*fraction));const a=ob(id,type,x,b.y,extra);objects.push(a);return a};
 objects.push(ob('ori','npc',230,terrain[0][2],{name:'Ори',text:d.intro+(chapter===0?' Дождись вражеского замаха, затем отступи и бей E. Рывок Q даёт короткую неуязвимость. Удерживай S, чтобы проходить низкие проёмы и оставаться незамеченной. Зелье лечения — клавиша 1.':' Осматривай верхние галереи. Запись с подсказкой отмечена свитком; F позволяет её прочитать.')}));at(.14,'shop','trader',{name:'Лавка странника'});at(.44,'campfire','midcamp',{name:'Заброшенный лагерь'});at(.8,'shop','trader2',{name:'Лавка у ворот'});
 for(const fraction of [.25,.5,.77,.9])at(fraction,'checkpoint','checkpoint'+fraction);
 at(.34,'clue','clue',{text:d.clue});at(.56,'puzzle','mainpuzzle',{kind:d.puzzle});
 const seal=at(.69,'gate','puzzlegate',{requires:'puzzle',w:38,h:height+250});seal.y=0;
 if(chapter===1){const o=at(.2,'gate','phasegate',{requires:'phase',w:36,h:height+250});o.y=0}
 if(chapter===5){for(const f of [.18,.39,.73]){const o=at(f,'breakwall','wall'+f,{w:60,h:height+250});o.y=0}}
 if(chapter===7){const b=supportAt(width*.35);ledges.push({id:'scentbridge',x:b.x+b.w-20,y:b.y-90,w:180,h:26,hidden:true,oneWay:true,kind:'hidden'});objects.push(ob('archiveEcho','clue',b.x+b.w+40,b.y-90,{text:d.clue,hidden:true}));}
 if(chapter===4||chapter===2){for(const f of [.19,.32,.47]){const b=supportAt(width*f),xx=b.x+300;const top=ledges.find(a=>a.x>=b.x&&a.x<b.x+b.w);objects.push(ob('ingredient'+f,'ingredient',top?top.x+60:xx,top?top.y:b.y,{name:chapter===4?'Ингредиент':'Осколок линзы'}));}}
 if(chapter===5){const b=supportAt(width*.48);objects.push(ob('crate','crate',b.x+70,b.y,{w:44,h:44,vy:0,spawnX:b.x+70,spawnY:b.y}));objects.push(ob('plate','plate',b.x+220,b.y,{w:80}));}
 // Narrow architectural passage explicitly teaches S. The ceiling is impassable above the gap.
 const low=supportAt(width*.1);if(chapter!==6)solids.push({id:'low-ceiling',x:low.x+low.w-240,y:0,w:150,h:low.y-44,kind:'arch',ceiling:true});
 const last=terrain.at(-1),bossX=last[0]+last[1]*.56,bossY=last[2];enemies.push({id:'boss',type:chapter===9?'bogdalina':chapter%2?'automaton':'guard',x:bossX,y:bossY-(chapter===9?116:78),w:chapter===9?70:58,h:chapter===9?116:78,home:bossX,left:last[0]+100,right:width-200,hp:chapter===9?125:28+chapter*6,maxHp:chapter===9?125:28+chapter*6,dir:-1,state:'sleep',timer:2,cool:1,vy:0,hit:0,boss:true,phase:1});
 objects.push(ob('bosscheckpoint','checkpoint',last[0]+110,bossY));if(d.rescue)objects.push(ob('cage','cage',width-290,bossY,{hero:d.rescue}));objects.push(ob('exit','exit',width-110,bossY));
 // Each chapter carries one run-changing shrine, but rewards cannot be duplicated by respawning.
 at(.39,'shrine','shrine',{seed:seed+chapter*77});
 return{chapter,width,height,solids,ledges,objects,enemies,hazards,anchors,zones,spawn:{x:90,y:terrain[0][2]-72},clock:0,shots:[],fx:[],messages:[],seed,weather:chapter===6?'storm':chapter===1?'rain':chapter===4?'spores':'dust'};
}
export function entityBox(o){if(o.type==='crate')return{x:o.x,y:o.y-o.h,w:o.w,h:o.h};return{x:o.x-22,y:o.y-65,w:44,h:65}}


