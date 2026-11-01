-- 익명 라운지 메시지의 실제 작성자를 본인만 볼 수 있는 테이블로 옮기고, 메시지의 sender_id는 비운다.
-- (예전엔 라운지 멤버 누구나 sender_id로 작성자를 알 수 있었고, 기록 조회가 실명 프로필까지 붙여 보냈음)

create table if not exists public.anonymous_message_senders (
  message_id uuid primary key references public.direct_messages(id) on delete cascade,
  room_id uuid not null,
  sender_id uuid not null references auth.users(id) on delete cascade
);
alter table public.anonymous_message_senders enable row level security;
drop policy if exists "Senders can see their own anonymous messages" on public.anonymous_message_senders;
create policy "Senders can see their own anonymous messages" on public.anonymous_message_senders
  for select using (auth.uid() = sender_id);

alter table public.direct_messages alter column sender_id drop not null;

-- BEFORE: 익명은 오픈방에서만, 작성자 칸은 비움 / AFTER: 실제 작성자를 별도 테이블에 기록
create or replace function public.hide_anonymous_sender()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if new.is_anonymous then
    if new.room_id is null or not exists (select 1 from chat_rooms where id = new.room_id and is_open) then
      raise exception 'anonymous messages are only allowed in open rooms' using errcode = 'P0001';
    end if;
    new.sender_id := null;
  end if;
  return new;
end $$;

create or replace function public.record_anonymous_sender()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if new.is_anonymous then
    insert into anonymous_message_senders (message_id, room_id, sender_id)
    values (new.id, new.room_id, auth.uid());
  end if;
  return new;
end $$;

revoke execute on function public.hide_anonymous_sender() from public, anon, authenticated;
revoke execute on function public.record_anonymous_sender() from public, anon, authenticated;

drop trigger if exists trg_hide_anonymous_sender on public.direct_messages;
create trigger trg_hide_anonymous_sender before insert on public.direct_messages
  for each row execute function public.hide_anonymous_sender();
drop trigger if exists trg_record_anonymous_sender on public.direct_messages;
create trigger trg_record_anonymous_sender after insert on public.direct_messages
  for each row execute function public.record_anonymous_sender();

-- RLS는 BEFORE 트리거 뒤에 검사되므로 sender_id가 빈 익명 행도 허용 (방 멤버여야 함은 그대로)
-- 되돌리기: create policy dm_insert ... with check ((auth.uid() = sender_id) and (((receiver_id is not null) and (room_id is null)) or ((room_id is not null) and is_room_member(room_id))))
drop policy if exists dm_insert on public.direct_messages;
create policy dm_insert on public.direct_messages for insert with check (
  ((auth.uid() = sender_id) and (((receiver_id is not null) and (room_id is null)) or ((room_id is not null) and is_room_member(room_id))))
  or (is_anonymous and sender_id is null and room_id is not null and is_room_member(room_id))
);

-- 기존 익명 메시지 이전 (작성자 정보는 별도 테이블에 보존)
insert into public.anonymous_message_senders (message_id, room_id, sender_id)
select id, room_id, sender_id from public.direct_messages
where is_anonymous and room_id is not null and sender_id is not null
on conflict (message_id) do nothing;
update public.direct_messages set sender_id = null where is_anonymous and room_id is not null;
