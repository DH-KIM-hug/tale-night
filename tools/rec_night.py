#!/usr/bin/env python3
"""잠자리 대본의 새 줄을 녹음한다(docs/STORY_EDIT.md §6-2).
  python3 tools/rec_night.py <동화극장 경로> [id ...]      (id 를 빼면 content/<id>/edit.json 에 new 가 있는 모든 동화)
  --dry  글자 수만 센다

- content/<id>/edit.json 의 new[] 줄을 동화극장 tools/elevenlabs/gen_tale.py 의 tts()·tagged() 로 만든다.
  목소리·모델·설정은 동화극장 tales/<id>/voice_script_el.json 그대로(배역 목소리가 섞이지 않게).
- 결과는 이 레포의 audio/<id>.night/night_<해시>.mp3. 동화극장 레포에는 아무것도 쓰지 않는다.
- API 키는 ~/.config/elevenlabs/key (어느 레포에도 두지 않음).
- 만든 뒤 node tools/sync_from_theater.mjs <동화극장 경로> 를 다시 돌리면 임시로 대신하던 줄(until_recorded)이 새 녹음으로 바뀐다."""
import hashlib, json, os, sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
args = [a for a in sys.argv[1:] if not a.startswith('--')]
if not args:
    sys.exit(__doc__)
TH = os.path.abspath(args[0]); ids = args[1:]
dry = '--dry' in sys.argv
if not ids:
    ids = [d for d in sorted(os.listdir(os.path.join(ROOT, 'content'))) if os.path.exists(os.path.join(ROOT, 'content', d, 'edit.json'))]

if not dry:
    sys.path.insert(0, os.path.join(TH, 'tools', 'elevenlabs'))
    os.chdir(os.path.join(TH, 'tools', 'elevenlabs'))
    import gen_tale  # noqa: E402  (키가 없으면 여기서 멈춘다)

total = 0
for tid in ids:
    E = json.load(open(os.path.join(ROOT, 'content', tid, 'edit.json')))
    if not E.get('new'):
        continue
    V = json.load(open(os.path.join(TH, 'tales', tid, 'voice_script_el.json')))
    out = os.path.join(ROOT, 'audio', f'{tid}.night'); os.makedirs(out, exist_ok=True)
    for n in E['new']:
        h = hashlib.sha1(n['text'].encode()).hexdigest()[:10]   # sync_from_theater.mjs 와 같은 해시
        f = os.path.join(out, f'night_{h}.mp3')
        chars = sum(len(s[1]) for s in n['segs'])
        if os.path.exists(f):
            print(f'· {tid}: 있음 {os.path.basename(f)} "{n["text"]}"'); continue
        total += chars
        if dry:
            print(f'· {tid}: {chars}자 "{n["text"]}"'); continue
        assert len(n['segs']) == 1, '새 줄은 한 배역 한 녹음만(STORY_EDIT §1: 내레이터 한 줄)'
        role, text, emo, direction = (n['segs'][0] + [None, None])[:4]
        voice = V['voices'][role]
        model = (V.get('models') or {}).get(role, gen_tale.MODEL)
        settings = (V.get('settings') or {}).get(role)
        if V.get('use_dir') is not None and role not in V['use_dir']: direction = None
        # gen_tale.py clip() 과 같은 규칙: '=' 로 시작하면 보낼 글 전체, 연기 지시가 있으면 감정 태그 대신 앞에 붙임
        say = direction[1:] if direction and direction.startswith('=') else (direction + ' ' + text) if direction else gen_tale.tagged(text, emo, model)
        gen_tale.tts(f, voice, say, model, settings)
        print(f'· {tid}: 만듦 {os.path.basename(f)} ({chars}자)')
print(f'새 녹음 {total}자' + (' (dry)' if dry else ''))
