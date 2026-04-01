package com.library.libraryManager.modules.booking.repositories;

import com.library.libraryManager.modules.book.entities.Book;
import com.library.libraryManager.modules.booking.entities.Booking;
import com.library.libraryManager.common.constants.BookingStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface BookingRepository extends JpaRepository<Booking, Long> {
    
    // Đã đổi JOIN FETCH b.borrowedBooks thành b.bookingDetails db.bookingDetails.book
    @Query("SELECT b FROM Booking b " +
       "LEFT JOIN FETCH b.room " +
       "LEFT JOIN FETCH b.user " + 
       "LEFT JOIN FETCH b.bookingDetails bd " +
       "LEFT JOIN FETCH bd.book " + 
       "LEFT JOIN FETCH bd.inventory " + // THÊM FETCH INVENTORY
       "WHERE b.id = :id")
    Optional<Booking> findByIdWithDetails(@Param("id") Long id);

    @Query("SELECT DISTINCT b FROM Booking b " +
           "LEFT JOIN FETCH b.room " +
           "LEFT JOIN FETCH b.user " +
           "LEFT JOIN FETCH b.bookingDetails bd " +
           "LEFT JOIN FETCH bd.book")
    List<Booking> findAllWithDetails();

    @Query("SELECT DISTINCT b FROM Booking b " +
           "LEFT JOIN FETCH b.room " +
           "LEFT JOIN FETCH b.user " +
           "LEFT JOIN FETCH b.bookingDetails bd " + 
           "LEFT JOIN FETCH bd.book " +
           "WHERE b.user.id = :userId " +
           "ORDER BY b.startTime DESC")
    List<Booking> findByUserIdOrderByStartTimeDesc(@Param("userId") Long userId);

    boolean existsByUserIdAndStatus(Long userId, BookingStatus status);

    Optional<Booking> findByUserIdAndStatus(Long userId, BookingStatus status);

    // Lấy 100 booking gần nhất, Group theo Book thông qua booking_details và trả về Top 10 Book
    @Query(value = """
        SELECT b.* FROM books b
        JOIN booking_details bd ON b.id = bd.book_id
        JOIN (
            SELECT id FROM booking 
            ORDER BY start_time DESC -- Đã đổi created_at thành start_time
            LIMIT 100
        ) recent_bookings ON bd.booking_id = recent_bookings.id
        WHERE b.is_active = true
        GROUP BY b.id
        ORDER BY COUNT(bd.id) DESC
        LIMIT 10
        """, nativeQuery = true)
    List<Book> findTop10BooksInLast100Bookings();
}