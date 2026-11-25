# Wedding Card Builder — Tạo thiệp cưới online

Admin Builder tạo thiệp cưới online: nhập liệu, xem trước trực tiếp (Live Preview),
xuất thành **1 file HTML độc lập** gửi khách, hoặc **đẩy thẳng lên GitHub Pages**
cho khách qua GitHub REST API.

- **Tech:** Vanilla JS (ES6+), Tailwind CSS qua CDN **chỉ cho trang Builder**.
  File thiệp xuất ra inline toàn bộ CSS/JS, dùng font hệ thống, không framework nặng —
  tải nhanh trên mobile khi khách mở link qua Zalo / Messenger.
- **Hiệu năng:** Particle Engine Canvas nhẹ (tối đa 36 hạt mobile / 70 hạt desktop,
  mobile = màn hình ≤640px hoặc máy có cảm ứng), tự dừng khi tab ẩn hoặc khi
  hệ thống bật giảm chuyển động; DPR giới hạn ở 2; ảnh dùng link do admin
  nhập (không base64 ảnh lớn).
- **Nhạc nền:** KHÔNG autoplay có tiếng — Safari iOS và Chrome Android bắt
  buộc phải có một lần chạm của người dùng mới cho phát tiếng, nên nhạc chỉ
  phát khi khách chạm nút ♪. Nếu trình duyệt chặn, nút quay về trạng thái Tắt.

## Dữ liệu mẫu — cần xác nhận

Thiệp mẫu trong repo là cặp đôi **Trần Minh Nhật & Nguyễn Thái Hà, cưới Chủ nhật
20/12/2026, hạn RSVP 10/12/2026**, lấy từ file Google Sheet `mau-google-sheet-thiep-cuoi`.

> ⚠️ **DỮ LIỆU MẪU - CẦN XÁC NHẬN trước khi gửi khách thật:**
>
> - Tên địa điểm tiệc **“Nhà Hàng Crown Tiền Hải”** trong Sheet chưa xác nhận 100%
>   có phải là Crown Palace hay không — cần gọi điện xác nhận với khách.
> - Số tài khoản cô dâu Vietcombank **376634531** chỉ có 9 chữ số, chưa xác thực.
> - Tên phụ huynh, số điện thoại và các mốc câu chuyện là dữ liệu mẫu trong Sheet gốc.
>
> Cảnh báo này cũng hiển thị trong app và ngay đầu file thiệp mẫu đã xuất.
> Không tự bịa thêm số tài khoản, địa chỉ chi tiết hay số điện thoại khác.

## Chạy local

Không cần build, không cần server. Mở trực tiếp file `index.html` bằng trình duyệt,
hoặc chạy server tĩnh cho chắc:

```bash
cd wedding-card-builder
python3 -m http.server 8000
# mở http://localhost:8000
```

## Cách dùng Builder

1. Mở `index.html` → bấm **Nạp dữ liệu mẫu** để xem thiệp Minh Nhật & Thái Hà,
   hoặc nhập dữ liệu khách mới từ đầu.
2. Soạn ở cột trái (desktop) hoặc tab **Soạn thiệp** (mobile) — cột phải xem trước
   trực tiếp, chuyển được khung Mobile 390px / Desktop.
3. Chọn 1 trong 20 template, bật/tắt và đổi loại hiệu ứng hạt rơi:
   - Truyền thống đỏ vàng
   - Hiện đại tối giản
   - Sang trọng cổ điển
   - Hoa đào hồng pastel
   - Vườn xanh rustic
4. Mục mừng cưới: nhập đủ Ngân hàng + Số TK + Tên chủ TK → mã QR VietQR tự sinh
   (ảnh từ `img.vietqr.io`, có nút sao chép STK).
5. Dữ liệu tự lưu vào localStorage của trình duyệt (`wedding-builder-v1`).

## Xuất file HTML độc lập

Bấm **“⬇ Xuất file HTML độc lập”** → tải về file `<slug>.html` (ví dụ
`minh-nhat-thai-ha.html`). File này chạy độc lập, không cần server:

- Đếm ngược tới ngày cưới (giờ Việt Nam, mốc lễ Vu Quy)
- Hiệu ứng hạt rơi Canvas, nút bật/tắt nhạc MP3 (chỉ phát sau lần chạm đầu tiên)
- Mã QR VietQR, bản đồ Google Maps nhúng
- RSVP + sổ lưu bút **gửi thật** về Google Sheet (Apps Script) hoặc Formspree
  nếu Admin đã cấu hình ở mục 9 trong Builder — xem **[docs/RSVP.md](docs/RSVP.md)**.
  Chưa cấu hình thì thiệp chỉ lưu lời chúc trên máy khách và báo rõ là chưa
  cấu hình, không báo thành công giả.
- Album ảnh, lịch trình, câu chuyện tình yêu

Khách chỉ việc up file này lên bất kỳ hosting nào là chạy.

## Nhận RSVP / Lời chúc thật (không form chết)

Thiệp xuất là web tĩnh, không có database riêng. Trong Builder, mục
**9 · Nhận RSVP / Lời chúc**, chọn một trong ba chế độ:

1. **Google Apps Script → Google Sheet** (khuyên dùng): deploy mã trong
   [`docs/apps-script-full.gs`](docs/apps-script-full.gs) thành Web App trên
   file Sheet mẫu `mau-google-sheet-thiep-cuoi`, dán link `/exec` vào Builder.
   Khách gửi lời chúc, Apps Script ghi thẳng vào sheet `5_RSVP_KHACH_MOI`.
2. **Formspree → Email**: tạo form miễn phí trên formspree.io, dán endpoint
   `https://formspree.io/f/xxxx` vào Builder.
3. **Chỉ lưu trên máy khách** (mặc định): khách vẫn thấy lời chúc của mình ngay,
   nhưng cô dâu chú rể không nhận được.

Hướng dẫn từng bước, ánh xạ trường dữ liệu và các lỗi hay gặp xem
**[docs/RSVP.md](docs/RSVP.md)**. Không có URL Apps Script / Formspree thật
nào được bịa sẵn trong repo — Admin phải dán URL thật của từng khách.

## Xuất bản cho khách (Push GitHub)

Trong Builder, mục **9 · Xuất bản cho khách (Push GitHub)**:

1. Nhập **GitHub Owner** (tên tài khoản), **Repo** (mặc định `wedding-card-builder`),
   **Branch** (mặc định `main`).
2. Nhập **Personal Access Token** (xem mục dưới), tick **“Lưu token trên máy này”**
   nếu muốn giữ lại trên trình duyệt này.
3. Bấm **“🚀 Xuất bản cho khách”** — hệ thống gọi GitHub REST API:
   `GET /repos/{owner}/{repo}/contents/khach-hang/{slug}/index.html` để lấy `sha`
   (nếu file đã có), rồi `PUT` cùng endpoint với nội dung base64 (UTF-8).
4. Thành công sẽ hiện link Pages dạng
   `https://<owner>.github.io/<repo>/khach-hang/<slug>/` + nút **Sao chép link Pages**.
   GitHub Pages cần 1–2 phút để cập nhật lần đầu.
5. Lỗi hiển thị rõ từng bước: 401 = token sai/hết hạn, 404 = repo hoặc nhánh
   không tồn tại, 422 = dữ liệu không hợp lệ.

### Cấu hình GitHub Token

Tạo token tại **GitHub → Settings → Developer settings → Personal access tokens**:

- **Classic PAT:** tick scope `repo`.
- **Fine-grained PAT:** chọn đúng repo này, cấp quyền **Contents: Read and write**.

Lưu ý:

- Token **chỉ được gửi tới `api.github.com`**, không gửi đi nơi nào khác.
- Token chỉ lưu vào localStorage khi bạn tick “Lưu token trên máy này”;
  bấm **Xoá token** để gỡ khỏi máy.
- Không commit token vào repo, không gửi token qua chat/email.

## Deploy GitHub Pages

Xem file **[DEPLOY.md](DEPLOY.md)**. Tóm tắt — tạo repo **trống** trên GitHub
(tên `wedding-card-builder`, Public, không tick “Add a README”), rồi chạy
1 lệnh duy nhất trong thư mục repo:

```bash
./deploy.sh https://github.com/<tên-tài-khoản-github>/wedding-card-builder.git
# Windows: deploy.bat https://github.com/<tên-tài-khoản-github>/wedding-card-builder.git
# Không đưa link thì script sẽ hỏi nhập.
```

Script tự làm: `git remote add origin` (đã có remote thì `set-url`),
`git branch -M main`, `git push -u origin main` + `git push -u origin dev`.
Không hardcode username nào trong script.

Cách thủ công bằng GitHub CLI vẫn dùng được:

```bash
gh auth login
gh repo create wedding-card-builder --public --source=. --remote=origin --push
git push -u origin dev
```

Rồi vào **Settings → Pages → Source: GitHub Actions**. Workflow
`.github/workflows/pages.yml` tự deploy nhánh `main` mỗi lần push.

## Cấu trúc repo

```
wedding-card-builder/
├── index.html                  # Admin Builder chính (split-screen)
├── assets/
│   ├── css/style.css           # Style riêng của Builder
│   └── js/
│       ├── app.js              # State, render preview, GitHub push
│       ├── particles.js        # Particle Engine Canvas
│       ├── export-template.js  # buildStandaloneHTML(state) + 20 template
│       └── sample-data.js      # Dữ liệu mẫu Minh Nhật & Thái Hà
├── examples/minh-nhat-thai-ha/index.html   # Thiệp mẫu đã xuất
├── khach-hang/minh-nhat-thai-ha/index.html # Bản sao — đúng đường dẫn push GitHub
├── deploy.sh / deploy.bat      # Deploy 1 lệnh: gắn remote + push main & dev
├── docs/
│   ├── RSVP.md                 # Hướng dẫn nhận RSVP thật (Apps Script / Formspree)
│   └── apps-script-full.gs     # Mã Apps Script ghi RSVP về Sheet mẫu
├── .github/workflows/pages.yml # Deploy GitHub Pages từ main
├── .nojekyll
├── .gitignore
├── DEPLOY.md
└── README.md
```

## Nhánh

- `main` — production (GitHub Pages deploy từ nhánh này).
- `dev` — môi trường phát triển.
