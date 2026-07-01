#!/usr/bin/env python3
"""Top-down police cruiser (64x64) — dark blue body, white doors, red/blue lightbar."""
import os
from PIL import Image, ImageDraw
os.makedirs('assets/img', exist_ok=True)
OUT=(22,20,30,255)
def shade(c,f):
    if f<=1: return tuple(int(v*f) for v in c[:3])+((c[3],) if len(c)==4 else ())
    return tuple(min(255,int(v+(255-v)*(f-1))) for v in c[:3])+((c[3],) if len(c)==4 else ())
im=Image.new('RGBA',(64,64),(0,0,0,0)); d=ImageDraw.Draw(im)
body=(44,58,120,255); win=(36,42,58,255); cx,cy=32,33
# wheels
for wy in (cy-13,cy+13):
    for wx in (cx-13,cx+11):
        d.rounded_rectangle([wx-4,wy-3,wx+4,wy+3],radius=2,fill=(28,26,34,255))
# body pointing right
d.rounded_rectangle([cx-22,cy-11,cx+22,cy+11],radius=9,fill=body,outline=OUT,width=2)
# white door panels
d.rectangle([cx-10,cy-11,cx+6,cy-4],fill=(232,236,244,255))
d.rectangle([cx-10,cy+4,cx+6,cy+11],fill=(232,236,244,255))
# windshield / roof / rear
d.polygon([cx+4,cy-8, cx+16,cy-6, cx+16,cy+6, cx+4,cy+8], fill=win)
d.polygon([cx-8,cy-7, cx-18,cy-5, cx-18,cy+5, cx-8,cy+7], fill=win)
# lightbar on the roof (red + blue)
d.rounded_rectangle([cx-6,cy-7,cx+3,cy+7],radius=2,fill=(60,66,90,255),outline=OUT,width=1)
d.rectangle([cx-5,cy-6,cx+1,cy-1],fill=(240,60,60,255))
d.rectangle([cx-5,cy+1,cx+1,cy+6],fill=(70,120,255,255))
# headlights
d.ellipse([cx+19,cy-9,cx+23,cy-5],fill=(250,250,210,255))
d.ellipse([cx+19,cy+5,cx+23,cy+9],fill=(250,250,210,255))
im.save('assets/img/police.png'); print('police.png', im.size)
