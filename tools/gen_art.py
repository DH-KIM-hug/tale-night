#!/usr/bin/env python3
"""tools/art_jobs/<묶음>.json 의 그림을 codex exec(image_gen)로 만들어 알파 webp 로 넣는다(docs/ART_LIST.md). 이미 있으면 건너뜀.
  uv run --no-project --with pillow --with numpy python tools/gen_art.py rabbit_village [id ...]
생성 원본(마젠타 배경 png)은 art_src/ 에 둔다. 원본이 있으면 다시 생성하지 않고 배경 제거만 한다."""
import json, os, re, subprocess, sys
import numpy as np
from PIL import Image

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
CODEX = os.path.expanduser('~/.npm-global/bin/codex')
STYLE_REF = os.path.expanduser('~/projects/2026/patjuk-game/assets/raw/lightbox_mock/lbl_mid.png')  # 빛 상자 시안의 층 그림
RULES = (' Plain WHITE paper only, one single flat sheet cut with a craft knife, softly lit from the front so it reads as white paper '
         'with very subtle fiber texture and faint grey shadow only along cut edges. The background behind the paper is a perfectly FLAT solid '
         'magenta #FF00FF everywhere (including inside every hole and gap) for chroma keying. Delicate intricate cut details with many small holes. '
         'No color on the paper, no faces drawn, no text, no outlines, no box, no table. Match the paper-cut style of the reference image, not its subject.')
BOX = (2048, 1536)  # 상자 층 4:3
DOLL = (1024, 1024)  # 종이 인형 한 자세
LIMIT_RE = re.compile(r'(usage limit|rate limit|limit reached|too many requests|quota|try again (?:at|in))', re.I)  # 한도면 다시 시도하지 않는다


def generate(job, raw):
    os.makedirs(os.path.dirname(raw), exist_ok=True)
    pf = raw + '.prompt.txt'
    open(pf, 'w').write(job['prompt'] + RULES)
    refs = ' '.join([STYLE_REF] + [os.path.join(ROOT, r) for r in job.get('refs', [])])
    inst = (f"Use your image generation tool (image_gen.imagegen) to create ONE image, {'square 1:1' if job.get('kind') == 'doll' else 'landscape 3:2'}. Read the full prompt from {pf} and pass it VERBATIM. "
            f"Pass these reference images in referenced_image_paths (read-only): {refs} . "
            f"Save (copy) the generated image to {raw} . No other file changes, no installs, no git. Reply only SAVED or FAILED <reason>.")
    txt = ''
    for attempt in range(3):  # 멈추면 프로세스 묶음째 끄고 다시 — subprocess.run(timeout) 은 안쪽 codex 를 고아로 남긴다(동화극장 run_simple.py 와 같은 이유)
        pr = subprocess.Popen([CODEX, 'exec', '-s', 'workspace-write', '--skip-git-repo-check', '-C', ROOT, inst], stdin=subprocess.DEVNULL, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True, start_new_session=True)
        try: txt = ''.join(pr.communicate(timeout=240))
        except subprocess.TimeoutExpired:
            os.killpg(pr.pid, 15)
            txt = ''.join(x or '' for x in pr.communicate()) + ' TIMEOUT'
        if os.path.exists(raw) or LIMIT_RE.search(txt): break
    os.remove(pf)
    if not os.path.exists(raw):
        raise RuntimeError(txt[-400:])


def key(raw, out, doll=False, fit=None):
    """마젠타 정도(min(R,B)-G)로 알파를 만든다. 종이는 흰색뿐이라 남은 색 번짐은 무채색으로 되돌린다."""
    im = Image.open(raw).convert('RGB')
    w, h = im.size
    if doll:
        im = im.resize(DOLL, Image.LANCZOS)
    else:
        nw = int(h * BOX[0] / BOX[1])  # 3:2 원본의 가운데를 4:3 으로
        im = im.crop(((w - nw) // 2, 0, (w - nw) // 2 + nw, h)).resize(BOX, Image.LANCZOS)
    a = np.asarray(im).astype(int)
    r, g, b = a[..., 0], a[..., 1], a[..., 2]
    m = np.minimum(r, b) - g
    alpha = np.clip((70 - m) * 255 / 45, 0, 255)
    rgb = np.dstack([np.minimum(r, g + 6), g, np.minimum(b, g + 6)])
    os.makedirs(os.path.dirname(out), exist_ok=True)
    pic = Image.fromarray(np.dstack([rgb, alpha]).astype(np.uint8), 'RGBA')
    if doll:  # 크기는 그대로, 발을 아래 가운데로 옮긴다(자세마다 머리 크기가 같게)
        x0, y0, x1, y1 = pic.getchannel('A').point(lambda v: 255 if v > 128 else 0).getbbox()
        moved = Image.new('RGBA', DOLL, (0, 0, 0, 0))
        moved.paste(pic, ((DOLL[0] - x0 - x1) // 2, DOLL[1] - y1))
        pic = moved
        alpha = np.asarray(pic)[..., 3]
    if os.path.basename(out).endswith('_near.webp'):  # 앞 풀숲은 화면 맨 아래에 붙인다(뜨면 뒤 층이 띠처럼 보인다)
        y1 = pic.getchannel('A').point(lambda v: 255 if v > 128 else 0).getbbox()[3]
        moved = Image.new('RGBA', pic.size, (0, 0, 0, 0))
        moved.paste(pic, (0, pic.size[1] - y1))
        pic = moved
    if fit:  # 그림을 줄여 가운데에, 아래 끝을 화면 아래에서 base 높이에 둔다(이미지 생성이 구도를 못 지킬 때)
        small = pic.crop(pic.getchannel('A').point(lambda v: 255 if v > 128 else 0).getbbox())
        small = small.resize((int(small.width * fit['scale']), int(small.height * fit['scale'])), Image.LANCZOS)
        moved = Image.new('RGBA', pic.size, (0, 0, 0, 0))
        moved.paste(small, ((pic.width - small.width) // 2, int(pic.height * (1 - fit['base'])) - small.height))
        pic = moved
    pic.save(out, 'WEBP', quality=88, alpha_quality=95, method=6)
    print(f'{out}: 투명 {100 * (alpha == 0).mean():.0f}%, {os.path.getsize(out) // 1024}KB', flush=True)


def main():
    group, ids = sys.argv[1], sys.argv[2:]
    for job in json.load(open(os.path.join(ROOT, 'tools/art_jobs', group + '.json'))):
        if ids and job['id'] not in ids: continue
        out = os.path.join(ROOT, job['out'])
        raw = os.path.join(ROOT, 'art_src', os.path.relpath(job['out'], 'art')).replace('.webp', '.png')
        if os.path.exists(out): print('skip', job['id']); continue
        try:
            if not os.path.exists(raw): generate(job, raw)
            key(raw, out, job.get('kind') == 'doll', job.get('fit'))
        except Exception as e:
            print(job['id'], 'FAIL', e, flush=True)


main()
