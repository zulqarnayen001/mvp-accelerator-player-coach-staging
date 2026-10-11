/* SCORM layer for the M.V.P. Accelerator modules (v5, Oct 11; from the Oct 9 sample that passed in SCORM Cloud).
   Loads before player.js, in the LMS launch file (index.html) only. Finds the LMS API (SCORM 2004 first, then 1.2),
   starts the session, and gives the player window.LMS:
     state         the learner's saved state, for resume (cmi.suspend_data)
     save()        suspend data, the bookmark (cmi.location) and progress (cmi.progress_measure)
     interaction() a knowledge check answer or a choice, as cmi.interactions
     complete()    completed (Completed/Incomplete reporting, as in the Storyline test package; no score, no pass/fail)
     finish()      session time, exit mode and terminate: a finished module ends normally, an unfinished one suspends
   Outside an LMS window.LMS.on is false and the player keeps using browser storage. */
(function () {
  'use strict';
  function find(name) {
    let w = window;
    for (let i = 0; i < 12 && w; i++) { try { if (w[name]) return w[name]; } catch (e) { return null; } if (w.parent === w) break; w = w.parent; }
    try { return window.opener && window.opener[name] ? window.opener[name] : null; } catch (e) { return null; }
  }
  const a04 = find('API_1484_11'), a12 = a04 ? null : find('API');
  const v = a04 ? '2004' : (a12 ? '1.2' : null);
  const L = window.LMS = { on: false, version: v, state: null, done: false, finished: false };
  if (!v) return;
  const get = k => { try { return String((v === '2004' ? a04.GetValue(k) : a12.LMSGetValue(k)) || ''); } catch (e) { return ''; } };
  const set = (k, x) => { try { return v === '2004' ? a04.SetValue(k, String(x)) : a12.LMSSetValue(k, String(x)); } catch (e) { return 'false'; } };
  const commit = () => { try { if (v === '2004') a04.Commit(''); else a12.LMSCommit(''); } catch (e) { } };
  if (String(v === '2004' ? a04.Initialize('') : a12.LMSInitialize('')) !== 'true') return;
  L.on = true;
  const t0 = Date.now();

  // resume: the player's state from the last session
  const sd = get('cmi.suspend_data');
  if (sd) { try { L.state = JSON.parse(sd); } catch (e) { } }
  const status = get(v === '2004' ? 'cmi.completion_status' : 'cmi.core.lesson_status');
  L.done = status === 'completed' || status === 'passed';
  if (!L.done) { set(v === '2004' ? 'cmi.completion_status' : 'cmi.core.lesson_status', 'incomplete'); commit(); }

  // suspend data (interactions are sent on their own, so they stay out of it), the bookmark and progress
  let ct = null;
  const MAX = v === '2004' ? 64000 : 4096;
  L.save = (st, where, progress) => {
    const copy = Object.assign({}, st); delete copy.interactions;
    let s = JSON.stringify(copy);
    if (s.length > MAX) { delete copy.seen; s = JSON.stringify(copy); }   // the screens seen are the first thing to drop
    set('cmi.suspend_data', s.slice(0, MAX));
    if (where) set(v === '2004' ? 'cmi.location' : 'cmi.core.lesson_location', where);
    if (v === '2004' && progress != null && !L.done) set('cmi.progress_measure', Math.max(0, Math.min(1, progress)).toFixed(2));
    clearTimeout(ct); ct = setTimeout(commit, 1500);
  };
  // every interaction goes as free text with its result: a knowledge check answer (correct or incorrect), a choice
  // (neutral). SCORM 2004 'other' takes text; SCORM 1.2 has no 'other', so 'performance' carries it.
  let n = +get('cmi.interactions._count') || 0;
  const ident = x => String(x).replace(/[^A-Za-z0-9_.-]/g, '_').slice(0, 200) || 'interaction';
  L.interaction = (id, response, result, description) => {
    const p = 'cmi.interactions.' + n + '.';
    set(p + 'id', ident(id));
    if (v === '2004') {
      set(p + 'type', 'other'); set(p + 'timestamp', new Date().toISOString().slice(0, 19));
      if (description) set(p + 'description', String(description).slice(0, 250));
      set(p + 'learner_response', String(response).slice(0, 250));
      set(p + 'result', result === 'correct' || result === 'incorrect' ? result : 'neutral');
    } else {
      set(p + 'type', 'performance'); set(p + 'student_response', String(response).slice(0, 250));
      set(p + 'result', result === 'correct' ? 'correct' : (result === 'incorrect' ? 'wrong' : 'neutral'));
    }
    n++; clearTimeout(ct); ct = setTimeout(commit, 1500);
  };
  L.complete = () => {
    if (L.done) return;
    if (v === '2004') { set('cmi.progress_measure', 1); set('cmi.completion_status', 'completed'); }
    else set('cmi.core.lesson_status', 'completed');
    L.done = true; commit();
  };
  function span() {
    const s = Math.round((Date.now() - t0) / 1000), h = Math.floor(s / 3600), m = Math.floor(s % 3600 / 60), x = s % 60;
    if (v === '2004') return 'PT' + h + 'H' + m + 'M' + x + 'S';
    const p = k => String(k).padStart(2, '0'); return p(h) + ':' + p(m) + ':' + p(x);
  }
  // session time, exit mode, then terminate. A finished module asks the LMS to close it (exitAll); an unfinished one
  // is suspended (suspendAll), so the next launch resumes it.
  L.finish = () => {
    if (L.finished) return; L.finished = true; clearTimeout(ct);
    if (v === '2004') {
      set('cmi.session_time', span()); set('cmi.exit', L.done ? 'normal' : 'suspend');
      set('adl.nav.request', L.done ? 'exitAll' : 'suspendAll'); commit(); a04.Terminate('');
    } else { set('cmi.core.session_time', span()); set('cmi.core.exit', L.done ? '' : 'suspend'); commit(); a12.LMSFinish(''); }
  };
  window.addEventListener('pagehide', L.finish);
  window.addEventListener('beforeunload', L.finish);
})();
