import test from'node:test';
import assert from'node:assert/strict';
import{Game}from'../src/engine.js';
import{freshSave}from'../src/model.js';
import{buildWorld}from'../src/world.js';
import{restoreCheckpoint,checkpointPosition}from'../src/checkpoints.js';

test('old saves migrate only to a visited surviving checkpoint, never to a point ahead',()=>{
 const world=buildWorld(0,31),points=world.objects.filter(o=>o.type==='checkpoint').sort((a,b)=>a.x-b.x);
 const first=points[0],last=points.at(-1);
 assert.deepEqual(restoreCheckpoint(world,{checkpoint:{x:first.x-100,y:0},opened:[last.id]}),{...world.spawn,id:'spawn'});
 assert.deepEqual(restoreCheckpoint(world,{checkpoint:{x:last.x+100,y:0},opened:[first.id]}),checkpointPosition(first));
 assert.deepEqual(restoreCheckpoint(world,{checkpoint:{id:last.id,x:1,y:1},opened:[last.id]}),checkpointPosition(last));
 assert.deepEqual(restoreCheckpoint(world,{checkpoint:{id:last.id,x:1,y:1},opened:[]}),{...world.spawn,id:'spawn'});
});

test('a healing fire heals once and never creates an extra respawn point',()=>{
 const game=new Game(freshSave());game.begin(0,false);
 const fire=game.world.objects.find(o=>o.type==='campfire'),original={...game.run.checkpoint};
 game.p.x=fire.x-15;game.p.y=fire.y-72;game.p.hp=1;
 game.interact();assert.ok(game.p.hp>1);assert.deepEqual(game.run.checkpoint,original);
 game.p.hp=1;game.interact();assert.equal(game.p.hp,1);assert.deepEqual(game.run.checkpoint,original);
 game.die();assert.equal(game.p.x,original.x);assert.equal(game.p.y,original.y);
});

test('automatic checkpoint activation survives resume and both allowed deaths',()=>{
 const save=freshSave(),game=new Game(save);game.begin(0,false);
 const point=game.world.objects.find(o=>o.type==='checkpoint');
 game.world.enemies=[];game.world.hazards=[];game.p.x=point.x-15;game.p.y=point.y-72;
 game.update(1/120);assert.equal(game.run.checkpoint.id,point.id);
 const expected=checkpointPosition(point),copy=JSON.parse(JSON.stringify(save)),resumed=new Game(copy);
 resumed.begin(0,true);assert.deepEqual(resumed.run.checkpoint,expected);
 for(let i=0;i<2;i++){resumed.die();assert.equal(resumed.p.x,expected.x);assert.equal(resumed.p.y,expected.y)}
 resumed.die();assert.equal(resumed.mode,'defeat');assert.equal(copy.run,null);
});
