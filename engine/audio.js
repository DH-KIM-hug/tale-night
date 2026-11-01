/* 쿨쿨 그림자극장 — 내레이션 재생 (동화극장 audio.js 에서 잠자리 듣기에 필요한 것만 옮김, docs/REUSE.md §3)
   - 녹음만 튼다(기계 음성 없음). 효과음·Web Audio 없음(잠금 중 안 나오고, 잠자리엔 조용한 쪽).
   - 첫 누름에서 unlock(): 내레이션 <audio> 에 재생 허락 + iOS 는 무음 반복 <audio>(keepAlive)로 오디오 세션을 '재생'으로 붙잡아
     화면이 꺼져도 다음 줄로 이어진다(동화극장 mediaNarration·unlock 과 같은 이유).
   - 한 줄 = 녹음 1~여러 개를 차례로. 시간 제한 = 녹음 길이 + 3초(동화극장 readPlay guard). */
(function () {
  const BASE = (document.currentScript && document.currentScript.src.replace(/engine\/audio\.js.*$/, '')) || './';
  const SILENT = BASE + 'audio/silence.mp3';
  const isIOS = /iP(hone|ad|od)|Macintosh/.test(navigator.userAgent) && 'ontouchend' in document;
  let nar = null, keep = null, token = 0, held = false, unlocked = false;

  function make() {
    if (nar) return;
    nar = new Audio(); nar.preload = 'auto'; nar.setAttribute('playsinline', ''); nar.setAttribute('x-webkit-airplay', 'deny');
    if (isIOS) { keep = new Audio(SILENT); keep.loop = true; keep.volume = .01; keep.setAttribute('playsinline', ''); }
  }
  /* 사용자 누름 안에서 불러야 한다 */
  function unlock() {
    make();
    try { if (navigator.audioSession) navigator.audioSession.type = 'playback'; } catch (e) { /* 무시 */ }
    if (!unlocked) { nar.src = SILENT; nar.play().catch(() => {}); unlocked = true; }
    if (keep && keep.paused) keep.play().catch(() => {});
  }
  function playOne(src, my) {
    return new Promise(res => {
      if (my !== token) return res(false);
      let done = false; const fin = ok => { if (done) return; done = true; clearTimeout(g); nar.onended = nar.onerror = null; res(ok); };
      nar.onended = () => fin(true); nar.onerror = () => fin(true);
      nar.src = BASE + src; nar.currentTime = 0;
      const p = nar.play(); if (p) p.catch(() => fin(true));
      // 길이를 모르면 넉넉히 기다렸다 다음으로(전화 등으로 멈춘 경우도 여기서 넘어간다)
      let g = setTimeout(function chk() {
        if (held) { g = setTimeout(chk, 1000); return; }
        const d = isFinite(nar.duration) ? nar.duration : 8;
        if (nar.currentTime >= d - .05 || nar.paused) fin(true); else g = setTimeout(chk, 1500);
      }, ((isFinite(nar.duration) && nar.duration) || 8) * 1000 + 3000);
    });
  }
  /* 한 줄 재생. clips 배열을 차례로. 멈춤(stop)되면 false */
  async function play(clips) {
    make();
    const my = ++token;
    for (const c of clips) { const ok = await playOne(c, my); if (!ok || my !== token) return false; }
    return my === token;
  }
  function stop() { token++; if (nar) { nar.pause(); nar.onended = nar.onerror = null; } }
  function hold(on) { held = on; if (!nar) return; if (on) nar.pause(); else if (nar.src && !nar.ended) nar.play().catch(() => {}); }
  function end() { // 다 듣고 끝낼 때: 세션 놓기(BEDTIME_PLAN §5-9)
    stop(); if (nar) nar.removeAttribute('src'); if (keep) keep.pause();
    try { if (navigator.mediaSession) { navigator.mediaSession.playbackState = 'none'; for (const a of ['play', 'pause', 'nexttrack']) navigator.mediaSession.setActionHandler(a, null); } } catch (e) { /* 무시 */ }
  }
  function media(meta, handlers) {
    if (!('mediaSession' in navigator)) return;
    try {
      navigator.mediaSession.metadata = new MediaMetadata({ title: meta.title, artist: '쿨쿨 그림자극장', album: meta.album || '잠자리 동화',
        artwork: [{ src: BASE + 'assets/icon-512.png', sizes: '512x512', type: 'image/png' }] });
      for (const [a, fn] of Object.entries(handlers)) navigator.mediaSession.setActionHandler(a, fn);
      navigator.mediaSession.playbackState = 'playing';
    } catch (e) { /* 무시 */ }
  }
  function mediaState(s) { try { navigator.mediaSession.playbackState = s; } catch (e) { /* 무시 */ } }
  window.Narr = { unlock, play, stop, hold, end, media, mediaState, get held() { return held; }, get now() { return nar ? `${(nar.src || '').split('/').pop()}@${nar.currentTime.toFixed(1)}` : '-'; } };
})();
