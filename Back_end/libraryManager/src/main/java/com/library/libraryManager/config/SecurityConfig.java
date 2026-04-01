package com.library.libraryManager.config;

import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.authentication.AuthenticationProvider;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.Arrays;

@Configuration
@EnableWebSecurity
@EnableMethodSecurity
@RequiredArgsConstructor
public class SecurityConfig {

    private final JwtFilter jwtFilter;
    private final AuthenticationProvider authenticationProvider;

    // Định nghĩa danh sách Swagger để tránh lỗi không tìm thấy biến
    private static final String[] SWAGGER_WHITELIST = {
            "/v3/api-docs/**",
            "/swagger-ui/**",
            "/swagger-ui.html"
    };

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
            .cors(cors -> cors.configurationSource(corsConfigurationSource())) 
            .csrf(csrf -> csrf.disable())
            .authorizeHttpRequests(auth -> auth
                .requestMatchers(SWAGGER_WHITELIST).permitAll()
                .requestMatchers("/api/v1/auth/**").permitAll()
                .requestMatchers("/uploads/**").permitAll()
                
                // MỞ QUYỀN PUBLIC CHO CÁC API TRANG CHỦ (Nếu muốn khách xem được)
                .requestMatchers(HttpMethod.GET, "/api/v1/books/top-borrowed-today").permitAll() 
                .requestMatchers(HttpMethod.GET, "/api/v1/rooms/**").permitAll() 

                // PHÂN QUYỀN ADMIN
                .requestMatchers(HttpMethod.POST, "/api/v1/files/upload/**").hasRole("ADMIN")
                .requestMatchers("/api/v1/admin/**").hasRole("ADMIN") 
                
                // PHÂN QUYỀN USER & ADMIN (Các API dùng chung)
                .requestMatchers("/api/v1/user/**").hasAnyRole("USER", "ADMIN")
                .requestMatchers("/api/v1/bookings/my-history", "/api/v1/bookings/check-in").hasAnyRole("USER", "ADMIN")
                
                // QUẢN LÝ SÁCH/PHÒNG/TỦ (Chỉ Admin mới được Thêm/Sửa/Xóa)
                .requestMatchers(HttpMethod.GET, "/api/v1/cabinets/**", "/api/v1/books/**").hasAnyRole("USER", "ADMIN")
                .requestMatchers("/api/v1/rooms/**", "/api/v1/cabinets/**", "/api/v1/books/**").hasRole("ADMIN")
                
                // QUẢN LÝ BOOKING (Chỉ Admin mới được xem tất cả hoặc Checkout cho khách)
                .requestMatchers("/api/v1/bookings/all-history", "/api/v1/bookings/checkout").hasRole("ADMIN")
                
                .anyRequest().authenticated() 
            )
            .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
            .authenticationProvider(authenticationProvider)
            .addFilterBefore(jwtFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration configuration = new CorsConfiguration();
        // Cấu hình cho phép cả 2 domain phổ biến của Live Server
        configuration.setAllowedOrigins(Arrays.asList("http://127.0.0.1:5501", "http://localhost:5501")); 
        configuration.setAllowedMethods(Arrays.asList("GET", "POST", "PUT", "DELETE", "OPTIONS"));
        // Thêm "Accept" và "Origin" vào Headers để tránh lỗi một số trình duyệt kén chọn
        configuration.setAllowedHeaders(Arrays.asList("Authorization", "Content-Type", "Cache-Control", "Accept", "Origin"));
        configuration.setAllowCredentials(true);
        
        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", configuration);
        return source;
    }
}