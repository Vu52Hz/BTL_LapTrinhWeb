package com.library.libraryManager.modules.user.dtos.requests;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

/**
 * Sử dụng Record giúp code ngắn gọn, không cần Lombok, 
 * và dữ liệu là bất biến (Immutable).
 */
public record UpdateInfoRequest(
    @NotBlank(message = "Username không được để trống")
    @Size(min = 4, message = "Username phải ít nhất 4 ký tự")
    String username,

    @Email(message = "Email không đúng định dạng")
    String email,

    @NotBlank(message = "Full name không được để trống")
    String fullName,
    
    String phone,

    @NotBlank(message = "Mật khẩu là bắt buộc")
    @Size(min = 6, message = "Mật khẩu phải ít nhất 6 ký tự")
    String password
) {}