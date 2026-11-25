# Cách đưa repo này lên GitHub và bật GitHub Pages

> Repo local đã có commit đầu trên nhánh `main` (và nhánh `dev`). Chưa push vì máy này chưa đăng nhập GitHub / chưa có remote. Làm theo 1 trong 2 cách dưới đây.

## Cách A — dùng GitHub CLI (nhanh nhất)

```bash
cd wedding-card-builder
gh auth login
gh repo create wedding-card-builder --public --source=. --remote=origin --push
git push -u origin dev
```

Sau đó vào **Settings → Pages → Build and deployment → Source: GitHub Actions**,
chờ workflow `Deploy to GitHub Pages` chạy xong. Link live:

`https://<tên-tài-khoản-github>.github.io/wedding-card-builder/`

## Cách B — tạo repo trống trên github.com rồi chạy 1 lệnh deploy

1. Vào https://github.com/new — tên repo `wedding-card-builder`, chọn Public,
   **không** tick “Add a README” (repo local đã có sẵn).
2. Chạy **1 lệnh duy nhất** trong thư mục repo (thay `<tên-tài-khoản-github>`
   bằng tên tài khoản thật của bạn):

```bash
cd wedding-card-builder
./deploy.sh https://github.com/<tên-tài-khoản-github>/wedding-card-builder.git
```

Windows:

```bat
cd wedding-card-builder
deploy.bat https://github.com/<tên-tài-khoản-github>/wedding-card-builder.git
```

Không đưa link thì script sẽ hỏi nhập. Script tự làm: `git remote add origin`
(nếu remote origin đã có thì dùng `set-url`), `git branch -M main`,
`git push -u origin main` và `git push -u origin dev`. Script không hardcode
username nào.

Làm tay (nếu không muốn dùng script):

```bash
cd wedding-card-builder
git remote add origin https://github.com/<tên-tài-khoản-github>/wedding-card-builder.git
git branch -M main
git push -u origin main
git push -u origin dev
```

3. Bật Pages như Cách A (Settings → Pages → Source: GitHub Actions).

## Kiểm tra

- Workflow chạy ở tab **Actions** của repo.
- Thiệp mẫu: `https://<tên-tài-khoản-github>.github.io/wedding-card-builder/khach-hang/minh-nhat-thai-ha/`
- Builder: `https://<tên-tài-khoản-github>.github.io/wedding-card-builder/`
