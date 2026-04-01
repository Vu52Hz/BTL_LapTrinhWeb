package com.library.libraryManager.modules.booking.dtos.responses;

import com.library.libraryManager.common.constants.BookingStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
@NoArgsConstructor // Thêm cái này
@AllArgsConstructor // Thêm cái này
public class BookingResponse {
    private Long id;
    private Long userId;      // ID người đọc 
    private String userName;  // Tên người đọc 
    private String roomName;
    private List<BorrowedBookDto> borrowedBooks;
    private LocalDateTime startTime;
    private LocalDateTime endTime;
    private BookingStatus status;
    private String note;

    public record BorrowedBookDto(Long bookId, String title, String status) {}
}