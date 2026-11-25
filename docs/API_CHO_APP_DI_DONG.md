# 📱 TÀI LIỆU REST API CHO ỨNG DỤNG DI ĐỘNG (MOBILE APP)

Tài liệu này được biên soạn dành cho lập trình viên (Flutter / React Native / Swift / Kotlin) sẽ phát triển ứng dụng di động riêng cho **Bami Sài Gòn** trong tương lai.

Hệ thống Backend hiện tại đã được cấu hình sẵn các endpoint API v1 theo chuẩn RESTful JSON, hỗ trợ đầy đủ xác thực JWT.

---

## 1. ĐỊA CHỈ GỐC (BASE URL)

```
Môi trường phát triển: http://localhost:3001/api/v1
Môi trường trực tuyến:  https://bami-saigon.onrender.com/api/v1
```

---

## 2. DANH SÁCH ENDPOINTS CHI TIẾT

### 2.1. Đăng nhập cho App (Authentication)
- **Endpoint:** `POST /auth/login`
- **Body:**
  ```json
  {
    "username": "admin",
    "password": "your_password"
  }
  ```
- **Response thành công (200 OK):**
  ```json
  {
    "success": true,
    "data": {
      "token": "eyJhbGciOiJIUzI1NiIs...",
      "user": {
        "id": 1,
        "username": "admin",
        "full_name": "Chủ Quán Bami",
        "role": "owner"
      }
    }
  }
  ```

---

### 2.2. Lấy danh sách đơn hàng (Orders List)
- **Endpoint:** `GET /orders?status=new&page=1&limit=20`
- **Header:** `Authorization: Bearer <token>`
- **Response thành công (200 OK):**
  ```json
  {
    "success": true,
    "data": [
      {
        "id": 105,
        "order_code": "BM8924",
        "customer_name": "Nguyễn Văn An",
        "customer_phone": "0908123456",
        "order_type": "delivery",
        "address": "45 Lê Duẩn, Q.1",
        "total_amount": 75000,
        "status": "new",
        "payment_method": "cod",
        "created_at": "2026-11-25 14:30:00"
      }
    ]
  }
  ```

---

### 2.3. Lấy chi tiết đơn hàng (Order Detail)
- **Endpoint:** `GET /orders/:id`
- **Header:** `Authorization: Bearer <token>`
- **Response thành công (200 OK):**
  Trả về thông tin đơn hàng đầy đủ, kèm mảng `items` (chi tiết topping, ghi chú từng ổ bánh) và mảng `history` (lịch sử chuyển trạng thái).

---

### 2.4. Cập nhật trạng thái đơn hàng từ App (Update Status)
- **Endpoint:** `PUT /orders/:id/status`
- **Header:** `Authorization: Bearer <token>`
- **Body:**
  ```json
  {
    "status": "preparing",
    "note": "Bếp đã nhận làm bánh từ ứng dụng di động"
  }
  ```
- **Các trạng thái hợp lệ:**
  - `new`: Đơn mới
  - `confirmed`: Đã xác nhận
  - `preparing`: Đang chuẩn bị / làm bánh
  - `delivering`: Đang giao hàng / Sẵn sàng nhận tại quán
  - `completed`: Hoàn thành
  - `cancelled`: Đã hủy

---

### 2.5. Lấy số liệu thống kê tổng quan (Dashboard Stats)
- **Endpoint:** `GET /stats`
- **Header:** `Authorization: Bearer <token>`
- **Response thành công (200 OK):**
  ```json
  {
    "success": true,
    "data": {
      "count_new": 3,
      "count_preparing": 2,
      "count_delivering": 1,
      "count_completed": 45,
      "revenue_completed": 2150000
    }
  }
  ```

---

### 2.6. Đăng ký nhận thông báo đẩy (Push Notifications FCM / APNS)
- **Endpoint:** `POST /push/register`
- **Header:** `Authorization: Bearer <token>`
- **Body:**
  ```json
  {
    "device_token": "fcm_token_string_here",
    "platform": "android"
  }
  ```
- **Response:**
  ```json
  {
    "success": true,
    "message": "Đã sẵn sàng nhận Push Token khi app di động được kích hoạt trên thiết bị.",
    "registered_at": "2026-11-25T08:00:00.000Z"
  }
  ```
