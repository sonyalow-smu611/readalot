// AI-assisted pixel-art layout — review/credit under PROJECT.md and AI_USAGE.md.
// Drawn entirely with Readalot's existing town/salon pixel helpers (no image assets).
// Single 1200 × 600 scene: never rearrange or remove furniture for a narrow viewport.
import { E, P, R, mk } from '@/lib/avatar/draw.js'

export const CAFE_DESKTOP = Object.freeze({ width: 1200, height: 600 })
const W = CAFE_DESKTOP.width
const H = CAFE_DESKTOP.height
const C = {
  ink: '#33282a', border: '#5a4032', wall: '#e9c9a2', wallLight: '#f4ddbb',
  wood: '#a76e46', woodDark: '#714b35', woodLight: '#d6a06e', floor: '#ca9465',
  cream: '#fff4d9', darkGreen: '#235541', green: '#36755c', greenLight: '#67977a',
  leaf: '#689d59', leafLight: '#94b76b', gold: '#f5d18c', pink: '#d99286',
}
const rect = (x, a, b, w, h, col, edge=C.border) => {
  R(x,a-2,b-2,w+4,h+4,edge)
  R(x,a,b,w,h,col)
}
const oval = (x,a,b,rx,ry,c) => E(x,a,b,rx,ry,c)
const line = (x,a,b,w,h,c) => R(x,a,b,w,h,c)
function label(x,txt,cx,cy,size=11,color=C.cream) {
  x.font = `bold ${size}px monospace`
  x.fillStyle = color
  x.textAlign = 'center'
  x.fillText(txt,cx,cy)
}
function plant(x,cx,by,scale=1) {
  rect(x,cx-8*scale,by-17*scale,16*scale,17*scale,'#a76c50')
  line(x,cx-2*scale,by-38*scale,4*scale,25*scale,'#3c7448')
  for(const [dx,dy,r] of [[-13,-36,12],[12,-40,12],[0,-47,13],[-5,-25,9],[12,-27,8]]) {
    oval(x,cx+dx*scale,by+dy*scale,r*scale,7*scale,C.darkGreen)
    oval(x,cx+(dx-2)*scale,by+(dy-2)*scale,(r-2)*scale,5*scale,C.leaf)
    P(x,cx+(dx-3)*scale,by+(dy-4)*scale,C.leafLight)
  }
}
function hangingPlant(x,cx,top,scale=1) {
  line(x,cx,top,2,20*scale,C.border)
  rect(x,cx-10*scale,top+19*scale,22*scale,11*scale,'#ac7652')
  for(const [dx,dy] of [[-10,26],[10,33],[0,37],[-16,39]]) {
    oval(x,cx+dx*scale,top+dy*scale,8*scale,5*scale,C.darkGreen)
    oval(x,cx+(dx-2)*scale,top+(dy-2)*scale,6*scale,4*scale,C.leaf)
  }
}
function light(x,cx,top) {
  line(x,cx,top,3,30,C.ink)
  oval(x,cx+2,top+31,15,8,C.ink)
  oval(x,cx+2,top+29,13,6,C.green)
  line(x,cx-8,top+35,21,3,C.gold)
  for(const dx of [-9,-3,4,10]) P(x,cx+dx,top+39,'#fff1c0')
}
function windowPane(x,a,b,w,h,{scene,night}) {
  rect(x,a,b,w,h,'#674935',C.ink)
  const ix=a+7, iy=b+7, iw=w-14, ih=h-15
  line(x,ix,iy,iw,ih,night?'#283b57':scene==='rain'?'#91adbb':'#8bcada')
  x.save()
  x.beginPath();x.rect(ix,iy,iw,ih);x.clip()
  if(night) {
    oval(x,ix+iw*.72,iy+ih*.2,13,13,'#fff0b2')
    for(let i=0;i<17;i++) P(x,ix+6+i*31%(iw-9),iy+7+i*23%Math.max(8,ih-45),'#ffe9aa')
  } else if(scene==='sunny') {
    oval(x,ix+iw*.77,iy+ih*.21,18,18,'#f8d17d')
    oval(x,ix+iw*.75,iy+ih*.18,12,12,'#fff0b1')
  }
  if(scene!=='sunny'||night) for(const frac of [.25,.68]) {
    const cx=ix+iw*frac,cy=iy+ih*(frac<.5?.23:.34)
    const cloud=night?'#8296ac':scene==='rain'?'#cbd9dd':'#fff4ed'
    oval(x,cx,cy,24,7,cloud);oval(x,cx-10,cy-4,12,9,cloud);oval(x,cx+11,cy-6,14,9,cloud)
  }
  for(let i=0;i<11;i++) {
    const sx=ix+i*iw/11, sh=39+(i*7)%19
    line(x,sx,iy+ih-sh-7,Math.ceil(iw/12),sh+9,night?'#48617d':'#80a2ae')
    for(let row=0;row<3;row++) P(x,sx+3,iy+ih-sh+row*10,night?'#f6da91':'#d8e7eb')
  }
  oval(x,ix+iw*.21,iy+ih+4,iw*.50,ih*.22,night?'#305749':'#72aa72')
  oval(x,ix+iw*.88,iy+ih+3,iw*.45,ih*.24,night?'#285441':'#65a069')
  if(scene==='rain') for(let i=0;i<49;i++) {
    const rx=ix+5+(i*31)%(iw-10), ry=iy+4+(i*47)%(ih-11)
    line(x,rx,ry,2,8,'#e7eff2')
  }
  x.restore()
  line(x,a+w/2-3,b+5,6,h-8,C.cream)
  line(x,a+5,b+h*.55,w-10,5,C.cream)
  line(x,a+9,b+8,4,18,'#fff9ec')
  line(x,a-6,b+h-9,w+12,9,C.woodLight)
  line(x,a-6,b+h-10,w+12,3,C.woodDark)
}
function bookcase(x,a,b,w,h) {
  rect(x,a,b,w,h,C.woodDark,C.ink)
  line(x,a+5,b+5,w-10,h-10,'#503b2d')
  const colors=['#c87869','#8db29e','#e7c577','#9e8cb1','#79ae7b','#c88e66']
  for(let row=0;row<Math.floor((h-8)/29);row++) {
    const baseline=b+28+row*29
    for(let col=0;col<Math.floor((w-12)/10);col++) {
      const bh=12+(col*3+row*5)%10, bx=a+7+col*10
      line(x,bx-1,baseline-bh,8,bh+1,C.ink)
      line(x,bx,baseline-bh+1,6,bh-1,colors[(col+row)%colors.length])
      if(col%3===0) P(x,bx+2,baseline-bh+3,C.cream)
    }
    line(x,a+4,baseline+1,w-8,4,C.woodLight)
  }
}
function mug(x,cx,cy) {
  oval(x,cx,cy+7,10,4,'#4b342b')
  rect(x,cx-7,cy-6,13,12,'#fff5e2')
  oval(x,cx,cy-5,5,2,'#8a5941')
  line(x,cx+7,cy-4,5,3,C.border)
  line(x,cx+10,cy-2,2,6,'#fff5e2')
}
function smallBook(x,cx,cy,color='#88a6b1') {
  rect(x,cx-11,cy-7,23,14,color,C.ink)
  line(x,cx-7,cy-3,13,2,C.cream)
  line(x,cx-7,cy+2,12,2,C.cream)
}
function pastry(x,cx,cy) {
  oval(x,cx,cy+3,12,4,'#fbebcc')
  oval(x,cx,cy,10,4,'#b5723d')
  oval(x,cx-3,cy-2,6,3,'#ecc084')
}
function carpet(x,cx,cy,rx,ry,color) {
  // Handwoven circular rugs leave a recognisable patterned edge around table tops.
  oval(x,cx,cy+7,rx+5,ry+5,'#936343')
  oval(x,cx,cy+4,rx+1,ry+1,'#e4c38b')
  oval(x,cx,cy+4,rx-5,ry-5,color)
  oval(x,cx,cy+4,rx-15,ry-11,'#d6a980')
  for (let i=0; i<14; i++) {
    const a=2*Math.PI*i/14
    const dx=Math.cos(a)*(rx-9),dy=Math.sin(a)*(ry-9)
    oval(x,cx+dx,cy+4+dy,3,2,i%2?C.cream:C.gold)
  }
  for (const shift of [-24,0,24]) {
    const z=cx+shift
    line(x,z-4,cy-4,8,2,'#6c9a81')
    line(x,z,cy-8,2,10,'#6c9a81')
  }
}
function runner(x) {
  // A flat decorative runner across the open aisle: does not affect walkability.
  rect(x,330,357,537,66,'#456f62','#d6b784')
  rect(x,341,366,515,48,'#d6ad79','#f1d29a')
  rect(x,353,374,490,32,'#527e69','#e8c68d')
  for(let cx=374;cx<820;cx+=55) {
    // small symmetrical diamonds read clearly at sprite scale
    for(let k=0;k<9;k++) {
      const off=4-Math.abs(k-4)
      line(x,cx-off*3,386+k*2,off*6+1,2,k%2?'#d4bb7d':'#eacb8e')
    }
  }
  for(let px=334;px<865;px+=14){line(x,px,354,2,7,C.cream);line(x,px,420,2,7,C.cream)}
}
function framedPrint(x,cx,cy,kind) {
  rect(x,cx-25,cy-24,50,48,'#a97352',C.ink)
  rect(x,cx-19,cy-19,38,37,kind==='landscape'?'#cce1cf':'#f3dfb8')
  if(kind==='landscape'){
    oval(x,cx+7,cy-8,6,6,'#f3ca77')
    oval(x,cx-8,cy+12,14,9,'#6b9a81')
    oval(x,cx+12,cy+14,14,10,'#5b846f')
  }else{
    line(x,cx-13,cy-11,26,4,'#a77a63')
    line(x,cx-15,cy+1,30,3,'#c59f72')
    line(x,cx-10,cy+10,20,3,'#ad886a')
  }
}
function stackBooks(x,cx,cy) {
  for(const [i,color] of ['#6b8f84','#c98e76','#e4c68b'].entries()) {
    rect(x,cx-13+i*2,cy-7-i*6,27,6,color,C.border)
    line(x,cx-10+i*2,cy-5-i*6,16,1,C.cream)
  }
}
function plantCluster(x,cx,cy) {
  plant(x,cx-16,cy,.67)
  plant(x,cx+14,cy+2,.55)
  oval(x,cx,cy-24,12,10,C.darkGreen)
  oval(x,cx+2,cy-28,10,7,C.leafLight)
}
function booth(x,a) {
  rect(x,a,216,200,82,C.darkGreen,C.ink)
  line(x,a+5,222,190,44,C.green)
  for(let px=a+17;px<a+193;px+=28) line(x,px,226,3,36,'#286148')
  line(x,a+5,269,190,24,'#54896b')
  line(x,a+10,274,180,5,'#85ae8c')
  line(x,a+15,295,18,7,C.woodDark)
  line(x,a+170,295,18,7,C.woodDark)
}
function roundChair(x,cx,cy,side) {
  const a=cx+side*80
  rect(x,a-10,cy-36,23,49,'#8a5a42',C.ink)
  rect(x,a-7,cy-31,17,32,'#ca9d74',C.border)
}
function tablePedestal(x,cx,cy) {
  // Booth table: thick oval wood top with leg and shadow for unmistakable depth.
  oval(x,cx+2,cy+19,82,23,'#72513b')
  rect(x,cx-9,cy+10,18,24,'#76503a')
  oval(x,cx,cy+40,27,7,'#70503c')
  oval(x,cx,cy+13,78,22,C.ink)
  oval(x,cx,cy+8,73,20,'#8d5d3f')
  oval(x,cx,cy,71,19,'#bf8a5a')
  oval(x,cx-2,cy-4,63,15,'#dcaa72')
  oval(x,cx-19,cy-10,29,4,'#eec391')
  smallBook(x,cx-34,cy-7,'#82a9a2')
  mug(x,cx+39,cy-7)
  pastry(x,cx+6,cy-7)
}
function ovalTable(x,cx,cy) {
  // Clearly circular tabletop and left/right chairs, even when scaled down.
  roundChair(x,cx,cy+3,-1)
  roundChair(x,cx,cy+3,1)
  oval(x,cx+3,cy+28,72,21,'#715039')
  rect(x,cx-9,cy+10,18,26,'#77513e')
  oval(x,cx,cy+39,26,7,'#70503c')
  oval(x,cx,cy+14,76,31,C.ink)
  oval(x,cx,cy+10,72,28,'#9d6844')
  oval(x,cx,cy+5,69,27,'#d3a16a')
  oval(x,cx-4,cy,62,22,'#e0b582')
  oval(x,cx-23,cy-9,30,5,'#eec692')
  smallBook(x,cx-34,cy-7,'#7da99c')
  mug(x,cx+37,cy-6)
  pastry(x,cx+4,cy-4)
}
function floorLamp(x,cx,cy) {
  line(x,cx,cy-46,4,46,'#6f513d')
  oval(x,cx,cy+3,17,5,'#6d4d38')
  rect(x,cx-13,cy-70,26,15,'#d8c8a5')
  line(x,cx-9,cy-55,18,2,'#f3e7c8')
}
function littleSign(x,cx,cy,text) {
  rect(x,cx-26,cy-8,52,16,'#fff3da',C.ink)
  label(x,text,cx,cy+4,7,'#694a38')
}
function base(x,night) {
  line(x,0,0,W,H,C.ink)
  line(x,5,5,W-10,204,C.wall)
  for(let yy=8;yy<203;yy+=15) {
    line(x,5,yy,W-10,1,'#d3ab80')
    for(let xx=5+(Math.floor(yy/15)%2)*21;xx<W-5;xx+=43) line(x,xx,yy+1,1,13,'#e1be99')
  }
  line(x,5,205,W-10,6,C.woodDark)
  line(x,5,211,W-10,H-218,C.floor)
  for(let yy=212;yy<H;yy+=17) {
    line(x,5,yy,W-10,1,'#ab7850')
    for(let xx=5+((Math.floor(yy/17)%2)*26);xx<W-5;xx+=52) {
      line(x,xx,yy+2,1,15,'#b98458');P(x,xx+7,yy+8,'#dab18a')
    }
  }
  if(night) {
    x.fillStyle='rgba(34,39,52,0.15)'
    x.fillRect(5,6,W-10,H-12)
  }
  line(x,3,2,3,H,C.ink)
  line(x,W-6,2,3,H,C.ink)
  line(x,4,H-6,W-8,4,C.woodDark)
}
function drawCounter(x,night) {
  rect(x,971,128,218,122,'#956746',C.ink)
  line(x,972,126,215,8,C.woodLight)
  rect(x,988,99,84,47,'#69706b',C.border)
  line(x,995,105,70,16,'#b4c5bf')
  line(x,1005,123,4,19,C.ink);line(x,1047,123,4,19,C.ink)
  oval(x,1028,140,20,4,'#e7e5d8')
  for(let i=0;i<4;i++) {
    rect(x,1082+i*21,106,14,19,'#f5e9d2',C.border)
    oval(x,1089+i*21,105,7,3,'#77523f')
  }
  rect(x,983,166,197,51,'#a6bdb0',C.border)
  for(const px of [1010,1050,1090,1130,1167]) pastry(x,px,188)
  line(x,986,219,195,29,'#86593d')
  for(const px of [1008,1084,1152]) line(x,px,222,3,23,'#b78358')
  rect(x,867,24,213,68,C.darkGreen,C.ink)
  label(x,'BREW & BOOKS',973,52,22)
  label(x,'coffee  -  stories  -  people',973,74,8)
  rect(x,1087,29,97,61,'#283d34',C.ink)
  label(x,'MENU',1136,47,12)
  for(const [i,txt] of ['Coffee','Tea','Mocha','Cake'].entries()) label(x,txt,1137,58+i*9,7,'#f3e1bd')
  if(night) oval(x,1048,160,114,35,'rgba(255,211,142,0.08)')
}
function drawBackdrop(x,state) {
  base(x,state.night)
  windowPane(x,60,21,220,165,state)
  windowPane(x,318,21,220,165,state)
  windowPane(x,592,21,192,165,state)
  bookcase(x,286,33,28,153)
  bookcase(x,552,33,34,153)
  bookcase(x,790,17,42,175)
  rect(x,13,64,40,90,'#5c3e30',C.ink)
  for(const [i,t] of ['GOOD','BOOKS','BETTER','COMPANY'].entries()) label(x,t,33,84+i*15,7)
  light(x,194,1);light(x,448,2);light(x,708,1);light(x,915,1);light(x,1080,1)
  hangingPlant(x,58,0,1);hangingPlant(x,806,0,1);hangingPlant(x,1140,0,.92)
  plant(x,30,199,1);plant(x,805,207,.9);plant(x,936,215,.8)
  drawCounter(x,state.night)
  // Aisle and rugs under the furniture; keep the collision map unchanged.
  runner(x)
  for(const a of [40, 272, 504, 736]) booth(x,a)
  for(const px of [258,491,726,953]) plant(x,px,303,.70)
  for(const [cx,cc] of [[150,'#6d8b83'],[420,'#c59581'],[700,'#6d8b83'],[980,'#c59581']]) carpet(x,cx,494,89,55,cc)
  // Greenery, reading nooks, wall art, and small tableside objects.
  plantCluster(x,305,545)
  plantCluster(x,856,545)
  plant(x,595,435,.72);plant(x,1134,465,.82);plant(x,54,461,.72)
  plant(x,1102,300,.68);plant(x,1032,349,.55)
  floorLamp(x,247,547);floorLamp(x,1097,550)
  bookcase(x,8,530,90,62)
  bookcase(x,1106,530,85,62)
  stackBooks(x,142,443);stackBooks(x,923,426)
  framedPrint(x,942,113,'landscape')
  framedPrint(x,864,114,'books')
  rect(x,558,558,84,31,'#547e63',C.darkGreen)
  line(x,569,569,62,3,C.gold)
  label(x,'WELCOME',600,583,9)
  // Draw furniture into the base as well, so a missing foreground never leaves a rug-only scene.
  drawForeground(x)
}
function drawForeground(x) {
  for(const cx of [140,372,604,836]) tablePedestal(x,cx,314)
  for(const cx of [150,420,700,980]) ovalTable(x,cx,504)
}

export function drawCafeWeatherArt({scene='cloudy',night=false}={}) {
  const state={scene:['sunny','cloudy','rain'].includes(scene)?scene:'cloudy',night:Boolean(night)}
  const [bg,bx]=mk(W,H)
  drawBackdrop(bx,state)
  const [fg,fx]=mk(W,H)
  drawForeground(fx)
  return {desktop:bg.toDataURL('image/png'),foreground:fg.toDataURL('image/png')}
}
