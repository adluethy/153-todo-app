/* Reiter oben in der Kopfzeile: einer pro Person und „Gemmel“ für alle.
   - Aufgaben: im Reiter einer Person alle Aufgaben mit dieser Person (Schalter A/B),
     in Gemmel die Aufgaben für alle. Neue Aufgaben gehören zum gewählten Reiter.
   - Zettel: liegen in genau einem Reiter (note.space = Person, null = Gemmel).
   Ohne Anmeldung oder mit weniger als zwei Personen gibt es keine Reiter; dann ist alles sichtbar. */
(function () {
  'use strict';

  const KEY = 'todo-zettel.layer';
  const GEMMEL = 'G';
  const GEMMEL_NAME = 'Gemmel';

  const nav = document.getElementById('layer-tabs');
  const listeners = new Set();
  let chosen = load();

  function load() {
    try {
      return localStorage.getItem(KEY);
    } catch (err) {
      return null;
    }
  }

  function save() {
    try {
      localStorage.setItem(KEY, chosen);
    } catch (err) { /* egal */ }
  }

  const people = () => Store.people();
  const memberIds = () => people().map(p => p.userId);

  function enabled() {
    const me = Store.me();
    return people().length >= 2 && !!me && memberIds().includes(me);
  }

  // Gewählter Reiter: GEMMEL oder die ID einer Person; null = keine Reiter (alles sichtbar).
  // Noch nie gewählt: der eigene Reiter.
  function current() {
    if (!enabled()) return null;
    if (chosen === GEMMEL || memberIds().includes(chosen)) return chosen;
    return Store.me();
  }

  // Für wen gilt die Aufgabe? Nur eingetragene Personen zählen; ohne solche gilt sie für alle (Gemmel),
  // damit keine Aufgabe in keinem Reiter erscheint.
  function assigneesOf(t) {
    const ids = memberIds();
    const list = (t.assignees && t.assignees.length ? t.assignees : [t.userId]).filter(id => ids.includes(id));
    return list.length ? list : ids;
  }

  const isForAll = list => memberIds().every(id => list.includes(id));

  function todoVisible(t, layer = current()) {
    if (!layer) return true;
    const list = assigneesOf(t);
    return layer === GEMMEL ? isForAll(list) : list.includes(layer);
  }

  // Reiter eines Zettels; unbekannte Person (z.B. gelöscht) = Gemmel
  function spaceOf(n) {
    return n.space && memberIds().includes(n.space) ? n.space : GEMMEL;
  }

  function noteVisible(n) {
    const layer = current();
    return !layer || spaceOf(n) === layer;
  }

  // Für wen gilt eine Aufgabe, die in diesem Reiter entsteht?
  function assigneesFor(layer) {
    if (!layer) return null;
    return layer === GEMMEL ? memberIds() : [layer];
  }

  // Wert für note.space, wenn ein Zettel in diesem Reiter liegen soll
  const spaceFor = layer => (layer && layer !== GEMMEL ? layer : null);

  function name(layer) {
    if (layer === GEMMEL) return GEMMEL_NAME;
    const p = Store.person(layer);
    return p ? p.name : '';
  }

  // "für Adrian" bzw. "für beide"
  function forWhom(layer) {
    if (layer === GEMMEL) return memberIds().length === 2 ? 'für beide' : 'für alle';
    return 'für ' + name(layer);
  }

  function list() {
    return people()
      .map(p => ({ key: p.userId, name: p.name, badge: p.initial }))
      .concat({ key: GEMMEL, name: GEMMEL_NAME, badge: people().map(p => p.initial).join(' '), all: true });
  }

  // Rundes Kürzel wie bei den Schaltern A/B; Gemmel zeigt alle Kürzel
  function badge(layer) {
    const span = document.createElement('span');
    span.className = 'layer-badge' + (layer.all ? ' all' : '');
    span.textContent = layer.badge;
    return span;
  }

  function render() {
    const on = enabled();
    nav.hidden = !on;
    document.body.classList.toggle('has-layers', on);
    if (!on) {
      nav.replaceChildren();
      return;
    }
    const cur = current();
    nav.replaceChildren(...list().map(l => {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'layer-tab' + (l.key === cur ? ' active' : '');
      b.setAttribute('aria-pressed', String(l.key === cur));
      b.title = l.all ? 'Gemeinsame Aufgaben und Zettel' : `Aufgaben und Zettel von ${l.name}`;
      b.append(badge(l), l.name);
      b.addEventListener('click', () => select(l.key));
      return b;
    }));
  }

  function select(key) {
    if (key === current()) return;
    chosen = key;
    save();
    render();
    listeners.forEach(fn => fn());
  }

  Store.subscribe(topic => {
    if (topic === 'people' || topic === 'all') render();
  });

  window.Layers = {
    GEMMEL,
    enabled,
    current,
    todoVisible,
    noteVisible,
    spaceOf,
    assigneesFor,
    spaceFor,
    name,
    forWhom,
    list,
    badge,
    subscribe(fn) {
      listeners.add(fn);
      return () => listeners.delete(fn);
    },
  };

  render();
})();
