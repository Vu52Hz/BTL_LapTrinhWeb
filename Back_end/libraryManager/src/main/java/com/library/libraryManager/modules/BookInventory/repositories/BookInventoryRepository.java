package com.library.libraryManager.modules.BookInventory.repositories;

import com.library.libraryManager.modules.BookInventory.entities.BookInventory;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface BookInventoryRepository extends JpaRepository<BookInventory, Long> {

    // Tìm các kho đang hoạt động của một sách
    @Query("SELECT bi FROM BookInventory bi WHERE bi.book.id = :bookId AND bi.isActive = true")
    List<BookInventory> findByBookIdAndIsActiveTrue(@Param("bookId") Long bookId);

    // Tìm inventory theo bookId và cabinetId (bao gồm cả inactive để tái sử dụng)
    Optional<BookInventory> findByBookIdAndCabinetId(Long bookId, Long cabinetId);

    // Tính tổng số lượng thực tế của một đầu sách (Sửa quantity -> totalQuantity)
    @Query("SELECT SUM(bi.totalQuantity) FROM BookInventory bi WHERE bi.book.id = :bookId AND bi.isActive = true")
    Integer sumTotalQuantityByBookId(@Param("bookId") Long bookId);

    // Tính tổng số lượng khả dụng (đang trên kệ)
    @Query("SELECT SUM(bi.availableQuantity) FROM BookInventory bi WHERE bi.book.id = :bookId AND bi.isActive = true")
    Integer sumAvailableQuantityByBookId(@Param("bookId") Long bookId);

    @Query("SELECT bi FROM BookInventory bi JOIN FETCH bi.cabinet WHERE bi.book.id = :bookId AND bi.isActive = true")
    List<BookInventory> findByBookIdWithCabinet(@Param("bookId") Long bookId);

    // Lấy list active của 1 tủ
    @Query("SELECT bi FROM BookInventory bi JOIN FETCH bi.book WHERE bi.cabinet.id = :cabinetId AND bi.isActive = true")
    List<BookInventory> findByCabinetIdAndIsActiveTrue(@Param("cabinetId") Long cabinetId);

    long countByCabinetIdAndIsActiveTrue(Long cabinetId);
    
}
