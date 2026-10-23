/* Erinnerungen per Push: auf diesem Gerät ein- und ausschalten, Test-Mitteilung.
   Verschickt werden die Erinnerungen vom Dienst auf Vercel (Ordner push/), 1 Tag und
   2 Stunden vor dem Termin, an alle Geräte der Personen, für die die Aufgabe gilt (Schalter A/B).
   Ausserdem (Schalter «Neue Einträge melden», pro Gerät): neue Einträge der anderen Person im
   Gemmel und im eigenen Reiter. */
(function () {
  'use strict';

  const ON_KEY = 'todo-zettel.push'; // 'on', wenn auf diesem Gerät eingeschaltet
  const NEWS_KEY = 'todo-zettel.push.news'; // 'off', wenn neue Einträge hier nicht gemeldet werden
  const cfg = window.APP_CONFIG || {};
  const toggleBtn = document.querySelector('[data-action="push"]');
  const testBtn = document.querySelector('[data-action="push-test"]');
  const newsBtn = document.querySelector('[data-action="push-news"]');
  const newsState = newsBtn.querySelector('.menu-state');
  const toggleLabel = toggleBtn.querySelector('.push-label');

  const isIos = () => /iPad|iPhone|iPod/.test(navigator.userAgent) ||
    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  const isStandalone = () => window.matchMedia('(display-mode: standalone)').matches || navigator.standalone === true;
  const supported = () => 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window &&
    (location.protocol === 'https:' || location.hostname === 'localhost') &&
    Boolean(cfg.vapidPublicKey && cfg.pushApi);
  // iPhone im normalen Safari: Push gibt es erst, wenn die App auf dem Home-Bildschirm liegt
  const iosNeedsInstall = () => isIos() && !isStandalone();

  function readOn() {
    try { return localStorage.getItem(ON_KEY) === 'on'; } catch (err) { return false; }
  }

  function writeOn(on) {
    try {
      if (on) localStorage.setItem(ON_KEY, 'on');
      else localStorage.removeItem(ON_KEY);
    } catch (err) { /* egal */ }
  }

  function showState(on) {
    toggleLabel.textContent = on ? 'Erinnerungen ausschalten' : 'Erinnerungen einschalten';
    toggleBtn.querySelector('svg').outerHTML = Icon(on ? 'bellOff' : 'bell');
    testBtn.hidden = !on;
    newsBtn.hidden = !on;
    if (on) showNews(readNews());
  }

  /* ---------- Schalter «Neue Einträge melden» (pro Gerät, gespeichert in push_subscriptions.news) ---------- */

  function readNews() {
    try { return localStorage.getItem(NEWS_KEY) !== 'off'; } catch (err) { return true; }
  }

  function showNews(on) {
    try {
      if (on) localStorage.removeItem(NEWS_KEY);
      else localStorage.setItem(NEWS_KEY, 'off');
    } catch (err) { /* egal */ }
    newsState.textContent = on ? 'an' : 'aus';
    newsState.classList.toggle('on', on);
    newsBtn.title = on
      ? 'Neue Einträge der anderen Person im Gemmel und in deinem Reiter werden auf diesem Gerät gemeldet'
      : 'Neue Einträge werden auf diesem Gerät nicht gemeldet';
  }

  // Stand aus der Datenbank holen (gilt, falls er auf einem anderen Weg geändert wurde)
  async function loadNews(sub) {
    const { data, error } = await Sync.client().from('push_subscriptions').select('news').eq('endpoint', sub.endpoint);
    if (!error && data && data.length) showNews(data[0].news !== false);
  }

  async function toggleNews() {
    const next = !readNews();
    try {
      const sub = await subscription(false);
      if (!sub) throw new Error('Gerät nicht eingetragen');
      const { error } = await Sync.client().from('push_subscriptions').update({ news: next }).eq('endpoint', sub.endpoint);
      if (error) throw error;
      showNews(next);
      App.toast(next ? 'Neue Einträge werden auf diesem Gerät gemeldet' : 'Neue Einträge werden auf diesem Gerät nicht mehr gemeldet');
    } catch (err) {
      console.error('Neue Einträge melden', err);
      App.toast('Umschalten hat nicht geklappt: ' + (err.message || err));
    }
  }

  // Öffentlicher VAPID-Schlüssel (Base64url) als Bytes
  function keyBytes(base64) {
    const pad = '='.repeat((4 - (base64.length % 4)) % 4);
    const raw = atob((base64 + pad).replace(/-/g, '+').replace(/_/g, '/'));
    return Uint8Array.from(raw, c => c.charCodeAt(0));
  }

  function sameKey(sub) {
    const key = sub.options && sub.options.applicationServerKey;
    if (!key) return true;
    const a = new Uint8Array(key);
    const b = keyBytes(cfg.vapidPublicKey);
    return a.length === b.length && a.every((v, i) => v === b[i]);
  }

  function deviceName() {
    const ua = navigator.userAgent;
    const os = isIos() ? 'iPhone' : /Android/.test(ua) ? 'Android' : /Windows/.test(ua) ? 'Windows' : /Mac/.test(ua) ? 'Mac' : 'Gerät';
    const browser = /Edg\//.test(ua) ? 'Edge' : /Chrome\//.test(ua) ? 'Chrome' : /Firefox\//.test(ua) ? 'Firefox' : /Safari\//.test(ua) ? 'Safari' : '';
    return browser ? `${os} ${browser}` : os;
  }

  // Gerät in der Datenbank eintragen (gehört danach der angemeldeten Person)
  async function save(sub) {
    const j = sub.toJSON();
    const { error } = await Sync.client().rpc('save_push_subscription', {
      p_endpoint: j.endpoint, p_p256dh: j.keys.p256dh, p_auth: j.keys.auth, p_device: deviceName(),
    });
    if (error) throw error;
  }

  // Zum Anlegen auf den Service Worker warten (höchstens 10 s), sonst nur nachsehen
  function registration(wait) {
    if (!wait) return navigator.serviceWorker.getRegistration();
    return Promise.race([
      navigator.serviceWorker.ready,
      new Promise((resolve, reject) => setTimeout(() => reject(new Error('Service Worker nicht bereit')), 10000)),
    ]);
  }

  async function subscription(create) {
    const reg = await registration(create);
    if (!reg) return null;
    let sub = await reg.pushManager.getSubscription();
    if (sub && !sameKey(sub)) {
      await sub.unsubscribe(); // mit einem alten Schlüssel angemeldet
      sub = null;
    }
    if (!sub && create) {
      sub = await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: keyBytes(cfg.vapidPublicKey) });
    }
    return sub;
  }

  async function enable() {
    // Die Erlaubnis muss direkt beim Antippen kommen (iPhone), darum als Erstes
    const permission = Notification.permission === 'granted' ? 'granted' : await Notification.requestPermission();
    if (permission !== 'granted') {
      App.toast(permission === 'denied'
        ? 'Mitteilungen sind blockiert. In den Einstellungen des Browsers bzw. Handys erlauben.'
        : 'Mitteilungen wurden nicht erlaubt');
      return;
    }
    try {
      const sub = await subscription(true);
      await save(sub);
      writeOn(true);
      showState(true);
      loadNews(sub).catch(() => {});
      App.toast('Erinnerungen auf diesem Gerät eingeschaltet');
    } catch (err) {
      console.error('Erinnerungen einschalten', err);
      App.toast('Einschalten hat nicht geklappt: ' + (err.message || err));
    }
  }

  async function disable(silent) {
    writeOn(false);
    showState(false);
    try {
      const sub = await subscription(false);
      if (sub) {
        if (Sync.client()) await Sync.client().from('push_subscriptions').delete().eq('endpoint', sub.endpoint);
        await sub.unsubscribe();
      }
      if (!silent) App.toast('Erinnerungen auf diesem Gerät ausgeschaltet');
    } catch (err) {
      console.warn('Erinnerungen ausschalten', err);
    }
  }

  function toggle() {
    if (iosNeedsInstall()) {
      alert('Auf dem iPhone gibt es Erinnerungen nur, wenn die App auf dem Home-Bildschirm liegt:\n' +
        'In Safari unten auf «Teilen» tippen, dann «Zum Home-Bildschirm». ' +
        'Danach die App über das Symbol öffnen und hier die Erinnerungen einschalten.');
      return;
    }
    if (readOn()) disable(false);
    else enable();
  }

  async function test() {
    try {
      const session = await Sync.session();
      if (!session) {
        App.toast('Zuerst anmelden');
        return;
      }
      const res = await fetch(cfg.pushApi + '/api/test', {
        method: 'POST',
        headers: { Authorization: 'Bearer ' + session.access_token },
      });
      const result = await res.json().catch(() => ({}));
      if (!res.ok) App.toast('Test hat nicht geklappt: ' + (result.error || res.status));
      else if (!result.devices) App.toast('Für dich ist noch kein Gerät eingetragen');
      else App.toast(`Test-Mitteilung an ${result.ok} von ${result.devices} Geräten geschickt`);
    } catch (err) {
      console.error('Test-Mitteilung', err);
      App.toast('Test hat nicht geklappt (keine Verbindung zum Dienst)');
    }
  }

  // Nach dem Anmelden bzw. beim Start: Menü zeigen und das Gerät nötigenfalls neu eintragen
  async function refresh() {
    const user = Sync.user();
    const usable = Boolean(user) && (supported() || iosNeedsInstall());
    toggleBtn.hidden = !usable;
    if (!usable) {
      testBtn.hidden = true;
      return;
    }
    if (!supported()) {
      showState(false);
      return;
    }
    let on = readOn() && Notification.permission === 'granted';
    if (on) {
      try {
        const sub = await subscription(true); // ging das Abo verloren, still neu anlegen
        await save(sub);
        loadNews(sub).catch(() => {});
      } catch (err) {
        console.warn('Erinnerungen: Gerät nicht eingetragen', err);
        on = Boolean(await subscription(false).catch(() => null));
      }
    }
    writeOn(on);
    showState(on);
  }

  // Beim Abmelden: Gerät austragen, solange die Anmeldung noch gilt
  async function forget() {
    if (!supported()) return;
    await disable(true);
  }

  Sync.onAuthChange(() => { refresh(); });
  refresh();

  window.Push = { toggle, test, forget, toggleNews };
})();
