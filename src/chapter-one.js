import{ENEMY_TYPES}from'./data.js?v=110';

export const CHAPTER_ONE_REVISION='chapter-one-sketch-01';
const BOUNDS=[0,1350,2600,4000,5400,7000,8100,9550,10850,12400];
const NAMES=['Вход в город','Площадь Ори','Кузница','Строительные леса','Двор гильдий','Запертый проход','Мост и набережная','Караульня','Северные ворота'];
// Built from an empty world. No contours, props or placement passes from the
// retired town generator participate in this chapter.
export function buildChapterOne(seed=1){
 const w={chapter:0,width:12400,height:1500,seed,layoutRevision:CHAPTER_ONE_REVISION,revision:CHAPTER_ONE_REVISION,solids:[],ledges:[],objects:[],enemies:[],hazards:[],anchors:[],architecture:[],staircases:[],links:[],sanctuaries:[],tutorials:[],clock:0,shots:[],fx:[],messages:[],spawn:{x:140,y:688},weather:'dust',zones:NAMES.map((name,index)=>({id:'district-'+(index+1),index,x:BOUNDS[index],end:BOUNDS[index+1],y:760,name}))};
 const block=(id,x,y,width,height,kind='ground',extra={})=>{const b={id,x,y,w:width,h:height,kind,oneWay:false,owner:id,...extra};w.solids.push(b);return b};
 const ledge=(id,x,y,width,extra={})=>{const b={id,x,y,w:width,h:18,kind:'roof',oneWay:true,owner:id,supportY:760,...extra};w.ledges.push(b);return b};
 const obj=(id,type,x,y=760,extra={})=>{const o={id,type,x,y,...extra};w.objects.push(o);return o};
 const art=(id,type,x,y,width,height,extra={})=>{const a={id,type,x,y,w:width,h:height,supportY:y+height,layer:'back',...extra};w.architecture.push(a);return a};
 const safe=(id,x,y,width,height=150)=>w.sanctuaries.push({id,x,y:y-125,w:width,h:height,protectAll:true});
 const stairs=(id,x,width,high,low,direction=1,material='wood')=>{
  const count=Math.ceil((low-high)/12),step=width/count,flight={id,x,w:width,high,low,direction,material,count,owner:id};w.staircases.push(flight);
  for(let i=0;i<count;i++){const y=direction>0?low-(low-high)*(i+1)/count:high+(low-high)*i/count;ledge(id+'-tread-'+i,x+i*step,y,step+.15,{h:7,kind:'stairs',material,stairGroup:id,townGroup:id,owner:id,supportY:low,optional:true,authoredStair:true})}
  const leftY=direction>0?low:high,rightY=direction>0?high:low;
  obj(id+'-left','stair',x-20,leftY,{name:'Лестница',group:id,end:'left'});obj(id+'-right','stair',x+width+20,rightY,{name:'Лестница',group:id,end:'right'});
  art(id,'stairs',x,high,width,low-high,{material,collisionIds:w.ledges.filter(b=>b.stairGroup===id).map(b=>b.id)});return flight;
 };
 const door=(id,x,floor,requires='puzzle',height=160,wallTop=floor-470)=>{
  const o=obj(id,'gate',x,floor-height,{w:84,h:height,requires,name:'Решётка',door:{floorY:floor,openingHeight:height,wallTop,wallThickness:126,frameId:'frame-'+id,style:'guild-gate'}});
  block('lintel-'+id,x-21,wallTop,126,o.y-wallTop,'door-lintel',{supportsDoor:id,owner:'frame-'+id});
  art('frame-'+id,'gatehouse',x-140,wallTop,364,floor-wallTop,{gateId:id,walkY:null,openingX:x,openingY:o.y,openingW:o.w,openingH:height});return o;
 };
 const enemy=(id,type,x,floor,left,right,post,extra={})=>{const d=ENEMY_TYPES[type],h=d.h||50,width=d.w||36;w.enemies.push({id,type,x,y:floor-h,w:width,h,home:x,homeY:floor-h,left,right,hp:d.hp,maxHp:d.hp,dir:-1,state:'patrol',timer:0,cool:1.3,vy:0,hit:0,post,context:post,...extra})};
 // A hollow canal and a covered cellar are actual spaces, not deep solid slabs.
 block('ground-west',0,760,6380,990);block('ground-cellar',6380,940,520,810);block('ground-guild-east',6900,760,1200,990);
 ledge('cellar-ceiling',6370,760,540,{kind:'bridge',material:'stone',supportY:940,owner:'guild-cellar'});
 block('ground-canal',8100,940,1450,810);block('ground-east',9550,760,2850,990);
 ledge('bridge-west',8070,760,440,{kind:'bridge',material:'wood',supportY:940,owner:'canal-bridge'});ledge('bridge-east',8594,760,970,{kind:'bridge',material:'wood',supportY:940,owner:'canal-bridge'});
 art('entry-arch','gatehouse',20,310,310,450,{openingX:116,openingY:580,openingW:94,openingH:180});
 art('entry-house','merchant',680,420,410,340,{walkY:520});
 block('entry-wagon-body',720,614,170,102,'wagon',{ceiling:true,owner:'entry-wagon'});art('entry-wagon','cart',685,578,260,182,{collisionIds:['entry-wagon-body']});
 stairs('entry-bypass-up',430,250,520,760,1,'stone');ledge('entry-roof',680,520,410,{owner:'entry-house',supportY:760});stairs('entry-bypass-down',1090,240,520,760,-1,'stone');
 art('ori-house','merchant',1630,424,440,336,{walkY:480});ledge('ori-roof',1640,480,420,{owner:'ori-house'});stairs('market-roof-up',1360,280,480,760);stairs('market-roof-down',2060,290,480,760,-1);
 obj('trader','shop',1845,760,{name:'Лавка Ори',merchant:'ori',speaker:'Ори',dialogue:'Ори прячет последние припасы под прилавком. «Северные ворота захлопнули по приказу Богдалины. Цепь решётки уходит во двор гильдий. Мастера оставили порядок печатей в своей записи. Не верь каждому проходу: каменщицкая улица завалена, а ремонтный настил над каналом ещё не окончен».',checkpoint:false});safe('market-refuge',1580,760,570);
 obj('market-roof-cache','chest',1920,480,{fish:48,context:'Спрятанный запас портного'});
 art('forge-house','workshop',2840,390,790,370,{walkY:570});ledge('forge-gallery',2900,570,730,{kind:'roof',owner:'forge-house'});stairs('forge-yard-up',2690,210,570,760);stairs('forge-yard-down',3630,240,570,760,-1);
 art('forge-furnace','forge',3160,442,185,128,{floorY:570});
 w.hazards.push({id:'forge-pour',type:'lava',x:3170,y:558,w:86,h:12,noTelegraph:true,context:'Расплав из литейной печи в приёмный жёлоб',source:{id:'forge-furnace',type:'furnace-conduit',originX:3213,originY:558,floorY:570,x:3160,y:442,w:185,h:128,visible:true,attachedTo:{kind:'furnace',id:'forge-house'},supportId:'forge-gallery'}});
 obj('forge-cache','chest',3510,570,{fish:62,context:'Запас за горячим жёлобом'});enemy('forge-watch','raider',2980,760,2790,3190,'Дозор у реквизированной кузницы');enemy('forge-archer','archer',3450,760,3350,3690,'Стрелок охраняет выход из мастерской');enemy('market-watch','rat',2430,760,2300,2540,'Сборщик дани у дальней границы рынка');
 art('mason-house','workshop',4300,480,700,280,{walkY:540});block('mason-street-collapse',4550,540,190,220,'rubble',{owner:'mason-house',context:'Рухнувшая кладка перекрыла улицу'});
 stairs('mason-bypass-up',4170,310,540,760);ledge('mason-roof',4480,540,520,{owner:'mason-house'});stairs('mason-bypass-down',5000,320,540,760,-1);
 art('mason-scaffold','scaffold',4350,430,250,330,{hazardId:'mason-rubble'});
 w.hazards.push({id:'mason-rubble',type:'rock',x:4440,y:730,w:34,h:30,phase:.4,noTelegraph:true,context:'Осыпь повреждённого карниза над ремонтными лесами',source:{id:'mason-scaffold',type:'scaffold',originX:4457,originY:450,floorY:760,x:4350,y:430,w:250,h:330,visible:true,attachedTo:{kind:'roof',id:'mason-house'},supportId:'ground-west'}});
 obj('mason-deadend-cache','stash',4250,760,{item:'ration',context:'Оставленная сумка перед непроходимым завалом'});enemy('mason-looter','rat',4090,760,4020,4150,'Мародёр обыскивает край завала');enemy('mason-roof-watch','rat',4790,540,4770,4950,'Дозор на крыше каменщика');
 art('guild-reading-house','merchant',5720,454,430,306,{walkY:520});stairs('guild-clue-up',5430,290,520,760,1,'stone');ledge('guild-reading-balcony',5720,520,430,{owner:'guild-reading-house'});stairs('guild-clue-down',6150,280,520,760,-1,'stone');
 obj('checkpoint0.5','checkpoint',5840,760,{name:'Ниша двора гильдий',role:'midpoint',checkpoint:true});safe('guild-checkpoint',5360,760,800);
 obj('clue','clue',5950,520,{name:'Запись городского звонаря',mechanismClue:true,text:'В тетради перечислены цеховые печати: фонарщики — III, портные — I, кузнецы — IV, каменщики — II. На обороте записано: «Открывая северную решётку, ставь печати в порядке вечернего звона: III · I · IV · II». Запись можно перечитать в этой нише.'});
 obj('mainpuzzle','puzzle',6680,760,{name:'Привод цеховой решётки',kind:'dials',requiresClue:true});
 stairs('guild-cellar-down',6405,220,760,940,-1,'stone');stairs('guild-cellar-up',6650,220,760,940,1,'stone');obj('guild-cellar-cache','chest',6640,940,{fish:58,context:'Запечатанный запас в тупике под архивом'});
 obj('shrine','shrine',6880,760,{seed:seed+77});safe('guild-mechanism',6520,760,430);
 door('puzzlegate',7460,760);w.links.push({id:'guild-counterweight',type:'chain',from:'mainpuzzle',to:'puzzlegate',y:620});
 enemy('gate-west-watch','guard',7190,760,7080,7350,'Щитоносец у закрытого пропускного пункта');enemy('gate-east-watch','rat',7840,760,7720,7980,'Дозор за городской решёткой');safe('gate-threshold',7380,760,250);
 art('canal-bridge','bridge',8070,760,1500,180,{floorY:760,waterY:940,gap:[8510,8594]});stairs('canal-west-descent',8160,300,760,940,-1,'stone');stairs('canal-east-ascent',9190,340,760,940,1,'stone');
 door('drain-gate',8780,940,'switch',160,760);obj('drain-wheel','lever',9020,760,{name:'Ворот водосброса',controls:'drain-gate'});obj('canal-cache','chest',8920,940,{fish:74,context:'Тайник за закрытым водосбросом'});obj('canal-west-stash','stash',8670,940,{item:'ration',context:'Брошенные припасы у тупика решётки'});
 enemy('canal-lower-watch','rat',8580,940,8500,8730,'Крысолов собирает утонувшие припасы');enemy('bridge-watch','archer',9290,760,9100,9460,'Дозор переправы');
 art('watchhouse','watchhouse',9820,360,480,400,{walkY:435});obj('bosscheckpoint','checkpoint',9950,760,{name:'Укрытие караульни',role:'boss-approach',checkpoint:true});obj('midcamp','campfire',10230,760,{name:'Остывающий караульный очаг',healOnly:true,checkpoint:false});safe('watchhouse-refuge',9690,760,770);
 obj('shortcut-far','shortcut',10400,760,{name:'Служебный проход во двор',key:'watchhouse-shortcut',opensFromHere:true,to:{x:6810,y:688},context:'Крытый служебный переулок за фасадами'});
 obj('shortcut-near','shortcut',6810,760,{name:'Дверь служебного переулка',key:'watchhouse-shortcut',opensFromHere:false,to:{x:10370,y:688},context:'Вход открывается со стороны караульни'});safe('guild-shortcut',6750,760,210);
 enemy('watchhouse-outer-watch','raider',10680,760,10520,10800,'Дозор перед внешним караульным двором');
 art('northern-gate','gatehouse',11680,240,570,520,{gateId:'north-gate',openingX:11860,openingY:570,openingW:150,openingH:190});
 enemy('boss','guard',11530,760,11160,11900,'Комендант северного пропускного пункта',{boss:true,name:'Комендант северных ворот',hp:34,maxHp:34,w:50,h:76,y:684,state:'sleep',phase:1});
 obj('north-gate','gate',11860,570,{w:150,h:190,requires:'boss',door:{floorY:760,openingHeight:190,wallTop:240,wallThickness:192,frameId:'northern-gate'}});block('lintel-north-gate',11839,240,192,330,'door-lintel',{supportsDoor:'north-gate'});
 obj('exit','exit',12240,760,{name:'Дорога к акведуку'});safe('north-exit',12000,760,400);safe('entry-refuge',0,760,360);
 const fish=(id,x,y,value=7)=>obj(id,'fish',x,y,{fish:value});for(const [i,x]of[320,390,470,970,1160,1430,2180,2600,2720,3860,4020,5230,5370,5830,7080,7960,8230,8420,8660,8860,9610,10780,11020,11980].entries())fish('c1-fish-'+i,x,726);for(const [i,x,y]of[[0,1800,446],[1,3040,536],[2,4930,506],[3,5820,486],[4,8520,906]])fish('c1-branch-fish-'+i,x,y,10);
 w.tutorials=[{id:'entry-controls',x:210,end:340,title:'Город после осады',text:'Двигайся стрелками или A / D. Пробел — прыжок, S — пригнуться. Перед тобой два пути: проход под повозкой и каменная лестница к верхней улице. Подойди к началу лестницы и нажми F, затем двигайся вдоль ступеней.'},{id:'market-window',x:1530,end:1590,title:'Тихая площадь',text:'Подойди к лавке Ори и нажми F. На площади можно спокойно подготовиться. Противники караулят дальние выходы, а не место разговора.'},{id:'forge-combat',x:2630,end:2690,title:'Дозор у кузницы',text:'E — атака, Q — особый приём. Дождись завершения вражеского удара, затем отвечай. В мастерской есть обход и припасы, но раскалённый жёлоб действительно обжигает.'}];
 const distantHouses=[[340,310,255],[1160,300,290],[2220,340,315],[2580,300,325],[3800,320,345],[5100,290,300],[6350,390,300],[6970,320,345],[7700,360,310],[9580,330,345],[10390,350,370],[10900,380,330],[11370,300,315]];
 w.architecture.unshift(...distantHouses.map(([x,width,height],i)=>({id:'rear-house-'+i,type:i%3===0?'workshop':'merchant',x,y:760-height-30,w:width,h:height,supportY:730,layer:'back',decorative:true})));
 for(const x of[160,1250,1600,2120,2690,3900,5320,5590,6310,6960,7350,7710,9610,9850,10220,11000,11930,12200])art('street-lamp-'+x,'lantern',x,610,38,150);
 art('guild-link','chain',6710,620,750,10,{x2:7500,y2:590});
 const frontage=(id,x,end,profile)=>({id,x,y:Math.min(...profile.map(p=>p[1])),w:end-x,h:760-Math.min(...profile.map(p=>p[1])),groundY:760,profile:profile.map(([x,y])=>({x,y})),openings:[]});
 w.frontages=[
 frontage('entry-city-wall',-240,1350,[[-240,350],[20,350],[20,310],[330,310],[330,470],[680,470],[1090,470],[1350,520]]),
 frontage('market-terrace',1350,2600,[[1350,520],[1580,520],[1580,425],[2070,425],[2070,520],[2600,520]]),
 frontage('forge-front',2600,4000,[[2600,560],[2820,560],[2820,550],[3640,550],[3640,570],[4000,570]]),
 frontage('mason-front',4000,5400,[[4000,560],[4300,560],[4300,520],[5000,520],[5000,560],[5400,560]]),
 frontage('guild-front',5400,7000,[[5400,550],[5700,550],[5700,470],[6150,470],[6150,540],[7000,540]]),
 frontage('guild-gate-wall',7000,8100,[[7000,420],[7230,420],[7230,290],[7700,290],[7700,420],[8100,420]]),
 frontage('watchhouse-front',9550,10850,[[9550,500],[9820,500],[9820,360],[10300,360],[10300,510],[10850,510]]),
 frontage('north-city-wall',10850,12500,[[10850,480],[11300,480],[11300,310],[11680,310],[11680,240],[12250,240],[12250,390],[12500,390]])
 ];
 for(const f of w.frontages){for(const a of w.architecture.filter(a=>a.type==='gatehouse'&&a.openingX>=f.x&&a.openingX+a.openingW<=f.x+f.w)){f.openings.push({id:a.id,x:a.openingX,y:a.openingY,w:a.openingW,h:a.openingH})}for(const o of w.objects.filter(o=>o.type==='shortcut'&&o.x>=f.x&&o.x<f.x+f.w))f.openings.push({id:o.id,x:o.x-36,y:o.y-135,w:72,h:135});}
 w.routes={main:['entry','market','forge','mason-roof','guild-court','puzzlegate','bridge','watchhouse','north-court'],branches:['market-roof','forge-gallery','guild-reading-balcony','guild-cellar','canal-bank'],deadEnds:['mason-street-collapse','drain-gate'],shortcut:['shortcut-near','shortcut-far']};
 w.routeNotes={main:'Улица, обход разрушенного дома, двор гильдий, пропускной пункт, мост, караульня и северные ворота',optional:'Крыша рынка, горячий двор кузницы, читальная галерея, подвальный запас и нижняя набережная',hazards:'Расплав внутри литейного двора и осыпь реального повреждённого карниза'};
 for(const h of w.hazards)h.source.context=h.context;w.doorways=w.objects.filter(o=>o.type==='gate').map(o=>({id:o.door.frameId,gateId:o.id,openingX:o.x,openingY:o.y,openingW:o.w,openingH:o.h}));
 w.restPolicy={checkpointIds:['checkpoint0.5','bosscheckpoint'],shopId:'trader',campfires:'healing-only',merchant:'ori'};
 return w;
}
