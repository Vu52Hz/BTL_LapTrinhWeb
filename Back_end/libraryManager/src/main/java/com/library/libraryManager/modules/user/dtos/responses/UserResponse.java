package com.library.libraryManager.modules.user.dtos.responses;

import com.library.libraryManager.modules.user.entities.User;
import java.time.LocalDateTime;

public record UserResponse(
        Long id,
        String username,
        String email,
        String phone,
        String fullName,
        String role,
        boolean active,
        LocalDateTime createdAt // Thêm trường này nếu FE của bạn cần hiển thị Ngày Tạo
) {
    // Factory method mặc định (lấy trạng thái hiện tại)
    public static UserResponse fromEntity(User user) {
        return new UserResponse(
                user.getId(),
                user.getUsername(),
                user.getEmail(),
                user.getPhone(),
                user.getFullName(),
                user.getRole().name(),
                user.isActive(),
                user.getCreatedAt()
        );
    }

    // Factory method dành riêng cho việc ghi đè trạng thái lịch sử
    public static UserResponse fromEntityWithHistoricalStatus(User user, boolean historicalActive) {
        return new UserResponse(
                user.getId(),
                user.getUsername(),
                user.getEmail(),
                user.getPhone(),
                user.getFullName(),
                user.getRole().name(),
                historicalActive, // Dùng trạng thái lịch sử truyền vào thay vì user.isActive()
                user.getCreatedAt()
        );
    }
}