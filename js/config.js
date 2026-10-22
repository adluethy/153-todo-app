/* Verbindung zur Online-Datenbank (Supabase, Projekt 153-todo-app).
   Beide Werte sind öffentlich gedacht. Geschützt sind die Daten durch den Login
   und die Zugriffsregeln in supabase/schema.sql.
   NIE den "secret"- oder "service_role"-Schlüssel hier eintragen. */
window.APP_CONFIG = {
  supabaseUrl: 'https://klwumomqtygqnxoomdbv.supabase.co',
  supabaseKey: 'sb_publishable_Rx2ovfrP5yiDiLXbmwLU3g_NMYjK9ZX',
  // Erinnerungen: Dienst auf Vercel (Ordner push/) und öffentlicher Schlüssel für Push.
  // Der zugehörige geheime Schlüssel liegt nur in Vercel (Umgebungsvariable VAPID_PRIVATE_KEY).
  pushApi: 'https://153-todo-push.vercel.app',
  vapidPublicKey: 'BKiL1U-S3_jrer5Tng-FMhCKBvirWgXJzeNlDMEo_5spNxnRLivNfDgpZhi-hl8cCd0-vzlRjrY0NrAY7rMgF4o',
};
