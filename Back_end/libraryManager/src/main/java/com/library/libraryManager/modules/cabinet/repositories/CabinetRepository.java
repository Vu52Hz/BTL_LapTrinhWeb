package com.library.libraryManager.modules.cabinet.repositories;

import com.library.libraryManager.modules.cabinet.entities.Cabinet;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface CabinetRepository extends JpaRepository<Cabinet, Long> {

    // 1. Lấy tất cả tủ kèm theo danh sách sách
    @Query("SELECT DISTINCT c FROM Cabinet c LEFT JOIN FETCH c.books")
    List<Cabinet> findAllWithBooks();

    // 2. Kiểm tra tên tủ đã tồn tại chưa
    boolean existsByTen(String ten);

    // 3. Tìm kiếm theo tên (Không phân biệt hoa thường)
    @Query("SELECT DISTINCT c FROM Cabinet c LEFT JOIN FETCH c.books " +
           "WHERE LOWER(c.ten) LIKE LOWER(CONCAT('%', :ten, '%'))")
    List<Cabinet> findByTenContainingIgnoreCase(@Param("ten") String ten);

    // 4. Kiểm tra xem có sách trong tủ không (Sửa lại: Table là BookInventory, field là cabinet)
    @Query("SELECT CASE WHEN COUNT(bi) > 0 THEN true ELSE false END " +
           "FROM BookInventory bi WHERE bi.cabinet.id = :cabinetId")
    boolean existsBooksInCabinet(@Param("cabinetId") Long cabinetId);
    
    // 5. Tìm tủ theo tên chính xác
    Optional<Cabinet> findByTen(String ten);
}