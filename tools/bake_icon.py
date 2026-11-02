#!/usr/bin/env python3
"""앱 아이콘·로고를 빛 상자로 찍는다(PLAN §5-5). 판은 tools/dev/icon.html, 그림은 art/icon/ 의 이미지 생성 층.
  python3 -m http.server 8765 를 켠 뒤
  uv run --no-project --with pillow python tools/bake_icon.py [A|B|C]   (기본 A)"""
import os, subprocess, sys, tempfile
from PIL import Image

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
PORT = os.environ.get('PORT', '8765')
c = sys.argv[1] if len(sys.argv) > 1 else 'A'
ICONS, BRAND = os.path.join(ROOT, 'assets/icons'), os.path.join(ROOT, 'assets/brand')
os.makedirs(ICONS, exist_ok=True); os.makedirs(BRAND, exist_ok=True)


def shot(out, query, w, h):
    subprocess.run([CHROME, '--headless=new', '--disable-gpu', '--hide-scrollbars', '--force-device-scale-factor=1', '--default-background-color=00000000',
                    f'--window-size={w},{h}', '--virtual-time-budget=4000', f'--screenshot={out}', f'http://localhost:{PORT}/tools/dev/icon.html?c={c}&{query}'],
                   check=True, capture_output=True)


def trim(path):  # 로고는 투명 여백을 잘라 낸다
    im = Image.open(path).convert('RGBA')
    im.crop(im.getchannel('A').point(lambda v: 255 if v > 8 else 0).getbbox()).save(path)


with tempfile.TemporaryDirectory() as tmp:
    raw = os.path.join(tmp, 'icon.png')
    shot(raw, 'view=icon', 1024, 1024)
    icon = Image.open(raw).convert('RGB')  # 앱 아이콘은 투명 없이
    icon.save(os.path.join(ICONS, 'app-icon-1024.png'))
    icon.resize((180, 180), Image.LANCZOS).save(os.path.join(ICONS, 'apple-touch-icon.png'))
    for s in (16, 32, 192, 512):
        icon.resize((s, s), Image.LANCZOS).save(os.path.join(ICONS, f'favicon-{s}.png'))

shot(os.path.join(BRAND, 'mark.png'), 'view=arch', 1024, 1024)
trim(os.path.join(BRAND, 'mark.png'))
for theme in ('dark', 'light'):
    for name, view, w, h in (('horizontal', 'logo-h', 1160, 420), ('vertical', 'logo-v', 1024, 800)):
        p = os.path.join(BRAND, f'logo-{name}-{theme}.png')
        shot(p, f'view={view}&theme={theme}', w, h)
        trim(p)
print('찍음:', ICONS, BRAND)
