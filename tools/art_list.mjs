#!/usr/bin/env node
/* 그림 목록 점검: node tools/art_list.mjs — stage.json 이 부르는 그림 중 있는 것·없는 것 (docs/ART_LIST.md) */
import fs from 'node:fs';
import path from 'node:path';

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const cat = JSON.parse(fs.readFileSync(path.join(ROOT, 'content/catalog.json')));
const need = new Map(); // 파일 → 쓰는 곳
const add = (f, where) => { if (!need.has(f)) need.set(f, new Set()); need.get(f).add(where); };
for (const { id } of cat.tales) {
  const st = JSON.parse(fs.readFileSync(path.join(ROOT, `content/${id}/stage.json`)));
  for (const [k, b] of Object.entries(st.boxes)) for (const f of Object.values(b.layers)) add(f, `${id}/${k}`);
  for (const [k, d] of Object.entries(st.dolls)) for (const f of Object.values(d.poses)) add(f, `${id}/${k}`);
}
for (const l of ['stage_far', 'stage_mid', 'stage_near', 'curtain_frame']) add(`art/app/${l}.webp`, '스플래시');
let have = 0;
const miss = [];
for (const [f, w] of need) { if (fs.existsSync(path.join(ROOT, f))) have++; else miss.push(`  ${f}  (${[...w].join(', ')})`); }
console.log(`그림 ${need.size}장 중 ${have}장 있음, ${miss.length}장 없음`);
if (miss.length) console.log(miss.join('\n'));
