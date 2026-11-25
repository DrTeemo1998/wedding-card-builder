@echo off
REM Wedding Card Builder - deploy 1 lenh len GitHub (Windows)
REM Cach dung:
REM   deploy.bat https://github.com/<tai-khoan>/wedding-card-builder.git
REM   (khong co tham so thi script se hoi link repo)
cd /d "%~dp0"
set "URL=%~1"
if "%URL%"=="" (
  set /p URL=Dan link repo GitHub (repo TRONG vua tao tren github.com):
)
if "%URL%"=="" echo Chua co link repo, dung lai. & exit /b 1

echo 1/ Gan remote origin: %URL%
git remote get-url origin >nul 2>&1
if %errorlevel%==0 (
  git remote set-url origin "%URL%"
) else (
  git remote add origin "%URL%"
)

echo 2/ Doi nhanh chinh thanh main
git branch -M main

echo 3/ Push main + dev
git push -u origin main
git show-ref --verify --quiet refs/heads/dev >nul 2>&1
if %errorlevel%==0 (
  git push -u origin dev
) else (
  echo (khong co nhanh dev local — bo qua)
)

echo.
echo Xong! Bat GitHub Pages: repo ^> Settings ^> Pages ^> Source: GitHub Actions.
echo Link Builder:  https://^<tai-khoan^>.github.io/wedding-card-builder/
echo Link thiep mau: https://^<tai-khoan^>.github.io/wedding-card-builder/khach-hang/minh-nhat-thai-ha/
pause
