package com.library.libraryManager.modules.user.service;

import com.library.libraryManager.common.constants.BookingStatus;
import com.library.libraryManager.common.constants.Roles;
import com.library.libraryManager.common.exception.AppException;
import com.library.libraryManager.common.exception.ErrorCode;
import com.library.libraryManager.modules.user.dtos.requests.ChangePasswordRequest;
import com.library.libraryManager.modules.user.dtos.requests.UpdateInfoRequest;
import com.library.libraryManager.modules.user.dtos.requests.UserCreateRequest;
import com.library.libraryManager.modules.user.dtos.responses.UserResponse;
import com.library.libraryManager.modules.user.dtos.responses.MonthlyUserStatResponse;
import com.library.libraryManager.modules.user.entities.User;
import com.library.libraryManager.modules.user.entities.UserStatusHistory;
import com.library.libraryManager.modules.user.repositories.UserRepository;
import com.library.libraryManager.modules.user.repositories.UserStatusHistoryRepository;
import com.library.libraryManager.modules.booking.repositories.BookingRepository;


import lombok.RequiredArgsConstructor;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.time.YearMonth;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class UserService implements UserDetailsService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final BookingRepository bookingRepository;
    private final UserStatusHistoryRepository historyRepository;

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

    // public List<User> getAllUsers() {
    //     return userRepository.findAll();
    // }

    public List<UserResponse> getAllUsers(LocalDate startDate, LocalDate endDate) {
        List<User> users = userRepository.findAll();

        // 1. Xác định thời điểm mốc (Cuối ngày của endDate, hoặc hiện tại nếu không chọn ngày)
        LocalDateTime endDateTime = (endDate != null) 
                ? endDate.atTime(LocalTime.MAX) // 23:59:59.999999999
                : LocalDateTime.now();
                
        LocalDateTime startDateTime = (startDate != null) 
                ? startDate.atStartOfDay() // 00:00:00
                : null;

        return users.stream()
                .filter(user -> {
                    // 2. Lọc bỏ các user tạo SAU ngày endDate (Vì đang xem dữ liệu quá khứ)
                    if (user.getCreatedAt() != null) {
                        if (startDateTime != null && user.getCreatedAt().isBefore(startDateTime)) return false;
                        if (user.getCreatedAt().isAfter(endDateTime)) return false;
                    }
                    return true;
                })
                .map(user -> {
                    // Lấy trạng thái khóa/mở tại thời điểm endDate
                    Optional<UserStatusHistory> history = historyRepository
                            .findFirstByUserIdAndChangedAtLessThanEqualOrderByChangedAtDesc(user.getId(), endDateTime);
                    
                    boolean isHistoricallyActive = history.isPresent() ? history.get().isStatus() : true;
                    
                    // SỬ DỤNG HÀM MỚI Ở ĐÂY: Trả về DTO record với trạng thái đã được tính toán
                    return UserResponse.fromEntityWithHistoricalStatus(user, isHistoricallyActive);
                })
                .toList();
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

        // LƯU LỊCH SỬ
        UserStatusHistory history = new UserStatusHistory();
        history.setUser(user);
        history.setStatus(false); // Bị khóa
        history.setChangedAt(LocalDateTime.now());
        historyRepository.save(history);
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

        // LƯU LỊCH SỬ
        UserStatusHistory history = new UserStatusHistory();
        history.setUser(user);
        history.setStatus(true); // Đang hoạt động
        history.setChangedAt(LocalDateTime.now());
        historyRepository.save(history);
    }

    public List<User> searchActiveUsers(String keyword) {
        if (keyword == null || keyword.trim().isEmpty()) {
            return userRepository.findAllByRoleAndIsActiveTrue(Roles.USER);
        }
        return userRepository.searchActiveUsersByRole(keyword, Roles.USER);
    }

    // Thống kê số lượng tài khoản theo tháng, phân biệt đang hoạt động và bị khóa
    public List<MonthlyUserStatResponse> getMonthlyStats(LocalDate startDate, LocalDate endDate) {

        List<User> users = userRepository.findAll().stream()
            .filter(u -> u.getRole().equals(Roles.USER))
            .toList();
        List<MonthlyUserStatResponse> result = new ArrayList<>();

        YearMonth start = YearMonth.from(startDate);
        YearMonth end = YearMonth.from(endDate);

        YearMonth current = start;

        while (!current.isAfter(end)) {

            LocalDateTime endOfMonth;
        if (current.equals(end)) {
            // Nếu là tháng cuối cùng trong dải thống kê, chỉ lấy đến hết ngày endDate
            endOfMonth = endDate.atTime(LocalTime.MAX);
        } else {
            // Nếu là các tháng trước đó, lấy đến cuối tháng như cũ
            endOfMonth = current.atEndOfMonth().atTime(LocalTime.MAX);
        }


            // 1 query cho cả tháng
            List<UserStatusHistory> histories =
                    historyRepository.findLatestStatusPerUserUntil(endOfMonth);

            Map<Long, Boolean> statusMap = histories.stream()
                    .collect(Collectors.toMap(
                            h -> h.getUser().getId(),
                            UserStatusHistory::isStatus
                    ));

            long active = 0;
            long locked = 0;

            for (User user : users) {

                if (user.getCreatedAt().isAfter(endOfMonth)) continue;

                boolean isActive = statusMap.getOrDefault(user.getId(), true);

                if (isActive) active++;
                else locked++;
            }

            result.add(new MonthlyUserStatResponse(
                current.getYear(),
                current.getMonthValue(),
                active + locked,
                active,
                locked
            ));

            current = current.plusMonths(1);
        }

        return result;
    }
}