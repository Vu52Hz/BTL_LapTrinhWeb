package com.library.libraryManager.modules.booking.service;

import com.library.libraryManager.common.constants.BookBorrowStatus;
import com.library.libraryManager.common.constants.BookingStatus;
import com.library.libraryManager.common.constants.Roles;
import com.library.libraryManager.common.exception.AppException;
import com.library.libraryManager.common.exception.ErrorCode;
import com.library.libraryManager.modules.booking.dtos.requests.BookingRequest;
import com.library.libraryManager.modules.booking.entities.Booking;
import com.library.libraryManager.modules.booking.entities.BookingDetail;
import com.library.libraryManager.modules.booking.repositories.BookingRepository;
import com.library.libraryManager.modules.room.entities.Room;
import com.library.libraryManager.modules.room.repositories.RoomRepository;
import com.library.libraryManager.modules.BookInventory.entities.BookInventory;
import com.library.libraryManager.modules.BookInventory.repositories.BookInventoryRepository;
import com.library.libraryManager.modules.user.entities.User;
import com.library.libraryManager.modules.user.repositories.UserRepository;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Service
@RequiredArgsConstructor
public class BookingService {
    
    private final BookingRepository bookingRepository;
    private final RoomRepository roomRepository;
    private final BookInventoryRepository inventoryRepository;
    private final UserRepository userRepository;

    @Transactional
    public Booking startBooking(User currentUser, BookingRequest request) {
        User borrower;
        boolean isAdmin = currentUser.getRole() == Roles.ADMIN;
        if (isAdmin && request.userId() != null) {
            borrower = userRepository.findById(request.userId())
                    .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_FOUND));
        } else {
            borrower = currentUser;
        }

        if (bookingRepository.existsByUserIdAndStatus(borrower.getId(), BookingStatus.IN_USE)) {
            throw new AppException(ErrorCode.USER_HAS_ACTIVE_BOOKING);
        }

        Room room = roomRepository.findByIdAndIsActiveTrueWithLock(request.roomId())
                .orElseThrow(() -> new AppException(ErrorCode.ROOM_NOT_FOUND));
        if (room.getAvailableSlots() <= 0) throw new AppException(ErrorCode.ROOM_FULL);
        room.setAvailableSlots(room.getAvailableSlots() - 1);

        Booking booking = Booking.builder()
                .user(borrower)
                .room(room)
                .startTime(LocalDateTime.now())
                .status(BookingStatus.IN_USE)
                .note(request.note() != null ? request.note() : (isAdmin ? "Admin tạo giúp" : "Tự đăng ký"))
                .bookingDetails(new ArrayList<>())
                .build();

        if (request.inventoryIds() != null) {
            for (Long invId : request.inventoryIds()) {
                // Sử dụng findById và kiểm tra isActive
                BookInventory inv = inventoryRepository.findById(invId)
                        .filter(BookInventory::isActive)
                        .orElseThrow(() -> new AppException(ErrorCode.BOOK_NOT_FOUND));
                
                // KIỂM TRA availableQuantity thay vì quantity
                if (inv.getAvailableQuantity() <= 0) throw new AppException(ErrorCode.BOOK_NOT_AVAILABLE);
                
                // CHỈ TRỪ ở availableQuantity
                inv.setAvailableQuantity(inv.getAvailableQuantity() - 1);
                
                booking.getBookingDetails().add(BookingDetail.builder()
                        .booking(booking)
                        .book(inv.getBook())
                        .inventory(inv)
                        .status(BookBorrowStatus.READING)
                        .build());
            }
        }
        return bookingRepository.save(booking);
    }

    @Transactional
    public void addMoreBooks(Long bookingId, List<Long> additionalInventoryIds, User currentUser) {
        Booking booking = bookingRepository.findByIdWithDetails(bookingId)
                .orElseThrow(() -> new AppException(ErrorCode.BOOKING_NOT_FOUND));

        boolean isAdmin = currentUser.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN"));
                
        if (!isAdmin && !booking.getUser().getId().equals(currentUser.getId())) {
            throw new AppException(ErrorCode.ACCESS_DENIED); 
        }

        if (additionalInventoryIds != null) {
            for (Long invId : additionalInventoryIds) {
                BookInventory inv = inventoryRepository.findById(invId)
                        .filter(BookInventory::isActive)
                        .orElseThrow(() -> new AppException(ErrorCode.BOOK_NOT_FOUND));

                boolean alreadyInBooking = booking.getBookingDetails().stream()
                        .anyMatch(detail -> detail.getInventory().getId().equals(invId) 
                                        && detail.getStatus() == BookBorrowStatus.READING);
                
                if (alreadyInBooking) continue;

                if (inv.getAvailableQuantity() <= 0) throw new AppException(ErrorCode.BOOK_NOT_AVAILABLE);

                // CẬP NHẬT availableQuantity
                inv.setAvailableQuantity(inv.getAvailableQuantity() - 1);

                booking.getBookingDetails().add(BookingDetail.builder()
                        .booking(booking)
                        .book(inv.getBook())
                        .inventory(inv)
                        .status(BookBorrowStatus.READING)
                        .build());
            }
        }
        bookingRepository.save(booking);
    }

    @Transactional
    public void userCheckout(Long bookingId, User currentUser) {
        Booking booking = bookingRepository.findByIdWithDetails(bookingId)
                .orElseThrow(() -> new AppException(ErrorCode.BOOKING_NOT_FOUND));

        // Kiểm tra xem current user có phải là ADMIN không
        boolean isAdmin = currentUser.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN"));

        // // Nếu không phải ADMIN VÀ không phải chủ nhân của đơn mượn thì mới chặn
        // if (!isAdmin && !booking.getUser().getId().equals(currentUser.getId())) {
        //     throw new AppException(ErrorCode.ACCESS_DENIED);
        // }
        if (!isAdmin) {
            throw new AppException(ErrorCode.ACCESS_DENIED);
        }
        
        performCheckout(booking);
    }

    private void performCheckout(Booking booking) {
        if (booking.getStatus() != BookingStatus.IN_USE) {
            throw new AppException(ErrorCode.INVALID_BOOKING_STATUS);
        }

        Room room = booking.getRoom();
        room.setAvailableSlots(room.getAvailableSlots() + 1);

        if (booking.getBookingDetails() != null) {
            booking.getBookingDetails().stream()
                .filter(detail -> detail.getStatus() == BookBorrowStatus.READING)
                .forEach(detail -> {
                    // TRẢ SÁCH: Cộng lại vào availableQuantity
                    BookInventory inv = detail.getInventory();
                    inv.setAvailableQuantity(inv.getAvailableQuantity() + 1);

                    detail.setStatus(BookBorrowStatus.RETURNED);
                    detail.setReturnTime(LocalDateTime.now());
                });
        }

        booking.setEndTime(LocalDateTime.now());
        booking.setStatus(BookingStatus.COMPLETED);
        booking.setNote(booking.getNote() + " (Đã trả)");
        bookingRepository.save(booking);
    }

    @Transactional
    public void adminReturnPartialBook(Long bookingId, Long bookId) {
        Booking booking = bookingRepository.findByIdWithDetails(bookingId)
                .orElseThrow(() -> new AppException(ErrorCode.BOOKING_NOT_FOUND));

        BookingDetail detailToReturn = booking.getBookingDetails().stream()
                .filter(detail -> detail.getBook().getId().equals(bookId) 
                                && detail.getStatus() == BookBorrowStatus.READING)
                .findFirst()
                .orElseThrow(() -> new AppException(ErrorCode.BOOK_NOT_FOUND));

        // TRẢ SÁCH LẺ: Cộng lại vào availableQuantity
        BookInventory inv = detailToReturn.getInventory();
        if (inv != null) {
            inv.setAvailableQuantity(inv.getAvailableQuantity() + 1);
        }
        
        detailToReturn.setStatus(BookBorrowStatus.RETURNED);
        detailToReturn.setReturnTime(LocalDateTime.now());

        bookingRepository.save(booking);
    }

    public List<Booking> getMyHistory(Long userId) {
        return bookingRepository.findByUserIdOrderByStartTimeDesc(userId);
    }

    public List<Booking> getAllHistory() {
        return bookingRepository.findAllWithDetails();
    }
}