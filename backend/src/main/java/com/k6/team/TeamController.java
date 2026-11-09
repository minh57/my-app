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
