package com.library.libraryManager.modules.book.repositories;

import com.library.libraryManager.modules.book.entities.Book;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface BookRepository extends JpaRepository<Book, Long> {

    // Lấy chi tiết sách đang active
    Optional<Book> findByIdAndIsActiveTrue(Long id);

    // Lấy tất cả sách đang active
    @Query("SELECT b FROM Book b WHERE b.isActive = true")
    List<Book> findAllByIsActiveTrue();

    // Tìm kiếm sách theo tiêu đề hoặc tác giả (Chỉ lấy sách đang active)
    @Query("SELECT b FROM Book b " +
           "WHERE b.isActive = true AND (" +
           "LOWER(b.title) LIKE LOWER(CONCAT('%', :keyword, '%')) " +
           "OR LOWER(b.author) LIKE LOWER(CONCAT('%', :keyword, '%')))")
    List<Book> searchByTitleOrAuthorAndIsActiveTrue(@Param("keyword") String keyword);

    // Kiểm tra trùng tên sách
    boolean existsByTitleAndAuthorAndPublishYearAndIsActiveTrue(String title, String author, Integer publishYear);

    // Lấy danh sách sách theo list ID
    List<Book> findAllByIdInAndIsActiveTrue(List<Long> ids);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT b FROM Book b WHERE b.id IN :ids AND b.isActive = true")
    List<Book> findAllByIdWithLockAndIsActiveTrue(@Param("ids") List<Long> ids);
}