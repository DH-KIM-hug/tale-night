/* 보호자 설정 (PLAN §4 S5) — localStorage 'kulkul.settings'. 저장이 안 되는 환경에서도 기본값으로 동작한다. */
(function () {
  const KEY = 'kulkul.settings';
  const DEF = { count: 2, captions: false, bright: 'normal', calm: false, textSize: 'normal', roles: false, tapAnywhere: false };
  const read = (k, d) => { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : d; } catch (e) { return d; } };
  const write = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) { /* 무시 */ } };
  const get = () => ({ ...DEF, ...read(KEY, {}) });
  const set = patch => { const v = { ...get(), ...patch }; write(KEY, v); return v; };
  const ROOM_DIM = { bright: 0, normal: .08, dim: .22 };

  /* 1초 꾹 눌러야 열리는 단추(아이의 무작위 톡을 막음) */
  function holdButton(btn, ms, fn) {
    let t0 = 0, raf = 0;
    const tick = () => { const p = Math.min(1, (performance.now() - t0) / ms); btn.style.setProperty('--p', p); if (p >= 1) { stop(); fn(); } else raf = requestAnimationFrame(tick); };
    const start = e => { e.preventDefault(); t0 = performance.now(); btn.classList.add('holding'); raf = requestAnimationFrame(tick); };
    const stop = () => { cancelAnimationFrame(raf); btn.classList.remove('holding'); btn.style.setProperty('--p', 0); };
    btn.addEventListener('pointerdown', start); for (const ev of ['pointerup', 'pointerleave', 'pointercancel']) btn.addEventListener(ev, stop);
    btn.addEventListener('contextmenu', e => e.preventDefault());
  }

  const ROWS = [
    ['count', '자동으로 읽어 줘요: 이어 듣기', '몇 편 듣고 조용히 멈출까요', [[1, '1편'], [2, '2편'], [3, '3편'], [5, '5편']]],
    ['captions', '자동 읽기 자막', '읽어 주는 글을 무대 아래에 보여 줘요', [[false, '끄기'], [true, '켜기']]],
    ['bright', '빛 세기', '상자 전체 밝기', [['dim', '어둡게'], ['normal', '보통'], ['bright', '밝게']]],
    ['calm', '움직임 줄이기', '흔들림·반딧불 끄기', [[false, '끄기'], [true, '켜기']]],
    ['textSize', '함께 읽기 글자 크기', '', [['small', '작게'], ['normal', '보통'], ['large', '크게']]],
    ['roles', '함께 읽기: 인물 대사는 녹음으로', '내레이션은 어른이 읽고, 인물 목소리는 앱이 내요', [[false, '끄기'], [true, '켜기']]],
    ['tapAnywhere', '함께 읽기: 무대 어디든 톡으로 넘기기', '끄면 → 단추와 무대 오른쪽 끝으로만 넘겨요', [[false, '끄기'], [true, '켜기']]],
  ];
  function openSheet(onChange) {
    let bg = document.querySelector('.sheet-bg'), sh = document.querySelector('.sheet');
    if (!sh) {
      bg = document.createElement('div'); bg.className = 'sheet-bg'; document.body.appendChild(bg);
      sh = document.createElement('div'); sh.className = 'sheet'; sh.setAttribute('role', 'dialog'); sh.setAttribute('aria-label', '보호자 설정'); document.body.appendChild(sh);
      bg.onclick = () => close();
    }
    const close = () => { bg.classList.remove('open'); sh.classList.remove('open'); };
    const render = () => {
      const s = get();
      sh.innerHTML = `<h2>보호자 설정 <button class="pill" data-close>닫기</button></h2>` + ROWS.map(([k, label, sub, opts]) =>
        `<div class="row"><span>${label}${sub ? `<small>${sub}</small>` : ''}</span><div class="seg">${opts.map(([v, t]) =>
          `<button class="pill" data-k="${k}" data-v='${JSON.stringify(v)}' aria-pressed="${s[k] === v}">${t}</button>`).join('')}</div></div>`).join('') +
        `<div class="row"><span class="muted" style="font-size:12px">광고·외부 분석 없음. 기록은 이 기기 안에만 저장해요.</span></div>`;
      sh.querySelector('[data-close]').onclick = close;
      sh.querySelectorAll('[data-k]').forEach(b => b.onclick = () => { set({ [b.dataset.k]: JSON.parse(b.dataset.v) }); render(); onChange && onChange(get()); });
    };
    render(); bg.classList.add('open'); sh.classList.add('open');
  }
  window.Settings = { get, set, read, write, holdButton, openSheet, ROOM_DIM };
})();
