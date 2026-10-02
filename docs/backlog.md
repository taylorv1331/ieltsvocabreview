# Backlog — việc cần xem lại sau

Ghi lại các góp ý khi kiểm tra, chưa làm ngay. Mỗi mục ghi nguồn (story / bước kiểm tra) và ngày.

| # | Ngày | Nguồn | Nội dung | Trạng thái |
| --- | --- | --- | --- | --- |
| 1 | 2026-10-01 | US-01, kiểm tra #5 | Xem lại tên mục điều hướng "Thống kê": mục này hiện chứa cả thông tin tài khoản và nút "Đăng xuất", có thể cần đổi tên (ví dụ "Tài khoản") hoặc tách riêng. Quyết định khi làm US-07 | Đã đổi tên thành "Hồ sơ" (`/profile`) ngày 2026-10-02; vị trí màn hình thống kê US-07 sẽ chốt khi làm US-07 |
| 2 | 2026-10-01 | US-03, quyết định #3 | Cân nhắc giới hạn số từ ôn mỗi ngày để đảm bảo hiệu quả học (phiên ôn ≤ 15 phút theo mục tiêu MVP). Hiện MVP hiện toàn bộ từ đến hạn, không cắt bớt ("giới hạn số từ mới mỗi ngày" nằm ngoài phạm vi). Nếu làm: có thể dùng cột `profiles.daily_goal` (đã có, mặc định 20); cần thêm user story + BR mới trước khi code | Chờ review |
| 3 | 2026-10-01 | Trao đổi khi lên kế hoạch US-03 | Thẻ đáp án (US-04) hiện **toàn bộ** thông tin của từ: nghĩa, từ loại, định nghĩa tiếng Anh, ví dụ, collocation (mỗi cụm một dòng), ghi chú; ô trống thì ẩn. Mở rộng AC-04.1 → sửa câu chữ AC-04.1 trong requirements trước khi code US-04 | Đã sửa AC-04.1; làm trong US-04 |
| 4 | 2026-10-02 | Rà soát 4 nút chấm, điểm (c) | Bấm Quên nhiều lần → ease_factor tụt về 1.3 và chỉ nút Dễ mới kéo lên ("ease hell"); từ đã thuộc lại vẫn dãn khoảng ôn rất chậm. Theo dõi khi dùng thật; nếu cần thì đề xuất BR mới (ví dụ Nhớ cũng + một chút ease) | Chờ review |
| 5 | 2026-10-02 | Rà soát 4 nút chấm, điểm (d) | Hiện khoảng ôn dự kiến dưới mỗi nút (vd: Quên · hôm nay, Khó · 1 ngày, Nhớ · 3 ngày, Dễ · 4 ngày) để chọn chính xác hơn. Tính năng mới → cần thêm AC cho US-04; làm sau khi deploy | Chờ review |
| 6 | 2026-10-02 | Rà soát sau US-04 | Policy `own words` cho phép người dùng tự sửa mọi cột của từ của mình (kể cả `due_date`, `ease_factor`) nếu gọi thẳng API Supabase bằng key công khai, không qua giao diện. Chỉ ảnh hưởng dữ liệu của chính họ → chấp nhận trong MVP. Nếu cần siết: chỉ cho cập nhật SRS qua hàm `rate_word` | Chấp nhận rủi ro |
