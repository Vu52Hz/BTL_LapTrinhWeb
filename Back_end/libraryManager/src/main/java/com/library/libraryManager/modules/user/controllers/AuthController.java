package com.library.libraryManager.modules.user.controllers;

import com.library.libraryManager.common.dtos.ApiResponse;
import com.library.libraryManager.common.utils.JwtUtils;
import com.library.libraryManager.modules.user.dtos.requests.LoginRequest;
import com.library.libraryManager.modules.user.dtos.requests.UserCreateRequest;
import com.library.libraryManager.modules.user.entities.User;
import com.library.libraryManager.modules.user.service.UserService;
import com.library.libraryManager.modules.user.dtos.responses.UserResponse;

import io.swagger.v3.oas.annotations.security.SecurityRequirements;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/v1/auth")
@RequiredArgsConstructor
public class AuthController {

    private final UserService userService;
    private final AuthenticationManager authenticationManager;
    private final JwtUtils jwtUtils;

    @PostMapping("/register")
    @SecurityRequirements() 
    public ApiResponse<UserResponse> register(@Valid @RequestBody UserCreateRequest request) {
        UserResponse responseData  = userService.register(request);
        return ApiResponse.<UserResponse>builder()
                .message("Đăng ký tài khoản thành công")
                .result(responseData)
                .build();
    }

    @PostMapping("/login")
    @SecurityRequirements() 
    public ApiResponse<Map<String, Object>> login(@Valid @RequestBody LoginRequest request) {
        Authentication authentication = authenticationManager.authenticate(
            new UsernamePasswordAuthenticationToken(request.username(), request.password())
        );

        User user = (User) authentication.getPrincipal();
        String token = jwtUtils.generateToken(user);
        
        Map<String, Object> authInfo = Map.of(
            "token", token,
            "type", "Bearer",
            "fullName", user.getFullName() != null ? user.getFullName() : "",
            "email", user.getEmail() != null ? user.getEmail() : "",
            "phone", user.getPhone() != null ? user.getPhone() : "",
            "username", user.getUsername(),
            "roles", user.getAuthorities()
        );

        return ApiResponse.<Map<String, Object>>builder()
                .message("Đăng nhập thành công")
                .result(authInfo)
                .build();
    }
}