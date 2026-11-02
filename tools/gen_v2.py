#!/usr/bin/env python3
"""새 그림 방식(docs/SCENE_PLAN.md)의 생성·배경 빼기. tools/art_jobs/v2_<묶음>.json 을 만든다. 이미 있으면 건너뜀.
  uv run --no-project --with pillow --with numpy --with scipy python tools/gen_v2.py v2_rabbit [id ...]
잡: {id, out, ref(기준 그림), prompt, solid(true면 인물처럼 잘라 저장), sky(true면 배경 빼지 않음)}. 원본은 art_src/v2/ 에 둔다."""
import json, os, subprocess, sys
import numpy as np
from PIL import Image
from scipy.ndimage import gaussian_filter, minimum_filter

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
CODEX = os.path.expanduser('~/.npm-global/bin/codex')
KEY = (' Everything else in the image is a perfectly FLAT solid pure magenta #FF00FF with no gradient, no shadow, no glow, including all gaps and holes. '
       'Crisp clean edges against the magenta.')


def generate(job, raw):
    os.makedirs(os.path.dirname(raw), exist_ok=True)
    pf = raw + '.prompt.txt'
    open(pf, 'w').write(job['prompt'] + ('' if job.get('sky') else KEY))
    ref = f" Pass this reference image in referenced_image_paths (read-only): {os.path.join(ROOT, job['ref'])} ." if job.get('ref') else ''
    inst = (f'Use your image generation tool (image_gen.imagegen) to create ONE image in the same aspect ratio as the reference. Read the full prompt from {pf} and pass it VERBATIM.{ref} '
            f'Save (copy) the generated image to {raw} . No other file changes, no installs, no git. Reply only SAVED or FAILED <reason>.')
    r = subprocess.run([CODEX, 'exec', '-s', 'workspace-write', '--skip-git-repo-check', '-C', ROOT, inst], stdin=subprocess.DEVNULL, capture_output=True, text=True, timeout=420)
    os.remove(pf)
    if not os.path.exists(raw): raise RuntimeError((r.stdout + r.stderr)[-300:])


def key(raw, out, job):
    """마젠타 정도로 알파를 만들고 가장자리를 한 픽셀 깎는다. 남색 그림이라 빨강이 초록보다 크면 마젠타 번짐으로 본다."""
    a = np.asarray(Image.open(raw).convert('RGB')).astype(float)
    if job.get('sky'): al = np.ones(a.shape[:2])
    else:
        m = np.minimum(a[..., 0], a[..., 2]) - a[..., 1]
        al = gaussian_filter(minimum_filter(np.clip((120 - m) / 70, 0, 1), 3), .6)
        if not job.get('warm'):
            a[..., 0] = np.minimum(a[..., 0], a[..., 1])
            a[..., 2] = np.minimum(a[..., 2], np.maximum(a[..., 1] * 2.2, a[..., 1] + 30))
    pic = Image.fromarray(np.dstack([a, al * 255]).astype(np.uint8), 'RGBA')
    if job.get('solid'): pic = pic.crop(pic.getchannel('A').point(lambda v: 255 if v > 100 else 0).getbbox())
    os.makedirs(os.path.dirname(out), exist_ok=True)
    pic.save(out, 'WEBP', quality=86, alpha_quality=92, method=4)
    print(f'{out}: {pic.size}, {os.path.getsize(out) // 1024}KB', flush=True)


def main():
    group, ids = sys.argv[1], sys.argv[2:]
    for job in json.load(open(os.path.join(ROOT, 'tools/art_jobs', group + '.json'))):
        if ids and job['id'] not in ids: continue
        out = os.path.join(ROOT, job['out'])
        raw = os.path.join(ROOT, 'art_src', os.path.relpath(job['out'], 'art')).replace('.webp', '.png')
        if os.path.exists(out): print('skip', job['id']); continue
        try:
            if not os.path.exists(raw): generate(job, raw)
            key(raw, out, job)
        except Exception as e:
            print(job['id'], 'FAIL', e, flush=True)


main()
