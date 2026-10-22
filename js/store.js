/* Lokaler Datenspeicher (localStorage). Die App arbeitet immer mit diesen Daten,
   auch ohne Internet. Jede Änderung wird an sync.js gemeldet ("dirty"),
   das sie in die Online-Datenbank hochlädt. */
(function () {
  'use strict';

  const KEY = 'todo-zettel.v1';
  const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  const listeners = new Set();
  let onDirty = () => {};
  let saveTimer = null;
  let data = load();

  function emptyData() {
    return { version: 1, todos: [], notes: [] };
  }

  function uid() {
    try {
      if (window.crypto && crypto.randomUUID) return crypto.randomUUID();
    } catch (err) { /* z.B. unsicherer Kontext */ }
    const b = crypto.getRandomValues(new Uint8Array(16));
    b[6] = (b[6] & 0x0f) | 0x40;
    b[8] = (b[8] & 0x3f) | 0x80;
    const h = Array.from(b, x => x.toString(16).padStart(2, '0')).join('');
    return `${h.slice(0, 8)}-${h.slice(8, 12)}-${h.slice(12, 16)}-${h.slice(16, 20)}-${h.slice(20)}`;
  }

  // Liefert saubere Daten; ungültige IDs werden ersetzt (die Datenbank braucht UUIDs)
  function normalize(raw) {
    const out = emptyData();
    if (raw && Array.isArray(raw.todos)) out.todos = raw.todos.filter(t => t && t.id);
    if (raw && Array.isArray(raw.notes)) out.notes = raw.notes.filter(n => n && n.id);
    let fixed = 0;
    out.todos.concat(out.notes).forEach(item => {
      if (!UUID_RE.test(item.id)) {
        item.id = uid();
        fixed++;
      }
    });
    return { data: out, fixed };
  }

  function load() {
    try {
      const raw = localStorage.getItem(KEY);
      if (!raw) return emptyData();
      const result = normalize(JSON.parse(raw));
      if (result.fixed) localStorage.setItem(KEY, JSON.stringify(result.data));
      return result.data;
    } catch (err) {
      console.error('Daten konnten nicht geladen werden', err);
      return emptyData();
    }
  }

  function saveNow() {
    clearTimeout(saveTimer);
    saveTimer = null;
    try {
      localStorage.setItem(KEY, JSON.stringify(data));
    } catch (err) {
      console.error('Daten konnten nicht gespeichert werden', err);
      if (window.App) window.App.toast('Speichern fehlgeschlagen');
    }
  }

  function scheduleSave() {
    clearTimeout(saveTimer);
    saveTimer = setTimeout(saveNow, 300);
  }

  function emit(topic) {
    listeners.forEach(fn => fn(topic));
  }

  // silent = speichern, aber nicht neu zeichnen (beim Tippen, Verschieben, Sortieren)
  function changed(topic, silent) {
    scheduleSave();
    if (!silent) emit(topic);
  }

  // An sync.js melden: dieser Eintrag muss hochgeladen bzw. online gelöscht werden
  function dirty(table, id, op) {
    onDirty(table, id, op);
  }

  const nowIso = () => new Date().toISOString();
  const findTodo = id => data.todos.find(t => t.id === id);
  const findNote = id => data.notes.find(n => n.id === id);
  const maxZ = () => data.notes.reduce((m, n) => Math.max(m, n.z || 0), 0);

  window.addEventListener('pagehide', () => { if (saveTimer) saveNow(); });
  document.addEventListener('visibilitychange', () => {
    if (document.hidden && saveTimer) saveNow();
  });

  // Änderungen aus einem anderen Tab übernehmen
  window.addEventListener('storage', e => {
    if (e.key !== KEY) return;
    data = load();
    emit('all');
  });

  window.Store = {
    todos: () => data.todos,
    notes: () => data.notes,
    maxZ,

    subscribe(fn) {
      listeners.add(fn);
      return () => listeners.delete(fn);
    },

    /* ---------- Aufgaben ---------- */

    addTodo(text, dueAt) {
      const minOrder = data.todos.reduce((m, t) => Math.min(m, t.order), 0);
      const todo = {
        id: uid(),
        text,
        done: false,
        dueAt: dueAt || null,
        order: minOrder - 1, // neue Aufgaben kommen nach oben
        createdAt: nowIso(),
        updatedAt: nowIso(),
      };
      data.todos.push(todo);
      dirty('todos', todo.id, 'upsert');
      changed('todos');
      return todo;
    },

    updateTodo(id, patch, silent) {
      const todo = findTodo(id);
      if (!todo) return;
      Object.assign(todo, patch, { updatedAt: nowIso() });
      dirty('todos', id, 'upsert');
      changed('todos', silent);
    },

    deleteTodo(id) {
      data.todos = data.todos.filter(t => t.id !== id);
      dirty('todos', id, 'delete');
      changed('todos');
    },

    reorderTodos(ids) {
      ids.forEach((id, i) => {
        const todo = findTodo(id);
        if (!todo || todo.order === i) return;
        todo.order = i;
        todo.updatedAt = nowIso();
        dirty('todos', id, 'upsert');
      });
      changed('todos', true);
    },

    /* ---------- Zettel ---------- */

    addNote(type, pos) {
      const note = {
        id: uid(),
        type, // 'idee' oder 'info'
        text: '',
        x: pos.x, // Position als Anteil der Fläche (0–1), damit sie auf jedem Bildschirm passt
        y: pos.y,
        w: 240, // Grösse in Pixeln
        h: 190,
        z: maxZ() + 1,
        archived: false,
        archivedAt: null,
        convertedAt: null,
        createdAt: nowIso(),
        updatedAt: nowIso(),
      };
      data.notes.push(note);
      dirty('notes', note.id, 'upsert');
      changed('notes');
      return note;
    },

    updateNote(id, patch, silent) {
      const note = findNote(id);
      if (!note) return;
      Object.assign(note, patch, { updatedAt: nowIso() });
      dirty('notes', id, 'upsert');
      changed('notes', silent);
    },

    archiveNote(id, converted) {
      this.updateNote(id, {
        archived: true,
        archivedAt: nowIso(),
        convertedAt: converted ? nowIso() : null,
      });
    },

    restoreNote(id) {
      this.updateNote(id, { archived: false, archivedAt: null, convertedAt: null, z: maxZ() + 1 });
    },

    deleteNote(id) {
      data.notes = data.notes.filter(n => n.id !== id);
      dirty('notes', id, 'delete');
      changed('notes');
    },

    /* ---------- Sicherung ---------- */

    exportData() {
      saveNow();
      return JSON.parse(JSON.stringify(data));
    },

    // Ersetzt alle Daten, auch online
    importData(raw) {
      const oldIds = { todos: data.todos.map(t => t.id), notes: data.notes.map(n => n.id) };
      data = normalize(raw).data;
      ['todos', 'notes'].forEach(table => {
        const keep = new Set(data[table].map(item => item.id));
        oldIds[table].filter(id => !keep.has(id)).forEach(id => dirty(table, id, 'delete'));
        data[table].forEach(item => dirty(table, item.id, 'upsert'));
      });
      saveNow();
      emit('all');
    },

    /* ---------- Nur für sync.js ---------- */

    _sync: {
      onDirty(fn) { onDirty = fn; },
      table: name => data[name],
      setTable(name, items) { data[name] = items; },
      // Nach Änderungen von anderen Geräten: speichern und neu zeichnen
      commit(topics) {
        saveNow();
        topics.forEach(emit);
      },
      clear() {
        data = emptyData();
        saveNow();
        emit('all');
      },
    },
  };
})();
