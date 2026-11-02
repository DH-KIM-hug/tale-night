/* 쿨쿨 그림자극장 — 대본 + 무대 → 줄마다 무대 상태 (docs/STAGE_FORMAT.md)
   steps[i] = { scene, line, sceneIdx, lineIdx, text, clips, dur, roles, state, hints, card }
   state 는 그 줄을 읽기 직전(자동) / 그 줄로 넘어온 순간(함께 읽기)의 무대. 앞 줄로 돌아가면 그 줄의 state 를 그대로 그린다. */
(function () {
  const BASE = (document.currentScript && document.currentScript.src.replace(/engine\/story\.js.*$/, '')) || './';
  const clone = o => JSON.parse(JSON.stringify(o));
  const parsePlace = v => {
    if (typeof v === 'object') return { vis: true, ...v };
    const [pose, at] = v.split('@'); const [x, y] = at.split(',').map(Number);
    return { pose, x, y, vis: true };
  };

  function verb(st, hints, cmd, warn) {
    const p = cmd.split(':');
    if (p[0] === 'light') { st.light = p[1]; if (p[2]) st.power = +p[2]; return; }
    if (p[0] === 'power') { st.power = +p[1]; return; }
    if (p[0] === 'fx') { st.fx = p[1]; return; }
    const [name, act, a, b] = p;
    const d = st.dolls[name] || (st.dolls[name] = { pose: null, x: 50, y: 10, vis: false });
    const xy = s => s.split(',').map(Number);
    switch (act) {
      case 'in': { d.vis = true; if (b) { const [x, y] = xy(b); d.x = x; d.y = y; } (hints[name] = hints[name] || {}).from = a || 'left'; break; }
      case 'out': d.vis = false; (hints[name] = hints[name] || {}).to = a || 'right'; break;
      case 'walk': { const [x, y] = xy(a); d.x = x; d.y = y; d.vis = true; (hints[name] = hints[name] || {}).walk = b ? +b : 6; break; }
      case 'at': { const [x, y] = xy(a); d.x = x; d.y = y; d.vis = true; break; }
      case 'pose': d.pose = a; d.vis = true; break;
      case 'face': d.flip = a === 'left'; break;
      case 'lantern': d.lantern = a === 'on'; break;
      case 'spot': d.spot = a; break; // 새 무대: 같은 자세의 다른 자리(상자의 'walk@ahead')
      case 'show': d.vis = true; break;
      case 'hide': d.vis = false; break;
      default: warn(`모르는 동사: ${cmd}`);
    }
  }

  async function load(id) {
    const [script, stage] = await Promise.all([
      fetch(`${BASE}content/${id}/script.json`).then(r => r.json()),
      fetch(`${BASE}content/${id}/stage.json`).then(r => r.json()),
    ]);
    const warn = m => console.warn(`[${id}] ${m}`);
    const steps = [], sceneStart = []; let st = null;
    script.scenes.forEach((sc, si) => {
      const S = stage.scenes[sc.key];
      if (!S) { warn(`stage 에 장면 없음: ${sc.key}`); return; }
      st = {
        box: S.box, light: S.light || 'night_forest', power: S.power != null ? S.power : 1, fx: S.fx || stage.boxes[S.box].fx || 'fireflies',
        dolls: {},
      };
      for (const [name, v] of Object.entries(S.place || {})) st.dolls[name] = parsePlace(v);
      sceneStart[si] = clone(st);
      let lastLook = null;
      sc.lines.forEach((l, li) => {
        const hints = {};
        for (const c of (S.cues || []).filter(c => c.line === li)) {
          if (c.match && !l.text.startsWith(c.match)) warn(`${sc.key} 줄 ${li} 가 "${c.match}…" 이 아님: "${l.text}"`);
          c.do.forEach(cmd => verb(st, hints, cmd, warn));
        }
        const look = JSON.stringify(Object.entries(st.dolls).map(([n, d]) => [n, d.vis !== false && d.pose, !!d.flip, d.spot])); // 인물이 달라 보이는 줄에서 대사 묶음을 나눈다
        const beat = li === 0 || look !== lastLook; lastLook = look;
        steps.push({ beat, scene: sc.key, sceneIdx: si, lineIdx: li, card: li === 0 ? sc.card : null, text: l.text, clips: l.clips, dur: l.dur, roles: l.roles, segRoles: l.segRoles || [], state: clone(st), hints });
      });
    });
    return { id, title: script.title, script, stage, steps, sceneStart, scenes: script.scenes };
  }
  /* 장면 처음 상태(앞 장면에서 넘어올 때 쓰는 hints 없는 그림) */
  window.Story = { load };
})();
