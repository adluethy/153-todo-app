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
-- user_id in todos/notes = wer den Eintrag erfasst hat (in der App "A:" bzw. der Name).

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
