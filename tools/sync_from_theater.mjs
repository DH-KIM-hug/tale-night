#!/usr/bin/env node
/* 동화극장(paper-tale-theater)의 읽어 주기 대본·녹음을 가져와 잠자리 대본으로 만든다.
   node tools/sync_from_theater.mjs <동화극장 경로> [id ...]     (id 를 빼면 content/<id>/edit.json 이 있는 모든 동화)

   1) tales/<id>/read_script_el.json 에 content/<id>/edit.json(docs/STORY_EDIT.md §6)을 덮는다: 빼기·꼬리 자르기·새 줄·장면 합치기·카드 글자
   2) tales/<id>/read_narration_el.js 에서 줄마다 녹음 경로를 찾고, 쓰는 mp3 만 audio/<id>/ 로 복사한다
   3) 꼬리 자르기는 ffmpeg 로 문장 사이 쉼에서 자른다(동화극장 tools/elevenlabs/trim_line.py 와 같은 규칙, 크레딧 없음)
   4) 새 줄은 audio/<id>/night_<해시>.mp3(tools/rec_night.py 가 만듦)가 있으면 쓰고, 없으면 edit.json 의 until_recorded(기존 녹음으로 잠시 대신)를 쓴다
   5) content/<id>/script.json, content/catalog.json 을 쓰고, 원본 커밋을 content/<id>/SOURCE 에 적는다
   녹음이 없는 줄이 하나라도 있으면 멈춘다(이 앱은 기계 음성으로 읽지 않는다). */
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { execFileSync, spawnSync } from 'node:child_process';

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const [theater, ...want] = process.argv.slice(2);
if (!theater) { console.error('사용법: node tools/sync_from_theater.mjs <동화극장 경로> [id ...]'); process.exit(1); }
const TH = path.resolve(theater);
const ids = want.length ? want : fs.readdirSync(path.join(ROOT, 'content')).filter(d => fs.existsSync(path.join(ROOT, 'content', d, 'edit.json')));

/* 홈 화면용 한 줄 소개 — 동화극장 카탈로그의 소개는 놀이(맞히기·응원) 이야기라 잠자리용으로 따로 쓴다 */
const LINE = {
  rabbit: '깡충 토끼는 낮잠을 자고, 엉금엉금 거북이는 쉬지 않고 걸어요.',
  sun_wind: '세게 부는 바람과 따뜻한 해님, 누가 나그네의 외투를 벗길까요?',
  turnip: '할아버지부터 아주 작은 생쥐까지, 다 함께 영차!',
  ugly_duckling: '놀림받던 회색 아기 오리가 겨울을 지나 하얀 백조로 자라요.',
};
const ORDER = ['rabbit', 'sun_wind', 'ugly_duckling', 'turnip'];

const readMap = (file, name) => {
  const s = fs.readFileSync(file, 'utf8');
  const m = s.match(new RegExp(name === 'NARRATION_CLIPS' && s.includes('Object.assign')
    ? 'Object\\.assign\\(NARRATION_CLIPS, (\\{[\\s\\S]*?\\})\\);' : 'const NARRATION_CLIPS = (\\{[\\s\\S]*?\\});'));
  if (!m) throw new Error(`맵을 못 읽음: ${file}`);
  return JSON.parse(m[1]);
};
const dur = f => parseFloat(execFileSync('ffprobe', ['-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', f]).toString());
const hash = s => crypto.createHash('sha1').update(s).digest('hex').slice(0, 10);
const rel = p => path.relative(ROOT, p);

function trimClip(src, dst, oldT, newT) {
  for (const [n, d] of [[-38, .18], [-34, .12], [-30, .08]]) {
    const r = spawnSync('ffmpeg', ['-hide_banner', '-i', src, '-af', `silencedetect=n=${n}dB:d=${d}`, '-f', 'null', '-']).stderr.toString();
    const st = [...r.matchAll(/silence_start: ([\d.]+)/g)].map(x => +x[1]);
    const en = [...r.matchAll(/silence_end: ([\d.]+)/g)].map(x => +x[1]);
    const total = dur(src);
    const gaps = st.map((a, i) => [a, en[i] ?? total]).filter(g => g[0] > .3 && g[0] < total - .3);
    if (!gaps.length) continue;
    const goal = total * newT.length / oldT.length;
    const [a, b] = gaps.reduce((x, g) => Math.abs((g[0] + g[1]) / 2 - goal) < Math.abs((x[0] + x[1]) / 2 - goal) ? g : x);
    const end = a + Math.min(.25, (b - a) / 2);
    execFileSync('ffmpeg', ['-y', '-loglevel', 'error', '-i', src, '-t', end.toFixed(3), '-af', `afade=t=out:st=${Math.max(0, end - .08).toFixed(3)}:d=0.08`, '-b:a', '128k', dst]);
    console.log(`  자름 ${path.basename(src)} ${total.toFixed(2)}s → ${end.toFixed(2)}s (목표 ${goal.toFixed(2)}s)`);
    return;
  }
  throw new Error(`문장 사이 쉼을 못 찾음: ${src}`);
}

const head = execFileSync('git', ['-C', TH, 'rev-parse', 'HEAD']).toString().trim();
const titles = readMap(path.join(TH, 'home_narration_el.js'), 'HOME');
const catalog = [];
fs.mkdirSync(path.join(ROOT, 'audio', 'titles'), { recursive: true });

for (const id of ids) {
  console.log(`· ${id}`);
  const E = JSON.parse(fs.readFileSync(path.join(ROOT, 'content', id, 'edit.json'), 'utf8'));
  const S = JSON.parse(fs.readFileSync(path.join(TH, 'tales', id, 'read_script_el.json'), 'utf8'));
  const CL = readMap(path.join(TH, 'tales', id, 'read_narration_el.js'), 'NARRATION_CLIPS');
  const byKey = Object.fromEntries(S.scenes.map(s => [s.key, s]));
  const lineAt = ref => { const [k, i] = ref.split('#'); const sc = byKey[k]; if (!sc) throw new Error(`${id}: 장면 없음 ${k}`); const l = sc.lines[+i]; if (!l) throw new Error(`${id}: 줄 없음 ${ref}`); return l; };

  // 원본이 바뀌어 번호가 어긋났는지 확인
  for (const [ref, pre] of Object.entries(E.match || {})) {
    const got = ref.includes('#') ? lineAt(ref).text : byKey[ref]?.card;
    if (!got || !got.startsWith(pre)) throw new Error(`${id}: ${ref} 가 "${pre}…" 이 아님 (지금: "${got}") — 동화극장 대본이 바뀌었으니 edit.json 을 고칠 것`);
  }

  const outDir = path.join(ROOT, 'audio', id);
  fs.rmSync(outDir, { recursive: true, force: true });
  fs.mkdirSync(outDir, { recursive: true });
  const night = fs.existsSync(path.join(ROOT, 'audio', `${id}.night`)) ? path.join(ROOT, 'audio', `${id}.night`) : null; // rec_night.py 결과 보관 폴더
  const copy = p => { const src = path.join(TH, p); const dst = path.join(outDir, path.basename(p)); if (!fs.existsSync(dst)) fs.copyFileSync(src, dst); return dst; };
  const mk = (text, clipsAbs) => ({ text, clips: clipsAbs.map(rel), dur: +clipsAbs.reduce((a, f) => a + dur(f), 0).toFixed(2) });
  const clipsOf = text => { const v = CL[text]; if (!v) throw new Error(`${id}: 녹음 없음 "${text}"`); return (Array.isArray(v) ? v : [v]).map(copy); };
  const roles = l => [...new Set((l.segs || []).map(g => g[0]))];
  const segRoles = l => (l.segs || []).map(g => g[0]); // 녹음이 여러 개면 segs 순서와 같다(함께 읽기 '인물 대사만 녹음')

  const scenes = [];
  for (const sc of S.scenes) {
    const cut = E.cut?.[sc.key];
    if (cut === '*') continue;
    const lines = [];
    sc.lines.forEach((l, i) => {
      const ref = `${sc.key}#${i}`;
      if (!(cut || []).includes(i)) {
        const tr = (E.trim || []).find(t => t.at === ref);
        if (tr) {
          const v = CL[l.text]; if (typeof v !== 'string') throw new Error(`${id}: 여러 녹음 줄은 자를 수 없음 ${ref}`);
          const dst = path.join(outDir, `trim_${hash(tr.text)}.mp3`);
          trimClip(path.join(TH, v), dst, l.text, tr.text);
          lines.push({ ...mk(tr.text, [dst]), roles: roles(l), segRoles: ['nar'], from: ref });
        } else lines.push({ ...mk(l.text, clipsOf(l.text)), roles: roles(l), segRoles: segRoles(l), from: ref });
      }
      for (const n of (E.new || []).filter(n => n.after === ref)) {
        const f = night && path.join(night, `night_${hash(n.text)}.mp3`);
        if (f && fs.existsSync(f)) {
          const dst = path.join(outDir, path.basename(f)); fs.copyFileSync(f, dst);
          lines.push({ ...mk(n.text, [dst]), roles: n.segs.map(g => g[0]), segRoles: n.segs.map(g => g[0]), new: true });
        } else {
          console.log(`  새 줄 녹음 아직 없음 → 기존 녹음으로 대신: "${n.text}"`);
          for (const u of n.until_recorded) {
            const src = lineAt(u.from); const all = clipsOf(src.text);
            const use = u.part == null ? all : [all[u.part]];
            const sr = u.part == null ? segRoles(src) : [src.segs[u.part][0]];
            lines.push({ ...mk(u.text || src.text, use), roles: [...new Set(sr)], segRoles: sr, stand_in: n.text });
          }
        }
      }
    });
    scenes.push({ key: sc.key, card: E.card?.[sc.key] ?? sc.card, lines });
  }
  for (const [a, b] of E.merge || []) {
    const ia = scenes.findIndex(s => s.key === a), ib = scenes.findIndex(s => s.key === b);
    if (ia < 0 || ib < 0) throw new Error(`${id}: 합칠 장면 없음 ${a}+${b}`);
    scenes[ia].lines.push(...scenes[ib].lines); scenes[ia].merged = b; scenes.splice(ib, 1);
  }

  const title = S.title;
  const tclip = titles[title]; if (!tclip) throw new Error(`${id}: 제목 녹음 없음`);
  fs.copyFileSync(path.join(TH, tclip), path.join(ROOT, 'audio', 'titles', `${id}.mp3`));
  const out = { tale: id, title, source: `paper-tale-theater@${head.slice(0, 10)} tales/${id}/read_script_el.json + content/${id}/edit.json`, scenes };
  fs.writeFileSync(path.join(ROOT, 'content', id, 'script.json'), JSON.stringify(out, null, 1));
  fs.writeFileSync(path.join(ROOT, 'content', id, 'SOURCE'), `${head}\n`);
  const nLines = scenes.reduce((a, s) => a + s.lines.length, 0);
  const secs = scenes.reduce((a, s) => a + s.lines.reduce((b, l) => b + l.dur + .7, 0) + 1.5, 0);
  const mb = fs.readdirSync(outDir).reduce((a, f) => a + fs.statSync(path.join(outDir, f)).size, 0) / 1e6;
  catalog.push({ id, title, line: LINE[id] || '', scenes: scenes.length, lines: nLines, readMin: Math.max(1, Math.round(secs / 60)), standIn: scenes.some(s => s.lines.some(l => l.stand_in)) });
  console.log(`  ${scenes.length}장면 ${nLines}줄, 약 ${(secs / 60).toFixed(1)}분, 녹음 ${mb.toFixed(1)}MB`);
}

const catFile = path.join(ROOT, 'content', 'catalog.json');
const old = fs.existsSync(catFile) ? JSON.parse(fs.readFileSync(catFile, 'utf8')).tales : [];
const merged = [...old.filter(t => !catalog.some(c => c.id === t.id)), ...catalog].sort((a, b) => (ORDER.indexOf(a.id) + 99) % 99 - (ORDER.indexOf(b.id) + 99) % 99);
fs.writeFileSync(catFile, JSON.stringify({ source: `paper-tale-theater@${head.slice(0, 10)}`, tales: merged }, null, 1));
console.log('끝: content/catalog.json');
