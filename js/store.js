/* Datenspeicher.
   Phase 1: speichert im Browser (localStorage).
   Phase 2: nur diese Datei wird auf die Online-Datenbank (Supabase) umgestellt,
   der Rest der App bleibt gleich. */
(function () {
  'use strict';

  const KEY = 'todo-zettel.v1';
  const listeners = new Set();
  let saveTimer = null;
  let data = load();

  function emptyData() {
    return { version: 1, todos: [], notes: [] };
  }

  function normalize(raw) {
    const out = emptyData();
    if (raw && Array.isArray(raw.todos)) out.todos = raw.todos.filter(t => t && t.id);
    if (raw && Array.isArray(raw.notes)) out.notes = raw.notes.filter(n => n && n.id);
    return out;
  }

  function load() {
    try {
      const raw = localStorage.getItem(KEY);
      return raw ? normalize(JSON.parse(raw)) : emptyData();
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

  function uid() {
    try {
      if (window.crypto && crypto.randomUUID) return crypto.randomUUID();
    } catch (err) { /* z.B. unsicherer Kontext */ }
    return Date.now().toString(36) + Math.random().toString(36).slice(2, 10);
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
      changed('todos');
      return todo;
    },

    updateTodo(id, patch, silent) {
      const todo = findTodo(id);
      if (!todo) return;
      Object.assign(todo, patch, { updatedAt: nowIso() });
      changed('todos', silent);
    },

    deleteTodo(id) {
      data.todos = data.todos.filter(t => t.id !== id);
      changed('todos');
    },

    reorderTodos(ids) {
      ids.forEach((id, i) => {
        const todo = findTodo(id);
        if (todo) todo.order = i;
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
      changed('notes');
      return note;
    },

    updateNote(id, patch, silent) {
      const note = findNote(id);
      if (!note) return;
      Object.assign(note, patch, { updatedAt: nowIso() });
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
      changed('notes');
    },

    /* ---------- Sicherung ---------- */

    exportData() {
      saveNow();
      return JSON.parse(JSON.stringify(data));
    },

    importData(raw) {
      data = normalize(raw);
      saveNow();
      emit('all');
    },
  };
})();
