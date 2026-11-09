# Hợp đồng API: FE Next.js và BE Spring Boot

FE local: `http://localhost:3000`. BE local: `http://localhost:8080`. Các API thành công trả HTTP 200 và JSON UTF-8. Đây là hợp đồng để nhóm thực hiện, không phải xác nhận backend đã chạy.

## `GET /`

```json
{
  "message": "K6 Buổi tối API"
}
```

## `GET /api/info`

```json
{
  "groupName": "K6 Buổi tối",
  "description": "Cùng xây dựng và triển khai ứng dụng Fullstack",
  "status": "running",
  "serverTime": "2026-11-08T14:00:00Z"
}
```

`serverTime` ở ví dụ là minh họa. BE tạo thời gian mới cho mỗi request bằng `Instant.now().toString()`, dùng UTC ISO 8601. FE hiển thị theo múi giờ `Asia/Ho_Chi_Minh`. `status` là trạng thái ứng dụng Java, không phải kết quả kiểm tra toàn bộ Docker/CI/CD.

## `GET /api/members`

```json
{
  "members": [
    { "name": "Minh" },
    { "name": "Lợi" },
    { "name": "Tuấn" },
    { "name": "Hoàng Anh" }
  ]
}
```

FE lấy số thành viên bằng `members.length`; không lưu thêm một biến đếm riêng. Nếu BE trả mảng rỗng hợp lệ, FE hiển thị trạng thái chưa có thành viên và số 0.

## `GET /health`

```json
{
  "status": "ok"
}
```

Endpoint này phục vụ kiểm tra sức khỏe ứng dụng sau deploy. Nút kiểm tra trên FE dùng `/api/info` và `/api/members`.

## Cách kết nối

- FE đọc URL từ `NEXT_PUBLIC_API_BASE_URL`, bỏ dấu `/` cuối trước khi ghép endpoint.
- Spring cho phép CORS với request GET từ `http://localhost:3000`; đổi origin bằng `APP_FRONTEND_ORIGIN` khi deploy.
- `/` của Next và `/` của Java không xung đột vì chạy trên hai cổng khác nhau.
- Chế độ API thật không tự chuyển sang dữ liệu mẫu nếu mất kết nối, HTTP lỗi hoặc JSON không đúng hợp đồng.
- FE khóa nút trong lúc chờ và hiển thị lỗi có thể thử lại. Thời gian/số lượng trong kết quả mẫu không phải dữ liệu trực tiếp từ server.

Đọc tiếp [hướng dẫn tự làm backend](../backend/README.md).
