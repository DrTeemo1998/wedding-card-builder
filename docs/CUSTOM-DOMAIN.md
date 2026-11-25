# Tên miền riêng (Custom Domain) — thiepcuoionline.me

Builder (mục 10 · Xuất bản cho khách) đã hỗ trợ tên miền riêng:

- Ô **"Tên miền tùy chỉnh (Custom Domain)"** trong mục xuất bản. Nhập
  `thiepcuoionline.me` rồi bấm "Xuất bản cho khách", link trả về sẽ là
  `https://thiepcuoionline.me/khach-hang/<slug>/` thay vì link `github.io`.
- Nếu để trống ô này mà mở Builder ngay trên tên miền riêng (hoặc bản mirror
  `*.pages.dev` / `*.vercel.app`), Builder tự nhận tên miền đang mở làm link thiệp.
- Mỗi lần xuất bản có tên miền, Builder tự ghi / cập nhật file `CNAME` ở thư
  mục gốc của nhánh đang xuất bản (nội dung là tên miền, ví dụ
  `thiepcuoionline.me`). GitHub Pages đọc file này để biết tên miền của site.
  Lỗi ghi `CNAME` không làm hỏng lần xuất bản — link `github.io` vẫn dùng được.

## 1. DNS Records — dán vào nơi quản lý DNS của tên miền

Mua tên miền ở đâu cũng được (Namecheap, Porkbun, Cloudflare Registrar…).
DNS quản lý ở đâu thì dán bản ghi ở đó. Dán đúng 4 bản ghi A cho tên miền gốc
(`@`) và 1 bản ghi CNAME cho `www`:

| Loại | Host / Tên | Giá trị | TTL |
|------|-----------|---------|-----|
| A | `@` | `185.199.108.153` | Auto / 3600 |
| A | `@` | `185.199.109.153` | Auto / 3600 |
| A | `@` | `185.199.110.153` | Auto / 3600 |
| A | `@` | `185.199.111.153` | Auto / 3600 |
| CNAME | `www` | `drteemo1998.github.io` | Auto / 3600 |

Bản ghi AAAA (IPv6, tùy chọn — thêm cho đủ chuẩn):

| Loại | Host / Tên | Giá trị |
|------|-----------|---------|
| AAAA | `@` | `2606:50c0:8000::153` |
| AAAA | `@` | `2606:50c0:8001::153` |
| AAAA | `@` | `2606:50c0:8002::153` |
| AAAA | `@` | `2606:50c0:8003::153` |

Lưu ý quan trọng:

- **Không** trỏ A về IP của repo hay của máy cá nhân — 4 IP trên là IP chung
  của GitHub Pages, dùng cho mọi repo.
- Nếu DNS đang ở **Cloudflare** (đám mây cam): để các bản ghi A/CNAME này ở
  chế độ **DNS only** (đám mây xám, tắt proxy). Bật proxy (đám mây cam) sẽ
  làm GitHub không cấp được chứng chỉ HTTPS cho tên miền.
- Sau khi dán DNS, đợi DNS nhận (thường vài phút đến 1 giờ). Kiểm tra bằng
  lệnh `nslookup thiepcuoionline.me` hoặc trang `dnschecker.org`.

## 2. Enforce HTTPS (bật sau khi DNS nhận)

1. Mở repo → **Settings → Pages** (mục Build and deployment).
2. Khi DNS đã trỏ đúng, GitHub tự cấp chứng chỉ cho tên miền (thường dưới
   1 giờ, tối đa 24 giờ) và ô **Enforce HTTPS** sẽ bấm được — tick vào đó.
3. Từ lúc này khách mở `http://` sẽ tự chuyển sang `https://`, tránh lỗi
   chứng chỉ khi mở link trên Zalo / Messenger.
4. Nếu ô Enforce HTTPS vẫn xám sau 24 giờ: kiểm tra lại 4 bản ghi A (sai 1 IP
   cũng không cấp được chứng chỉ) và tắt proxy Cloudflare nếu đang bật.

## 3. Bản mirror 0 đồng — chạy thử trước khi mua tên miền

Repo là web tĩnh, không cần build, nên cả Cloudflare Pages và Vercel đều
deploy được ngay bằng cách nối thẳng repo GitHub. Chọn 1 trong 2:

### Cloudflare Pages (khuyên dùng — cùng hệ với DNS Cloudflare)

1. Đăng nhập [dash.cloudflare.com](https://dash.cloudflare.com) → **Workers &
   Pages** → **Create** → tab **Pages** → **Connect to Git**.
2. Chọn repo `DrTeemo1998/wedding-card-builder` (cấp quyền cho Cloudflare đọc
   repo nếu được hỏi).
3. Cấu hình build:
   - **Project name:** `thiepcuoionline`
   - **Production branch:** `main`
   - **Framework preset:** `None`
   - **Build command:** để trống
   - **Build output directory:** `/` (thư mục gốc)
4. **Save and Deploy** → nhận link `https://thiepcuoionline.pages.dev`.
   Mở Builder trên link này, Builder tự nhận `thiepcuoionline.pages.dev`
   làm tên miền khi xuất bản.

### Vercel

1. Đăng nhập [vercel.com](https://vercel.com) → **Add New… → Project** →
   **Import Git Repository** → chọn `DrTeemo1998/wedding-card-builder`.
2. Cấu hình:
   - **Project Name:** `thiepcuoionline`
   - **Framework Preset:** `Other`
   - **Root Directory:** `./`
   - **Build Command:** để trống (override rồi xóa)
   - **Output Directory:** để trống
3. **Deploy** → nhận link `https://thiepcuoionline.vercel.app`.

Lưu ý về mirror: mirror chỉ là bản chạy thử — file thiệp xuất từ Builder trên
mirror vẫn đẩy về đúng repo GitHub (theo Owner / Repo / Branch đã nhập trong
mục 10), nên link thiệp cuối cùng vẫn do tên miền đã nhập trong Builder quyết
định. Khi đã mua `thiepcuoionline.me` và trỏ DNS xong, dùng link tên miền
riêng làm link chính cho khách.
