@echo off
chcp 65001 >nul
echo Đang chuyển vào thư mục dự án Bami Sài Gòn...
cd /d "C:\Users\HT\Projects\bami-saigon"

echo.
echo Đang đẩy mã nguồn lên GitHub (https://github.com/thaokolkanall-gif/bami-saigon)...
echo.
git push -u origin main

echo.
pause
