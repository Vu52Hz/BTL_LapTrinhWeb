package com.library.libraryManager.modules.user.entities;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;
import java.util.Collection; 
import java.util.List;       

import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;

import com.library.libraryManager.common.constants.Roles;

@Entity
@Table(name = "users")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor(access = AccessLevel.PRIVATE)
@Builder
public class User implements UserDetails {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(unique = true, nullable = false)
    private String username;

    @Column(nullable = false, length = 255)
    private String password;

    private String fullName;
    
    @Column(unique = true)
    private String email;
    
    @Column(unique = true)
    private String phone;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private Roles role; // Sử dụng Enum để đảm bảo an toàn dữ liệu

    // // --- THÊM QUAN HỆ VỚI ROOM ---
    // @ManyToOne(fetch = FetchType.LAZY)
    // @JoinColumn(name = "room_id") // Tạo cột room_id trong bảng users để làm khóa ngoại
    // private Room room;

    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
    }

    // --- Triển khai UserDetails ---

    @Override
    public Collection<? extends GrantedAuthority> getAuthorities() {
        // Sử dụng role.name() để lấy chuỗi chữ (ví dụ: ADMIN) từ Enum
        return List.of(new SimpleGrantedAuthority("ROLE_" + role.name()));
    }
    // Tài khoản còn hạn không?
    @Override
    public boolean isAccountNonExpired() {
        return true;
    }
    // Tài khoản không bị khóa?
    @Column(name = "is_active", nullable = false)
    @Builder.Default
    private boolean isActive = true;
    @Override
    public boolean isAccountNonLocked() {
        return this.isActive; // Nếu isActive = false thì coi như bị khóa
    }
    // Mật khẩu còn hạn không?
    @Override
    public boolean isCredentialsNonExpired() {
        return true;
    }
    // Tài khoản có đang hoạt động không?
    @Override
    public boolean isEnabled() {
        return true;
    }
}