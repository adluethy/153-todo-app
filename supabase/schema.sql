-- 153 To-do & Zettel: Tabellen für Supabase
-- Im Supabase-Dashboard unter "SQL Editor" einfügen und mit "Run" ausführen.
-- Das Skript darf mehrmals laufen, es macht nichts kaputt.

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

-- ---------- Zugriff: jede Person sieht nur ihre eigenen Zeilen ----------

alter table public.todos enable row level security;
alter table public.notes enable row level security;

grant select, insert, update, delete on public.todos to authenticated;
grant select, insert, update, delete on public.notes to authenticated;

drop policy if exists "Eigene Aufgaben" on public.todos;
create policy "Eigene Aufgaben" on public.todos
  for all to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

drop policy if exists "Eigene Zettel" on public.notes;
create policy "Eigene Zettel" on public.notes
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
