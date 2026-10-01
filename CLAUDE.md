# CLAUDE.md — IELTS Vocab SRS App

## Bối cảnh
Web app ôn từ vựng IELTS theo phương pháp lặp lại ngắt quãng (SRS). Chủ dự án là **Taylor**, một người đang học Business Analysis và **mới bắt đầu học code**.

- Luôn trả lời Taylor bằng **tiếng Việt**. Thuật ngữ tiếng Anh thì giải thích ngắn gọn ngay lần đầu dùng.
- Trước khi làm, nói rõ sẽ làm gì và vì sao, bằng ngôn ngữ dễ hiểu. Taylor muốn vừa có app vừa học được cách nó chạy.

## Nguồn sự thật (đọc trước khi code)
1. `docs/requirements.md`: user stories (US-xx), acceptance criteria (AC-xx.y), quy tắc nghiệp vụ (BR-xx).
2. `docs/schema.sql`: cấu trúc database đã chạy trên Supabase. Tên bảng và tên cột phải khớp **chính xác** file này.

Nếu yêu cầu trong lúc chat mâu thuẫn với hai file trên, hoặc tài liệu thiếu thông tin để làm đúng, **dừng lại và hỏi Taylor**. Không tự đoán, không tự thêm tính năng ngoài phạm vi MVP (mục 1 của requirements).

## Tech stack (không đổi nếu chưa hỏi)
- Next.js (App Router) + TypeScript
- Tailwind CSS
- Supabase: Postgres + Auth, dùng `@supabase/supabase-js` và `@supabase/ssr`
- Deploy: Vercel (tự deploy mỗi lần push lên nhánh `main` trên GitHub)
- Hỏi Taylor trước khi cài thêm bất kỳ thư viện nào ngoài danh sách trên. Riêng thư viện đọc CSV thì được đề xuất.

## Quy tắc bắt buộc
- **Giao diện chỉ tiếng Việt.** Không dùng thư viện i18n; chữ trên giao diện viết thẳng bằng tiếng Việt.
- **Mobile-first:** thiết kế cho màn hình ~375px trước, nút bấm cao tối thiểu 44px.
- **Đăng nhập chỉ bằng magic link** (`supabase.auth.signInWithOtp`). Không có form mật khẩu. Middleware chặn mọi trang khi chưa đăng nhập (AC-01.1).
- **Bảo mật:**
  - Chỉ dùng URL và key công khai (anon / publishable key) qua biến môi trường `NEXT_PUBLIC_SUPABASE_URL` và `NEXT_PUBLIC_SUPABASE_ANON_KEY` trong `.env.local`.
  - **Không bao giờ** dùng, yêu cầu hay ghi key `service_role` vào code.
  - `.env.local` phải nằm trong `.gitignore`.
  - Phân quyền dữ liệu dựa vào RLS trong database. Khi insert thì không cần truyền `user_id`, vì cột này có default `auth.uid()`.
- **Database:** không tự sửa cấu trúc bảng. Nếu thật sự cần, đề xuất đoạn SQL mới để thêm vào **cuối** `docs/schema.sql`, giải thích lý do, rồi chờ Taylor tự chạy trên Supabase.
- **Ngày giờ (BR-00):** "hôm nay" tính theo `Asia/Ho_Chi_Minh`. Viết một hàm dùng chung (ví dụ `todayVN()` trong `lib/date.ts`) và luôn truyền `due_date` tường minh. Không dựa vào `current_date` của database hay giờ của server.
- **Logic SRS (BR-01 → BR-05)** nằm trong một hàm thuần (pure function) ở `lib/srs.ts`: nhận trạng thái cũ + rating, trả về trạng thái mới. Hàm này phải có unit test, tối thiểu chứa bảng "Ví dụ chuẩn" ở mục 4.2 của requirements và trường hợp bấm Quên.
- **File mẫu CSV (BR-06):** dựng tại thời điểm tải từ bảng `import_fields`. Không lưu file mẫu tĩnh. Trang "Nhập từ" phải render động (không cache).

## Cách làm việc
1. **Mỗi lần chỉ làm một user story.** Taylor sẽ giao việc theo dạng "Làm US-xx".
2. **Trước khi code:** tóm tắt story và các AC liên quan, liệt kê file sẽ tạo hoặc sửa, rồi chờ Taylor đồng ý.
3. **Trong khi code:** comment ngắn bằng tiếng Việt ở những chỗ logic quan trọng, có dẫn mã yêu cầu, ví dụ `// BR-03: lần thứ hai nhớ → 3 ngày`.
4. **Sau khi code:**
   - Chạy `npm run lint` và `npm run build`; có test thì chạy `npm test`. Sửa hết lỗi.
   - Báo cáo dạng bảng: mỗi AC của story → đã đáp ứng chưa → Taylor tự kiểm tra bằng cách nào (bấm gì, thấy gì).
   - Nhắc những bước Taylor phải tự làm, nếu có (ví dụ: thêm biến môi trường trên Vercel).
5. **Git:** commit sau mỗi story, message có mã story, ví dụ `feat(US-03): danh sách từ đến hạn hôm nay`. Chỉ push khi Taylor đồng ý.

## Thứ tự làm (roadmap)
- **Giai đoạn 0:** dựng khung Next.js + Tailwind, kết nối Supabase, layout chung có thanh điều hướng. Thư mục đã có sẵn `CLAUDE.md` và `docs/`. Nếu `create-next-app` báo thư mục không trống, tạo project ở thư mục tạm rồi chuyển file sang, và giữ nguyên hai mục này.
- **Giai đoạn 1:** US-01 → US-02.
- **Giai đoạn 2:** US-03 → US-04 (lõi SRS), rồi deploy bản đầu lên Vercel.
- **Giai đoạn 3:** US-05 → US-06 → US-07 → US-09 → US-10 → US-08.

## Definition of Done (một story chỉ tính là xong khi)
- [ ] Mọi AC của story đều đúng khi Taylor bấm thử
- [ ] `npm run build` chạy không lỗi
- [ ] Không có key bí mật nào trong code
- [ ] Giao diện dùng tốt trên điện thoại
- [ ] Đã commit với message có mã story
