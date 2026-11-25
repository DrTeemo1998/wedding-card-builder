# Nhận RSVP / Lời chúc — cấu hình nơi nhận thật

Thiệp xuất là web tĩnh nên không có database riêng. Lời chúc của khách được gửi
thật về một trong hai nơi dưới đây, do Admin chọn trong Builder, mục **9 · Nhận
RSVP / Lời chúc**. Nếu chưa cấu hình gì, thiệp chỉ lưu lời chúc trên máy khách
(localStorage) và báo rõ là chưa cấu hình — không báo thành công giả.

## Cách 1 (khuyên dùng): Google Apps Script → Google Sheet

Dùng file Google Sheet mẫu **`mau-google-sheet-thiep-cuoi`** (sheet
`5_RSVP_KHACH_MOI` nhận RSVP) và mã Apps Script đã có trong dự án cũ
(`apps-script-full.gs`).

1. Mở file Sheet `mau-google-sheet-thiep-cuoi` trên Google Drive.
2. Mở **Extensions → Apps Script**, dán mã từ `apps-script-full.gs`.
3. Bấm **Deploy → New deployment → Web app**:
   - Execute as: **Me**
   - Who has access: **Anyone**
4. Bấm Deploy, copy link dạng `https://script.google.com/macros/s/…/exec`.
5. Trong Builder, mục 9, chọn **Google Apps Script**, dán link `/exec` vào ô
   **Apps Script Web App URL**, rồi bấm **Xuất file HTML độc lập** lại.
6. Kiểm thử: mở thiệp đã xuất, gửi 1 lời chúc test, mở sheet
   `5_RSVP_KHACH_MOI` xem đã có dòng mới chưa.

Lưu ý kỹ thuật: thiệp gửi bằng `fetch` với `mode: 'no-cors'` nên trình duyệt
không đọc được phản hồi từ Apps Script. Thiệp chỉ báo "đang ghi vào Sheet"
khi gửi đi không lỗi mạng, đồng thời luôn lưu thêm 1 bản trên máy khách để
khách thấy lời chúc của mình ngay.

**Lời chúc 2 chiều:** thiệp đã xuất còn đọc lại lời chúc từ Sheet để hiện
ngay trên thiệp cho cả khách gửi lẫn cô dâu chú rể cùng xem — bằng cách gọi
`.../exec?callback=__wcbWishes` (JSONP, `doGet` trong
`apps-script-full.gs` trả về danh sách lời chúc). Chỉ tên / tham dự / số
người / lời chúc / thời gian được trả về, **SĐT của khách không bao giờ
hiện trên thiệp**. Mỗi lần sửa mã Apps Script phải Deploy lại (New
deployment) thì link `/exec` mới chạy mã mới.

## Cách 2 (thay thế): Formspree → Email

Không cần Sheet, lời chúc chuyển tiếp về email của bạn.

1. Tạo form miễn phí tại https://formspree.io (đăng ký, tạo form mới).
2. Copy endpoint dạng `https://formspree.io/f/xxxx`.
3. Trong Builder, mục 9, chọn **Formspree**, dán endpoint vào ô
   **Formspree endpoint**, rồi xuất lại thiệp.
4. Kiểm thử: gửi 1 lời chúc test trên thiệp đã xuất, kiểm tra hộp thư.

## Cách 3: Chỉ lưu trên máy khách

Chọn **Chỉ lưu trên máy này** trong Builder. Lời chúc chỉ hiện trên trình
duyệt của chính khách đó, không gửi đi đâu. Chỉ dùng để demo.

## Thiệp gửi những gì? (ánh xạ trường dữ liệu)

Thiệp POST JSON về Apps Script với đúng các khóa mà `doPost()` trong
`docs/apps-script-full.gs` đọc (kèm thêm khóa tiếng Việt để tương thích):

| Thiệp gửi | Apps Script đọc thành | Ghi vào sheet 5_RSVP_KHACH_MOI |
|---|---|---|
| `name` | `d.name` | Cột tên khách |
| `phone` | `d.phone` | Cột SĐT |
| `attending` ("Tham dự" / "Không tham dự được") | `d.attending` | Cột tham dự |
| `guests` (số người đi cùng) | `d.guests` | Cột số người |
| `wish` | `d.wish` | Cột lời chúc |
| — (tự sinh) | `nowVn_()` | Cột thời gian, giờ Việt Nam |

Mã Apps Script tìm cột theo **tiêu đề cột thật** của sheet 5, không ghi cứng
thứ tự cột. Formspree nhận cùng các trường, hiển thị trong email theo tên
trường (`name`, `phone`, `attending`, `guests`, `message`).

## Những điểm dễ sai khi deploy Apps Script

- **Múi giờ:** trong Sheet, vào File → Settings → Locale: Vietnam,
  Time zone: (GMT+07:00) Ho Chi Minh. Mã cũ để America/Los_Angeles nên
  thời gian ghi vào Sheet có thể lệch ~15 giờ.
- **Quyền truy cập:** Web App phải để Who has access: **Anyone** (kể cả
  Anyone with Google account cũng được, nhưng Anyone là đơn giản nhất cho
  khách mời không cần đăng nhập). Execute as: **Me**.
- **Sửa mã xong phải deploy lại:** mỗi lần sửa `apps-script-full.gs` thì
  Deploy → **New deployment** (không phải chỉnh deployment cũ) rồi copy
  link `/exec` mới dán lại vào Builder và xuất lại thiệp.
- **Link `/exec` chứ không phải `/dev`:** link kết thúc bằng `/dev` chỉ
  chạy cho tài khoản chủ Sheet, khách sẽ bị chặn. Link dùng cho thiệp phải
  kết thúc bằng `/exec`.
- **Lỗi CORS / không gửi được:** thiệp gửi Apps Script bằng `fetch` với
  `mode: 'no-cors'` và `Content-Type: text/plain` chính là để tránh lỗi CORS
  của Apps Script. Nếu vẫn lỗi, kiểm tra lại link `/exec` có còn sống không
  (mở link trên trình duyệt phải trả về JSON dữ liệu Sheet, không phải trang lỗi).
- **Không thấy dòng mới trong Sheet:** kiểm tra tên sheet phải đúng
  `5_RSVP_KHACH_MOI` và hàng 1 phải có tiêu đề cột (Tên, SĐT, Tham dự,
  Số người, Lời chúc, Thời gian). Gửi 1 lời chúc test rồi F5 Sheet.
- **Formspree chưa nhận:** form miễn phí có giới hạn số lượt gửi/tháng;
  lần đầu Formspree gửi email xác nhận — phải bấm xác nhận trong email thì
  form mới kích hoạt. Kiểm tra cả hộp thư rác.
- **Quyền riêng tư:** RSVP gửi kèm tên + SĐT khách mời. Chỉ dán URL vào
  thiệp của đúng cặp đôi đó, không dùng chung một Web App / một form cho
  nhiều cặp đôi khác nhau.
