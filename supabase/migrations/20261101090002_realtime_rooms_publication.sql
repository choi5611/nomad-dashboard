-- room_members·chat_rooms 변경이 실시간으로 오지 않아 그룹 초대·새 라운지가 새로고침 전까지 안 보였음
-- (RLS가 적용되므로 각 사용자는 볼 수 있는 행의 변경만 받음)
alter publication supabase_realtime add table public.room_members, public.chat_rooms;
