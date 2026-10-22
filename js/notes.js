/* Zettel: Ideen (gelb) und Infos (blau). Verschieben, Grösse ändern,
   Schliessen = in die Ablage, Idee als Aufgabe übernehmen.
   Auf dem Handy werden die Zettel als Stapel angezeigt (siehe style.css). */
(function () {
  'use strict';

  const board = document.getElementById('board');
  const boardEmpty = document.getElementById('board-empty');
  const archiveBtn = document.getElementById('archive-open');
  const archiveCount = document.getElementById('archive-count');
  const archivePanel = document.getElementById('archive');
  const archiveBody = document.getElementById('archive-body');
  const archiveClose = document.getElementById('archive-close');
  const archiveTitle = document.getElementById('archive-title');
  const backdrop = document.getElementById('archive-backdrop');
  const EMPTY_HINT = 'Leg mit „Neue Idee“ oder „Neue Info“ einen an.';

  const stackQuery = window.matchMedia('(max-width: 760px)');
  const isStack = () => stackQuery.matches;

  const MIN_W = 160;
  const MIN_H = 110;
  const TYPES = {
    idee: { label: 'Idee', plural: 'Ideen', icon: 'bulb', placeholder: 'Idee notieren …' },
    info: { label: 'Info', plural: 'Infos', icon: 'info', placeholder: 'Info notieren …' },
  };

  const els = new Map(); // Zettel-ID -> DOM-Element
  const clamp = (v, min, max) => Math.min(Math.max(v, min), max);
  const findNote = id => Store.notes().find(n => n.id === id);

  /* ---------- Zeichnen ---------- */

  function render(rebuild) {
    if (rebuild) {
      els.forEach(el => el.remove());
      els.clear();
    }
    // Nur die Zettel des gewählten Reiters (ohne Reiter: alle); neueste zuerst (Stapel auf dem Handy)
    const layer = Layers.current();
    const mine = Store.notes().filter(n => Layers.noteVisible(n));
    const active = mine
      .filter(n => !n.archived)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    const ids = new Set(active.map(n => n.id));

    els.forEach((el, id) => {
      if (!ids.has(id)) {
        el.remove();
        els.delete(id);
      }
    });

    active.forEach((n, i) => {
      let el = els.get(n.id);
      if (!el) {
        el = build(n);
        els.set(n.id, el);
        board.append(el);
      } else {
        const ta = el.querySelector('textarea');
        if (document.activeElement !== ta && ta.value !== n.text) ta.value = n.text;
      }
      el.style.order = String(i);
      el.querySelector('.note-move').hidden = !layer;
      showAuthor(el, n);
      place(el, n);
    });

    let where = '';
    if (layer === Layers.GEMMEL) where = ' in Gemmel';
    else if (layer) where = ' bei ' + Layers.name(layer);
    boardEmpty.textContent = `Noch keine Zettel${where}. ${EMPTY_HINT}`;
    boardEmpty.hidden = active.length > 0;
    archiveCount.textContent = String(mine.length - active.length);
    archiveTitle.textContent = layer ? 'Ablage · ' + Layers.name(layer) : 'Ablage';
    if (!archivePanel.hidden) renderArchive();
  }

  // Position (Anteil der Fläche) und Grösse (Pixel) auf die aktuelle Fläche umrechnen
  function place(el, n) {
    const bw = board.clientWidth;
    const bh = board.clientHeight;
    if (!bw || !bh) return; // Fläche gerade unsichtbar (Handy, To-do-Ansicht)
    const w = clamp(n.w, MIN_W, Math.max(MIN_W, bw));
    const h = clamp(n.h, MIN_H, Math.max(MIN_H, bh));
    el.style.width = w + 'px';
    el.style.height = h + 'px';
    el.style.left = clamp(n.x * bw, 0, Math.max(0, bw - w)) + 'px';
    el.style.top = clamp(n.y * bh, 0, Math.max(0, bh - h)) + 'px';
    el.style.zIndex = String(n.z);
  }

  // Name unten am Zettel: wer ihn geschrieben hat
  function showAuthor(el, n) {
    const who = Store.person(n.userId);
    const by = el.querySelector('.note-by');
    by.textContent = who ? who.name : '';
    by.title = who ? 'Geschrieben von ' + who.name : '';
    by.hidden = !who;
    el.classList.toggle('has-by', !!who);
  }

  function noteButton(icon, label, onClick) {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'note-btn';
    b.title = label;
    b.setAttribute('aria-label', label);
    b.innerHTML = Icon(icon);
    b.addEventListener('click', onClick);
    return b;
  }

  function build(n) {
    const type = TYPES[n.type] || TYPES.idee;
    const id = n.id;

    const el = document.createElement('div');
    el.className = 'note note-' + n.type;
    el.dataset.id = id;

    const head = document.createElement('div');
    head.className = 'note-head';
    const label = document.createElement('span');
    label.className = 'note-label';
    label.innerHTML = Icon(type.icon);
    label.append(type.label);
    head.append(label);

    const ta = document.createElement('textarea');
    ta.className = 'note-text';
    ta.value = n.text;
    ta.placeholder = type.placeholder;
    ta.setAttribute('aria-label', type.label);
    ta.addEventListener('input', () => Store.updateNote(id, { text: ta.value }, true));

    if (n.type === 'idee') {
      head.append(noteButton('toTodo', 'Als Aufgabe übernehmen', () => convert(id, ta)));
    }
    const move = noteButton('move', 'In einen anderen Reiter verschieben', e => openMoveMenu(id, e.currentTarget));
    move.classList.add('note-move');
    move.setAttribute('aria-haspopup', 'menu');
    move.hidden = !Layers.current();
    head.append(move);
    head.append(noteButton('x', 'Schliessen (in die Ablage)', () => closeNote(id, el)));

    const by = document.createElement('div');
    by.className = 'note-by';
    by.hidden = true;

    const resize = document.createElement('span');
    resize.className = 'note-resize';
    resize.title = 'Grösse ändern';
    resize.innerHTML = Icon('resize');

    el.append(head, ta, by, resize);

    el.addEventListener('pointerdown', () => bringToFront(id, el));
    head.addEventListener('pointerdown', e => startMove(e, id, el));
    resize.addEventListener('pointerdown', e => startResize(e, id, el));
    return el;
  }

  /* ---------- Aktionen ---------- */

  function bringToFront(id, el) {
    const n = findNote(id);
    const top = Store.maxZ();
    if (!n || n.z >= top) return;
    Store.updateNote(id, { z: top + 1 }, true);
    el.style.zIndex = String(top + 1);
  }

  function pulseArchive() {
    archiveBtn.classList.remove('pulse');
    void archiveBtn.offsetWidth; // Animation neu starten
    archiveBtn.classList.add('pulse');
  }

  function closeNote(id, el) {
    el.classList.add('closing');
    setTimeout(() => {
      Store.archiveNote(id);
      pulseArchive();
    }, 150);
  }

  function convert(id, ta) {
    const text = ta.value.replace(/\s+/g, ' ').trim();
    if (!text) {
      App.toast('Der Zettel ist noch leer');
      ta.focus();
      return;
    }
    const note = findNote(id);
    // Die Aufgabe kommt in den Reiter der Idee (Gemmel = für beide); erfasst hat sie, wer die Idee hatte.
    // Ohne Reiter gilt sie wie bisher für die Person, die die Idee hatte.
    const layer = Layers.current() && note ? Layers.spaceOf(note) : null;
    Store.addTodo(text, null, note && note.userId, Layers.assigneesFor(layer));
    Store.archiveNote(id, true);
    pulseArchive();
    App.toast(layer ? `Als Aufgabe ${Layers.forWhom(layer)} übernommen` : 'Als Aufgabe übernommen');
  }

  /* ---------- Zettel in einen anderen Reiter verschieben ---------- */

  let moveMenu = null;

  function closeMoveMenu() {
    if (!moveMenu) return;
    moveMenu.remove();
    moveMenu = null;
    document.removeEventListener('pointerdown', onPointerOutside, true);
  }

  function onPointerOutside(e) {
    // Der Knopf selbst schaltet das Menü per Klick um, darum hier nicht schliessen
    if (moveMenu && !moveMenu.contains(e.target) && !e.target.closest('.note-move')) closeMoveMenu();
  }

  function openMoveMenu(id, button) {
    const sameNote = moveMenu && moveMenu.dataset.id === id;
    closeMoveMenu();
    const n = findNote(id);
    if (sameNote || !n) return; // zweiter Klick schliesst das Menü

    const menu = document.createElement('div');
    menu.className = 'move-menu';
    menu.dataset.id = id;
    menu.setAttribute('role', 'menu');
    const title = document.createElement('p');
    title.textContent = 'Verschieben nach';
    menu.append(title);

    const from = Layers.spaceOf(n);
    Layers.list().filter(l => l.key !== from).forEach(l => {
      const b = document.createElement('button');
      b.type = 'button';
      b.setAttribute('role', 'menuitem');
      b.append(Layers.badge(l), l.name);
      b.addEventListener('click', () => {
        closeMoveMenu();
        moveNote(id, l);
      });
      menu.append(b);
    });
    document.body.append(menu);

    // Unter dem Knopf, rechtsbündig, immer ganz im Fenster
    const r = button.getBoundingClientRect();
    const left = clamp(r.right - menu.offsetWidth, 8, window.innerWidth - menu.offsetWidth - 8);
    let top = r.bottom + 4;
    if (top + menu.offsetHeight > window.innerHeight - 8) top = Math.max(8, r.top - menu.offsetHeight - 4);
    menu.style.left = left + 'px';
    menu.style.top = top + 'px';

    moveMenu = menu;
    document.addEventListener('pointerdown', onPointerOutside, true);
    menu.querySelector('button').focus();
  }

  function moveNote(id, layer) {
    const done = () => {
      Store.updateNote(id, { space: Layers.spaceFor(layer.key), z: Store.maxZ() + 1 });
      App.toast(layer.all ? 'Zettel liegt jetzt in Gemmel' : `Zettel liegt jetzt bei ${layer.name}`);
    };
    const el = els.get(id);
    if (!el) return done();
    el.classList.add('closing');
    setTimeout(done, 150);
  }

  function addNote(type) {
    // Neue Zettel leicht versetzt, damit sie nicht genau übereinander liegen; sie kommen in den gewählten Reiter
    const k = Store.notes().filter(n => !n.archived && n.type === type && Layers.noteVisible(n)).length % 6;
    const x = (type === 'idee' ? 0.03 : 0.42) + k * 0.025;
    const y = 0.04 + k * 0.06;
    const note = Store.addNote(type, { x, y }, Layers.spaceFor(Layers.current()));
    const el = els.get(note.id);
    if (!el) return;
    if (isStack()) board.scrollTop = 0;
    el.querySelector('textarea').focus();
  }

  /* ---------- Verschieben und Grösse ändern ---------- */

  function track(e, handle, onMove, onEnd) {
    handle.setPointerCapture(e.pointerId);
    const up = () => {
      handle.removeEventListener('pointermove', onMove);
      handle.removeEventListener('pointerup', up);
      handle.removeEventListener('pointercancel', up);
      onEnd();
    };
    handle.addEventListener('pointermove', onMove);
    handle.addEventListener('pointerup', up);
    handle.addEventListener('pointercancel', up);
  }

  function startMove(e, id, el) {
    if (isStack() || e.button !== 0 || e.target.closest('button')) return;
    e.preventDefault();
    const bw = board.clientWidth;
    const bh = board.clientHeight;
    const w = el.offsetWidth;
    const h = el.offsetHeight;
    const startX = e.clientX;
    const startY = e.clientY;
    const startLeft = el.offsetLeft;
    const startTop = el.offsetTop;
    let left = startLeft;
    let top = startTop;
    el.classList.add('moving');

    track(e, e.currentTarget, ev => {
      left = clamp(startLeft + ev.clientX - startX, 0, Math.max(0, bw - w));
      top = clamp(startTop + ev.clientY - startY, 0, Math.max(0, bh - h));
      el.style.left = left + 'px';
      el.style.top = top + 'px';
    }, () => {
      el.classList.remove('moving');
      Store.updateNote(id, { x: left / bw, y: top / bh }, true);
    });
  }

  function startResize(e, id, el) {
    if (isStack() || e.button !== 0) return;
    e.preventDefault();
    e.stopPropagation();
    const bw = board.clientWidth;
    const bh = board.clientHeight;
    const startX = e.clientX;
    const startY = e.clientY;
    const startW = el.offsetWidth;
    const startH = el.offsetHeight;
    let w = startW;
    let h = startH;
    el.classList.add('moving');

    track(e, e.currentTarget, ev => {
      w = clamp(startW + ev.clientX - startX, MIN_W, Math.max(MIN_W, bw - el.offsetLeft));
      h = clamp(startH + ev.clientY - startY, MIN_H, Math.max(MIN_H, bh - el.offsetTop));
      el.style.width = w + 'px';
      el.style.height = h + 'px';
    }, () => {
      el.classList.remove('moving');
      Store.updateNote(id, { w, h }, true);
    });
  }

  /* ---------- Ablage ---------- */

  const dateFmt = new Intl.DateTimeFormat('de-CH', { day: 'numeric', month: 'numeric', year: 'numeric' });

  function archiveButton(icon, label, onClick) {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'btn btn-small';
    b.innerHTML = Icon(icon);
    b.append(label);
    b.addEventListener('click', onClick);
    return b;
  }

  function archiveItem(n) {
    const item = document.createElement('div');
    item.className = 'archive-item note-' + n.type;

    const text = document.createElement('p');
    text.className = 'archive-text';
    const content = (n.text || '').trim();
    text.textContent = content || '(leer)';
    if (!content) text.classList.add('is-empty');

    const meta = document.createElement('div');
    meta.className = 'archive-meta';
    const who = Store.person(n.userId);
    meta.textContent = (who ? who.name + ' · ' : '') +
      'Abgelegt am ' + dateFmt.format(new Date(n.archivedAt || n.updatedAt)) +
      (n.convertedAt ? ' · als Aufgabe übernommen' : '');

    const actions = document.createElement('div');
    actions.className = 'archive-actions';
    actions.append(
      archiveButton('restore', 'Wieder öffnen', () => {
        Store.restoreNote(n.id);
        App.toast('Zettel wieder geöffnet');
      }),
      archiveButton('trash', 'Löschen', () => {
        if (confirm('Diesen Zettel endgültig löschen?')) Store.deleteNote(n.id);
      }),
    );

    item.append(text, meta, actions);
    return item;
  }

  function renderArchive() {
    const archived = Store.notes()
      .filter(n => n.archived && Layers.noteVisible(n))
      .sort((a, b) => (b.archivedAt || '').localeCompare(a.archivedAt || ''));
    archiveBody.replaceChildren();

    if (!archived.length) {
      const p = document.createElement('p');
      p.className = 'empty';
      p.textContent = 'Die Ablage ist leer. Geschlossene Zettel landen hier.';
      archiveBody.append(p);
      return;
    }

    Object.keys(TYPES).forEach(type => {
      const items = archived.filter(n => n.type === type);
      if (!items.length) return;
      const h = document.createElement('h3');
      h.textContent = `${TYPES[type].plural} (${items.length})`;
      archiveBody.append(h, ...items.map(archiveItem));
    });
  }

  function openArchive() {
    renderArchive();
    archivePanel.hidden = false;
    backdrop.hidden = false;
    archiveClose.focus();
  }

  function closeArchive() {
    archivePanel.hidden = true;
    backdrop.hidden = true;
  }

  /* ---------- Verknüpfen ---------- */

  document.getElementById('add-idee').addEventListener('click', () => addNote('idee'));
  document.getElementById('add-info').addEventListener('click', () => addNote('info'));
  archiveBtn.addEventListener('click', openArchive);
  archiveClose.addEventListener('click', closeArchive);
  backdrop.addEventListener('click', closeArchive);
  document.addEventListener('keydown', e => {
    if (e.key !== 'Escape') return;
    if (moveMenu) closeMoveMenu();
    else if (!archivePanel.hidden) closeArchive();
  });
  board.addEventListener('scroll', closeMoveMenu);

  let raf = 0;
  window.addEventListener('resize', () => {
    closeMoveMenu();
    cancelAnimationFrame(raf);
    raf = requestAnimationFrame(() => render());
  });

  Store.subscribe(topic => {
    if (topic === 'notes' || topic === 'people') render();
    if (topic === 'all') render(true);
  });

  // Anderer Reiter gewählt
  Layers.subscribe(() => {
    closeMoveMenu();
    render();
  });

  window.Notes = { render };
  render();
})();
