package com.library.libraryManager.modules.user.dtos.responses;

import com.library.libraryManager.modules.user.entities.User;

public record UserResponse(
        Long id,
        String username,
        String email,
        String phone,
        String fullName,
        String role,
        boolean active
) {
    // Factory method để map từ Entity sang DTO
    public static UserResponse fromEntity(User user) {
        return new UserResponse(
                user.getId(),
                user.getUsername(),
                user.getEmail(),
                user.getPhone(),
                user.getFullName(),
                user.getRole().name(),
                user.isActive()
        );
    }
}