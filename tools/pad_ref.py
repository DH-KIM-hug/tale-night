#!/usr/bin/env python3
"""태블릿 완성 그림을 회색 판에 얹어 아이폰 가로·세로 완성 그림의 기준 그림을 만든다(docs/SCENE_PLAN.md).
  uv run --no-project --with pillow python tools/pad_ref.py art_src/v2/<동화>/<장소>
가로: 높이에 맞춰 가운데. 세로: 너비에 맞춰 아래 가운데(위는 하늘, 아래는 땅이 이어지도록)."""
import os, sys
from PIL import Image

for d in sys.argv[1:]:
    tab = Image.open(os.path.join(d, 'tab/comp.png')).convert('RGB')
    for fmt, (W, H) in {'land': (1844, 853), 'port': (851, 1847)}.items():
        out = os.path.join(d, fmt, 'ref_pad.png')
        if os.path.exists(out): continue
        pad = Image.new('RGB', (W, H), (128, 128, 128))
        if fmt == 'land':
            w = round(tab.width * H / tab.height); pad.paste(tab.resize((w, H), Image.LANCZOS), ((W - w) // 2, 0))
        else:
            h = round(tab.height * W / tab.width); pad.paste(tab.resize((W, h), Image.LANCZOS), (0, 860))
        os.makedirs(os.path.dirname(out), exist_ok=True); pad.save(out)
        print(out)
