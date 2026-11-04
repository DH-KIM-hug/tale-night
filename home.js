/* 쿨쿨 그림자극장 — 홈 (PLAN §4 S0·S1, docs/DESIGN_PLAN.md §4)
   큰 창문에 고른 이야기 하나. 작은 창문을 톡 하면 큰 창문의 이야기가 바뀌고, 단추 하나로 바로 시작한다. */
(async function () {
  const $ = id => document.getElementById(id);
  const cat = await fetch('content/catalog.json').then(r => r.json());
  const tales = cat.tales;
  const T = Object.fromEntries(tales.map(t => [t.id, t]));
  let S = Settings.get();

  /* 동화마다 표지 빛 색. 책등처럼 색으로 기억하게 한다(DESIGN_PLAN §3). 그림은 그대로, 빛만 앱이 입힌다 */
  const COVER_LIGHT = { rabbit: 'dream', three_pigs: 'hearth', sun_wind: 'dusk', ugly_duckling: 'sea', turnip: 'dawn' };

  /* ---------- 스플래시(세션마다 한 번) ---------- */
  let seen = false; try { seen = sessionStorage.getItem('kulkul.splash'); sessionStorage.setItem('kulkul.splash', 1); } catch (e) { /* 무시 */ }
  if (!seen) {
    const sp = $('splash'); sp.hidden = false;
    const done = () => { sp.classList.add('out'); setTimeout(() => { sp.hidden = true; }, 900); };
    const t = setTimeout(done, 1400);
    sp.onclick = () => { clearTimeout(t); done(); };
  }

  /* ---------- 보호자 설정: 달 1초 꾹 ---------- */
  const paintRandom = () => { $('random').textContent = `아무 이야기나 · ${S.count}편`; };
  paintRandom();
  Settings.holdButton($('moon'), 1000, () => Settings.openSheet(s => { S = s; paintRandom(); }));

  /* ---------- 작은 창문 ---------- */
  const tiles = {};
  for (const t of tales) {
    const b = document.createElement('button'); b.className = 'tile';
    b.innerHTML = `<div class="win"></div><b>${t.title}</b>`;
    b.disabled = true; // 그림을 확인한 뒤 연다
    $('tiles').appendChild(b);
    tiles[t.id] = b;
    b.onclick = () => select(t.id);
  }

  /* 그 이야기의 첫 상자 그림이 실제로 있는지 본다. 없으면 빈 창문으로 둔다 */
  const hasArt = story => new Promise(res => {
    const first = story.steps[0] && story.stage.boxes[story.steps[0].state.box];
    const src = first && Object.values(first.layers || {})[0];
    if (!src) return res(false);
    const im = new Image(); im.onload = () => res(true); im.onerror = () => res(false); im.src = src;
  });

  /* 창문 안에 빛 상자를 하나 세운다. 인물이 잘리지 않게 인물 쪽으로 밀어 둔다 */
  async function mount(win, { story, st }, dim) {
    const crop = document.createElement('div'); crop.className = 'crop';
    const stage = document.createElement('div'); crop.appendChild(stage);
    win.appendChild(crop);
    const lb = new Lightbox(stage, { static: true, stage: story.stage });
    lb.root.style.setProperty('--room-dim', dim);
    const vis = Object.values(st.dolls || {}).filter(d => d.vis !== false);
    const cx = vis.length ? vis.reduce((a, d) => a + d.x, 0) / vis.length / 100 : .5;
    lb.root.style.setProperty('--fx', Math.max(0, Math.min(1, .5 + (cx - .5) * 1.6)));
    await lb.apply(st, {}, { instant: true });
    lb.setLit(true, 0);
    return { crop, lb };
  }

  const loaded = {};
  await Promise.all(tales.map(async t => {
    const story = await Story.load(t.id);
    const art = await hasArt(story);
    if (!art) { tiles[t.id].setAttribute('aria-label', `${t.title} (그림 준비 중)`); return; } // 닫힌 창문만 둔다. 같은 말을 칸마다 되풀이하지 않는다
    const show = Math.min(1, story.sceneStart.length - 1); // 첫 장면보다 인물이 나와 있는 장면
    const st = { ...story.steps.filter(s => s.sceneIdx === show).at(-1).state, light: COVER_LIGHT[t.id] || 'dusk', power: 1 };
    loaded[t.id] = { story, st };
    tiles[t.id].disabled = false;
    await mount(tiles[t.id].querySelector('.win'), loaded[t.id], .1);
  }));
  const ready = tales.filter(t => loaded[t.id]);

  /* ---------- 큰 창문: 고른 이야기 ---------- */
  let cur = null, token = 0, heroNow = null;
  async function select(id) {
    if (cur === id) return;
    cur = id;
    const t = T[id], my = ++token;
    for (const [k, b] of Object.entries(tiles)) b.setAttribute('aria-current', k === id);
    tiles[id].scrollIntoView({ behavior: 'smooth', inline: 'nearest', block: 'nearest' });
    $('heroTitle').textContent = t.title;
    $('heroLine').textContent = t.line;
    const last = Settings.read('kulkul.together', null);
    const at = last && last.id === id && last.scene ? last.scene : 0;
    $('heroMeta').textContent = at ? `약 ${t.readMin}분 · ${at + 1}장면까지 읽었어요` : `약 ${t.readMin}분`;
    $('heroFresh').hidden = !at;
    $('goTogetherLabel').textContent = at ? '이어 읽어요' : '함께 읽어요';
    const read = scene => { location.href = `player.html?mode=together&id=${id}${scene ? `&scene=${scene}` : ''}`; };
    $('goAuto').onclick = () => { location.href = `player.html?mode=auto&ids=${id}`; };
    $('goTogether').onclick = () => read(at);
    $('heroFresh').onclick = () => read(0);
    const next = await mount($('heroWin'), loaded[id], .04);
    if (my !== token) { next.lb.destroy(); next.crop.remove(); return; }
    const P = LIGHT_PRESETS[loaded[id].st.light];
    $('heroWin').style.setProperty('--spill', P ? P.c2 : '#f2b366');
    void next.crop.offsetWidth; next.crop.classList.add('in');
    const old = heroNow; heroNow = next;
    if (old) setTimeout(() => { old.lb.destroy(); old.crop.remove(); }, 750);
  }

  /* 처음 고르는 이야기: 읽던 편 → 아니면 최근에 안 들은 편 중 날짜로 하나 */
  const last = Settings.read('kulkul.together', null);
  const recent = Settings.read('kulkul.recent', []);
  const fresh = ready.filter(t => recent[0] !== t.id);
  const day = Math.floor(Date.now() / 864e5);
  const first = last && loaded[last.id] ? last.id : (fresh.length ? fresh[day % fresh.length] : ready[0] || {}).id;
  if (first) select(first);

  /* ---------- 아무 이야기나 이어 듣기(편 수는 보호자 설정). 그림 있는 편만 ---------- */
  $('random').onclick = () => {
    const shuffle = a => a.map(v => [Math.random(), v]).sort((x, y) => x[0] - y[0]).map(x => x[1]);
    const rec = Settings.read('kulkul.recent', []);
    const pool = ready.map(t => t.id);
    const pick = [...shuffle(pool.filter(id => !rec.includes(id))), ...rec.filter(id => pool.includes(id)).reverse()].slice(0, Math.min(S.count, pool.length));
    if (pick.length) location.href = `player.html?mode=auto&ids=${pick.join(',')}`;
  };
})();
