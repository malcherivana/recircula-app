create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce(auth.jwt() -> 'app_metadata' ->> 'role' = 'admin', false);
$$;

revoke all on function public.is_admin() from public;
grant execute on function public.is_admin() to anon, authenticated;

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null check (char_length(display_name) between 1 and 80),
  neighborhood text check (neighborhood is null or char_length(neighborhood) <= 100),
  city text check (city is null or char_length(city) <= 100),
  created_at timestamptz not null default now()
);

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, display_name, neighborhood, city)
  values (
    new.id,
    coalesce(nullif(btrim(new.raw_user_meta_data ->> 'display_name'), ''), 'Membro'),
    nullif(btrim(new.raw_user_meta_data ->> 'neighborhood'), ''),
    nullif(btrim(new.raw_user_meta_data ->> 'city'), '')
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

insert into public.profiles (id, display_name, neighborhood, city)
select
  user_record.id,
  coalesce(nullif(btrim(user_record.raw_user_meta_data ->> 'display_name'), ''), 'Membro'),
  nullif(btrim(user_record.raw_user_meta_data ->> 'neighborhood'), ''),
  nullif(btrim(user_record.raw_user_meta_data ->> 'city'), '')
from auth.users user_record
on conflict (id) do nothing;

create table public.listings (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.profiles(id) on delete cascade,
  title text not null check (char_length(title) between 3 and 100),
  description text not null check (char_length(description) between 10 and 2000),
  category text not null check (category in ('Roupas', 'Livros', 'Móveis', 'Outros')),
  kind text not null check (kind in ('Doação', 'Troca')),
  neighborhood text not null check (char_length(neighborhood) between 1 and 100),
  city text not null check (char_length(city) between 1 and 100),
  image_path text,
  status text not null default 'active' check (status in ('active', 'hidden', 'completed')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index listings_active_created_at_idx
  on public.listings (created_at desc) where status = 'active';
create index listings_owner_id_idx on public.listings (owner_id);

create table public.favorites (
  user_id uuid not null references public.profiles(id) on delete cascade,
  listing_id uuid not null references public.listings(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, listing_id)
);

create table public.conversations (
  id uuid primary key default gen_random_uuid(),
  listing_id uuid not null references public.listings(id) on delete cascade,
  requester_id uuid not null references public.profiles(id) on delete cascade,
  owner_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint conversations_distinct_participants check (requester_id <> owner_id),
  constraint conversations_listing_requester_key unique (listing_id, requester_id)
);

create index conversations_requester_updated_idx
  on public.conversations (requester_id, updated_at desc);
create index conversations_owner_updated_idx
  on public.conversations (owner_id, updated_at desc);

create table public.messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.conversations(id) on delete cascade,
  sender_id uuid not null references public.profiles(id) on delete cascade,
  body text not null check (char_length(btrim(body)) between 1 and 2000),
  created_at timestamptz not null default now()
);

create index messages_conversation_created_idx
  on public.messages (conversation_id, created_at);

create or replace function public.update_conversation_activity()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  update public.conversations
  set updated_at = new.created_at
  where id = new.conversation_id;
  return new;
end;
$$;

create trigger on_message_created
  after insert on public.messages
  for each row execute function public.update_conversation_activity();

alter table public.profiles enable row level security;
alter table public.listings enable row level security;
alter table public.favorites enable row level security;
alter table public.conversations enable row level security;
alter table public.messages enable row level security;

create policy "Profiles are publicly readable"
  on public.profiles for select to anon, authenticated using (true);
create policy "Users can update their own profile"
  on public.profiles for update to authenticated
  using (id = (select auth.uid()))
  with check (id = (select auth.uid()));
grant select on public.profiles to anon, authenticated;
grant update on public.profiles to authenticated;

create policy "Active listings and own listings are readable"
  on public.listings for select to anon, authenticated
  using (status = 'active' or owner_id = (select auth.uid()) or (select public.is_admin()));
create policy "Users can create their own listings"
  on public.listings for insert to authenticated
  with check (owner_id = (select auth.uid()));
create policy "Owners and admins can update listings"
  on public.listings for update to authenticated
  using (owner_id = (select auth.uid()) or (select public.is_admin()))
  with check (owner_id = (select auth.uid()) or (select public.is_admin()));
create policy "Owners and admins can delete listings"
  on public.listings for delete to authenticated
  using (owner_id = (select auth.uid()) or (select public.is_admin()));
grant select on public.listings to anon, authenticated;
grant insert, update, delete on public.listings to authenticated;

create policy "Users can view their own favorites"
  on public.favorites for select to authenticated
  using (user_id = (select auth.uid()));
create policy "Users can save their own favorites"
  on public.favorites for insert to authenticated
  with check (user_id = (select auth.uid()));
create policy "Users can remove their own favorites"
  on public.favorites for delete to authenticated
  using (user_id = (select auth.uid()));
grant select, insert, delete on public.favorites to authenticated;

create policy "Participants can view their conversations"
  on public.conversations for select to authenticated
  using (requester_id = (select auth.uid()) or owner_id = (select auth.uid()));
create policy "Users can start a conversation about another user's active listing"
  on public.conversations for insert to authenticated
  with check (
    requester_id = (select auth.uid())
    and requester_id <> owner_id
    and exists (
      select 1 from public.listings
      where listings.id = conversations.listing_id
        and listings.owner_id = conversations.owner_id
        and listings.status = 'active'
    )
  );
grant select, insert on public.conversations to authenticated;

create policy "Participants can read conversation messages"
  on public.messages for select to authenticated
  using (
    exists (
      select 1 from public.conversations
      where conversations.id = conversation_id
        and (conversations.requester_id = (select auth.uid()) or conversations.owner_id = (select auth.uid()))
    )
  );
create policy "Participants can send their own messages"
  on public.messages for insert to authenticated
  with check (
    sender_id = (select auth.uid())
    and exists (
      select 1 from public.conversations
      where conversations.id = conversation_id
        and (conversations.requester_id = (select auth.uid()) or conversations.owner_id = (select auth.uid()))
    )
  );
grant select, insert on public.messages to authenticated;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('listing-images', 'listing-images', true, 5242880, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do update
set public = excluded.public,
    file_size_limit = excluded.file_size_limit,
    allowed_mime_types = excluded.allowed_mime_types;

create policy "Listing images are publicly readable"
  on storage.objects for select to anon, authenticated
  using (bucket_id = 'listing-images');
create policy "Users can upload images to their own folder"
  on storage.objects for insert to authenticated
  with check (
    bucket_id = 'listing-images'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );
create policy "Users can delete images from their own folder"
  on storage.objects for delete to authenticated
  using (
    bucket_id = 'listing-images'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );
