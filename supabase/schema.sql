-- Archivo Atlas — Schema Supabase para escenas 3D colaborativas
-- Ejecutar en SQL Editor de Supabase

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  avatar_url text,
  updated_at timestamptz default now()
);

create table if not exists public.entity_models (
  id uuid primary key default gen_random_uuid(),
  entity_id text not null,
  user_id uuid references auth.users(id) on delete set null,
  name text not null,
  storage_path text not null,
  created_at timestamptz default now()
);

create index if not exists entity_models_entity_id_idx on public.entity_models(entity_id);

create table if not exists public.entity_annotations (
  id uuid primary key default gen_random_uuid(),
  entity_id text not null,
  model_id uuid references public.entity_models(id) on delete set null,
  user_id uuid references auth.users(id) on delete set null,
  kind text not null check (kind in ('comment', 'file', 'text')),
  position jsonb,
  body text,
  file_path text,
  created_at timestamptz default now()
);

create index if not exists entity_annotations_entity_id_idx on public.entity_annotations(entity_id);

alter table public.profiles enable row level security;
alter table public.entity_models enable row level security;
alter table public.entity_annotations enable row level security;

create policy "Profiles viewable by everyone"
  on public.profiles for select using (true);

create policy "Users update own profile"
  on public.profiles for update using (auth.uid() = id);

create policy "Users insert own profile"
  on public.profiles for insert with check (auth.uid() = id);

create policy "Anyone can read entity models"
  on public.entity_models for select using (true);

create policy "Authenticated users insert entity models"
  on public.entity_models for insert with check (auth.uid() = user_id);

create policy "Users delete own entity models"
  on public.entity_models for delete using (auth.uid() = user_id);

create policy "Anyone can read entity annotations"
  on public.entity_annotations for select using (true);

create policy "Authenticated users insert annotations"
  on public.entity_annotations for insert with check (auth.uid() = user_id);

create policy "Users delete own annotations"
  on public.entity_annotations for delete using (auth.uid() = user_id);

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, display_name)
  values (
    new.id,
    coalesce(
      new.raw_user_meta_data->>'display_name',
      new.raw_user_meta_data->>'full_name',
      split_part(coalesce(new.email, ''), '@', 1)
    )
  )
  on conflict (id) do update set
    display_name = coalesce(excluded.display_name, profiles.display_name),
    updated_at = now();
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Storage: crear bucket "entity-assets" (privado) en Dashboard > Storage
-- Políticas sugeridas para storage.objects:
--   insert/select para authenticated en bucket_id = 'entity-assets'
