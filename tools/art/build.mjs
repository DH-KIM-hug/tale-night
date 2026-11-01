#!/usr/bin/env node
/* 빛 상자 그림 만들기: node tools/art/build.mjs
   → art/<동화>/<상자>_<층>.svg (1600×1200), art/dolls/<인형>.svg (200×200, 무리는 400×200), art/app/*.svg
   모두 흰 종이 모양(알파)만 있다. 색·빛·종이결은 앱이 입힌다. */
import fs from 'node:fs';
import path from 'node:path';
import * as L from './lib.mjs';
import * as D from './dolls.mjs';

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..', '..');
const { W, H, merge, sheet, rect, circ, ell, path: P, poly } = L;
const out = (rel, sh, w, h) => { const f = path.join(ROOT, 'art', rel); fs.mkdirSync(path.dirname(f), { recursive: true }); fs.writeFileSync(f, L.svg(sh, w, h)); };
const ground = (y) => ({ add: [rect(-20, y, W + 40, H - y + 20)], cut: [], back: [] });

const BOX = {
  rabbit: {
    village: {
      far: merge(L.mountains(1, 700, [[240, 330], [640, 260], [1060, 360], [1460, 300]]), L.clouds(2, [[420, 230, 1], [1240, 180, .8]])),
      mid: merge(L.ridge(820, 50, 3, 3), L.mushroomHouse(360, 830, 1.15, 4), L.mushroomHouse(640, 800, .8, 5), L.mushroomHouse(1230, 820, 1, 6), L.roundTree(960, 800, 330, 7)),
      near: merge(L.grass(1010, 8, { tall: 60 }), L.bush(120, 960, .9, 9), L.bush(1500, 950, 1, 10), L.flower(330, 960, 1), L.flower(1300, 970, .8), L.flower(1380, 950, 1.1)),
      frame: L.tunnelFrame(11),
    },
    hill: {
      far: L.mountains(12, 620, [[300, 260], [800, 330], [1300, 280]]),
      mid: (() => { const s = merge(L.ridge(760, 120, 2, 13), L.pine(1340, 700, 260), L.pine(1440, 730, 200), L.pine(200, 760, 220)); s.cut.push(P('M-40 1000Q500 960 760 820Q980 700 1640 690L1640 720Q1000 740 790 860Q520 1010 -40 1060Z')); return s; })(),
      near: merge(L.grass(1060, 14, { tall: 50 }), L.reeds(-20, 300, 1100, 300, 15, 9), L.reeds(1340, 1620, 1100, 280, 16, 9)),
      frame: L.branchFrame(17),
    },
    shade: {
      far: merge(L.ridge(700, 60, 3, 18), L.clouds(19, [[300, 260, .9], [1300, 220, 1.1]])),
      mid: merge(L.ridge(880, 30, 2, 20), L.roundTree(1060, 900, 720, 21, 14)),
      near: merge(L.grass(1030, 22, { tall: 70 }), L.flower(240, 980, 1), L.flower(520, 1000, .8), L.bush(1500, 990, .8, 23)),
      frame: L.leafFrame(24),
    },
    finish: {
      far: L.mountains(25, 640, [[200, 300], [620, 250], [1000, 340], [1420, 280]]),
      mid: merge(L.ridge(800, 30, 2, 26), L.flags(420, 1180, 420, 70, 9), L.roundTree(150, 800, 300, 27), L.pine(1480, 800, 280)),
      near: D.crowd(950),
      frame: L.tunnelFrame(28),
    },
  },
  sun_wind: {
    sky: {
      far: L.clouds(30, [[250, 300, 1.2], [760, 220, .9], [1300, 280, 1.3], [520, 560, .7], [1120, 620, .8]]),
      mid: merge(L.clouds(31, [[200, 900, 2.2], [760, 960, 2.6], [1400, 900, 2.3]]), ground(960)),
      near: merge(L.clouds(32, [[80, 1100, 2], [700, 1150, 1.8], [1500, 1100, 2.1]]), ground(1100)),
      frame: L.cloudFrame(33),
    },
    field: {
      far: merge(L.mountains(34, 640, [[260, 230], [780, 290], [1340, 250]]), L.clouds(35, [[1100, 200, .9]])),
      mid: (() => { const s = merge(L.ridge(800, 60, 2, 36), L.roundTree(1300, 790, 420, 37), L.fence(140, 520, 820, 90)); s.cut.push(P('M560 1220Q620 1000 760 900Q880 820 1100 790L1130 800Q920 850 820 920Q700 1020 660 1220Z')); return s; })(),
      near: merge(L.grass(1060, 38, { tall: 90, step: 22 }), L.flower(200, 1000, 1), L.flower(1420, 1010, 1)),
      frame: L.branchFrame(39),
    },
  },
  turnip: {
    garden: {
      far: merge(L.ridge(640, 70, 3, 40), L.house(1260, 640, 160, 110, { windows: 1, chimney: false })),
      mid: (() => { const s = merge(L.ridge(830, 24, 2, 41), L.house(250, 830, 330, 230, { windows: 2 }), L.fence(600, 1500, 840, 110)); return s; })(),
      near: (() => { const s = merge(L.grass(1060, 42, { tall: 40 })); for (let i = 0; i < 5; i++) s.add.push(L.ell(160 + i * 320, 1060, 150, 40)); for (let i = 0; i < 5; i++) s.cut.push(P(`M${60 + i * 320} 1060Q${160 + i * 320} 1040 ${260 + i * 320} 1060Q${160 + i * 320} 1050 ${60 + i * 320} 1060Z`)); return s; })(),
      frame: L.leafFrame(43),
    },
    kitchen: {
      far: (() => { const s = sheet(); s.add.push(rect(-20, -20, W + 40, H + 40)); s.cut.push(P('M1080 260L1380 260L1380 560L1080 560Z')); s.back.push(rect(1222, 260, 16, 300), rect(1080, 402, 300, 16)); for (let i = 0; i < 6; i++) s.cut.push(rect(150 + i * 70, 300, 40, 40, 20)); return s; })(),
      mid: (() => { const s = merge(D.stove ? { add: [], cut: [], back: [] } : sheet()); s.add.push(rect(420, 760, 760, 34, 8), rect(460, 790, 30, 240), rect(1110, 790, 30, 240), rect(-20, 1010, W + 40, 210)); s.add.push(rect(80, 560, 260, 460, 12), rect(140, 120, 60, 450)); s.cut.push(P('M120 760Q210 690 300 760L300 940L120 940Z')); s.back.push(P('M150 940Q160 860 190 880Q200 820 220 870Q240 840 260 940Z')); for (let i = 0; i < 3; i++) s.add.push(L.ell(560 + i * 230, 740, 70, 22)); return s; })(),
      near: (() => { const s = sheet(); s.add.push(rect(-20, 1090, W + 40, 130)); for (let x = 0; x < W; x += 200) s.cut.push(rect(x + 20, 1110, 160, 8, 4)); s.add.push(rect(260, 900, 26, 200), rect(400, 900, 26, 200), rect(240, 880, 210, 30, 8), rect(1180, 900, 26, 200), rect(1320, 900, 26, 200), rect(1160, 880, 210, 30, 8)); return s; })(),
      frame: L.beamFrame(),
    },
  },
  ugly_duckling: {
    farm: {
      far: merge(L.ridge(640, 80, 3, 50), L.house(1300, 650, 220, 150, { windows: 1 }), L.pine(1500, 650, 170)),
      mid: merge(L.ridge(780, 26, 2, 51), L.fence(80, 700, 790, 100), L.willow(1380, 800, 520, 52)),
      near: merge(L.water(960, 53, { ripples: 9 }), L.reeds(-20, 260, 1010, 300, 54, 8), L.reeds(1360, 1620, 1010, 300, 55, 8)),
      frame: L.tunnelFrame(56),
    },
    swamp: {
      far: merge(L.ridge(620, 50, 3, 57), L.clouds(58, [[400, 260, .8], [1200, 300, 1]])),
      mid: merge(L.water(840, 59, { ripples: 6 }), L.bareTree(320, 860, 560, 60), L.bareTree(1260, 860, 480, 61)),
      near: merge(L.reeds(-20, 1620, 1100, 360, 62, 30), ground(1100)),
      frame: L.reedFrame(63),
    },
    lake: {
      far: L.mountains(64, 620, [[260, 280], [760, 220], [1240, 320]]),
      mid: merge(L.ridge(760, 30, 2, 65), L.willow(240, 790, 560, 66), L.water(830, 67, { ripples: 8, left: 420 })),
      near: merge(L.reeds(-20, 220, 1090, 260, 68, 7), L.grass(1090, 69, { tall: 40 }), (() => { const s = sheet(); for (const [x, r] of [[1320, 70], [1450, 54], [1560, 80]]) s.add.push(L.ell(x, 1090, r, r * .6)); return s; })()),
      frame: L.branchFrame(70),
    },
    cabin: {
      far: (() => { const s = sheet(); s.add.push(rect(-20, -20, W + 40, H + 40)); s.cut.push(P('M200 240L520 240L520 560L200 560Z')); s.back.push(rect(352, 240, 16, 320), rect(200, 392, 320, 16)); for (let i = 0; i < 5; i++) s.cut.push(rect(820 + i * 110, 300, 60, 18, 9)); return s; })(),
      mid: (() => { const s = sheet(); s.add.push(rect(-20, 1000, W + 40, 220), rect(1080, 520, 300, 500, 14), rect(1060, 500, 340, 40, 10), rect(1190, 0, 80, 520)); s.cut.push(P('M1120 760Q1230 680 1340 760L1340 960L1120 960Z')); s.back.push(P('M1150 960Q1162 880 1196 900Q1210 830 1232 890Q1256 850 1290 960Z')); s.add.push(P('M420 1000L460 700Q520 640 600 700L640 1000L610 1000L590 760Q530 720 480 760L450 1000Z'), P('M360 1010Q530 1060 720 1010L720 1030Q530 1080 360 1030Z')); return s; })(),
      near: (() => { const s = sheet(); s.add.push(rect(-20, 1090, W + 40, 130)); s.add.push(L.ell(800, 1110, 380, 50)); s.cut.push(L.ell(800, 1110, 300, 30)); s.back.push(L.ell(800, 1110, 220, 18)); return s; })(),
      frame: L.beamFrame(),
    },
  },
};

const DOLLS = {
  rabbit_stand: [D.rabbit('stand')], rabbit_run: [D.rabbit('run')], rabbit_sleep: [D.rabbit('sleep')],
  turtle_walk: [D.turtle('walk')], turtle_stand: [D.turtle('stand')], owl: [D.owl()],
  sun_smile: [D.sun('smile')], sun_wide: [D.sun('wide')], wind_blow: [D.wind('blow')], wind_calm: [D.wind('calm')],
  traveler_coat: [D.traveler('coat')], traveler_fan: [D.traveler('fan')], traveler_carry: [D.traveler('carry')],
  grandpa_stand: [D.grandpa('stand')], grandpa_pull: [D.grandpa('pull')], grandma: [D.grandma()], girl: [D.girl()],
  dog: [D.dog()], cat_sit: [D.cat('sit')], cat_pull: [D.cat('pull')], mouse: [D.mouse()],
  turnip_sprout: [D.turnip('sprout')], turnip_big: [D.turnip('big')], pot: [D.pot()],
  duck_mom: [D.duck('mom')], duck_gray: [D.duck('gray')], duck_young: [D.duck('young')], swan: [D.swan()],
  rooster: [D.rooster()], hen: [D.hen()], farmer: [D.farmer()],
  ducklings: [D.ducklings(), 400, 200], ducks: [D.ducksGroup(), 400, 200], geese: [D.geese(), 400, 200], swans: [D.swansGroup(), 400, 200], nest: [D.nest(), 400, 200],
};

let n = 0;
for (const [tale, boxes] of Object.entries(BOX)) for (const [box, layers] of Object.entries(boxes)) for (const [layer, sh] of Object.entries(layers)) { out(`${tale}/${box}_${layer}.svg`, sh); n++; }
for (const [name, [sh, w = 200, h = 200]] of Object.entries(DOLLS)) { out(`dolls/${name}.svg`, sh, w, h); n++; }
/* 앱 그림: 스플래시·홈 머리 상자(극장 커튼 + 달밤 언덕) */
out('app/curtain_frame.svg', L.curtainFrame(80));
out('app/stage_far.svg', merge(L.mountains(81, 700, [[300, 300], [800, 240], [1300, 320]]), L.clouds(82, [[500, 260, .8], [1150, 210, .7]])));
out('app/stage_mid.svg', merge(L.ridge(860, 50, 3, 83), L.house(1150, 860, 200, 140, { windows: 1 }), L.roundTree(420, 870, 380, 84), L.pine(1380, 870, 240)));
out('app/stage_near.svg', merge(L.grass(1070, 85, { tall: 60 }), L.bush(200, 1020, .8, 86), L.bush(1420, 1020, .9, 87)));
n += 4;
console.log(`그림 ${n}장 → art/`);
