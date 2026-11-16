import test from'node:test';import assert from'node:assert/strict';
import{hazardState}from'../src/hazards.js';
test('falling damage follows the visible release point, including a moved source',()=>{
 const h={type:'rock',x:300,y:700,w:34,h:30,phase:0,source:{originX:320,originY:460}};
 const release=hazardState(h,1.3);assert.equal(release.box.x,303);assert.equal(release.box.y,460);
 const middle=hazardState(h,1.675);assert.ok(Math.abs(middle.box.y-520)<1e-8);
 const impact=hazardState(h,2.1);assert.equal(impact.box.y,700);assert.equal(impact.active,true);
 h.source.originY=400;assert.equal(hazardState(h,1.3).box.y,400);
 assert.equal(hazardState(h,.8).active,false);assert.equal(hazardState(h,3).active,false);
});
