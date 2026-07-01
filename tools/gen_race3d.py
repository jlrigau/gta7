#!/usr/bin/env python3
"""Assets for the pseudo-3D (behind-the-car) racing view: the player's car seen
from behind (tintable), a front-facing pedestrian, and two roadside building
billboards. Reused as-is in that view: palm, streetlamp, cone."""
import os
from PIL import Image, ImageDraw, ImageFilter

os.makedirs('assets/img', exist_ok=True)
OUT = (26, 22, 34, 255)

def shade(c, f):
    if f <= 1: return tuple(int(v*f) for v in c[:3]) + ((c[3],) if len(c)==4 else ())
    return tuple(min(255,int(v+(255-v)*(f-1))) for v in c[:3]) + ((c[3],) if len(c)==4 else ())

def new(w, h):
    im = Image.new('RGBA', (w, h), (0,0,0,0)); return im, ImageDraw.Draw(im)

def car_back():
    # viewed from behind, slightly high 3/4 — light silver body so a paint tint reads well
    w, h = 160, 116
    im, d = new(w, h)
    body = (216, 222, 230, 255); body_d = shade(body, 0.8); body_l = shade(body, 1.1)
    win = (40, 46, 60, 255)
    cx = w // 2
    # ground shadow
    d.ellipse([18, h-16, w-18, h-2], fill=(0,0,0,70))
    # rear wheels
    for wx in (30, w-30):
        d.rounded_rectangle([wx-14, h-30, wx+14, h-8], radius=6, fill=(28, 26, 34, 255))
        d.rounded_rectangle([wx-9, h-26, wx+9, h-12], radius=4, fill=(60, 60, 70, 255))
    # main body (trapezoid, wider at the bottom = closer)
    d.polygon([28, h-22, w-28, h-22, w-40, 40, 40, 40], fill=body, outline=OUT)
    # roof / cabin
    d.polygon([54, 42, w-54, 42, w-64, 12, 64, 12], fill=body_l, outline=OUT)
    # rear window
    d.polygon([64, 40, w-64, 40, w-72, 18, 72, 18], fill=win)
    d.line([cx, 20, cx, 39], fill=shade(win, 1.3), width=2)  # wiper hint
    # trunk shading + number plate
    d.rounded_rectangle([cx-20, h-40, cx+20, h-28], radius=3, fill=(238, 238, 244, 255), outline=OUT)
    d.line([46, h-22, w-46, h-22], fill=body_d, width=2)
    # taillights (red bars)
    d.rounded_rectangle([34, h-52, 66, h-40], radius=4, fill=(232, 60, 60, 255), outline=(120, 26, 30, 255))
    d.rounded_rectangle([w-66, h-52, w-34, h-40], radius=4, fill=(232, 60, 60, 255), outline=(120, 26, 30, 255))
    # brake glow
    d.rounded_rectangle([37, h-50, 63, h-44], radius=3, fill=(255, 120, 120, 255))
    d.rounded_rectangle([w-63, h-50, w-37, h-44], radius=3, fill=(255, 120, 120, 255))
    # exhaust
    d.ellipse([cx-24, h-24, cx-16, h-18], fill=(40, 40, 48, 255))
    d.ellipse([cx+16, h-24, cx+24, h-18], fill=(40, 40, 48, 255))
    im.save('assets/img/car_back.png'); print('car_back', im.size)

def ped_front():
    w, h = 64, 104
    im, d = new(w, h)
    skin = (226, 178, 140, 255); shirt = (90, 150, 230, 255); pants = (44, 48, 64, 255); hair = (48, 38, 44, 255)
    cx = w // 2
    d.ellipse([cx-16, h-10, cx+16, h-2], fill=(0,0,0,70))
    # legs
    for lx in (-8, 8):
        d.rounded_rectangle([cx+lx-6, h-40, cx+lx+6, h-8], radius=4, fill=pants, outline=OUT, width=2)
        d.ellipse([cx+lx-7, h-12, cx+lx+7, h-4], fill=(34, 32, 40, 255))
    # torso
    d.rounded_rectangle([cx-16, h-72, cx+16, h-36], radius=8, fill=shirt, outline=OUT, width=2)
    # arms
    for ax in (-20, 20):
        d.rounded_rectangle([cx+ax-5, h-70, cx+ax+5, h-40], radius=5, fill=shade(shirt, 1.08), outline=OUT, width=2)
        d.ellipse([cx+ax-5, h-44, cx+ax+5, h-34], fill=skin)
    # head
    hy = h - 84
    d.ellipse([cx-13, hy-13, cx+13, hy+13], fill=skin, outline=OUT, width=2)
    d.pieslice([cx-13, hy-14, cx+13, hy+8], 178, 362, fill=hair)
    d.ellipse([cx-6, hy, cx-3, hy+4], fill=(30, 28, 40, 255))
    d.ellipse([cx+3, hy, cx+6, hy+4], fill=(30, 28, 40, 255))
    im.save('assets/img/ped_front.png'); print('ped_front', im.size)

def building(name, w, h, wall, neon):
    im, d = new(w, h)
    d.rectangle([4, 12, w-4, h], fill=wall, outline=shade(wall, 0.6), width=3)
    # neon roof trim
    d.rectangle([4, 12, w-4, 20], fill=neon)
    d.rectangle([0, 6, w, 14], fill=neon)
    # windows grid (some lit)
    r = 0
    for y in range(30, h-14, 26):
        for x in range(14, w-18, 22):
            r = (r * 7 + x + y) % 10
            lit = r < 6
            d.rectangle([x, y, x+12, y+16], fill=neon if lit else (26, 28, 38, 255))
        # floor line
        d.line([6, y+22, w-6, y+22], fill=shade(wall, 0.75), width=1)
    im.save('assets/img/%s.png' % name); print(name, im.size)

car_back(); ped_front()
building('bldg_a', 120, 240, (58, 66, 96, 255), (90, 230, 240, 255))
building('bldg_b', 108, 300, (92, 54, 86, 255), (250, 120, 190, 255))
print('race3d assets done')
