/* 빛 상자 그림 조각 — 흰 종이 한 장(채움) + 오린 구멍(빛이 새는 곳).
   그림은 모두 색 없이 모양만 만든다. 색·빛은 앱이 입힌다(PLAN §5-1).
   한 장 = { add: [svg 요소], cut: [svg 요소], back: [다시 채우는 요소] }
   → <mask> 안에서 add 흰색 → cut 검정 → back 흰색 순서로 그려 알파만 남긴다. */

export const W = 1600, H = 1200;

export function rng(seed) {
  let s = seed >>> 0 || 1;
  return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296);
}
const f = n => +n.toFixed(1);

export const sheet = () => ({ add: [], cut: [], back: [] });
const asSheet = s => typeof s === 'string' ? { add: [s], cut: [], back: [] } : s;
export const merge = (...sh) => { sh = sh.map(asSheet); return { add: sh.flatMap(s => s.add), cut: sh.flatMap(s => s.cut), back: sh.flatMap(s => s.back) }; };

export function svg(sh, w = W, h = H) {
  sh = asSheet(sh);
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}">` +
    `<defs><mask id="m" maskUnits="userSpaceOnUse" x="0" y="0" width="${w}" height="${h}">` +
    `<g fill="#fff">${sh.add.join('')}</g><g fill="#000">${sh.cut.join('')}</g><g fill="#fff">${sh.back.join('')}</g>` +
    `</mask></defs><rect width="${w}" height="${h}" fill="#fff" mask="url(#m)"/></svg>`;
}

/* ---------- 기본 도형 (svg 요소 문자열) ---------- */
export const circ = (x, y, r) => `<circle cx="${f(x)}" cy="${f(y)}" r="${f(r)}"/>`;
export const ell = (x, y, rx, ry, rot = 0) => `<ellipse cx="${f(x)}" cy="${f(y)}" rx="${f(rx)}" ry="${f(ry)}"${rot ? ` transform="rotate(${rot} ${f(x)} ${f(y)})"` : ''}/>`;
export const rect = (x, y, w, h, r = 0, rot = 0) => `<rect x="${f(x)}" y="${f(y)}" width="${f(w)}" height="${f(h)}"${r ? ` rx="${f(r)}"` : ''}${rot ? ` transform="rotate(${rot} ${f(x + w / 2)} ${f(y + h / 2)})"` : ''}/>`;
export const path = d => `<path d="${d}"/>`;
export const poly = pts => `<polygon points="${pts.map(p => p.map(f).join(',')).join(' ')}"/>`;
export const line = (x1, y1, x2, y2, w) => `<path d="M${f(x1)} ${f(y1)}L${f(x2)} ${f(y2)}" stroke="currentColor" stroke-width="${f(w)}" stroke-linecap="round" fill="none"/>`;
/* 가는 띠(줄기·다리 등)는 획 대신 채운 사각형을 돌려 쓴다(마스크 안에서 fill 색을 따르게) */
export function bar(x1, y1, x2, y2, w) {
  const dx = x2 - x1, dy = y2 - y1, L = Math.hypot(dx, dy), a = Math.atan2(dy, dx) * 180 / Math.PI;
  return `<rect x="${f(x1)}" y="${f(y1 - w / 2)}" width="${f(L)}" height="${f(w)}" rx="${f(w / 2)}" transform="rotate(${f(a)} ${f(x1)} ${f(y1)})"/>`;
}
/* 부드러운 닫힌 곡선(점들을 지나는 곡선) */
export function smooth(pts, closed = true) {
  const n = pts.length; let d = '';
  const P = i => pts[(i + n) % n];
  if (!closed) {
    d = `M${f(pts[0][0])} ${f(pts[0][1])}`;
    for (let i = 0; i < n - 1; i++) { const m = [(pts[i][0] + pts[i + 1][0]) / 2, (pts[i][1] + pts[i + 1][1]) / 2]; d += `Q${f(pts[i][0])} ${f(pts[i][1])} ${f(m[0])} ${f(m[1])}`; }
    return d + `L${f(pts[n - 1][0])} ${f(pts[n - 1][1])}`;
  }
  const m0 = [(P(0)[0] + P(1)[0]) / 2, (P(0)[1] + P(1)[1]) / 2];
  d = `M${f(m0[0])} ${f(m0[1])}`;
  for (let i = 1; i <= n; i++) { const m = [(P(i)[0] + P(i + 1)[0]) / 2, (P(i)[1] + P(i + 1)[1]) / 2]; d += `Q${f(P(i)[0])} ${f(P(i)[1])} ${f(m[0])} ${f(m[1])}`; }
  return d + 'Z';
}
/* 가장자리가 물결(오린 잎 덤불)인 원 */
export function scallopCircle(cx, cy, r, bumps = 12, depth = .12, rot = 0) {
  let d = '';
  for (let i = 0; i <= bumps; i++) {
    const a = rot + i / bumps * Math.PI * 2;
    const x = cx + Math.cos(a) * r, y = cy + Math.sin(a) * r;
    if (i === 0) { d = `M${f(x)} ${f(y)}`; continue; }
    const am = rot + (i - .5) / bumps * Math.PI * 2;
    const cxm = cx + Math.cos(am) * r * (1 + depth * 2.2), cym = cy + Math.sin(am) * r * (1 + depth * 2.2);
    d += `Q${f(cxm)} ${f(cym)} ${f(x)} ${f(y)}`;
  }
  return path(d + 'Z');
}
/* 잎 모양 */
export function leaf(x, y, len, wid, rot) {
  const d = `M0 0Q${f(len * .5)} ${f(-wid)} ${f(len)} 0Q${f(len * .5)} ${f(wid)} 0 0Z`;
  return `<path d="${d}" transform="translate(${f(x)} ${f(y)}) rotate(${f(rot)})"/>`;
}

/* ---------- 땅·산 ---------- */
/* 화면 아래를 채우는 능선: base(능선 평균 높이 y), amp, 굽이 수 */
export function ridge(base, amp, bumps, seed, { pointy = false, left = -40, right = W + 40, bottom = H + 10 } = {}) {
  const r = rng(seed); const pts = [];
  const n = bumps * 2 + 1;
  for (let i = 0; i <= n; i++) {
    const x = left + (right - left) * i / n;
    const up = i % 2 === 0 ? 1 : -.35;
    pts.push([x, base - amp * up * (.55 + r() * .6)]);
  }
  let d = `M${left} ${bottom}L${f(pts[0][0])} ${f(pts[0][1])}`;
  for (let i = 0; i < pts.length - 1; i++) {
    const a = pts[i], b = pts[i + 1];
    if (pointy) d += `L${f(b[0])} ${f(b[1])}`;
    else { const m = [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2]; d += `Q${f(a[0])} ${f(a[1])} ${f(m[0])} ${f(m[1])}`; }
  }
  return path(d + `L${f(pts.at(-1)[0])} ${f(pts.at(-1)[1])}L${right} ${bottom}Z`);
}
export function mountains(seed, base = 640, peaks = [[260, 360], [700, 300], [1180, 380], [1500, 330]]) {
  const sh = sheet(); const r = rng(seed);
  for (const [x, h] of peaks) {
    const w = h * (1.25 + r() * .3);
    sh.add.push(path(`M${f(x - w)} ${H}L${f(x - w * .25)} ${f(base - h * .82)}Q${f(x)} ${f(base - h * 1.04)} ${f(x + w * .25)} ${f(base - h * .82)}L${f(x + w)} ${H}Z`));
    // 눈 덮인 봉우리처럼 오린 띠
    sh.cut.push(path(`M${f(x - w * .2)} ${f(base - h * .74)}L${f(x - w * .1)} ${f(base - h * .66)}L${f(x)} ${f(base - h * .74)}L${f(x + w * .1)} ${f(base - h * .66)}L${f(x + w * .2)} ${f(base - h * .74)}L${f(x + w * .16)} ${f(base - h * .78)}L${f(x - w * .16)} ${f(base - h * .78)}Z`));
  }
  sh.add.push(rect(-20, base, W + 40, H - base + 20));
  return sh;
}
export function clouds(seed, list) {
  const sh = sheet();
  for (const [x, y, s] of list) {
    sh.add.push(ell(x, y, 90 * s, 34 * s), circ(x - 38 * s, y - 18 * s, 34 * s), circ(x + 12 * s, y - 34 * s, 44 * s), circ(x + 56 * s, y - 10 * s, 30 * s));
  }
  return sh;
}

/* ---------- 나무 ---------- */
export function roundTree(x, gy, h, seed, holes = 7) {
  const sh = sheet(); const r = rng(seed); const cr = h * .32, cy = gy - h + cr;
  sh.add.push(path(`M${f(x - h * .05)} ${gy + 4}L${f(x - h * .035)} ${f(cy + cr * .4)}L${f(x + h * .035)} ${f(cy + cr * .4)}L${f(x + h * .06)} ${gy + 4}Z`));
  sh.add.push(bar(x, cy + cr * .7, x + cr * .55, cy + cr * .25, h * .03), bar(x, cy + cr * .9, x - cr * .5, cy + cr * .4, h * .028));
  sh.add.push(scallopCircle(x, cy, cr, 11, .1, r()), scallopCircle(x - cr * .62, cy + cr * .35, cr * .62, 8, .12, r()), scallopCircle(x + cr * .64, cy + cr * .3, cr * .66, 8, .12, r()));
  for (let i = 0; i < holes; i++) {
    const a = r() * Math.PI * 2, d = cr * (.25 + r() * .55);
    sh.cut.push(leaf(x + Math.cos(a) * d, cy + Math.sin(a) * d * .8, cr * .26, cr * .09, r() * 180));
  }
  return sh;
}
export function pine(x, gy, h, tiers = 4) {
  const sh = sheet(); const w = h * .42;
  sh.add.push(rect(x - h * .03, gy - h * .2, h * .06, h * .22));
  for (let i = 0; i < tiers; i++) {
    const t = i / tiers, top = gy - h * (.18 + t * .82) - h * .2, ww = w * (1 - t * .7);
    sh.add.push(poly([[x - ww, gy - h * .16 - t * h * .78], [x, top], [x + ww, gy - h * .16 - t * h * .78]]));
  }
  return sh;
}
export function willow(x, gy, h, seed) {
  const sh = sheet(); const r = rng(seed);
  sh.add.push(path(`M${f(x - 22)} ${gy + 4}Q${f(x - 8)} ${f(gy - h * .4)} ${f(x - 30)} ${f(gy - h * .8)}L${f(x + 6)} ${f(gy - h * .82)}Q${f(x + 10)} ${f(gy - h * .4)} ${f(x + 26)} ${gy + 4}Z`));
  sh.add.push(scallopCircle(x - 12, gy - h * .86, h * .2, 10, .1));
  for (let i = 0; i < 16; i++) {
    const sx = x - h * .34 + i * h * .045, sy = gy - h * .86 + Math.abs(i - 7.5) * 6;
    const L = h * (.38 + r() * .3);
    sh.add.push(path(`M${f(sx - 9)} ${f(sy)}Q${f(sx - 14)} ${f(sy + L * .6)} ${f(sx - 3)} ${f(sy + L)}Q${f(sx + 6)} ${f(sy + L * .6)} ${f(sx + 9)} ${f(sy)}Z`));
  }
  return sh;
}
export function bareTree(x, gy, h, seed) {
  const sh = sheet(); const r = rng(seed);
  sh.add.push(path(`M${f(x - 18)} ${gy + 4}L${f(x - 8)} ${f(gy - h * .6)}L${f(x + 8)} ${f(gy - h * .6)}L${f(x + 18)} ${gy + 4}Z`));
  const branch = (bx, by, a, L, w, d) => {
    const ex = bx + Math.cos(a) * L, ey = by + Math.sin(a) * L;
    sh.add.push(bar(bx, by, ex, ey, w));
    if (d > 0) { branch(ex, ey, a - .45 - r() * .3, L * .68, w * .65, d - 1); branch(ex, ey, a + .4 + r() * .3, L * .62, w * .65, d - 1); }
  };
  branch(x, gy - h * .58, -Math.PI / 2 - .35, h * .3, 14, 3);
  branch(x, gy - h * .58, -Math.PI / 2 + .4, h * .28, 13, 3);
  return sh;
}

/* ---------- 풀·꽃·갈대 ---------- */
export function grass(y0, seed, { left = -20, right = W + 20, tall = 70, step = 26 } = {}) {
  const r = rng(seed); let d = `M${left} ${H + 10}L${left} ${y0}`;
  for (let x = left; x < right; x += step) {
    const t = tall * (.5 + r()), lean = (r() - .5) * step;
    d += `L${f(x + step * .35 + lean)} ${f(y0 - t)}L${f(x + step * .7)} ${f(y0 - r() * 8)}`;
  }
  return path(d + `L${right} ${y0}L${right} ${H + 10}Z`);
}
export function flower(x, y, s, stem = 60) {
  const sh = sheet();
  sh.add.push(bar(x, y, x, y + stem * s, 6 * s));
  for (let i = 0; i < 6; i++) { const a = i / 6 * Math.PI * 2; sh.add.push(circ(x + Math.cos(a) * 11 * s, y + Math.sin(a) * 11 * s, 8 * s)); }
  sh.cut.push(circ(x, y, 5 * s));
  sh.add.push(leaf(x, y + stem * s * .6, 22 * s, 7 * s, -35));
  return sh;
}
export function reeds(x0, x1, gy, h, seed, n = 14) {
  const sh = sheet(); const r = rng(seed);
  for (let i = 0; i < n; i++) {
    const x = x0 + (x1 - x0) * (i + r() * .6) / n, hh = h * (.6 + r() * .5), lean = (r() - .5) * 60;
    sh.add.push(path(`M${f(x - 7)} ${gy + 10}Q${f(x + lean * .3)} ${f(gy - hh * .5)} ${f(x + lean)} ${f(gy - hh)}Q${f(x + lean * .3 + 6)} ${f(gy - hh * .5)} ${f(x + 7)} ${gy + 10}Z`));
    if (r() < .55) sh.add.push(ell(x + lean * .92, gy - hh * .93, 9, 28, lean * .4));
  }
  return sh;
}
export function bush(x, y, s, seed) {
  const sh = sheet(); const r = rng(seed);
  sh.add.push(scallopCircle(x, y, 70 * s, 9, .12, r()), scallopCircle(x - 70 * s, y + 25 * s, 50 * s, 8, .12, r()), scallopCircle(x + 75 * s, y + 22 * s, 55 * s, 8, .12, r()));
  sh.add.push(rect(x - 125 * s, y + 20 * s, 255 * s, 80 * s));
  for (let i = 0; i < 4; i++) sh.cut.push(leaf(x - 50 * s + i * 32 * s, y - 10 * s + (i % 2) * 30 * s, 26 * s, 8 * s, r() * 180));
  return sh;
}

/* ---------- 집·소품 ---------- */
export function house(x, gy, w, h, { roof = 'gable', windows = 2, door = true, chimney = true } = {}) {
  const sh = sheet(); const top = gy - h;
  sh.add.push(rect(x - w / 2, top, w, h + 4));
  if (roof === 'gable') sh.add.push(poly([[x - w * .62, top + 8], [x, top - h * .62], [x + w * .62, top + 8]]));
  if (chimney) sh.add.push(rect(x + w * .2, top - h * .55, w * .12, h * .4));
  const ww = w * .2, wh = h * .3;
  for (let i = 0; i < windows; i++) {
    const wx = x - w / 2 + w * (i + 1) / (windows + 1) - ww / 2 - (door && windows === 1 ? w * .18 : 0), wy = top + h * .2;
    sh.cut.push(rect(wx, wy, ww * .46, wh * .46), rect(wx + ww * .54, wy, ww * .46, wh * .46), rect(wx, wy + wh * .54, ww * .46, wh * .46), rect(wx + ww * .54, wy + wh * .54, ww * .46, wh * .46));
  }
  if (door) sh.cut.push(path(`M${f(x + w * .12)} ${gy + 4}L${f(x + w * .12)} ${f(gy - h * .38)}Q${f(x + w * .22)} ${f(gy - h * .5)} ${f(x + w * .32)} ${f(gy - h * .38)}L${f(x + w * .32)} ${gy + 4}Z`));
  sh.cut.push(circ(x, top - h * .22, h * .07)); // 지붕 밑 둥근 창
  return sh;
}
export function mushroomHouse(x, gy, s, seed) {
  const sh = sheet(); const r = rng(seed);
  sh.add.push(path(`M${f(x - 60 * s)} ${gy + 4}L${f(x - 52 * s)} ${f(gy - 110 * s)}L${f(x + 52 * s)} ${f(gy - 110 * s)}L${f(x + 60 * s)} ${gy + 4}Z`));
  sh.add.push(path(`M${f(x - 135 * s)} ${f(gy - 100 * s)}Q${f(x - 130 * s)} ${f(gy - 250 * s)} ${f(x)} ${f(gy - 255 * s)}Q${f(x + 130 * s)} ${f(gy - 250 * s)} ${f(x + 135 * s)} ${f(gy - 100 * s)}Q${f(x)} ${f(gy - 80 * s)} ${f(x - 135 * s)} ${f(gy - 100 * s)}Z`));
  for (let i = 0; i < 5; i++) sh.cut.push(circ(x - 85 * s + i * 42 * s + r() * 10, gy - (150 + (i % 2) * 50) * s, (12 + r() * 8) * s));
  sh.cut.push(circ(x - 22 * s, gy - 70 * s, 16 * s));
  sh.cut.push(path(`M${f(x + 8 * s)} ${gy + 4}L${f(x + 8 * s)} ${f(gy - 50 * s)}Q${f(x + 24 * s)} ${f(gy - 70 * s)} ${f(x + 40 * s)} ${f(gy - 50 * s)}L${f(x + 40 * s)} ${gy + 4}Z`));
  return sh;
}
export function fence(x0, x1, gy, h) {
  const sh = sheet();
  for (let x = x0; x <= x1; x += 46) sh.add.push(path(`M${x - 10} ${gy + 4}L${x - 10} ${gy - h + 10}L${x} ${gy - h}L${x + 10} ${gy - h + 10}L${x + 10} ${gy + 4}Z`));
  sh.add.push(rect(x0 - 10, gy - h * .72, x1 - x0 + 20, 12), rect(x0 - 10, gy - h * .32, x1 - x0 + 20, 12));
  return sh;
}
export function flags(x0, x1, y, sag, n) {
  const sh = sheet();
  sh.add.push(rect(x0 - 8, y - 30, 16, 520), rect(x1 - 8, y - 30, 16, 520));
  for (let i = 0; i < n; i++) {
    const t = (i + .5) / n, x = x0 + (x1 - x0) * t, yy = y + sag * 4 * t * (1 - t);
    sh.add.push(poly([[x - 22, yy], [x + 22, yy], [x, yy + 46]]));
  }
  let d = `M${x0} ${y - 6}`; for (let i = 0; i <= 20; i++) { const t = i / 20; d += `L${f(x0 + (x1 - x0) * t)} ${f(y - 6 + sag * 4 * t * (1 - t))}`; }
  for (let i = 20; i >= 0; i--) { const t = i / 20; d += `L${f(x0 + (x1 - x0) * t)} ${f(y + 4 + sag * 4 * t * (1 - t))}`; }
  sh.add.push(path(d + 'Z'));
  return sh;
}
export function water(y, seed, { ripples = 10, left = -20, right = W + 20, bottom = H + 10 } = {}) {
  const sh = sheet(); const r = rng(seed);
  sh.add.push(rect(left, y, right - left, bottom - y));
  for (let i = 0; i < ripples; i++) {
    const x = left + 80 + r() * (right - left - 160), yy = y + 30 + r() * (bottom - y - 60), w = 60 + r() * 110;
    sh.cut.push(path(`M${f(x - w)} ${f(yy)}Q${f(x)} ${f(yy - 12)} ${f(x + w)} ${f(yy)}Q${f(x)} ${f(yy - 4)} ${f(x - w)} ${f(yy)}Z`));
  }
  return sh;
}

/* ---------- 앞 틀(frame) ---------- */
/* 나무 터널: 화면 가득 종이에 잎 가장자리 아치 구멍 */
export function tunnelFrame(seed, { cx = W / 2, cy = 640, rx = 690, ry = 560 } = {}) {
  const sh = sheet(); const r = rng(seed);
  sh.add.push(rect(-20, -20, W + 40, H + 40));
  const n = 34; const pts = [];
  for (let i = 0; i < n; i++) {
    const a = Math.PI + i / (n - 1) * Math.PI; // 위쪽 반원
    const k = 1 - r() * .06;
    pts.push([cx + Math.cos(a) * rx * k, cy + Math.sin(a) * ry * k]);
  }
  let d = `M${f(cx - rx)} ${H + 30}L${f(pts[0][0])} ${f(pts[0][1])}`;
  for (let i = 1; i < n; i++) {
    const a = pts[i - 1], b = pts[i]; const mx = (a[0] + b[0]) / 2, my = (a[1] + b[1]) / 2;
    const nx = mx - cx, ny = my - cy, L = Math.hypot(nx, ny);
    d += `Q${f(mx - nx / L * 38)} ${f(my - ny / L * 38)} ${f(b[0])} ${f(b[1])}`; // 잎 가장자리가 안쪽으로 볼록
  }
  sh.cut.push(path(d + `L${f(cx + rx)} ${H + 30}Z`));
  // 가장자리 잎 몇 장을 구멍 안쪽으로 다시 붙인다
  for (let i = 0; i < 14; i++) {
    const a = Math.PI + (i + .5) / 14 * Math.PI, x = cx + Math.cos(a) * rx * .97, y = cy + Math.sin(a) * ry * .97;
    sh.back.push(leaf(x, y, 70 + r() * 30, 18, a * 180 / Math.PI + 90 + (r() - .5) * 40));
  }
  // 아래 양쪽 뿌리·덤불
  sh.back.push(scallopCircle(cx - rx + 30, H - 40, 120, 9, .12), scallopCircle(cx + rx - 30, H - 30, 130, 9, .12));
  return sh;
}
/* 모서리 잎 덤불 틀 */
export function leafFrame(seed) {
  const sh = sheet(); const r = rng(seed);
  sh.add.push(rect(-20, -20, W + 40, 34), rect(-20, H - 24, W + 40, 44), rect(-20, -20, 34, H + 40), rect(W - 14, -20, 34, H + 40));
  for (const [x, y, a0] of [[0, 0, 0], [W, 0, 90], [W, H, 180], [0, H, 270]]) {
    for (let i = 0; i < 9; i++) {
      const a = (a0 + 8 + i * 9 + (r() - .5) * 6) * Math.PI / 180;
      sh.add.push(leaf(x, y, 230 + r() * 120, 46 + r() * 16, a * 180 / Math.PI));
    }
    sh.add.push(circ(x, y, 150));
  }
  for (let i = 0; i < 18; i++) sh.cut.push(leaf(r() * W, r() < .5 ? 40 + r() * 60 : H - 60 - r() * 60, 30, 6, r() * 180));
  return sh;
}
/* 가지 틀: 위에서 늘어진 가지 + 양옆 줄기 */
export function branchFrame(seed) {
  const sh = sheet(); const r = rng(seed);
  sh.add.push(path(`M-20 -20L${W + 20} -20L${W + 20} 60Q${W * .75} 120 ${W * .5} 70Q${W * .25} 120 -20 60Z`));
  sh.add.push(path(`M-20 -20L90 -20Q60 ${H * .5} 120 ${H + 20}L-20 ${H + 20}Z`), path(`M${W + 20} -20L${W - 90} -20Q${W - 50} ${H * .5} ${W - 130} ${H + 20}L${W + 20} ${H + 20}Z`));
  for (let i = 0; i < 26; i++) {
    const x = 80 + r() * (W - 160), y = 60 + Math.sin(x / W * Math.PI) * 50 + r() * 40;
    sh.add.push(leaf(x, y, 60 + r() * 50, 15 + r() * 6, 60 + r() * 60));
  }
  for (let i = 0; i < 10; i++) { const y = 120 + i * 100; sh.add.push(leaf(70, y, 90, 20, -20 + (r() - .5) * 40), leaf(W - 90, y + 40, 90, 20, 200 + (r() - .5) * 40)); }
  sh.add.push(rect(-20, H - 30, W + 40, 50));
  return sh;
}
/* 갈대 틀 */
export function reedFrame(seed) {
  return merge(reeds(-20, 260, H, 820, seed, 12), reeds(W - 260, W + 20, H, 820, seed + 1, 12), { add: [rect(-20, H - 30, W + 40, 50)], cut: [], back: [] });
}
/* 구름 틀 */
export function cloudFrame(seed) {
  const sh = sheet(); const r = rng(seed);
  sh.add.push(rect(-20, -20, W + 40, 40), rect(-20, H - 30, W + 40, 50));
  for (let i = 0; i < 9; i++) sh.add.push(circ(i * 200, -10 + r() * 30, 90 + r() * 50), circ(i * 200 + 60, H + 20 - r() * 30, 100 + r() * 60));
  for (let i = 0; i < 5; i++) sh.add.push(circ(-30 + r() * 40, 150 + i * 220, 110 + r() * 40), circ(W + 30 - r() * 40, 150 + i * 220, 110 + r() * 40));
  return sh;
}
/* 집 안 나무 틀(기둥·대들보) */
export function beamFrame() {
  const sh = sheet();
  sh.add.push(rect(-20, -20, W + 40, 120), rect(-20, -20, 120, H + 40), rect(W - 100, -20, 120, H + 40), rect(-20, H - 70, W + 40, 90));
  sh.add.push(poly([[100, 100], [260, 100], [100, 260]]), poly([[W - 100, 100], [W - 260, 100], [W - 100, 260]]));
  for (let x = 160; x < W - 100; x += 180) sh.cut.push(rect(x, 34, 90, 22, 10));
  return sh;
}
/* 극장 커튼 틀(스플래시·표지용) */
export function curtainFrame(seed) {
  const sh = sheet(); const r = rng(seed);
  let d = `M-20 -20L${W + 20} -20L${W + 20} 120`;
  for (let i = 10; i >= 0; i--) { const x = i * W / 10; d += `Q${f(x + W / 20)} 210 ${f(x)} 120`; }
  sh.add.push(path(d + 'Z'));
  sh.add.push(path(`M-20 -20L330 -20Q240 400 300 760Q200 900 120 ${H + 20}L-20 ${H + 20}Z`), path(`M${W + 20} -20L${W - 330} -20Q${W - 240} 400 ${W - 300} 760Q${W - 200} 900 ${W - 120} ${H + 20}L${W + 20} ${H + 20}Z`));
  for (let i = 0; i < 4; i++) { sh.cut.push(path(`M${60 + i * 60} 160Q${80 + i * 55} 600 ${50 + i * 40} ${H - 40}L${58 + i * 40} ${H - 40}Q${88 + i * 55} 600 ${68 + i * 60} 160Z`)); sh.cut.push(path(`M${W - 60 - i * 60} 160Q${W - 80 - i * 55} 600 ${W - 50 - i * 40} ${H - 40}L${W - 58 - i * 40} ${H - 40}Q${W - 88 - i * 55} 600 ${W - 68 - i * 60} 160Z`)); }
  sh.add.push(rect(-20, H - 60, W + 40, 80));
  for (let i = 0; i < 12; i++) sh.cut.push(circ(80 + i * 130 + r() * 10, 70, 10));
  return sh;
}
