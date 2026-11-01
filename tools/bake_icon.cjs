#!/usr/bin/env node
/* 앱 아이콘 굽기: python3 -m http.server 8765 를 켠 뒤 node tools/bake_icon.cjs → assets/icon-512.png, assets/icon-1024.png
   (Playwright 필요. 빛 상자 그리기 코드 그대로 찍는다 — 손으로 칠하지 않는다) */
const { chromium } = require('playwright');
const path = require('path');
(async () => {
  const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 1365, height: 1024 } });
  await p.goto('http://localhost:8765/tools/dev/icon.html'); await p.waitForSelector('body[data-ready]'); await p.waitForTimeout(600);
  const root = path.resolve(__dirname, '..');
  await p.screenshot({ path: path.join(root, 'assets/icon-1024.png'), clip: { x: (1365 - 1024) / 2, y: 0, width: 1024, height: 1024 } });
  const q = await b.newPage({ viewport: { width: 1365, height: 1024 }, deviceScaleFactor: .5 });
  await q.goto('http://localhost:8765/tools/dev/icon.html'); await q.waitForSelector('body[data-ready]'); await q.waitForTimeout(600);
  await q.screenshot({ path: path.join(root, 'assets/icon-512.png'), clip: { x: (1365 - 1024) / 2, y: 0, width: 1024, height: 1024 } });
  await b.close();
})();
