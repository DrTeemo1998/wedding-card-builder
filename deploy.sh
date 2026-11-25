#!/bin/bash
# Wedding Card Builder — deploy 1 lệnh lên GitHub
# Cách dùng:
#   ./deploy.sh https://github.com/<tai-khoan>/wedding-card-builder.git
#   (không có tham số thì script sẽ hỏi link repo)
set -e
cd "$(dirname "$0")"

URL="${1:-}"
if [ -z "$URL" ]; then
  echo "Dán link repo GitHub (repo TRỐNG vừa tạo trên github.com):"
  read -r URL
fi
if [ -z "$URL" ]; then echo "Chưa có link repo, dừng lại."; exit 1; fi

echo "1/ Gắn remote origin: $URL"
if git remote get-url origin >/dev/null 2>&1; then
  git remote set-url origin "$URL"
else
  git remote add origin "$URL"
fi

echo "2/ Đổi nhánh chính thành main"
git branch -M main

echo "3/ Push main + dev"
git push -u origin main
if git show-ref --verify --quiet refs/heads/dev; then
  git push -u origin dev
else
  echo "(không có nhánh dev local — bỏ qua)"
fi

echo ""
echo "Xong! Bật GitHub Pages: repo > Settings > Pages > Source: GitHub Actions."
echo "Link Builder:  https://<tai-khoan>.github.io/wedding-card-builder/"
echo "Link thiệp mẫu: https://<tai-khoan>.github.io/wedding-card-builder/khach-hang/minh-nhat-thai-ha/"
