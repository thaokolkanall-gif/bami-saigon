# 🤖 HƯỚNG DẪN CẤU HÌNH TRỢ LÝ AI GOOGLE GEMINI (MIỄN PHÍ)

Trang quản trị của **Bami Sài Gòn** tích hợp sẵn Trợ lý AI thông minh bằng tiếng Việt, giúp chủ quán có thể ra lệnh thay đổi giá, đổi trạng thái món, viết lại giới thiệu hay đổi giờ mở cửa bằng câu nói tự nhiên.

---

## 1. CƠ CHẾ HOẠT ĐỘNG THÔNG MINH KÉP (DUAL ENGINE)

Hệ thống được thiết kế với 2 lớp thông minh:
1. **Lớp 1: Trợ lý NLP tiếng Việt tích hợp sẵn (Local Vietnamese NLP):**
   - Hoạt động ngay lập tức **100% không cần API key**.
   - Nhận diện chính xác các câu lệnh phổ biến: đổi giá bánh, đánh dấu hết hàng/còn hàng, đổi giờ mở cửa, đổi số hotline, viết lại câu chuyện thương hiệu...
2. **Lớp 2: Google Gemini 1.5 Flash (Cloud AI):**
   - Kích hoạt khi bạn điền `GEMINI_API_KEY` vào cấu hình.
   - Phân tích linh hoạt các câu lệnh phức tạp, hiểu sâu ngữ cảnh tiếng Việt và đưa ra đề xuất tối ưu.

---

## 2. CÁCH LẤY KHÓA GEMINI API MIỄN PHÍ TỪ GOOGLE (1 PHÚT)

1. Truy cập vào trang quản lý chính thức của Google:
   **[https://aistudio.google.com/](https://aistudio.google.com/)**
2. Đăng nhập bằng tài khoản **Gmail** của bạn.
3. Nhấn vào nút xanh **"Get API key"** ở cột bên trái màn hình.
4. Nhấn **"Create API key"** -> Chọn **"Create API key in new project"**.
5. Google sẽ tạo ra một đoạn mã khóa bí mật dài (ví dụ: `AIzaSyD...`).
6. Nhấn nút **Copy** để sao chép khóa này.

---

## 3. CẤU HÌNH KHÓA VÀO HỆ THỐNG

### Chạy trên máy tính cá nhân (Thử nghiệm):
Mở file `.env` trong thư mục `bami-saigon` và dán khóa vào:
```env
GEMINI_API_KEY=AIzaSyD_khoa_gemini_cua_ban_o_day
```

### Chạy trực tuyến trên máy chủ (Render.com):
1. Vào trang Dashboard của Render -> Chọn dịch vụ `bami-saigon`.
2. Vào mục **Environment**.
3. Thêm biến:
   - Key: `GEMINI_API_KEY`
   - Value: `AIzaSyD_khoa_gemini_cua_ban_o_day`
4. Bấm **Save Changes**. Máy chủ sẽ tự động nạp khóa mới.

---

## 4. QUY TẮC AN TOÀN TUYỆT ĐỐI CHO DOANH NGHIỆP

- **AI chỉ đóng vai trò Đề xuất (Draft Proposal):** AI không bao giờ tự ý sửa đổi cơ sở dữ liệu nếu chưa có sự bấm nút **"Áp dụng ngay"** của Chủ Quán.
- **Bảo mật tuyệt đối:** Khóa Gemini API chỉ lưu trên máy chủ backend, tuyệt đối không gửi về trình duyệt của khách hàng.
- **Có nút Hoàn tác (Undo/Revert):** Bất kỳ thay đổi nào do AI thực hiện đều có thể bấm nút Hoàn tác trong trang quản trị để khôi phục lại giá trị cũ ngay lập tức.
