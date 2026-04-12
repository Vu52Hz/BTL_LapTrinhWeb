package com.library.libraryManager.config;

import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.AuthenticationProvider;
import org.springframework.security.authentication.dao.DaoAuthenticationProvider;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.crypto.password.PasswordEncoder;

// @Configuration
@Configuration(proxyBeanMethods = false) // Thêm tham số này vào giúp Spring tối ưu hóa việc tạo bean, tránh việc tạo nhiều instance không cần thiết
@RequiredArgsConstructor
public class ApplicationConfig {
    private final UserDetailsService userDetailsService; 
    private final PasswordEncoder passwordEncoder; // Spring sẽ lấy từ PasswordConfig

    @Bean
    public AuthenticationProvider authenticationProvider() {
        DaoAuthenticationProvider authProvider = new DaoAuthenticationProvider(userDetailsService);
        authProvider.setPasswordEncoder(passwordEncoder);
        return authProvider;
    }

    @Bean
    public AuthenticationManager authenticationManager(AuthenticationConfiguration config) throws Exception {
        return config.getAuthenticationManager();
    }
}