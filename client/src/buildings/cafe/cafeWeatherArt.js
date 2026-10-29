// AI-assisted café art scaffold; review with the team and document in AI_USAGE.md.
// Uses the same low-resolution canvas helpers as the town and hair salon.
// Existing live weather is supplied by CafeView; this module makes no requests.
import { E, P, R, mk } from '@/lib/avatar/draw.js'

export const CAFE_DESKTOP = { width: 1200, height: 820 }
export const CAFE_MOBILE = { width: 420, height: 900 }

const C = {
  ink: '#30262a', cream: '#fff2d7', wall: '#eed9b8', line: '#ddbd97',
  floor: '#c99667', floorLine: '#a97650', wood: '#ad764c', woodLight: '#d7a677',
  darkWood: '#644432', green: '#39735d', greenDark: '#24513f', greenLight: '#79a18a',
  leaf: '#669b55', gold: '#f5d083', copper: '#a56948', white: '#fcf8ea',
}

function rect(x, a, b, w, h, color, edge = C.ink) {
  R(x, a - 2, b - 2, w + 4, h + 4, edge)
  R(x, a, b, w, h, color)
}
function line(x, a, b, w, h, color) { R(x, a, b, w, h, color) }
function oval(x, a, b, rx, ry, color) { E(x, a, b, rx, ry, color) }
function text(x, txt, a, b, px = 12, color = C.cream) {
  x.fillStyle = color
  x.font = `bold ${px}px monospace`
  x.textAlign = 'center'
  x.fillText(txt, a, b)
}
function plant(x, a, b, scale = 1) {
  rect(x, a - 8*scale, b - 16*scale, 16*scale, 17*scale, '#b37757', C.darkWood)
  line(x, a - 2*scale, b - 38*scale, 4*scale, 23*scale, '#3e6b43')
  for (const [dx, dy] of [[-12, -34],[13,-38],[-4,-48],[7,-49]]) {
    oval(x, a + dx*scale, b + dy*scale, 10*scale, 7*scale, C.greenDark)
    oval(x, a + (dx-2)*scale, b + (dy-2)*scale, 8*scale, 5*scale, C.leaf)
  }
}
function hangingPlant(x, a, b, scale=1) {
  line(x,a,b,2,24*scale,C.darkWood)
  rect(x,a-10*scale,b+24*scale,22*scale,12*scale,C.copper,C.darkWood)
  for (const [dx,dy] of [[-16,14],[0,10],[15,18]]) {
    oval(x,a+dx*scale,b+(dy+25)*scale,8*scale,5*scale,C.greenDark)
    oval(x,a+dx*scale,b+(dy+23)*scale,6*scale,4*scale,C.leaf)
  }
}
function window(x, a, b, w, h, state) {
  const { scene, night } = state
  rect(x,a,b,w,h,C.darkWood)
  const ix=a+7, iy=b+7, iw=w-14, ih=h-15
  line(x,ix,iy,iw,ih,night?'#223653':scene==='rain'?'#91aebb':'#95d8e2')
  x.save()
  x.beginPath()
  x.rect(ix,iy,iw,ih)
  x.clip()
  if (night) {
    for (let i=0;i<20;i++) P(x,ix+7+(i*37)%(iw-14),iy+7+(i*19)%Math.max(10,ih-60),'#ffefb5')
    oval(x,ix+iw*0.78,iy+ih*0.24,14,14,'#ffe7a4')
  } else if (scene==='sunny') {
    oval(x,ix+iw*0.75,iy+ih*0.25,18,18,'#efc657')
    oval(x,ix+iw*0.73,iy+ih*0.22,13,13,'#ffed9b')
  }
  if (scene!=='sunny' || night) {
    const color = night?'#6e7e95':scene==='rain'?'#c4d2da':'#f9faf1'
    for (const t of [0.26,0.69]) {
      const cx=ix+iw*t, cy=iy+ih*(t===0.26?0.32:0.42)
      oval(x,cx,cy,22,7,color); oval(x,cx-9,cy-5,11,9,color); oval(x,cx+8,cy-8,14,9,color)
    }
  }
  // The skyline and nearby trees stay behind the window frame.
  for (let i=0;i<10;i++) {
    const px=ix+i*iw/10
    line(x,px,iy+ih-43-(i%3)*6,iw/12,45+(i%3)*6,night?'#415669':'#8caeb4')
    for(let yy=iy+ih-34;yy<iy+ih-9;yy+=10) P(x,px+4,yy,night?'#f3d486':'#dbebe6')
  }
  oval(x,ix+iw*0.25,iy+ih+8,iw*.47,ih*.19,night?'#244b3f':'#6fa273')
  oval(x,ix+iw*0.87,iy+ih+5,iw*.42,ih*.16,night?'#254d40':'#5b9668')
  if (scene==='rain') for(let i=0;i<36;i++) {
    const rx=ix+6+(i*29)%(iw-11), ry=iy+9+(i*43)%(ih-19)
    line(x,rx,ry,2,9,'#dfedf4')
  }
  x.restore()
  line(x,a+w/2-3,b+4,6,h-8,C.cream)
  line(x,a+4,b+h/2-2,w-8,5,C.cream)
  line(x,a+10,b+10,4,23,'#f2f8ef')
  line(x,a-5,b+h-8,w+10,11,C.woodLight)
  line(x,a-5,b+h-9,w+10,3,C.darkWood)
}
function bookcase(x,a,b,w,h) {
  rect(x,a,b,w,h,C.darkWood)
  line(x,a+5,b+5,w-10,h-10,'#5b4334')
  const palette=['#d47767','#8da79b','#e5c475','#9183af','#76a775','#cd936b']
  const rows = Math.max(1,Math.floor((h-10)/30))
  for(let row=0;row<rows;row++) {
    const baseline=b+28+row*30
    for(let col=0;col<Math.floor((w-16)/11);col++) {
      const bh=13+(col*3+row)%10, px=a+8+col*11
      rect(x,px,baseline-bh,7,bh,palette[(col+row*2)%palette.length],C.ink)
    }
    line(x,a+4,baseline+2,w-8,4,C.woodLight)
  }
}
function mug(x,a,b) {
  oval(x,a,b+8,10,4,C.darkWood)
  rect(x,a-6,b-7,13,14,'#fff5db')
  oval(x,a,b-6,5,2,'#8a5a39')
  line(x,a+8,b-5,5,3,C.darkWood)
  line(x,a+10,b-2,3,7,'#fff5db')
}
function book(x,a,b,color='#7fa1b0') {
  rect(x,a,b,22,14,color)
  line(x,a+4,b+5,13,2,'#fff5db')
  line(x,a+4,b+10,11,2,'#fff5db')
}
function table(x,cx,cy,r=42) {
  oval(x,cx,cy+13,r+12,18,'#a87554')
  oval(x,cx,cy+7,r+4,15,C.darkWood)
  oval(x,cx,cy,r,14,C.ink)
  oval(x,cx,cy-3,r-3,12,C.woodLight)
  mug(x,cx+r*.4,cy-14)
  book(x,cx-r*.60,cy-15,'#849da5')
}
function stool(x,a,b) {
  rect(x,a,b,24,36,'#a87755',C.darkWood)
  line(x,a+4,b+5,16,25,'#d9b28b')
}
function booth(x,a,b,w) {
  rect(x,a,b,w,82,C.greenDark)
  line(x,a+5,b+6,w-10,40,C.green)
  for(let xx=a+17;xx<a+w-9;xx+=27) line(x,xx,b+10,2,35,'#27523e')
  line(x,a+5,b+50,w-10,24,'#578c73')
  line(x,a+10,b+55,w-20,5,'#7fac8e')
  line(x,a+13,b+82,12,9,C.darkWood)
  line(x,a+w-26,b+82,12,9,C.darkWood)
  table(x,a+w/2,b+103,Math.min(69,w*.30))
}
function roundTable(x,cx,cy,rx=48) {
  oval(x,cx,cy+20,rx+25,31,'#b68465')
  stool(x,cx-rx-25,cy-15)
  stool(x,cx+rx+3,cy-15)
  table(x,cx,cy+13,rx)
}
function coffeeBar(x,a,b,w) {
  rect(x,a,b,w,70,'#805b41',C.darkWood)
  line(x,a+3,b+2,w-6,9,C.woodLight)
  // espresso machine
  rect(x,a+19,b-44,67,40,'#a8bbb1')
  rect(x,a+31,b-36,42,18,'#363c3a')
  line(x,a+35,b-18,4,15,'#4b4b45')
  line(x,a+66,b-18,4,15,'#4b4b45')
  oval(x,a+53,b-1,17,5,C.white)
  // glass pastry case
  const displayX=a+Math.min(112,w*.38)
  rect(x,displayX,b+15,w-(displayX-a)-14,44,'#b3d0c6')
  for(let i=0;i<Math.floor((w-(displayX-a)-30)/36);i++) {
    const px=displayX+20+i*36
    oval(x,px,b+39,13,6,'#c47c44')
    oval(x,px-4,b+36,7,3,'#f4c77d')
  }
}
function hangingLamp(x,cx,cy) {
  line(x,cx,0,3,cy,'#4c443e')
  oval(x,cx,cy+2,17,8,C.ink)
  oval(x,cx,cy+1,15,6,C.greenDark)
  line(x,cx-12,cy+7,24,3,C.gold)
}
function sign(x,a,b,w,h,title) {
  rect(x,a,b,w,h,C.greenDark)
  line(x,a+10,b+10,w-20,2,'#799786')
  text(x,title,a+w/2,b+h/2+5,Math.min(18,Math.round(w/12)))
  text(x,'COFFEE  •  STORIES  •  PEOPLE',a+w/2,b+h-9,Math.min(10,Math.round(w/20)),'#ffdf9b')
}
function chalkboard(x,a,b,w=120,h=120) {
  rect(x,a,b,w,h,C.darkWood)
  rect(x,a+7,b+7,w-14,h-14,'#314a3e',C.darkWood)
  text(x,'MENU',a+w/2,b+24,13)
  for(let i=0;i<4;i++) {
    line(x,a+14,b+37+i*17,w-32,2,'#d3c6a1')
    line(x,a+w-30,b+33+i*17,13,2,'#d3c6a1')
  }
}
function lampGlow(x,a,b,night) {
  if(!night) return
  const g=x.createRadialGradient(a,b,0,a,b,110)
  g.addColorStop(0,'rgba(255,218,138,0.30)')
  g.addColorStop(1,'rgba(255,218,138,0)')
  x.fillStyle=g
  x.fillRect(a-110,b-110,220,220)
}
function base(x,w,h,wallHeight,night) {
  line(x,0,0,w,h,C.ink)
  line(x,5,5,w-10,wallHeight-5,C.wall)
  for(let y=9;y<wallHeight-8;y+=17) {
    line(x,5,y,w-10,1,C.line)
    for(let xx=5+((Math.floor(y/17)%2)*22);xx<w-5;xx+=45) line(x,xx,y+1,1,15,'#e6caa7')
  }
  line(x,5,wallHeight,w-10,7,C.darkWood)
  line(x,5,wallHeight+7,w-10,h-wallHeight-13,C.floor)
  for(let y=wallHeight+8;y<h-6;y+=19) {
    line(x,5,y,w-10,1,C.floorLine)
    for(let xx=5+((Math.floor(y/19)%2)*30);xx<w-5;xx+=61) {
      line(x,xx,y+1,1,17,'#b9845c')
      P(x,xx+8,y+10,'#dfae7e')
    }
  }
  if(night) {
    x.fillStyle='rgba(20,26,51,0.17)'
    x.fillRect(5,wallHeight+6,w-10,h-wallHeight-12)
  }
}
function desktop(x,state) {
  const w=CAFE_DESKTOP.width,h=CAFE_DESKTOP.height
  base(x,w,h,278,state.night)
  window(x,52,45,292,200,state)
  hangingPlant(x,32,9,1.1)
  hangingPlant(x,366,6,1.0)
  hangingPlant(x,1162,4,1.2)
  bookcase(x,389,41,112,199)
  sign(x,530,48,259,80,'BREW & BOOKS')
  chalkboard(x,810,51,108,138)
  hangingLamp(x,369,85); hangingLamp(x,972,84)
  coffeeBar(x,921,201,248)
  plant(x,27,287,1.1)
  plant(x,1173,294,1.1)
  for(const [bx,bw] of [[45,250],[331,250],[617,250],[903,250]]) booth(x,bx,316,bw)
  for(const cx of [150,450,750,1050]) roundTable(x,cx,638,45)
  plant(x,298,750,1.2);plant(x,897,752,1.2)
  bookcase(x,18,743,106,65);bookcase(x,1075,743,104,65)
  // Window-side reading stools & wall details make the scene feel lived-in when empty.
  rect(x,365,256,90,9,C.woodLight,C.darkWood)
  rect(x,471,256,91,9,C.woodLight,C.darkWood)
  for (const p of [[330,110],[511,120],[867,96]]) oval(x,p[0],p[1],3,3,'#ead8b8')
  lampGlow(x,615,102,state.night);lampGlow(x,972,106,state.night)
  line(x,5,h-8,w-10,5,C.darkWood)
}
function mobile(x,state) {
  const w=CAFE_MOBILE.width,h=CAFE_MOBILE.height
  base(x,w,h,245,state.night)
  window(x,21,22,178,171,state)
  hangingPlant(x,4,5,0.7);hangingPlant(x,406,5,0.7)
  sign(x,217,24,181,66,'BREW & BOOKS')
  chalkboard(x,232,112,79,91)
  coffeeBar(x,212,211,195)
  bookcase(x,18,210,72,31)
  hangingLamp(x,166,112)
  plant(x,15,288,0.8);plant(x,407,292,0.8)
  booth(x,12,284,187);booth(x,222,284,187)
  booth(x,12,458,187);booth(x,222,458,187)
  roundTable(x,109,758,42); roundTable(x,313,758,42)
  bookcase(x,12,834,62,54);bookcase(x,344,834,64,54)
  plant(x,206,885,0.8)
  lampGlow(x,166,135,state.night)
  line(x,5,h-8,w-10,5,C.darkWood)
}

export function drawCafeWeatherArt({ scene='cloudy', night=false }={}) {
  const state={scene:['sunny','cloudy','rain'].includes(scene)?scene:'cloudy',night:Boolean(night)}
  function render(layout) {
    const d=layout==='mobile'?CAFE_MOBILE:CAFE_DESKTOP
    const [canvas,x]=mk(d.width,d.height)
    if(layout==='mobile') mobile(x,state)
    else desktop(x,state)
    return canvas.toDataURL('image/png')
  }
  return {desktop:render('desktop'),mobile:render('mobile')}
}
