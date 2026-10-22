/* Abgleich mit der Online-Datenbank (Supabase).
   - Die App arbeitet immer mit den lokalen Daten (store.js), auch ohne Internet.
   - Jede Änderung kommt in eine Warteschlange und wird hochgeladen, sobald es geht.
   - Änderungen von anderen Geräten kommen live (Realtime) und beim Zurückkehren in die App. */
(function () {
  'use strict';

  const OUTBOX_KEY = 'todo-zettel.outbox.v1';
  const USER_KEY = 'todo-zettel.user';
  const TABLES = ['todos', 'notes'];
  const cfg = window.APP_CONFIG || {};

  const statusEl = document.getElementById('sync-status');
  const loginEl = document.getElementById('login');
  const loginForm = document.getElementById('login-form');
  const loginEmail = document.getElementById('login-email');
  const loginPassword = document.getElementById('login-password');
  const loginError = document.getElementById('login-error');
  const loginSubmit = document.getElementById('login-submit');
  const loginLater = document.getElementById('login-later');
  const menuUser = document.getElementById('menu-user');
  const logoutBtn = document.querySelector('[data-action="logout"]');

  let client = null;
  let user = null;
  let channel = null;
  let flushing = false;
  let flushTimer = 0;
  let retryTimer = 0;
  let outbox = loadOutbox();

  /* ---------- Umrechnen: App (camelCase) <-> Datenbank (snake_case) ---------- */

  const COLUMNS = {
    todos: {
      id: 'id', text: 'text', done: 'done', dueAt: 'due_at', order: 'sort_order',
      createdAt: 'created_at', updatedAt: 'updated_at',
    },
    notes: {
      id: 'id', type: 'type', text: 'text', x: 'x', y: 'y', w: 'w', h: 'h', z: 'z',
      archived: 'archived', archivedAt: 'archived_at', convertedAt: 'converted_at',
      createdAt: 'created_at', updatedAt: 'updated_at',
    },
  };
  const TIME_FIELDS = new Set(['dueAt', 'archivedAt', 'convertedAt', 'createdAt', 'updatedAt']);

  function toRow(table, item) {
    const row = {};
    Object.entries(COLUMNS[table]).forEach(([key, col]) => { row[col] = item[key] ?? null; });
    return row;
  }

  function fromRow(table, row) {
    const item = {};
    Object.entries(COLUMNS[table]).forEach(([key, col]) => {
      const v = row[col];
      item[key] = TIME_FIELDS.has(key) ? (v ? new Date(v).toISOString() : null) : v;
    });
    return item;
  }

  function same(table, a, b) {
    return Object.keys(COLUMNS[table]).every(key => (a[key] ?? null) === (b[key] ?? null));
  }

  /* ---------- Warteschlange ---------- */

  function loadOutbox() {
    try {
      return JSON.parse(localStorage.getItem(OUTBOX_KEY)) || {};
    } catch (err) {
      return {};
    }
  }

  function saveOutbox() {
    try {
      localStorage.setItem(OUTBOX_KEY, JSON.stringify(outbox));
    } catch (err) { /* voll oder gesperrt */ }
  }

  const pending = () => Object.keys(outbox).length;

  function markDirty(table, id, op) {
    const key = table + ':' + id;
    outbox[key] = { table, id, op, v: ((outbox[key] && outbox[key].v) || 0) + 1 };
    saveOutbox();
    scheduleFlush();
  }

  function scheduleFlush(delay) {
    if (!user) return;
    clearTimeout(flushTimer);
    flushTimer = setTimeout(flush, delay ?? 800);
    setStatus('saving');
  }

  async function flush() {
    if (!user || flushing) return;
    if (!pending()) {
      setStatus('synced');
      return;
    }
    flushing = true;
    clearTimeout(retryTimer);
    const entries = Object.values(outbox);
    try {
      for (const table of TABLES) {
        const items = Store._sync.table(table);
        const rows = entries
          .filter(e => e.table === table && e.op === 'upsert')
          .map(e => items.find(item => item.id === e.id))
          .filter(Boolean)
          .map(item => toRow(table, item));
        if (rows.length) {
          const { error } = await client.from(table).upsert(rows);
          if (error) throw error;
        }
        const ids = entries.filter(e => e.table === table && e.op === 'delete').map(e => e.id);
        if (ids.length) {
          const { error } = await client.from(table).delete().in('id', ids);
          if (error) throw error;
        }
      }
      // Nur entfernen, was seither nicht nochmals geändert wurde
      entries.forEach(e => {
        const key = e.table + ':' + e.id;
        if (outbox[key] && outbox[key].v === e.v) delete outbox[key];
      });
      saveOutbox();
      flushing = false;
      if (pending()) scheduleFlush(300);
      else setStatus('synced');
    } catch (err) {
      flushing = false;
      handleError(err);
      retryTimer = setTimeout(flush, 15000);
    }
  }

  /* ---------- Daten von der Datenbank holen ---------- */

  // Übernimmt den Stand der Datenbank, ausser bei Einträgen mit lokalen, noch nicht hochgeladenen Änderungen
  function merge(table, rows) {
    const local = Store._sync.table(table);
    const byId = new Map(local.map(item => [item.id, item]));
    const remoteIds = new Set(rows.map(r => r.id));
    const result = [];
    let changed = false;

    local.forEach(item => {
      if (outbox[table + ':' + item.id]) result.push(item);
      else if (!remoteIds.has(item.id)) changed = true; // auf einem anderen Gerät gelöscht
    });

    rows.forEach(row => {
      if (outbox[table + ':' + row.id]) return;
      const remote = fromRow(table, row);
      const mine = byId.get(row.id);
      if (mine && same(table, mine, remote)) {
        result.push(mine);
      } else {
        result.push(remote);
        changed = true;
      }
    });

    if (changed) Store._sync.setTable(table, result);
    return changed;
  }

  async function pull() {
    if (!user) return;
    try {
      const results = await Promise.all(TABLES.map(table => client.from(table).select('*')));
      const changedTopics = [];
      results.forEach((res, i) => {
        if (res.error) throw res.error;
        if (merge(TABLES[i], res.data)) changedTopics.push(TABLES[i]);
      });
      if (changedTopics.length) Store._sync.commit(changedTopics);
      if (!pending() && !flushing) setStatus('synced');
    } catch (err) {
      handleError(err);
    }
  }

  // Live-Änderung von einem anderen Gerät
  function onRemote(table, payload) {
    const id = (payload.new && payload.new.id) || (payload.old && payload.old.id);
    if (!id || outbox[table + ':' + id]) return;
    const list = Store._sync.table(table);
    const index = list.findIndex(item => item.id === id);

    if (payload.eventType === 'DELETE') {
      if (index < 0) return;
      list.splice(index, 1);
    } else {
      const remote = fromRow(table, payload.new);
      if (index >= 0) {
        if (same(table, list[index], remote)) return;
        list[index] = remote;
      } else {
        list.push(remote);
      }
    }
    Store._sync.commit([table]);
  }

  function subscribe() {
    unsubscribe();
    channel = client.channel('todo-zettel-' + user.id);
    TABLES.forEach(table => {
      channel.on('postgres_changes', { event: '*', schema: 'public', table }, p => onRemote(table, p));
    });
    // Nach jedem (Wieder-)Verbinden den aktuellen Stand holen
    channel.subscribe(status => {
      if (status === 'SUBSCRIBED') pull();
    });
  }

  function unsubscribe() {
    if (channel && client) client.removeChannel(channel);
    channel = null;
  }

  /* ---------- Status-Anzeige oben rechts ---------- */

  const STATUS = {
    local: { icon: 'cloudOff', text: 'Nur lokal', title: 'Nicht angemeldet: Daten nur auf diesem Gerät. Klicken zum Anmelden.' },
    saving: { icon: 'cloudUp', text: 'Speichert …', title: 'Änderungen werden hochgeladen.' },
    synced: { icon: 'cloudCheck', text: 'Synchron', title: 'Alles ist online gespeichert.' },
    offline: { icon: 'cloudOff', text: 'Offline', title: 'Kein Internet. Änderungen werden später hochgeladen.' },
    error: { icon: 'alert', text: 'Sync-Fehler', title: 'Klicken, um es nochmals zu versuchen.' },
  };

  function setStatus(state, detail) {
    const s = STATUS[state];
    if (statusEl.dataset.state === state && !detail) return;
    statusEl.dataset.state = state;
    statusEl.innerHTML = Icon(s.icon);
    const text = document.createElement('span');
    text.className = 'sync-text';
    text.textContent = s.text;
    statusEl.append(text);
    statusEl.title = detail ? `${s.title} (${detail})` : s.title;
  }

  function isOffline(err) {
    const msg = String((err && err.message) || err || '');
    return !navigator.onLine || /failed to fetch|networkerror|load failed|network request failed/i.test(msg);
  }

  function handleError(err) {
    if (isOffline(err)) {
      setStatus('offline');
    } else {
      console.error('Sync-Fehler', err);
      setStatus('error', err && err.message);
    }
  }

  statusEl.addEventListener('click', () => {
    if (!client) {
      App.toast('Keine Verbindung zur Datenbank');
    } else if (!user) {
      showLogin();
    } else {
      flush().then(pull);
    }
  });

  /* ---------- Anmelden und Abmelden ---------- */

  function showLogin() {
    loginError.hidden = true;
    loginEl.hidden = false;
    loginEmail.focus();
  }

  function hideLogin() {
    loginEl.hidden = true;
  }

  function showLoginError(message) {
    loginError.textContent = message;
    loginError.hidden = false;
  }

  function signedIn(u) {
    const last = localStorage.getItem(USER_KEY);
    if (last && last !== u.id) {
      // Anderes Konto als zuletzt: lokale Daten des alten Kontos verwerfen
      outbox = {};
      saveOutbox();
      Store._sync.clear();
    } else if (!last) {
      // Erstes Anmelden auf diesem Gerät: bisherige lokale Einträge hochladen
      TABLES.forEach(table => Store._sync.table(table).forEach(item => markDirty(table, item.id, 'upsert')));
    }
    localStorage.setItem(USER_KEY, u.id);
    user = u;
    hideLogin();
    menuUser.textContent = 'Angemeldet als ' + u.email;
    menuUser.hidden = false;
    logoutBtn.hidden = false;
    subscribe();
    flush().then(pull);
  }

  loginForm.addEventListener('submit', async e => {
    e.preventDefault();
    loginError.hidden = true;
    const email = loginEmail.value.trim();
    const password = loginPassword.value;
    if (!email || !password) {
      showLoginError('E-Mail und Passwort eingeben.');
      return;
    }
    if (!client) {
      showLoginError('Keine Verbindung zur Datenbank. Ist Internet da?');
      return;
    }
    loginSubmit.disabled = true;
    loginSubmit.textContent = 'Anmelden …';
    const { data, error } = await client.auth.signInWithPassword({ email, password });
    loginSubmit.disabled = false;
    loginSubmit.textContent = 'Anmelden';
    if (error) {
      if (isOffline(error)) showLoginError('Keine Internetverbindung.');
      else if (/invalid login credentials/i.test(error.message)) showLoginError('E-Mail oder Passwort stimmt nicht.');
      else showLoginError('Anmelden hat nicht geklappt: ' + error.message);
      return;
    }
    loginPassword.value = '';
    signedIn(data.user);
  });

  loginLater.addEventListener('click', () => {
    hideLogin();
    setStatus('local');
  });

  async function logout() {
    if (pending() && !confirm('Noch nicht alle Änderungen sind hochgeladen. Trotzdem abmelden?')) return;
    unsubscribe();
    // Nur dieses Gerät abmelden, die anderen bleiben angemeldet
    try {
      await client.auth.signOut({ scope: 'local' });
    } catch (err) { /* offline: Sitzung wird trotzdem lokal gelöscht */ }
    user = null;
    outbox = {};
    saveOutbox();
    localStorage.removeItem(USER_KEY);
    Store._sync.clear();
    menuUser.hidden = true;
    logoutBtn.hidden = true;
    setStatus('local');
    showLogin();
  }

  /* ---------- Start ---------- */

  async function start() {
    if (!window.supabase || !cfg.supabaseUrl || !Store._sync) {
      // Bibliothek nicht geladen (z.B. offline beim ersten Start): nur lokal arbeiten
      setStatus(localStorage.getItem(USER_KEY) ? 'offline' : 'local');
      return;
    }
    client = window.supabase.createClient(cfg.supabaseUrl, cfg.supabaseKey, {
      auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: false, storageKey: 'todo-zettel.auth' },
    });
    client.auth.onAuthStateChange(event => {
      // z.B. Sitzung auf einem anderen Weg beendet
      if (event === 'SIGNED_OUT' && user) {
        user = null;
        unsubscribe();
        menuUser.hidden = true;
        logoutBtn.hidden = true;
        setStatus('local');
        showLogin();
      }
    });

    const { data } = await client.auth.getSession();
    if (data && data.session) {
      signedIn(data.session.user);
    } else if (localStorage.getItem(USER_KEY) && !navigator.onLine) {
      setStatus('offline');
    } else {
      setStatus('local');
      showLogin();
    }
  }

  if (Store._sync) Store._sync.onDirty(markDirty);

  window.addEventListener('online', () => {
    if (user) flush().then(pull);
  });
  window.addEventListener('offline', () => {
    if (user) setStatus('offline');
  });
  document.addEventListener('visibilitychange', () => {
    if (!document.hidden && user) flush().then(pull);
  });

  window.Sync = { logout };
  start();
})();
