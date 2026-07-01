#!/usr/bin/env python3
"""Generate the top-down neon-city world assets: ground tiles, cars, buildings,
stations, props, bubbles, PWA icons and character thumbnails."""
import math, os, random
from PIL import Image, ImageDraw, ImageFilter

random.seed(7)
os.makedirs('assets/img', exist_ok=True)
os.makedirs('assets/sheet', exist_ok=True)
os.makedirs('assets/ui', exist_ok=True)

def shade(c, f):
    if f <= 1: return tuple(int(v*f) for v in c[:3]) + ((c[3],) if len(c)==4 else ())
    return tuple(min(255,int(v+(255-v)*(f-1))) for v in c[:3]) + ((c[3],) if len(c)==4 else ())

def new(w, h):
    im = Image.new('RGBA', (w, h), (0,0,0,0)); return im, ImageDraw.Draw(im)

def soft_shadow(base_wh, shape_bbox, blur=6, alpha=110, off=(4,6)):
    """return an RGBA image (base_wh) with a blurred dark ellipse shadow."""
    w, h = base_wh
    sh, sd = new(w, h)
    x0,y0,x1,y1 = shape_bbox
    sd.ellipse([x0+off[0], y0+off[1], x1+off[0], y1+off[1]], fill=(0,0,0,alpha))
    return sh.filter(ImageFilter.GaussianBlur(blur))

# ---------------- ground tiles ----------------
def asphalt():
    im, d = new(64,64)
    base=(43,47,56,255)
    d.rectangle([0,0,64,64], fill=base)
    for _ in range(220):
        x,y=random.randint(0,63),random.randint(0,63)
        c=random.choice([shade(base,0.9),shade(base,1.08),(38,41,49,255)])
        d.point((x,y),fill=c)
    # faint cracks
    for _ in range(3):
        x=random.randint(6,58); d.line([x,random.randint(0,20),x+random.randint(-6,6),random.randint(44,63)],fill=(34,37,44,120),width=1)
    im.save('assets/img/asphalt.png')

def sidewalk():
    im, d = new(64,64)
    base=(92,99,112,255)
    d.rectangle([0,0,64,64], fill=base)
    for _ in range(120):
        x,y=random.randint(0,63),random.randint(0,63)
        d.point((x,y),fill=random.choice([shade(base,0.94),shade(base,1.06)]))
    # slab seams
    d.line([0,32,64,32],fill=shade(base,0.8),width=2)
    d.line([32,0,32,64],fill=shade(base,0.8),width=2)
    im.save('assets/img/sidewalk.png')

def crosswalk():
    im, d = new(64,64)
    d.rectangle([0,0,64,64], fill=(43,47,56,255))
    for i in range(0,64,16):
        d.rectangle([i+3,0,i+11,64], fill=(222,226,235,235))
    im.save('assets/img/crosswalk.png')

def grass():
    im, d = new(64,64)
    base=(58,120,66,255)
    d.rectangle([0,0,64,64], fill=base)
    for _ in range(240):
        x,y=random.randint(0,63),random.randint(0,63)
        d.point((x,y),fill=random.choice([shade(base,0.85),shade(base,1.12),(70,140,72,255)]))
    im.save('assets/img/grass.png')

# ---------------- car spritesheet (256x64, 4 frames, points RIGHT) ----------------
def draw_car(d, ox, headlight):
    # top-down 3/4 roof view, front at the right
    body=(214,220,228,255); body_d=shade(body,0.82); body_l=shade(body,1.08)
    win=(38,44,58,255); OUT=(26,24,34,255)
    cx, cy = ox+32, 33
    # wheels (dark) peeking top & bottom
    for wy in (cy-13, cy+13):
        for wx in (cx-13, cx+11):
            d.rounded_rectangle([wx-4, wy-3, wx+4, wy+3], radius=2, fill=(30,28,36,255))
    # body
    d.rounded_rectangle([cx-22, cy-11, cx+22, cy+11], radius=9, fill=body, outline=OUT, width=2)
    # hood / trunk shading
    d.rounded_rectangle([cx-21, cy-10, cx+21, cy+10], radius=8, outline=body_l, width=1)
    # windshield (front-right) + roof + rear window
    d.polygon([cx+4,cy-8, cx+16,cy-6, cx+16,cy+6, cx+4,cy+8], fill=win)          # front windshield
    d.rounded_rectangle([cx-6, cy-7, cx+3, cy+7], radius=3, fill=shade(win,1.25)) # roof
    d.polygon([cx-8,cy-7, cx-18,cy-5, cx-18,cy+5, cx-8,cy+7], fill=win)          # rear window
    # centre body highlight
    d.line([cx-18,cy, cx+2,cy], fill=body_l, width=1)
    # headlights (front)
    hl = (255,244,180,255) if headlight else (250,250,210,255)
    d.ellipse([cx+19,cy-9, cx+23,cy-5], fill=hl)
    d.ellipse([cx+19,cy+5, cx+23,cy+9], fill=hl)
    if headlight:
        glow,_=new(0,0)
    # taillights (rear)
    d.ellipse([cx-23,cy-9, cx-19,cy-5], fill=(230,60,60,255))
    d.ellipse([cx-23,cy+5, cx-19,cy+9], fill=(230,60,60,255))

def car_sheet():
    im, d = new(256,64)
    for i in range(4):
        draw_car(d, i*64, headlight=(i%2==0))
    im.save('assets/sheet/car.png')

def want_gas():
    im, d = new(48,48)
    # speech-ish bubble with a fuel pump
    d.ellipse([2,2,46,40], fill=(255,255,255,240), outline=(40,38,52,255), width=2)
    d.polygon([18,36, 26,36, 20,46], fill=(255,255,255,240), outline=(40,38,52,255))
    # pump body
    d.rounded_rectangle([17,10,28,30], radius=2, fill=(226,64,72,255), outline=(120,28,34,255), width=1)
    d.rectangle([19,13,26,19], fill=(240,240,245,255))  # display
    d.line([28,15,32,15], fill=(120,28,34,255), width=2) # nozzle arm
    d.line([32,15,32,24], fill=(120,28,34,255), width=2)
    im.save('assets/img/want_gas.png')

# ---------------- buildings ----------------
def building(name, w, h, roof, trim, neon):
    im, d = new(w, h)
    pad=6; top=14
    box=[pad, top, w-pad, h-pad]
    # baked soft shadow
    sh = soft_shadow((w,h), box, blur=7, alpha=90, off=(5,7))
    im.alpha_composite(sh)
    # wall (side faces, darker) to give height
    d.rectangle([pad, top+ (h-top-pad)*0.38, w-pad, h-pad], fill=shade(roof,0.7))
    # roof
    d.rounded_rectangle(box[:2]+[box[2], top+(h-top-pad)*0.42], radius=8, fill=roof, outline=shade(roof,0.6), width=2)
    d.rounded_rectangle([pad, top, w-pad, h-pad], radius=8, outline=shade(roof,0.55), width=2)
    # neon trim line near the top edge
    d.line([pad+4, top+3, w-pad-4, top+3], fill=neon, width=3)
    d.line([pad+4, top+(h-top-pad)*0.40, w-pad-4, top+(h-top-pad)*0.40], fill=trim, width=2)
    # rooftop units
    ru=random.Random(len(name))
    for _ in range(3):
        rx=ru.randint(pad+6, w-pad-16); ry=ru.randint(top+4, int(top+(h-top-pad)*0.30))
        d.rounded_rectangle([rx,ry,rx+12,ry+9], radius=2, fill=shade(roof,0.82), outline=shade(roof,0.6))
    # lit windows on the wall (front face)
    wy0=int(top+(h-top-pad)*0.46)
    for row in range(wy0, h-pad-6, 12):
        for col in range(pad+6, w-pad-8, 12):
            lit = ru.random()<0.6
            c = neon if lit else (30,32,42,255)
            d.rectangle([col, row, col+6, row+7], fill=c)
    im.save('assets/img/%s.png'%name)

# ---------------- palm tree ----------------
def palm():
    w,h=70,96
    im, d = new(w,h)
    box=[w/2-10, h-24, w/2+10, h-6]
    im.alpha_composite(soft_shadow((w,h), box, blur=5, alpha=90, off=(4,5)))
    # trunk
    d.line([w/2, h-10, w/2-4, h-46], fill=(120,86,54,255), width=7)
    d.line([w/2, h-10, w/2-4, h-46], fill=(150,110,70,255), width=3)
    # fronds
    cx, cy = int(w/2-4), h-48
    for a in range(0,360,45):
        r=math.radians(a)
        ex,ey=cx+math.cos(r)*26, cy+math.sin(r)*16-6
        d.line([cx,cy,ex,ey], fill=(46,132,66,255), width=6)
        d.line([cx,cy,ex,ey], fill=(70,168,84,255), width=2)
    d.ellipse([cx-6,cy-6,cx+6,cy+6], fill=(60,150,72,255))
    # coconuts
    d.ellipse([cx-3,cy-1,cx+2,cy+4], fill=(90,64,40,255))
    im.save('assets/img/palm.png')

# ---------------- stations ----------------
def garage():
    w,h=150,140
    im, d = new(w,h)
    box=[10,40,w-10,h-8]
    im.alpha_composite(soft_shadow((w,h), box, blur=7, alpha=95, off=(5,7)))
    wall=(84,92,120,255)
    d.rounded_rectangle([10,40,w-10,h-8], radius=8, fill=wall, outline=shade(wall,0.6), width=2)
    # roof band
    d.rounded_rectangle([6,26,w-6,52], radius=8, fill=shade(wall,1.15), outline=shade(wall,0.6), width=2)
    # garage door
    d.rounded_rectangle([34,62,w-34,h-14], radius=4, fill=(52,58,78,255), outline=(30,34,48,255), width=2)
    for yy in range(70, h-16, 12):
        d.line([36,yy,w-36,yy], fill=(40,44,60,255), width=2)
    # neon sign
    d.rounded_rectangle([28,30,w-28,46], radius=4, fill=(20,22,32,255))
    d.text((w/2-24,32), "GARAGE", fill=(90,230,240,255))
    im.save('assets/img/garage.png')

def gas():
    w,h=140,120
    im, d = new(w,h)
    box=[16,60,w-16,h-8]
    im.alpha_composite(soft_shadow((w,h), box, blur=7, alpha=95, off=(5,7)))
    # canopy posts
    d.rectangle([26,40,34,h-10], fill=(70,76,96,255))
    d.rectangle([w-34,40,w-26,h-10], fill=(70,76,96,255))
    # canopy
    d.rounded_rectangle([8,20,w-8,46], radius=6, fill=(230,236,242,255), outline=(120,126,140,255), width=2)
    d.rectangle([8,40,w-8,46], fill=(226,64,72,255))
    d.line([8,33,w-8,33], fill=(90,230,240,255), width=3)
    # pumps
    for px in (48, w-58):
        d.rounded_rectangle([px,64,px+18,h-14], radius=3, fill=(226,64,72,255), outline=(120,28,34,255), width=2)
        d.rectangle([px+3,68,px+15,78], fill=(240,240,245,255))
    im.save('assets/img/gas.png')

def depot():
    w,h=150,120
    im, d = new(w,h)
    box=[10,44,w-10,h-8]
    im.alpha_composite(soft_shadow((w,h), box, blur=7, alpha=95, off=(5,7)))
    wall=(150,120,84,255)
    d.rounded_rectangle([10,44,w-10,h-8], radius=6, fill=wall, outline=shade(wall,0.6), width=2)
    # corrugated
    for yy in range(52, h-12, 8):
        d.line([14,yy,w-14,yy], fill=shade(wall,0.86), width=2)
    # roof
    d.rounded_rectangle([6,30,w-6,54], radius=6, fill=shade(wall,1.12), outline=shade(wall,0.6), width=2)
    # dock door + boxes
    d.rounded_rectangle([46,60,w-46,h-14], radius=3, fill=(60,50,38,255), outline=(36,30,22,255), width=2)
    d.rectangle([20,h-34,40,h-14], fill=(196,150,96,255), outline=(120,90,56,255))
    d.rectangle([w-40,h-30,w-20,h-14], fill=(196,150,96,255), outline=(120,90,56,255))
    # sign
    d.rounded_rectangle([28,32,w-28,50], radius=4, fill=(20,22,32,255))
    d.text((w/2-20,35), "DEPOT", fill=(250,210,80,255))
    im.save('assets/img/depot.png')

# ---------------- small props ----------------
def hydrant():
    w,h=24,34
    im, d = new(w,h)
    im.alpha_composite(soft_shadow((w,h),[6,h-10,18,h-2],blur=3,alpha=90,off=(2,3)))
    d.rounded_rectangle([8,10,16,h-4], radius=3, fill=(226,64,72,255), outline=(120,28,34,255), width=1)
    d.ellipse([6,4,18,14], fill=(230,80,86,255), outline=(120,28,34,255))
    d.rectangle([4,16,20,20], fill=(200,52,60,255))
    im.save('assets/img/hydrant.png')

def streetlamp():
    w,h=26,74
    im, d = new(w,h)
    im.alpha_composite(soft_shadow((w,h),[8,h-8,18,h-2],blur=3,alpha=90,off=(2,3)))
    d.rectangle([11,14,15,h-4], fill=(70,76,96,255))
    d.line([13,16,13,h-4], fill=(96,104,126,255), width=1)
    d.ellipse([4,6,22,20], fill=(255,238,150,255), outline=(180,150,60,255))
    d.ellipse([8,9,18,16], fill=(255,250,210,255))
    im.save('assets/img/streetlamp.png')

def ramp():
    # a stunt ramp (jumpable obstacle)
    w,h=60,44
    im, d = new(w,h)
    im.alpha_composite(soft_shadow((w,h),[6,h-14,w-6,h-4],blur=5,alpha=95,off=(4,5)))
    d.polygon([8,h-8, w-8,h-8, w-8,10, 8,h-8], fill=(70,76,96,255), outline=(30,34,48,255))
    # hazard stripes on the ramp face
    for i in range(0, w, 12):
        d.line([8+i, h-8, min(w-8,8+i+6), max(10,h-8-(i))], fill=(250,210,80,255), width=3)
    d.line([8,h-8,w-8,10], fill=(240,246,252,255), width=2)
    im.save('assets/img/ramp.png')

# ---------------- PWA icons + thumbs ----------------
def icons():
    for size, fn in [(512,'assets/favicon.png'),(180,'assets/apple-touch-icon.png')]:
        im, d = new(size,size)
        d.rounded_rectangle([0,0,size,size], radius=size//6, fill=(24,20,40,255))
        s=size/512
        # neon skyline
        for (bx,bw,bh,col) in [(70,90,220,(60,196,210)),(180,80,300,(228,74,150)),(280,100,180,(250,210,80)),(380,80,260,(120,120,230))]:
            d.rounded_rectangle([bx*s, (512-bh)*s, (bx+bw)*s, 440*s], radius=8*s, fill=col+(255,))
            for wy in range(int((512-bh+20)*s), int(430*s), int(30*s)):
                for wx in range(int((bx+12)*s), int((bx+bw-12)*s), int(26*s)):
                    d.rectangle([wx,wy,wx+10*s,wy+14*s], fill=(255,255,255,120))
        # little car
        cyc=470*s
        d.rounded_rectangle([150*s,cyc-24*s,362*s,cyc+18*s], radius=16*s, fill=(226,64,72,255))
        d.rounded_rectangle([190*s,cyc-40*s,322*s,cyc-6*s], radius=12*s, fill=(120,28,34,255))
        for wx in (185,327):
            d.ellipse([wx*s-18*s,cyc+2*s,wx*s+18*s,cyc+38*s], fill=(30,28,36,255))
        im.save(fn)

def thumbs():
    for sheet, out in [('assets/sheet/player_vice.png','assets/ui/vice_thumb.png'),
                       ('assets/sheet/player_cyan.png','assets/ui/cyan_thumb.png')]:
        s=Image.open(sheet)
        # down idle = row2 col0 -> (0,128)
        fr=s.crop((0,128,64,192))
        bbox=fr.getbbox(); fr=fr.crop(bbox)
        fr.save(out)
        print('thumb', out, fr.size)

asphalt(); sidewalk(); crosswalk(); grass()
car_sheet(); want_gas()
building('tower_cyan', 130, 170, (58,70,104), (90,230,240,255), (120,240,250,255))
building('tower_pink', 120, 150, (92,54,86), (250,120,180,255), (255,120,190,255))
building('shop_block', 150, 110, (70,72,96), (250,210,80,255), (255,225,120,255))
palm(); garage(); gas(); depot()
hydrant(); streetlamp(); ramp(); icons(); thumbs()
print('world assets done')
