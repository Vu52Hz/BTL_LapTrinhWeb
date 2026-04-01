package com.library.libraryManager.modules.user.service;

import com.library.libraryManager.common.constants.BookingStatus;
import com.library.libraryManager.common.constants.Roles;
import com.library.libraryManager.common.exception.AppException;
import com.library.libraryManager.common.exception.ErrorCode;
import com.library.libraryManager.modules.user.dtos.requests.ChangePasswordRequest;
import com.library.libraryManager.modules.user.dtos.requests.UpdateInfoRequest;
import com.library.libraryManager.modules.user.dtos.requests.UserCreateRequest;
import com.library.libraryManager.modules.user.dtos.responses.UserResponse;
import com.library.libraryManager.modules.user.entities.User;
import com.library.libraryManager.modules.user.repositories.UserRepository;
import com.library.libraryManager.modules.booking.repositories.BookingRepository;

import lombok.RequiredArgsConstructor;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class UserService implements UserDetailsService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final BookingRepository bookingRepository;

    @Override
    public UserDetails loadUserByUsername(String username) throws UsernameNotFoundException {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new UsernameNotFoundException("Không tìm thấy người dùng: " + username));
        
        if (!user.isActive()) {
            throw new AppException(ErrorCode.USER_LOCKED); 
        }
        return user;
    }

    public Optional<User> findByUsername(String username) {
        return userRepository.findByUsernameAndIsActiveTrue(username);
    }

    public UserResponse register(UserCreateRequest request) {
        if (userRepository.existsByUsername(request.username())) {
            throw new AppException(ErrorCode.USER_EXISTED);
        }
        
        User user = User.builder()
                .username(request.username())
                .fullName(request.fullName())
                .email(request.email())
                .phone(request.phone())
                .password(passwordEncoder.encode(request.password()))
                .role(Roles.USER)
                .isActive(true)
                .build();

        return UserResponse.fromEntity(userRepository.save(user));
    }

    public User getMyInfo() {
        String name = SecurityContextHolder.getContext().getAuthentication().getName();
        return userRepository.findByUsernameAndIsActiveTrue(name)
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_EXISTED));
    }

    @Transactional
    public User updateMyInfo(UpdateInfoRequest request) {
        User user = getMyInfo();
        user.setFullName(request.fullName());
        user.setEmail(request.email());
        user.setPhone(request.phone());
        return userRepository.save(user);
    }

    @Transactional
    public void changePassword(ChangePasswordRequest request) {
        User user = getMyInfo();
        if (!passwordEncoder.matches(request.oldPassword(), user.getPassword())) {
            throw new AppException(ErrorCode.PASSWORD_INCORRECT);
        }
        user.setPassword(passwordEncoder.encode(request.newPassword()));
        userRepository.save(user);
    }

    public List<User> getAllUsers() {
        return userRepository.findAll();
    }

    @Transactional
    public void lockUser(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_EXISTED));

        if (bookingRepository.existsByUserIdAndStatus(userId, BookingStatus.IN_USE)) {
            throw new AppException(ErrorCode.USER_HAS_ACTIVE_BOOKING); 
        }

        user.setActive(false);
        userRepository.save(user);
    }

    public List<User> getLockedUsers() {
        return userRepository.findAllByIsActiveFalse();
    }

    @Transactional
    public void unlockUser(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_EXISTED));
        user.setActive(true);
        userRepository.save(user);
    }

    public List<User> searchActiveUsers(String keyword) {
        if (keyword == null || keyword.trim().isEmpty()) {
            return userRepository.findAllByRoleAndIsActiveTrue(Roles.USER);
        }
        return userRepository.searchActiveUsersByRole(keyword, Roles.USER);
    }
}