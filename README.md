# 🥖 BAMI SÀI GÒN - HỆ THỐNG WEBSITE BÁNH MÌ VÀ QUẢN TRỊ KINH DOANH

Website bán hàng và quản trị hoàn chỉnh cho thương hiệu **Bami Sài Gòn**, tích hợp quy trình đặt món trực tuyến 24/7, tự động tính toán phí giao hàng theo khu vực, quét mã chuyển khoản VietQR, quản trị đơn hàng với âm báo thời gian thực và trợ lý AI thông minh bằng tiếng Việt.

---

## 🌟 TÍNH NĂNG NỔI BẬT

### 1. Phía Khách Hàng (Customer Storefront)
- **Nhận diện thiết kế chuẩn:** Tông màu vàng ấm (`#F5BD42`), kem nhạt (`#FFF8E8`), chữ nâu đậm (`#4A2115`) và điểm nhấn nâu gỗ (`#8C4A26`).
- **Giao diện di động tối ưu:** Thanh điều hướng cố định phía dưới màn hình (Thực đơn, Gọi quán, Zalo, Giỏ hàng).
- **Thực đơn sinh động:** Phân loại theo danh mục, tìm kiếm theo tên, nhãn "Nổi bật", tự động khóa đặt món khi quán đánh dấu "Hết hàng".
- **Tùy biến món ăn:** Chọn số lượng, chọn thêm nhân/topping (pate gan, trứng ốp la, xá xíu...), nhập ghi chú cho bếp (không cay, không rau, sốt riêng...).
- **Giỏ hàng lưu trữ thông minh:** Lưu trạng thái giỏ trên thiết bị (`localStorage`). Kiểm tra lại giá và trạng thái còn hàng từ máy chủ khi thanh toán.
- **Hai hình thức nhận hàng:**
  - *Nhận tại quán (Pick-up):* Chọn thời gian ghé lấy bánh.
  - *Giao tận nơi (Delivery):* Chọn khu vực giao hàng với biểu phí rõ ràng.
- **Phương thức thanh toán:** Tiền mặt (COD) hoặc Chuyển khoản VietQR hiển thị mã QR tự động tính đúng số tiền và nội dung chuyển khoản.
- **Trang theo dõi đơn hàng bảo mật:** Theo dõi tiến độ nướng bánh và giao hàng trực tiếp qua mã truy cập bảo mật khó đoán (`tracking_token`).

### 2. Phía Quản Trị Quán (Admin CMS)
- **Trình thiết lập ban đầu (Setup Wizard):** Hướng dẫn 6 bước khởi tạo thương hiệu, số điện thoại, giờ mở cửa và tài khoản ngân hàng khi đăng nhập lần đầu.
- **Bảng điều khiển (Dashboard):** Thống kê số lượng đơn theo 5 trạng thái, tách biệt rõ doanh thu đơn hoàn thành và tiền thực tế đã thu.
- **Xử lý đơn hàng thời gian thực:**
  - Đơn mới xuất hiện tức thì không cần tải lại trang (Server-Sent Events).
  - Chuông báo âm thanh chân thực bằng Web Audio API kèm nút thử âm báo.
  - Quy trình trạng thái: *Đơn mới -> Đã xác nhận -> Đang chuẩn bị -> Đang giao/Chờ nhận -> Hoàn thành*.
  - Hủy đơn bắt buộc nhập lý do.
  - In phiếu chế biến cho bếp.
- **Quản lý Menu:** Thêm/sửa món, đổi giá, chuyển đổi tức thì trạng thái Còn hàng / Hết hàng, quản lý danh mục và topping.
- **Trợ lý AI tiếng Việt (AI Assistant):**
  - Ra lệnh bằng tiếng Việt tự nhiên: *"Đổi giá bánh mì đặc biệt thành 35.000 đồng"*, *"Đánh dấu bánh mì gà hết hàng hôm nay"*, *"Đổi giờ mở cửa thành 6h đến 22h"*, *"Viết lại giới thiệu quán"*...
  - Hiển thị bảng so sánh đề xuất (Diff Preview) giá trị cũ vs mới. Chỉ lưu khi chủ quán bấm **Áp dụng**.
  - Lưu nhật ký thay đổi và có nút **Hoàn tác (Undo)**.
- **Cài đặt vận hành:** Bật/tắt nhận đơn online, nút tạm ngưng nhận đơn khi quá tải, thiết lập bảng phí giao hàng theo khu vực.
- **Quản lý ưu đãi:** Tạo mã voucher giảm %, giảm tiền cố định, giới hạn lượt dùng và ngày hết hạn.
- **Sẵn sàng kết nối App di động:** Hệ thống RESTful API v1 tại `/api/v1/...` sẵn sàng cho lập trình viên phát triển app iOS/Android.

---

## 🚀 HƯỚNG DẪN KHỞI CHẠY (LOCAL DEVELOPMENT)

### Yêu cầu:
- Đã cài đặt **Node.js** (khuyến nghị phiên bản 18+ trở lên).

### Khởi chạy 1-Click:
Nhấp đúp chuột vào file **`run.bat`** trong thư mục dự án, hoặc mở terminal và chạy:

```bash
# 1. Đi vào thư mục
cd bami-saigon

# 2. Cài đặt thư viện
npm.cmd install

# 3. Khởi động đồng thời cả Backend và Frontend
npm.cmd run dev
```

- **Website Khách hàng:** `http://localhost:5173`
- **Trang Quản trị:** `http://localhost:5173/#admin`

### Tài khoản đăng nhập thử nghiệm:
- **Chủ Quán:** `admin` / `admin123`
- **Nhân Viên:** `nhanvien` / `nhanvien123`

---

## 📚 TÀI LIỆU HƯỚNG DẪN ĐI KÈM

1. [Hướng dẫn tạo tài khoản GitHub và đưa mã nguồn lên](./docs/HUONG_DAN_GITHUB.md)
2. [Hướng dẫn triển khai trực tuyến 24/7 và gắn tên miền riêng](./docs/HUONG_DAN_TRIEN_KHAI_24_7.md)
3. [Hướng dẫn cấu hình khóa Google Gemini AI miễn phí](./docs/HUONG_DAN_CAU_HINH_AI.md)
4. [Cẩm nang sử dụng trang quản trị cho chủ quán & nhân viên](./docs/HUONG_DAN_QUAN_TRI.md)
5. [Tài liệu REST API cho App di động sau này](./docs/API_CHO_APP_DI_DONG.md)

---

## 🛠️ NGĂN XẾP CÔNG NGHỆ (TECH STACK)

- **Frontend:** React 19, TypeScript, Vite, Tailwind CSS v4, Lucide Icons, Canvas Confetti.
- **Backend:** Node.js, Express 5, Better-SQLite3 (WAL Mode), JWT Authentication, Bcrypt, Multer, Server-Sent Events (SSE).
- **AI Engine:** Google Gemini 1.5 Flash + Local Vietnamese NLP Rule-based Engine.
