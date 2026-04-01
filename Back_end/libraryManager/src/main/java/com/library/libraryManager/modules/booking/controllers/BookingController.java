package com.library.libraryManager.modules.booking.controllers;

import com.library.libraryManager.common.dtos.ApiResponse;
import com.library.libraryManager.modules.user.entities.User;
import com.library.libraryManager.modules.booking.dtos.requests.BookingRequest;
import com.library.libraryManager.modules.booking.dtos.responses.BookingResponse;
import com.library.libraryManager.modules.booking.entities.Booking;
import com.library.libraryManager.modules.booking.service.BookingService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/bookings")
@RequiredArgsConstructor
public class BookingController {

    private final BookingService bookingService;

    /**
     * Đăng ký vào phòng và chọn sách từ các tủ cụ thể (Inventory)
     */
    @PostMapping("/check-in")
        public ApiResponse<BookingResponse> checkIn(
                @AuthenticationPrincipal User user, 
                @RequestBody BookingRequest request) {
        // Truyền cả object request vào service
        Booking booking = bookingService.startBooking(user, request);
        return ApiResponse.<BookingResponse>builder()
                .message("Tạo đơn mượn thành công")
                .result(mapToResponse(booking))
                .build();
        }

    /**
     * Mượn thêm sách từ các tủ cụ thể trong khi đang ngồi tại phòng
     */
    @PostMapping("/{id}/add-books")
    @PreAuthorize("hasRole('USER') or hasRole('ADMIN')")
    public ApiResponse<Void> addBooks(
            @PathVariable Long id, 
            @RequestBody List<Long> inventoryIds, // Đổi sang nhận inventoryIds
            @AuthenticationPrincipal User user) { 
        bookingService.addMoreBooks(id, inventoryIds, user);
        return ApiResponse.<Void>builder()
                .message("Đã mượn thêm sách từ tủ thành công")
                .build();
    }      

    /**
     * Admin xác nhận trả lẻ từng cuốn sách về đúng tủ của nó
     */
    @PutMapping("/{id}/return-book/{bookId}")
    @PreAuthorize("hasRole('ADMIN')")
    public ApiResponse<Void> returnPartialBook(@PathVariable Long id, @PathVariable Long bookId) {
        bookingService.adminReturnPartialBook(id, bookId);
        return ApiResponse.<Void>builder()
                .message("Xác nhận trả sách và cập nhật lại số lượng tủ thành công")
                .build();
    }

    /**
     * Admin xác nhận trả phòng (Kết thúc lượt mượn, trả toàn bộ sách còn lại về đúng tủ)
     */
    @PutMapping("/{id}/checkout")
//     @PreAuthorize("hasRole('USER') or hasRole('ADMIN')")
    @PreAuthorize("hasRole('ADMIN')")
    public ApiResponse<Void> userCheckout(@PathVariable Long id, @AuthenticationPrincipal User user) {
        bookingService.userCheckout(id, user);
        return ApiResponse.<Void>builder()
                .message("Đã hoàn tất trả phòng và trả sách về tủ")
                .build();
    }

    @GetMapping("/my-history")
    @PreAuthorize("hasRole('USER')")
    public ApiResponse<List<BookingResponse>> getMyHistory(@AuthenticationPrincipal User user) {
        List<BookingResponse> history = bookingService.getMyHistory(user.getId())
                .stream()
                .map(this::mapToResponse)
                .toList();
                
        return ApiResponse.<List<BookingResponse>>builder()
                .result(history)
                .build();
    }

    @GetMapping("/all-history")
    @PreAuthorize("hasRole('ADMIN')")
    public ApiResponse<List<BookingResponse>> getAllHistory() {
        List<BookingResponse> allHistory = bookingService.getAllHistory()
                .stream()
                .map(this::mapToResponse)
                .toList();
        
        return ApiResponse.<List<BookingResponse>>builder()
                .message("Lấy danh sách tất cả lượt mượn thành công")
                .result(allHistory)
                .build();
    }

    /**
     * Chuyển đổi từ Entity sang DTO để trả về cho Front-end
     */
    private BookingResponse mapToResponse(Booking booking) {
        String roomNameDisplay = booking.getRoom().getName();
        if (!booking.getRoom().isActive()) {
            roomNameDisplay += " (đã đóng/xóa)";
        }

        List<BookingResponse.BorrowedBookDto> bookItems = booking.getBookingDetails().stream()
                .map(detail -> new BookingResponse.BorrowedBookDto(
                        detail.getBook().getId(),
                        detail.getBook().getTitle(),
                        detail.getStatus().name()
                ))
                .toList();

        return BookingResponse.builder()
                .id(booking.getId())
                .userId(booking.getUser().getId())
                .userName(booking.getUser().getFullName())
                .roomName(roomNameDisplay)
                .borrowedBooks(bookItems)
                .startTime(booking.getStartTime())
                .endTime(booking.getEndTime())
                .status(booking.getStatus())
                .note(booking.getNote())
                .build();
    }
}