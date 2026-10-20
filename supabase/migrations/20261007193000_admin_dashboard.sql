create table public.activity_events (
  id bigint generated always as identity primary key,
  actor_id uuid references public.profiles(id) on delete set null,
  event_type text not null check (event_type in (
    'account_created',
    'listing_created',
    'listing_updated',
    'listing_removed',
    'favorite_added',
    'favorite_removed',
    'conversation_started',
    'message_sent'
  )),
  entity_id uuid,
  created_at timestamptz not null default now()
);

create index activity_events_created_at_idx on public.activity_events (created_at desc);
alter table public.activity_events enable row level security;

create policy "Admins can read activity events"
  on public.activity_events for select to authenticated
  using ((select public.is_admin()));

create or replace function public.record_activity_event()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  event_actor uuid;
  event_entity uuid;
  event_name text;
begin
  if tg_table_name = 'profiles' then
    event_actor := new.id;
    event_entity := new.id;
    event_name := 'account_created';
  elsif tg_table_name = 'listings' then
    if tg_op = 'DELETE' then
      event_actor := coalesce(auth.uid(), old.owner_id);
      event_entity := old.id;
      event_name := 'listing_removed';
    elsif tg_op = 'INSERT' then
      event_actor := coalesce(auth.uid(), new.owner_id);
      event_entity := new.id;
      event_name := 'listing_created';
    else
      event_actor := coalesce(auth.uid(), new.owner_id);
      event_entity := new.id;
      event_name := 'listing_updated';
    end if;
  elsif tg_table_name = 'favorites' then
    if tg_op = 'INSERT' then
      event_actor := new.user_id;
      event_entity := new.listing_id;
      event_name := 'favorite_added';
    else
      event_actor := old.user_id;
      event_entity := old.listing_id;
      event_name := 'favorite_removed';
    end if;
  elsif tg_table_name = 'conversations' then
    event_actor := new.requester_id;
    event_entity := new.id;
    event_name := 'conversation_started';
  else
    event_actor := new.sender_id;
    event_entity := new.conversation_id;
    event_name := 'message_sent';
  end if;

  insert into public.activity_events (actor_id, event_type, entity_id)
  values (event_actor, event_name, event_entity);

  if tg_op = 'DELETE' then
    return old;
  end if;
  return new;
end;
$$;

create trigger record_profile_activity
  after insert on public.profiles
  for each row execute function public.record_activity_event();
create trigger record_listing_activity
  after insert or update or delete on public.listings
  for each row execute function public.record_activity_event();
create trigger record_favorite_activity
  after insert or delete on public.favorites
  for each row execute function public.record_activity_event();
create trigger record_conversation_activity
  after insert on public.conversations
  for each row execute function public.record_activity_event();
create trigger record_message_activity
  after insert on public.messages
  for each row execute function public.record_activity_event();

create or replace function public.admin_dashboard()
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  if not (select public.is_admin()) then
    raise exception 'Acesso restrito a administradores' using errcode = '42501';
  end if;

  return jsonb_build_object(
    'metrics', jsonb_build_object(
      'users', (select count(*) from public.profiles),
      'active_listings', (select count(*) from public.listings where status = 'active'),
      'hidden_listings', (select count(*) from public.listings where status = 'hidden'),
      'favorites', (select count(*) from public.favorites),
      'conversations', (select count(*) from public.conversations),
      'messages', (select count(*) from public.messages),
      'activity_events', (select count(*) from public.activity_events),
      'events_last_24h', (select count(*) from public.activity_events where created_at >= now() - interval '24 hours')
    ),
    'activity', coalesce((
      select jsonb_agg(to_jsonb(recent) order by recent.created_at desc)
      from (
        select
          event.id,
          event.event_type,
          case event.event_type
            when 'account_created' then 'Nova conta criada'
            when 'listing_created' then 'Novo anúncio publicado'
            when 'listing_updated' then 'Anúncio atualizado'
            when 'listing_removed' then 'Anúncio removido'
            when 'favorite_added' then 'Anúncio salvo como favorito'
            when 'favorite_removed' then 'Favorito removido'
            when 'conversation_started' then 'Nova conversa iniciada'
            else 'Mensagem enviada'
          end as summary,
          coalesce(profile.display_name, 'Conta removida') as actor_name,
          event.created_at
        from public.activity_events event
        left join public.profiles profile on profile.id = event.actor_id
        order by event.created_at desc
        limit 100
      ) recent
    ), '[]'::jsonb),
    'listings', coalesce((
      select jsonb_agg(to_jsonb(recent) order by recent.created_at desc)
      from (
        select
          listing.id,
          listing.title,
          listing.kind,
          listing.category,
          listing.neighborhood,
          listing.city,
          listing.status,
          listing.created_at,
          coalesce(profile.display_name, 'Membro') as owner_name
        from public.listings listing
        left join public.profiles profile on profile.id = listing.owner_id
        order by listing.created_at desc
        limit 100
      ) recent
    ), '[]'::jsonb),
    'conversations', coalesce((
      select jsonb_agg(to_jsonb(recent) order by recent.last_message_at desc nulls last)
      from (
        select
          conversation.id,
          listing.title as listing_title,
          coalesce(requester.display_name, 'Membro') as requester_name,
          coalesce(owner.display_name, 'Membro') as owner_name,
          count(message.id)::integer as message_count,
          max(message.created_at) as last_message_at
        from public.conversations conversation
        join public.listings listing on listing.id = conversation.listing_id
        left join public.profiles requester on requester.id = conversation.requester_id
        left join public.profiles owner on owner.id = conversation.owner_id
        left join public.messages message on message.conversation_id = conversation.id
        group by conversation.id, listing.title, requester.display_name, owner.display_name
        order by max(message.created_at) desc nulls last
        limit 50
      ) recent
    ), '[]'::jsonb),
    'users', coalesce((
      select jsonb_agg(to_jsonb(recent) order by recent.created_at desc)
      from (
        select
          profile.id,
          profile.display_name,
          profile.neighborhood,
          profile.city,
          profile.created_at,
          (select count(*) from public.listings listing where listing.owner_id = profile.id)::integer as listing_count,
          (
            select count(*) from public.conversations conversation
            where conversation.requester_id = profile.id or conversation.owner_id = profile.id
          )::integer as conversation_count
        from public.profiles profile
        order by profile.created_at desc
        limit 100
      ) recent
    ), '[]'::jsonb)
  );
end;
$$;

revoke all on function public.admin_dashboard() from public;
grant execute on function public.admin_dashboard() to authenticated;
