// First chapter: an authored town, with named streets and architecture that owns
// its collision surfaces. The other chapters deliberately keep their baseline.
const REVISION='town-streets-1';
const ROOFS=[
 {id:'haberdasher',type:'merchant',x:1280,y:450,w:350,ground:700,label:'Дом лунного портного',stairs:[930,350,700,1]},
 {id:'smithy',type:'workshop',x:2150,y:430,w:400,ground:620,label:'Кровля кузницы',stairs:[1850,300,620,1]},
 {id:'apothecary',type:'merchant',x:3100,y:450,w:370,ground:700,label:'Балкон аптекаря',stairs:[2800,300,700,1]},
 {id:'mason',type:'workshop',x:4100,y:600,w:340,ground:790,label:'Мастерская каменщика',stairs:[3760,340,790,1]},
 {id:'watchhouse',type:'workshop',x:6030,y:435,w:420,ground:620,label:'Кровля старой караулки',stairs:[6450,320,700,-1]},
 {id:'inn',type:'merchant',x:7040,y:490,w:360,ground:700,label:'Терраса постоялого двора',stairs:[6750,290,700,1]}
];
const NAMES=['Площадь фонарщика','Улица портных','Кузнечный подъём','Аптекарский квартал','Двор каменщика','Площадь четырёх гильдий','Караульная терраса','Постоялый двор','Северные ворота'];

// Step assistance is exclusive to authored risers. Optional open flights are
// entered by jumping onto them; walking below one must not pull the hero up.
export function stepUpStairs(p,b,blocks){
 const rise=p.y+p.h-b.y;
 if(b.kind!=='stairs'||!p.ground||Math.abs(p.vx)<.01||rise<=0||rise>16||b.optional&&p.stairRoute!==b.townGroup)return false;
 const candidate={x:p.x,y:b.y-p.h,w:p.w,h:p.h};
 const overlaps=(a,b)=>a.x<b.x+b.w&&a.x+a.w>b.x&&a.y<b.y+b.h&&a.y+a.h>b.y;
 if(blocks.some(a=>a!==b&&!a.oneWay&&overlaps(candidate,a)))return false;
 p.y=candidate.y;p.vy=0;return true;
}

function staircase(world,{id,x,w,high,low,direction=1,optional=false,label}){
 const rise=low-high,count=Math.max(1,Math.ceil(rise/12)),step=w/count,collisionIds=[];
 for(let i=0;i<count;i++){
  const y=direction>0?low-rise*(i+1)/count:high+rise*i/count;
  const b={id:id+'-step'+i,x:x+i*step,y,w:step+.25,h:optional?8:world.height+200-y,oneWay:optional,kind:'stairs',structure:optional?'wood-stair':'stone-stair',supportY:low,townGroup:id,optional,townOwned:true};
  (optional?world.ledges:world.solids).push(b);collisionIds.push(b.id);
 }
 world.architecture.push({id,type:'stairs',x,y:high,w,h:rise+(optional?16:45),walkY:high,supportY:low,rise,direction,material:optional?'wood':'stone',optional,collisionIds,label,layer:'back'});
}

export function authorTown(world){
 if(world.chapter!==0||world.layoutRevision===REVISION)return world;
 world.layoutRevision=REVISION;
 world.architecture=[];
 const ground=world.solids.filter(b=>b.id?.startsWith('ground')).sort((a,b)=>a.x-b.x);
 const low=world.solids.find(b=>b.id==='low-ceiling');
 world.solids=[...ground,...(low?[low]:[])];
 world.ledges=[];

 // The road is a single built embankment. Level changes are masonry stairs,
 // with solid foundations, rather than mandatory jumps across arbitrary gaps.
 for(let i=1;i<ground.length;i++){
  const left=ground[i-1],right=ground[i],x=left.x+left.w,gap=right.x-x;
  if(gap<=0)continue;
  if(left.y===right.y){
   const id='town-paving'+i;
   world.solids.push({id,x:x-.5,y:left.y,w:gap+1,h:world.height+200-left.y,kind:'street',oneWay:false,townOwned:true});
  }else staircase(world,{id:'town-rise'+i,x:x-.5,w:gap+1,high:Math.min(left.y,right.y),low:Math.max(left.y,right.y),direction:left.y>right.y?1:-1,label:'Каменный лестничный подъём'});
 }

 // Rooftop excursions are individually placed, not alternating alcove copies.
 // The open timber flights do not close the pedestrian street underneath.
 for(const roof of ROOFS){
  const roofId='town-roof-'+roof.id,top=roof.y-(roof.type==='merchant'?40:16);
  world.ledges.push({id:roofId,x:roof.x,y:roof.y,w:roof.w,h:18,oneWay:true,kind:'roof',structure:'building',supportY:roof.ground,townOwned:true,label:roof.label});
  world.architecture.push({id:'town-house-'+roof.id,type:roof.type,x:roof.x,y:top,w:roof.w,h:roof.ground-top,walkY:roof.y,supportY:roof.ground,collisionIds:[roofId],label:roof.label,layer:'back'});
  const [x,w,low,direction]=roof.stairs;
  staircase(world,{id:'town-stair-'+roof.id,x,w,high:roof.y,low,direction,optional:true,label:'Наружная деревянная лестница'});
 }

 // Reward IDs survive the layout revision, so old loot cannot be farmed again.
 const places={stash1:[1460,450,'town-roof-haberdasher'],chest2:[2380,430,'town-roof-smithy'],stash3:[3290,450,'town-roof-apothecary'],chest4:[4290,600,'town-roof-mason'],stash5:[5350,700,'ground5'],chest6:[6260,435,'town-roof-watchhouse'],stash7:[7240,490,'town-roof-inn']};
 for(const o of world.objects){if(places[o.id]){[o.x,o.y,o.supportId]=places[o.id]}if(o.id==='ori'){o.x=190;o.y=700;o.text+=' Под повозкой впереди можно проползти на S. На крыши ведут наружные лестницы: запрыгни на деревянный марш, затем двигайся к верхней площадке. У кузницы не наступай на стражевое заграждение, у строительных лесов следи за осыпающимся кирпичом.'}if(o.id==='trader'){o.x=430;o.y=700;o.name='Лавка на площади фонарщика'}if(o.id==='checkpoint0.5'){o.x=4800;o.y=700}if(o.id==='clue'){o.name='Оттиск с городского колокола';o.mechanismClue=true;o.text='У аптекарского дома приколот сургучный оттиск из старой звонницы. На ободе: III · I · IV · II. Это порядок четырёх цеховых печатей на замке северной решётки. До осады горожане звонили так, когда открывали дорогу к акведуку.'}}
 // Readable world information has no collision or reward. Unlike the actual
 // bell imprint, these plaques must not reveal the mechanism's code.
 world.architecture.push(
  {id:'town-plaza-lantern',type:'lantern',x:35,y:550,w:46,h:150,label:'Фонарь площади',layer:'back'},
  {id:'town-entry-waypost',type:'waypost',x:260,y:590,w:44,h:110,label:'Под повозкой — S',boards:['S · низкий проход','Крыши — с лестниц'],clueId:'town-entry-plaque',layer:'back'},
  {id:'town-guild-waypost',type:'waypost',x:4720,y:582,w:48,h:118,label:'Площадь четырёх гильдий',boards:['Совет четырёх гильдий','Северные ворота →'],clueId:'town-guild-charter',layer:'back'}
 );
 world.objects.push(
  {id:'town-entry-plaque',type:'clue',x:282,y:700,supportId:'ground0',architectureId:'town-entry-waypost',mechanismClue:false,name:'Знак дорожной службы',text:'Проезд перекрыла грузовая повозка. Колёса и обломки удерживают кузов над мостовой: под серединой осталось место, чтобы проползти. Удерживай S до выхода с другой стороны. Деревянные наружные лестницы ведут на крыши: запрыгни на нижний марш пробелом и двигайся к площадке. По самой улице можно идти дальше без подъёма на крыши.'},
  {id:'town-guild-charter',type:'clue',x:4744,y:700,supportId:'ground5',architectureId:'town-guild-waypost',mechanismClue:false,name:'Устав четырёх гильдий',text:'Северная решётка принадлежит городу, а не королеве. Её замок хранит четыре цеховые печати: I — портные, II — каменщики, III — фонарщики, IV — кузнецы. Когда совет велел открывать дорогу, звонарь отбивал порядок печатей на городском колоколе. На площади впереди стоит привод замка; ищи у аптекарского дома оттиск с обода колокола. Крыши дают обходы патрулей и тайники, но запертую решётку ими не обойти.'}
 );
 for(let i=0;i<ROOFS.length;i++){const r=ROOFS[i];world.objects.push({id:'town-roof-fish'+i,type:'fish',x:r.x+r.w-50,y:r.y-34,fish:8,supportId:'town-roof-'+r.id})}

 // The tutorial crawlspace is the bed of a collapsed freight wagon. Its
 // collision stays unchanged, so an old checkpoint remains valid.
 if(low){low.kind='wagon';low.townOwned=true;low.context='Обрушенная грузовая повозка';world.architecture.push({id:'town-wagon',type:'cart',x:570,y:535,w:330,h:165,supportY:700,collisionIds:[low.id],label:'Под обрушенной повозкой — низкий проход',layer:'back'})}

 // Street defenses belong to the guard; falling rubble belongs to a damaged
 // construction site. Their sources follow hazard IDs after safety relocation.
 world.hazards=[
  {id:'trap2',type:'piston',x:2640,y:600,w:65,h:20,phase:0,origin:'guard-barricade',context:'Выдвижное стражевое заграждение',readable:true},
  {id:'trap4',type:'rock',x:4510,y:762,w:34,h:30,phase:1.1,origin:'scaffold',context:'Осыпается кладка мастерской',readable:true},
  {id:'trap5',type:'piston',x:5480,y:680,w:65,h:20,phase:2.4,origin:'guard-barricade',context:'Охрана площади гильдий',readable:true},
  {id:'trap7',type:'rock',x:7510,y:672,w:34,h:30,phase:3.2,origin:'scaffold',context:'Повреждённые строительные леса',readable:true}
 ];
 for(const h of world.hazards)if(h.type==='rock')world.architecture.push({id:'town-source-'+h.id,type:'scaffold',x:h.x+17-230*.57,y:h.y+28-250,w:230,h:250,hazardId:h.id,label:h.context,layer:'back'});
 for(let i=0;i<world.zones.length;i++){world.zones[i].name=NAMES[i];world.zones[i].end=ground[i+1]?.x??world.width}
 world.routeNotes={main:'Непрерывная улица с каменными подъёмами',optional:'Наружные лестницы, балконы и крыши домов',hazards:'Стражевые заграждения и разрушающаяся кладка'};
 return world;
}
