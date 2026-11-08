# BE K6 Buổi tối: chạy dự án rồi tự viết API

Project Spring Boot đã được tạo; bốn API bên dưới **chưa được viết trong source hiện tại**. Hướng dẫn này để Lợi và Hoàng Anh tự thực hành.

## 1. Khởi động bằng JDK đã cài

Máy đã có JDK Temurin 25 tại `E:\K6fullstack`, nhưng terminal vẫn có thể gọi Java 8. Mở PowerShell và chạy:

```powershell
Set-Location 'E:\K6fullstack\my-app\backend'
$env:JAVA_HOME = 'E:\K6fullstack'
$env:Path = "$env:JAVA_HOME\bin;$env:Path"
java -version
javac -version
.\mvnw.cmd -v
.\mvnw.cmd spring-boot:run
```

`java`, `javac` và Maven cần báo Java 25. Đây là đường dẫn cài JDK **trên máy này**; máy khác phải dùng thư mục JDK tương ứng. Hai lệnh `$env:...` chỉ có hiệu lực trong terminal hiện tại; lặp lại khi mở terminal mới cho đến khi cấu hình `JAVA_HOME`/`Path` trong Windows. Không đặt `\bin` trong giá trị `JAVA_HOME`.

Giữ `<java.version>21</java.version>` trong `pom.xml`: JDK 25 có thể biên dịch cho Java 21. Không cần đổi version của project chỉ vì máy đang chạy JDK 25.

Lần đầu Maven tải thư viện nên cần mạng. Chờ log có **`Tomcat started on port 8080`** và **`Started BackendApplication`**, rồi **giữ terminal này chạy**. `Ctrl+C` sẽ dừng BE. Nếu báo cổng 8080 đã được dùng, kiểm tra terminal BE cũ trước khi khởi động thêm.

Mở **terminal thứ hai** để gọi API:

```powershell
curl.exe -i http://localhost:8080/health
```

- `Failed to connect`/`Connection refused`: chưa có BE lắng nghe ở cổng này; xem lỗi trong terminal thứ nhất.
- HTTP **404**: đã kết nối được BE, nhưng chưa viết endpoint `/health`. Đây là kết quả dự kiến của project starter trước bước 3.

## 2. Phân biệt hai file Java

- `src/main/java/com/k6/team/BackendApplication.java` chứa `public class BackendApplication`, `@SpringBootApplication` và `main()`. Giữ nguyên: đây là điểm khởi động.
- Tạo **file riêng** `src/main/java/com/k6/team/TeamController.java` cho `public class TeamController`. Đây là nơi nhận request và trả JSON.
- Tên file phải trùng tên `public class`; cả hai dùng `package com.k6.team;`. Không đổi tên file application thành controller.

## 3. Cấu hình rồi viết controller

Trước tiên, sửa `src/main/resources/application.properties` thành:

```properties
spring.application.name=backend
server.port=${SERVER_PORT:8080}
app.frontend-origin=${APP_FRONTEND_ORIGIN:http://localhost:3000}
```

Sau đó tạo `src/main/java/com/k6/team/TeamController.java`:

```java
package com.k6.team;

import java.time.Instant;
import java.util.List;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMethod;
import org.springframework.web.bind.annotation.RestController;

@RestController
@CrossOrigin(origins = "${app.frontend-origin}", methods = RequestMethod.GET)
public class TeamController {
    private static final List<Member> MEMBERS = List.of(
        new Member("Minh"),
        new Member("Lợi"),
        new Member("Tuấn"),
        new Member("Hoàng Anh")
    );

    @GetMapping("/")
    public MessageResponse home() {
        return new MessageResponse("K6 Buổi tối API");
    }

    @GetMapping("/api/info")
    public InfoResponse info() {
        return new InfoResponse(
            "K6 Buổi tối",
            "Cùng xây dựng và triển khai ứng dụng Fullstack",
            "running",
            Instant.now().toString()
        );
    }

    @GetMapping("/api/members")
    public MembersResponse members() {
        return new MembersResponse(MEMBERS);
    }

    @GetMapping("/health")
    public HealthResponse health() {
        return new HealthResponse("ok");
    }

    public record MessageResponse(String message) {}
    public record InfoResponse(
        String groupName, String description, String status, String serverTime
    ) {}
    public record Member(String name) {}
    public record MembersResponse(List<Member> members) {}
    public record HealthResponse(String status) {}
}
```

`@GetMapping` gắn URL với method. `@RestController` cho Spring chuyển kết quả thành JSON. Các `record` là DTO, mô tả trường dữ liệu FE nhận. Dữ liệu thành viên đang ở bộ nhớ, chưa cần database.

Lưu file dạng UTF-8. `Instant.now()` nằm trong `info()` để mỗi request có thời gian mới, theo UTC ISO 8601. `@CrossOrigin` cho FE tại `http://localhost:3000` đọc phản hồi; khi deploy đặt `APP_FRONTEND_ORIGIN` bằng origin FE thực tế, không thêm `/` cuối.

Có thể làm từng method để hiểu và kiểm tra dần. Lợi phụ trách `/` và `/api/info`; Hoàng Anh phụ trách `/api/members` và `/health`. Thống nhất người sửa controller hoặc tách controller thành các file khác nhau để tránh conflict.

## 4. Chạy lại và kiểm tra

Sau khi lưu source, dừng BE bằng `Ctrl+C` ở terminal thứ nhất, rồi chạy lại `.\mvnw.cmd spring-boot:run`. Chờ log khởi động thành công. Terminal thứ hai:

```powershell
curl.exe -i http://localhost:8080/
curl.exe -i http://localhost:8080/api/info
curl.exe -i http://localhost:8080/api/members
curl.exe -i http://localhost:8080/health
curl.exe -i -H "Origin: http://localhost:3000" http://localhost:8080/api/info
```

Bốn API cần HTTP 200; `/health` trả `{"status":"ok"}`, `/api/members` có 4 người. Gọi `/api/info` hai lần để thấy `serverTime` thay đổi. Lệnh có `Origin` cần header `Access-Control-Allow-Origin: http://localhost:3000`.

Tại thư mục `backend/`, dùng terminal đã cấu hình JDK để kiểm tra và build:

```powershell
.\mvnw.cmd test
.\mvnw.cmd clean verify
```

Chờ `BUILD SUCCESS`. Test starter kiểm tra Spring context; các lệnh HTTP ở trên kiểm tra API. JAR được tạo trong `target/`; không commit thư mục này. Đối chiếu [hợp đồng API](../docs/api-contract.md) nếu JSON không khớp FE.

## 5. Nối FE thật

Giữ BE chạy. Sửa `.env.local` ở **thư mục gốc repo**, không phải trong `backend/`:

```dotenv
NEXT_PUBLIC_USE_MOCK_API=false
NEXT_PUBLIC_API_BASE_URL=http://localhost:8080
```

Khởi động lại FE bằng `npm.cmd run dev` tại thư mục gốc; mở `http://localhost:3000` và bấm **Kiểm tra trạng thái hệ thống**. Kết quả cần có trạng thái `running`, 4 thành viên và giờ server hiển thị theo giờ Việt Nam. Dừng BE rồi kiểm tra lại để xác nhận FE báo lỗi; khởi động BE và thử lại để kiểm tra khôi phục.

Nếu `curl` đúng nhưng FE không gọi được, kiểm tra CORS và URL trong DevTools. Khi deploy, URL API cho trình duyệt phải là IP/domain công khai, không dùng `backend:8080`; `NEXT_PUBLIC_*` phải được đặt trước khi build FE.

Nguồn: [Spring Boot system requirements](https://docs.spring.io/spring-boot/system-requirements.html), [REST controller và record DTO](https://spring.io/guides/gs/rest-service/), [Spring CORS](https://spring.io/guides/gs/rest-service-cors/), [Next.js environment variables](https://nextjs.org/docs/app/guides/environment-variables).
