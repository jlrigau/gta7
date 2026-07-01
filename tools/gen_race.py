#!/usr/bin/env python3
"""Race-mode assets: a walking pedestrian (4-frame side-walk sheet) and a
traffic cone. Same soft rounded look as the rest of the city."""
import math, os
from PIL import Image, ImageDraw

os.makedirs('assets/img', exist_ok=True)
os.makedirs('assets/sheet', exist_ok=True)
OUT = (28, 24, 36, 255)

def shade(c, f):
    if f <= 1: return tuple(int(v*f) for v in c[:3]) + ((c[3],) if len(c)==4 else ())
    return tuple(min(255,int(v+(255-v)*(f-1))) for v in c[:3]) + ((c[3],) if len(c)==4 else ())

def ell(d, cx, cy, rx, ry, fill, outline=None, ow=2):
    d.ellipse([cx-rx, cy-ry, cx+rx, cy+ry], fill=fill, outline=outline, width=ow)

def rrect(d, cx, cy, w, h, r, fill, outline=None, ow=2):
    d.rounded_rectangle([cx-w/2, cy-h/2, cx+w/2, cy+h/2], radius=r, fill=fill, outline=outline, width=ow)

def pedestrian(out, skin, shirt, pants, hair):
    FW = FH = 64
    sheet = Image.new('RGBA', (FW*4, FH), (0,0,0,0))
    CX, BASE = 32, 54
    for i in range(4):
        fr = Image.new('RGBA', (FW, FH), (0,0,0,0))
        d = ImageDraw.Draw(fr)
        phase = i/4.0
        swing = math.sin(phase*2*math.pi)
        yb = BASE - abs(math.sin(phase*2*math.pi))*2
        bodycy = yb - 16
        # legs
        for lx, off in ((-4, swing*3), (4, -swing*3)):
            rrect(d, CX+lx, yb-5, 6, 13, 3, pants, OUT, 1)
            ell(d, CX+lx, yb-1, 4, 2.5, (34,32,40,255))
        # torso
        rrect(d, CX, bodycy, 15, 18, 6, shirt, OUT, 2)
        d.line([CX, bodycy-6, CX, bodycy+7], fill=shade(shirt,0.75), width=1)
        # arms
        for ax, a in ((-9, swing*2), (9, -swing*2)):
            ell(d, CX+ax, bodycy-1+a, 3.5, 7, shade(shirt,1.1), OUT, 1)
            ell(d, CX+ax, bodycy+5+a, 3, 3, skin)
        # head
        hy = bodycy - 14
        ell(d, CX, hy, 8.5, 8.5, skin, OUT, 2)
        d.pieslice([CX-8, hy-9, CX+8, hy+4], 178, 362, fill=hair)
        ell(d, CX-3, hy+1, 1.3, 1.8, (30,28,40,255))
        ell(d, CX+3, hy+1, 1.3, 1.8, (30,28,40,255))
        sheet.paste(fr, (i*FW, 0), fr)
    sheet.save(out); print('wrote', out)

def cone():
    w, h = 34, 40
    im = Image.new('RGBA', (w, h), (0,0,0,0))
    d = ImageDraw.Draw(im)
    # soft shadow
    d.ellipse([6, h-9, w-6, h-2], fill=(0,0,0,70))
    orange = (245, 130, 40, 255)
    # base
    d.rounded_rectangle([5, h-11, w-5, h-4], radius=3, fill=shade(orange,0.8), outline=OUT, width=2)
    # cone body (triangle-ish)
    d.polygon([w/2, 5, w-10, h-9, 10, h-9], fill=orange, outline=OUT)
    # reflective stripes
    d.polygon([w/2-4, 14, w/2+4, 14, w/2+6, 20, w/2-6, 20], fill=(248,248,250,255))
    d.line([12, h-13, w-12, h-13], fill=(255,255,255,235), width=3)
    im.save('assets/img/cone.png'); print('wrote assets/img/cone.png')

pedestrian('assets/sheet/pedestrian.png', (226,178,140,255), (90,150,230,255), (44,48,64,255), (48,38,44,255))
cone()
print('race assets done')
