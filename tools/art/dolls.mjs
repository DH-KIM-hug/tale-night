/* 종이 인형 — 200×200 캔버스(무리 인형은 넓게), 발은 아래 가운데(y≈196), 기본은 오른쪽을 본다.
   얼굴 있는 인물은 눈을 오린 구멍으로 둔다(빛이 눈으로 샌다). 사물에는 얼굴이 없다. */
import { sheet, merge, circ, ell, rect, path, poly, bar, leaf, scallopCircle } from './lib.mjs';

const eye = (x, y, r = 4.2) => circ(x, y, r);
const closedEye = (x, y) => path(`M${x - 6} ${y}Q${x} ${y + 5} ${x + 6} ${y}Q${x} ${y + 2.4} ${x - 6} ${y}Z`);

/* ---- 토끼 ---- */
export function rabbit(pose = 'stand') {
  const s = sheet();
  if (pose === 'stand') {
    s.add.push(ell(96, 142, 40, 42), circ(134, 96, 27), ell(126, 46, 9, 32, -12), ell(146, 50, 9, 31, 14), circ(56, 146, 13), ell(114, 186, 30, 9), ell(142, 128, 8, 16, 30));
    s.cut.push(eye(146, 90), ell(126, 48, 3.4, 20, -12), ell(146, 52, 3.4, 20, 14), circ(160, 102, 2.4));
  } else if (pose === 'run') {
    s.add.push(ell(96, 138, 50, 30, -8), circ(148, 108, 25), ell(110, 74, 8, 30, -62), ell(124, 72, 8, 30, -48), circ(46, 128, 12),
      bar(130, 152, 172, 176, 11), bar(70, 150, 28, 178, 12), ell(176, 178, 14, 6), ell(24, 182, 14, 6));
    s.cut.push(eye(158, 102), ell(110, 75, 3, 19, -62), ell(124, 73, 3, 19, -48));
  } else { // sleep
    s.add.push(ell(96, 172, 58, 24), circ(150, 164, 23), ell(110, 150, 34, 8, -10), ell(116, 160, 32, 8, -4), circ(38, 168, 11));
    s.cut.push(closedEye(156, 162), ell(110, 150, 22, 2.6, -10));
  }
  return s;
}
/* ---- 거북이 ---- */
export function turtle(pose = 'walk') {
  const s = sheet();
  const head = pose === 'stand' ? [166, 128] : [168, 152];
  s.add.push(path('M38 168Q40 104 100 102Q160 104 162 168Z'), rect(34, 160, 132, 14, 7));
  s.add.push(bar(150, 160, head[0] - 4, head[1] + 4, 20), circ(head[0], head[1], 16), poly([[36, 164], [16, 172], [36, 172]]));
  const legs = pose === 'walk' ? [[52, 170, 40, 192], [86, 172, 92, 194], [118, 172, 112, 194], [148, 170, 162, 192]] : [[54, 172, 52, 194], [86, 172, 86, 194], [118, 172, 118, 194], [148, 172, 150, 194]];
  for (const l of legs) s.add.push(bar(...l, 16));
  s.cut.push(eye(head[0] + 5, head[1] - 4, 3.6));
  for (const [x, y, r] of [[100, 128, 13], [72, 140, 10], [128, 140, 10], [86, 156, 7], [114, 156, 7], [100, 108, 6]]) s.cut.push(path(hex(x, y, r)));
  return s;
}
const hex = (x, y, r) => 'M' + [0, 1, 2, 3, 4, 5].map(i => { const a = Math.PI / 3 * i + Math.PI / 6; return `${(x + Math.cos(a) * r).toFixed(1)} ${(y + Math.sin(a) * r).toFixed(1)}`; }).join('L') + 'Z';
/* ---- 부엉이 ---- */
export function owl() {
  const s = sheet();
  s.add.push(ell(100, 122, 44, 58), poly([[60, 78], [70, 44], [86, 72]]), poly([[140, 78], [130, 44], [114, 72]]), rect(70, 176, 60, 10, 5), ell(56, 128, 14, 34, 12), ell(144, 128, 14, 34, -12));
  s.cut.push(circ(82, 98, 15), circ(118, 98, 15), poly([[94, 112], [106, 112], [100, 126]]));
  s.back.push(circ(84, 100, 6), circ(120, 100, 6));
  for (let i = 0; i < 3; i++) for (let j = 0; j < 3; j++) s.cut.push(path(`M${82 + j * 18} ${138 + i * 14}q8 8 16 0q-8 3 -16 0Z`));
  return s;
}
/* ---- 해님·바람 (말하는 인물이라 눈을 오린다) ---- */
export function sun(mood = 'smile') {
  const s = sheet();
  for (let i = 0; i < 12; i++) { const a = i / 12 * Math.PI * 2; s.add.push(poly([[100 + Math.cos(a - .14) * 56, 100 + Math.sin(a - .14) * 56], [100 + Math.cos(a) * 92, 100 + Math.sin(a) * 92], [100 + Math.cos(a + .14) * 56, 100 + Math.sin(a + .14) * 56]])); }
  s.add.push(circ(100, 100, 60));
  s.cut.push(mood === 'smile' ? closedEye(80, 92) : eye(80, 92, 6), mood === 'smile' ? closedEye(120, 92) : eye(120, 92, 6), path('M78 116Q100 136 122 116Q100 126 78 116Z'));
  for (let i = 0; i < 12; i++) { const a = i / 12 * Math.PI * 2 + .26; s.cut.push(circ(100 + Math.cos(a) * 44, 100 + Math.sin(a) * 44, 3)); }
  return s;
}
export function wind(mood = 'blow') {
  const s = sheet();
  s.add.push(circ(84, 104, 48), circ(126, 88, 38), circ(54, 80, 30), circ(120, 126, 30), circ(70, 134, 28));
  s.cut.push(eye(96, 92, 5), eye(122, 86, 5));
  if (mood === 'blow') {
    s.cut.push(circ(146, 106, 8));
    s.back.push(circ(146, 106, 3));
    for (const [y, L] of [[92, 36], [108, 44], [124, 30]]) s.add.push(bar(160, y, 160 + L, y - 4, 7));
  } else s.cut.push(path('M100 116Q112 108 124 116Q112 112 100 116Z'));
  for (const [x, y, r] of [[60, 120, 9], [78, 70, 7]]) s.cut.push(path(`M${x - r} ${y}a${r} ${r} 0 1 1 ${r * 2} 0a${r * .6} ${r * .6} 0 1 0 -${r * 1.2} 0Z`));
  return s;
}
/* ---- 사람 ---- */
function person(s, { x = 100, head = 22, top = 52, coatLen = 92, coat = 'long', facing = 1 } = {}) {
  const hx = x + 6 * facing, hy = top;
  s.add.push(circ(hx, hy, head));
  s.cut.push(eye(hx + 10 * facing, hy - 2));
  return { hx, hy };
}
export function traveler(pose = 'coat') {
  const s = sheet();
  // 모자
  s.add.push(ell(106, 34, 34, 7), path('M86 34Q88 8 108 8Q126 8 126 34Z'));
  s.cut.push(rect(88, 25, 36, 4));
  person(s, { x: 100, top: 52 });
  if (pose === 'coat') {
    s.add.push(path('M74 74Q100 64 128 74L140 160L64 160Z'), bar(80, 84, 66, 128, 14), bar(126, 84, 146, 124, 14));
    for (let i = 0; i < 4; i++) s.cut.push(circ(104, 90 + i * 18, 3.5));
    s.cut.push(path('M102 74L104 160L106 74Z'));
  } else if (pose === 'fan') { // 덥다, 모자로 부채질
    s.add.push(path('M84 74Q102 68 120 74L124 150L80 150Z'), bar(118, 84, 150, 50, 12), ell(154, 40, 22, 9, -30), bar(86, 84, 70, 124, 12));
    s.cut.push(rect(92, 96, 22, 4), rect(92, 110, 22, 4));
  } else { // 외투 벗음, 외투를 팔에 걸침
    s.add.push(path('M84 74Q102 68 120 74L124 150L80 150Z'), bar(86, 84, 70, 122, 12), bar(118, 84, 132, 118, 12), path('M124 112Q150 108 156 150L132 166L120 124Z'));
    s.cut.push(rect(92, 96, 22, 4), rect(92, 110, 22, 4));
  }
  s.add.push(bar(90, 150, 82, 192, 14), bar(112, 150, 122, 192, 14), ell(80, 194, 14, 5), ell(126, 194, 14, 5));
  s.add.push(bar(150, 96, 160, 194, 6)); // 지팡이
  return s;
}
export function grandpa(pose = 'stand') {
  const s = sheet();
  const pull = pose === 'pull';
  s.add.push(circ(100, 52, 23), path('M86 60Q100 98 116 60Z'), ell(84, 44, 8, 10));
  s.cut.push(eye(110, 46), path('M92 70Q100 80 110 70Q100 76 92 70Z'));
  s.add.push(path(pull ? 'M80 78Q100 70 120 80L130 150L74 150Z' : 'M78 78Q100 70 122 78L128 152L72 152Z'));
  s.cut.push(rect(76, 128, 52, 6));
  if (pull) s.add.push(bar(118, 90, 170, 80, 13), bar(84, 92, 160, 96, 13)); else s.add.push(bar(80, 86, 66, 132, 13), bar(120, 86, 134, 132, 13));
  s.add.push(bar(90, 150, pull ? 76 : 88, 192, 15), bar(112, 150, pull ? 112 : 114, 192, 15), ell(pull ? 74 : 86, 194, 14, 5), ell(116, 194, 14, 5));
  return s;
}
export function grandma() {
  const s = sheet();
  s.add.push(circ(100, 54, 22), circ(84, 36, 12));
  s.cut.push(eye(110, 50));
  s.add.push(path('M80 78Q100 70 120 78L136 180L64 180Z'), bar(84, 88, 150, 92, 12), bar(116, 88, 158, 84, 12));
  s.cut.push(path('M88 112L114 112L120 176L84 176Z'));
  s.back.push(rect(92, 120, 22, 4), rect(92, 134, 24, 4));
  s.add.push(ell(86, 192, 14, 6), ell(116, 192, 14, 6), rect(78, 176, 46, 14));
  return s;
}
export function girl() {
  const s = sheet();
  s.add.push(circ(100, 66, 21), circ(80, 58, 10), circ(120, 58, 10), bar(76, 60, 70, 82, 8), bar(124, 60, 132, 82, 8));
  s.cut.push(eye(109, 64), circ(76, 56, 3), circ(124, 56, 3));
  s.add.push(poly([[100, 86], [140, 160], [60, 160]]), bar(92, 98, 150, 96, 10), bar(108, 98, 156, 104, 10));
  s.cut.push(circ(100, 120, 4), circ(92, 140, 4), circ(110, 140, 4));
  s.add.push(bar(88, 158, 86, 192, 11), bar(112, 158, 114, 192, 11), ell(86, 194, 11, 5), ell(116, 194, 11, 5));
  return s;
}
export function farmer() {
  const s = sheet();
  s.add.push(ell(100, 34, 44, 9), path('M80 34Q82 12 100 12Q118 12 120 34Z'));
  s.add.push(circ(100, 54, 21));
  s.cut.push(eye(110, 52), rect(82, 26, 36, 4));
  s.add.push(path('M78 78Q100 70 122 78L128 152L72 152Z'), bar(80, 86, 64, 132, 13), bar(120, 86, 150, 116, 13));
  s.cut.push(rect(86, 96, 6, 50), rect(108, 96, 6, 50));
  s.add.push(bar(90, 150, 86, 192, 15), bar(112, 150, 116, 192, 15), ell(84, 194, 14, 5), ell(118, 194, 14, 5), bar(156, 60, 140, 194, 6));
  return s;
}
/* ---- 동물 ---- */
export function dog() {
  const s = sheet();
  s.add.push(ell(94, 136, 46, 28), circ(146, 104, 24), ell(162, 116, 16, 11), ell(132, 100, 9, 22, 20), bar(52, 124, 30, 92, 9));
  for (const x of [62, 80, 112, 128]) s.add.push(bar(x, 150, x, 192, 12));
  s.cut.push(eye(150, 98), circ(176, 112, 3));
  return s;
}
export function cat(pose = 'sit') {
  const s = sheet();
  if (pose === 'sit') {
    s.add.push(path('M70 190Q60 120 96 106Q132 120 124 190Z'), circ(100, 86, 26), poly([[78, 74], [80, 44], [96, 64]]), poly([[122, 74], [120, 44], [104, 64]]), path('M120 186Q168 186 160 140Q156 126 150 136Q156 170 118 172Z'));
    s.cut.push(path('M84 84Q90 78 96 84Q90 81 84 84Z'), path('M106 84Q112 78 118 84Q112 81 106 84Z'), poly([[97, 94], [103, 94], [100, 98]]));
  } else { // 서서 무언가 잡음
    s.add.push(ell(96, 140, 44, 22), circ(144, 118, 22), poly([[130, 104], [130, 80], [144, 98]]), poly([[152, 100], [160, 78], [162, 102]]), path('M54 136Q20 120 30 90Q36 84 40 92Q34 116 58 126Z'));
    for (const x of [66, 82, 110, 124]) s.add.push(bar(x, 150, x, 192, 10));
    s.cut.push(path('M146 114Q152 108 158 114Q152 111 146 114Z'));
  }
  return s;
}
export function mouse() {
  const s = sheet();
  s.add.push(ell(96, 170, 30, 20), circ(126, 160, 15), circ(118, 144, 10), path('M66 172Q30 176 24 150Q22 144 28 148Q36 170 68 164Z'));
  s.cut.push(eye(132, 156, 3), circ(118, 144, 4.5));
  s.add.push(bar(86, 184, 84, 194, 6), bar(108, 184, 110, 194, 6));
  return s;
}
export function turnip(size = 'big') {
  const s = sheet();
  if (size === 'sprout') {
    s.add.push(leaf(100, 196, 70, 22, -110), leaf(100, 196, 64, 20, -70), rect(80, 190, 40, 8, 4));
    s.cut.push(leaf(100, 186, 40, 3, -110), leaf(100, 186, 36, 3, -70));
    return s;
  }
  // 커다란 순무: 땅에서 반쯤 나온 뿌리 + 큰 잎
  for (const a of [-130, -110, -90, -70, -50]) s.add.push(leaf(100, 110, 90, 26, a));
  s.add.push(path('M50 150Q46 104 100 104Q154 104 150 150Q146 186 100 196Q54 186 50 150Z'));
  s.cut.push(path('M70 140Q100 128 130 140Q100 134 70 140Z'), path('M76 160Q100 150 124 160Q100 155 76 160Z'));
  for (const a of [-130, -90, -50]) s.cut.push(leaf(100, 104, 62, 3, a));
  return s;
}
export function pot() {
  const s = sheet();
  s.add.push(path('M44 110L156 110L148 178Q100 196 52 178Z'), rect(36, 100, 128, 16, 8), rect(22, 120, 26, 10, 5), rect(152, 120, 26, 10, 5));
  for (let i = 0; i < 3; i++) s.add.push(path(`M${76 + i * 24} 92Q${66 + i * 24} 74 ${78 + i * 24} 58Q${90 + i * 24} 42 ${80 + i * 24} 26L${88 + i * 24} 26Q${98 + i * 24} 42 ${86 + i * 24} 58Q${74 + i * 24} 74 ${84 + i * 24} 92Z`));
  s.cut.push(rect(60, 140, 80, 6, 3));
  return s;
}
/* 오리·새 */
function duckShape(s, x, y, k, { neck = 0, wingCut = true, eyeOpen = true } = {}) {
  s.add.push(path(`M${x - 46 * k} ${y - 6 * k}Q${x - 60 * k} ${y - 34 * k} ${x - 40 * k} ${y - 26 * k}Q${x - 6 * k} ${y - 34 * k} ${x + 20 * k} ${y - 24 * k}Q${x + 44 * k} ${y - 10 * k} ${x + 36 * k} ${y + 8 * k}Q${x} ${y + 26 * k} ${x - 46 * k} ${y - 6 * k}Z`));
  s.add.push(bar(x + 22 * k, y - 22 * k, x + 28 * k, y - (44 + neck) * k, 16 * k), circ(x + 30 * k, y - (52 + neck) * k, 16 * k), path(`M${x + 42 * k} ${y - (56 + neck) * k}L${x + 66 * k} ${y - (50 + neck) * k}L${x + 42 * k} ${y - (46 + neck) * k}Z`));
  if (eyeOpen) s.cut.push(circ(x + 36 * k, y - (56 + neck) * k, 3.2 * k)); else s.cut.push(closedEye(x + 34 * k, y - (55 + neck) * k));
  if (wingCut) s.cut.push(path(`M${x - 24 * k} ${y - 14 * k}Q${x} ${y - 24 * k} ${x + 18 * k} ${y - 10 * k}Q${x} ${y - 16 * k} ${x - 24 * k} ${y - 14 * k}Z`));
}
export function duck(kind = 'mom') {
  const s = sheet();
  if (kind === 'mom') duckShape(s, 92, 176, 1.25);
  else if (kind === 'gray') duckShape(s, 96, 180, .95, { neck: 6 });
  else if (kind === 'young') duckShape(s, 96, 176, 1.15, { neck: 14 });
  return s;
}
export function ducklings() { // 노란 아기 오리 넷 (넓은 인형 400×200)
  const s = sheet();
  for (let i = 0; i < 4; i++) duckShape(s, 60 + i * 92, 186, .62 - i * .02);
  return s;
}
export function ducksGroup() { // 놀리는 오리 셋 (400×200)
  const s = sheet();
  for (let i = 0; i < 3; i++) duckShape(s, 80 + i * 120, 186, .95);
  return s;
}
export function swan(flip = false) {
  const s = sheet();
  s.add.push(path('M30 168Q20 130 52 136Q90 112 140 140Q166 156 150 176Q100 196 30 168Z'));
  s.add.push(path('M132 146Q118 110 136 84Q156 56 142 40L150 36Q170 58 146 88Q132 112 146 144Z'), circ(146, 38, 12), poly([[154, 34], [180, 42], [154, 46]]));
  s.cut.push(circ(148, 34, 3), path('M58 150Q96 126 128 148Q96 138 58 150Z'), path('M66 162Q98 146 124 160Q98 154 66 162Z'));
  return s;
}
export function swansGroup() { // 백조 셋 (400×200)
  const s = sheet();
  const one = (dx, k) => {
    const T = (x, y) => [dx + x * k, 200 - (200 - y) * k];
    const P = (d) => d.replace(/(-?\d+\.?\d*) (-?\d+\.?\d*)/g, (m, a, b) => T(+a, +b).map(v => v.toFixed(1)).join(' '));
    s.add.push(path(P('M30 168Q20 130 52 136Q90 112 140 140Q166 156 150 176Q100 196 30 168Z')), path(P('M132 146Q118 110 136 84Q156 56 142 40L150 36Q170 58 146 88Q132 112 146 144Z')));
    const [hx, hy] = T(146, 38); s.add.push(circ(hx, hy, 12 * k));
    const [cx, cy] = T(92, 142); s.cut.push(ell(cx, cy, 36 * k, 5 * k, -6));
  };
  one(10, .9); one(140, .8); one(260, .9);
  return s;
}
export function rooster() {
  const s = sheet();
  s.add.push(ell(96, 130, 36, 30), circ(124, 82, 18), bar(112, 104, 120, 90, 18), poly([[138, 80], [156, 86], [138, 92]]));
  s.add.push(path('M110 64Q114 50 120 60Q124 46 130 60Q136 50 138 66Z'), path('M124 98Q128 112 118 110Z'));
  for (let i = 0; i < 4; i++) s.add.push(path(`M70 122Q${30 - i * 6} ${96 - i * 18} ${44 + i * 4} ${60 - i * 6}Q${44 + i * 10} ${100 - i * 12} 76 ${118 - i * 2}Z`));
  s.add.push(bar(90, 156, 86, 194, 7), bar(106, 156, 110, 194, 7));
  s.cut.push(eye(128, 78, 3.4), path('M76 130Q96 116 118 128Q96 124 76 130Z'));
  return s;
}
export function hen() {
  const s = sheet();
  s.add.push(ell(96, 156, 44, 32), circ(132, 116, 18), bar(120, 140, 128, 124, 18), poly([[146, 114], [160, 120], [146, 124]]), path('M122 100Q128 90 134 100Q140 92 142 104Z'), path('M54 148Q40 116 60 124Q58 132 66 140Z'));
  s.cut.push(eye(136, 112, 3.4), path('M70 156Q96 140 120 154Q96 150 70 156Z'));
  return s;
}
export function geese() { // 날아가는 기러기 셋 (400×200)
  const s = sheet();
  const g = (x, y, k) => {
    s.add.push(ell(x, y, 34 * k, 10 * k), bar(x + 28 * k, y - 2 * k, x + 54 * k, y - 8 * k, 7 * k), circ(x + 56 * k, y - 9 * k, 7 * k));
    s.add.push(path(`M${x - 10 * k} ${y - 4 * k}Q${x - 4 * k} ${y - 44 * k} ${x + 22 * k} ${y - 60 * k}Q${x + 14 * k} ${y - 30 * k} ${x + 12 * k} ${y - 4 * k}Z`));
    s.add.push(poly([[x - 34 * k, y], [x - 52 * k, y - 8 * k], [x - 50 * k, y + 6 * k]]));
  };
  g(80, 150, 1); g(210, 110, .9); g(320, 160, .95);
  return s;
}
export function nest() { // 둥지와 알 (소품, 400×200)
  const s = sheet();
  s.add.push(path('M60 150Q200 120 340 150Q330 196 200 198Q70 196 60 150Z'));
  for (let i = 0; i < 6; i++) s.cut.push(path(`M${80 + i * 44} ${166 + (i % 2) * 10}Q${100 + i * 44} ${158 + (i % 2) * 10} ${120 + i * 44} ${168 + (i % 2) * 10}Q${100 + i * 44} ${164 + (i % 2) * 10} ${80 + i * 44} ${166 + (i % 2) * 10}Z`));
  for (const [x, r] of [[130, 22], [170, 24], [230, 23], [270, 34]]) s.add.push(ell(x, 148 - r * .6, r * .8, r));
  return s;
}
export function stove() { // 난로 (소품)
  const s = sheet();
  s.add.push(rect(40, 70, 120, 120, 10), rect(30, 60, 140, 16, 6), rect(84, 0, 32, 64), rect(46, 186, 16, 12), rect(138, 186, 16, 12));
  s.cut.push(path('M66 120Q100 100 134 120L134 168L66 168Z'));
  s.back.push(path('M78 168Q84 140 94 150Q98 124 108 146Q116 132 122 168Z'));
  return s;
}
export function carrotFlag() { return sheet(); }
/* 결승선 구경꾼들(near 층에 쓰는 무리 실루엣) — lib 좌표(1600×1200) */
export function crowd(y0) {
  const s = sheet();
  const heads = [
    [140, 'duck'], [300, 'cow'], [470, 'pig'], [1130, 'dog'], [1300, 'sheep'], [1460, 'duck'],
  ];
  s.add.push(path(`M-20 ${y0 + 60}Q400 ${y0 + 20} 800 ${y0 + 70}Q1200 ${y0 + 20} 1620 ${y0 + 60}L1620 1210L-20 1210Z`));
  for (const [x, k] of heads) {
    const y = y0 + 10;
    if (k === 'duck') { s.add.push(circ(x, y, 46), poly([[x + 40, y - 6], [x + 84, y + 4], [x + 40, y + 16]])); s.cut.push(circ(x + 14, y - 14, 7)); }
    if (k === 'cow') { s.add.push(ell(x, y, 58, 50), ell(x - 62, y - 30, 26, 12, -20), ell(x + 62, y - 30, 26, 12, 20), poly([[x - 30, y - 44], [x - 44, y - 84], [x - 14, y - 50]]), poly([[x + 30, y - 44], [x + 44, y - 84], [x + 14, y - 50]])); s.cut.push(circ(x - 20, y - 10, 7), circ(x + 20, y - 10, 7), ell(x, y + 26, 22, 10)); }
    if (k === 'pig') { s.add.push(circ(x, y, 52), poly([[x - 42, y - 30], [x - 30, y - 74], [x - 10, y - 46]]), poly([[x + 42, y - 30], [x + 30, y - 74], [x + 10, y - 46]])); s.cut.push(circ(x - 20, y - 12, 7), circ(x + 20, y - 12, 7), ell(x, y + 18, 18, 12)); s.back.push(circ(x - 6, y + 18, 4), circ(x + 6, y + 18, 4)); }
    if (k === 'dog') { s.add.push(circ(x, y, 48), ell(x - 44, y + 4, 16, 34, 15), ell(x + 44, y + 4, 16, 34, -15)); s.cut.push(circ(x - 16, y - 10, 7), circ(x + 16, y - 10, 7), ell(x, y + 18, 9, 6)); }
    if (k === 'sheep') { s.add.push(scallopCircle(x, y, 56, 12, .14)); s.cut.push(ell(x, y + 8, 26, 32)); s.back.push(ell(x, y + 8, 18, 26)); s.cut.push(circ(x - 8, y, 4), circ(x + 8, y, 4)); }
  }
  return s;
}
export { merge };
