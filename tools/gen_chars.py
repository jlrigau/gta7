#!/usr/bin/env python3
"""Generate top-down street-character walkcycles (LPC 9x4 layout, 64x64 frames).
Style matches the engine's soft rounded look. 9 cols (0=idle,1-8=walk) x 4 rows
(row order: up, left, down, right — DIRS in engine.js)."""
import math, os
from PIL import Image, ImageDraw

FW = FH = 64
COLS, ROWS = 9, 4
CX = 32          # horizontal centre
BASE = 56        # feet baseline (origin 0.95)

def lerp(a, b, t): return tuple(int(a[i] + (b[i]-a[i])*t) for i in range(len(a)))
def shade(c, f):   # multiply toward black (f<1) or white (f>1)
    if f <= 1: return tuple(int(v*f) for v in c[:3]) + (c[3],) if len(c)==4 else tuple(int(v*f) for v in c)
    return tuple(min(255,int(v+(255-v)*(f-1))) for v in c[:3]) + ((c[3],) if len(c)==4 else ())

def ell(d, cx, cy, rx, ry, fill, outline=None, ow=2):
    d.ellipse([cx-rx, cy-ry, cx+rx, cy+ry], fill=fill, outline=outline, width=ow)

def rrect(d, cx, cy, w, h, r, fill, outline=None, ow=2):
    d.rounded_rectangle([cx-w/2, cy-h/2, cx+w/2, cy+h/2], radius=r, fill=fill, outline=outline, width=ow)


def draw_char(d, direction, phase, C):
    """direction in up/left/down/right; phase 0..1 walk cycle (None=idle)."""
    skin, skin_d = C['skin'], shade(C['skin'], 0.8)
    jak, jak_d, jak_l = C['jacket'], shade(C['jacket'], 0.72), shade(C['jacket'], 1.18)
    hair = C['hair']
    pants = C['pants']; pants_d = shade(pants, 0.75)
    OUT = (28, 24, 36, 255)

    walking = phase is not None
    swing = math.sin(phase*2*math.pi) if walking else 0.0     # leg/arm swing
    bob = (abs(math.sin(phase*2*math.pi)) * 2) if walking else 0.0
    yb = BASE - bob

    # ---- legs (behind body) ----
    legL = swing*4; legR = -swing*4
    for lx, off in ((-6, legL), (6, legR)):
        rrect(d, CX+lx, yb-6+off*0.0, 8, 16, 4, pants, OUT, 2)
        # shoe
        ell(d, CX+lx, yb-1+max(0,off)*0.2, 5, 3, (34,32,40,255))
    # apply vertical leg swing (lift)
    # (redraw with lift handled via off already minimal) -- keep simple

    bodyw, bodyh = 22, 24
    bodycy = yb - 20

    if direction in ('down', 'up'):
        # torso
        rrect(d, CX, bodycy, bodyw, bodyh, 9, jak, OUT, 2)
        rrect(d, CX, bodycy, bodyw, bodyh, 9, None, None, 0)
        # shading down the middle
        d.line([CX, bodycy-8, CX, bodycy+9], fill=jak_d, width=2)
        # arms
        armsw = swing*3
        for ax, a in ((-13, armsw), (13, -armsw)):
            ell(d, CX+ax, bodycy-2+a, 5, 9, jak_l, OUT, 2)
            ell(d, CX+ax, bodycy+6+a, 4, 4, skin)      # hand
        # head
        hy = bodycy - 18
        ell(d, CX, hy, 11, 11, skin, OUT, 2)
        if direction == 'down':
            # hair framing the face
            d.pieslice([CX-11, hy-11, CX+11, hy+7], 178, 362, fill=hair)
            # eyes + small smile
            ell(d, CX-4, hy+2, 1.6, 2.3, (30,28,40,255))
            ell(d, CX+4, hy+2, 1.6, 2.3, (30,28,40,255))
            d.arc([CX-4, hy+3, CX+4, hy+9], 20, 160, fill=skin_d, width=1)
            # cap: brim + shallow crown (forehead stays visible)
            if C.get('cap'):
                d.rounded_rectangle([CX-12, hy-4, CX+12, hy-1], radius=2, fill=C['cap'])
                d.pieslice([CX-11, hy-13, CX+11, hy+1], 182, 358, fill=C['cap'])
        else:  # up -> back of head, hair (+ cap crown)
            ell(d, CX, hy, 11, 11, hair, OUT, 2)
            if C.get('cap'):
                d.pieslice([CX-11, hy-11, CX+11, hy+9], 182, 358, fill=C['cap'])
                d.ellipse([CX-11, hy-2, CX+11, hy+4], fill=hair)
    else:
        # side view (left drawn; right handled by flip outside)
        sgn = -1 if direction == 'left' else 1
        # torso (narrower)
        rrect(d, CX+sgn*1, bodycy, 17, bodyh, 8, jak, OUT, 2)
        # back arm
        ell(d, CX-sgn*4, bodycy-1-swing*3, 4, 9, jak_d, OUT, 2)
        # head (profile)
        hy = bodycy - 18
        ell(d, CX+sgn*2, hy, 11, 11, skin, OUT, 2)
        # hair back
        d.pieslice([CX+sgn*2-11, hy-11, CX+sgn*2+11, hy+7], 90 if sgn>0 else 90, 300, fill=hair)
        d.chord([CX+sgn*2-11, hy-12, CX+sgn*2+11, hy+4], 150, 390, fill=hair)
        # face dot (eye)
        ell(d, CX+sgn*7, hy, 1.6, 2.2, (30,28,40,255))
        # nose hint
        ell(d, CX+sgn*10, hy+2, 1.4, 1.4, skin_d)
        if C.get('cap'):
            d.pieslice([CX+sgn*2-11, hy-12, CX+sgn*2+11, hy+2], 182, 358, fill=C['cap'])
            bx0, bx1 = sorted([CX+sgn*2, CX+sgn*14])
            d.rounded_rectangle([bx0, hy-4, bx1, hy-1], radius=2, fill=C['cap'])
        # front arm
        ell(d, CX+sgn*4, bodycy-1+swing*3, 4, 9, jak_l, OUT, 2)
        ell(d, CX+sgn*4, bodycy+7+swing*3, 3.5, 3.5, skin)


def build(C, out):
    sheet = Image.new('RGBA', (FW*COLS, FH*ROWS), (0,0,0,0))
    order = ['up', 'left', 'down', 'right']
    for r, direction in enumerate(order):
        for c in range(COLS):
            frame = Image.new('RGBA', (FW, FH), (0,0,0,0))
            d = ImageDraw.Draw(frame)
            phase = None if c == 0 else (c-1)/8.0
            drawdir = 'left' if direction in ('left','right') else direction
            draw_char(d, drawdir, phase, C)
            if direction == 'right':
                frame = frame.transpose(Image.FLIP_LEFT_RIGHT)
            sheet.paste(frame, (c*FW, r*FH), frame)
    sheet.save(out)
    print('wrote', out, sheet.size)

CHARS = {
    'player_vice': dict(skin=(226,178,140,255), jacket=(228,74,96,255), pants=(40,46,66,255),
                        hair=(46,38,44,255), cap=(250,210,80,255)),
    'player_cyan': dict(skin=(214,166,128,255), jacket=(60,196,210,255), pants=(38,40,58,255),
                        hair=(58,44,36,255)),
}
os.makedirs('assets/sheet', exist_ok=True)
build(CHARS['player_vice'], 'assets/sheet/player_vice.png')
build(CHARS['player_cyan'], 'assets/sheet/player_cyan.png')
