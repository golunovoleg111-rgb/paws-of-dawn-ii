// Offline equipment orientation, clockwise degrees from upright.
// The complete painted body and original hand pixels never move here.
function weaponAngle(weapon,index,gripForward=0){
 const bow=weapon.includes('bow');
 let angle=bow?0:weapon==='hammer'?72:Math.max(35,Math.min(64,54-gripForward*.24));
 if(index===9)angle=-35;
 if(index===10)angle=70;
 if(index===11)angle=110;
 if(index===22)angle=-20;
 if(index===23)angle=85;
 if((index===12||index>=24&&index<=27)&&!bow)angle=70;
 if(index===13&&!bow)angle=90;
 if(index===15&&!bow)angle=110;
 return angle;
}
module.exports={weaponAngle};
