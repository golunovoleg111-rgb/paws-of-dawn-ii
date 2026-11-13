import test from 'node:test';import assert from 'node:assert/strict';
import {strideAdvance} from '../src/motion.js';
import{Game}from'../src/engine.js';import{freshSave}from'../src/model.js';
test('A/D and arrows face and travel in the requested direction',()=>{for(const[key,dir]of[['KeyA',-1],['ArrowLeft',-1],['KeyD',1],['ArrowRight',1]]){const g=new Game(freshSave());g.begin(0,false);g.world.enemies=[];g.world.hazards=[];for(let i=0;i<40;i++)g.update(1/60);const x=g.p.x;g.keys[key]=true;for(let i=0;i<12;i++)g.update(1/60);assert.equal(g.p.dir,dir);assert.ok((g.p.x-x)*dir>0);assert.ok(g.p.stride>0)}});
