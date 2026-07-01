#!/usr/bin/env python3
"""Generate top-down street-character walkcycles (LPC 9x4 layout, 64x64 frames).
Two distinct, GTA-flavoured characters: a man and a woman — leaner proportions
(smaller head, defined shoulders/waist, real hairstyles & streetwear) rather than
chibi. 9 cols (0=idle, 1-8=walk) x 4 rows (up, left, down, right — engine DIRS)."""
import math, os
from PIL import Image, ImageDraw

FW = FH = 64
COLS, ROWS = 9, 4
CX = 32
BASE = 60          # feet baseline (origin 0.95)
OUT = (24, 20, 30, 255)

def shade(c, f):
    if f <= 1: return tuple(int(v*f) for v in c[:3]) + ((c[3],) if len(c) == 4 else ())
    return tuple(min(255, int(v + (255-v)*(f-1))) for v in c[:3]) + ((c[3],) if len(c) == 4 else ())

def ell(d, cx, cy, rx, ry, fill, outline=None, ow=1):
    d.ellipse([cx-rx, cy-ry, cx+rx, cy+ry], fill=fill, outline=outline, width=ow)

def rrect(d, cx, cy, w, h, r, fill, outline=None, ow=1):
    d.rounded_rectangle([cx-w/2, cy-h/2, cx+w/2, cy+h/2], radius=r, fill=fill, outline=outline, width=ow)


def draw(d, direction, phase, C):
    female = C.get("female")
    skin, skin_d = C["skin"], shade(C["skin"], 0.82)
    jak, jak_d, jak_l = C["jacket"], shade(C["jacket"], 0.7), shade(C["jacket"], 1.18)
    top = C["top"]
    pants, pants_d = C["pants"], shade(C["pants"], 0.75)
    hair, hair_d = C["hair"], shade(C["hair"], 0.78)
    shoe = C.get("shoe", (36, 34, 42, 255))

    walking = phase is not None
    sw = math.sin(phase * 2 * math.pi) if walking else 0.0
    bob = (abs(math.sin(phase * 2 * math.pi)) * 1.6) if walking else 0.0
    yb = BASE - bob

    shoulders = 8 if female else 10          # half-width at shoulders
    waist = 5 if female else 7
    torso_top = yb - 40
    torso_bot = yb - 16
    hy = torso_top - 8                        # head centre
    hr = 7                                    # head radius (smaller → less chibi)

    def legs():
        for lx, off in ((-4, sw * 4), (4, -sw * 4)):
            rrect(d, CX + lx, yb - 9 + max(0, -off) * 0.0, 6, 18, 3, pants, OUT, 1)
            d.line([CX + lx, yb - 16, CX + lx, yb - 2], fill=pants_d, width=1)
            ell(d, CX + lx + (1 if off > 0 else 0), yb - 2, 4, 2.4, shoe, OUT, 1)

    def torso_front(back=False):
        # tapered torso: shoulders -> waist
        pts = [(CX - shoulders, torso_top), (CX + shoulders, torso_top),
               (CX + waist, torso_bot), (CX - waist, torso_bot)]
        d.polygon(pts, fill=jak, outline=OUT)
        if not back:
            # open jacket showing the top/shirt
            d.polygon([(CX - 3, torso_top + 1), (CX + 3, torso_top + 1), (CX + 4, torso_bot), (CX - 4, torso_bot)], fill=top)
            d.line([CX - 3, torso_top + 2, CX - 4, torso_bot], fill=jak_d, width=1)
            d.line([CX + 3, torso_top + 2, CX + 4, torso_bot], fill=jak_d, width=1)
            if female:  # waist belt
                d.line([CX - waist, torso_bot - 2, CX + waist, torso_bot - 2], fill=jak_d, width=1)
        else:
            d.line([CX, torso_top + 2, CX, torso_bot - 1], fill=jak_d, width=1)
        # collar / shoulders highlight
        d.line([CX - shoulders + 1, torso_top + 1, CX + shoulders - 1, torso_top + 1], fill=jak_l, width=1)

    if direction in ("down", "up"):
        legs()
        # arms swing
        for ax, a in ((-shoulders - 1, sw * 3), (shoulders + 1, -sw * 3)):
            ell(d, CX + ax, torso_top + 8 + a, 3, 8, jak, OUT, 1)
            ell(d, CX + ax, torso_top + 14 + a, 2.6, 2.6, skin)     # hand
        torso_front(back=(direction == "up"))
        # head
        ell(d, CX, hy, hr, hr + 1, skin, OUT, 1)
        if direction == "down":
            # hairline framing the face
            d.pieslice([CX - hr, hy - hr - 2, CX + hr, hy + hr - 2], 176, 364, fill=hair)
            if female:
                d.pieslice([CX - hr - 1, hy - 3, CX - hr + 3, hy + hr + 3], 60, 300, fill=hair)
                d.pieslice([CX + hr - 3, hy - 3, CX + hr + 1, hy + hr + 3], 240, 480, fill=hair)
            # face
            ell(d, CX - 3, hy, 1.3, 1.9, (34, 30, 42, 255))
            ell(d, CX + 3, hy, 1.3, 1.9, (34, 30, 42, 255))
            d.arc([CX - 3, hy + 2, CX + 3, hy + 6], 20, 160, fill=skin_d, width=1)
        else:  # up: back of head
            ell(d, CX, hy, hr, hr + 1, hair, OUT, 1)
            if female:  # ponytail down the back
                ell(d, CX, hy + hr, 3, 6, hair, OUT, 1)
                ell(d, CX, hy + hr + 5, 2.4, 4, hair_d)
    else:
        sgn = -1 if direction == "left" else 1
        legs()
        # back arm
        ell(d, CX - sgn * 3, torso_top + 8 - sw * 3, 2.6, 8, jak_d, OUT, 1)
        # torso (profile, slimmer)
        pts = [(CX - 6, torso_top), (CX + 6, torso_top), (CX + 5, torso_bot), (CX - 5, torso_bot)]
        d.polygon(pts, fill=jak, outline=OUT)
        d.polygon([(CX + sgn * 1, torso_top + 1), (CX + sgn * 2, torso_bot)], fill=top)
        # head profile
        ell(d, CX + sgn * 1, hy, hr, hr + 1, skin, OUT, 1)
        d.chord([CX + sgn * 1 - hr, hy - hr - 2, CX + sgn * 1 + hr, hy + hr], 150, 400, fill=hair)
        ell(d, CX + sgn * 5, hy, 1.2, 1.8, (34, 30, 42, 255))          # eye
        ell(d, CX + sgn * (hr + 1), hy + 2, 1.2, 1.4, skin_d)          # nose
        if female:   # ponytail trailing behind
            ell(d, CX - sgn * (hr - 1), hy + 1, 2.6, 5, hair, OUT, 1)
            ell(d, CX - sgn * (hr + 1), hy + 5, 2, 3.4, hair_d)
        # front arm
        ell(d, CX + sgn * 3, torso_top + 8 + sw * 3, 2.6, 8, jak_l, OUT, 1)
        ell(d, CX + sgn * 3, torso_top + 14 + sw * 3, 2.4, 2.4, skin)


def build(C, out):
    sheet = Image.new("RGBA", (FW * COLS, FH * ROWS), (0, 0, 0, 0))
    order = ["up", "left", "down", "right"]
    for r, direction in enumerate(order):
        for c in range(COLS):
            frame = Image.new("RGBA", (FW, FH), (0, 0, 0, 0))
            d = ImageDraw.Draw(frame)
            phase = None if c == 0 else (c - 1) / 8.0
            drawdir = "left" if direction in ("left", "right") else direction
            draw(d, drawdir, phase, C)
            if direction == "right":
                frame = frame.transpose(Image.FLIP_LEFT_RIGHT)
            sheet.paste(frame, (c * FW, r * FH), frame)
    sheet.save(out)
    print("wrote", out, sheet.size)


CHARS = {
    # Man — short dark hair, charcoal leather jacket over a red tee, jeans, boots.
    "man": dict(skin=(214, 165, 124, 255), jacket=(48, 46, 58, 255), top=(206, 62, 62, 255),
                pants=(46, 52, 72, 255), hair=(40, 32, 34, 255), shoe=(30, 28, 34, 255)),
    # Woman — brown ponytail, magenta jacket over a dark top, jeans, sneakers.
    "woman": dict(female=True, skin=(228, 180, 146, 255), jacket=(214, 66, 128, 255), top=(40, 40, 54, 255),
                  pants=(52, 58, 80, 255), hair=(84, 52, 38, 255), shoe=(238, 238, 244, 255)),
}
os.makedirs("assets/sheet", exist_ok=True)
build(CHARS["man"], "assets/sheet/player_man.png")
build(CHARS["woman"], "assets/sheet/player_woman.png")
