package com.library.libraryManager.modules.room.repositories;

import com.library.libraryManager.modules.room.entities.Room;

import jakarta.persistence.LockModeType;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface RoomRepository extends JpaRepository<Room, Long> {
    
    @Query("SELECT CASE WHEN (r.availableSlots < r.capacity) THEN true ELSE false END " +
           "FROM Room r WHERE r.id = :roomId")
    boolean existsUsersInRoom(@Param("roomId") Long roomId);
    
    // Đổi tên các hàm kiểm tra và tìm kiếm
    boolean existsByNameAndIsActiveTrue(String name);

    List<Room> findByNameContainingIgnoreCaseAndIsActiveTrue(String name);

    // Thêm hàm lấy tất cả các phòng đang hoạt động
    List<Room> findAllByIsActiveTrue();

    // Thêm hàm tìm chi tiết phòng đang hoạt động
    Optional<Room> findByIdAndIsActiveTrue(Long id);

    // Cập nhật câu query Lock để tránh lấy nhầm phòng đã xóa
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT r FROM Room r WHERE r.id = :id AND r.isActive = true")
    Optional<Room> findByIdAndIsActiveTrueWithLock(@Param("id") Long id);
}