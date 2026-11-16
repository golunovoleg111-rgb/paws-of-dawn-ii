import test from'node:test';import assert from'node:assert/strict';import{existsSync,readFileSync}from'node:fs';import{Renderer}from'../src/renderer.js';
test('the preproduction scene retains the hero and ordinary enemies but never draws a boss illustration',()=>{
 const rendered=[],ctx=new Proxy({},{get:()=>()=>{}}),renderer=Object.create(Renderer.prototype);renderer.c=ctx;renderer.cast={manifest:{actors:{rat:{scale:1}}},hero(...args){rendered.push(['hero',args[3]])},enemy(...args){rendered.push(['enemy',args[3]])},setWeapon(){},setGear(){},setMotion(){},setEnemyMotion(){}};
 const p={x:100,y:628,w:30,h:72,vx:0,vy:0,dir:1,ground:true},enemy={type:'rat',x:250,y:650,w:34,h:50,hp:8,maxHp:8,state:'patrol',dir:1};
 renderer.render({p,hero:0,camera:{x:0,y:400,width:700,height:390,zoom:1.85},save:{weapon:'sword',gear:{},looted:[]},run:{opened:[],revealed:[]},world:{solids:[],ledges:[],objects:[{id:'cp',type:'checkpoint',x:200,y:700}],hazards:[],enemies:[enemy,{...enemy,type:'bogdalina',x:450,boss:true}],clock:1,shots:[]}});
 assert.deepEqual(rendered,[['enemy','rat'],['hero',0]]);
});
test('retired environment painters are absent while their reusable texture sources remain',()=>{
 for(const name of['worldart.js','town-art.js','world-props.js','props.js'])assert.equal(existsSync(new URL('../src/'+name,import.meta.url)),false);
 const renderer=readFileSync(new URL('../src/renderer.js',import.meta.url),'utf8');assert.doesNotMatch(renderer,/new Image\(|worlds-atlas|terrain-v03|cast\.owl/);
 assert.ok(existsSync(new URL('../assets/town-v1/source.png',import.meta.url)));
});
