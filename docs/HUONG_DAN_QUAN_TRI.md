# 👨‍🍳 CẨM NANG SỬ DỤNG TRANG QUẢN TRỊ BAMI SÀI GÒN

Hệ thống quản trị được thiết kế chuyên biệt cho chủ tiệm bánh mì, thao tác nhanh trên cả điện thoại di động và máy tính bảng/máy tính bàn.

---

## 1. ĐĂNG NHẬP VÀ PHÂN QUYỀN

Truy cập đường dẫn: **`https://ten-mien-cua-ban/#admin`** (hoặc `http://localhost:5173/#admin` trên máy tính cá nhân).

### Tài khoản mặc định:
1. **Chủ Quán (Owner):**
   - Tài khoản: `admin`
   - Mật khẩu: `admin123`
   - *Quyền hạn:* Toàn quyền chỉnh sửa giá món, thêm bớt danh mục, cấu hình ngân hàng, bật tắt nhận đơn, sử dụng trợ lý AI và xem doanh thu.
2. **Nhân Viên Thu Ngân / Bếp (Staff):**
   - Tài khoản: `nhanvien`
   - Mật khẩu: `nhanvien123`
   - *Quyền hạn:* Xem danh sách đơn hàng, xác nhận đơn, chuyển bếp làm bánh, giao shipper, cập nhật trạng thái đã thu tiền. Không có quyền sửa giá hay đổi tài khoản ngân hàng.

---

## 2. QUY TRÌNH XỬ LÝ ĐƠN HÀNG CHUẨN

Khi có khách đặt đơn trên website:
1. **Chuông báo âm thanh:** Trình duyệt sẽ phát âm báo vang lên ngay lập tức mà không cần bấm F5 tải lại trang.
2. **Huy hiệu số đơn mới:** Tab "Đơn hàng" sẽ hiển thị số lượng đơn mới màu đỏ nhấp nháy.
3. **Quy trình các bước (Status Workflow):**
   - **Bước 1 (Đơn mới):** Chủ quán/nhân viên mở chi tiết đơn, xem danh sách bánh, topping và số điện thoại khách. Bấm **"Xác nhận đơn"**.
   - **Bước 2 (Đã xác nhận):** Bấm **"Vào bếp nướng bánh"** (trạng thái chuyển sang `Đang chuẩn bị`). Bếp tiến hành nướng giòn vỏ và kẹp nhân.
   - **Bước 3 (Đang giao / Chờ nhận):** 
     - Nếu khách chọn *Nhận tại quán*: Bấm **"Sẵn sàng nhận"**. Khách đến đọc mã đơn, giao bánh và thu tiền.
     - Nếu khách chọn *Giao tận nơi*: Bấm **"Giao cho shipper"** để shipper mang đi.
   - **Bước 4 (Hoàn thành):** Sau khi khách đã nhận bánh và tiền đã thu, bấm **"Hoàn thành đơn"**.

### Trường hợp hủy đơn:
- Nếu khách gọi đổi ý hoặc hết bánh đột xuất: Bấm nút **"Hủy đơn này"**.
- Bắt buộc phải nhập lý do hủy để hệ thống lưu vào nhật ký đối soát sau này.

---

## 3. CẬP NHẬT KHO MÓN (CÒN HÀNG / HẾT HÀNG)

Khi một món nào đó hết nguyên liệu trong ngày (ví dụ hết xíu mại hoặc hết heo quay):
1. Vào mục **"Quản lý Menu"**.
2. Nhìn vào cột **"Trạng thái kho"** của món đó.
3. Bấm vào nút màu xanh **"✓ Còn hàng"** -> Nút sẽ chuyển sang màu đỏ **"✕ Hết hàng"**.
4. Ngay lập tức trên website khách hàng, món đó sẽ hiển thị nhãn "Hết hàng" và nút thêm vào giỏ sẽ tự động khóa lại, tránh việc khách đặt món mà quán không có để giao.
5. Khi làm mẻ nhân mới, chỉ cần bấm lại nút để mở bán bình thường.

---

## 4. SỬ DỤNG TRỢ LÝ AI TIẾNG VIỆT

1. Vào mục **"Trợ lý AI tiếng Việt"**.
2. Gõ câu lệnh bạn muốn vào ô chat, ví dụ:
   - *"Đổi giá bánh mì đặc biệt thành 35.000 đồng"*
   - *"Đánh dấu bánh mì gà nấm hương hết hàng hôm nay"*
   - *"Đổi giờ mở cửa từ 06:00 đến 22:30"*
   - *"Viết lại đoạn giới thiệu quán ngắn gọn hơn"*
3. Bấm nút **Gửi**.
4. AI sẽ hiển thị **Bảng so sánh đề xuất (Diff Preview)** ở cột bên phải, chỉ rõ:
   - Giá trị hiện tại là bao nhiêu.
   - Giá trị đề xuất mới là bao nhiêu.
5. Kiểm tra kỹ:
   - Nếu đồng ý: Bấm **"Áp dụng ngay"**.
   - Nếu không đồng ý: Bấm **"Hủy bỏ"**.
6. Mọi thay đổi đều được lưu vào mục **Nhật ký thay đổi** ở phía dưới, có thể bấm nút **"Hoàn tác"** bất cứ lúc nào.
