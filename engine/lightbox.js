/* 쿨쿨 그림자극장 — 빛 상자 무대 (빛 상자 시안을 모듈로 옮김, PLAN §5).
   그림은 흰 종이 모양(SVG 알파)만 있다. 층마다 두 번 그린다:
     off = 불 꺼진 흰 종이(종이색 + 종이결), on = 그 모양으로 오린 빛(c1→c2 그라데이션 + 층 어둡기 dk + 종이결 multiply).
   무대 상태(state) 하나를 받아 그대로 그린다. 앞뒤로 오가도 상태만 바꾸면 된다(함께 읽기 '앞 줄'). */
(function () {
  const PRESETS = {
    night_forest: { c1: '#2b3bc4', c2: '#ff8f24', glow: '#fff1c4' },
    dusk:         { c1: '#ee7d06', c2: '#ffcb1f', glow: '#fff6b8' },
    dream:        { c1: '#7b4fd8', c2: '#ff8fc0', glow: '#ffe6f4' },
    moon:         { c1: '#10256e', c2: '#3f8df0', glow: '#eaf4ff' },
    dawn:         { c1: '#c9405f', c2: '#ffa45c', glow: '#fff0d4' },
    hearth:       { c1: '#7a2e1c', c2: '#ff9a4a', glow: '#ffd9a0' },
    sea:          { c1: '#0f3f6b', c2: '#3fb6b0', glow: '#d8fff6' },
    snow:         { c1: '#5a6fa8', c2: '#dfe8f5', glow: '#ffffff' },
  };
  const LAYERS = [ // 이름, 기본 어둡기, 시차(px), 확대
    ['far', .2, 4, 1], ['far2', .36, 6, 1], ['mid', .52, 8, 1], ['ground', .68, 10, 1], ['dolls', .82, 11, 1], ['near', .8, 15, 1], ['fx', 0, 0, 1], ['frame', .92, 22, 1.06],
  ];
  const BASE = (document.currentScript && document.currentScript.src.replace(/engine\/lightbox\.js.*$/, '')) || './';
  const url = p => BASE + p;
  const reduced = () => { try { return matchMedia('(prefers-reduced-motion: reduce)').matches || JSON.parse(localStorage.getItem('kulkul.settings') || '{}').calm; } catch (e) { return false; } };

  function el(tag, cls, parent) { const e = document.createElement(tag); if (cls) e.className = cls; if (parent) parent.appendChild(e); return e; }
  function paper(parent, src, dk) {
    const sh = el('div', 'lb-sheet', parent);
    // 시안과 같은 방식: 꺼짐 = 그림 그대로(흰 종이), 켜짐 = 그림 모양으로 오린 빛 + 그림의 종이결(multiply)
    const off = el('img', 'lb-off', sh); off.src = url(src); off.alt = ''; off.decoding = 'async';
    off.onerror = () => sh.classList.add('lb-missing'); // 그림이 아직 없으면 그 층은 비워 둔다(대신 그리지 않음)
    const on = el('div', 'lb-on', sh);
    on.style.webkitMaskImage = on.style.maskImage = `url("${url(src)}")`;
    on.style.setProperty('--dk', dk); on.style.setProperty('--tex', `url("${url(src)}")`);
    return sh;
  }

  class Lightbox {
    /* opts: { static: true(홈 타일: 반딧불·흔들림 없음), stage: stage.json, onTap } */
    constructor(root, opts = {}) {
      this.root = root; this.opts = opts; this.stage = opts.stage || { boxes: {}, dolls: {} };
      root.classList.add('lb');
      if (opts.static) root.classList.add('lb-static');
      this.back = el('div', 'lb-back', root);
      this.backOn = el('div', 'lb-back-on', root);
      this.moon = el('div', 'lb-moon', root);
      this.boxEl = el('div', 'lb-box', root);
      this.dim = el('div', 'lb-dim', root);
      this.card = el('div', 'lb-card', root);
      this.layers = {}; this.dollEls = {}; this.state = null; this.boxKey = null; this.lit = false;
      this.dk = {};
      if (!opts.static) { this._t0 = performance.now(); this._raf = requestAnimationFrame(t => this._drift(t)); }
      root.addEventListener('pointerdown', e => opts.onTap && opts.onTap(e));
    }
    destroy() { cancelAnimationFrame(this._raf); this.root.innerHTML = ''; }

    _buildBox(key) {
      const box = this.stage.boxes[key];
      if (!box) throw new Error('상자 없음: ' + key);
      const wrap = el('div', 'lb-boxset');
      this.layers = {}; this.dollEls = {};
      for (const [name, dk0, px, sc] of LAYERS) {
        const L = el('div', 'lb-layer lb-' + name, wrap);
        L.dataset.px = px; L.dataset.s = sc;
        this.layers[name] = L;
        const dk = (box.dk && box.dk[name] != null) ? box.dk[name] : dk0;
        this.dk[name] = dk;
        if (box.layers && box.layers[name]) paper(L, box.layers[name], dk);
      }
      const g = box.glowAt || [58, 22];
      this.root.style.setProperty('--gx', g[0] + '%'); this.root.style.setProperty('--gy', g[1] + '%');
      this.root.classList.toggle('lb-nomoon', !!box.noMoon);
      this.boxEl.replaceChildren(wrap);
      this.boxKey = key;
      this._fx(null);
    }

    _doll(name) {
      if (this.dollEls[name]) return this.dollEls[name];
      const d = this.stage.dolls[name]; if (!d) throw new Error('인형 없음: ' + name);
      const e = el('div', 'lb-doll', this.layers.dolls);
      e.style.width = d.w + '%';
      e.style.setProperty('--asp', d.aspect || 1);
      const bob = el('div', 'lb-bob', e);
      el('div', 'lb-lantern', bob);
      e._sprites = {};
      for (const [pose, src] of Object.entries(d.poses)) { // 걷기·오르기는 그림 여러 장(프레임)
        const frames = [].concat(src).map(f => { const s = paper(bob, f, d.dk != null ? d.dk : this.dk.dolls); s.classList.add('lb-pose'); if (Array.isArray(src)) s.classList.add('lb-frame'); return s; });
        e._sprites[pose] = frames;
      }
      e._frameMs = d.frameMs || 320;
      e._pose = null; e.style.opacity = 0;
      this.dollEls[name] = e;
      return e;
    }

    _fx(kind) {
      const fx = this.layers.fx; if (!fx || fx.dataset.kind === String(kind)) return;
      fx.dataset.kind = String(kind); fx.replaceChildren();
      if (!kind || kind === 'none' || this.opts.static) return;
      const R = Math.random;
      const n = { fireflies: 16, snow: 46, leaves: 16, stars: 26 }[kind] || 0;
      for (let i = 0; i < n; i++) {
        const f = el('div', 'lb-fx-' + kind, fx);
        f.style.left = (kind === 'fireflies' ? 18 + R() * 64 : R() * 100) + '%';
        f.style.top = (kind === 'fireflies' ? 40 + R() * 45 : kind === 'stars' ? R() * 40 : -10) + '%';
        f.style.setProperty('--d', (kind === 'snow' ? 7 + R() * 7 : kind === 'leaves' ? 8 + R() * 6 : 4 + R() * 4) + 's');
        f.style.setProperty('--del', (-R() * 10) + 's');
        f.style.setProperty('--dx', (R() * 60 - 30) + 'px'); f.style.setProperty('--dy', (-20 - R() * 40) + 'px');
        f.style.setProperty('--s', .6 + R() * .8);
      }
    }

    /* 손끝 반딧불(아이가 무대를 톡 했을 때, 진행과 상관없음) */
    sparkle(x, y) {
      if (!this.lit || this.opts.static) return;
      const r = this.root.getBoundingClientRect();
      for (let i = 0; i < 5; i++) {
        const f = el('div', 'lb-spark', this.root);
        f.style.left = (x - r.left) + 'px'; f.style.top = (y - r.top) + 'px';
        f.style.setProperty('--dx', (Math.random() * 80 - 40) + 'px'); f.style.setProperty('--dy', (-40 - Math.random() * 60) + 'px');
        f.style.animationDelay = (i * .08) + 's';
        setTimeout(() => f.remove(), 2600);
      }
    }

    setLit(on, ms = 2400) {
      this.lit = on; this.root.style.setProperty('--lt', ms + 'ms');
      this.root.classList.toggle('lit', on);
    }
    setDim(v, ms = 900) { this.dim.style.transitionDuration = ms + 'ms'; this.dim.style.opacity = v; }
    showCard(text) {
      if (!text) return;
      this.card.textContent = text; this.card.classList.remove('show'); void this.card.offsetWidth; this.card.classList.add('show');
    }

    /* state: { box, light, power, fx, dolls: { name: { pose, x, y, vis, flip, lantern } } }
       hints: { name: { walk: 초, from: 'left'|'right'|'top' } } — 앞으로 한 줄 갈 때만. 없으면 0.6초에 그 자리로 */
    async apply(state, hints = {}, { instant = false } = {}) {
      if (state.box !== this.boxKey) {
        if (this.boxKey && !instant) { this.setDim(1, 800); await wait(820); }
        this._buildBox(state.box);
        this.state = null;
        instant = true;
      }
      const P = PRESETS[state.light] || PRESETS.night_forest;
      const r = this.root.style;
      if (instant) this.root.classList.add('lb-instant');
      r.setProperty('--c1', P.c1); r.setProperty('--c2', P.c2); r.setProperty('--glow', P.glow);
      r.setProperty('--power', state.power != null ? state.power : 1);
      this._fx(state.fx || 'fireflies');
      for (const [name, d] of Object.entries(state.dolls || {})) this._placeDoll(name, d, instant ? {} : (hints[name] || {}), instant);
      for (const [name, e] of Object.entries(this.dollEls)) if (!(state.dolls || {})[name]) e.style.opacity = 0;
      if (instant) { void this.root.offsetWidth; this.root.classList.remove('lb-instant'); }
      if (this.dim.style.opacity === '1') this.setDim(0, 900);
      this.state = state;
    }

    _placeDoll(name, d, hint, instant) {
      const e = this._doll(name);
      const prev = e._st;
      const vis = d.vis !== false;
      const setPos = (x, y) => { e.style.left = x + '%'; e.style.bottom = y + '%'; };
      e.style.setProperty('--flip', d.flip ? -1 : 1);
      if (d.pose !== e._pose) { for (const [p, fr] of Object.entries(e._sprites)) fr.forEach((s, i) => s.classList.toggle('on', p === d.pose && i === 0)); e._pose = d.pose; }
      e.classList.toggle('lantern', !!d.lantern);
      e.style.zIndex = d.z || 1;
      let dur = .6;
      if (instant) dur = 0;
      else if (hint.walk) dur = hint.walk;
      if (!instant && hint.from && vis && (!prev || prev.vis === false)) { // 옆에서 들어오기
        e.style.transition = 'none';
        const off = { left: [-20, d.y], right: [120, d.y], top: [d.x, 110], bottom: [d.x, -40] }[hint.from];
        setPos(...off); e.style.opacity = 1; void e.offsetWidth; dur = hint.walk || 3;
      }
      if (!instant && hint.to && !vis) { // 옆으로 나가기
        const off = { left: [-25, prev ? prev.y : d.y], right: [125, prev ? prev.y : d.y], top: [prev ? prev.x : d.x, 115] }[hint.to];
        dur = hint.walk || 3;
        e.style.transition = `left ${dur}s linear, bottom ${dur}s linear, opacity .4s ease ${Math.max(0, dur - .4)}s`;
        setPos(...off); e.style.opacity = 0; e.classList.add('walking');
        clearTimeout(e._wt); e._wt = setTimeout(() => e.classList.remove('walking'), dur * 1000);
        e._st = { ...d }; return;
      }
      e.style.transition = dur ? `left ${dur}s ${hint.walk || hint.from ? 'linear' : 'ease'}, bottom ${dur}s ${hint.walk || hint.from ? 'linear' : 'ease'}, opacity .6s ease` : 'none';
      setPos(d.x, d.y);
      e.style.opacity = vis ? 1 : 0;
      const moving = !instant && (hint.walk || hint.from);
      e.classList.toggle('walking', !!moving);
      this._cycle(e, !!moving);
      clearTimeout(e._wt); if (moving) e._wt = setTimeout(() => { e.classList.remove('walking'); this._cycle(e, false); }, dur * 1000);
      e._st = { ...d };
    }

    /* 걷는 동안 자세의 그림을 차례로 바꾼다. 멈추면 첫 장으로 */
    _cycle(e, on) {
      clearInterval(e._ft);
      const fr = e._sprites[e._pose]; if (!fr || fr.length < 2) return;
      let i = 0; const show = () => fr.forEach((s, k) => s.classList.toggle('on', k === i));
      show();
      e.classList.toggle('framing', on);
      if (on && !reduced()) e._ft = setInterval(() => { if (document.hidden) return; i = (i + 1) % fr.length; show(); }, e._frameMs);
    }

    _drift(t) {
      this._raf = requestAnimationFrame(tt => this._drift(tt));
      if (document.hidden || reduced()) return;
      const s = (t - this._t0) / 1000, x = Math.sin(s * .25), y = Math.sin(s * .17) * .5;
      for (const L of Object.values(this.layers)) {
        const p = +L.dataset.px || 0, sc = +L.dataset.s || 1;
        L.style.transform = `translate(${x * p * .5}px, ${y * p * .3}px) scale(${sc + p * .0012})`;
      }
    }
  }
  const wait = ms => new Promise(r => setTimeout(r, ms));
  window.Lightbox = Lightbox; window.LIGHT_PRESETS = PRESETS;
})();
