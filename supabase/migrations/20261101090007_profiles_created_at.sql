-- 프로필 "Verified Since"가 Invalid Date였음 (컬럼 없음). 가입 시각으로 채운다.
alter table public.profiles add column if not exists created_at timestamptz not null default now();
update public.profiles p set created_at = u.created_at from auth.users u where u.id = p.id;
