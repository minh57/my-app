# K6 Buổi tối

Trang giới thiệu nhóm thực hành Fullstack/DevOps: Next.js ở thư mục gốc, backend Java Spring Boot sẽ được nhóm thực hiện trong `backend/`.

| Thành viên | Phần phụ trách |
| --- | --- |
| Minh | PM, FE, CI/CD |
| Lợi | FE, BE |
| Tuấn | Dockerfile |
| Hoàng Anh | BE |

## Chạy frontend

Cần Node.js 22.18 trở lên để chạy cả bộ test TypeScript trực tiếp; bản này đã được kiểm tra với Node.js 24.13.0.

Mở PowerShell tại thư mục repo:

```powershell
npm.cmd ci
Copy-Item .env.example .env.local
npm.cmd run dev
```

Mở [http://localhost:3000](http://localhost:3000). Dùng `npm.cmd` trên PowerShell nếu `npm` bị chặn bởi execution policy; không cần thay đổi chính sách hệ thống.

Mặc định FE dùng dữ liệu mẫu và hiển thị nhãn để phân biệt với API thật. Thông tin nhóm là dữ liệu đã thống nhất; kết quả kiểm tra trong chế độ mẫu chỉ để xem trước giao diện.

Sau khi BE chạy được ở cổng 8080, sửa `.env.local`:

```dotenv
NEXT_PUBLIC_USE_MOCK_API=false
NEXT_PUBLIC_API_BASE_URL=http://localhost:8080
```

Dừng rồi chạy lại dev server. Nút **Kiểm tra trạng thái hệ thống** sẽ gọi `/api/info` và `/api/members` của Java. Khi API lỗi, FE báo lỗi và cho thử lại, không tự đổi sang kết quả mẫu.

```powershell
npm.cmd run lint
npm.cmd test
npm.cmd run build
npm.cmd run start
```

## Tự làm backend

Thư mục `backend/` hiện chứa hướng dẫn, **chưa có ứng dụng Spring Boot để chạy**. Bắt đầu tại [hướng dẫn BE từng bước](backend/README.md), sau đó đối chiếu [hợp đồng API](docs/api-contract.md).

Hướng dẫn gồm JDK 21, tạo dự án Maven/Spring Web, controller, DTO, CORS, kiểm tra bốn API và Maven build. Không cần database hoặc đăng nhập cho bản đầu.

## Git và nhánh của Lợi

Repo đã có remote `origin` trỏ tới `https://github.com/minh57/my-app`. Nhánh local `Lợi` đã được tạo và theo dõi `origin/Lợi` từ dữ liệu remote có sẵn trên máy. Lần fetch gần nhất bị lỗi xác thực; chưa xác nhận được thay đổi mới trên GitHub và chưa push.

Git Credential Manager đã có trên máy. Trong terminal của bạn, chạy và hoàn tất đăng nhập trên trình duyệt:

```powershell
git credential-manager github login
git fetch origin
git branch -vv
git status --short --branch
```

Nếu repo riêng tư vẫn bị từ chối, kiểm tra tài khoản đã đăng nhập có được Minh mời vào repo chưa. Không gửi mật khẩu hoặc token vào chat.

Khi sẵn sàng nộp phần việc, xem `git diff`, stage đúng các file của mình, commit rồi push:

```powershell
git push -u origin "Lợi"
```

Trên GitHub, tạo Pull Request với **base: `main`**, **compare: `Lợi`** để Minh review và merge. Nếu nhánh remote đã có commit mới, xử lý chênh lệch trước khi push; không force push.

## Bàn giao Docker và CI/CD

- FE: thư mục gốc; cổng 3000; `npm.cmd run build` / `npm.cmd run start` trên Windows, `npm run build` / `npm run start` trong Linux container.
- BE sau khi nhóm hoàn thành: `backend/`; JDK 21; cổng 8080; `./mvnw clean verify` và chạy JAR trong `target/`.
- Tuấn cấu hình Docker/Compose, Minh cấu hình workflow chạy khi push vào `main`. Bản local này chưa chứa Dockerfile, Compose hoặc workflow deploy.
- Khi build FE image cho API thật, đặt `NEXT_PUBLIC_USE_MOCK_API=false` và `NEXT_PUBLIC_API_BASE_URL` bằng URL API truy cập được từ trình duyệt. `NEXT_PUBLIC_*` được đóng vào bản build; thay biến ở runtime không cập nhật JS đã build. Không dùng hostname nội bộ như `backend:8080` làm URL cho trình duyệt.
- BE nhận `APP_FRONTEND_ORIGIN` bằng origin của FE, gồm giao thức và cổng nếu có. Nếu FE dùng HTTPS, API công khai cũng cần HTTPS.
- Sau deploy kiểm tra `docker compose ps`, `docker compose logs` và `curl http://<api-host>:8080/health` (thay URL theo cổng hoặc reverse proxy thực tế).

Tham khảo: [biến môi trường Next.js](https://nextjs.org/docs/app/guides/environment-variables), [Git Credential Manager](https://github.com/git-ecosystem/git-credential-manager).
