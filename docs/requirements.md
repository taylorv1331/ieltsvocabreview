# IELTS Vocab SRS App — Yêu cầu sản phẩm (MVP)

Tài liệu này là nguồn sự thật cho **chức năng** của app. Cấu trúc database nằm ở `docs/schema.sql`.
Mọi user story (US-xx) và quy tắc nghiệp vụ (BR-xx) đều có mã để code và commit có thể dẫn chiếu lại.

---

## 1. Bối cảnh & Problem statement

| Thành phần | Nội dung |
| --- | --- |
| Vấn đề | Người học IELTS ghi từ mới vào sổ hoặc Notion nhưng không có lịch ôn, nên quên phần lớn sau vài ngày |
| Ảnh hưởng tới | Người tự học IELTS band 5.5–6.0 hướng tới 7.0+, đặc biệt ở tiêu chí Lexical Resource |
| Hậu quả | Mất thời gian ôn lại từ đã nhớ, bỏ sót từ sắp quên, vốn từ không chuyển thành từ dùng được khi viết và nói |
| Giải pháp thành công | Web app tự lên lịch ôn từng từ theo SRS, mỗi ngày chỉ hiện những từ đến hạn, lưu dữ liệu riêng cho từng người |

**Mục tiêu MVP:** dùng app hằng ngày trong 30 ngày, thêm ít nhất 150 từ, mỗi phiên ôn không quá 15 phút.

**Trong phạm vi MVP:**
- Đăng nhập bằng magic link (link gửi qua email, không mật khẩu)
- Thêm / sửa / xoá từ; gắn một từ vào nhiều chủ đề IELTS
- Phiên ôn tập hằng ngày với thuật toán SRS
- Màn hình thống kê đơn giản
- Tải file mẫu CSV và nhập từ hàng loạt bằng CSV (dùng được cho cả Excel lẫn Notion)
- Giao diện **chỉ bằng tiếng Việt**

**Ngoài phạm vi MVP (KHÔNG làm):** phát âm audio, tra từ điển qua API, chia sẻ bộ từ giữa nhiều người, app mobile, giao diện tiếng Anh hoặc song ngữ, gợi ý từ bằng AI, giới hạn số từ mới mỗi ngày.

---

## 2. Persona & ràng buộc thiết kế

> **Minh Anh, 30 tuổi, nhân viên văn phòng tự học IELTS.** Đang ở band 6.0, cần 7.0. Mỗi ngày chỉ có 15–20 phút rảnh, thường trên xe buýt hoặc trước khi ngủ. Nỗi đau lớn nhất: biết nhiều từ nhưng khi viết Task 2 vẫn chỉ nhớ ra từ quen thuộc.

Ràng buộc rút ra:
1. **Mobile-first:** mọi màn hình phải dùng tốt trên điện thoại (màn hình ~375px), nút bấm đủ lớn để chạm.
2. Mỗi thẻ từ phải hiển thị được câu ví dụ và collocation, không chỉ nghĩa.

---

## 3. User stories

| ID | User story | Ưu tiên |
| --- | --- | --- |
| US-01 | Là người học, mình muốn đăng nhập bằng magic link gửi qua email (không cần mật khẩu), để từ vựng của mình được lưu riêng và dùng được trên mọi thiết bị | Must |
| US-02 | Là người học, mình muốn thêm một từ kèm nghĩa, từ loại, câu ví dụ và collocation, để biết cách dùng chứ không chỉ biết nghĩa | Must |
| US-03 | Là người học, mình muốn mỗi ngày chỉ thấy những từ đến hạn ôn, để không tốn thời gian vào từ đã nhớ chắc | Must |
| US-04 | Là người học, mình muốn tự chấm mức nhớ của từng từ sau khi lật thẻ, để app tính lại lịch ôn cho phù hợp | Must |
| US-05 | Là người học, mình muốn sửa hoặc xoá một từ, để kho từ luôn chính xác | Must |
| US-06 | Là người học, mình muốn gắn từ vào một hoặc nhiều chủ đề IELTS (Environment, Education…) và lọc theo chủ đề, để ôn đúng mảng sắp viết | Should |
| US-07 | Là người học, mình muốn xem số từ đã học, số từ đến hạn và chuỗi ngày học liên tục, để có động lực duy trì | Should |
| US-08 | Là người học, mình muốn tìm kiếm một từ trong kho, để tránh thêm trùng | Could |
| US-09 | Là người học, mình muốn xem hướng dẫn các cột và tải file mẫu CSV dùng được cho cả Excel lẫn Notion, để chuẩn bị dữ liệu đúng định dạng ngay từ đầu | Should |
| US-10 | Là người học, mình muốn tải lên file CSV đã điền (từ Excel hoặc xuất từ Notion) để thêm nhiều từ cùng lúc, và xem dòng nào nhập được, dòng nào lỗi | Should |

### Acceptance criteria (Given / When / Then)

Mỗi dòng dưới đây là một test case. Story chỉ được coi là xong khi **mọi** dòng của nó đều đúng.

**US-01 — Đăng nhập**
- AC-01.1 — Given chưa đăng nhập, When mở bất kỳ trang nào trong app, Then bị chuyển về trang đăng nhập.
- AC-01.2 — Given nhập một email hợp lệ, When bấm "Gửi link đăng nhập", Then nhận được email chứa link; bấm link là vào thẳng app, không cần mật khẩu.
- AC-01.3 — Given email chưa từng dùng, When bấm link lần đầu, Then tài khoản mới được tạo tự động (gộp đăng ký và đăng nhập làm một bước).
- AC-01.4 — Given một link đã dùng hoặc đã hết hạn, When bấm lại, Then hiện thông báo và nút gửi link mới.
- AC-01.5 — Given tài khoản A và B đều có từ, When A đăng nhập, Then A chỉ thấy từ của A.

**US-02 — Thêm từ**
- AC-02.1 — Given đang ở form thêm từ, When bỏ trống ô "Từ vựng" hoặc "Nghĩa tiếng Việt", Then không lưu được và hiện thông báo lỗi.
- AC-02.2 — Given từ "mitigate" đã có, When thêm "Mitigate" lần nữa, Then app cảnh báo trùng (không phân biệt hoa thường).
- AC-02.3 — Given thêm từ thành công, Then từ đó đến hạn ôn ngay hôm nay.

**US-03 — Danh sách ôn hôm nay**
- AC-03.1 — Given kho có 50 từ, 8 từ có ngày ôn ≤ hôm nay, When mở màn hình Ôn tập, Then chỉ 8 từ đó hiện ra, từ quá hạn lâu nhất hiện trước.
- AC-03.2 — Given không còn từ nào đến hạn, Then hiện thông báo "Xong bài hôm nay" và ngày ôn kế tiếp.

**US-04 — Chấm mức nhớ**
- AC-04.1 — Given đang xem mặt trước thẻ (chỉ có từ), When bấm "Xem đáp án", Then hiện nghĩa, từ loại, định nghĩa tiếng Anh, ví dụ, collocation, ghi chú (ô trống thì ẩn) và 4 nút: Quên / Khó / Nhớ / Dễ.
- AC-04.2 — Given bấm một nút, Then ngày ôn tiếp theo được tính theo BR-01 → BR-05 và một dòng lịch sử ôn được lưu vào `reviews`.
- AC-04.3 — Given bấm "Quên", Then từ đó quay lại cuối phiên ôn hôm nay.

**US-05 — Sửa / xoá từ** *(AC do mình bổ sung khi code, theo cùng mẫu)*
- AC-05.1 — Given đang xem một từ, When sửa nội dung và lưu, Then nội dung mới hiện ngay; trạng thái SRS giữ nguyên.
- AC-05.2 — Given bấm "Xoá", Then app hỏi xác nhận; xác nhận xong thì từ, các liên kết chủ đề và lịch sử ôn của từ đó đều bị xoá.

**US-06 — Chủ đề**
- AC-06.1 — Given đang thêm hoặc sửa từ, Then chọn được 0, 1 hoặc nhiều chủ đề, và tạo được chủ đề mới ngay tại đó.
- AC-06.2 — Given lọc theo chủ đề "Environment", Then chỉ hiện các từ có gắn chủ đề này (kể cả từ còn gắn chủ đề khác).

**US-07 — Thống kê**
- AC-07.1 — Then hiện: tổng số từ, số từ đến hạn hôm nay, số lượt ôn hôm nay, chuỗi ngày học liên tục (streak).
- AC-07.2 — Streak = số ngày liên tiếp tính tới hôm nay (hoặc hôm qua) có ít nhất 1 dòng trong `reviews`, ngày tính theo giờ Việt Nam.

**US-08 — Tìm kiếm**
- AC-08.1 — Given gõ "miti", Then danh sách lọc ra các từ có `term` chứa "miti" (không phân biệt hoa thường).

**US-09 — Tải file mẫu**
- AC-09.1 — Given mở trang "Nhập từ", Then thấy bảng hướng dẫn gồm tên cột, ý nghĩa, bắt buộc hay không, ví dụ; cùng nút "Tải file mẫu CSV" và hướng dẫn đưa file vào Notion.
- AC-09.2 — Given file mẫu vừa tải, Then hàng đầu là đúng các `key` đang bật trong `import_fields`, theo thứ tự `sort_order`, mã hoá UTF-8 có BOM để Excel hiển thị đúng tiếng Việt.
- AC-09.3 — Given Taylor sửa một dòng trong `import_fields` (đổi ví dụ, đổi thứ tự, tắt một cột), When người dùng tải lại trang, Then bảng hướng dẫn, file mẫu và dòng "Cập nhật lần cuối" đều theo bản mới, không cần deploy lại.

**US-10 — Nhập từ hàng loạt**
- AC-10.1 — Given file thiếu cột bắt buộc (`term` hoặc `meaning_vi`), When tải lên, Then từ chối cả file và nêu tên cột còn thiếu.
- AC-10.2 — Given file 100 dòng, trong đó 3 dòng thiếu nghĩa và 2 từ đã có trong kho, When tải lên, Then nhập 95 từ và hiện báo cáo 5 dòng bị bỏ qua, kèm số dòng và lý do.
- AC-10.3 — Given file xuất từ Notion có cột `topics` dạng "Environment, Health", Then từ được gắn vào cả hai chủ đề; chủ đề chưa có được tạo mới.

---

## 4. Quy tắc nghiệp vụ

### 4.1 Quy tắc chung

| Mã | Quy tắc |
| --- | --- |
| BR-00 | "Hôm nay" luôn tính theo múi giờ **Asia/Ho_Chi_Minh** (UTC+7). Server Vercel và Postgres chạy giờ UTC, nên app phải tự tính ngày rồi truyền `due_date` khi thêm/cập nhật từ và khi lọc "đến hạn hôm nay"; không dựa vào `current_date` của database |
| BR-13 | **Magic link.** a) Link đăng nhập có hiệu lực **1 giờ** kể từ lúc gửi và chỉ dùng được **1 lần**; link hết hạn hoặc đã dùng thì xử lý theo AC-01.4. b) Sau mỗi lần gửi thành công, nút gửi bị khoá **60 giây** và hiện đếm ngược từ "Gửi lại sau 60 giây" giảm dần về 1; hết đếm ngược thì nút bấm lại được. c) Khi Supabase từ chối vì gửi quá nhiều, hiện thông báo tiếng Việt: "Bạn đã yêu cầu quá nhiều link. Vui lòng thử lại sau ít phút." (không hiện lỗi tiếng Anh gốc). d) Thông báo gửi thành công có nhắc: "Link có hiệu lực trong 1 giờ." e) Giới hạn gửi: mỗi email cách nhau tối thiểu 60 giây; toàn hệ thống tối đa **30 email/giờ**. f) Email đăng nhập gửi qua custom SMTP (Gmail), nội dung bằng tiếng Việt, link dạng `/auth/confirm?token_hash=…&type=email` để mở được trên thiết bị khác. *Mục a, e, f là cấu hình trên Supabase Dashboard (Authentication → Sign In / Providers → Email, Rate Limits, Emails), không nằm trong code; đổi cấu hình thì cập nhật lại BR này.* |

### 4.2 Thuật toán SRS (SM-2 rút gọn)

Mỗi từ lưu 4 giá trị trạng thái:

| Trường | Ý nghĩa | Giá trị khi mới thêm |
| --- | --- | --- |
| `ease_factor` | Hệ số độ dễ, dùng để nhân khoảng cách ôn; không bao giờ thấp hơn 1.3 | 2.5 |
| `interval_days` | Số ngày giữa lần ôn vừa rồi và lần ôn tới | 0 |
| `repetitions` | Số lần nhớ đúng liên tiếp | 0 |
| `due_date` | Ngày đến hạn ôn | Hôm nay |

Quy tắc khi bấm từng nút (`rating`: 0 Quên, 1 Khó, 2 Nhớ, 3 Dễ):

| Mã | Nút | Khoảng ôn mới | ease_factor | repetitions |
| --- | --- | --- | --- | --- |
| BR-01 | Quên (0) | 0 ngày, ôn lại cuối phiên hôm nay | − 0.20 | về 0 |
| BR-02 | Khó (1) | khoảng cũ × 1.2, tối thiểu 1 ngày | − 0.15 | + 1 |
| BR-03 | Nhớ (2) | `repetitions` = 0 → 1 ngày; = 1 → max(3, khoảng cũ) ngày (để khoảng ôn không co lại sau khi bấm Dễ lần đầu; sửa ngày 2026-10-02); ≥ 2 → khoảng cũ × ease_factor | giữ nguyên | + 1 |
| BR-04 | Dễ (3) | như Nhớ rồi × 1.3 (dùng ease_factor cũ, làm tròn một lần ở cuối); lần đầu (`repetitions` = 0) là 4 ngày | + 0.15 | + 1 |
| BR-05 | (mọi nút) | `due_date` = hôm nay + khoảng ôn mới; khoảng ôn làm tròn tới số nguyên gần nhất (`Math.round`) | kẹp tối thiểu 1.3 | — |

Mỗi lần chấm còn ghi một dòng vào `reviews` gồm `rating`, `interval_before`, `interval_after`.

**Ví dụ chuẩn (dùng làm unit test):** thêm *mitigate* ngày 2026-10-01, lần nào cũng bấm Nhớ, ease_factor giữ 2.5:

| Lần ôn | Ngày ôn | Khoảng mới | Ôn lần tới |
| --- | --- | --- | --- |
| 1 | 2026-10-01 | 1 | 2026-10-02 |
| 2 | 2026-10-02 | 3 | 2026-10-05 |
| 3 | 2026-10-05 | round(3 × 2.5) = 8 | 2026-10-13 |
| 4 | 2026-10-13 | 8 × 2.5 = 20 | 2026-11-02 |

Nếu ở lần 3 bấm Quên: `interval_days` = 0, `repetitions` = 0, `ease_factor` = 2.3, từ quay lại cuối phiên hôm nay.

### 4.3 Nhập dữ liệu hàng loạt

| Mã | Quy tắc |
| --- | --- |
| BR-06 | File mẫu và bảng hướng dẫn được dựng **tại thời điểm tải** từ các dòng `is_active` của `import_fields`, xếp theo `sort_order`. Không lưu file mẫu tĩnh trong code. Trang "Nhập từ" luôn đọc dữ liệu mới, không cache |
| BR-07 | Hàng tiêu đề dùng `key` (tên máy, không dấu) để khớp chính xác với database; tên tiếng Việt (`label_vi`) chỉ hiện trong bảng hướng dẫn |
| BR-08 | Mỗi `key` trùng tên một cột của `words`, riêng `topics` được tách ra và lưu vào `topics` + `word_topics`. Cột có `key` không khớp cột nào của `words` (và không phải `topics`) bị bỏ qua |
| BR-09 | Thiếu cột bắt buộc thì từ chối cả file. Cột lạ thì bỏ qua và cảnh báo |
| BR-10 | Kiểm tra từng dòng: ô bắt buộc không trống, giá trị kiểu `enum` nằm trong `allowed_values`, từ chưa có trong kho (không phân biệt hoa thường, kể cả trùng giữa các dòng trong cùng file). Dòng sai bị bỏ qua và ghi vào báo cáo; dòng đúng vẫn được nhập |
| BR-11 | Cột kiểu `list` được tách theo dấu `;` hoặc `,` (Notion xuất multi-select bằng dấu phẩy), rồi bỏ khoảng trắng thừa và giá trị rỗng. Với `collocations`, sau khi tách thì lưu lại dưới dạng chuỗi nối bằng `; ` |
| BR-12 | Từ nhập hàng loạt nhận giá trị SRS mặc định như từ thêm tay (đến hạn hôm nay). Mỗi file tối đa 500 dòng và 1 MB |

**Quy trình với Notion:** Notion → Import → CSV → chọn file mẫu (Notion tạo database có đúng các cột) → điền dữ liệu → ⋯ → Export → Markdown & CSV → giải nén, lấy file `.csv` → tải lên app.

---

## 5. Mô hình dữ liệu (tóm tắt)

Chi tiết cột, ràng buộc và RLS: xem `docs/schema.sql`.

| Bảng | Mỗi dòng là | Phục vụ story |
| --- | --- | --- |
| `auth.users` | Một tài khoản (Supabase tự quản lý) | US-01 |
| `profiles` | Thông tin thêm của người dùng, kèm `daily_goal` | US-01, US-07 |
| `topics` | Một chủ đề IELTS do người dùng tự tạo | US-06 |
| `word_topics` | Một cặp từ – chủ đề (bảng nối nhiều-nhiều) | US-06, US-10 |
| `words` | Một thẻ từ, gồm nội dung học và 4 trường trạng thái SRS | US-02, US-03, US-05, US-08, US-10 |
| `reviews` | Một lần bấm nút chấm điểm (chỉ ghi thêm, không sửa) | US-04, US-07 |
| `import_fields` | Một cột của file mẫu CSV (cấu hình chung, chỉ sửa trong Supabase Dashboard) | US-09, US-10 |

Quan hệ: `auth.users` 1–1 `profiles`; `auth.users` 1–n `topics`, `words`, `reviews`; `words` n–n `topics` qua `word_topics`; `words` 1–n `reviews`.
