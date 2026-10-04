/* M.V.P. Accelerator course player. One file for both tracks (Athleader and Player-Coach); every difference
   between them comes from COURSE.track or from the content file, so the two builds carry the same player.js.
   Behaves like the Storyline build: one package per track, suspend data for resume, code-gated assessments,
   JotForm forms embedded on screens of their own, narration on every screen with on-screen builds cued to it,
   a seek bar that is the current slide's timeline, full-screen video, drill videos that hold for the learner.
   Content comes from the content file (every word on screen, from the content model), narration timing from the
   narration file, video captions from the captions file. This file holds layout and behaviour only. */
(function () {
  'use strict';
  const C = window.COURSE, S = window.SCREENS, V = window.VIDEOS, P = window.PROS, D = window.DRILLS;
  const CAP = window.CAPTIONS || {}, NAR = window.NARRATION || {};
  const U = C.ui || {};
  // a screen's own field, or the copy every screen of that type shares (COURSE.ui.<type>)
  const F = (s, k) => (s[k] != null ? s[k] : (U[s.type] || {})[k]);
  const PC = C.track === 'Player-Coach';
  const $ = (s, r) => (r || document).querySelector(s);
  const $$ = (s, r) => Array.from((r || document).querySelectorAll(s));
  const play = m => { const p = m.play(); if (p && p.catch) p.catch(() => {}); };   // a play cut short by a pause is not an error
  const esc = s => String(s == null ? '' : s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  // fills {n}, {first}, {total}, {date} in a label from the content model
  const T = (s, v) => String(s == null ? '' : s).replace(/\{(\w+)\}/g, (m, k) => (v && v[k] != null ? v[k] : m));
  /* Two ways to open the same course: 'learner' (every rule on) and 'review' (Next, the menu and every video
     timeline unlocked, for QA). Set in the launch file. */
  const MODE = window.COURSE_MODE === 'review' ? 'review' : 'learner';
  // one saved state per track, so a person testing both tracks in one browser keeps two
  const KEY = 'mvp_accelerator_' + (PC ? 'playercoach_v1' : 'athleader_v3') + (MODE === 'review' ? '_review' : '');
  const REDUCE = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const LESSONS = C.lessons.map(l => l.id);
  const ICON = { agility: 'assets/Agility.png', resilience: 'assets/Resilience.png', alignment: 'assets/Alignment.png', wellbeing: 'assets/Well-being.png' };
  const photo = p => `assets/photos/${p}.jpg`;

  /* ---------------- Brand star and line icons ---------------- */
  const STAR_D = (() => { const p = []; for (let k = 0; k < 16; k++) { const a = k * Math.PI / 8, r = k % 4 === 0 ? 11.6 : (k % 2 === 0 ? 5 : 2); p.push((12 + r * Math.sin(a)).toFixed(2) + ' ' + (12 - r * Math.cos(a)).toFixed(2)); } return 'M' + p.join('L') + 'Z'; })();
  const STAR = `<svg class="star" viewBox="0 0 24 24" aria-hidden="true"><path d="${STAR_D}"/></svg>`;
  const STARSVG = `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="${STAR_D}"/></svg>`;
  /* Large outline numerals. The stroke is masked by the glyph fill, so the variable font's overlapping
     contours never show as inner lines, on any background. */
  let onum = 0;
  function outnum(txt, size, color, cls) {
    const id = 'om' + (++onum), sw = size > 200 ? 5 : 4, w = Math.round(txt.length * size * 0.72 + sw), h = Math.round(size * 1.02);
    const t = a => '<text x="' + (sw / 2) + '" y="' + Math.round(size * 0.86) + '" font-size="' + size + '" font-weight="800" letter-spacing="' + (-size * 0.02).toFixed(1) + '" ' + a + '>' + txt + '</text>';
    return '<svg class="onum ' + (cls || '') + '" width="' + w + '" height="' + h + '" viewBox="0 0 ' + w + ' ' + h + '" aria-hidden="true"><defs><mask id="' + id + '" maskUnits="userSpaceOnUse" x="-10" y="-10" width="' + (w + 20) + '" height="' + (h + 20) + '"><rect x="-10" y="-10" width="' + (w + 20) + '" height="' + (h + 20) + '" fill="#fff"/>' + t('fill="#000"') + '</mask></defs>' + t('fill="none" stroke="' + (color || '#C9A45C') + '" stroke-width="' + sw + '" mask="url(#' + id + ')"') + '</svg>';
  }
  const ic = d => `<svg class="ic" viewBox="0 0 24 24" aria-hidden="true">${d}</svg>`;
  const IC = {
    clock: ic('<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>'),
    download: ic('<path d="M12 4v11M7 10l5 5 5-5M5 20h14"/>'),
    ext: ic('<path d="M14 4h6v6M20 4l-9 9M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5"/>'),
    check: ic('<path d="M5 12.5l4.5 4.5L19 7.5"/>'),
    x: ic('<path d="M6 6l12 12M18 6L6 18"/>'),
    retry: ic('<path d="M4 12a8 8 0 1 0 2.4-5.7"/><path d="M4 4v5h5"/>'),
    arrow: ic('<path d="M5 12h14M13 6l6 6-6 6"/>'),
    arrowL: ic('<path d="M19 12H5M11 6l-6 6 6 6"/>'),
    cal: ic('<rect x="3.5" y="5" width="17" height="15" rx="2"/><path d="M3.5 10h17M8 3v4M16 3v4"/>'),
    doc: ic('<path d="M7 3h7l5 5v12a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1z"/><path d="M14 3v5h5M9 13h6M9 17h6"/>'),
    clip: ic('<rect x="5" y="4" width="14" height="17" rx="2"/><path d="M9 4h6v3H9zM8.5 12l2 2 4-4M8.5 17h7"/>'),
    book: ic('<path d="M4 5a2 2 0 0 1 2-2h13v16H6a2 2 0 0 0-2 2z"/><path d="M4 19V5M8 7h7"/>'),
    people: ic('<circle cx="9" cy="8" r="3.5"/><path d="M2.5 20a6.5 6.5 0 0 1 13 0"/><circle cx="17" cy="9" r="2.5"/><path d="M16 14.5a5 5 0 0 1 5.5 5"/>'),
    key: ic('<circle cx="8" cy="15" r="4"/><path d="M11 12l8-8M16 7l3 3M14 9l2 2"/>'),
    reps: ic('<path d="M17 2l4 4-4 4"/><path d="M3 11V9a3 3 0 0 1 3-3h15M7 22l-4-4 4-4"/><path d="M21 13v2a3 3 0 0 1-3 3H3"/>'),
    copy: ic('<rect x="8" y="8" width="12" height="12" rx="2"/><path d="M16 8V5a1 1 0 0 0-1-1H5a1 1 0 0 0-1 1v10a1 1 0 0 0 1 1h3"/>'),
    print: ic('<path d="M7 9V3h10v6M7 17H5a1 1 0 0 1-1-1v-5a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v5a1 1 0 0 1-1 1h-2"/><rect x="7" y="14" width="10" height="7"/>'),
    plus: ic('<path d="M12 5v14M5 12h14"/>'),
    lock: ic('<rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/>')
  };

  /* ---------------- State (the suspend_data equivalent) ---------------- */
  function defaults() {
    return {
      // the name comes only from the LMS (see lmsLearner); the ID is a sample value sent to JotForm as learner_id
      pos: 0, max: 0, seen: {}, learner: { id: 'AVN-20417', first: '', last: '' },
      gates: {}, ci: {}, checkin: {}, patterns: {}, drills: {}, calls: {}, kc: {}, recall: {}, tabs: {}, sorts: {},
      pd: {}, base: {}, today: {}, why: '', review: {}, loop: {}, watched: {}, heard: {}, answers: {}, no180: false,
      certName: null, completed: null, cc: true, free: false, vol: 0.9, interactions: [], started: new Date().toISOString()
    };
  }
  let st = load();
  st.free = MODE === 'review';
  /* The learner's name, from the LMS when the course runs inside one: SCORM 1.2 cmi.core.student_name
     ("Last, First") or SCORM 2004 cmi.learner_name. Outside an LMS there is no name and none is shown. */
  function findApi(name) {
    let w = window;
    for (let i = 0; i < 12 && w; i++) { try { if (w[name]) return w[name]; } catch (e) { return null; } if (w.parent === w) break; w = w.parent; }
    try { return window.opener && window.opener[name] ? window.opener[name] : null; } catch (e) { return null; }
  }
  function lmsLearner() {
    let raw = '', id = '';
    try {
      const a12 = findApi('API'), a04 = findApi('API_1484_11');
      if (a12) { raw = a12.LMSGetValue('cmi.core.student_name') || ''; id = a12.LMSGetValue('cmi.core.student_id') || ''; }
      else if (a04) { raw = a04.GetValue('cmi.learner_name') || ''; id = a04.GetValue('cmi.learner_id') || ''; }
    } catch (e) { /* no LMS */ }
    const parts = raw.split(',').map(x => x.trim()).filter(Boolean);
    const name = parts.length > 1 ? { first: parts.slice(1).join(' '), last: parts[0] } : { first: raw.trim(), last: '' };
    return { name, id };
  }
  (() => { const l = lmsLearner(); if (l.name.first) { st.learner.first = l.name.first; st.learner.last = l.name.last; } if (l.id) st.learner.id = l.id; })();
  const fullName = () => [st.learner.first, st.learner.last].filter(Boolean).join(' ');
  function load() {
    try { const raw = localStorage.getItem(KEY); if (raw) return Object.assign(defaults(), JSON.parse(raw)); } catch (e) { /* storage blocked */ }
    return defaults();
  }
  function save() { try { localStorage.setItem(KEY, JSON.stringify(st)); } catch (e) { /* storage blocked: this session only */ } }
  function logInteraction(id, type, response, result, latencyMs) {
    st.interactions.push({ id, type, response: String(response).slice(0, 250), result: result || 'neutral', latency: latencyMs || null, time: new Date().toISOString() });
    if (st.interactions.length > 200) st.interactions = st.interactions.slice(-200);
    save();
  }

  /* ---------------- Lesson access and gating ---------------- */
  const lessonNo = L => +L.slice(1);
  function lessonOpen(L) {
    if (st.free || L === 'L0') return true;
    if (L === 'L1') return !!st.gates.pre;
    return !!st.gates['pulse' + (lessonNo(L) - 1)];
  }
  function lessonDone(L) {
    if (L === 'L0') return !!st.gates.pre;
    if (L === 'L6') return !!st.completed;
    return !!st.gates['pulse' + lessonNo(L)];
  }
  function screenOpen(i) {
    const s = S[i]; if (!s) return false;
    if (st.free) return true;
    return lessonOpen(s.lesson) && i <= st.max;
  }
  function lessonName(id) { const l = C.lessons.find(x => x.id === id); return l ? l.name : ''; }
  function lessonShort(id) { const l = C.lessons.find(x => x.id === id); return l ? l.short : ''; }
  const tabItems = s => s.items || C.araw.map(a => ({ k: a.k }));
  function kcState(s) { return st.kc[s.key] || (st.kc[s.key] = {}); }
  function kcAllDone(s) { const k = st.kc[s.key] || {}; return s.qs.every((q, i) => k[i] && k[i].done); }

  // the certificate screen is a setting (COURSE.certificate.enabled); when it is off, navigation steps over it
  const certOn = () => !C.certificate || C.certificate.enabled !== false;
  const skipped = s => s && s.type === 'certificate' && !certOn();
  function nextIndex(i, dir) { let j = i + dir; while (S[j] && skipped(S[j])) j += dir; return j; }
  const gateOpen = s => !!(st.gates[s.gate] || (s.gate === 'r180' && st.no180));
  function canNext(s) {
    if (!s) return false;
    const i = S.indexOf(s);
    if (s.last) return true;
    if (nextIndex(i, 1) >= S.length) return false;
    const nxt = S[nextIndex(i, 1)];
    if (!st.free && nxt.lesson !== s.lesson && !lessonOpen(nxt.lesson)) return false;
    if (st.free) return true;
    switch (s.type) {
      case 'fullvideo': case 'drill': return !!st.watched[s.video];
      case 'tabs': return !s.gate || tabItems(s).every(it => (st.tabs[s.id] || {})[it.k]);
      case 'ready': return !!st.gates.pre;
      case 'formcode': return gateOpen(s);
      case 'kc': return kcAllDone(s);
      default: return true;
    }
  }
  function gateText(s) {
    if (st.free) return '';
    const G = U.gates || {};
    switch (s.type) {
      case 'fullvideo': return st.watched[s.video] ? '' : G.video;
      case 'drill': return st.watched[s.video] ? '' : G.drill;
      case 'tabs': return canNext(s) ? '' : G.tabs;
      case 'ready': return st.gates.pre ? '' : G.pre;
      case 'formcode': return gateOpen(s) ? '' : G[s.form];
      case 'kc': return kcAllDone(s) ? '' : G.kc;
      default: return '';
    }
  }

  /* ---------------- Chrome elements ---------------- */
  const stage = $('#stage'), slide = $('#slide'), ccBar = $('#ccBar'), vo = $('#vo');
  const btnNext = $('#btnNext'), btnPrev = $('#btnPrev'), gateMsg = $('#gateMsg'), btnPlay = $('#btnPlayVo');
  const NEXT_LBL = $('.lbl', btnNext).textContent;
  function fit() {
    const w = $('#stageWrap').clientWidth - 24, h = $('#stageWrap').clientHeight - 24;
    const sc = Math.max(0.3, Math.min(w / 1280, h / 720));
    stage.style.transform = `translate(-50%,-50%) scale(${sc})`;
  }
  window.addEventListener('resize', fit);

  /* ---------------- Seek bar: the timeline of the current slide, as in the Storyline player ----------------
     It follows whatever is playing on the slide: the narration (or a layer's clip, such as a tab or a feedback
     line), or the video on a video screen. Learner view: drag back freely, forward only as far as already
     reached, the whole bar once the clip or video has played through. Review view: free. No time labels. */
  const seek = { el: $('#seek'), fill: $('#seekFill'), reach: $('#seekReach'), kind: null, dragging: false, wasPlaying: false, raf: null };
  function seekMedia() { return seek.kind === 'video' ? activeVideo : (seek.kind === 'vo' ? vo : null); }
  function seekDur() {
    const m = seekMedia(); if (!m) return 0;
    if (m === vo) { const n = NAR[vo.dataset.key] || NAR[mainVo(S[st.pos])]; return n ? n.dur : (isFinite(vo.duration) ? vo.duration : 0); }
    return isFinite(m.duration) ? m.duration : 0;
  }
  function seekLimit() {
    const m = seekMedia(), d = seekDur(); if (!m) return 0;
    if (st.free) return d;
    if (m === vo) { const k = vo.dataset.key; return k && st.heard[k] ? d : Math.max(ui.reach[k] || 0, vo.currentTime); }
    const k = m._key; return k && st.watched[k] ? d : Math.max(m._maxT || 0, m.currentTime);
  }
  function seekBind(kind) {
    seek.kind = kind;
    const on = !!seekMedia() && (kind === 'video' || !!(vo.dataset.key || mainVo(S[st.pos])));
    seekOn(on);
    seekPaint();
  }
  // as in Storyline, the bar and Play never disappear: a screen with no timeline shows an empty, inactive track
  function seekOn(on) {
    seek.el.classList.toggle('off', !on); seek.el.tabIndex = on ? 0 : -1; seek.el.setAttribute('aria-disabled', String(!on));
    btnPlay.disabled = !on;
  }
  function seekPaint() {
    const m = seekMedia(), d = seekDur();
    const t = !m || (m === vo && !vo.dataset.key) ? 0 : Math.min(m.currentTime || 0, d || 0);
    const p = d ? t / d : 0, lim = d ? Math.min(1, seekLimit() / d) : 0;
    seek.fill.style.width = (p * 100).toFixed(2) + '%'; seek.reach.style.width = (lim * 100).toFixed(2) + '%';
    seek.el.style.setProperty('--p', p.toFixed(4));
    seek.el.setAttribute('aria-valuemax', Math.round(d)); seek.el.setAttribute('aria-valuenow', Math.round(t));
    seek.el.setAttribute('aria-valuetext', `${Math.round(t)} seconds of ${Math.round(d)}`);
    seek.el.classList.toggle('locked', !st.free && lim < 0.999);
  }
  function seekLoop() {
    cancelAnimationFrame(seek.raf);
    const step = () => { seekPaint(); const m = seekMedia(); if (m && !m.paused) seek.raf = requestAnimationFrame(step); };
    seek.raf = requestAnimationFrame(step);
  }
  function seekTo(t) {
    const m = seekMedia(); if (!m) return;
    if (m === vo && !vo.dataset.key) { const k = mainVo(S[st.pos]); if (!k || !NAR[k]) return; vo.src = 'audio/' + k + '.mp3' + (NAR[k].v ? '?v=' + NAR[k].v : ''); vo.volume = st.vol; vo.dataset.key = k; }
    const d = seekDur(); t = Math.max(0, Math.min(t, seekLimit(), d ? d - 0.05 : 0));
    try { m.currentTime = t; } catch (e) { return; }
    if (m === vo) { scrubBuilds(t); voCaption(); }
    seekPaint();
  }
  function seekFromX(x) { const r = seek.el.getBoundingClientRect(); return (Math.max(0, Math.min(1, (x - r.left) / r.width))) * seekDur(); }
  seek.el.addEventListener('pointerdown', e => {
    const m = seekMedia(); if (!m || e.button > 0) return;
    e.preventDefault(); seek.el.focus(); seek.el.setPointerCapture(e.pointerId);
    seek.dragging = true; seek.wasPlaying = !m.paused; seek.el.classList.add('drag');
    if (!m.paused) m.pause();
    seekTo(seekFromX(e.clientX));
  });
  seek.el.addEventListener('pointermove', e => { if (seek.dragging) seekTo(seekFromX(e.clientX)); });
  const endDrag = () => {
    if (!seek.dragging) return; seek.dragging = false; seek.el.classList.remove('drag');
    const m = seekMedia(); if (m && seek.wasPlaying) play(m);
    voCaption();
  };
  seek.el.addEventListener('pointerup', endDrag); seek.el.addEventListener('pointercancel', endDrag);
  seek.el.addEventListener('keydown', e => {
    const m = seekMedia(); if (!m) return;
    const cur = m === vo && !vo.dataset.key ? 0 : m.currentTime;
    if (e.key === 'ArrowLeft' || e.key === 'ArrowDown') seekTo(cur - 5);
    else if (e.key === 'ArrowRight' || e.key === 'ArrowUp') seekTo(cur + 5);
    else if (e.key === 'Home') seekTo(0);
    else if (e.key === 'End') seekTo(seekDur());
    else if (e.key === ' ' || e.key === 'Enter') togglePlay();
    else return;
    e.preventDefault();
  });

  /* ---------------- Narration, captions and cued builds ----------------
     Every screen has narration. Elements marked .b[data-c=n] stay hidden until narration chunk n starts,
     so the screen builds in step with the voice. data-d adds a delay in ms (used for sentence-by-sentence builds).
     If audio can't play (autoplay blocked, file missing), everything is revealed so nothing is ever stuck hidden.
     Pausing freezes the slide where it is, as in Storyline; the seek bar moves it back and forth. */
  let activeVideo = null, build = { key: null, els: [], timer: null, fallback: null, started: false };
  let voToken = 0;
  function stopVo() { voToken++; vo.dataset.key = ''; vo.pause(); vo.removeAttribute('src'); setPlayBtn(false); ccBar.classList.remove('show'); }
  function setPlayBtn(on) {
    btnPlay.classList.toggle('playing', on); btnPlay.setAttribute('aria-label', on ? 'Pause' : 'Play');
    if (on) btnPlay.classList.remove('nudge');
  }
  function syncPlayBtn() { const m = seekMedia(); setPlayBtn(!!m && !m.paused && !(m === vo && !vo.dataset.key)); }
  function playVo(key) {
    const n = NAR[key]; if (!n) return false;
    if (activeVideo && !activeVideo.paused) return false;
    vo.src = 'audio/' + key + '.mp3' + (NAR[key] && NAR[key].v ? '?v=' + NAR[key].v : ''); vo.volume = st.vol; vo.dataset.key = key;
    seekBind('vo');
    const token = ++voToken, p = vo.play();
    // a play that a newer one interrupted (Replay, a quick Next) is not a blocked play: leave that screen alone
    if (p && p.catch) p.catch(err => { if (token !== voToken || (err && err.name === 'AbortError')) return; setPlayBtn(false); btnPlay.classList.add('nudge'); if (key === build.key) revealAll(); });
    return true;
  }
  function voCaption() {
    const n = NAR[vo.dataset.key];
    if (!n || !st.cc || vo.ended || (vo.paused && !seek.dragging && vo.currentTime < 0.05)) { ccBar.classList.remove('show'); return; }
    let cur = ''; for (const s of n.sents) { if (vo.currentTime + 0.05 >= s[0]) cur = s[1]; }
    if (ccBar.textContent !== cur) ccBar.innerHTML = cur ? '<span>' + esc(cur) + '</span>' : '';
    ccBar.classList.toggle('show', !!cur); ccPlace();
  }
  // captions sit over the bottom of the slide, as in the Storyline player; they never hide the control that has
  // keyboard focus: if it is under them, they move up above it (WCAG 2.2, focus not obscured)
  function ccPlace() {
    ccBar.style.bottom = '';
    const a = document.activeElement;
    if (!ccBar.classList.contains('show') || !a || a === slide || !slide.contains(a)) return;
    const s = stage.getBoundingClientRect(), k = s.height / 720, r = a.getBoundingClientRect(), c = (ccBar.firstElementChild || ccBar).getBoundingClientRect();   // the dark box itself
    if (r.width && r.bottom > c.top - 6 && r.top < c.bottom && r.right > c.left && r.left < c.right) ccBar.style.bottom = Math.min(560, Math.round((s.bottom - r.top) / k + 12)) + 'px';
  }
  vo.addEventListener('timeupdate', () => {
    const k = vo.dataset.key;
    // how far the learner has got on this clip; the seek bar can't be dragged past it until the clip has played through
    if (k && !seek.dragging && !vo.seeking && vo.currentTime > (ui.reach[k] || 0) && vo.currentTime - (ui.reach[k] || 0) < 1.5) ui.reach[k] = vo.currentTime;
    voCaption(); seekPaint();
  });
  vo.addEventListener('ended', () => {
    const k = vo.dataset.key;
    if (k && !st.heard[k]) { st.heard[k] = true; save(); }
    syncPlayBtn(); ccBar.classList.remove('show'); seekPaint();
    if (k && k === build.key) revealAll();
  });
  vo.addEventListener('pause', () => { syncPlayBtn(); seekPaint(); });
  vo.addEventListener('play', () => { seekBind('vo'); syncPlayBtn(); if (vo.dataset.key === build.key) build.started = true; seekLoop(); });
  vo.addEventListener('seeked', () => { voCaption(); seekPaint(); });
  vo.addEventListener('error', () => { if (vo.dataset.key && vo.dataset.key === build.key) revealAll(); });
  btnPlay.addEventListener('click', togglePlay);
  function togglePlay() {
    const m = seekMedia();
    if (m === vo && !vo.dataset.key) { const k = mainVo(S[st.pos]); if (k) playVo(k); return; }
    if (!m) return;
    if (m.paused) {
      if (m === vo) { if (activeVideo) activeVideo.pause(); if (vo.ended || vo.currentTime >= vo.duration - 0.05) vo.currentTime = 0; }
      play(m);
    } else m.pause();
  }

  function armBuild(key, animate) {
    clearInterval(build.timer); clearTimeout(build.fallback);
    build = { key, els: $$('.b', slide), timer: null, fallback: null, started: false };
    const n = NAR[key];
    const groups = {};
    build.els.forEach(e => {
      let c = e.dataset.c == null ? 0 : +e.dataset.c;
      if (!n) c = 0;
      else c = Math.min(c, n.cues.length - 1);
      groups[c] = (groups[c] || 0) + 1;
      e._t = (n ? n.cues[c] : 0) + (groups[c] - 1) * 0.13 + (e.dataset.d ? +e.dataset.d / 1000 : 0);
      e._c = c;
    });
    if (!animate || REDUCE || !build.els.length) { revealAll(); return; }
    // chunk 0 builds straight away with the slide transition
    build.els.filter(e => e._c === 0).forEach(e => setTimeout(() => e.classList.add('in'), 250 + e._t * 1000));
    if (!n) return;
    build.timer = setInterval(() => {
      if (vo.dataset.key !== key || !build.started || vo.paused || seek.dragging) return;
      const t = vo.currentTime + 0.1;
      build.els.forEach(e => { if (e._c > 0 && !e.classList.contains('in') && t >= e._t) { e.classList.remove('now'); e.classList.add('in'); } });
    }, 80);
    // if the voice hasn't started within 2.5 seconds (blocked or slow), show the whole screen
    build.fallback = setTimeout(() => { if (!build.started) { revealAll(); if (vo.paused) btnPlay.classList.add('nudge'); } }, 2500);
  }
  // a learner who starts on an item before its cue (clicks it, types in it, tabs into it) sees it at once,
  // straight away, with anything it sits in
  const wake = ev => { for (let x = ev.target.closest ? ev.target.closest('.b:not(.in)') : null; x; x = x.parentElement ? x.parentElement.closest('.b:not(.in)') : null) { x.classList.remove('now'); x.classList.add('in'); } };
  slide.addEventListener('pointerdown', wake); slide.addEventListener('focusin', wake); slide.addEventListener('click', wake, true);
  slide.addEventListener('focusin', () => ccPlace()); slide.addEventListener('focusout', () => setTimeout(ccPlace, 0));
  // Oct 3 (Melissa's sheet row 21): no right-click menu and no dragging on course content; text selection is off in the CSS
  stage.addEventListener('contextmenu', e => { if (!e.target.closest('input,textarea')) e.preventDefault(); });
  stage.addEventListener('dragstart', e => e.preventDefault());
  function revealAll() {
    clearTimeout(build.fallback);
    build.els.filter(e => !e.classList.contains('in')).forEach((e, i) => setTimeout(() => { e.classList.remove('now'); e.classList.add('in'); }, REDUCE ? 0 : Math.min(i, 8) * 70));
  }
  /* Scrubbing the narration shows every build whose cue is at or before the new time and hides the later ones,
     without animation. A build that holds something the learner has already done (an answer, a pick, feedback)
     stays on screen, so scrubbing never takes an answer away. */
  const HAS_ANSWER = '[aria-pressed="true"],[aria-checked="true"],.right,.wrong,.alert,.saved,.fbc,.conseq,.fbline,.done';
  function scrubBuilds(t) {
    if (vo.dataset.key !== build.key) return;
    build.els.forEach(e => {
      const on = e._c === 0 || t + 0.1 >= e._t || e.matches(HAS_ANSWER) || !!e.querySelector(HAS_ANSWER) || [...e.querySelectorAll('textarea,input')].some(x => x.value);
      e.classList.add('now'); e.classList.toggle('in', on);
    });
  }
  // B(c, cls): attributes for an element that builds in on narration chunk c.
  const B = (c, cls) => ` class="b ${cls || ''}" data-c="${c}"`;
  // spread n elements across a narration clip when the content model has no explicit chunk numbers
  function autoC(i, n, key, first) {
    const m = NAR[key] ? NAR[key].cues.length : 1; first = first == null ? 1 : first;
    if (m <= 1) return 0;
    if (m - first >= n) return i + first;
    return Math.min(m - 1, first + Math.floor(i * (m - first) / n));
  }
  function cueAt(key, t) { const cs = CAP[key]; if (!cs) return ''; for (const c of cs) { if (t >= c[0] && t < c[1]) return c[2]; } return ''; }

  /* ---------------- Video component ---------------- */
  const PLAY_SVG = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 4v16l13-8z"/></svg>';
  function addBigPlay(box, v, label) {
    box.insertAdjacentHTML('beforeend', `<button class="bigplay" aria-label="Play the video">${PLAY_SVG}<span>${esc(label)}</span></button>`);
    const b = $('.bigplay', box); b.addEventListener('click', () => play(v)); v.addEventListener('play', () => { b.hidden = true; });
  }
  function mountVideo(box, key, opts) {
    opts = opts || {};
    const meta = V[key];
    // no native controls: the player's seek bar is the video's timeline, and Play/Pause sits next to it
    box.innerHTML = `<video playsinline preload="auto" disablepictureinpicture controlslist="nodownload noplaybackrate" ${meta.poster ? `poster="${meta.poster}"` : ''} aria-label="${esc(opts.label || 'Video')}"><source src="${meta.src}" type="video/mp4"></video><div class="vcc" aria-hidden="true"></div>`;
    const v = $('video', box), cc = $('.vcc', box);
    v.volume = st.vol; v._maxT = 0; v._key = key;
    activeVideo = v;
    if (opts.bigPlay) addBigPlay(box, v, opts.bigPlay);
    v.addEventListener('click', () => { if (v.paused) play(v); else v.pause(); });
    v.addEventListener('loadedmetadata', () => { if (seek.kind === 'video' && seekMedia() === v) seekPaint(); });
    v.addEventListener('pause', () => { if (seekMedia() === v) { syncPlayBtn(); seekPaint(); } });
    if (MODE === 'learner') {
      // Learner view: pause yes, skip ahead no. The playhead can't move past what has been watched.
      v.addEventListener('timeupdate', () => { if (!v.seeking && v.currentTime > v._maxT && v.currentTime - v._maxT < 2) v._maxT = v.currentTime; });
      v.addEventListener('seeking', () => { if (st.free || st.watched[key]) return; if (v.currentTime > v._maxT + 1) v.currentTime = v._maxT; });
    }
    let finished = false;
    const finish = () => {
      if (finished) return; finished = true;
      if (!st.watched[key]) { st.watched[key] = true; save(); logInteraction('video_' + key, 'other', 'watched', 'neutral'); }
      cc.innerHTML = ''; if (opts.onEnd) opts.onEnd(v); updateNav();
    };
    const nearEnd = () => v.duration && isFinite(v.duration) && v.currentTime >= v.duration - 0.6;
    v.addEventListener('timeupdate', () => {
      const txt = st.cc && meta.cc ? cueAt(meta.cc, v.currentTime) : '';
      cc.innerHTML = txt ? `<span>${esc(txt)}</span>` : '';
      if (opts.onTime) opts.onTime(v);
      if (nearEnd()) finish();
    });
    v.addEventListener('seeked', () => { finished = finished && nearEnd(); if (nearEnd()) finish(); });
    v.addEventListener('ended', finish);
    v.addEventListener('play', () => {
      if (!vo.paused) vo.pause(); ccBar.classList.remove('show');
      // the slide's narration is over once its video starts, so its builds are all on screen
      revealAll();
      seekBind('video'); syncPlayBtn(); seekLoop();
      if (opts.onPlay) opts.onPlay(v);
    });
    // the video fades in once it is actually playing, so the poster never jumps to the first frame mid-transition
    box.classList.add('vfade'); v.addEventListener('playing', () => box.classList.add('on')); v.addEventListener('loadeddata', () => { if (!opts.autoplay) box.classList.add('on'); });
    if (opts.autoplay) {
      const start = () => {
        if (activeVideo !== v) return;
        const p = v.play();
        if (p && p.catch) p.catch(() => { box.classList.add('on'); if (!$('.bigplay', box)) addBigPlay(box, v, (U.huddle && U.huddle.play) || 'Press play'); });
      };
      if (opts.delay && !REDUCE) setTimeout(start, opts.delay); else start();
    } else setTimeout(() => box.classList.add('on'), 400);
    return v;
  }

  /* ---------------- Common fragments ---------------- */
  // learner_id always; first_name only when the LMS has given a name; lesson on the Pulse Check
  const formUrl = (k, extra) => {
    const x = Object.assign({ learner_id: st.learner.id }, extra || {});
    if (!x.first_name) delete x.first_name;
    return C.forms[k].url + '?' + new URLSearchParams(x).toString();
  };
  function codeBlock(id, label, button) {
    return `<div class="code-row"><div><label for="code_${id}">${esc(label)}</label><input id="code_${id}" autocomplete="off" spellcheck="false" aria-describedby="alert_${id}"></div><button class="btn" id="btn_${id}">${esc(button)}</button></div><div id="alert_${id}" role="alert"></div>`;
  }
  function bindCode(id, expected, onOk, errText) {
    const inp = $('#code_' + id), btn = $('#btn_' + id), al = $('#alert_' + id);
    if (!inp) return;
    const go = () => {
      const val = inp.value.trim().toUpperCase().replace(/\s+/g, '');
      if (val === expected) { al.innerHTML = ''; onOk(); }
      else { al.innerHTML = `<div class="alert err"><span class="ai" aria-hidden="true">!</span><span>${esc(errText)}</span></div>`; inp.focus(); inp.select(); }
    };
    btn.addEventListener('click', go);
    inp.addEventListener('keydown', e => { if (e.key === 'Enter') go(); });
  }
  const okAlert = t => `<div class="alert ok"><span class="ai" aria-hidden="true">✓</span><span>${esc(t)}</span></div>`;
  const eyebrow = (t, c) => `<p${c == null ? ' class="eyebrow"' : B(c, 'eyebrow')}>${STAR}${esc(t)}</p>`;
  const POS = C.photo_pos || {};
  const bg = (p, alt) => p ? `<div class="bgphoto ${alt ? 'kb2' : ''}" style="background-image:url('${photo(p)}')${POS[p] ? `;background-position:${POS[p]}` : ''}" aria-hidden="true"></div>` : '';
  /* The motion watermark (Melissa's mood board, Oct 1): faint lines that move behind the thematic screens, one motion per
     part of the season (COURSE.motion: momentum, shift, pressure, progression, adapt, pivot, resilience). Decorative only. */
  const WM = {
    momentum: ['M-40 560 C 260 520, 520 420, 760 250 S 1180 40, 1340 10', 'M-40 600 C 300 560, 560 470, 800 300 S 1200 90, 1340 60', 'M-40 640 C 340 600, 600 520, 840 350 S 1220 140, 1340 110'],
    shift: ['M180 760 L 620 -40', 'M380 760 L 820 -40', 'M560 760 L 1000 -40', 'M760 760 L 1200 -40', 'M940 760 L 1380 -40'],
    pressure: ['M-40 300 C 160 240, 300 380, 480 300 S 800 220, 980 320 S 1240 260, 1340 300', 'M-40 360 C 160 300, 300 440, 480 360 S 800 280, 980 380 S 1240 320, 1340 360', 'M-40 420 C 160 360, 300 500, 480 420 S 800 340, 980 440 S 1240 380, 1340 420', 'M-40 480 C 160 420, 300 560, 480 480 S 800 400, 980 500 S 1240 440, 1340 480'],
    progression: ['M700 120 L 980 360 L 700 600', 'M860 120 L 1140 360 L 860 600', 'M1020 120 L 1300 360 L 1020 600'],
    adapt: ['M1340 720 A 520 520 0 0 0 820 200', 'M1340 640 A 440 440 0 0 0 900 200', 'M1340 560 A 360 360 0 0 0 980 200'],
    pivot: ['M-40 120 L 1340 640', 'M-40 640 L 1340 120', 'M420 -40 L 860 760'],
    resilience: ['M-40 520 C 300 520, 420 260, 700 260 S 1100 520, 1340 420', 'M-40 560 C 320 560, 440 300, 720 300 S 1120 560, 1340 460', 'M-40 600 C 340 600, 460 340, 740 340 S 1140 600, 1340 500']
  };
  const wm = (L, cls) => {
    const k = (C.motion || {})[L]; const ps = WM[k]; if (!ps) return '';
    return `<svg class="wm wm-${k} ${cls || ''}" viewBox="0 0 1280 720" preserveAspectRatio="xMidYMid slice" aria-hidden="true">${ps.map((d, i) => `<path d="${d}" style="--i:${i}"/>`).join('')}</svg>`;
  };
  const lockup = dark => C.brand ? `<img class="lockup" src="${dark ? C.brand.lockup_white : C.brand.lockup}" alt="${esc(C.brand.alt)}">` : '';
  const deco = pos => `<div class="deco-star" style="${pos}" aria-hidden="true">${STARSVG}</div>`;
  const pdfBtn = (href, label, cls, icon) => `<a class="btn ${cls || ''}" href="${href}" target="_blank" rel="noopener">${icon || ''}${esc(label)}</a>`;
  const extBtn = (href, label, cls) => `<a class="btn ${cls || ''}" href="${esc(href)}" target="_blank" rel="noopener">${esc(label)}${IC.ext}</a>`;
  const nextBtn = (label, id) => `<button class="btn lg" id="${id || 'cta'}">${esc(label)}${IC.arrow}</button>`;
  const bindNext = id => { const b = $('#' + (id || 'cta')); if (b) b.addEventListener('click', () => { if (canNext(S[st.pos]) || st.free) go(st.pos + 1); else updateNav(); }); };
  const fbc = (ok, label, text) => `<div class="fbc ${ok ? 'ok' : 'no'}"><span class="fi" aria-hidden="true">${ok ? IC.check : IC.retry}</span><div class="tx">${label ? `<b>${esc(label)}</b>` : ''}${esc(text)}</div></div>`;
  const firstName = p => p.name.replace(/^Dr\.\s+/, '').split(' ')[0];
  const initials = n => n.split(' ').map(w => w[0]).join('');

  /* ---------------- Renderers ----------------
     Each returns { cls, html, after }. Layout rules: key points on screen, the rest in the voice;
     use the whole 1280 x 720 frame; no two neighbouring screens share a layout. */
  const R = {};
  let ui = { id: null, reach: {} };
  const lastC = s => { const k = s.vo && s.vo[0]; return k && NAR[k] ? NAR[k].cues.length - 1 : 0; };
  const momentOf = L => S.find(x => x.lesson === L && x.type === 'moment');
  const seasonBar = L => `<div class="season b" data-c="0" aria-hidden="true"><span>${esc(U.cover.season)}</span>${LESSONS.map(l => `<i class="${l === L ? 'on' : (lessonDone(l) ? 'done' : '')}"></i>`).join('')}</div>`;
  const brand = () => `<div class="brand b" data-c="0">${lockup(true) || `<img src="assets/mark.svg" alt="">${esc(U.cover.brand)}`}</div>`;
  const finalCls = L => L === 'L6' ? ' final' : '';
  const bignum = L => outnum(L === 'L0' ? '00' : '0' + L.slice(1), 330, 'rgba(201,164,92,.62)', 'bignum');

  /* ----- Getting Started ----- */
  R.cover = s => ({
    cls: 'dark cover' + finalCls(s.lesson), html: `${bg(s.photo)}<div class="shade"></div>${wm(s.lesson)}${bignum(s.lesson)}${brand()}
      <div class="inner"><div${B(0, 'kicker')}>${STAR}${esc(s.kicker)}</div><h1${B(0)}>${esc(s.heading)}</h1>
      <div${B(1, 'meta')}>${IC.clock}<span>${esc(s.meta)}</span></div><div${B(lastC(s), 'cta')}>${nextBtn(s.cta)}</div></div>${seasonBar(s.lesson)}`,
    after: () => bindNext()
  });

  R.fullvideo = s => ({
    cls: 'dark', html: `<div class="fv" id="fv"></div>${s.alt ? `<p class="sr-only">${esc(s.alt)}</p>` : ''}`,
    after: () => {
      const box = $('#fv');
      const v = mountVideo(box, s.video, {
        autoplay: true, delay: 520, label: s.sub || s.label,
        onEnd: () => {
          if (s.auto_advance) { setTimeout(() => { if (S[st.pos] === s) go(st.pos + 1); }, 500); return; }
          if ($('.endcard', box)) return;
          box.insertAdjacentHTML('beforeend', `<div class="endcard on-dark" role="status"><div class="tick" aria-hidden="true">${IC.check}</div><h2>${esc(s.sub || s.label)}</h2>
            ${s.endnote ? `<p class="endnote">${STAR}${esc(s.endnote)}</p>` : ''}<div class="row"><button class="btn ghost" id="again">${IC.retry}${esc(U.fullvideo.again)}</button>${nextBtn(U.fullvideo.continue, 'endNext')}</div></div>`);
          $('#again').addEventListener('click', () => { $('.endcard', box).remove(); v.currentTime = 0; play(v); });
          $('#endNext').addEventListener('click', () => go(st.pos + 1));
          $('#endNext').focus();
        }
      });
      if (!s.bare) {
        box.insertAdjacentHTML('beforeend', `<div class="vlabel" id="vl"><div><b>${esc(s.label)}</b><span>${esc(s.sub || '')}</span></div></div>`);
        setTimeout(() => { const l = $('#vl'); if (l) l.classList.add('fade'); }, 6000);
      }
    }
  });

  R.quote = s => ({
    cls: 'dark quote', html: `${bg(s.photo)}<div class="shade"></div><div class="inner">
      ${eyebrow(F(s, 'eyebrow'), 0)}<div${B(1, 'qmark')} aria-hidden="true">“</div>
      <blockquote${B(1)}>${esc(s.quote)}<span class="qclose" aria-hidden="true">”</span></blockquote><div${B(2, 'who')}>${esc(s.who)}</div><div${B(2, 'role')}>${esc(s.role)}</div>${s.role2 ? `<div${B(2, 'role')}>${esc(s.role2)}</div>` : ''}
      <div${B(3)}>${nextBtn(s.cta)}</div></div>`,
    after: () => bindNext()
  });

  /* The sponsor screen is a template (Melissa, Oct 2): per client a company name and logo, the sponsor's name, title and
     photo, and their video. The narration names no one, so the same clip works for every company. The video must be
     watched through, like Melissa's welcome; until a client's video exists the screen shows where it will play. */
  R.sponsor = s => {
    const o = { org: s.org };
    const face = s.photo ? `<img class="sp-photo" src="${s.photo}" alt="">` : `<div class="sp-photo ini" aria-hidden="true">${esc(initials(s.name))}</div>`;
    return {
      cls: 'steel sponsor2', html: `${deco('left:-130px;top:-150px')}<div class="sp-left">${s.logo ? `<img class="sp-logo b" data-c="0" src="${s.logo}" alt="${esc(s.org)}">` : ''}${eyebrow(T(F(s, 'eyebrow'), o), 0)}
        <div class="sp-person b" data-c="0">${face}<div><h1>${esc(s.name)}</h1><p>${esc(s.title || '')}</p><span>${esc(s.org)}</span></div></div>
        <p class="line b" data-c="0">${esc(T(F(s, 'line'), o))}</p></div>
      <div class="sp-video b z" data-c="0" id="spv">${s.video ? '' : `<div class="sp-ph"><span class="play" aria-hidden="true">${PLAY_SVG}</span><b>${esc(F(s, 'placeholder'))}</b><span>${esc(F(s, 'placeholder_note'))}</span></div>`}</div>`,
      after: () => { if (s.video) mountVideo($('#spv'), s.video, { label: s.name, bigPlay: U.huddle.play }); }
    };
  };

  function calLinks(cal) {
    const d = new Date(); d.setDate(d.getDate() + ((8 - d.getDay()) % 7 || 7)); d.setHours(8, 0, 0, 0);
    const e = new Date(d.getTime() + 3600000);
    const p2 = x => String(x).padStart(2, '0');
    const loc = x => `${x.getFullYear()}${p2(x.getMonth() + 1)}${p2(x.getDate())}T${p2(x.getHours())}${p2(x.getMinutes())}00`;
    const iso = x => `${x.getFullYear()}-${p2(x.getMonth() + 1)}-${p2(x.getDate())}T${p2(x.getHours())}:${p2(x.getMinutes())}:00`;
    const g = 'https://calendar.google.com/calendar/render?' + new URLSearchParams({ action: 'TEMPLATE', text: cal.title, dates: loc(d) + '/' + loc(e), details: cal.body, recur: 'RRULE:FREQ=WEEKLY;COUNT=13' }).toString();
    const o = 'https://outlook.office.com/calendar/deeplink/compose?' + new URLSearchParams({ path: '/calendar/action/compose', rru: 'addevent', subject: cal.title, startdt: iso(d), enddt: iso(e), body: cal.body + ' ' + cal.outlook_note }).toString();
    return { g, o, d, e, title: cal.title, body: cal.body };
  }
  R.setup = s => {
    const c = calLinks(F(s, 'cal'));
    // card icons in order: the assessment, the Playbook, the Starting Line agenda, the weekly hour
    const icons = [IC.clip, IC.book, IC.people, IC.cal];
    let pdfs = 0;
    const acts = cd => {
      if (cd.action === 'next') return `<div class="nexttag">${esc(F(s, 'next_tag'))}${IC.arrow}</div>`;
      if (cd.action === 'calendar') return `<div class="acts"><a class="btn xs" href="${esc(c.g)}" target="_blank" rel="noopener" id="calG">${esc(F(s, 'google'))}</a><a class="btn xs ghost" href="${esc(c.o)}" target="_blank" rel="noopener" id="calO">${esc(F(s, 'outlook'))}</a><button class="btn xs ghost" id="ics">${esc(F(s, 'ics'))}</button></div>`;
      return `<div class="acts">${pdfBtn(cd.pdf, cd.label, 'sm' + (pdfs++ ? ' ghost' : ''), IC.download)}</div>`;
    };
    return {
      html: `<div class="hd">${eyebrow(s.eyebrow, 0)}<h1 class="title b" data-c="0">${esc(s.heading)}</h1></div>
        <div class="hdphoto b r" data-c="0" aria-hidden="true">${bg(s.photo)}</div>
        <div class="setupgrid">${s.cards.map((cd, i) => `<div${B(cd.c, 'scard')}><div class="side"><span class="ico">${icons[i] || IC.doc}<span class="num">${cd.n || i + 1}</span></span></div><div class="main"><h3>${esc(cd.title)}</h3><p>${esc(cd.text)}</p></div>${acts(cd)}</div>`).join('')}</div>`,
      after: () => {
        $('#ics').addEventListener('click', () => downloadIcs(F(s, 'cal')));
        $('#calG').addEventListener('click', () => logInteraction('calendar_hold', 'other', 'google', 'neutral'));
        $('#calO').addEventListener('click', () => logInteraction('calendar_hold', 'other', 'outlook', 'neutral'));
      }
    };
  };

  /* Intro screens before an embedded form (pre, pulse, laststep, r180) end on the same card: the form opens
     on the next screen. Once the code is in, the card gives way to the code screen's own "Accepted" line. */
  const codeScreen = (form, n) => S.find(x => x.type === 'formcode' && x.form === form && (n == null || x.n === n));
  const nextCard = (s, c, done) => done
    ? `<div class="b" data-c="${c}" style="margin-top:30px">${okAlert(done)}</div>`
    : `<div${B(c, 'nextcard')}><span class="ico" aria-hidden="true">${IC.clip}</span><div><span class="tag">${esc(U.setup.next_tag)}</span><p>${esc(s.next_line)}</p></div><span class="go" aria-hidden="true">${IC.arrow}</span></div>`;
  R.pre = s => {
    const cs = codeScreen('pre');
    return {
      html: `<div class="split"><div class="photo">${bg(s.photo)}<div class="ov"></div><div class="cap"><div class="statcap b" data-c="0"><b>${esc(F(s, 'stat'))}</b><span>${esc(s.stat_text)}</span></div></div></div>
      <div class="content">${eyebrow(s.eyebrow, 0)}<h1 class="title b" data-c="0">${esc(s.heading)}</h1>
      ${nextCard(s, 1, st.gates.pre && cs ? cs.ok : '')}${s.must ? `<p class="mustline b" data-c="1">${IC.lock}<span>${esc(s.must)}</span></p>` : ''}
      <div class="guide b" data-c="2"><span class="gs">${STAR}</span><div><span class="tag">${esc(s.note_tag)}</span><div>${esc(s.note)}</div></div></div></div></div>`
    };
  };

  R.faq = s => ({
    cls: 'night', html: `${deco('right:-120px;top:-150px')}<div class="hd">${eyebrow(F(s, 'eyebrow'), 0)}<h1 class="title b" data-c="0">${esc(F(s, 'heading'))}</h1></div>
      <div class="faqgrid">${s.cards.map(c => `<div${B(c.c, 'faq')}><h2 class="qfull">“${esc(c.q)}”</h2><ul>${c.pts.map(p => `<li>${STAR}${esc(p)}</li>`).join('')}</ul></div>`).join('')}</div>`
  });

  R.book = s => {
    const b = F(s, 'book'), sc = F(s, 'scorecard');
    return {
      cls: 'mist', html: `<div class="hd">${eyebrow(F(s, 'eyebrow'), 0)}<h1 class="title b" data-c="0">${esc(F(s, 'heading'))}</h1></div>
      <div class="bookgrid">
        <div${B(0, 'bookpanel navy')}><div class="art">${b.img ? `<img class="bookimg" src="${b.img}" alt="${esc(b.alt || b.title)}">` : `<div class="book3d" aria-hidden="true"><img src="assets/mark.svg" alt=""><b>${esc(b.cover[0])}</b><span>${esc(b.cover[1])}</span><i>${esc(b.cover[2])}</i></div>`}</div>
          <div class="txt"><span class="tag">${esc(b.tag)}</span><h2>${esc(b.title)}</h2><p class="b" data-c="1">${esc(b.line)}</p>
          <div class="btns b" data-c="1"><a class="btn sm" href="${C.book_url}" target="_blank" rel="noopener">${esc(b.button)}${IC.ext}</a></div></div></div>
        <div${B(2, 'bookpanel white')}><div class="art"><div class="scstack"><img src="${sc.img}" alt="${esc(sc.alt)}"><img src="${sc.example_img}" alt="${esc(sc.example_alt)}"><span class="exlabel">${esc(sc.example_label)}</span></div></div>
          <div class="txt"><span class="tag">${esc(sc.tag)}</span><h2>${esc(sc.title)}</h2><p>${esc(sc.line)}</p>
          <div class="btns b" data-c="3">${pdfBtn(sc.pdf, sc.download, 'sm', IC.download)}${pdfBtn(sc.example_pdf, sc.example, 'sm ghost', IC.doc)}</div></div></div>
      </div>`
    };
  };

  R.how = s => ({
    html: `<div class="hd">${eyebrow(F(s, 'eyebrow'), 0)}<h1 class="title b" data-c="0">${esc(F(s, 'heading'))}</h1></div>
      <div class="path">${s.phases.map((p, i) => `<div${B(p.c, 'phase')}><div class="node"><span>${i + 1}</span></div><h3>${esc(p.name)}</h3>${p.steps.map(x => `<div class="stp"><b>${esc(x[0])}</b><span>${esc(x[1])}</span></div>`).join('')}</div>`).join('')}</div>`
  });

  R.ready = s => {
    const open = st.gates.pre || st.free;
    return {
      cls: 'dark cover', html: `${bg(s.photo)}<div class="shade"></div>${wm(s.lesson)}${brand()}<div class="inner">
        <div${B(0, 'kicker')}>${open ? IC.check : STAR}${esc(open ? s.kicker_open : F(s, 'kicker_locked'))}</div><h1${B(0)}>${esc(F(s, 'heading'))}</h1>
        <div${B(1, 'meta')}><span>${esc(open ? s.line_open : F(s, 'line_locked'))}</span></div>
        <div${B(1, 'cta')}>${open ? nextBtn(F(s, 'cta')) : `<button class="btn ghost lg" id="backPre">${IC.arrowL}${esc(F(s, 'back'))}</button>`}</div></div>${seasonBar('L1')}`,
      after: () => { bindNext(); const b = $('#backPre'); if (b) b.addEventListener('click', () => go(S.findIndex(x => x.type === 'formembed' && x.form === 'pre'))); }
    };
  };

  /* ----- Lesson opening ----- */
  R.moment = s => {
    // one sentence at a time; a full stop inside an abbreviation (p.m., M.V.P., Dr.) doesn't end a sentence
    const sents = s.scene.split(/(?<=[.!?]['’"]?)\s+(?=[A-Z"“‘'])/).reduce((a, x) => {
      if (a.length && /(?:\b(?:[A-Za-z]\.){2,}|\b(?:Dr|Mr|Ms|Mrs)\.)$/.test(a[a.length - 1])) a[a.length - 1] += ' ' + x; else a.push(x);
      return a;
    }, []);
    return {
      cls: 'dark moment' + finalCls(s.lesson), html: `${bg(s.photo, true)}<div class="shade"></div>${wm(s.lesson, 'soft')}<div class="top">${eyebrow(U.moment.eyebrow, 0)}</div>
      <div class="scene ${s.scene.length > 190 ? 'long' : ''}">${sents.map((x, i) => `<span class="b" data-c="0" data-d="${i * 520}">${esc(x.trim())}</span>`).join('')}</div>`
    };
  };

  function steps3(idx) {
    return `<div class="steps3" aria-label="Check-in, step ${idx + 1} of 3">${U.checkin.steps.map((t, i) => `<span class="${i === idx ? 'on' : (i < idx ? 'done' : '')}"><i>${i < idx ? '✓' : i + 1}</i>${esc(t)}</span>`).join('')}</div>`;
  }
  R.checkin = s => {
    const K = U.checkin, stg = st.ci[s.id] || 'a', L = s.lesson, ans = st.checkin[L] || {}, m = momentOf(L);
    if (stg === 'a') {
      return {
        html: `${steps3(0)}<div class="hd">${eyebrow(K.eyebrow, 0)}<h1 class="title b" data-c="0" style="font-size:38px">${esc(K.a_heading)}</h1></div>
        ${m ? `<div class="ci-moment b" data-c="0"><span class="th" style="background-image:url('${photo(m.photo)}')" aria-hidden="true"></span><p>${esc(m.scene)}</p></div>` : ''}
        <div class="ci-grid">${C.checkin.map(c => `<div${B(1, 'ci')}><label for="ci_${c.k}">${esc(c.label)}</label><div class="q">${esc(c.q)}</div>
          <textarea id="ci_${c.k}" data-k="${c.k}">${esc(ans[c.k] || '')}</textarea><div class="ci-foot"><span id="sv_${c.k}">${ans[c.k] ? `<span class="saved">${IC.check}${esc(K.saved)}</span>` : ''}</span><button class="btn xs ghost" data-save="${c.k}">${esc(K.save)}</button></div></div>`).join('')}</div>`,
        after: () => {
          const store = (k, v, show) => { st.checkin[L] = st.checkin[L] || {}; st.checkin[L][k] = v; save(); if (show) $('#sv_' + k).innerHTML = `<span class="saved">${IC.check}${esc(K.saved)}</span>`; };
          $$('[data-save]').forEach(b => b.addEventListener('click', () => { const k = b.dataset.save; store(k, $('#ci_' + k).value.trim(), true); }));
          $$('.ci textarea').forEach(t => { t.addEventListener('change', () => store(t.dataset.k, t.value.trim(), false)); t.addEventListener('input', () => { $('#sv_' + t.dataset.k).innerHTML = ''; }); });
        }
      };
    }
    if (stg === 'b') {
      const wrote = C.checkin.filter(c => ans[c.k]).map(c => `<p><b>${esc(c.label)}</b>${esc(ans[c.k])}</p>`).join('');
      return {
        html: `<div class="split w420"><div class="photo">${bg(m ? m.photo : 'woman_profile', true)}<div class="ov"></div><div class="cap">${eyebrow(K.eyebrow, 0)}<p class="capline b" data-c="0">${esc(K.b_caption)}</p></div></div>
        <div class="content" style="padding-top:110px">${eyebrow(K.eyebrow, 0)}<h1 class="title b" data-c="0">${esc(K.b_heading)}</h1>
        <div class="pgrid b" data-c="0" role="radiogroup" aria-label="${esc(K.b_heading)}">${C.patterns.map(x => { const [p, m] = Array.isArray(x) ? x : [x, '']; return `<button class="ptile${m ? ' meant' : ''}" role="radio" aria-checked="${st.patterns[L] === p}" data-p="${p}"><b>${esc(p)}</b>${m ? `<small>${esc(m)}</small>` : ''}</button>`; }).join('')}</div>
        ${wrote ? `<div class="wrote b" data-c="1"><span class="tag">${esc(K.wrote)}</span>${wrote}</div>` : ''}</div></div>${steps3(1)}`,
        after: () => $$('[data-p]').forEach(b => b.addEventListener('click', () => { st.patterns[L] = b.dataset.p; save(); logInteraction('pattern_' + L, 'choice', b.dataset.p, 'neutral'); $$('[data-p]').forEach(x => x.setAttribute('aria-checked', x === b)); }))
      };
    }
    const words = st.fivewords, anchor = s.anchor;
    return {
      cls: 'steel', html: `${deco('right:-110px;bottom:-140px')}${signal('ci')}${steps3(2)}<div class="hd">${eyebrow(K.c_eyebrow, 0)}<h1 class="title b" data-c="0" style="font-size:46px">${esc(K.c_heading)}</h1>
      <div class="b" data-c="2" style="margin-top:16px"><span class="pill glass">${IC.clock}${esc(K.c_time)}</span></div></div>
      <div class="reset">${K.c_steps.map((t, i) => `<div${B(1, 'rs')}>${outnum('0' + (i + 1), 72)}${K.c_tags ? `<span class="rtag">${esc(K.c_tags[i])}</span>` : ''}<p>${esc(t)}</p>${i === 0 && words ? `<q class="rsmine">${esc(words)}</q>` : ''}${i === 3 && anchor ? `<q class="rsmine">${esc(anchor)}</q>` : ''}</div>`).join('')}</div>`
    };
  };

  /* The neuroscience line (Oct 3): a signal that runs tight and fast, then settles, to show the reset at work without a brain on screen. */
  const signal = cls => `<svg class="signal ${cls || ''}" viewBox="0 0 1280 120" preserveAspectRatio="none" aria-hidden="true"><path d="M0 60 L60 60 L80 20 L100 100 L120 25 L140 95 L160 30 L180 90 L200 40 L220 80 L240 48 L260 70 L290 55 L340 62 L420 58 L520 61 L640 60 L1280 60"/></svg>`;

  /* The Foundation Reset (Lesson 1, Oct 3): the book's drill, Melissa's own example, then the learner's five words,
     which the check-in shows back to them in every lesson. */
  R.reset = s => {
    const RS = U.reset, saved = st.fivewords || '';
    const count = t => t.trim() ? t.trim().split(/\s+/).length : 0;
    return {
      cls: 'steel resetscr', html: `${signal('rs-sig')}<div class="rs-left">${eyebrow(RS.eyebrow, 0)}<h1 class="title b" data-c="0">${esc(s.heading)}</h1>
        <div class="rs-science b" data-c="1"><span class="tag">${esc(RS.science_tag)}</span><p>${esc(s.science)}</p></div>
        <div class="rs-example b" data-c="2"><span class="tag">${esc(RS.example_label)}</span>${s.example.map(e => `<div class="rs-ex"><i>${esc(e[0])}</i><b>${esc(e[1])}</b></div>`).join('')}<p class="rs-note">${esc(s.example_note)}</p></div></div>
      <div class="rs-right b r" data-c="3"><label class="tag" for="fw">${esc(RS.yours)}</label>
        <input id="fw" class="fwin" maxlength="80" autocomplete="off" placeholder="${esc(RS.placeholder)}" value="${esc(saved)}">
        <div class="fwcount" id="fwc">${esc(T(RS.count, { n: count(saved) }))}</div>
        <span class="tag" style="margin-top:18px">${esc(RS.pick)}</span><div class="fwsug">${s.suggestions.map(x => `<button class="chip" data-w="${esc(x)}">${esc(x)}</button>`).join('')}</div>
        <div class="row" style="margin-top:20px"><button class="btn" id="fwSave">${esc(RS.save)}</button></div><div id="fwOk" aria-live="polite">${saved ? okAlert(RS.saved) : ''}</div></div>`,
      after: () => {
        const inp = $('#fw'), upd = () => { $('#fwc').textContent = T(RS.count, { n: count(inp.value) }); $('#fwOk').innerHTML = ''; };
        inp.addEventListener('input', upd);
        $$('[data-w]').forEach(b => b.addEventListener('click', () => { inp.value = b.dataset.w; upd(); inp.focus(); }));
        $('#fwSave').addEventListener('click', () => { const v = inp.value.trim(); if (!v) { inp.focus(); return; } st.fivewords = v; save(); logInteraction('five_words', 'fill-in', '[text kept in suspend data]', 'neutral'); $('#fwOk').innerHTML = okAlert(RS.saved); });
      }
    };
  };

  R.recall = s => {
    const pick = st.recall[s.id], done = pick != null, ok = pick === s.correct;
    return {
      cls: 'mist recallscr', html: `${wm(s.lesson, 'light')}${deco('right:-100px;bottom:-120px;color:var(--navy)')}<div class="center">${eyebrow(U.recall.eyebrow, 0)}<span class="pill mist b" data-c="0" style="margin:-2px 0 22px">${esc(T(U.recall.from, { n: lessonNo(s.lesson) - 1 }))}</span>
      <h1 class="bigq b" data-c="0">${esc(s.q)}</h1>
      <div class="opts2 b" data-c="0">${s.opts.map((o, i) => { const cls = done ? (i === s.correct ? 'right' : (i === pick ? 'wrong' : '')) : ''; return `<button class="opt2 ${cls}" aria-pressed="${pick === i}" data-i="${i}" ${done ? 'disabled' : ''}>${cls ? `<span class="mk" aria-hidden="true">${cls === 'right' ? IC.check : IC.x}</span>` : ''}${esc(o)}</button>`; }).join('')}</div>
      <div id="rfb" aria-live="polite">${done ? fbc(ok, null, ok ? s.ok : s.no) : ''}</div></div>`,
      after: () => $$('[data-i]').forEach(b => b.addEventListener('click', () => { const i = +b.dataset.i; st.recall[s.id] = i; save(); logInteraction('recall_' + s.lesson, 'choice', s.opts[i], i === s.correct ? 'correct' : 'incorrect'); render(false); }))
    };
  };

  R.objectives = s => ({
    html: `<div class="split"><div class="photo">${bg(s.photo)}<div class="ov"></div><div class="cap">${eyebrow(U.objectives.caption_eyebrow, 0)}<p class="capline b" data-c="0">${esc(s.practise)}</p></div></div>
      <div class="content">${eyebrow(U.objectives.eyebrow, 0)}<div class="objs">${s.objs.map((o, i) => `<div${B(o[2], 'obj')}>${outnum('0' + (i + 1), 62)}<div><h3>${esc(o[0])}</h3><p>${esc(o[1])}</p>${i === s.objs.length - 1 ? `<span class="pill navy"><i></i>${esc(U.objectives.pulse_tag)}</span>` : ''}</div></div>`).join('')}</div></div></div>`
  });

  R.download = s => ({
    cls: 'steel dl', html: `${deco('right:-120px;top:-150px')}<div class="glow"></div><img class="coverimg b" data-c="0" src="${F(s, 'cover') || U.playbook.cover}" alt="${esc(T(U.download.cover_alt, { track: C.track }))}">
      <div class="inner">${eyebrow(s.eyebrow, 0)}<h1 class="title b" data-c="0">${esc(s.heading)}</h1><p class="lead b" data-c="1">${esc(s.line)}</p>
      <div class="lessons b" data-c="1" aria-hidden="true">${[1, 2, 3, 4, 5, 6].map(n => `<span>${n}</span>`).join('')}</div>
      <div class="actions b" data-c="0">${pdfBtn(s.pdf, s.cta, 'lg', IC.download)}</div></div>`
  });

  /* ----- Core learning ----- */
  R.tabs = s => {
    const TB = U.tabs;
    const items = s.kind === 'araw' ? C.araw.map(a => ({ k: a.k, name: a.name, sub: a.desc, icon: a.icon, parts: a.parts })) : s.items.map(it => Object.assign({}, it, { icon: ICON[it.icon] || it.icon }));
    const letter = x => x.icon && x.icon.length === 1;
    const icn = (x, cls) => letter(x) ? `<span class="lbadge ${cls || ''}" aria-hidden="true">${esc(x.icon)}</span>` : `<img${cls ? ` class="${cls}"` : ''} src="${x.icon}" alt="">`;
    const seen = st.tabs[s.id] || {}; const nSeen = items.filter(it => seen[it.k]).length;
    const sel = items.find(it => it.k === ui.sel);
    const head = x => `${icn(x, 'bgicon')}<div class="phead">${icn(x)}<div><h3>${esc(x.name)}</h3><div class="desc">${esc(x.sub)}</div></div></div>`;
    const panel = !sel
      ? `<div class="tabpanel empty b r" data-c="1">${s.kind === 'araw' ? `<img class="hex" src="assets/photos/hexagon.jpg" alt="The A.R.A.W. hexagon: Agility, Resilience, Alignment and Wellbeing around your M.V.P.">` : `<div class="bigprompt">${esc(s.eyebrow)}</div>`}<p>${IC.arrowL}${esc(TB.prompt)}</p></div>`
      : s.kind === 'araw'
        ? `<div class="tabpanel">${head(sel)}<div class="rule"></div><span class="tag">${esc(TB.parts)}</span><ul>${sel.parts.map(p => `<li>${STAR}${esc(p)}</li>`).join('')}</ul></div>`
        : `<div class="tabpanel">${head(sel)}<div class="big">${esc(sel.big)}</div><div class="line">${esc(sel.line)}</div>${sel.test ? `<div class="testbox"><span class="tag">${esc(TB.test)}</span><div>${esc(sel.test)}</div></div>` : ''}</div>`;
    return {
      html: `<div class="hd">${eyebrow(s.eyebrow, 0)}<h1 class="title b" data-c="0" style="font-size:38px">${esc(s.heading)}</h1></div>
      <div class="tabcol b l" data-c="1" role="tablist" aria-label="${esc(s.heading)}">${items.map(it => `<button class="tab" role="tab" aria-selected="${ui.sel === it.k}" data-k="${it.k}">${icn(it)}<span><b>${esc(it.name)}</b><small>${esc(it.sub)}</small></span><span class="seen" aria-label="${seen[it.k] ? 'opened' : ''}">${seen[it.k] ? IC.check : ''}</span></button>`).join('')}
        <div class="tabdots">${items.map(it => `<i class="${seen[it.k] ? 'on' : ''}"></i>`).join('')}<span>${esc(T(TB.opened, { n: nSeen, total: items.length }))}</span></div></div>
      <div role="tabpanel" aria-live="polite">${panel}</div>`,
      after: () => $$('[data-k]').forEach(b => b.addEventListener('click', () => {
        const k = b.dataset.k; ui.sel = k; st.tabs[s.id] = Object.assign({}, st.tabs[s.id], { [k]: true }); save();
        logInteraction('tabs_' + s.id + '_' + k, 'other', 'opened', 'neutral'); render(false); playVo(s.itemvo[k]);
        const t = $(`[data-k="${k}"]`); if (t) t.focus();
      }))
    };
  };

  R.engine = s => {
    const e = s.engine, l = s.loop;
    const nodes = [[250, 62], [420, 215], [250, 368], [80, 215]];
    const svg = `<svg class="loopsvg" viewBox="0 0 500 430" role="img" aria-label="${esc(l.tag)}: ${esc(l.nodes.join(', '))}">
      <defs><marker id="ah" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="7" markerHeight="7" orient="auto"><path d="M0 0L10 5L0 10z" fill="#C9A45C"/></marker></defs>
      <circle cx="250" cy="215" r="153" fill="none" stroke="rgba(201,164,92,.35)" stroke-width="2" stroke-dasharray="6 8"/>
      ${[[312, 76, 405, 150], [405, 280, 312, 354], [188, 354, 95, 280], [95, 150, 188, 76]].map(a => `<path d="M${a[0]} ${a[1]} Q ${(a[0] + a[2]) / 2 + (a[0] < 250 ? -30 : 30)} ${(a[1] + a[3]) / 2 + (a[1] < 215 ? -30 : 30)} ${a[2]} ${a[3]}" fill="none" stroke="#C9A45C" stroke-width="3" marker-end="url(#ah)"/>`).join('')}
      ${nodes.map((n, i) => `<g><circle cx="${n[0]}" cy="${n[1]}" r="54" fill="#14273F" stroke="#C9A45C" stroke-width="2.5"/><text x="${n[0]}" y="${n[1] + 6}" text-anchor="middle" fill="#fff" font-size="15" font-weight="800" letter-spacing="1.5">${esc(l.nodes[i].toUpperCase())}</text></g>`).join('')}
      <text x="250" y="210" text-anchor="middle" fill="#C9A45C" font-size="54" font-weight="800">${esc(l.center[0])}</text><text x="250" y="240" text-anchor="middle" fill="#DCE4EC" font-size="14" font-weight="700" letter-spacing="2.5">${esc(l.center[1].toUpperCase())}</text></svg>`;
    return {
      cls: 'steel', html: `<div class="hd">${eyebrow(s.eyebrow, 0)}<h1 class="title b" data-c="0">${esc(s.heading)}</h1></div>
      <div class="engine"><div class="zone"><span class="tag b" data-c="0">${esc(e.tag)}</span><h2 class="b" data-c="0">${esc(e.title)}</h2>
        <div class="letters">${e.letters.map(x => `<div${B(0)}><b>${esc(x[0])}</b><span>${esc(x[1])}</span></div>`).join('')}</div>
        <div class="stat b" data-c="1"><b>${esc(e.stat[0])}</b><span>${esc(e.stat[1])}</span></div>
        <div class="cap b" data-c="3">${STAR}${esc(e.caption)}</div></div>
      <div class="div b" data-c="2"></div>
      <div class="zone"><span class="tag b" data-c="2">${esc(l.tag)}</span><div class="b z" data-c="2">${svg}</div><div class="cap b" data-c="3">${STAR}${esc(l.caption)}</div></div></div>`
    };
  };

  R.call = s => {
    const pick = st.calls[s.id];
    const o = pick == null ? null : s.opts[pick];
    return {
      html: `<div class="split w500"><div class="photo">${bg(s.photo, true)}<div class="ov"></div><div class="cap">${eyebrow(U.call.eyebrow, 0)}<p class="capline b" data-c="0">${esc(s.prompt)}</p></div></div>
      <div class="content"><h2 class="callq b" data-c="1">${esc(U.call.your_move)}</h2><div class="callopts">${s.opts.map((x, i) => `<button${B(1, 'callopt')} aria-pressed="${pick === i}" data-i="${i}"><span class="l" aria-hidden="true"></span><span>${esc(x.t)}</span></button>`).join('')}</div>
      <div aria-live="polite">${o ? `<div class="conseq"><span class="ico" aria-hidden="true">${IC.arrow}</span><div>${esc(o.fb)}${s.opts.length > 1 ? `<button class="textlink" id="other">${esc(U.call.other)}</button>` : ''}</div></div>` : ''}</div></div></div>`,
      after: () => {
        const choose = i => { st.calls[s.id] = i; save(); logInteraction('call_' + s.lesson, 'choice', s.opts[i].t, 'neutral'); render(false); playVo(s.opts[i].vo); };
        $$('[data-i]').forEach(b => b.addEventListener('click', () => choose(+b.dataset.i)));
        const ot = $('#other'); if (ot) ot.addEventListener('click', () => choose(pick === 0 ? 1 : 0));
      }
    };
  };

  R.sort = s => {
    const ans = st.sorts[s.id] || {}; const done = Object.keys(ans).length, total = s.items.length;
    const rc = s.binnotes ? lastC(s) : 0;
    return {
      html: `<div class="split w420"><div class="photo">${bg(s.photo)}<div class="ov" style="background:linear-gradient(180deg,rgba(12,26,44,.15) 0%,rgba(12,26,44,.94) 58%)"></div><div class="cap">${eyebrow(U.sort.eyebrow, 0)}
        <p class="capline b" data-c="0">${esc(s.heading)}</p><p class="b" data-c="${lastC(s)}" style="margin:10px 0 0;font-size:17px;color:#DCE4EC;line-height:1.45">${esc(s.sub)}</p>
        ${s.binnotes ? s.binnotes.map((n, i) => `<div class="binnote b" data-c="1"><b>${esc(s.bins[i])}</b>${esc(n)}</div>`).join('') : ''}</div></div>
      <div class="content"><div class="sortlist">${s.items.map((it, i) => {
        const a = ans[i];
        return `<div${B(rc, 'sortrow')}><p>${esc(it[0])}</p><div class="bins">${s.bins.map((bn, j) => `<button data-i="${i}" data-j="${j}" ${a != null ? 'disabled' : ''} class="${a != null && j === it[1] ? 'right' : ''} ${a === j && j !== it[1] ? 'wrong' : ''}">${esc(bn)}</button>`).join('')}</div>${a != null ? `<div class="fbline ${a === it[1] ? '' : 'no'}">${a === it[1] ? IC.check : IC.x}${esc(it[2])}</div>` : ''}</div>`;
      }).join('')}</div><div class="sortprog b" data-c="${rc}"><div class="bar"><i style="width:${done / total * 100}%"></i></div><span>${esc(T(U.sort.done, { n: done, total }))}</span></div></div></div>`,
      after: () => $$('[data-j]').forEach(b => b.addEventListener('click', () => { const i = +b.dataset.i, j = +b.dataset.j; st.sorts[s.id] = Object.assign({}, st.sorts[s.id], { [i]: j }); save(); logInteraction('sort_' + s.id + '_' + i, 'choice', s.bins[j], j === s.items[i][1] ? 'correct' : 'incorrect'); render(false); }))
    };
  };

  R.example = s => {
    const k = s.vo[0];
    return {
      html: `<div class="band on-dark">${bg(s.photo)}<div class="shade"></div><div class="cap">${eyebrow(s.eyebrow, 0)}<h1 class="title b" data-c="0" style="font-size:44px">${esc(s.heading)}</h1></div></div>
      <div class="story">${s.blocks.map((b, i) => { const last = i === s.blocks.length - 1; return `<div${B(autoC(i, s.blocks.length, k), 'st' + (last ? ' last' : ''))}><div class="dotn">${i + 1}</div><div class="card"><b>${esc(b[0])}</b><p>${esc(b[1])}</p></div></div>`; }).join('')}</div>`
    };
  };

  R.season = s => ({
    cls: 'steel', html: `${s.motion ? wm(s.lesson) : ''}${deco('right:-110px;bottom:-140px')}<div class="hd">${eyebrow(s.eyebrow, 0)}<h1 class="title b" data-c="0">${esc(s.heading)}</h1></div>
      <div class="season3"><div class="b" data-c="0"><div class="ninety">${esc(s.big[0])}</div><p>${esc(s.big[1])}</p></div>
      <div>${s.steps.map((x, i) => `<div${B(1, 'srow')}><span class="num">${i + 1}</span><div><b>${esc(x[0])}</b><span>${esc(x[1])}</span></div></div>`).join('')}</div>
      <div><div class="parts">${s.parts.map(x => `<div${B(2, 'part')}><b>${esc(x[0])}</b><span>${esc(x[1])}</span><em>${esc(x[2])}</em></div>`).join('')}</div>
        <div class="b" data-c="2" style="margin-top:18px">${pdfBtn(s.pdf, s.button, 'sm', IC.doc)}</div></div></div>`
  });

  R.filter = s => ({
    html: `<div class="hd">${eyebrow(s.eyebrow, 0)}<h1 class="title b" data-c="0">${esc(s.heading)}</h1></div>
      <div class="gates">${s.steps.map((x, i) => `<div${B(i + 1, 'gate l')}><div class="n">${i + 1}</div><div><h3>${esc(x[0])}</h3><p>${esc(x[1])}</p></div></div>`).join('')}</div>`
  });

  R.compare = s => ({
    cls: S.filter(x => x.type === 'compare').indexOf(s) % 2 ? 'paper cmp-ba' : 'paper',
    html: `<div class="cmphead"><div>${eyebrow(s.eyebrow, 0)}<h1 class="title b" data-c="0" style="font-size:38px;max-width:660px">${esc(s.heading)}</h1></div>
      ${s.photo ? `<div class="ph b r" data-c="0" aria-hidden="true">${bg(s.photo)}</div>` : ''}</div>
      <div class="cols2">${s.cols.length === 2 ? '<span class="cmparrow b z" data-c="' + s.cols[1].c + '" aria-hidden="true">' + IC.arrow + '</span>' : ''}${s.cols.map((c, i) => `<div${B(c.c, 'colcard')} style="background:${i ? 'linear-gradient(160deg,#5E2140,#3B1227)' : 'linear-gradient(160deg,#1B355A,#12243C)'}"><span class="tag">0${i + 1}</span><h3>${esc(c.name)}</h3><div class="s">${esc(c.sub)}</div><ul>${c.pts.map(p => `<li>${STAR}${esc(p)}</li>`).join('')}</ul><div class="note">${esc(c.note)}</div></div>`).join('')}</div>`
  });

  R.smart = s => {
    const cs = [1, 1, 2, 2, 3];
    return {
      html: `<div class="hd">${eyebrow(s.eyebrow, 0)}<h1 class="title b" data-c="0">${esc(s.heading)}</h1></div>
      <div class="goalbar b" data-c="0"><b>${esc(s.goal_label)}</b><span>${esc(s.goal)}</span></div>
      <div class="smart">${s.letters.map((l, i) => `<div${B(cs[i] || 3, 'lt')}><div class="L">${esc(l[0])}</div><b>${esc(l[1])}</b><p>${esc(l[2])}</p></div>`).join('')}</div>`
    };
  };

  R.fourq = s => {
    const cs = [1, 1, 2, 3], sty = ['background:var(--navy);color:#fff', 'background:#fff;color:var(--navy);border:1px solid var(--line)', 'background:var(--plum);color:#fff', 'background:linear-gradient(135deg,#173556,#3E6B93);color:#fff'];
    return {
      cls: 'mist', html: `<div class="quadwrap"><div>${eyebrow(s.eyebrow, 0)}<h1 class="title b" data-c="0" style="font-size:44px">${esc(s.heading)}</h1><p class="lead b" data-c="0" style="font-size:19px">${esc(s.lead)}</p></div>
      <div class="quad">${s.qs.map((q, i) => `<div${B(cs[i], 'qc z')} style="${sty[i]}"><b style="color:${i === 1 ? 'var(--gold-t)' : i === 3 ? 'var(--gold-l)' : 'var(--gold)'}">${esc(q[0])}</b><span>${esc(q[1])}</span>${outnum(String(i + 1), 112, i === 1 ? 'rgba(122,91,30,.4)' : 'rgba(201,164,92,.45)', 'qn')}</div>`).join('')}</div></div>`
    };
  };

  /* ----- Practice ----- */
  R.drill = s => {
    const d = D[s.drill], rec = st.drills[s.id] || {};
    const hl = d.holds.map(h => `<span data-h="${h.key}" class="${rec[h.key] ? 'done' : ''}">${esc(h.label)}</span>`).join('');
    return {
      cls: 'steel drill', html: `<div class="top"><div>${eyebrow(U.drill.eyebrow + ' · ' + d.tag, 0)}<h1 class="b" data-c="0">${esc(d.title)}</h1></div><div class="beats b" data-c="1" aria-label="Drill steps">${hl}</div></div>
      <div class="vwrap b z" data-c="0"><div class="vbox" id="vb"></div></div>`,
      after: () => mountDrill(s, d)
    };
  };
  function mountDrill(s, d) {
    const box = $('#vb');
    const v = mountVideo(box, d.video, { label: U.drill.eyebrow + ': ' + d.title, bigPlay: U.drill.play });
    box.insertAdjacentHTML('beforeend', '<div class="poplayer" style="position:absolute;inset:0;pointer-events:none;z-index:3"></div>');
    const layer = $('.poplayer', box);
    const rec = st.drills[s.id] = st.drills[s.id] || {};
    const fired = new Set(), answered = new Set(); const shown = {};
    const LBL = U.drill.labels;
    function beatHtml(b) {
      if (b.kind === 'options') return `<b>${esc(b.text || LBL.options)}</b><ol>${d.opts.map((o, i) => `<li data-o="${i}">${esc(o)}</li>`).join('')}</ol>`;
      if (b.kind === 'stack') return `<b>${esc(LBL.stack)}</b>${b.lines.map((l, i) => `<div data-l="${i}">${esc(l[1])}</div>`).join('')}`;
      return `<b>${esc(LBL[b.kind] || '')}</b><p>${esc(b.text)}</p>`;
    }
    function tick() {
      const t = v.currentTime;
      d.beats.forEach((b, i) => {
        const on = t >= b.t && t < b.u;
        if (on && !shown[i]) { const el = document.createElement('div'); el.className = 'pop ' + b.kind; el.innerHTML = beatHtml(b); layer.appendChild(el); shown[i] = el; }
        if (!on && shown[i]) { const el = shown[i]; shown[i] = null; el.classList.add('out'); setTimeout(() => el.remove(), 400); }
        if (on && shown[i]) {
          if (b.kind === 'options') $$('li', shown[i]).forEach((li, j) => li.classList.toggle('in', t >= (d.optsAt[j] || b.t)));
          if (b.kind === 'stack') $$('[data-l]', shown[i]).forEach((el, j) => el.classList.toggle('in', t >= b.lines[j][0]));
        }
      });
      d.holds.forEach((h, i) => {
        if (fired.has(i) && t < h.t - 0.4) fired.delete(i);
        if (!fired.has(i) && !answered.has(i) && t >= h.t && t < h.resume && !v.paused) { fired.add(i); hold(h, i); }
      });
    }
    function hold(h, hi) {
      v.pause();
      $$('.beats span').forEach(x => x.classList.toggle('on', x.dataset.h === h.key));
      const ex = h.exclude ? rec[h.exclude] : null;
      const body = h.kind === 'text'
        ? `<label class="sr-only" for="hv">${esc(h.q)}</label><textarea id="hv">${esc(rec[h.key] || '')}</textarea>`
        : `<div class="choices" role="radiogroup" aria-label="${esc(h.q)}">${d.opts.map((o, i) => `<button class="choice" role="radio" data-o="${i}" aria-checked="${rec[h.key] === o}" ${ex === o ? 'disabled' : ''}><span class="lt" aria-hidden="true">${String.fromCharCode(65 + i)}</span><span>${esc(o)}${ex === o ? `<small>${esc(U.drill.first_pick)}</small>` : ''}</span></button>`).join('')}</div>`;
      box.insertAdjacentHTML('beforeend', `<div class="hold-layer" role="dialog" aria-label="${esc(h.label)}"><div class="hold-card"><span class="tag">${STAR}${esc(h.label)}</span><div class="q">${esc(h.q)}</div>${body}
        <div class="acts"><button class="btn sm" id="hc" ${h.kind === 'choice' && !rec[h.key] ? 'disabled' : ''}>${esc(U.drill.continue)}${IC.arrow}</button></div></div></div>`);
      const lay = $('.hold-layer', box);
      // the hold may already be closed (answered or scrubbed past) by the time this runs
      setTimeout(() => { const f = h.kind === 'text' ? $('#hv', lay) : $('.choice:not(:disabled)', lay); if (f && lay.isConnected) f.focus(); }, 50);
      $$('.choice', lay).forEach(b => b.addEventListener('click', () => { rec[h.key] = d.opts[+b.dataset.o]; save(); $$('.choice', lay).forEach(x => x.setAttribute('aria-checked', x === b)); $('#hc').disabled = false; }));
      $('#hc').addEventListener('click', () => {
        if (h.kind === 'text') { rec[h.key] = $('#hv').value.trim(); save(); }
        logInteraction('drill_' + s.lesson + '_' + h.key, h.kind === 'text' ? 'long-fill-in' : 'choice', h.kind === 'text' ? '[text kept in suspend data]' : rec[h.key], 'neutral');
        answered.add(hi); lay.remove(); $$('.beats span').forEach(x => { if (x.dataset.h === h.key) { x.classList.remove('on'); x.classList.add('done'); } });
        v._maxT = Math.max(v._maxT, h.resume + 0.2); v.currentTime = h.resume; play(v);
      });
    }
    let raf = null; const loop = () => { tick(); raf = requestAnimationFrame(loop); };
    v.addEventListener('play', () => { cancelAnimationFrame(raf); loop(); });
    v.addEventListener('pause', () => { cancelAnimationFrame(raf); tick(); });
    v.addEventListener('seeked', tick);
    ui.cleanup = () => cancelAnimationFrame(raf);
  }

  /* The weekly time (Oct 3, Melissa): the lesson stays as it is and the Playbook takes the adjustment. One drill is this
     week's core rep (s.core, its minutes in the big number); the others are extra reps, if there is time. */
  R.playbook = s => {
    const PB = U.playbook, n = s.lesson.slice(1), core = s.core != null ? s.core : null;
    const maxMin = Math.max(...s.drills.map(d => d[3]));
    const big = core != null ? s.drills[core][3] : s.total;
    const row = (d, i) => `<div${B(d[4], 'drillrow' + (core == null ? '' : (i === core ? ' core' : d[0] === 'Assessment' ? ' extra req' : ' extra')))}><span class="chipnotch">${esc(/^\d/.test(d[0]) ? PB.drill + ' ' + d[0] : d[0])}</span><div>${core != null ? `<span class="coretag">${esc(i === core ? PB.core_tag : d[0] === 'Assessment' && PB.req_tag ? PB.req_tag : PB.extra_tag)}</span>` : ''}<h3>${esc(d[1])}</h3><span class="pil">${esc(d[2])}</span></div><div><div class="bar"><i style="--w:${Math.round(d[3] / maxMin * 100)}%"></i></div><div class="mm">${d[3]} ${esc(PB.min)}</div></div></div>`;
    const order = core == null ? s.drills.map((d, i) => i) : [core].concat(s.drills.map((d, i) => i).filter(i => i !== core));
    return {
      html: `<div class="pbwrap"><div class="pbleft">${deco('right:-170px;bottom:-170px')}${eyebrow(PB.left_eyebrow, 0)}<img class="cov b z" data-c="0" src="${F(s, 'cover')}" alt="">
        <div class="mins b" data-c="0"><b>${esc(big)}</b><small>${esc(PB.min)}${core != null ? ' ' + esc(PB.core_caption) : ''}</small></div><p class="where b" data-c="0">${esc(s.scorecard ? PB.where_sc : PB.where)}</p></div>
      <div class="pbright">${eyebrow(PB.eyebrow, 0)}<h1 class="title b" data-c="0" style="font-size:40px;margin-bottom:12px">${esc(T(PB.heading, { n }))}</h1>
        ${order.map(i => row(s.drills[i], i)).join('')}
        ${PB.feedback ? `<p class="fbhabit b" data-c="${lastC(s)}">${IC.people}<span>${esc(PB.feedback)}</span></p>` : ''}
        <div class="row b" data-c="${lastC(s)}" style="margin-top:18px">${pdfBtn(s.pdf, T(PB.open, { n }), '', IC.doc)}${s.scorecard ? pdfBtn(PB.scorecard_pdf, PB.scorecard, 'ghost', IC.doc) : ''}</div></div></div>`
    };
  };

  R.huddle = s => {
    const p = P[s.pro];
    return {
      cls: 'night', html: `${deco('right:-140px;top:-170px')}<div class="hd" style="top:92px">${eyebrow(U.huddle.eyebrow, 0)}</div>
      <div class="huddle"><div class="vbox b z" data-c="0" id="vb"></div>
      <div${B(0, 'procard')}><img src="${p.img}" alt=""><h2>${esc(p.name)}</h2><div class="nick">${esc(p.nick)}</div><div class="ttl">${esc(p.title)}</div><blockquote>${esc(p.quote)}</blockquote><span class="pill">${esc(p.pillar)}</span></div></div>`,
      after: () => mountVideo($('#vb'), s.video, { label: U.huddle.eyebrow + ': ' + p.name, bigPlay: U.huddle.play })
    };
  };

  // 'ran', 'later', or an older saved true (ran)
  const pdVal = s => st.pd[s.id] === true ? 'ran' : (st.pd[s.id] || '');
  R.prodrill = s => {
    const PD = U.prodrill, p = P[s.pro]; const total = p.steps.reduce((a, x) => a + x[1], 0);
    const fmt = x => `${Math.floor(x / 60)}:${String(Math.floor(x % 60)).padStart(2, '0')}`;
    return {
      html: `<div class="pdhead b" data-c="0"><img src="${p.img}" alt=""><div>${eyebrow(T(PD.eyebrow, { first: firstName(p) }) + (p.team ? ' · ' + PD.team : ''))}<h1 class="title">${esc(p.drill)}</h1><p class="sub">${esc(p.drillSub)}</p></div></div>
      <div class="pdsteps">${p.steps.map((x, i) => `<div class="b pdstep" data-c="0" data-d="${400 + i * 350}" id="pd${i}"><div class="top"><span class="t">${esc(T(PD.step, { n: i + 1 }))}</span><span class="tm">${fmt(x[1])}</span></div>${outnum('0' + (i + 1), 66, 'rgba(201,164,92,.95)')}<h3>${esc(x[0])}</h3><p>${esc(x[2])}</p><i class="prog"></i></div>`).join('')}</div>
      <div class="timer b" data-c="1"><span class="clock" id="clk" aria-live="off">${fmt(total)}</span><div class="tbar"><i id="tbar"></i></div><button class="btn" id="tgo">${esc(PD.start)}</button>
        <div class="ranopts" role="radiogroup" aria-label="${esc(PD.ran)}">${[['ran', PD.ran], ['later', PD.later]].map(([k, l]) => `<label class="check"><input type="radio" name="ran" value="${k}" ${pdVal(s) === k ? 'checked' : ''}> ${esc(l)}</label>`).join('')}</div></div>`,
      after: () => {
        let t0 = null, el = 0, run = false;
        const upd = () => {
          const t = el + (run ? (Date.now() - t0) / 1000 : 0); let acc = 0;
          p.steps.forEach((x, i) => { const c = $('#pd' + i); const a = t >= acc && t < acc + x[1]; c.classList.toggle('active', a); c.classList.toggle('done', t >= acc + x[1]); $('.prog', c).style.width = (Math.min(1, Math.max(0, (t - acc) / x[1])) * 100) + '%'; acc += x[1]; });
          $('#clk').textContent = fmt(Math.max(0, total - t)); $('#tbar').style.width = Math.min(100, t / total * 100) + '%';
          if (t >= total) { run = false; clearInterval(ui.timer); $('#tgo').textContent = PD.again; el = 0; }
        };
        $('#tgo').addEventListener('click', () => {
          if (run) { el += (Date.now() - t0) / 1000; run = false; clearInterval(ui.timer); $('#tgo').textContent = PD.resume; return; }
          if (vo && !vo.paused) vo.pause();
          t0 = Date.now(); run = true; $('#tgo').textContent = PD.pause; clearInterval(ui.timer); ui.timer = setInterval(upd, 200); upd();
        });
        $$('input[name="ran"]').forEach(r => r.addEventListener('change', e => { st.pd[s.id] = e.target.value; save(); logInteraction('prodrill_' + s.pro, 'choice', e.target.value, 'neutral'); }));
        ui.cleanup = () => clearInterval(ui.timer);
      }
    };
  };

  R.pulse = s => {
    const PU = U.pulse, gate = 'pulse' + s.n, done = !!st.gates[gate], cs = codeScreen('pulse', s.n);
    return {
      cls: 'steel' + finalCls(s.lesson), html: `${wm(s.lesson, 'soft')}${deco('left:-150px;bottom:-170px')}<div class="pulsewrap"><div>${eyebrow(T(PU.eyebrow, { n: s.n }), 0)}<h1 class="title b" data-c="0" style="font-size:46px">${esc(PU.heading)}</h1>
        <div class="seasondots b" data-c="0">${[1, 2, 3, 4, 5, 6].map(i => `<i class="${i === s.n ? 'on' : (i < s.n ? 'past' : '')}"></i>`).join('')}<span>${esc(T(PU.of, { n: s.n }))}</span></div>
        <div class="pulsechips">${C.pulseItems.map(k => `<div${B(1, 'pchipx')}>${ICON[k.toLowerCase()] ? `<img src="${ICON[k.toLowerCase()]}" alt="">` : `<div class="rp" aria-hidden="true">${IC.reps}</div>`}<b>${esc(k.toUpperCase())}</b></div>`).join('')}</div></div>
      <div class="pulseside">${nextCard(s, 2, done ? (cs ? cs.ok : T(PU.done, { n: s.n })) : '')}</div></div>`
    };
  };

  /* ----- Knowledge check ----- */
  function kcCurrent(s) { const k = kcState(s); if (ui.kcShow != null) return ui.kcShow; return s.qs.findIndex((q, j) => !(k[j] && k[j].done)); }
  R.kc = s => {
    const KC = U.kc, k = kcState(s), qi = kcCurrent(s);
    if (qi < 0) {
      const first = s.qs.filter((q, i) => k[i] && k[i].first).length;
      return {
        cls: 'mist', html: `${deco('left:-120px;top:-140px;color:var(--navy)')}<div class="center kcdone">${eyebrow(KC.eyebrow)}<div class="kc-dots" style="margin:0 auto 26px">${s.qs.map(() => '<i class="done"></i>').join('')}</div>
        <div class="ring" style="--p:${Math.round(first / s.qs.length * 100)}"><b>${first}<small>/${s.qs.length}</small></b></div>
        <h1 class="bigq" style="margin-bottom:8px">${esc(T(KC.done_heading, { total: s.qs.length }))}</h1><p class="lead" style="margin:0 0 18px">${esc(T(KC.done_line, { n: first }))}</p>
        <button class="textlink" id="kcAgain">${esc(KC.again)}</button></div>`,
        after: () => $('#kcAgain').addEventListener('click', () => { st.kc[s.key] = {}; save(); ui.kcShow = null; ui.kcPick = null; render(false); const q = s.qs[0]; playVo(q.vo); updateNav(); })
      };
    }
    const q = s.qs[qi], rec = k[qi] || {}, done = !!rec.done;
    const pick = done ? rec.last : ui.kcPick;
    const wrong = (rec.wrong || []).slice();
    if (done && rec.last !== q.correct && !wrong.includes(rec.last)) wrong.push(rec.last);
    let fb = '';
    if (done) fb = rec.revealed ? fbc(false, KC.answer, q.fb) : fbc(true, KC.correct, q.fb);
    else if (wrong.length && ui.kcRetry) fb = fbc(false, KC.retry_head, KC.retry);
    const remaining = s.qs.some((x, j) => j !== qi && !(k[j] && k[j].done));
    return {
      cls: 'mist', html: `${deco('left:-120px;top:-140px;color:var(--navy)')}<div class="center"><div class="kcwrap"><div class="kc-top">${eyebrow(KC.eyebrow, 0)}
      <div class="kc-dots" aria-label="Question ${qi + 1} of ${s.qs.length}">${s.qs.map((x, j) => `<i class="${j === qi ? 'on' : (k[j] && k[j].done ? 'done' : '')}"></i>`).join('')}</div></div>
      <h1 class="kcq b" data-c="0">${esc(q.q)}</h1>
      <div class="kc-opts b" data-c="0" role="radiogroup" aria-label="Answer options">${q.opts.map((o, j) => {
        const cls = j === q.correct && done ? 'right' : (wrong.includes(j) ? 'wrong' : '');
        return `<button class="kc-opt ${cls}" role="radio" aria-checked="${pick === j}" data-j="${j}" ${done || wrong.includes(j) ? 'disabled' : ''}><span class="rb" aria-hidden="true">${cls === 'right' ? IC.check : (cls === 'wrong' ? IC.x : '')}</span><span>${esc(o)}</span></button>`;
      }).join('')}</div>
      <div aria-live="polite">${fb}</div>
      <div class="kc-foot">${done ? `<button class="btn" id="kcNext">${esc(remaining ? KC.next : KC.finish)}${IC.arrow}</button>` : `<button class="btn" id="kcSub" ${pick == null ? 'disabled' : ''}>${esc(KC.submit)}</button>`}</div></div></div>`,
      after: () => {
        $$('.kc-opt:not(:disabled)').forEach(b => b.addEventListener('click', () => { ui.kcPick = +b.dataset.j; ui.kcRetry = false; $$('.kc-opt').forEach(x => x.setAttribute('aria-checked', x === b)); $('#kcSub').disabled = false; }));
        const sub = $('#kcSub');
        if (sub) sub.addEventListener('click', () => {
          const j = ui.kcPick; if (j == null) return;
          const r = k[qi] = k[qi] || { tries: 0, wrong: [] }; r.tries = (r.tries || 0) + 1; r.last = j; r.wrong = r.wrong || [];
          const okA = j === q.correct;
          logInteraction(s.key + '_q' + (qi + 1), 'choice', q.opts[j], okA ? 'correct' : 'incorrect');
          if (okA || r.tries >= 2) { if (!okA) r.wrong.push(j); r.done = true; r.first = okA && r.tries === 1; r.revealed = !okA; ui.kcShow = qi; ui.kcPick = null; save(); render(false); playVo(q.wvo); updateNav(); }
          else { r.wrong.push(j); ui.kcPick = null; ui.kcRetry = true; save(); render(false); playVo('kc_retry'); }
        });
        const nx = $('#kcNext');
        if (nx) nx.addEventListener('click', () => { ui.kcShow = null; ui.kcPick = null; ui.kcRetry = false; render(false); const n = kcCurrent(s); if (n >= 0) playVo(s.qs[n].vo); updateNav(); });
      }
    };
  };

  /* ----- Close ----- */
  R.summary = s => {
    const SU = U.summary;
    return {
      cls: 'paper sumscr' + finalCls(s.lesson), html: `${wm(s.lesson, 'light')}<div class="hd">${eyebrow(T(SU.eyebrow, { n: s.lesson_no }), 0)}<h1 class="title b" data-c="0">${esc(SU.heading)}</h1></div>
      <div class="keys">${s.points.map((p, i) => `<div${B(p[1], 'key')}>${STAR}${outnum('0' + (i + 1), 92, i === 2 ? '#7A5B1E' : '#C9A45C')}<h3>${esc(p[0])}</h3></div>`).join('')}</div>
      <div class="sumfoot ${s.book ? '' : 'one'}"><div class="dlcard b" data-c="${lastC(s)}"><div class="doc" aria-hidden="true">DOCX</div><div class="t"><span class="tag">${esc(SU.answers_tag)}</span><div>${esc(SU.answers)}</div><button class="btn sm" id="dl">${IC.download}${esc(SU.download)}</button></div></div>
      ${s.book ? `<div class="bookcard b" data-c="${lastC(s)}"><img src="${(U.book && U.book.book && U.book.book.img) || 'assets/mark.svg'}" alt="" class="bc"><div><span class="tag">${esc(SU.book_tag)} · ${esc(s.book)}</span><div>${esc(s.book_note)}</div></div></div>` : ''}</div>`,
      after: () => $('#dl').addEventListener('click', () => downloadAnswers(s.lesson))
    };
  };

  R.close = s => {
    const CL = U.close, n = s.n, nextL = 'L' + (n + 1), open = lessonOpen(nextL), rec = !!st.gates['pulse' + n];
    const prog = `<div class="seasonline b" data-c="0" aria-label="${esc(T(CL.progress, { n }))}">${[1, 2, 3, 4, 5, 6].map(i => `<i class="${i < n ? 'done' : (i === n ? 'now' : '')}"></i>`).join('')}<span>${esc(T(CL.progress, { n }))}</span></div>`;
    return {
      cls: 'dark cover closescr' + finalCls(s.lesson), html: `${bg(s.photo)}<div class="shade"></div>${wm(s.lesson)}${bignum(s.lesson)}${brand()}<div class="inner" style="width:700px">
      <div class="didit b" data-c="0"><span class="burst" aria-hidden="true">${IC.check}</span>${esc(CL.done_badge)}</div>
      <div${B(0, 'kicker')}>${rec ? IC.check + esc(CL.recorded) : STAR + esc(T(CL.kicker, { n }))}</div><h1${B(0)} style="font-size:58px">${esc(s.heading)}</h1>${prog}
      <div${B(1, 'blocks')}><div class="blk"><span class="tag">${esc(CL.this_week)}</span><div class="v">${esc(s.thisweek)}</div></div>
        <div class="blk dim"><span class="tag">${esc(CL.next)}</span><div class="v" style="font-size:19px">${esc(s.next)}</div><div class="s">${esc(s.nextline)}</div></div></div>
      <div${B(1, 'row')}>${open ? nextBtn(T(CL.start, { n: n + 1 })) : ''}<button class="btn ghost lg" id="exitL">${esc(CL.exit)}</button></div></div>${seasonBar(s.lesson)}`,
      after: () => { bindNext(); $('#exitL').addEventListener('click', exitCourse); }
    };
  };

  /* ----- Lesson 6 and the ending ----- */
  R.review = s => ({
    html: `<div class="hd">${eyebrow(s.eyebrow, 0)}<h1 class="title b" data-c="0">${esc(s.heading)}</h1></div>
      <div class="revgrid">${s.cards.map((c, i) => `<div${B(0, 'rev')}><img src="${c[3]}" alt=""><div style="flex:1"><span class="tag">${esc(c[0])}</span><p>${esc(c[1])}</p>
        ${st.review[i] ? `<p class="hint">${esc(c[2])}</p>` : `<button class="btn xs ghost b" data-c="1" data-r="${i}">${IC.plus}${esc(s.prompt_button)}</button>`}</div></div>`).join('')}</div>`,
    after: () => $$('[data-r]').forEach(b => b.addEventListener('click', () => { st.review[b.dataset.r] = true; save(); render(false); }))
  });

  R.thennow = s => {
    const pill = C.pulseItems.slice(0, 4);
    const rate = (grp, label) => pill.map(p => {
      const d = st.today[p] - st.base[p];
      return `<div class="tnrow"><img src="${ICON[p.toLowerCase()]}" alt=""><span>${esc(p)}</span><div class="rate" role="radiogroup" aria-label="${esc(label)}: ${esc(p)}">${[1, 2, 3, 4, 5].map(n => `<button role="radio" aria-checked="${st[grp][p] === n}" data-g="${grp}" data-p="${p}" data-n="${n}">${n}</button>`).join('')}</div>${grp === 'today' && st.base[p] && st.today[p] ? `<span class="delta ${d > 0 ? 'up' : 'flat'}">${d > 0 ? '+' : ''}${d}</span>` : '<span></span>'}</div>`;
    }).join('');
    return {
      html: `<div class="hd">${eyebrow(s.eyebrow, 0)}<h1 class="title b" data-c="0" style="font-size:40px">${esc(s.heading)}</h1></div>
      ${s.hint ? `<p class="tnhint b" data-c="1">${IC.book}<span>${esc(s.hint)}</span></p>` : ''}<div class="tn"><div class="tncard then b l" data-c="1"><span class="tag">${esc(s.base_label)}</span>${rate('base', s.base_label)}
        <label for="why">${esc(s.why_label)}</label><textarea id="why">${esc(st.why)}</textarea></div>
      <div class="tncard today b r" data-c="1"><span class="tag">${esc(s.today_label)}</span>${rate('today', s.today_label)}</div></div>`,
      after: () => {
        $$('[data-g]').forEach(b => b.addEventListener('click', () => { st[b.dataset.g][b.dataset.p] = +b.dataset.n; save(); render(false); const f = $(`[data-g="${b.dataset.g}"][data-p="${b.dataset.p}"][data-n="${b.dataset.n}"]`); if (f) f.focus(); }));
        $('#why').addEventListener('change', e => { st.why = e.target.value; save(); });
      }
    };
  };

  R.loop = s => ({
    cls: 'steel', html: `${deco('left:-140px;bottom:-170px')}<div class="hd">${eyebrow(s.eyebrow, 0)}<h1 class="title b" data-c="0">${esc(s.heading)}</h1></div>
      <div class="loopgrid">${s.steps.map((x, i) => `<button${B(1, 'loopcard')} data-l="${i}" aria-expanded="${!!st.loop[i]}"><span class="num">${i + 1}</span><b>${esc(x[0])}</b>${st.loop[i] ? `<span class="d">${esc(x[1])}</span>` : `<span class="h">${IC.plus}${esc(s.closed_hint)}</span>`}</button>`).join('')}</div>
      <div class="loopback b" data-c="1" aria-hidden="true"><svg viewBox="0 0 920 70" preserveAspectRatio="none"><path d="M901 2 C901 58 890 60 860 60 L60 60 C30 60 19 58 19 14" fill="none" stroke="#C9A45C" stroke-width="3" stroke-dasharray="9 9"/><path d="M7 26 L19 10 L31 26" fill="none" stroke="#C9A45C" stroke-width="3"/></svg></div>`,
    after: () => $$('[data-l]').forEach(b => b.addEventListener('click', () => { st.loop[b.dataset.l] = true; save(); render(false); const f = $(`[data-l="${b.dataset.l}"]`); if (f) f.focus(); }))
  });

  R.laststep = s => {
    const cs = codeScreen('post');
    return {
      html: `<div class="split w500"><div class="photo">${bg(s.photo)}<div class="ov"></div><div class="cap"><div class="statcap b" data-c="0"><b>${esc(s.stat)}</b><span>${esc(s.stat_text)}</span></div></div></div>
      <div class="content">${eyebrow(s.eyebrow, 0)}<h1 class="title b" data-c="0" style="font-size:46px">${esc(s.heading)}</h1><p class="lead b" data-c="0">${esc(s.line)}</p>
      ${nextCard(s, 1, st.gates.post && cs ? cs.ok : '')}</div></div>`
    };
  };

  // The 180 intro. The escape stays here (Melissa, O120): confirming it marks the 180 skipped and goes straight to the share screen.
  R.r180 = s => {
    const RR = U.r180, done = st.gates.r180, skip = st.no180 && !done;
    return {
      html: `<div class="split"><div class="photo">${bg(s.photo)}<div class="ov"></div><div class="cap">${eyebrow(F(s, 'caption_eyebrow'), 0)}<p class="capline b" data-c="0">${esc(s.caption)}</p></div></div>
      <div class="content">${eyebrow(s.eyebrow, 0)}<h1 class="title b" data-c="0" style="font-size:46px">${esc(s.heading)}</h1>
      ${nextCard(s, 1, done ? RR.done : (skip ? RR.skipped : ''))}
      ${done || skip ? '' : `<button class="textlink escape b" data-c="1" id="no180">${esc(s.escape)}</button>`}</div></div>`,
      after: () => {
        const b = $('#no180'); if (!b) return;
        b.addEventListener('click', () => modal(RR.escape_title, `<p>${esc(s.escape_confirm)}</p>`, [[RR.cancel, null], [RR.confirm, () => {
          st.no180 = true; logInteraction('r180_skip', 'true-false', s.escape, 'neutral'); complete();
          const j = S.findIndex((x, k) => k > S.indexOf(s) && !['formembed', 'formcode'].includes(x.type));
          if (j > st.max) st.max = j; save(); go(j);
        }]]));
      }
    };
  };

  R.share = s => {
    const name = fullName(), card = [F(s, 'card_kicker'), name, s.card_title].filter(Boolean).join(': ');
    return {
      cls: 'paper sharescr final', html: `${wm(s.lesson, 'light')}<div class="sharewrap"><div>${eyebrow(F(s, 'eyebrow'), 0)}<h1 class="title b" data-c="0" style="font-size:46px">${esc(F(s, 'heading'))}</h1>
      <div class="quote-box b" data-c="0" id="postTxt">${esc(s.post)}</div>${F(s, 'cert_hint') ? `<p class="certhint b" data-c="1">${IC.download}<span>${esc(F(s, 'cert_hint'))}</span></p>` : ''}
      <div class="row b" data-c="0" style="margin-top:24px"><button class="btn" id="copyPost">${IC.copy}${esc(F(s, 'copy'))}</button><a class="btn ghost" href="https://www.linkedin.com/feed/" target="_blank" rel="noopener">${esc(F(s, 'open'))}${IC.ext}</a></div><div id="copied" aria-live="polite"></div></div>
      <div class="sharecard b r" data-c="0" role="img" aria-label="${esc(card)}">${bg(F(s, 'photo'))}<div class="shade"></div>
        <div class="in">${C.brand ? `<img src="${C.brand.lockup_white}" alt="" style="height:38px;align-self:flex-start">` : `<img src="assets/mark.svg" alt="" style="height:50px;align-self:flex-start">`}<div class="k">${esc(F(s, 'card_kicker'))}</div>${name ? `<div class="n">${esc(name)}</div>` : ''}<div class="l">${esc(s.card_title)}</div><div class="f">${esc(F(s, 'card_foot'))}</div></div></div></div>`,
      after: () => $('#copyPost').addEventListener('click', async () => {
        try { await navigator.clipboard.writeText(s.post); } catch (e) { const r = document.createRange(); r.selectNodeContents($('#postTxt')); const sel = getSelection(); sel.removeAllRanges(); sel.addRange(r); document.execCommand('copy'); }
        $('#copied').innerHTML = okAlert(F(s, 'copied')); logInteraction('share_copy', 'other', 'copied', 'neutral');
      })
    };
  };

  /* The finish screen: Melissa's congratulations video and a recap of the season. What the recap compares is
     a content setting: the Athleader track sets the drill NOTICE answers from Lesson 1 and Lesson 6 side by side,
     the Player-Coach track the behavior they chose in Lesson 1 and what they wrote about it in Lesson 6. */
  function finishCompare(s) {
    if (F(s, 'compare') === 'behavior') return [st.answers.behavior, st.answers.behavior_progress];
    const dr = L => S.find(x => x.type === 'drill' && x.lesson === L);
    return ['L1', 'L6'].map(L => { const d = dr(L); return d ? (st.drills[d.id] || {}).notice : ''; });
  }
  R.finish = s => {
    const d = st.completed ? new Date(st.completed) : new Date();
    const date = d.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
    const [a1, a6] = finishCompare(s);
    const pats = LESSONS.filter(l => st.patterns[l]).map(l => `<span class="pchip"><i>L${l.slice(1)}</i>${esc(st.patterns[l])}</span>`).join('');
    const first = st.learner.first;
    return {
      cls: 'paper finishscr final', html: `<div class="confetti" aria-hidden="true">${Array.from({ length: 22 }, (_, i) => `<i style="--i:${i}"></i>`).join('')}</div>${wm(s.lesson, 'light')}<div class="finish"><div class="fhead"><div>${eyebrow(F(s, 'eyebrow'), 0)}<h1 class="title b" data-c="0">${esc(first ? T(F(s, 'heading'), { first }) : F(s, 'heading_plain'))}</h1><p class="date b" data-c="0">${esc(T(F(s, 'date_line'), { date }))}</p></div>
        <div class="row b" data-c="0"><button class="btn sm ghost" id="savePage">${IC.print}${esc(F(s, 'save'))}</button>${nextBtn(certOn() ? s.cta : F(s, 'cta_off'))}</div></div>
      <div class="left"><div class="vbox b z" data-c="0" id="vb"></div></div>
      <div class="right b r" data-c="0">${a1 || a6 ? `<span class="tag" style="margin-bottom:10px">${esc(F(s, 'compare_label'))}</span>` : ''}
        ${a1 ? `<div class="answer"><b>${esc(F(s, 'l1_label'))}</b><p>${esc(a1)}</p></div>` : ''}
        ${a6 ? `<div class="answer"><b>${esc(F(s, 'l6_label'))}</b><p>${esc(a6)}</p></div>` : ''}
        ${pats ? `<span class="tag" style="margin:12px 0 10px">${esc(F(s, 'patterns_label'))}</span><div class="pchips">${pats}</div>` : ''}</div></div>`,
      after: () => { mountVideo($('#vb'), s.video, { label: F(s, 'video_label'), autoplay: true }); $('#savePage').addEventListener('click', () => window.print()); bindNext(); }
    };
  };

  /* ----- Player-Coach types (steps, reflect, lookback). The Athleader content doesn't use them. ----- */
  // steps: a sequence the manager runs with other people. "timeline" sizes each block by its minutes; "numbered"
  // alternates between a row of cards and a stepped path, so neighbouring lessons don't look alike.
  R.steps = s => {
    const numbered = S.filter(x => x.type === 'steps' && x.style !== 'timeline');
    const path = s.style !== 'timeline' && numbered.indexOf(s) % 2 === 1;
    const mins = x => parseFloat(x.label) || 1;
    const body = s.style === 'timeline'
      ? `<div class="stline">${s.steps.map(x => `<div${B(x.c, 'stblk')} style="flex:${mins(x)}"><span class="lbl">${esc(x.label)}</span><i class="bar" aria-hidden="true"></i><h3>${esc(x.title)}</h3><p>${esc(x.text)}</p></div>`).join('')}</div>`
      : `<div class="stnum ${path ? 'stpath' : 'strow'} n${s.steps.length}">${s.steps.map((x, i) => `<div${B(x.c, 'stcard')} style="--i:${i}">${outnum(x.label, path ? 64 : 84, 'rgba(201,164,92,.95)')}<h3>${esc(x.title)}</h3><p>${esc(x.text)}</p></div>`).join('')}</div>`;
    return {
      cls: s.style === 'timeline' ? 'mist' : (path ? 'steel' : 'paper'),
      html: `${s.motion ? wm(s.lesson, s.style === 'timeline' || !path ? 'light' : '') : ''}${s.style === 'timeline' ? '' : deco(path ? 'right:-120px;bottom:-150px' : 'right:-110px;top:-140px;color:var(--navy)')}<div class="hd">${eyebrow(s.eyebrow, 0)}<h1 class="title b" data-c="0">${esc(s.heading)}</h1>${s.sub ? `<p class="lead b" data-c="0" style="margin-top:10px">${esc(s.sub)}</p>` : ''}</div>
      ${body}${s.pdf ? `<div class="stfoot b" data-c="${lastC(s)}">${pdfBtn(s.pdf, s.pdf_label, 'sm', IC.doc)}</div>` : ''}`
    };
  };

  // reflect: one written answer the manager keeps all season (stored as answers[key])
  function answerBox(id, value, placeholder, onSave) {
    const RF = U.reflect;
    return {
      html: `<textarea id="${id}" class="rftext" placeholder="${esc(placeholder || '')}">${esc(value || '')}</textarea>
        <div class="rffoot"><span id="${id}_sv" aria-live="polite">${value ? `<span class="saved">${IC.check}${esc(RF.saved)}</span>` : ''}</span><button class="btn sm" id="${id}_btn">${esc(RF.save)}</button></div>`,
      bind: () => {
        const t = $('#' + id), sv = $('#' + id + '_sv');
        const store = show => { onSave(t.value.trim()); save(); if (show) sv.innerHTML = t.value.trim() ? `<span class="saved">${IC.check}${esc(RF.saved)}</span>` : ''; };
        $('#' + id + '_btn').addEventListener('click', () => store(true));
        t.addEventListener('change', () => store(false));
        t.addEventListener('input', () => { sv.innerHTML = ''; });
      }
    };
  }
  R.reflect = s => {
    const box = answerBox('rf', st.answers[s.key], s.placeholder, v => { st.answers[s.key] = v; logInteraction('reflect_' + s.key, 'long-fill-in', '[text kept in suspend data]', 'neutral'); });
    return {
      html: `<div class="split"><div class="photo">${bg(s.photo)}<div class="ov"></div></div>
      <div class="content">${eyebrow(s.eyebrow, 0)}<h1 class="title b" data-c="0" style="font-size:40px">${esc(s.heading)}</h1>
      <label class="rfq b" data-c="${Math.min(1, lastC(s))}" for="rf">${esc(s.prompt)}</label>
      <div class="b" data-c="${Math.min(1, lastC(s))}">${box.html}</div>
      <p class="rfnote b" data-c="${lastC(s)}">${esc(s.note)}</p></div></div>`,
      after: box.bind
    };
  };

  // lookback: the Lesson 1 answer next to a new one (stored as answers[key + '_progress'])
  R.lookback = s => {
    const LB = U.lookback, then = st.answers[s.key], k = s.key + '_progress';
    const box = answerBox('lb', st.answers[k], '', v => { st.answers[k] = v; logInteraction('lookback_' + s.key, 'long-fill-in', '[text kept in suspend data]', 'neutral'); });
    return {
      html: `<div class="split w420"><div class="photo">${bg(s.photo, true)}<div class="ov"></div></div>
      <div class="content">${eyebrow(s.eyebrow, 0)}<h1 class="title b" data-c="0" style="font-size:40px">${esc(s.heading)}</h1>
      ${then ? `<blockquote class="lbquote b" data-c="0"><span class="tag">${esc(LB.then_label)}</span><p>${esc(then)}</p></blockquote>` : `<p class="lbempty b" data-c="0">${esc(s.empty)}</p>`}
      <label class="rfq b" data-c="${Math.min(1, lastC(s))}" for="lb">${esc(s.prompt)}</label>
      <div class="b" data-c="${Math.min(1, lastC(s))}">${box.html}</div></div></div>`,
      after: box.bind
    };
  };

  /* ----- Forms inside the course (round 2) -----
     Each JotForm form sits in an iframe on a screen of its own. The iframe is created once per form per session,
     outside the slide, and only hidden when the learner moves on: moving or re-creating it would reload the form
     and lose its last page, where the code is. Back from the code screen shows that page again. */
  const frames = {};
  const formHost = $('#formHost');
  function formFrame(s) {
    const id = s.form + (s.n || ''), FE = U.formembed;
    if (frames[id]) return frames[id];
    const extra = { first_name: st.learner.first };
    if (s.form === 'pulse') extra.lesson = s.n;
    const url = formUrl(s.form, extra);
    const box = document.createElement('div'); box.className = 'formframe'; box.hidden = true; box.dataset.form = id;
    // the new-tab link sits in the same box, under the frame, so keyboard order follows the screen: form, then link
    box.innerHTML = `<div class="frame"><iframe src="${esc(url)}" title="${esc(FE.titles[s.form] || s.heading)}" allow="fullscreen" style="width:100%;height:100%;border:none"></iframe></div>
      <a class="fallback" href="${esc(url)}" target="_blank" rel="noopener">${esc(s.fallback)}${IC.ext}</a>`;
    formHost.appendChild(box);
    const f = frames[id] = { box, url, loaded: false, ready: false, ifr: $('iframe', box), link: $('.fallback', box) };
    f.link.addEventListener('click', () => logInteraction('form_' + id, 'other', 'opened in a new tab', 'neutral'));
    // the frame stays see-through, over the loading message, until the form is ready: JotForm posts a message to
    // the page as soon as the form is drawn, a few seconds before the frame's load event
    f.show = () => {
      if (f.ready) return; f.ready = true; box.classList.add('ready');
      const sp = $('#formLoading'); if (sp && slide.dataset.form === id) sp.classList.add('done');
    };
    f.ifr.addEventListener('load', () => { f.loaded = true; f.show(); });
    window.addEventListener('message', e => { if (e.source === f.ifr.contentWindow) f.show(); });
    return f;
  }
  /* ----- Local survey (Sept 28) -----
     Deep's pre- and post-assessments (and the Pulse Check) drawn inside the course, where the JotForm embed sat,
     from C.forms[form].local: pages, items, answer scales, routing and the completion code on the last page.
     A stand-in until Deep's JotForm embeds arrive; answers stay in memory and are not sent anywhere. */
  const svy = {};
  const svyNL = t => esc(t).replace(/\n/g, '<br>');
  function svyMount(s) {
    const F = C.forms[s.form], D = F.local, id = s.form + (s.n || ''), box = $('#svy');
    const T = svy[id] || (svy[id] = { page: 0, ans: {}, done: false });
    const code = s.form === 'pulse' ? F.codes[s.n - 1] : F.code;
    const qn = q => 'q_' + q.id.replace(/[^A-Za-z0-9]/g, '_');
    const hidden = q => { const r = D.rules[q.id]; return !!(r && r.hide_if && Object.keys(r.hide_if).some(k => r.hide_if[k].includes(T.ans[k]))); };
    const skipRest = () => { const r = D.rules._skip_pages_after_F1; return !!(r && r.F1.includes(T.ans.F1)); };
    const isLast = () => T.page === D.pages.length - 1 || (D.pages[T.page].items.some(q => q.id === 'F1') && skipRest());
    const opt = (q, o, type) => {
      const on = type === 'checkbox' ? (T.ans[q.id] || []).includes(o) : T.ans[q.id] === o;
      return `<label class="svy-opt"><input type="${type}" name="${qn(q)}" value="${esc(o)}"${on ? ' checked' : ''}><span>${esc(o)}</span></label>`;
    };
    const qHtml = q => {
      const req = q.required ? '<span class="svy-req" aria-hidden="true">*</span>' : '';
      if (q.type === 'radio' || q.type === 'check') {
        const type = q.type === 'radio' ? 'radio' : 'checkbox';
        const opts = q.opts.map(o => (o === q.break_before ? '<hr class="svy-break">' : '') + opt(q, o, type) + (o === q.break_after ? '<hr class="svy-break">' : '')).join('');
        const other = q.other && (T.ans[q.id] || []).includes(q.other) ? `<input class="svy-in svy-other" id="${qn(q)}_other" aria-label="${esc(q.other)}" value="${esc(T.ans[q.id + '_other'] || '')}">` : '';
        const hint = q.max ? `<span class="svy-hint">Select up to ${q.max}.</span>` : '';
        return `<fieldset class="svy-q" data-q="${esc(q.id)}"><legend>${svyNL(q.label)}${req}</legend>${hint}<div class="svy-opts${q.row ? ' row' : ''}">${opts}</div>${other}</fieldset>`;
      }
      if (q.type === 'nps') {
        return `<fieldset class="svy-q" data-q="${esc(q.id)}"><legend>${svyNL(q.label)}${req}</legend><div class="svy-nps">${Array.from({ length: 11 }, (_, i) => opt(q, String(i), 'radio')).join('')}</div><div class="svy-npsl"><span>${esc(q.low)}</span><span>${esc(q.high)}</span></div></fieldset>`;
      }
      const tag = q.type === 'textarea' ? `<textarea class="svy-in" id="${qn(q)}" rows="3">${esc(T.ans[q.id] || '')}</textarea>`
        : `<input class="svy-in" id="${qn(q)}" type="${q.type === 'email' ? 'email' : 'text'}" autocomplete="${q.type === 'email' ? 'email' : 'off'}" value="${esc(T.ans[q.id] || '')}">`;
      return `<div class="svy-q" data-q="${esc(q.id)}"><label for="${qn(q)}">${svyNL(q.label)}${req}</label>${tag}</div>`;
    };
    const missing = () => D.pages[T.page].items.filter(q => q.required && !hidden(q)).filter(q => {
      const v = T.ans[q.id];
      if (q.type === 'email') return !(v && /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(v));
      return q.type === 'check' ? !(v && v.length) : !(v && String(v).trim());
    });
    function draw(keepScroll) {
      const prev = keepScroll && $('.svy-body', box) ? $('.svy-body', box).scrollTop : 0;
      if (T.done) {
        box.innerHTML = `<div class="svy-top"><span class="svy-title">${esc(D.title)}</span></div><div class="svy-thanks"><h2>${esc(D.thanks.heading)}</h2><p>Your completion code is</p><div class="svy-code">${esc(code)}</div><p>${esc(D.thanks.line)}</p></div>`;
        return;
      }
      const p = D.pages[T.page];
      box.innerHTML = `<div class="svy-top"><span class="svy-title">${esc(D.title)}</span>${D.pages.length > 1 ? `<span class="svy-prog">Page ${T.page + 1} of ${D.pages.length}</span>` : ''}</div>
        <div class="svy-body" tabindex="-1"><h2 class="svy-h">${esc(p.heading)}</h2>${(p.intro || '').split(/\n\n+/).filter(Boolean).map(x => `<p class="svy-intro">${svyNL(x)}</p>`).join('')}
        ${p.items.filter(q => !hidden(q)).map(qHtml).join('')}<div class="svy-err" role="alert" id="svyErr"></div></div>
        <div class="svy-foot">${T.page > 0 ? `<button class="btn ghost" id="svyBack">${IC.arrowL}${esc(D.back)}</button>` : '<span></span>'}<button class="btn" id="svyNext">${esc(isLast() ? D.submit : D.next)}</button></div>`;
      const body = $('.svy-body', box); body.scrollTop = prev;
      $$('.svy-q', box).forEach(el => {
        const q = p.items.find(x => x.id === el.dataset.q);
        el.addEventListener('input', e => {
          const t = e.target;
          if (t.classList.contains('svy-other')) { T.ans[q.id + '_other'] = t.value; return; }
          if (q.type === 'check') {
            const vals = $$('input[type=checkbox]', el).filter(x => x.checked).map(x => x.value);
            if (q.max && vals.length > q.max) { t.checked = false; return; }
            T.ans[q.id] = vals;
          } else T.ans[q.id] = t.value;
          const touches = Object.values(D.rules).some(r => r && Object.keys(r.hide_if || r).includes(q.id));
          if (touches || q.other) draw(true);
        });
      });
      $('#svyNext', box).addEventListener('click', () => {
        const m = missing(), err = $('#svyErr', box);
        if (m.length) { err.textContent = D.required_msg; const f = $(`[data-q="${m[0].id}"] input, [data-q="${m[0].id}"] textarea`, box); if (f) f.focus(); return; }
        if (isLast()) { T.done = true; logInteraction('survey_' + id, 'other', 'submitted', 'neutral'); draw(); return; }
        T.page++; draw(); $('.svy-body', box).focus();
      });
      const b = $('#svyBack', box); if (b) b.addEventListener('click', () => { T.page--; draw(); $('.svy-body', box).focus(); });
    }
    draw();
  }
  R.formembed = s => {
    const FE = U.formembed, id = s.form + (s.n || '');
    return {
      cls: 'mist formscreen', html: `<div class="formhead"><div>${eyebrow(s.eyebrow, 0)}<h1 class="b" data-c="0">${esc(s.heading)}</h1></div><p class="note b" data-c="0">${s.optional ? STAR : IC.key}<span>${esc(s.note)}</span></p></div>
      <div class="formcard b z ${s.connect ? 'withconnect' : ''}" data-c="0">${C.forms[s.form].local ? '<div class="svy" id="svy"></div>' : `<div class="formloading" id="formLoading" role="status"><span class="spin" aria-hidden="true"></span><span>${esc(FE.loading)}</span></div>`}</div>
      ${s.connect ? `<div class="connect b" data-c="${lastC(s)}"><p>${esc(s.connect.line)}</p><a class="btn sm" href="${esc(s.connect.href)}" target="_blank" rel="noopener" id="connectBtn">${esc(s.connect.button)}${IC.ext}</a></div>` : ''}`,
      after: () => {
        const cb = $('#connectBtn'); if (cb) cb.addEventListener('click', () => logInteraction('stay_connected', 'other', 'opened', 'neutral'));
        if (C.forms[s.form].local) { svyMount(s); return; }
        const f = formFrame(s);
        f.box.classList.toggle('short', !!s.connect);
        slide.dataset.form = id;
        if (f.ready) $('#formLoading').classList.add('done');
        // after 12 seconds without the form, show whatever the frame has and make the new-tab link the main way in
        ui.formTimer = setTimeout(() => { if (!f.ready && S[st.pos] === s) { f.box.classList.add('ready'); f.link.classList.add('slow'); } }, 12000);
        const show = () => { if (S[st.pos] === s) f.box.hidden = false; };
        // the frame appears as the slide settles, so it doesn't sit over the outgoing slide
        if (REDUCE) show(); else ui.formShow = setTimeout(show, 260);
        ui.cleanup = () => { clearTimeout(ui.formTimer); clearTimeout(ui.formShow); f.box.hidden = true; };
      }
    };
  };

  /* One code per survey; the Pulse Check has one code per lesson (Deep's sheet, Sept 28) when C.forms.pulse.codes is set. */
  const formCode = s => (s.form === 'pulse' && C.forms.pulse.codes) ? C.forms.pulse.codes[s.n - 1] : C.forms[s.form].code;
  R.formcode = s => {
    const FC = U.formcode, open = gateOpen(s);
    const first = s.form === 'pre' ? FC.cta_pre : FC.cta;
    return {
      cls: 'mist', html: `${deco('right:-110px;top:-130px;color:var(--navy)')}<div class="center"><div class="keyic b z" data-c="0">${IC.key}</div>${eyebrow(s.eyebrow, 0)}<h1 class="bigq b" data-c="0" style="margin-bottom:26px">${esc(s.heading)}</h1>
      <div class="b codebox" data-c="0">${open ? okAlert(s.ok) : codeBlock('fc', s.prompt, s.button)}</div>${s.guide ? `<p class="guideline b" data-c="${lastC(s)}">${STAR}<span>${esc(s.guide)}</span></p>` : ''}
      <div class="row b" data-c="0" style="margin-top:26px;justify-content:center">${open ? nextBtn(first) : ''}<button class="btn ghost" id="backForm">${IC.arrowL}${esc(s.back)}</button></div></div>`,
      after: () => {
        bindNext();
        $('#backForm').addEventListener('click', () => go(S.findIndex(x => x.type === 'formembed' && x.form === s.form && x.n === s.n)));
        if (open) return;
        bindCode('fc', formCode(s), () => {
          st.gates[s.gate] = true;
          logInteraction(s.form === 'pulse' ? 'pulse_check_L' + s.n : s.form + '_code', 'fill-in', 'accepted', 'correct');
          // The course completes on the 180 code when the track has a 180 step; since Sept 28 the 180 sits inside the post survey, so the post code completes it.
          if (s.gate === 'r180' || (s.gate === 'post' && !S.some(x => x.type === 'r180'))) complete();
          save(); render(false); const b = $('#cta'); if (b) b.focus();
        }, FC.err);
      }
    };
  };

  /* ----- Certificate (round 2) -----
     Melissa's certificate artwork with the learner's name and the date drawn in, previewed live and saved as a
     one-page PDF built here: the page is drawn on a canvas at 2x, exported as a JPEG and embedded in a PDF written
     by hand (the same way the Word export is written), so nothing is downloaded or installed. */
  const certBg = {};
  function certImage(src) {
    if (!certBg[src]) certBg[src] = new Promise((res, rej) => { const im = new Image(); im.onload = () => res(im); im.onerror = rej; im.src = src; });
    return certBg[src];
  }
  function certDate() {
    const d = st.completed ? new Date(st.completed) : new Date();
    return d.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
  }
  async function drawCert(canvas, s, name, scale) {
    const L = s.layout, W = L.page_pt[0], H = L.page_pt[1];
    const im = await certImage(s.bg);
    try { await document.fonts.load(`${L.name.weight} ${L.name.size}px Montserrat`); } catch (e) { /* the fallback face is used */ }
    canvas.width = Math.round(W * scale); canvas.height = Math.round(H * scale);
    const g = canvas.getContext('2d');
    g.drawImage(im, 0, 0, canvas.width, canvas.height);
    g.textAlign = 'center'; g.textBaseline = 'alphabetic';
    const text = (t, o, max) => {
      let size = o.size;
      g.font = `${o.weight} ${size * scale}px Montserrat, Arial, sans-serif`;
      // a long name shrinks to fit the line instead of running into the border
      if (max) { const w = g.measureText(t).width / scale; if (w > max) { size = size * max / w; g.font = `${o.weight} ${size * scale}px Montserrat, Arial, sans-serif`; } }
      g.fillStyle = o.color; g.fillText(t, o.x * scale, o.y * scale);
    };
    if (name) text(name, L.name, 1100);
    text(certDate(), L.date);
  }
  function certPdf(jpeg, pxW, pxH, W, H) {
    const enc = new TextEncoder(), parts = [], offs = [];
    let len = 0;
    const add = x => { const b = typeof x === 'string' ? enc.encode(x) : x; parts.push(b); len += b.length; };
    const obj = (n, body) => { offs[n] = len; add(`${n} 0 obj\n`); body(); add('\nendobj\n'); };
    add('%PDF-1.4\n%âãÏÓ\n');
    const content = `q ${W} 0 0 ${H} 0 0 cm /Im0 Do Q`;
    obj(1, () => add('<< /Type /Catalog /Pages 2 0 R >>'));
    obj(2, () => add('<< /Type /Pages /Kids [3 0 R] /Count 1 >>'));
    obj(3, () => add(`<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${W} ${H}] /Resources << /XObject << /Im0 4 0 R >> >> /Contents 5 0 R >>`));
    obj(4, () => { add(`<< /Type /XObject /Subtype /Image /Width ${pxW} /Height ${pxH} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${jpeg.length} >>\nstream\n`); add(jpeg); add('\nendstream'); });
    obj(5, () => add(`<< /Length ${content.length} >>\nstream\n${content}\nendstream`));
    obj(6, () => add(`<< /Title (${C.title} certificate) /Producer (M.V.P. Accelerator course) >>`));
    const xref = len;
    add(`xref\n0 7\n0000000000 65535 f \n${[1, 2, 3, 4, 5, 6].map(n => String(offs[n]).padStart(10, '0') + ' 00000 n \n').join('')}`);
    add(`trailer\n<< /Size 7 /Root 1 0 R /Info 6 0 R >>\nstartxref\n${xref}\n%%EOF\n`);
    return new Blob(parts, { type: 'application/pdf' });
  }
  async function downloadCert(s, name) {
    const L = s.layout, c = document.createElement('canvas');
    await drawCert(c, s, name, 2);
    const blob = await new Promise(r => c.toBlob(r, 'image/jpeg', 0.92));
    const jpeg = new Uint8Array(await blob.arrayBuffer());
    const pdf = certPdf(jpeg, c.width, c.height, L.page_pt[0], L.page_pt[1]);
    const a = document.createElement('a'); a.href = URL.createObjectURL(pdf);
    const safe = name.normalize('NFKD').replace(/[̀-ͯ]/g, '').replace(/[^\w\s-]/g, '').trim().replace(/\s+/g, '_');
    a.download = `MVP_Accelerator_Certificate_${safe || 'Certificate'}.pdf`;
    document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(a.href), 4000);
    logInteraction('certificate', 'other', 'downloaded', 'neutral');
  }
  R.certificate = s => {
    const CE = U.certificate, open = !!st.completed || st.free;
    if (!open) return { cls: 'mist', html: `${deco('right:-110px;top:-130px;color:var(--navy)')}<div class="center"><div class="keyic b z" data-c="0">${IC.lock}</div>${eyebrow(s.eyebrow, 0)}<h1 class="bigq b" data-c="0">${esc(CE.locked)}</h1></div>` };
    const name = st.certName != null ? st.certName : fullName();
    return {
      cls: 'mist', html: `${deco('left:-120px;bottom:-150px;color:var(--navy)')}<div class="certwrap"><div class="certprev b z" data-c="0"><canvas id="certCanvas" role="img" aria-label="${esc(CE.preview)}"></canvas></div>
      <div class="certside">${eyebrow(s.eyebrow, 0)}<h1 class="title b" data-c="0">${esc(s.heading)}</h1>
        <div class="b" data-c="1"><label class="certlabel" for="certName">${esc(s.name_label)}</label><input id="certName" class="certname" autocomplete="name" spellcheck="false" maxlength="60" value="${esc(name)}"></div>
        <div class="b" data-c="1" style="margin-top:22px"><button class="btn lg" id="certDl" ${name.trim().length < 2 ? 'disabled' : ''}>${IC.download}${esc(s.button)}</button></div>
        <p class="certnote b" data-c="1">${esc(s.note)}</p></div></div>`,
      after: () => {
        const cv = $('#certCanvas'), inp = $('#certName'), dl = $('#certDl');
        let pending = null;
        const paint = () => { cancelAnimationFrame(pending); pending = requestAnimationFrame(() => drawCert(cv, s, inp.value.trim(), 0.5).catch(() => { })); };
        paint();
        inp.addEventListener('input', () => { st.certName = inp.value; save(); dl.disabled = inp.value.trim().length < 2; paint(); });
        dl.addEventListener('click', () => { if (inp.value.trim().length >= 2) downloadCert(s, inp.value.trim()); });
      }
    };
  };

  /* ---------------- Completion, downloads, exit ---------------- */
  function complete() { if (!st.completed) st.completed = new Date().toISOString(); }
  // the closed state: after Exit, and after Finish on the last screen (in an LMS the package would close here)
  function closedCard() {
    const X = U.exit;
    stopVo(); if (activeVideo) activeVideo.pause();
    if (ui.cleanup) ui.cleanup(); ui.cleanup = null;
    seek.kind = null; seekOn(false); seekPaint();
    slide.className = 'slide dark cover'; slide.innerHTML = `${bg('stage')}<div class="shade" style="background:rgba(7,15,27,.76)"></div><div class="center" style="color:#fff">${C.brand ? `<img src="${C.brand.lockup_white}" alt="" style="height:48px;margin-bottom:26px">` : `<img src="assets/mark.svg" alt="" style="height:64px;margin-bottom:20px">`}<h1 style="font-size:40px;margin:0 0 12px">${esc(X.saved)}</h1><p style="color:#E6ECF3;margin:0 0 26px">${esc(X.close)}</p><button class="btn" id="reopen">${esc(X.return)}</button></div>`;
    btnNext.disabled = true; gateMsg.textContent = '';
    $('#reopen').addEventListener('click', () => render(true));
    $('#reopen').focus();
  }
  function exitCourse() {
    const X = U.exit;
    modal(X.title, `<p>${esc(X.body)}</p>`, [[X.stay, null], [X.exit, closedCard]]);
  }

  // Word (.docx) export of the learner's answers: a minimal WordprocessingML package, zipped (stored) in the browser.
  const CRC = (() => { const t = new Uint32Array(256); for (let n = 0; n < 256; n++) { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xEDB88320 ^ (c >>> 1) : c >>> 1; t[n] = c >>> 0; } return t; })();
  function crc32(u8) { let c = 0xFFFFFFFF; for (let i = 0; i < u8.length; i++) c = CRC[(c ^ u8[i]) & 0xFF] ^ (c >>> 8); return (c ^ 0xFFFFFFFF) >>> 0; }
  function zipStore(files, mime) {
    const enc = new TextEncoder(), parts = [], central = []; let off = 0;
    files.forEach(f => {
      const name = enc.encode(f.name), data = enc.encode(f.data), crc = crc32(data);
      const lh = new DataView(new ArrayBuffer(30));
      [[0, 0x04034b50, 4], [4, 20, 2], [6, 0x0800, 2], [8, 0, 2], [10, 0, 2], [12, 0x21, 2], [14, crc, 4], [18, data.length, 4], [22, data.length, 4], [26, name.length, 2], [28, 0, 2]].forEach(([o, v, n]) => n === 4 ? lh.setUint32(o, v, true) : lh.setUint16(o, v, true));
      parts.push(new Uint8Array(lh.buffer), name, data);
      const ch = new DataView(new ArrayBuffer(46));
      [[0, 0x02014b50, 4], [4, 20, 2], [6, 20, 2], [8, 0x0800, 2], [10, 0, 2], [12, 0, 2], [14, 0x21, 2], [16, crc, 4], [20, data.length, 4], [24, data.length, 4], [28, name.length, 2], [30, 0, 2], [32, 0, 2], [34, 0, 2], [36, 0, 2], [38, 0, 4], [42, off, 4]].forEach(([o, v, n]) => n === 4 ? ch.setUint32(o, v, true) : ch.setUint16(o, v, true));
      central.push(new Uint8Array(ch.buffer), name);
      off += 30 + name.length + data.length;
    });
    const csize = central.reduce((a, b) => a + b.length, 0);
    const end = new DataView(new ArrayBuffer(22));
    end.setUint32(0, 0x06054b50, true); end.setUint16(8, files.length, true); end.setUint16(10, files.length, true); end.setUint32(12, csize, true); end.setUint32(16, off, true);
    return new Blob([...parts, ...central, new Uint8Array(end.buffer)], { type: mime });
  }
  function docx(paras) {
    const x = s => esc(s).replace(/'/g, '&apos;');
    const body = paras.map(([style, t]) => `<w:p>${style ? `<w:pPr><w:pStyle w:val="${style}"/></w:pPr>` : ''}<w:r><w:t xml:space="preserve">${x(t)}</w:t></w:r></w:p>`).join('');
    const W = 'xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"';
    const st_ = (id, name, rpr, ppr) => `<w:style w:type="paragraph" w:styleId="${id}"><w:name w:val="${name}"/><w:basedOn w:val="Normal"/><w:next w:val="Normal"/><w:qFormat/><w:pPr>${ppr || ''}</w:pPr><w:rPr>${rpr}</w:rPr></w:style>`;
    const styles = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><w:styles ${W}><w:docDefaults><w:rPrDefault><w:rPr><w:rFonts w:ascii="Arial" w:hAnsi="Arial" w:cs="Arial"/><w:color w:val="2E3A4B"/><w:sz w:val="22"/></w:rPr></w:rPrDefault><w:pPrDefault><w:pPr><w:spacing w:after="120" w:line="276" w:lineRule="auto"/></w:pPr></w:pPrDefault></w:docDefaults>
      <w:style w:type="paragraph" w:default="1" w:styleId="Normal"><w:name w:val="Normal"/><w:qFormat/></w:style>
      ${st_('Title', 'Title', '<w:b/><w:color w:val="14273F"/><w:sz w:val="44"/>', '<w:spacing w:after="60"/>')}
      ${st_('Subtitle', 'Subtitle', '<w:color w:val="7A5B1E"/><w:sz w:val="26"/>', '<w:pBdr><w:bottom w:val="single" w:sz="12" w:space="8" w:color="C9A45C"/></w:pBdr><w:spacing w:after="240"/>')}
      ${st_('Heading1', 'heading 1', '<w:b/><w:color w:val="14273F"/><w:sz w:val="30"/>', '<w:keepNext/><w:spacing w:before="320" w:after="120"/><w:outlineLvl w:val="0"/>')}
      ${st_('Heading2', 'heading 2', '<w:b/><w:caps/><w:color w:val="7A5B1E"/><w:sz w:val="18"/>', '<w:keepNext/><w:spacing w:before="200" w:after="40"/><w:outlineLvl w:val="1"/>')}
      ${st_('Question', 'Question', '<w:i/><w:color w:val="56616F"/>', '<w:keepNext/><w:spacing w:after="60"/>')}
      ${st_('Answer', 'Answer', '<w:color w:val="1A2433"/><w:sz w:val="24"/>', '<w:pBdr><w:left w:val="single" w:sz="18" w:space="8" w:color="C9A45C"/></w:pBdr><w:ind w:left="284"/>')}
      </w:styles>`;
    const doc = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><w:document ${W}><w:body>${body}<w:sectPr><w:pgSz w:w="12240" w:h="15840"/><w:pgMar w:top="1200" w:right="1200" w:bottom="1200" w:left="1200" w:header="600" w:footer="600" w:gutter="0"/></w:sectPr></w:body></w:document>`;
    return zipStore([
      { name: '[Content_Types].xml', data: '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/><Override PartName="/word/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.styles+xml"/></Types>' },
      { name: '_rels/.rels', data: '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/></Relationships>' },
      { name: 'word/_rels/document.xml.rels', data: '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/></Relationships>' },
      { name: 'word/document.xml', data: doc },
      { name: 'word/styles.xml', data: styles }
    ], 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
  }
  function answersFor(L) {
    const X = U.export, out = [], A = (q, a) => { if (q) out.push(['Question', q]); out.push(['Answer', a || X.blank]); };
    out.push(['Title', [C.title, C.track, lessonShort(L)].join('  ·  ')]);
    out.push(['Subtitle', [lessonName(L), fullName(), new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })].filter(Boolean).join('  ·  ')]);
    const sc = S.filter(x => x.lesson === L);
    const m = sc.find(x => x.type === 'moment');
    if (m) { out.push(['Heading1', U.moment.eyebrow]); out.push(['', m.scene]); }
    if (sc.some(x => x.type === 'checkin')) {
      out.push(['Heading1', U.checkin.eyebrow]); const ci = st.checkin[L] || {};
      C.checkin.forEach(c => { out.push(['Heading2', c.label]); A(c.q, ci[c.k]); });
      out.push(['Heading2', U.checkin.b_heading]); A(null, st.patterns[L] || X.not_named);
    }
    const rc = sc.find(x => x.type === 'recall');
    if (rc && st.recall[rc.id] != null) { out.push(['Heading1', U.recall.eyebrow]); A(rc.q, rc.opts[st.recall[rc.id]]); }
    const dr = sc.find(x => x.type === 'drill');
    if (dr) { const d = D[dr.drill], r = st.drills[dr.id] || {}; out.push(['Heading1', U.drill.eyebrow + ': ' + d.title]); d.holds.forEach(h => { out.push(['Heading2', h.label]); A(h.q, r[h.key]); }); }
    const cl = sc.find(x => x.type === 'call');
    if (cl) { out.push(['Heading1', U.call.eyebrow]); const p = st.calls[cl.id]; A(cl.prompt, p == null ? X.not_chosen : cl.opts[p].t); if (p != null) out.push(['', cl.opts[p].fb]); }
    sc.filter(x => x.type === 'reflect').forEach(r => { out.push(['Heading1', r.heading]); A(r.prompt, st.answers[r.key]); });
    sc.filter(x => x.type === 'lookback').forEach(r => { out.push(['Heading1', r.heading]); out.push(['Heading2', U.lookback.then_label]); A(null, st.answers[r.key]); out.push(['Heading2', U.lookback.now_label]); A(r.prompt, st.answers[r.key + '_progress']); });
    const pd = sc.find(x => x.type === 'prodrill');
    if (pd) { const p = P[pd.pro], v = pdVal(pd); out.push(['Heading1', U.huddle.eyebrow + ': ' + p.drill]); out.push(['', `${p.name}. ${v === 'ran' ? X.ran : (v === 'later' ? (U.prodrill.later + '.') : X.not_ran)}`]); }
    if (st.fivewords && L === 'L1') { out.push(['Heading1', (U.reset || {}).yours || 'Your five words']); out.push(['Answer', st.fivewords]); }
    if (sc.some(x => x.type === 'thennow')) {
      const t = sc.find(x => x.type === 'thennow');
      out.push(['Heading1', t ? t.eyebrow : X.then_now_title]);
      C.pulseItems.slice(0, 4).forEach(p => out.push(['', T(X.then_now, { p, a: st.base[p] || '-', b: st.today[p] || '-' })]));
      if (st.why) { out.push(['Heading2', t ? t.why_label : '']); A(null, st.why); }
    }
    const kc = sc.find(x => x.type === 'kc');
    if (kc) { const k = st.kc[kc.key] || {}; const n = kc.qs.filter((q, i) => k[i] && k[i].first).length; out.push(['Heading1', U.kc.eyebrow]); out.push(['', T(X.score, { n, total: kc.qs.length })]); }
    const cs = sc.find(x => x.type === 'close');
    const pb = sc.find(x => x.type === 'playbook');
    out.push(['Heading1', U.close.this_week]);
    if (cs) out.push(['', cs.thisweek]);
    if (pb) pb.drills.forEach(d => out.push(['', `${/^\d/.test(d[0]) ? U.playbook.drill + ' ' + d[0] : d[0]}: ${d[1]} (${d[3]} ${U.playbook.min})`]));
    return out;
  }
  function downloadAnswers(L) {
    const blob = docx(answersFor(L));
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = `MVP_Accelerator_${C.track.replace(/[^A-Za-z]/g, '')}_Lesson${L.slice(1)}_my_answers.docx`;
    document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(a.href), 4000);
    logInteraction('answers_' + L, 'other', 'downloaded', 'neutral');
  }
  function downloadIcs(cal) {
    const c = calLinks(cal); const f = x => x.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
    const icsText = v => v.replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,');
    // lines longer than 75 characters fold onto continuation lines that start with a space (RFC 5545)
    const fold = l => { const out = []; let n; while (l.length > (n = out.length ? 74 : 75)) { if (l[n - 1] === '\\') n--; out.push(l.slice(0, n)); l = l.slice(n); } out.push(l); return out.join('\r\n '); };
    const ics = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Athleadership Arena//MVP Accelerator//EN', 'CALSCALE:GREGORIAN', 'BEGIN:VEVENT', 'UID:mvp-weekly-hour-' + Date.now() + '@athleadership', 'DTSTAMP:' + f(new Date()), 'DTSTART:' + f(c.d), 'DTEND:' + f(c.e), 'RRULE:FREQ=WEEKLY;COUNT=13', 'SUMMARY:' + icsText(c.title), 'DESCRIPTION:' + icsText(c.body), 'END:VEVENT', 'END:VCALENDAR'].map(fold).join('\r\n') + '\r\n';
    const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([ics], { type: 'text/calendar' })); a.download = 'MVP_Accelerator_weekly_hour.ics'; document.body.appendChild(a); a.click(); a.remove();
    logInteraction('calendar_hold', 'other', 'ics', 'neutral');
  }

  /* ---------------- Modal ---------------- */
  function modal(title, body, actions) {
    const m = $('#modal'); $('#modalTitle').textContent = title; $('#modalBody').innerHTML = body;
    const acts = $('#modalActions'); acts.innerHTML = '';
    actions.forEach(([label, fn], i) => { const b = document.createElement('button'); b.className = 'btn sm' + (i < actions.length - 1 ? ' ghost' : ''); b.textContent = label; b.addEventListener('click', () => { m.hidden = true; if (fn) fn(); }); acts.appendChild(b); });
    m.hidden = false; acts.lastChild.focus();
  }

  /* ---------------- Slide transition: the old slide leaves while the new one enters ---------------- */
  function ghost(dir) {
    $$('.leaving', stage).forEach(g => g.remove());
    if (!slide.firstChild) return;
    const g = slide.cloneNode(true);
    g.removeAttribute('id'); g.removeAttribute('tabindex'); g.setAttribute('aria-hidden', 'true');
    g.className = slide.className.replace(/\b(enter|back)\b/g, '') + ' leaving' + (dir < 0 ? ' rev' : '');
    $$('[id]', g).forEach(e => { if (!e.closest('svg')) e.removeAttribute('id'); });
    // photos stay where the Ken Burns had reached, and a playing video freezes on its current frame
    const sp = $$('.bgphoto', slide), gp = $$('.bgphoto', g);
    sp.forEach((p, i) => { if (!gp[i]) return; const t = getComputedStyle(p).transform; gp[i].style.animation = 'none'; if (t && t !== 'none') gp[i].style.transform = t; });
    const sv = $$('video', slide), gv = $$('video', g);
    sv.forEach((v, i) => {
      const c = document.createElement('canvas');
      try { c.width = v.videoWidth || 16; c.height = v.videoHeight || 9; c.getContext('2d').drawImage(v, 0, 0, c.width, c.height); } catch (e) { /* frame not ready */ }
      c.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;object-fit:contain;background:#000';
      if (gv[i]) gv[i].replaceWith(c);
    });
    $$('audio,.bigplay,.vlabel', g).forEach(e => e.remove());
    stage.insertBefore(g, slide);
    setTimeout(() => g.remove(), 620);
  }

  /* ---------------- Navigation and rendering ---------------- */
  function mainVo(s) {
    if (s.type === 'checkin') return 'ci_' + (st.ci[s.id] || 'a');
    if (s.type === 'kc') { const i = kcCurrent(s); const r = (st.kc[s.key] || {})[i]; return i >= 0 && !(r && r.done) ? s.qs[i].vo : null; }
    return (s.vo && s.vo[0]) || null;
  }
  let voTimer = null;
  const menuOpen = new Set();
  function go(i) {
    if (S[i] && skipped(S[i])) i = nextIndex(i, i < st.pos ? -1 : 1);
    if (i < 0 || i >= S.length) return;
    if (!st.free) {
      if (i === nextIndex(st.pos, 1) && !canNext(S[st.pos])) { updateNav(); return; }
      if (i > nextIndex(st.pos, 1) && i > st.max) return;
      if (!lessonOpen(S[i].lesson)) return;
    }
    const dir = i < st.pos ? -1 : 1;
    st.pos = i; if (i > st.max) st.max = i; save(); render(true, dir);
  }
  function render(fresh, dir) {
    const s = S[st.pos];
    if (fresh !== false) {
      if (!REDUCE) ghost(dir || 1);
      if (ui.cleanup) ui.cleanup();
      clearTimeout(voTimer); stopVo();
      if (activeVideo) { try { activeVideo.pause(); } catch (e) { } activeVideo = null; }
      if (ui.id !== s.id) ui = { id: s.id, reach: {} };
    } else if (ui.id !== s.id) ui = { id: s.id, reach: {} };
    st.seen[s.id] = true; save();
    const out = R[s.type](s);
    slide.className = 'slide ' + (out.cls || (s.dark ? 'dark' : 'paper'));
    if (fresh !== false && !REDUCE) { void slide.offsetWidth; slide.classList.add(dir < 0 ? 'back' : 'enter'); }
    slide.innerHTML = out.html;
    slide.dataset.sid = s.id;
    // focus lands on the slide at each new screen; its name is the screen's title, so a screen reader says where you
    // are (as Storyline announces the slide title)
    slide.setAttribute('role', 'region'); slide.setAttribute('aria-label', s.menu || s.heading || s.id);
    if (out.after) out.after();
    const key = mainVo(s);
    if (fresh !== false) {
      armBuild(key, true);
      if (key) voTimer = setTimeout(() => { if (S[st.pos] === s) playVo(key); }, 650);
      btnPlay.classList.remove('nudge');
      seekBind(key ? 'vo' : (activeVideo ? 'video' : null));
      slide.focus({ preventScroll: true });
    } else { $$('.b', slide).forEach(e => { e.classList.add('now'); e.classList.add('in'); }); armBuild(build.key, false); seekPaint(); }
    menuOpen.add(s.lesson);
    updateChrome(); updateNav(); buildTranscript();
  }
  function updateChrome() {
    const s = S[st.pos]; const L = s.lesson;
    $('#topLesson').textContent = lessonName(L);
    // where the learner is in the course: the lesson and the screen (the seek bar is the slide's own timeline)
    const inLesson = S.filter(x => x.lesson === L && !skipped(x)); const k = inLesson.indexOf(s) + 1;
    $('#counter').textContent = `${k} of ${inLesson.length}`;
    $('#counter').setAttribute('aria-label', `${lessonShort(L)}, screen ${k} of ${inLesson.length}`);
    buildMenu();
  }
  function updateNav() {
    const s = S[st.pos]; if (!s) return;
    const stg = st.ci[s.id] || 'a';
    btnPrev.disabled = st.pos === 0 && !(s.type === 'checkin' && stg !== 'a');
    const layerNext = s.type === 'checkin' && stg !== 'c';
    const ok = layerNext || canNext(s);
    btnNext.disabled = !ok || (st.pos >= S.length - 1 && !s.last);
    // the last screen's Next closes the course
    btnNext.querySelector('.lbl').textContent = s.last ? U.formembed.finish : NEXT_LBL;
    btnNext.classList.toggle('pulse', ok && !btnNext.disabled && ['fullvideo', 'drill', 'formcode', 'kc', 'tabs'].includes(s.type));
    const nxt = S[st.pos + 1];
    gateMsg.textContent = ok ? '' : (gateText(s) || (nxt && !lessonOpen(nxt.lesson) ? U.gates.next_lesson : ''));
  }
  btnNext.addEventListener('click', () => {
    const s = S[st.pos];
    if (s.type === 'checkin') { const g = st.ci[s.id] || 'a'; if (g !== 'c') { st.ci[s.id] = g === 'a' ? 'b' : 'c'; save(); render(true, 1); return; } }
    if (s.last) { logInteraction('course_closed', 'other', s.id, 'neutral'); closedCard(); return; }
    go(nextIndex(st.pos, 1));
  });
  btnPrev.addEventListener('click', () => {
    const s = S[st.pos];
    if (s.type === 'checkin') { const g = st.ci[s.id] || 'a'; if (g !== 'a') { st.ci[s.id] = g === 'c' ? 'b' : 'a'; save(); render(true, -1); return; } }
    go(nextIndex(st.pos, -1));
  });
  $('#btnReplay').addEventListener('click', () => render(true));
  $('#btnCC').addEventListener('click', e => { st.cc = !st.cc; save(); e.currentTarget.setAttribute('aria-pressed', st.cc); if (!st.cc) ccBar.classList.remove('show'); });
  $('#volume').addEventListener('input', e => { st.vol = +e.target.value; vo.volume = st.vol; if (activeVideo) activeVideo.volume = st.vol; save(); });

  /* ---------------- Menu ---------------- */
  const LOCK = '<svg viewBox="0 0 24 24" width="14" height="14" aria-hidden="true"><path fill="currentColor" d="M7 10V7a5 5 0 0 1 10 0v3h1a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V11a1 1 0 0 1 1-1h1zm2 0h6V7a3 3 0 0 0-6 0v3z"/></svg>';
  function buildMenu() {
    let html = '';
    LESSONS.forEach(L => {
      const open = lessonOpen(L), done = lessonDone(L);
      const scr = S.map((x, i) => [x, i]).filter(([x]) => x.lesson === L && !skipped(x));
      const status = done ? 'Complete' : (!open ? 'Locked' : (scr.some(([x]) => st.seen[x.id]) ? 'In progress' : 'Open'));
      const exp = open && menuOpen.has(L);
      html += `<li><button class="grp ${open ? '' : 'lock'}" data-grp="${L}" aria-expanded="${exp}" ${open ? '' : 'aria-disabled="true"'}><span aria-hidden="true">${!open ? LOCK : (done ? '✓' : (exp ? '▾' : '▸'))}</span>${esc(lessonName(L))}<span class="st ${done ? 'done' : ''}">${status}</span></button>`;
      if (exp) html += `<ol>${scr.map(([x, i]) => `<li><button data-go="${i}" ${screenOpen(i) ? '' : 'disabled'} ${i === st.pos ? 'aria-current="page"' : ''}><span class="dot ${st.seen[x.id] ? 'seen' : ''}"></span>${esc(x.menu)}</button></li>`).join('')}</ol>`;
      html += '</li>';
    });
    $('#menu').innerHTML = html;
    $$('[data-go]').forEach(b => b.addEventListener('click', () => { const i = +b.dataset.go; const dir = i < st.pos ? -1 : 1; st.pos = i; save(); render(true, dir); }));
    $$('[data-grp]').forEach(b => b.addEventListener('click', () => { const L = b.dataset.grp; if (!lessonOpen(L)) return; if (menuOpen.has(L)) menuOpen.delete(L); else menuOpen.add(L); buildMenu(); }));
    const cur = $('#menu [aria-current="page"]'); if (cur) cur.scrollIntoView({ block: 'nearest' });
  }
  $('#btnMenu').addEventListener('click', e => { const sb = $('#sidebar'); sb.classList.toggle('collapsed'); e.currentTarget.setAttribute('aria-expanded', !sb.classList.contains('collapsed')); setTimeout(fit, 30); });

  /* ---------------- Resources and transcript ---------------- */
  $('#resourcesMenu').innerHTML = C.resources.map(r => `<a role="menuitem" href="${r.href}" target="_blank" rel="noopener"><span class="doc-ic" aria-hidden="true">${r.tag}</span><span>${esc(r.label)}<small>${esc(r.note)}</small></span></a>`).join('')
    + `<a role="menuitem" href="${C.book_url}" target="_blank" rel="noopener"><span class="doc-ic" aria-hidden="true">WEB</span><span>${esc(U.resources.book)}<small>${esc(U.resources.book_note)}</small></span></a>`;
  $('#btnResources').addEventListener('click', e => { const m = $('#resourcesMenu'); m.hidden = !m.hidden; e.currentTarget.setAttribute('aria-expanded', !m.hidden); if (!m.hidden) $('a', m).focus(); });
  document.addEventListener('click', e => { if (!e.target.closest('.dropdown')) { $('#resourcesMenu').hidden = true; $('#btnResources').setAttribute('aria-expanded', 'false'); } });
  $('#btnTranscript').addEventListener('click', e => { const t = $('#transcript'); t.hidden = !t.hidden; e.currentTarget.setAttribute('aria-pressed', !t.hidden); });
  $('#btnCloseTranscript').addEventListener('click', () => { $('#transcript').hidden = true; $('#btnTranscript').setAttribute('aria-pressed', 'false'); });
  function buildTranscript() {
    const s = S[st.pos]; let h = '';
    let keys = s.type === 'checkin' ? ['ci_a', 'ci_b', 'ci_c'] : s.type === 'kc' ? s.qs.flatMap(q => [q.vo, q.wvo]) : (s.vo || []).slice();
    if (s.itemvo) keys = keys.concat(Object.values(s.itemvo));
    if (s.type === 'call') keys = keys.concat(s.opts.map(o => o.vo));
    keys = keys.filter((k, i, a) => a.indexOf(k) === i);
    const txt = keys.map(k => NAR[k] ? `<p>${esc(NAR[k].text)}</p>` : '').join('');
    if (txt) h += `<h3>Narration</h3>` + txt;
    const vk = s.video && V[s.video] && V[s.video].cc;
    if (vk && CAP[vk]) { h += `<h3>Video</h3>`; let para = []; CAP[vk].forEach((c, i) => { para.push(c[2]); if (para.length >= 4 || i === CAP[vk].length - 1) { h += `<p>${esc(para.join(' '))}</p>`; para = []; } }); }
    if (!h) h = s.video ? '<p>This video has music and no speech.</p>' : '<p>This screen has no narration. Everything is on the screen.</p>';
    $('#transcriptBody').innerHTML = h;
  }

  /* ---------------- Course data panel (LMS view) ---------------- */
  function cmi() {
    const status = st.completed ? 'completed' : (Object.keys(st.seen).length > 1 ? 'incomplete' : 'not attempted');
    const rows = [
      ['cmi.core.student_id', st.learner.id], ['cmi.core.student_name', st.learner.first ? [st.learner.last, st.learner.first].filter(Boolean).join(', ') : '(none outside an LMS)'],
      ['cmi.core.lesson_location', S[st.pos].id], ['cmi.core.lesson_status', status], ['cmi.core.exit', 'suspend'],
      ['cmi.progress_measure (2004)', (Object.keys(st.seen).length / S.length).toFixed(2)],
      ['cmi.suspend_data (chars)', JSON.stringify(st).length + ' of 64,000'],
      ['Gate: pre-assessment', st.gates.pre ? 'accepted' : 'open']];
    for (let n = 1; n <= 6; n++) rows.push([`Gate: Pulse Check L${n}`, st.gates['pulse' + n] ? 'accepted' : 'open']);
    rows.push(['Gate: post-assessment', st.gates.post ? 'accepted' : 'open']);
    if (S.some(x => x.type === 'r180')) rows.push(['Gate: 180', st.gates.r180 ? 'accepted' : (st.no180 ? 'skipped (confirmed)' : 'open')]);
    return rows;
  }
  function buildPanel() {
    $('#panelBody').innerHTML = `<p>What the LMS would record for this learner. Check-in text and drill answers stay in suspend data and are never sent as interactions.</p>
      <h3>Learner</h3><p class="small">In an LMS the name comes from cmi.core.student_name. Set one here to see how it shows.</p><div class="row"><input id="pFirst" value="${esc(st.learner.first)}" aria-label="First name" style="flex:1;padding:6px"><input id="pLast" value="${esc(st.learner.last)}" aria-label="Last name" style="flex:1;padding:6px"><input id="pId" value="${esc(st.learner.id)}" aria-label="Learner ID" style="flex:1;padding:6px"><button class="btn sm" id="pSave">Set</button></div>
      <h3>Navigation</h3><label style="display:flex;gap:8px;align-items:center"><input type="checkbox" id="pFree" ${st.free ? 'checked' : ''} ${MODE === 'review' ? 'disabled' : ''}> Free navigation (skip video and code gates)${MODE === 'review' ? ', always on in the review view' : ''}</label>
      <div class="row"><select id="pJump" aria-label="Jump to screen">${S.map((x, i) => `<option value="${i}" ${i === st.pos ? 'selected' : ''}>${x.id} · ${esc(x.menu)}</option>`).join('')}</select><button class="btn sm" id="pGo">Go</button><button class="btn sm ghost" id="pReset">Reset learner</button></div>
      <h3>Codes</h3><table><tr><td>Pre-assessment</td><td>${C.forms.pre.code}</td></tr>${C.forms.pulse.codes ? C.forms.pulse.codes.map((c, i) => `<tr><td>Pulse Check, Lesson ${i + 1}</td><td>${c}</td></tr>`).join('') : `<tr><td>Pulse Check</td><td>${C.forms.pulse.code}</td></tr>`}<tr><td>Post-assessment</td><td>${C.forms.post.code}</td></tr>${C.forms.r180 && S.some(x => x.type === 'r180') ? `<tr><td>180</td><td>${C.forms.r180.code}</td></tr>` : ''}</table>
      <h3>Settings</h3><table><tr><td>Track</td><td>${esc(C.track)}</td></tr><tr><td>Certificate screen (COURSE.certificate.enabled)</td><td>${certOn() ? 'on' : 'off'}</td></tr><tr><td>Saved state key</td><td>${KEY}</td></tr></table>
      <h3>SCORM data</h3><table>${cmi().map(r => `<tr><td>${r[0]}</td><td>${esc(r[1])}</td></tr>`).join('')}</table>
      <h3>cmi.interactions (${st.interactions.length})</h3><table>${st.interactions.slice(-25).reverse().map(x => `<tr><td>${esc(x.id)}</td><td>${esc(x.type)} · ${esc(x.response)} · ${esc(x.result)}</td></tr>`).join('')}</table>`;
    $('#pSave').addEventListener('click', () => { st.learner = { first: $('#pFirst').value.trim(), last: $('#pLast').value.trim(), id: $('#pId').value.trim() || 'AVN-20417' }; save(); showLearner(); render(false); buildPanel(); });
    $('#pFree').addEventListener('change', e => { st.free = e.target.checked; save(); render(false); buildPanel(); });
    $('#pGo').addEventListener('click', () => { st.pos = +$('#pJump').value; if (st.pos > st.max) st.max = st.pos; save(); render(true); buildPanel(); });
    $('#pReset').addEventListener('click', () => { const keepFree = st.free, who = st.learner; st = defaults(); st.learner = who; st.free = keepFree || MODE === 'review'; save(); render(true); buildPanel(); showLearner(); });
  }
  function togglePanel() { const p = $('#dataPanel'); p.hidden = !p.hidden; if (!p.hidden) buildPanel(); }
  document.addEventListener('keydown', e => {
    if (e.ctrlKey && e.altKey && (e.key === 'd' || e.key === 'D')) { e.preventDefault(); togglePanel(); }
    if (e.key === 'Escape') { $('#modal').hidden = true; $('#resourcesMenu').hidden = true; }
    const tag = (e.target.tagName || '').toLowerCase(); if (tag === 'textarea' || tag === 'input' || tag === 'video') return;
    if (e.altKey && e.key === 'ArrowRight' && !btnNext.disabled) btnNext.click();
    if (e.altKey && e.key === 'ArrowLeft' && !btnPrev.disabled) btnPrev.click();
  });
  let clicks = 0, clickT = 0; $('.top-mark').addEventListener('click', () => { const now = Date.now(); clicks = now - clickT < 500 ? clicks + 1 : 1; clickT = now; if (clicks >= 3) { clicks = 0; togglePanel(); } });
  $('#btnClosePanel').addEventListener('click', togglePanel);
  // hooks for the test scripts in _generators/node_tools
  window.__player = { go, st: () => st, S, render, canNext, revealAll, seekTo, seekDur, seekLimit, seek, frames, downloadCert, drawCert, certPdf };

  /* ---------------- Start ---------------- */
  function showLearner() { const n = fullName(), el = $('#learnerName'); el.textContent = n; el.hidden = !n; }
  showLearner();
  $('.track-name').textContent = C.track;
  if (MODE === 'review') { const t = document.createElement('span'); t.className = 'mode-chip'; t.textContent = 'Review view'; $('.top-right').prepend(t); }
  $('#btnCC').setAttribute('aria-pressed', st.cc); $('#volume').value = st.vol;
  if (window.innerWidth < 1100) { $('#sidebar').classList.add('collapsed'); $('#btnMenu').setAttribute('aria-expanded', 'false'); }
  fit();
  if (st.pos >= S.length) st.pos = 0;
  const resumeAt = st.pos, SU = U.start;
  // A first click is needed before a browser will play sound, so the course opens behind a short start card.
  slide.className = 'slide dark cover'; slide.innerHTML = `${bg('faces')}<div class="shade" style="background:rgba(7,15,27,.72)"></div>`;
  if (resumeAt > 0) modal(SU.back_title, `<p>${esc(SU.back_body)}</p><p class="small">${esc(S[resumeAt].menu)}, ${esc(lessonName(S[resumeAt].lesson))}</p>`, [[SU.restart, () => { st.pos = 0; save(); render(true); }], [SU.resume, () => { st.pos = resumeAt; save(); render(true); }]]);
  else modal(SU.title, `${C.brand ? `<img class="startlockup" src="${C.brand.lockup}" alt="${esc(C.brand.alt)}">` : ''}<p>${esc(SU.body)}</p>`, [[SU.begin, () => render(true)]]);
  setTimeout(fit, 50);
})();
