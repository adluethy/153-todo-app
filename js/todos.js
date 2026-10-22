/* To-do-Liste: erledigt, löschen, Text ändern, sortieren per Ziehen, Termin. */
(function () {
  'use strict';

  const list = document.getElementById('todo-list');
  const pane = document.getElementById('todo-pane');
  const emptyMsg = document.getElementById('todo-empty');
  const form = document.getElementById('todo-form');
  const textInput = document.getElementById('todo-text');
  const dateInput = document.getElementById('todo-date');
  const dateToggle = document.getElementById('todo-date-toggle');
  const formWho = document.getElementById('todo-who');

  // Für wen gilt die nächste neue Aufgabe? (Schalter im Eingabefeld; null = nur wer sie erfasst)
  let formAssignees = null;

  // Während gezogen oder bearbeitet wird, nicht neu zeichnen (sonst springt alles)
  let dragging = false;
  let editing = false;
  let pendingRender = false;
  let openEditor = null;

  /* ---------- Datum ---------- */

  const pad = n => String(n).padStart(2, '0');
  const dayFmt = new Intl.DateTimeFormat('de-CH', { weekday: 'short', day: 'numeric', month: 'numeric' });
  const timeFmt = new Intl.DateTimeFormat('de-CH', { hour: '2-digit', minute: '2-digit' });

  function toInputValue(d) {
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
  }

  function inputToIso(value) {
    if (!value) return null;
    const d = new Date(value); // "2026-10-22T09:00" wird als Ortszeit gelesen
    return isNaN(d) ? null : d.toISOString();
  }

  function tomorrowNine() {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    d.setHours(9, 0, 0, 0);
    return d;
  }

  function sameDay(a, b) {
    return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
  }

  function formatDue(d) {
    const now = new Date();
    const tomorrow = new Date();
    tomorrow.setDate(now.getDate() + 1);
    let day = dayFmt.format(d);
    if (sameDay(d, now)) day = 'Heute';
    else if (sameDay(d, tomorrow)) day = 'Morgen';
    return `${day} ${timeFmt.format(d)}`;
  }

  /* ---------- Schalter A/B: für wen gilt die Aufgabe ---------- */

  // Liste umschalten; mindestens eine Person bleibt drin. Reihenfolge wie in der Personenliste.
  function toggleAssignee(current, userId) {
    const set = new Set(current);
    if (set.has(userId)) {
      if (set.size === 1) {
        App.toast('Mindestens eine Person muss eingeschaltet sein');
        return null;
      }
      set.delete(userId);
    } else {
      set.add(userId);
    }
    return Store.people().map(p => p.userId).filter(id => set.has(id));
  }

  // Zwei kleine Knöpfe "A" und "B"; eingeschaltet = die Aufgabe gilt für diese Person
  function whoButtons(selected, onChange) {
    const wrap = document.createElement('span');
    wrap.className = 'todo-who';
    Store.people().forEach(p => {
      const on = selected.includes(p.userId);
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'who-btn' + (on ? ' on' : '');
      b.textContent = p.initial;
      b.setAttribute('aria-pressed', String(on));
      b.title = on ? `Gilt für ${p.name} (antippen zum Ausschalten)` : `Gilt nicht für ${p.name} (antippen zum Einschalten)`;
      b.addEventListener('click', e => {
        e.stopPropagation();
        const next = toggleAssignee(selected, p.userId);
        if (next) onChange(next);
      });
      wrap.append(b);
    });
    return wrap;
  }

  function renderFormWho() {
    const me = Store.me();
    const people = Store.people();
    const ids = people.map(p => p.userId);
    if (!people.length || !me) {
      formWho.hidden = true;
      formWho.replaceChildren();
      return;
    }
    const selected = (formAssignees || [me]).filter(id => ids.includes(id));
    formWho.replaceChildren(...whoButtons(selected.length ? selected : [me], next => {
      formAssignees = next;
      renderFormWho();
    }).childNodes);
    formWho.hidden = false;
  }

  /* ---------- Zeichnen ---------- */

  function render() {
    renderFormWho();
    if (dragging || editing) {
      pendingRender = true;
      return;
    }
    pendingRender = false;
    const items = Store.todos().slice().sort((a, b) => a.order - b.order);
    list.replaceChildren(...items.map(buildRow));
    emptyMsg.hidden = items.length > 0;
  }

  function checkbox(className, checked, label) {
    const cb = document.createElement('input');
    cb.type = 'checkbox';
    cb.className = className;
    cb.checked = checked;
    cb.title = label;
    cb.setAttribute('aria-label', label);
    return cb;
  }

  function buildRow(t) {
    const li = document.createElement('li');
    li.className = 'todo' + (t.done ? ' done' : '');
    li.dataset.id = t.id;

    const grip = document.createElement('span');
    grip.className = 'grip';
    grip.title = 'Ziehen zum Sortieren';
    grip.innerHTML = Icon('grip');
    grip.addEventListener('pointerdown', e => startDrag(e, li));

    const done = checkbox('cb-done', t.done, 'Erledigt');
    done.addEventListener('change', () => Store.updateTodo(t.id, { done: done.checked }));

    // Löschen geht erst, wenn die Aufgabe erledigt ist
    const del = checkbox('cb-del' + (t.done ? '' : ' locked'), false,
      t.done ? 'Löschen' : 'Löschen (zuerst als erledigt ankreuzen)');
    del.addEventListener('click', e => {
      if (!t.done) {
        e.preventDefault();
        App.toast('Zuerst als erledigt ankreuzen');
      }
    });
    del.addEventListener('change', () => {
      if (!del.checked) return;
      li.classList.add('removing');
      setTimeout(() => Store.deleteTodo(t.id), 200);
    });

    const body = document.createElement('div');
    body.className = 'todo-body';
    const line = document.createElement('div');
    line.className = 'todo-line';
    // Schalter A/B = für wen die Aufgabe gilt (und wer erinnert wird)
    if (Store.people().length) {
      const selected = t.assignees && t.assignees.length ? t.assignees : [t.userId];
      const who = whoButtons(selected, next => Store.updateTodo(t.id, { assignees: next }));
      const by = Store.person(t.userId);
      if (by) who.querySelectorAll('button').forEach(b => { b.title += ' · erfasst von ' + by.name; });
      line.append(who);
    }
    const text = document.createElement('span');
    text.className = 'todo-text';
    text.textContent = t.text;
    text.title = 'Klicken zum Ändern';
    text.addEventListener('click', () => startEdit(text, t));
    line.append(text);
    body.append(line);

    let calSlot;
    if (t.dueAt) {
      const d = new Date(t.dueAt);
      const now = new Date();
      const due = document.createElement('button');
      due.type = 'button';
      due.className = 'due';
      if (!t.done && d < now) due.classList.add('overdue');
      else if (!t.done && sameDay(d, now)) due.classList.add('today');
      due.title = 'Termin ändern';
      due.innerHTML = Icon('calendar');
      due.append(formatDue(d));
      // Glocke: Erinnerungen 1 Tag und 2 Std. vorher stehen noch aus
      if (!t.done && d > now) {
        due.insertAdjacentHTML('beforeend', Icon('bell'));
        due.title = 'Termin ändern · Erinnerung 1 Tag und 2 Std. vorher';
      }
      due.addEventListener('click', () => openDateEditor(li, t));
      body.append(due);
      calSlot = document.createElement('span');
    } else {
      calSlot = document.createElement('button');
      calSlot.type = 'button';
      calSlot.className = 'icon-btn cal-btn';
      calSlot.title = 'Termin hinzufügen';
      calSlot.setAttribute('aria-label', 'Termin hinzufügen');
      calSlot.innerHTML = Icon('calendar');
      calSlot.addEventListener('click', () => openDateEditor(li, t));
    }

    li.append(grip, done, del, body, calSlot);
    return li;
  }

  /* ---------- Text ändern ---------- */

  function startEdit(span, t) {
    if (editing || dragging) return;
    editing = true;
    try {
      span.contentEditable = 'plaintext-only';
    } catch (err) {
      span.contentEditable = 'true';
    }
    span.focus();
    const range = document.createRange();
    range.selectNodeContents(span);
    range.collapse(false);
    const sel = window.getSelection();
    sel.removeAllRanges();
    sel.addRange(range);

    let finished = false;
    const finish = save => {
      if (finished) return;
      finished = true;
      span.removeEventListener('keydown', onKey);
      span.removeEventListener('blur', onBlur);
      span.contentEditable = 'false';
      editing = false;
      const value = span.textContent.replace(/\s+/g, ' ').trim();
      if (save && value && value !== t.text) {
        Store.updateTodo(t.id, { text: value });
      } else {
        span.textContent = t.text;
        if (pendingRender) render();
      }
    };
    const onKey = e => {
      if (e.key === 'Enter') {
        e.preventDefault();
        finish(true);
      } else if (e.key === 'Escape') {
        finish(false);
      }
    };
    const onBlur = () => finish(true);
    span.addEventListener('keydown', onKey);
    span.addEventListener('blur', onBlur);
  }

  /* ---------- Termin ändern ---------- */

  function smallButton(label, primary) {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'btn btn-small' + (primary ? ' btn-primary' : '');
    b.textContent = label;
    return b;
  }

  function openDateEditor(li, t) {
    closeDateEditor();
    editing = true;

    const box = document.createElement('div');
    box.className = 'date-editor';
    const input = document.createElement('input');
    input.type = 'datetime-local';
    input.setAttribute('aria-label', 'Termin');
    input.value = toInputValue(t.dueAt ? new Date(t.dueAt) : tomorrowNine());

    const save = smallButton('Speichern', true);
    const cancel = smallButton('Abbrechen');
    save.addEventListener('click', () => {
      const iso = inputToIso(input.value);
      closeDateEditor();
      if (iso) Store.updateTodo(t.id, { dueAt: iso });
    });
    cancel.addEventListener('click', closeDateEditor);
    input.addEventListener('keydown', e => {
      if (e.key === 'Enter') save.click();
      if (e.key === 'Escape') closeDateEditor();
    });

    box.append(input, save);
    if (t.dueAt) {
      const remove = smallButton('Termin entfernen');
      remove.addEventListener('click', () => {
        closeDateEditor();
        Store.updateTodo(t.id, { dueAt: null });
      });
      box.append(remove);
    }
    box.append(cancel);

    li.append(box);
    openEditor = box;
    input.focus();
  }

  function closeDateEditor() {
    if (!openEditor) return;
    openEditor.remove();
    openEditor = null;
    editing = false;
    if (pendingRender) render();
  }

  /* ---------- Sortieren per Ziehen (Maus und Finger) ---------- */

  function startDrag(e, li) {
    if (e.button !== 0 || editing) return;
    e.preventDefault();
    const grip = e.currentTarget;
    const rect = li.getBoundingClientRect();
    const offsetY = e.clientY - rect.top;

    const placeholder = document.createElement('li');
    placeholder.className = 'todo-placeholder';
    placeholder.style.height = rect.height + 'px';
    list.insertBefore(placeholder, li);

    Object.assign(li.style, {
      position: 'fixed',
      left: rect.left + 'px',
      top: rect.top + 'px',
      width: rect.width + 'px',
      zIndex: 50,
    });
    li.classList.add('dragging');
    dragging = true;
    grip.setPointerCapture(e.pointerId);

    const onMove = ev => {
      li.style.top = (ev.clientY - offsetY) + 'px';

      // Platzhalter vor die erste Zeile setzen, deren Mitte unter dem Finger liegt
      const rows = [...list.children].filter(c => c !== li && c !== placeholder);
      const before = rows.find(r => {
        const b = r.getBoundingClientRect();
        return ev.clientY < b.top + b.height / 2;
      });
      if (before) {
        if (placeholder.nextElementSibling !== before) list.insertBefore(placeholder, before);
      } else if (list.lastElementChild !== placeholder) {
        list.appendChild(placeholder);
      }

      // Liste mitscrollen, wenn man an den Rand zieht
      const p = pane.getBoundingClientRect();
      if (ev.clientY < p.top + 40) pane.scrollTop -= 12;
      else if (ev.clientY > p.bottom - 40) pane.scrollTop += 12;
    };

    const onUp = () => {
      grip.removeEventListener('pointermove', onMove);
      grip.removeEventListener('pointerup', onUp);
      grip.removeEventListener('pointercancel', onUp);
      placeholder.replaceWith(li);
      li.removeAttribute('style');
      li.classList.remove('dragging');
      dragging = false;
      Store.reorderTodos([...list.children].map(c => c.dataset.id));
      if (pendingRender) render();
    };

    grip.addEventListener('pointermove', onMove);
    grip.addEventListener('pointerup', onUp);
    grip.addEventListener('pointercancel', onUp);
  }

  /* ---------- Neue Aufgabe ---------- */

  dateToggle.addEventListener('click', () => {
    const show = dateInput.hidden;
    dateInput.hidden = !show;
    dateToggle.classList.toggle('active', show);
    dateToggle.setAttribute('aria-pressed', String(show));
    if (show) {
      if (!dateInput.value) dateInput.value = toInputValue(tomorrowNine());
      dateInput.focus();
    } else {
      dateInput.value = '';
    }
  });

  form.addEventListener('submit', e => {
    e.preventDefault();
    const text = textInput.value.replace(/\s+/g, ' ').trim();
    if (!text) {
      textInput.focus();
      return;
    }
    const dueAt = dateInput.hidden ? null : inputToIso(dateInput.value);
    Store.addTodo(text, dueAt, null, formAssignees);
    formAssignees = null; // nächste Aufgabe wieder nur für die eigene Person
    renderFormWho();
    textInput.value = '';
    dateInput.value = '';
    dateInput.hidden = true;
    dateToggle.classList.remove('active');
    dateToggle.setAttribute('aria-pressed', 'false');
    textInput.focus();
  });

  Store.subscribe(topic => {
    if (topic === 'todos' || topic === 'all' || topic === 'people') render();
  });

  // Jede Minute neu zeichnen, damit „Heute“ und überfällige Termine stimmen
  setInterval(() => {
    if (!document.hidden) render();
  }, 60000);

  render();
})();
