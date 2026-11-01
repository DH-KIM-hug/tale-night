#!/usr/bin/env node
/* 무대 점검: node tools/check_stage.mjs [id ...]
   - 대본(content/<id>/script.json)의 장면마다 stage.json 항목이 있는지
   - cue 의 line 이 장면 안에 있고, match 가 그 줄 글의 앞부분과 같은지
   - 동사·인형·자세·상자·빛 프리셋 이름이 맞는지
   - 그림·녹음 파일이 모두 있는지 */
import fs from 'node:fs';
import path from 'node:path';

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const PRESETS = ['night_forest', 'dusk', 'dream', 'moon', 'dawn', 'hearth', 'sea', 'snow'];
const FX = ['fireflies', 'snow', 'leaves', 'stars', 'none'];
const ACTS = ['in', 'out', 'walk', 'at', 'pose', 'face', 'lantern', 'show', 'hide'];
const ids = process.argv.slice(2).length ? process.argv.slice(2) : JSON.parse(fs.readFileSync(path.join(ROOT, 'content/catalog.json'))).tales.map(t => t.id);
let bad = 0;
const err = (id, m) => { bad++; console.log(`✗ ${id}: ${m}`); };
const has = p => fs.existsSync(path.join(ROOT, p));

for (const id of ids) {
  const script = JSON.parse(fs.readFileSync(path.join(ROOT, `content/${id}/script.json`)));
  const stage = JSON.parse(fs.readFileSync(path.join(ROOT, `content/${id}/stage.json`)));
  for (const [k, b] of Object.entries(stage.boxes)) for (const f of Object.values(b.layers)) if (!has(f)) err(id, `상자 ${k} 그림 없음 ${f}`);
  for (const [k, d] of Object.entries(stage.dolls)) for (const f of Object.values(d.poses)) if (!has(f)) err(id, `인형 ${k} 그림 없음 ${f}`);
  const keys = new Set(script.scenes.map(s => s.key));
  for (const k of Object.keys(stage.scenes)) if (!keys.has(k)) err(id, `대본에 없는 장면이 stage 에 있음: ${k}`);
  let lines = 0;
  for (const sc of script.scenes) {
    for (const l of sc.lines) { lines++; for (const c of l.clips) if (!has(c)) err(id, `녹음 없음 ${c}`); }
    const S = stage.scenes[sc.key];
    if (!S) { err(id, `stage 에 장면 없음: ${sc.key}`); continue; }
    if (!stage.boxes[S.box]) err(id, `${sc.key}: 상자 없음 ${S.box}`);
    if (S.light && !PRESETS.includes(S.light)) err(id, `${sc.key}: 빛 없음 ${S.light}`);
    if (S.fx && !FX.includes(S.fx)) err(id, `${sc.key}: 효과 없음 ${S.fx}`);
    const dollOk = (n, pose) => { const d = stage.dolls[n]; if (!d) return `인형 없음 ${n}`; if (pose && !d.poses[pose]) return `${n} 자세 없음 ${pose}`; return null; };
    for (const [n, v] of Object.entries(S.place || {})) { const e = dollOk(n, typeof v === 'string' ? v.split('@')[0] : v.pose); if (e) err(id, `${sc.key} place: ${e}`); }
    for (const c of S.cues || []) {
      const l = sc.lines[c.line];
      if (!l) { err(id, `${sc.key}: 줄 ${c.line} 없음`); continue; }
      if (c.match && !l.text.startsWith(c.match)) err(id, `${sc.key} 줄 ${c.line}: "${c.match}…" ≠ "${l.text}"`);
      for (const cmd of c.do) {
        const p = cmd.split(':');
        if (p[0] === 'light') { if (!PRESETS.includes(p[1])) err(id, `${sc.key}: 빛 없음 ${cmd}`); continue; }
        if (p[0] === 'fx') { if (!FX.includes(p[1])) err(id, `${sc.key}: 효과 없음 ${cmd}`); continue; }
        if (p[0] === 'power') continue;
        if (!ACTS.includes(p[1])) { err(id, `${sc.key}: 모르는 동사 ${cmd}`); continue; }
        const e = dollOk(p[0], p[1] === 'pose' ? p[2] : null); if (e) err(id, `${sc.key}: ${e} (${cmd})`);
      }
    }
  }
  const stand = script.scenes.flatMap(s => s.lines).filter(l => l.stand_in);
  console.log(`· ${id}: ${script.scenes.length}장면 ${lines}줄${stand.length ? ` · 새 줄 녹음 대기 1줄(지금은 기존 녹음 ${stand.length}줄로 대신)` : ''}`);
}
if (bad) { console.log(`문제 ${bad}개`); process.exit(1); } else console.log('통과');
