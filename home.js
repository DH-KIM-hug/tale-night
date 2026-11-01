/* 쿨쿨 그림자극장 — 홈 (PLAN §4 S0·S1) */
(async function () {
  const $ = id => document.getElementById(id);
  const cat = await fetch('content/catalog.json').then(r => r.json());
  const tales = cat.tales;
  const T = Object.fromEntries(tales.map(t => [t.id, t]));
  let S = Settings.get();

  /* ---------- 스플래시: 극장 커튼 뒤에서 빛이 켜진다(세션마다 한 번) ---------- */
  let seen = false; try { seen = sessionStorage.getItem('kulkul.splash'); sessionStorage.setItem('kulkul.splash', 1); } catch (e) { /* 무시 */ }
  if (!seen) {
    const sp = $('splash'); sp.hidden = false;
    const lb = new Lightbox($('splashStage'), { stage: { boxes: { app: { layers: { far: 'art/app/stage_far.webp', mid: 'art/app/stage_mid.webp', near: 'art/app/stage_near.webp', frame: 'art/app/curtain_frame.webp' }, glowAt: [50, 22] } }, dolls: {} } });
    lb.root.style.setProperty('--room-dim', .05);
    await lb.apply({ box: 'app', light: 'night_forest', power: 1, fx: 'fireflies', dolls: {} }, {}, { instant: true });
    const done = () => { sp.classList.add('out'); setTimeout(() => { sp.hidden = true; lb.destroy(); }, 900); };
    setTimeout(() => { lb.setLit(true, 1800); sp.classList.add('lit'); }, 350);
    const t = setTimeout(done, 3400);
    sp.onclick = () => { clearTimeout(t); done(); };
  }

  /* ---------- 보호자 설정: 달 1초 꾹 ---------- */
  Settings.holdButton($('moon'), 1000, () => Settings.openSheet(s => { S = s; drawCount(); }));

  /* ---------- 자동으로 읽어 줘요: 아무 이야기나 이어 듣기 ---------- */
  function drawCount() {
    $('count').innerHTML = '듣고 끄기 ' + [1, 2, 3, 5].map(n => `<button class="pill" data-n="${n}" aria-pressed="${S.count === n}">${n}편</button>`).join('');
    $('count').querySelectorAll('button').forEach(b => b.onclick = () => { S = Settings.set({ count: +b.dataset.n }); drawCount(); });
  }
  drawCount();
  $('random').onclick = () => {
    // 같은 회차 중복 없음, 최근 들은 편은 뒤로(BEDTIME_PLAN §5-1)
    const recent = Settings.read('kulkul.recent', []);
    const shuffle = a => a.map(v => [Math.random(), v]).sort((x, y) => x[0] - y[0]).map(x => x[1]);
    const fresh = shuffle(tales.filter(t => !recent.includes(t.id)).map(t => t.id));
    const old = recent.filter(id => T[id]).reverse();
    const pick = [...fresh, ...old].slice(0, Math.min(S.count, tales.length));
    location.href = `player.html?mode=auto&ids=${pick.join(',')}`;
  };

  /* ---------- 함께 읽어요: 이어 읽기 ---------- */
  const last = Settings.read('kulkul.together', null);
  if (last && T[last.id]) {
    $('resume').innerHTML = `<button class="pill primary" id="resumeBtn">이어 읽기: ${T[last.id].title}${last.scene ? ` · ${last.scene + 1}장면부터` : ''}</button>`;
    $('resumeBtn').onclick = () => { location.href = `player.html?mode=together&id=${last.id}&scene=${last.scene || 0}`; };
  } else $('resume').innerHTML = `<span class="muted" style="font-size:13px">아래에서 이야기를 골라 「함께 읽어요」를 눌러요.</span>`;

  /* ---------- 오늘 밤 이야기: 꺼진 빛 상자 타일 ---------- */
  const boxes = {};
  for (const t of tales) {
    const b = document.createElement('button'); b.className = 'tile'; b.setAttribute('aria-label', t.title);
    b.innerHTML = `<div class="tstage"></div><b>${t.title}</b><span>${t.line}</span><i>약 ${t.readMin}분 · ${t.scenes}장면</i>`;
    $('tiles').appendChild(b);
    Story.load(t.id).then(async story => {
      const lb = new Lightbox(b.querySelector('.tstage'), { static: true, stage: story.stage });
      lb.root.style.setProperty('--room-dim', .12);
      const show = Math.min(1, story.sceneStart.length - 1); // 첫 장면보다 인물이 나와 있는 장면
      const st = story.steps.filter(s => s.sceneIdx === show).at(-1).state;
      await lb.apply(st, {}, { instant: true });
      boxes[t.id] = { lb, story, st };
      // 손가락이 지나가면 그 타일만 희미하게 불이 들어온다
      b.addEventListener('pointerenter', () => lb.setLit(true, 900));
      b.addEventListener('pointerleave', () => lb.setLit(false, 900));
      b.addEventListener('focus', () => lb.setLit(true, 900)); b.addEventListener('blur', () => lb.setLit(false, 900));
    });
    b.onclick = () => openPick(t.id);
  }

  let pickLb = null;
  async function openPick(id) {
    const t = T[id]; $('pickTitle').textContent = t.title; $('pickLine').textContent = `${t.line} 약 ${t.readMin}분.`;
    $('pick').classList.add('open');
    const box = boxes[id];
    if (pickLb) pickLb.destroy();
    $('pickStage').replaceChildren();
    if (box) {
      pickLb = new Lightbox($('pickStage'), { static: true, stage: box.story.stage });
      pickLb.root.style.setProperty('--room-dim', .08);
      await pickLb.apply(box.st, {}, { instant: true });
      setTimeout(() => pickLb && pickLb.setLit(true, 1400), 60);
    }
    $('pickAuto').onclick = () => { location.href = `player.html?mode=auto&ids=${id}`; };
    $('pickTogether').onclick = () => { location.href = `player.html?mode=together&id=${id}`; };
  }
  const closePick = () => { $('pick').classList.remove('open'); if (pickLb) { pickLb.destroy(); pickLb = null; } };
  $('pickClose').onclick = closePick;
  $('pick').addEventListener('click', e => { if (e.target === $('pick')) closePick(); });
})();
