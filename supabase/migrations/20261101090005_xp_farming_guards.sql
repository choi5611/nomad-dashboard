-- XP 트리거가 보상하는 행을 서버에서 검증한다.
-- 남은 한계(shortcut): 방문 인증의 "같은 나라" 조건은 profiles.country_code(클라이언트가 IP로 채움)에 기대므로
-- 위치를 진짜로 검증하려면 요청 IP를 보는 Edge Function으로 옮겨야 함.

-- 1) 방문: 실제 존재하는 도시(소문자 표시 이름)에만 인증 가능 → 아무 문자열로 +50 무한 적립 차단
create or replace function public.check_visit_city()
returns trigger language plpgsql set search_path = public as $$
begin
  if not exists (select 1 from cities where lower(display_name) = new.city_id) then
    raise exception 'unknown city: %', new.city_id using errcode = '23503';
  end if;
  return new;
end $$;
drop trigger if exists trg_visit_city_check on public.visits;
create trigger trg_visit_city_check before insert on public.visits
  for each row execute function public.check_visit_city();

-- 2) 도시 발견: 사용자가 만든 도시는 항상 priority 3·비공식·발견자=본인, 하루 3개까지 → +100 무한 적립·지구본 낙서 차단
-- shortcut: 하루 3개는 임의 값, 정상 사용자가 막히면 늘릴 것
create or replace function public.guard_city_discovery()
returns trigger language plpgsql set search_path = public as $$
begin
  if auth.uid() is null then
    return new; -- 대시보드/서비스 키로 넣는 공식 도시는 제한 없음
  end if;
  new.priority := 3;
  new.is_official := false;
  new.discoverer_id := auth.uid();
  if (select count(*) from cities where discoverer_id = auth.uid() and created_at > now() - interval '1 day') >= 3 then
    raise exception 'daily city discovery limit reached' using errcode = 'P0001';
  end if;
  return new;
end $$;
drop trigger if exists trg_city_discovery_guard on public.cities;
create trigger trg_city_discovery_guard before insert on public.cities
  for each row execute function public.guard_city_discovery();

-- 3) 댓글 삭제 시 +5 환수 (작성/삭제 반복 파밍 차단, 게시글 삭제 -10과 같은 규칙)
create or replace function public.reclaim_xp_on_comment_delete()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  update profiles set xp = greatest(coalesce(xp, 0) - 5, 0) where id = old.author_id;
  return old;
end $$;
revoke execute on function public.reclaim_xp_on_comment_delete() from public, anon, authenticated;
drop trigger if exists trg_xp_comment_delete on public.comments;
create trigger trg_xp_comment_delete after delete on public.comments
  for each row execute function public.reclaim_xp_on_comment_delete();

-- 4) 뱃지는 사용자가 직접 못 바꾼다 (주는 코드가 없고, 지금은 위조만 가능했음)
revoke update (badges) on public.profiles from authenticated;

-- 5) 닉네임 30일 제한을 서버에서 강제, username_updated_at은 서버가 기록 (클라이언트 값 무시)
create or replace function public.enforce_username_cooldown()
returns trigger language plpgsql set search_path = public as $$
begin
  if new.username is distinct from old.username then
    if old.username_updated_at is not null and old.username_updated_at > now() - interval '30 days' then
      raise exception 'username can be changed once every 30 days' using errcode = 'P0001';
    end if;
    new.username_updated_at := now();
  else
    new.username_updated_at := old.username_updated_at;
  end if;
  return new;
end $$;
drop trigger if exists trg_username_cooldown on public.profiles;
create trigger trg_username_cooldown before update on public.profiles
  for each row execute function public.enforce_username_cooldown();
