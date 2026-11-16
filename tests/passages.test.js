import test from'node:test';import assert from'node:assert/strict';
import{closedPassages,sightBlocked}from'../src/passages.js';
import{safeEnemyStep}from'../src/hazards.js';
import{Game}from'../src/engine.js';import{freshSave}from'../src/model.js';
const gate={id:'door',type:'gate',requires:'puzzle',x:300,y:540,w:72,h:160};
test('a closed physical door blocks patrols and sight, solving it opens both',()=>{
 const world={objects:[gate],solids:[{x:0,y:700,w:1000,h:200}],ledges:[],hazards:[]},run={opened:[],destroyed:[],revealed:[],solved:false};
 const enemy={type:'rat',x:250,y:656,w:34,h:44};
 assert.equal(safeEnemyStep(enemy,280,world,run),false);
 assert.equal(sightBlocked(closedPassages(world,run),{x:270,y:650},{x:430,y:650}),true);
 run.solved=true;assert.equal(safeEnemyStep(enemy,280,world,run),true);
 assert.equal(sightBlocked(closedPassages(world,run),{x:270,y:650},{x:430,y:650}),false);
});
test('closed doors stop enemy arrows before they can damage someone on the other side',()=>{
 const game=new Game(freshSave());game.begin(0,false);game.world.objects=[gate];
 game.world.solids=[{x:0,y:700,w:1000,h:200}];game.world.ledges=[];game.world.enemies=[];game.world.hazards=[];
 game.p.x=365;game.p.y=628;game.p.inv=0;const hp=game.p.hp;
 game.world.shots=[{x:365,y:650,w:14,h:14,vx:0,vy:0,t:3,owner:'enemy',damage:2}];
 game.update(1/120);assert.equal(game.p.hp,hp);assert.equal(game.world.shots.length,0);
});
test('line of sight respects finite corners rather than infinite vertical stripes',()=>{
 assert.equal(sightBlocked([gate],{x:240,y:500},{x:420,y:500}),false);
 assert.equal(sightBlocked([gate],{x:240,y:600},{x:420,y:600}),true);
 assert.equal(sightBlocked([gate],{x:240,y:600},{x:240,y:700}),false);
});
