/* 쿨쿨 그림자극장 — 빛 상자 플레이어 (PLAN §3·§4 S2·S3·S4)
   player.html?mode=auto&ids=rabbit,turnip   자동 읽어 주기 (여러 편이면 이어 듣기, BEDTIME_PLAN (나) 방식: 한 페이지에서 끝까지)
   player.html?mode=together&id=rabbit[&scene=3]   부모와 함께 읽기
   ?fast=1 은 점검용(녹음 대신 짧게 쉬고, 기다림을 줄임) */
(async function () {
  const $ = id => document.getElementById(id);
  const Q = new URLSearchParams(location.search);
  const MODE = Q.get('mode') === 'together' ? 'together' : 'auto';
  const FAST = Q.has('fast');
  let S = Settings.get();
  const app = $('app');
  app.classList.add(MODE);
  const wait = ms => new Promise(r => setTimeout(r, FAST ? Math.min(ms, 40) : ms));
  const play = clips => FAST ? wait(60).then(() => true) : Narr.play(clips);

  const cat = await fetch('content/catalog.json').then(r => r.json());
  const T = Object.fromEntries(cat.tales.map(t => [t.id, t]));
  let ids = (Q.get('ids') || Q.get('id') || '').split(',').filter(id => T[id]);
  if (!ids.length) ids = [cat.tales[0].id];
  if (MODE === 'together') ids = ids.slice(0, 1);

  let lb = null, story = null;
  const goHome = () => { Narr.end(); releaseWake(); location.href = 'index.html'; };
  $('home').onclick = goHome; $('nightHome').onclick = goHome;
  const roomDim = () => lb && lb.root.style.setProperty('--room-dim', Settings.ROOM_DIM[S.bright] ?? .08);

  async function loadTale(id) {
    story = await Story.load(id);
    if (lb) lb.destroy();
    $('stage').replaceChildren();
    lb = new Lightbox($('stage'), { stage: story.stage, onTap: onStageTap });
    roomDim();
    await lb.apply(story.sceneStart[0], {}, { instant: true });
  }
  function recent(id) {
    const r = Settings.read('kulkul.recent', []).filter(x => x !== id); r.unshift(id); Settings.write('kulkul.recent', r.slice(0, 8));
  }

  /* ---------- 시작(불 켜기) ---------- */
  let started = false, startResolve = null;
  function waitStart(label, sub) {
    $('start').querySelector('.t').textContent = label; $('startSub').textContent = sub || '';
    $('start').hidden = false;
    const hand = setTimeout(() => $('hand').classList.add('show'), 5000);
    return new Promise(res => { startResolve = () => { clearTimeout(hand); $('hand').classList.remove('show'); $('start').hidden = true; started = true; Narr.unlock(); res(); }; });
  }
  $('start').onclick = () => startResolve && startResolve();

  /* ---------- 무대 누름 ---------- */
  let pressT = null;
  function onStageTap(e) {
    if (!started) { startResolve && startResolve(); return; }
    poke();
    if (MODE === 'together' && S.tapAnywhere) { next(); return; }
    lb.sparkle(e.clientX, e.clientY);
    if (MODE === 'auto') { clearTimeout(pressT); pressT = setTimeout(() => Narr.stop(), 1000); } // 1초 꾹 = 지금 줄 건너뛰기(보호자용)
  }
  $('stage').addEventListener('pointerup', () => clearTimeout(pressT));
  $('stage').addEventListener('pointerleave', () => clearTimeout(pressT));

  /* ---------- 60초 손대지 않으면 어두운 덮개(자동 읽기만) ---------- */
  let idleT = null;
  function poke() {
    $('controls').classList.remove('hide');
    if (!$('night').classList.contains('end')) $('night').classList.remove('show');
    clearTimeout(idleT);
    if (MODE === 'auto' && started) idleT = setTimeout(() => { $('controls').classList.add('hide'); $('night').classList.add('show'); }, FAST ? 999999 : 60000);
  }
  $('night').addEventListener('pointerdown', () => { if (!$('night').classList.contains('end')) poke(); });
  $('night').querySelector('div').classList.add('hidden');

  function sleepScreen() {
    const n = $('night'); n.querySelector('div').classList.remove('hidden');
    n.classList.add('show'); setTimeout(() => n.classList.add('end'), 3000);
    $('controls').classList.add('hide');
    Narr.end(); releaseWake();
  }

  /* =================== 자동 읽어 주기 =================== */
  let paused = false, skipTale = false;
  const waitResume = async () => { while (paused) await wait(200); };
  function setPaused(v) {
    paused = v; Narr.hold(v); Narr.mediaState(v ? 'paused' : 'playing');
    $('pauseIcon').setAttribute('d', v ? 'M7 4v16l13-8z' : 'M6 4h4v16H6zm8 0h4v16h-4z');
    $('pause').setAttribute('aria-label', v ? '다시 읽기' : '멈춤');
  }
  $('pause').onclick = () => { poke(); setPaused(!paused); };
  $('skip').onclick = () => { poke(); skipTale = true; if (paused) setPaused(false); Narr.stop(); };
  const caption = t => { $('caption').textContent = S.captions ? (t || '') : ''; };

  async function auto() {
    $('readPanel').hidden = true;
    for (let k = 0; k < ids.length; k++) {
      const id = ids[k];
      await loadTale(id);
      $('info').textContent = ids.length > 1 ? `${ids.length}편 중 ${k + 1}편째 · 다음: ${ids[k + 1] ? T[ids[k + 1]].title : '없음'}` : story.title;
      document.title = `${story.title} · 쿨쿨 그림자극장`;
      if (k === 0) {
        await waitStart('톡 눌러서 불을 켜요', ids.length > 1 ? ids.map(i => T[i].title).join(' → ') : '');
        poke();
      } else {
        await wait(3000);
        await play([`audio/titles/${id}.mp3`]);
        await wait(1000);
      }
      Narr.media({ title: story.title }, { play: () => setPaused(false), pause: () => setPaused(true), nexttrack: () => $('skip').onclick() });
      recent(id);
      lb.setLit(true);
      await wait(1600);
      skipTale = false;
      let scene = 0;
      for (let i = 0; i < story.steps.length && !skipTale; i++) {
        await waitResume();
        const st = story.steps[i];
        if (st.sceneIdx !== scene) {
          await wait(1500);
          scene = st.sceneIdx;
          await lb.apply(story.sceneStart[scene]);
          lb.showCard(st.card);
          await wait(900);
        } else if (i === 0) { lb.showCard(st.card); await wait(900); }
        await lb.apply(st.state, st.hints);
        caption(st.text);
        await play(st.clips);
        await waitResume();
        if (!document.hidden) await wait(700);
      }
      caption('');
      // '잘 자': 빛이 천천히 꺼져 흰 종이로
      lb.setLit(false, (story.stage.end && story.stage.end.fadeOut) || 8000);
      await wait(document.hidden ? 2000 : ((story.stage.end && story.stage.end.fadeOut) || 8000));
    }
    sleepScreen();
  }

  /* =================== 부모와 함께 읽기 =================== */
  let idx = 0, shownScene = -1, wake = null;
  async function requestWake() { try { wake = await navigator.wakeLock.request('screen'); } catch (e) { wake = null; } }
  function releaseWake() { try { wake && wake.release(); } catch (e) { /* 무시 */ } wake = null; }
  document.addEventListener('visibilitychange', () => { if (MODE === 'together' && started && !document.hidden && !wake) requestWake(); });

  function renderLines() {
    const st = story.steps[idx];
    const sc = story.scenes[st.sceneIdx];
    const fs = { small: 18, normal: 22, large: 28 }[S.textSize] || 22;
    $('lines').style.setProperty('--fs', `clamp(${fs - 4}px, ${fs / 10}vw + 8px, ${fs}px)`);
    if (shownScene !== st.sceneIdx) {
      $('lines').innerHTML = sc.lines.map(l => `<p>${l.text.replace(/</g, '&lt;')}</p>`).join('');
      shownScene = st.sceneIdx;
    }
    [...$('lines').children].forEach((p, i) => { p.className = i < st.lineIdx ? 'done' : i === st.lineIdx ? 'now' : ''; });
    const now = $('lines').children[st.lineIdx]; if (now) now.scrollIntoView({ block: 'nearest' });
    $('where').textContent = `${sc.card} (${st.sceneIdx + 1}/${story.scenes.length})`;
    $('info').textContent = story.title;
    $('prev').disabled = idx === 0; $('prev').style.opacity = idx === 0 ? .35 : 1;
    Settings.write('kulkul.together', { id: story.id, scene: st.sceneIdx });
  }
  async function go(i, forward) {
    const prev = story.steps[idx]; idx = i;
    const st = story.steps[idx];
    Narr.stop();
    if (forward && st.lineIdx === 0) { await lb.apply(story.sceneStart[st.sceneIdx]); lb.showCard(st.card); }
    else if (!forward && prev && prev.sceneIdx !== st.sceneIdx) lb.showCard(story.scenes[st.sceneIdx].card);
    await lb.apply(st.state, forward ? st.hints : {});
    renderLines();
    if (S.roles && forward) { // 인물 대사만 녹음으로
      const sr = st.segRoles || [];
      const clips = st.clips.length === sr.length ? st.clips.filter((c, k) => sr[k] !== 'nar') : (sr.length === 1 && sr[0] !== 'nar' ? st.clips : []);
      if (clips.length) play(clips);
    }
  }
  /* 넘김은 줄을 세워 하나씩 처리한다(장면이 바뀌는 동안 누른 것도 잃지 않게) */
  let busy = false, finished = false; const queue = [];
  async function pump() {
    if (busy) return; busy = true;
    try {
      while (queue.length && !finished) {
        const dir = queue.shift();
        if (dir > 0) {
          if (idx < story.steps.length - 1) await go(idx + 1, queue.length === 0);
          else {
            finished = true; queue.length = 0; Narr.stop();
            Settings.write('kulkul.together', null);
            lb.setLit(false, 8000); await wait(8000); sleepScreen();
          }
        } else if (idx > 0) await go(idx - 1, false);
      }
    } finally { busy = false; }
  }
  function next() { if (!started || finished) return; if (queue.length < 6) queue.push(1); pump(); }
  function prev() { if (!started || finished) return; if (queue.length < 6) queue.push(-1); pump(); }
  $('next').onclick = next; $('prev').onclick = prev; $('nextBand').onclick = next;
  document.addEventListener('keydown', e => { if (MODE !== 'together') return; if (e.key === 'ArrowRight' || e.key === ' ') next(); if (e.key === 'ArrowLeft') prev(); });

  async function together() {
    $('controls').style.display = 'none'; $('caption').style.display = 'none'; $('readPanel').hidden = false;
    await loadTale(ids[0]);
    recent(ids[0]);
    const sc = Math.max(0, Math.min(+(Q.get('scene') || 0), story.scenes.length - 1));
    idx = story.steps.findIndex(s => s.sceneIdx === sc);
    await lb.apply(story.sceneStart[sc], {}, { instant: true });
    renderLines();
    await waitStart('불을 켜고 함께 읽어요', sc ? `${story.scenes[sc].card}부터` : '');
    app.classList.add('reading');
    requestWake();
    lb.setLit(true);
    lb.showCard(story.scenes[sc].card);
    await lb.apply(story.steps[idx].state, story.steps[idx].hints);
  }

  if (MODE === 'auto') auto(); else together();
  window.__player = { get story() { return story; }, get idx() { return idx; }, next, prev, get lb() { return lb; } }; // 점검용
})();
