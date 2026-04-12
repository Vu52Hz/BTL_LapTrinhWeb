package com.library.libraryManager.modules.user.repositories;

import com.library.libraryManager.modules.user.entities.UserStatusHistory;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.Optional;
import java.util.List;

@Repository
public interface UserStatusHistoryRepository extends JpaRepository<UserStatusHistory, Long> {

    /**
     * Lấy trạng thái thay đổi gần nhất của User tính đến một thời điểm cho trước.
     * Cực kỳ quan trọng để tính toán thống kê "tại thời điểm B".
     */
    Optional<UserStatusHistory> findFirstByUserIdAndChangedAtLessThanEqualOrderByChangedAtDesc(
            Long userId, 
            LocalDateTime date
    );

    @Query("""
        SELECT h
        FROM UserStatusHistory h
        JOIN h.user u
        WHERE u.role != 'ADMIN' 
        AND h.changedAt <= :endOfMonth
        AND h.changedAt = (
            SELECT MAX(h2.changedAt)
            FROM UserStatusHistory h2
            WHERE h2.user = h.user
            AND h2.changedAt <= :endOfMonth
        )
    """)
    List<UserStatusHistory> findLatestStatusPerUserUntil(
            @Param("endOfMonth") LocalDateTime endOfMonth
    );
}