#!/usr/bin/env python3
"""위에서 매달린 조각 층(버드나무, 깃발, 등불)을 알파 세로 투영으로 한 줄씩 잘라 저장하고 [파일, x%, 너비%] 를 찍는다.
  uv run --no-project --with pillow --with numpy python tools/split_sway.py art/v2/rabbit/finish/tab/flags.webp
원본 층의 이름 뒤에 번호를 붙여 저장한다. 원본 파일은 지우지 않는다."""
import json, os, sys
import numpy as np
from PIL import Image

for src in sys.argv[1:]:
    im = Image.open(src).convert('RGBA')
    cols = (np.asarray(im.getchannel('A')) > 60).sum(0) > 1
    out, x, W = [], 0, im.width
    while x < W:
        if not cols[x]: x += 1; continue
        e = x
        while e < W and cols[e]: e += 1
        if e - x > W * .008:
            a, b = max(0, x - 4), min(W, e + 4)
            piece = im.crop((a, 0, b, im.height))
            piece = piece.crop((0, 0, b - a, piece.getbbox()[3]))
            name = f'{src[:-5]}{len(out)}.webp'
            piece.save(name, 'WEBP', quality=86, alpha_quality=92, method=4)
            out.append([name, round(a / W * 100, 2), round((b - a) / W * 100, 2)])
        x = e
    print(json.dumps(out, ensure_ascii=False))
