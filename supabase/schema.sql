-- 153 To-do & Zettel: Tabellen für Supabase
-- Im Supabase-Dashboard unter "SQL Editor" einfügen und mit "Run" ausführen.
-- Das Skript darf mehrmals laufen, es macht nichts kaputt.
--
-- Zu zweit (seit 22.10.2026): Wer in der Tabelle "people" steht, sieht und bearbeitet
-- alle Aufgaben und Zettel. Person eintragen (nachdem sie unter Authentication → Users
-- angelegt ist), im SQL Editor:
--   select add_person('e-mail@beispiel.ch', 'Barbara');

-- ---------- Aufgaben ----------

create table if not exists public.todos (
  id          uuid primary key,
  user_id     uuid not null default auth.uid() references auth.users (id) on delete cascade,
  text        text not null,
  done        boolean not null default false,
  due_at      timestamptz,
  sort_order  double precision not null default 0,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create index if not exists todos_user_id_idx on public.todos (user_id);

-- ---------- Zettel ----------

create table if not exists public.notes (
  id            uuid primary key,
  user_id       uuid not null default auth.uid() references auth.users (id) on delete cascade,
  type          text not null check (type in ('idee', 'info')),
  text          text not null default '',
  x             double precision not null default 0.05, -- Position als Anteil der Fläche (0–1)
  y             double precision not null default 0.05,
  w             double precision not null default 240,  -- Grösse in Pixeln
  h             double precision not null default 190,
  z             integer not null default 1,
  archived      boolean not null default false,
  archived_at   timestamptz,
  converted_at  timestamptz,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create index if not exists notes_user_id_idx on public.notes (user_id);

-- ---------- Personen, die die Listen gemeinsam nutzen ----------
-- user_id in todos/notes = wer den Eintrag erfasst hat (bei Zetteln steht der Name).
-- todos.assignees = für wen die Aufgabe gilt (Schalter A/B, siehe Erinnerungen unten).

create table if not exists public.people (
  user_id  uuid primary key references auth.users (id) on delete cascade,
  name     text not null,
  initial  text not null
);

-- Gehört die angemeldete Person dazu?
create or replace function public.is_member()
returns boolean
language sql stable security definer set search_path = ''
as $$
  select exists (select 1 from public.people where user_id = (select auth.uid()));
$$;

revoke execute on function public.is_member() from public, anon;
grant execute on function public.is_member() to authenticated;

-- Person eintragen oder umbenennen. Nur im SQL Editor aufrufbar, nicht aus der App.
create or replace function public.add_person(p_email text, p_name text)
returns text
language plpgsql security definer set search_path = ''
as $$
declare
  v_id uuid;
  v_name text := trim(p_name);
  v_initial text := upper(left(trim(p_name), 1));
begin
  select id into v_id from auth.users where lower(email) = lower(trim(p_email));
  if v_id is null then
    raise exception 'Kein Benutzer mit der E-Mail % gefunden. Zuerst unter Authentication → Users anlegen.', p_email;
  end if;
  if v_name = '' then
    raise exception 'Bitte einen Namen angeben.';
  end if;
  insert into public.people (user_id, name, initial)
  values (v_id, v_name, v_initial)
  on conflict (user_id) do update set name = excluded.name, initial = excluded.initial;
  return v_name || ' ist eingetragen (Kürzel ' || v_initial || ').';
end;
$$;

revoke execute on function public.add_person(text, text) from public, anon, authenticated;

-- ---------- Zugriff ----------
-- Eigene Einträge sieht man immer. Wer in "people" steht, sieht und bearbeitet zusätzlich
-- alle Einträge der anderen. Neue Registrierungen sind in Supabase gesperrt.

alter table public.todos enable row level security;
alter table public.notes enable row level security;
alter table public.people enable row level security;

grant select, insert, update, delete on public.todos to authenticated;
grant select, insert, update, delete on public.notes to authenticated;
grant select on public.people to authenticated;

drop policy if exists "Eigene Aufgaben" on public.todos;
drop policy if exists "Gemeinsame Aufgaben" on public.todos;
create policy "Gemeinsame Aufgaben" on public.todos
  for all to authenticated
  using (user_id = (select auth.uid()) or (select public.is_member()))
  with check (user_id = (select auth.uid()) or (select public.is_member()));

drop policy if exists "Eigene Zettel" on public.notes;
drop policy if exists "Gemeinsame Zettel" on public.notes;
create policy "Gemeinsame Zettel" on public.notes
  for all to authenticated
  using (user_id = (select auth.uid()) or (select public.is_member()))
  with check (user_id = (select auth.uid()) or (select public.is_member()));

drop policy if exists "Personen sehen" on public.people;
create policy "Personen sehen" on public.people
  for select to authenticated
  using ((select public.is_member()));

-- ---------- Erinnerungen per Push (seit 22.10.2026) ----------
-- Jede Aufgabe gilt für eine oder beide Personen (assignees, Schalter A/B in der App).
-- Ein Dienst auf Vercel ruft jede Minute claim_due_reminders() auf und schickt die
-- fälligen Erinnerungen (1 Tag und 2 Stunden vor dem Termin) an die Geräte dieser Personen.

alter table public.todos add column if not exists assignees uuid[];
alter table public.todos add column if not exists due_set_at timestamptz; -- wann der Termin gesetzt wurde

-- Bisherige Aufgaben: gelten für die Person, die sie erfasst hat; Termine zählen ab jetzt
update public.todos set assignees = array[user_id] where assignees is null or cardinality(assignees) = 0;
update public.todos set due_set_at = now() where due_at is not null and due_set_at is null;

-- Geräte, die Erinnerungen bekommen (eines pro Browser bzw. installierter App)
create table if not exists public.push_subscriptions (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null default auth.uid() references auth.users (id) on delete cascade,
  endpoint    text not null unique,
  p256dh      text not null,
  auth        text not null,
  device      text,
  created_at  timestamptz not null default now(),
  last_ok_at  timestamptz
);

create index if not exists push_subscriptions_user_id_idx on public.push_subscriptions (user_id);

-- Welche Erinnerung ging schon an wen (jede genau einmal)
create table if not exists public.reminders_sent (
  todo_id     uuid not null references public.todos (id) on delete cascade,
  user_id     uuid not null references auth.users (id) on delete cascade,
  offset_min  integer not null, -- Minuten vor dem Termin
  sent_at     timestamptz not null default now(),
  primary key (todo_id, user_id, offset_min)
);

-- Vor jedem Speichern einer Aufgabe: Standard für assignees, Zeitpunkt des Termins merken.
-- Ändert sich der Termin, beginnen die Erinnerungen von vorne.
create or replace function public.todos_before_write()
returns trigger
language plpgsql security definer set search_path = ''
as $$
begin
  if new.assignees is null or cardinality(new.assignees) = 0 then
    new.assignees := array[new.user_id];
  end if;
  if tg_op = 'INSERT' then
    new.due_set_at := case when new.due_at is null then null else now() end;
  elsif new.due_at is distinct from old.due_at then
    new.due_set_at := case when new.due_at is null then null else now() end;
    delete from public.reminders_sent where todo_id = new.id;
  else
    new.due_set_at := coalesce(old.due_set_at, new.due_set_at);
  end if;
  return new;
end;
$$;

revoke execute on function public.todos_before_write() from public, anon, authenticated;

drop trigger if exists todos_before_write on public.todos;
create trigger todos_before_write
  before insert or update on public.todos
  for each row execute function public.todos_before_write();

-- Gerät anmelden (aus der App). Gehört das Gerät schon jemandem, übernimmt es die angemeldete Person.
create or replace function public.save_push_subscription(p_endpoint text, p_p256dh text, p_auth text, p_device text)
returns void
language sql security definer set search_path = ''
as $$
  insert into public.push_subscriptions (user_id, endpoint, p256dh, auth, device)
  values ((select auth.uid()), p_endpoint, p_p256dh, p_auth, p_device)
  on conflict (endpoint) do update
    set user_id = excluded.user_id, p256dh = excluded.p256dh, auth = excluded.auth, device = excluded.device;
$$;

revoke execute on function public.save_push_subscription(text, text, text, text) from public, anon;
grant execute on function public.save_push_subscription(text, text, text, text) to authenticated;

-- Fällige Erinnerungen abholen (nur der Dienst auf Vercel mit dem Secret Key).
-- Regeln: nur offene Aufgaben mit Termin; der Erinnerungszeitpunkt liegt nach dem Setzen des
-- Termins; verpasste werden bis 6 Stunden später nachgeholt; jede geht genau einmal raus.
create or replace function public.claim_due_reminders()
returns table (todo_id uuid, user_id uuid, text text, due_at timestamptz, offset_min integer)
language sql volatile security definer set search_path = ''
as $$
  with faellig as (
    select t.id as todo_id, p.uid as user_id, t.text, t.due_at, o.offset_min
    from public.todos t
    cross join lateral unnest(t.assignees) as p(uid)
    cross join (values (1440), (120)) as o(offset_min) -- 1 Tag und 2 Stunden vorher
    where not t.done
      and t.due_at is not null
      and t.due_set_at is not null
      and t.due_at - make_interval(mins => o.offset_min) <= now()
      and t.due_at - make_interval(mins => o.offset_min) >= t.due_set_at
      and t.due_at - make_interval(mins => o.offset_min) > now() - interval '6 hours'
      and exists (select 1 from public.people pe where pe.user_id = p.uid)
  ),
  neu as (
    insert into public.reminders_sent (todo_id, user_id, offset_min)
    select f.todo_id, f.user_id, f.offset_min from faellig f
    on conflict do nothing
    returning reminders_sent.todo_id, reminders_sent.user_id, reminders_sent.offset_min
  )
  select f.todo_id, f.user_id, f.text, f.due_at, f.offset_min
  from neu n
  join faellig f using (todo_id, user_id, offset_min);
$$;

revoke execute on function public.claim_due_reminders() from public, anon, authenticated;
grant execute on function public.claim_due_reminders() to service_role;

alter table public.push_subscriptions enable row level security;
alter table public.reminders_sent enable row level security; -- keine Regeln: nur der Dienst

grant select, delete on public.push_subscriptions to authenticated;

drop policy if exists "Eigene Geräte" on public.push_subscriptions;
create policy "Eigene Geräte" on public.push_subscriptions
  for all to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

-- ---------- Live-Abgleich zwischen Geräten (Realtime) ----------

do $$
begin
  if not exists (select 1 from pg_publication_tables
                 where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'todos') then
    alter publication supabase_realtime add table public.todos;
  end if;
  if not exists (select 1 from pg_publication_tables
                 where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'notes') then
    alter publication supabase_realtime add table public.notes;
  end if;
end $$;
