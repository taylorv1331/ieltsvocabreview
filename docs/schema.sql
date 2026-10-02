-- =====================================================================
-- IELTS Vocab SRS App — Database schema (Supabase / PostgreSQL)
-- Nguồn sự thật duy nhất cho cấu trúc database.
-- Chạy toàn bộ file này một lần trong Supabase → SQL Editor → New query.
-- Muốn đổi cấu trúc: thêm một mục mới ở CUỐI file (không sửa mục cũ),
-- rồi chỉ chạy phần mới thêm.
-- =====================================================================

-- 1. PROFILES: thông tin thêm cho mỗi tài khoản (auth.users do Supabase quản lý)
create table public.profiles (
  id            uuid primary key references auth.users(id) on delete cascade,
  display_name  text,
  daily_goal    int not null default 20 check (daily_goal between 1 and 200),
  created_at    timestamptz not null default now()
);

-- 2. TOPICS: chủ đề IELTS của từng người
create table public.topics (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null default auth.uid() references auth.users(id) on delete cascade,
  name        text not null check (char_length(name) between 1 and 50),
  created_at  timestamptz not null default now(),
  unique (user_id, name)
);

-- 3. WORDS: mỗi thẻ từ + trạng thái SRS
create table public.words (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid not null default auth.uid() references auth.users(id) on delete cascade,
  term            text not null check (char_length(term) between 1 and 100),
  part_of_speech  text check (part_of_speech in ('noun','verb','adjective','adverb','phrase','other')),
  meaning_vi      text not null,
  definition_en   text,
  example         text,
  collocations    text,
  notes           text,
  -- trạng thái SRS (xem docs/requirements.md, mục 4)
  ease_factor     numeric(4,2) not null default 2.50 check (ease_factor >= 1.30),
  interval_days   int not null default 0 check (interval_days >= 0),
  repetitions     int not null default 0 check (repetitions >= 0),
  -- App luôn tự truyền due_date theo giờ Việt Nam; default chỉ là phương án dự phòng
  due_date        date not null default current_date,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

-- Chống thêm trùng từ, không phân biệt hoa thường (US-02)
create unique index words_user_term_unique on public.words (user_id, lower(term));
-- Tăng tốc truy vấn "từ đến hạn hôm nay" (US-03)
create index words_user_due_idx on public.words (user_id, due_date);

-- 4. WORD_TOPICS: bảng nối nhiều-nhiều giữa words và topics (US-06)
create table public.word_topics (
  word_id     uuid not null references public.words(id) on delete cascade,
  topic_id    uuid not null references public.topics(id) on delete cascade,
  created_at  timestamptz not null default now(),
  primary key (word_id, topic_id)   -- một từ không bị gắn trùng vào cùng một chủ đề
);
-- Tăng tốc lọc "mọi từ thuộc chủ đề X"
create index word_topics_topic_idx on public.word_topics (topic_id);

-- 5. REVIEWS: nhật ký mỗi lần ôn, dùng cho thống kê và streak (US-07)
create table public.reviews (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid not null default auth.uid() references auth.users(id) on delete cascade,
  word_id         uuid not null references public.words(id) on delete cascade,
  rating          smallint not null check (rating between 0 and 3), -- 0 Quên, 1 Khó, 2 Nhớ, 3 Dễ
  interval_before int not null,
  interval_after  int not null,
  reviewed_at     timestamptz not null default now()
);
create index reviews_user_time_idx on public.reviews (user_id, reviewed_at);

-- 6. BẬT RLS + POLICY "chỉ đụng vào dữ liệu của mình"
alter table public.profiles    enable row level security;
alter table public.topics      enable row level security;
alter table public.words       enable row level security;
alter table public.word_topics enable row level security;
alter table public.reviews     enable row level security;

create policy "own profile" on public.profiles
  for all using (auth.uid() = id) with check (auth.uid() = id);
create policy "own topics" on public.topics
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "own words" on public.words
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "own reviews" on public.reviews
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- word_topics không có user_id: quyền được kiểm tra qua từ và chủ đề mà nó nối tới
create policy "own word_topics" on public.word_topics
  for all
  using (
    exists (select 1 from public.words w where w.id = word_id and w.user_id = auth.uid())
  )
  with check (
    exists (select 1 from public.words w  where w.id = word_id  and w.user_id = auth.uid())
    and exists (select 1 from public.topics t where t.id = topic_id and t.user_id = auth.uid())
  );

-- 7. Tự tạo profile khi có người đăng ký mới (lần đầu bấm magic link)
create function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  insert into public.profiles (id) values (new.id);
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Dùng chung: tự cập nhật updated_at mỗi lần sửa
create function public.touch_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger words_touch
  before update on public.words
  for each row execute function public.touch_updated_at();

-- 8. IMPORT_FIELDS: định nghĩa các cột của file mẫu CSV (US-09, US-10)
--    Nguồn sự thật duy nhất cho file mẫu: frontend dựng file mẫu từ bảng này mỗi lần tải.
create table public.import_fields (
  key             text primary key check (key ~ '^[a-z_]+$'),
  label_vi        text not null,
  description_vi  text,
  required        boolean not null default false,
  data_type       text not null default 'text' check (data_type in ('text','enum','list')),
  allowed_values  text[],
  example         text,
  sort_order      int not null,
  is_active       boolean not null default true,
  updated_at      timestamptz not null default now()
);

alter table public.import_fields enable row level security;
-- Ai đăng nhập cũng đọc được. Không có policy ghi → chỉ sửa được trong Supabase Dashboard
create policy "read import fields" on public.import_fields
  for select to authenticated using (true);

create trigger import_fields_touch
  before update on public.import_fields
  for each row execute function public.touch_updated_at();

-- Dữ liệu ban đầu: 8 cột của file mẫu
insert into public.import_fields
  (key, label_vi, description_vi, required, data_type, allowed_values, example, sort_order)
values
  ('term',           'Từ vựng',            'Từ hoặc cụm từ tiếng Anh',                   true,  'text', null, 'mitigate', 1),
  ('meaning_vi',     'Nghĩa tiếng Việt',    null,                                         true,  'text', null, 'giảm nhẹ, làm dịu', 2),
  ('part_of_speech', 'Từ loại',             null,                                         false, 'enum',
     array['noun','verb','adjective','adverb','phrase','other'], 'verb', 3),
  ('definition_en',  'Định nghĩa tiếng Anh', null,                                        false, 'text', null, 'to make something less harmful or serious', 4),
  ('example',        'Câu ví dụ',           null,                                         false, 'text', null, 'Governments must act to mitigate the effects of climate change.', 5),
  ('collocations',   'Collocation',         'Nhiều giá trị cách nhau bằng dấu ;',          false, 'list', null, 'mitigate the impact; mitigate risks', 6),
  ('topics',         'Chủ đề',              'Nhiều chủ đề cách nhau bằng dấu ; hoặc ,',    false, 'list', null, 'Environment; Health', 7),
  ('notes',          'Ghi chú',             null,                                         false, 'text', null, null, 8);

-- =====================================================================
-- Bổ sung ngày 2026-10-02 (rà soát sau US-04). Chỉ chạy phần dưới đây.
-- =====================================================================

-- 9. Siết policy reviews: word_id cũng phải thuộc về mình
--    (nhất quán với word_topics; trước đây chỉ kiểm tra user_id)
drop policy "own reviews" on public.reviews;
create policy "own reviews" on public.reviews
  for all using (auth.uid() = user_id)
  with check (
    auth.uid() = user_id
    and exists (select 1 from public.words w where w.id = word_id and w.user_id = auth.uid())
  );

-- 10. Ghi kết quả chấm thẻ trong MỘT giao dịch (AC-04.2):
--     cập nhật words và ghi reviews cùng thành công hoặc cùng huỷ.
--     Thuật toán SRS vẫn tính ở lib/srs.ts; hàm này chỉ ghi kết quả.
create function public.rate_word(
  p_word_id       uuid,
  p_rating        smallint,
  p_ease_factor   numeric,
  p_interval_days int,
  p_repetitions   int,
  p_due_date      date
) returns void
language plpgsql
security invoker          -- chạy bằng quyền người đang đăng nhập → RLS vẫn áp dụng
set search_path = ''
as $$
declare
  v_interval_before int;
begin
  -- Khoá dòng của từ (của chính mình) để tránh 2 lần chấm chen nhau
  select interval_days into v_interval_before
  from public.words
  where id = p_word_id and user_id = auth.uid()
  for update;

  if not found then
    raise exception 'Không tìm thấy từ %', p_word_id;
  end if;

  update public.words
  set ease_factor = p_ease_factor,
      interval_days = p_interval_days,
      repetitions = p_repetitions,
      due_date = p_due_date
  where id = p_word_id;

  insert into public.reviews (word_id, rating, interval_before, interval_after)
  values (p_word_id, p_rating, v_interval_before, p_interval_days);
end;
$$;

-- Chỉ người đã đăng nhập mới gọi được
revoke execute on function public.rate_word(uuid, smallint, numeric, int, int, date) from public, anon;
grant execute on function public.rate_word(uuid, smallint, numeric, int, int, date) to authenticated;
