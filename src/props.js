import{atlasCell,isolateFrame,expandCell}from'./animation.js?v=030';
export class Props{
 constructor(){this.frames=[];this.ready=this.load()}
 async load(){try{const im=new Image();im.src='assets/props-v03.webp';await im.decode();const cv=document.createElement('canvas');cv.width=im.width;cv.height=im.height;const c=cv.getContext('2d',{willReadFrequently:true});c.drawImage(im,0,0);const pixels=c.getImageData(0,0,cv.width,cv.height).data;this.frames=Array.from({length:9},(_,i)=>{const cell=expandCell(atlasCell(i,3,cv.width,cv.height,3),cv.width,cv.height,.05),b=isolateFrame(pixels,cv.width,cell);const out=document.createElement('canvas');out.width=b.maxX-b.minX+1;out.height=b.maxY-b.minY+1;out.getContext('2d').drawImage(im,cell.x+b.minX,cell.y+b.minY,out.width,out.height,0,0,out.width,out.height);return out});return true}catch(e){console.warn('Props unavailable',e.message);return false}}
 draw(c,name,x,y,w,h=null){const i={chest:0,crate:1,campfire:2,checkpoint:3,lava:4,rock:5,puzzle:6,clue:7,shrine:8}[name],p=this.frames[i];if(!p)return false;const height=h??w*p.height/p.width;c.drawImage(p,x-w/2,y-height,w,height);return true}
}
