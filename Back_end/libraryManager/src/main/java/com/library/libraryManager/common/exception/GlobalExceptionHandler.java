package com.library.libraryManager.common.exception;

import com.library.libraryManager.common.dtos.ApiResponse;

import java.util.stream.Collectors;

import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.LockedException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

@RestControllerAdvice
public class GlobalExceptionHandler {

    // 1. Xử lý AppException (Lỗi nghiệp vụ do mình chủ động throw)
    @ExceptionHandler(value = AppException.class)
    public ResponseEntity<ApiResponse<Object>> handleAppException(AppException ex) {
        ErrorCode errorCode = ex.getErrorCode();
        
        return ResponseEntity
                .status(errorCode.getStatusCode())
                .body(ApiResponse.builder()
                        .code(errorCode.getCode())
                        .message(errorCode.getMessage())
                        .build());
    }

    // 2. Xử lý lỗi Validate dữ liệu từ Record DTO (Ví dụ: thiếu username, password ngắn)
    @ExceptionHandler(value = MethodArgumentNotValidException.class)
    public ResponseEntity<ApiResponse<Object>> handleValidation(MethodArgumentNotValidException ex) {
        // Gom tất cả các lỗi vào 1 chuỗi hoặc 1 Map
        String message = ex.getBindingResult().getFieldErrors()
                        .stream()
                        .map(error ->error.getDefaultMessage())
                        .collect(Collectors.joining(", "));

        return ResponseEntity.badRequest().body(
                ApiResponse.builder()
                        .code(400)
                        .message(message)
                        .build()
        );
    }

    // 3. Xử lý lỗi sai thông tin đăng nhập từ Spring Security
    @ExceptionHandler(value = BadCredentialsException.class)
    public ResponseEntity<ApiResponse<Object>> handleBadCredentials(BadCredentialsException ex) {
        return ResponseEntity.status(401).body(
                ApiResponse.builder()
                        .code(1001)
                        .message("Tên đăng nhập hoặc mật khẩu không chính xác!")
                        .build()
        );
    }

    // THÊM MỚI: Xử lý lỗi tài khoản bị khóa
    @ExceptionHandler(value = LockedException.class)
    public ResponseEntity<ApiResponse<Object>> handleLockedException(LockedException ex) {
        return ResponseEntity.status(403).body( // Dùng 403 (Forbidden) cho tài khoản bị khóa
                ApiResponse.builder()
                        .code(1003) // Mã code riêng cho lỗi tài khoản bị khóa (bạn có thể đổi tùy ý)
                        .message("Tài khoản của bạn đã bị khóa. Vui lòng liên hệ quản trị viên.")
                        .build()
        );
    }

    // @ExceptionHandler(value = AccessDeniedException.class)
    // public ResponseEntity<ApiResponse<Object>> handleAccessDenied(AccessDeniedException ex) {
    //     return ResponseEntity.status(403).body(
    //             ApiResponse.builder()
    //                     .code(1002) // Mã code riêng cho lỗi quyền hạn
    //                     .message("Bạn không có quyền truy cập vào tài nguyên này!")
    //                     .build()
    //     );
    // }

    // 4. Xử lý tất cả các lỗi hệ thống không xác định (Tránh lộ log ra ngoài)
    @ExceptionHandler(value = Exception.class)
    public ResponseEntity<ApiResponse<Object>> handleGeneralException(Exception ex) {
        return ResponseEntity.internalServerError().body(
                ApiResponse.builder()
                        .code(9999)
                        .message("Lỗi hệ thống nghiêm trọng: " + ex.getMessage())
                        .build()
        );
    }
}