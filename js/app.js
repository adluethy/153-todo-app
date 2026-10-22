/* Rahmen: Ansicht wechseln (Handy), Menü, Sicherung exportieren/importieren. */
(function () {
  'use strict';

  /* ---------- Ansicht auf dem Handy: To-do oder Zettel ---------- */

  const VIEW_KEY = 'todo-zettel.view';
  const layout = document.getElementById('layout');
  const tabs = document.querySelectorAll('.tabbar [data-view]');

  function setView(view) {
    layout.dataset.view = view;
    tabs.forEach(b => b.classList.toggle('active', b.dataset.view === view));
    try { localStorage.setItem(VIEW_KEY, view); } catch (err) { /* egal */ }
    if (view === 'notes') Notes.render();
  }

  tabs.forEach(b => b.addEventListener('click', () => setView(b.dataset.view)));

  let savedView = null;
  try { savedView = localStorage.getItem(VIEW_KEY); } catch (err) { /* egal */ }
  setView(savedView === 'notes' ? 'notes' : 'todos');

  /* ---------- Menü ---------- */

  const menuBtn = document.getElementById('menu-btn');
  const menu = document.getElementById('menu');
  const importInput = document.getElementById('import-file');

  function toggleMenu(open) {
    menu.hidden = !open;
    menuBtn.setAttribute('aria-expanded', String(open));
  }

  menuBtn.addEventListener('click', e => {
    e.stopPropagation();
    toggleMenu(menu.hidden);
  });
  document.addEventListener('click', e => {
    if (!menu.hidden && !menu.contains(e.target)) toggleMenu(false);
  });
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && !menu.hidden) toggleMenu(false);
  });
  menu.addEventListener('click', e => {
    const btn = e.target.closest('[data-action]');
    if (!btn) return;
    toggleMenu(false);
    if (btn.dataset.action === 'export') exportData();
    if (btn.dataset.action === 'import') importInput.click();
    if (btn.dataset.action === 'logout') Sync.logout();
  });

  /* ---------- Sicherung ---------- */

  function exportData() {
    const json = JSON.stringify(Store.exportData(), null, 2);
    const url = URL.createObjectURL(new Blob([json], { type: 'application/json' }));
    const a = document.createElement('a');
    a.href = url;
    a.download = `todo-zettel-sicherung-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.append(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    App.toast('Sicherung gespeichert');
  }

  importInput.addEventListener('change', async () => {
    const file = importInput.files[0];
    importInput.value = '';
    if (!file) return;
    try {
      const raw = JSON.parse(await file.text());
      if (!raw || !Array.isArray(raw.todos) || !Array.isArray(raw.notes)) throw new Error('Falsches Format');
      const ok = confirm(`Sicherung laden? ${raw.todos.length} Aufgaben und ${raw.notes.length} Zettel ersetzen alle aktuellen Daten, auch die Einträge der anderen Person und auf allen anderen Geräten.`);
      if (!ok) return;
      Store.importData(raw);
      App.toast('Sicherung geladen');
    } catch (err) {
      console.error(err);
      App.toast('Die Datei ist keine gültige Sicherung');
    }
  });

  /* ---------- Installierbare App (nur online, nicht per Doppelklick) ---------- */

  if ('serviceWorker' in navigator && location.protocol.startsWith('http')) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('sw.js')
        .catch(err => console.warn('Service Worker nicht registriert', err));
    });
  }
})();
