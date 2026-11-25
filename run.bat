@echo off
chcp 65001 >nul
echo ========================================================
echo   🥖 KHỞI ĐỘNG HỆ THỐNG WEBSITE BÁNH MÌ BAMI SÀI GÒN
echo ========================================================
echo.
echo Đang kiểm tra thư viện và khởi động máy chủ...
echo.

cd /d "%~dp0"

if not exist node_modules (
    echo [1/3] Đang cài đặt thư viện cần thiết...
    call npm.cmd install
)

echo [2/3] Đang khởi động Backend API và Frontend Vite...
echo.
echo ========================================================
echo 🌐 Website Khách Hàng: http://localhost:5173
echo 👑 Trang Quản Trị:    http://localhost:5173/#admin
echo    - Tài khoản Chủ Quán: admin / admin123
echo    - Tài khoản Nhân Viên: nhanvien / nhanvien123
echo ========================================================
echo.

call npm.cmd run dev
pause
