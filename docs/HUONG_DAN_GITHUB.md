# 📖 HƯỚNG DẪN TẠO TÀI KHOẢN GITHUB VÀ ĐƯA MÃ NGUỒN LÊN (DÀNH CHO NGƯỜI MỚI)

Tài liệu này được thiết kế từng bước, trực quan, dễ hiểu nhất dành cho Chủ Quán chưa từng có tài khoản GitHub hoặc chưa từng dùng Git.

---

## BƯỚC 1: ĐĂNG KÝ TÀI KHOẢN GITHUB (HOÀN TOÀN MIỄN PHÍ)

1. Mở trình duyệt web và truy cập địa chỉ: **[https://github.com/](https://github.com/)**
2. Nhấn vào nút màu xanh **"Sign up"** ở góc trên cùng bên phải.
3. Điền các thông tin:
   - **Email:** Nhập email bạn đang sử dụng (Gmail).
   - **Password:** Tạo mật khẩu mạnh (ít nhất 8 ký tự, có chữ hoa, chữ thường và số).
   - **Username:** Đặt tên tài khoản (viết liền không dấu, ví dụ: `bamisaigon`, `bamisaigon-official`, v.v.).
4. Giải câu đố xác thực bảo mật (chọn hình ảnh theo yêu cầu) rồi bấm **"Create account"**.
5. Mở hộp thư Gmail của bạn, lấy mã gồm 8 chữ số GitHub gửi về và nhập vào màn hình xác minh.
6. Khi được hỏi các câu hỏi khảo sát ban đầu, bạn có thể bấm **"Skip personalization"** ở dưới cùng để vào thẳng trang chủ GitHub.

---

## BƯỚC 2: TẠO MỘT REPOSITORY (KHO MÃ NGUỒN) MỚI TRÊN GITHUB

1. Sau khi đăng nhập vào GitHub, nhìn góc trên bên phải có dấu **`+`**, bấm vào đó và chọn **"New repository"**.
2. Điền các trường sau:
   - **Repository name:** Điền tên `bami-saigon` (hoặc `bami-saigon-website`).
   - **Description:** Điền mô tả ngắn: `Website dat mon va quan tri Bami Sai Gon`.
   - **Public / Private:** 
     - Chọn **Private** nếu bạn muốn chỉ riêng bạn xem được mã nguồn.
     - Chọn **Public** nếu bạn muốn chia sẻ công khai.
   - ⚠️ **LƯU Ý QUAN TRỌNG:** Ở mục **"Initialize this repository with:"**, **KHÔNG TÍCH VÀO** các ô:
     - ❌ *Add a README file* (Không tích)
     - ❌ *Add .gitignore* (Không tích)
     - ❌ *Choose a license* (Không tích)
     *(Vì dự án đã có sẵn các file này rồi).*
3. Nhấn nút xanh **"Create repository"**.
4. GitHub sẽ hiển thị một trang có đường dẫn repository của bạn, dạng:
   `https://github.com/<tên-username-của-bạn>/bami-saigon.git`

---

## BƯỚC 3: ĐẨY MÃ NGUỒN TỪ MÁY TÍNH LÊN GITHUB

Dự án đã được khởi tạo sẵn git trong thư mục `bami-saigon`. Bạn chỉ cần mở cửa sổ dòng lệnh (Terminal / PowerShell / Command Prompt) và chạy các lệnh sau:

### Cách thực hiện:
1. Mở thư mục dự án `bami-saigon`:
   ```bash
   cd c:\Users\HT\Desktop\Sourd\Videotho\Cooler2\CODE\bami-saigon
   ```

2. Thêm toàn bộ mã nguồn vào lần lưu đầu tiên:
   ```bash
   git add .
   git commit -m "Khoi tao toan bo ma nguon Website Bami Sai Gon"
   ```

3. Đổi tên nhánh chính thành `main`:
   ```bash
   git branch -M main
   ```

4. Kết nối tới kho mã nguồn GitHub vừa tạo ở Bước 2:
   *(Thay `<username>` bằng tên tài khoản GitHub của bạn)*
   ```bash
   git remote add origin https://github.com/<username>/bami-saigon.git
   ```

5. Đẩy mã nguồn lên GitHub:
   ```bash
   git push -u origin main
   ```

6. Khi cửa sổ đăng nhập hiện lên:
   - Một cửa sổ trình duyệt sẽ tự động bật lên yêu cầu bấm **"Sign in with your browser"**.
   - Bấm **Authorize GitCredentialManager** để cấp quyền.
   - Sau đó mã nguồn sẽ được tải lên thành công 100%!

---

## BƯỚC 4: KIỂM TRA MÃ NGUỒN TRÊN GITHUB

1. Tải lại trang repository trên trình duyệt `https://github.com/<username>/bami-saigon`.
2. Bạn sẽ thấy toàn bộ cây thư mục `src`, `server`, `public`, `docs`, `run.bat` đã nằm an toàn trên GitHub.
3. Toàn bộ mã nguồn từ nay đã được sao lưu an toàn trên mây, không sợ mất dữ liệu kể cả khi máy tính bị hỏng hay cài lại Windows.
