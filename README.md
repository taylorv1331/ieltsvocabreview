# Ôn từ vựng IELTS (SRS)

Web app ôn từ vựng IELTS theo phương pháp lặp lại ngắt quãng.
Yêu cầu: `docs/requirements.md` · Database: `docs/schema.sql` · Quy ước làm việc: `CLAUDE.md`.

## Chạy trên máy

1. Chép `.env.local.example` thành `.env.local`, điền URL và anon key của Supabase.
2. `npm install`
3. `npm run dev` rồi mở http://localhost:3000

## Tài liệu API (trình bày lớp business logic)

Mở `/api-docs` (ví dụ https://ieltsvocabreview.vercel.app/api-docs) để xem và chạy thử bằng Swagger UI.
Mô tả API nằm ở `public/openapi.json`. Các API này chỉ tính toán, không đọc / ghi dữ liệu người dùng:

- `POST /api/srs/preview` — tính lịch ôn mới (BR-01 → BR-05)
- `POST /api/words/validate` — kiểm tra dữ liệu một từ (AC-02.1, AC-02.4, AC-02.5)
- `GET /api/today` — "hôm nay" theo giờ Việt Nam (BR-00)

Nhóm **Kho từ** (cần đăng nhập app ở cùng trình duyệt; chưa đăng nhập → 401). Các API này **thay đổi dữ liệu thật**, nên demo trên từ tạo riêng:

- `GET /api/words` — danh sách từ · `POST /api/words` — thêm từ (US-02)
- `GET /api/words/{id}` — chi tiết + trạng thái SRS
- `PUT /api/words/{id}` — sửa từ, SRS giữ nguyên (AC-05.1) · `DELETE /api/words/{id}` — xoá, lưu vào `deleted_words` (AC-05.2)

## Chạy test

`npm test`
