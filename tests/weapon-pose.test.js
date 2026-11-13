import test from'node:test';
import assert from'node:assert/strict';
import poses from'../scripts/weapon-pose.cjs';
const {weaponAngle}=poses;
test('carried blades and hammer stay readied above the grip through both gait cycles',()=>{
 const carried=[0,1,2,3,4,5,6,7,8,12,16,17,18,19,24,25,26,27,28,29,30,31];
 for(const weapon of ['sword','sabre','moonblade','hammer'])for(const frame of carried)for(const grip of [-100,-40,0,40,100]){
  const angle=weaponAngle(weapon,frame,grip),tipY=-Math.cos(angle*Math.PI/180);
  assert.ok(tipY<0,`${weapon}, frame ${frame}: tip must be above the hand`);
  if(weapon==='hammer')assert.ok(angle>=65,'heavy head should remain forward of the face');
 }
});
test('carry changes smoothly as a swinging hand passes the hip',()=>{
 for(const weapon of ['sword','sabre','moonblade'])for(let grip=-100;grip<100;grip++)assert.ok(Math.abs(weaponAngle(weapon,0,grip+1)-weaponAngle(weapon,0,grip))<.25);
 for(const weapon of ['bow','royalbow'])for(const frame of [0,8,16,28])assert.equal(weaponAngle(weapon,frame),0);
});
