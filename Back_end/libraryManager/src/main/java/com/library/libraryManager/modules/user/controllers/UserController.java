package com.library.libraryManager.modules.user.controllers;

import com.library.libraryManager.common.dtos.ApiResponse;
import com.library.libraryManager.common.exception.AppException;
import com.library.libraryManager.common.exception.ErrorCode;
import com.library.libraryManager.modules.user.dtos.requests.ChangePasswordRequest;
import com.library.libraryManager.modules.user.dtos.requests.UpdateInfoRequest;
import com.library.libraryManager.modules.user.dtos.responses.UserResponse;
import com.library.libraryManager.modules.user.entities.User;
import com.library.libraryManager.modules.user.service.UserService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/users")
@RequiredArgsConstructor
public class UserController {

    private final UserService userService;

    @GetMapping("/me")
    public ApiResponse<UserResponse> getMyInfo() {
        return ApiResponse.<UserResponse>builder()
                .result(UserResponse.fromEntity(userService.getMyInfo()))
                .build();
    }

    @PutMapping("/me")
    public ApiResponse<UserResponse> updateMyInfo(@Valid @RequestBody UpdateInfoRequest request) {
        return ApiResponse.<UserResponse>builder()
                .message("Cập nhật thông tin thành công")
                .result(UserResponse.fromEntity(userService.updateMyInfo(request)))
                .build();
    }

    @PostMapping("/me/change-password")
    public ApiResponse<Void> changePassword(@Valid @RequestBody ChangePasswordRequest request) {
        userService.changePassword(request);
        return ApiResponse.<Void>builder()
                .message("Đổi mật khẩu thành công")
                .build();
    }

    @GetMapping("/search/{username}")
    @PreAuthorize("hasRole('ADMIN')")
    public ApiResponse<UserResponse> getUserByUsername(@PathVariable String username) {
        User user = userService.findByUsername(username)
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_FOUND));
                
        return ApiResponse.<UserResponse>builder()
                .message("Tìm thấy người dùng")
                .result(UserResponse.fromEntity(user))
                .build();
    }

    @GetMapping("/search")
    @PreAuthorize("hasRole('ADMIN')")
    public ApiResponse<List<UserResponse>> searchUsers(@RequestParam(required = false) String keyword) {
        List<UserResponse> result = userService.searchActiveUsers(keyword).stream()
                .map(UserResponse::fromEntity)
                .toList();
        return ApiResponse.<List<UserResponse>>builder()
                .result(result)
                .build();
    }

    @GetMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ApiResponse<List<UserResponse>> getAllUsers() {
        List<UserResponse> result = userService.getAllUsers().stream()
                .map(UserResponse::fromEntity)
                .toList();
        return ApiResponse.<List<UserResponse>>builder()
                .result(result)
                .build();
    }

    @PutMapping("/lock/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ApiResponse<Void> lockUser(@PathVariable Long id) {
        userService.lockUser(id);
        return ApiResponse.<Void>builder()
                .message("Khóa người dùng thành công")
                .build();
    }

    @PutMapping("/unlock/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ApiResponse<Void> unlockUser(@PathVariable Long id) {
        userService.unlockUser(id);
        return ApiResponse.<Void>builder()
                .message("Mở khóa tài khoản thành công")
                .build();
    }
    
    @GetMapping("/locked")
    @PreAuthorize("hasRole('ADMIN')")
    public ApiResponse<List<UserResponse>> getLockedUsers() {
        List<UserResponse> result = userService.getLockedUsers().stream()
                .map(UserResponse::fromEntity)
                .toList();
        return ApiResponse.<List<UserResponse>>builder()
                .result(result)
                .build();
    }
}