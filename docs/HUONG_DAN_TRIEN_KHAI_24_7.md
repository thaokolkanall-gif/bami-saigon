# 🌐 HƯỚNG DẪN TRIỂN KHAI WEBSITE TRỰC TUYẾN 24/7 (ĐỘC LẬP VỚI MÁY TÍNH CHỦ QUÁN)

Để website **Bami Sài Gòn** hoạt động trực tuyến 24/7 (khách hàng vẫn truy cập và đặt bánh mì được ngay cả khi máy tính chủ quán đã tắt nguồn), mã nguồn từ GitHub cần được triển khai lên máy chủ đám mây (Cloud Server).

Dưới đây là hướng dẫn chi tiết triển khai miễn phí 100% bằng **Render.com** (hoặc **Railway.app**).

---

## PHƯƠNG ÁN 1: TRIỂN KHAI TOÀN BỘ TRÊN RENDER.COM (KHUYÊN DÙNG - MIỄN PHÍ)

Render là nền tảng đám mây rất phổ biến, hỗ trợ Node.js, tự động build và chạy website mỗi khi có thay đổi trên GitHub.

### Bước 1: Đăng ký tài khoản Render
1. Mở trình duyệt vào trang: **[https://render.com/](https://render.com/)**
2. Bấm nút **"Get Started for Free"**.
3. Chọn **"GitHub"** để đăng nhập trực tiếp bằng tài khoản GitHub bạn vừa tạo ở bước trước.

### Bước 2: Tạo Web Service mới
1. Trên màn hình Dashboard của Render, bấm nút **"New +"** ở góc trên cùng, chọn **"Web Service"**.
2. Chọn mục **"Build and deploy from a Git repository"** rồi bấm **Next**.
3. Render sẽ hiển thị danh sách các kho mã nguồn của bạn. Tìm repo **`bami-saigon`** và bấm nút **"Connect"**.
   *(Nếu chưa thấy repo, bấm "Configure account" và chọn cấp quyền cho repo `bami-saigon`).*

### Bước 3: Cấu hình thông số triển khai
Điền các ô thông tin như sau:
- **Name:** `bami-saigon` (hoặc tên bất kỳ bạn thích).
- **Region:** Chọn `Singapore` (để tốc độ tải từ Việt Nam nhanh nhất).
- **Branch:** `main`
- **Runtime:** `Node`
- **Build Command:** 
  ```bash
  npm install && npm run build
  ```
- **Start Command:**
  ```bash
  npm start
  ```
- **Instance Type:** Chọn gói **Free** ($0/month).

### Bước 4: Thêm Biến Môi Trường (Environment Variables)
Cuộn xuống phần **"Environment Variables"**, bấm **"Add Environment Variable"** và thêm các biến:
1. `NODE_ENV` = `production`
2. `PORT` = `10000`
3. `JWT_SECRET` = `dien-mot-chuoi-bi-mat-dai-tuy-y-o-day`
4. `TURSO_DATABASE_URL` = `libsql://bami-saigon-thaokolkanall-gif.aws-ap-southeast-1.turso.io`
5. `TURSO_AUTH_TOKEN` = `eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.eyJhIjoicnciLCJpYXQiOjE3OTU2ODQ0NjYsImlkIjoiMDFhMjE3MWYtOTUwMS03YWRjLThiMWQtZjZmMmVlMjRlMjg4Iiwia2lkIjoiNUxfc2NZWUJJODZhZWl2akxrTFZGSklsX2tlU2hSMFdkaWtXUFo4SmpWQSIsInJpZCI6IjgxYTA1MDNiLTk3ODAtNDU1ZC1hZjY3LTJiZGEzZDE3OTVmMiJ9.3ENz-XoB-PBqWzbq1NtYZchBjfk-Fs59bcowIR-9U_9AABkxKk8oF2DpW970kjKDfjIpiNzrR0ZPu5pFQVEqBQ`
*(Nhờ 2 biến Turso này, mỗi khi bạn sửa code và push lên GitHub, Render sẽ không bao giờ làm mất dữ liệu đơn hàng và món ăn cũ).*
6. `GEMINI_API_KEY` = *(Điền khóa Google Gemini API lấy theo file [HUONG_DAN_CAU_HINH_AI.md](./HUONG_DAN_CAU_HINH_AI.md), hoặc để trống nếu dùng trợ lý nội bộ).*

### Bước 5: Bấm "Deploy Web Service"
1. Nhấn nút xanh **"Deploy Web Service"**.
2. Render sẽ tự động kéo code từ GitHub về, chạy cài đặt thư viện và build website. Quá trình này mất khoảng 2 - 3 phút.
3. Khi màn hình hiện chữ xanh **"Live"**, trang web của bạn đã chính thức chạy trên internet!
4. Đường dẫn website công khai sẽ có dạng:
   **`https://bami-saigon.onrender.com`**

---

## HƯỚNG DẪN GẮN TÊN MIỀN RIÊNG (VÍ DỤ: `bamisaigon.vn`)

Nếu sau này bạn mua tên miền riêng (như `bamisaigon.com` hoặc `bamisaigon.vn`):
1. Trong màn hình Web Service trên Render, vào mục **Settings** -> cuộn đến phần **Custom Domains**.
2. Nhấn **"Add Custom Domain"**, nhập tên miền của bạn (ví dụ: `bamisaigon.vn` và `www.bamisaigon.vn`).
3. Render sẽ cung cấp cho bạn 2 bản ghi DNS (CNAME hoặc A Record).
4. Đăng nhập vào trang quản trị nơi bạn mua tên miền (như Mắt Bão, PA Việt Nam, Cloudflare, Namecheap...), thêm các bản ghi DNS theo hướng dẫn của Render.
5. Chờ khoảng 10 - 30 phút để mạng nhận diện. Render sẽ **tự động cấp chứng chỉ bảo mật HTTPS (SSL) miễn phí vĩnh viễn** cho tên miền của bạn.

---

## CHI PHÍ DỰ KIẾN KHI VẬN HÀNH

| Dịch vụ | Nhu cầu ban đầu (Khởi nghiệp) | Khi quán đông khách (Quy mô lớn) |
|---|---|---|
| **Máy chủ Web (Render / Railway)** | **0đ / tháng** (Dùng gói Free) | ~150.000đ - 300.000đ / tháng |
| **Lưu trữ GitHub** | **0đ / tháng** (Không giới hạn) | 0đ / tháng |
| **Google Gemini AI** | **0đ / tháng** (Gói miễn phí Google AI Studio) | 0đ / tháng (Dư thừa cho nhu cầu sửa menu) |
| **Tên miền `.com` hoặc `.vn` (Tùy chọn)** | ~250.000đ - 650.000đ / 1 năm | ~250.000đ - 650.000đ / 1 năm |

*Quán hoàn toàn có thể chạy với chi phí hạ tầng **0 đồng** trong suốt giai đoạn đầu!*
