package com.library.libraryManager.common.exception;

import lombok.Getter;
import org.springframework.http.HttpStatus;
import org.springframework.http.HttpStatusCode;

@Getter
public enum ErrorCode {


    // --- 9xxx: Hệ thống ---
    UNCATEGORIZED_EXCEPTION(9999, "Lỗi hệ thống chưa xác định", HttpStatus.INTERNAL_SERVER_ERROR),
    INVALID_KEY(9001, "Lỗi cấu hình hệ thống (Invalid Key)", HttpStatus.INTERNAL_SERVER_ERROR),
    
    // --- 0xxx: Lỗi Validation chung (Dành cho @Valid) ---
    INVALID_INPUT(0001, "Dữ liệu đầu vào không hợp lệ", HttpStatus.BAD_REQUEST),

    // --- 1xxx: Xác thực & Phân quyền (Auth) ---
    UNAUTHENTICATED(1001, "Tên đăng nhập hoặc mật khẩu không chính xác", HttpStatus.UNAUTHORIZED),
    UNAUTHORIZED(1002, "Bạn không có quyền truy cập chức năng này", HttpStatus.FORBIDDEN),
    USER_EXISTED(1003, "Người dùng đã tồn tại", HttpStatus.BAD_REQUEST),
    USER_NOT_EXISTED(1004, "Người dùng không tồn tại", HttpStatus.NOT_FOUND),
    USERNAME_INVALID(1005, "Username phải có ít nhất 3 ký tự", HttpStatus.BAD_REQUEST),
    INVALID_PASSWORD(1006, "Mật khẩu phải có ít nhất 6 ký tự", HttpStatus.BAD_REQUEST),
    PASSWORD_INCORRECT(1007,"Mật khẩu cũ bạn nhập không đúng", HttpStatus.UNAUTHORIZED),
    ACCESS_DENIED(1008, "Bạn không có quyền thực hiện thao tác này", HttpStatus.FORBIDDEN),
    USER_NOT_FOUND(1009, "Không tìm thấy người dùng yêu cầu", HttpStatus.NOT_FOUND),
    USER_LOCKED(1010, "Tài khoản của bạn đã bị khóa, vui lòng liên hệ quản trị viên", HttpStatus.FORBIDDEN),
    // --- 2xxx: Nghiệp vụ Phòng đọc (Room) ---
    ROOM_EXISTED(2001, "Tên phòng đọc đã tồn tại", HttpStatus.BAD_REQUEST),
    ROOM_NOT_FOUND(2002, "Không tìm thấy phòng đọc yêu cầu", HttpStatus.NOT_FOUND),
    ROOM_NOT_EMPTY(2003, "Không thể xóa: Hiện tại vẫn còn người hoặc thiết bị trong phòng này", HttpStatus.CONFLICT),
    ROOM_FULL(2004, "Phòng đọc đã đầy, vui lòng chọn phòng khác", HttpStatus.BAD_REQUEST),
    // --- 3xxx: Nghiệp vụ Tủ sách (Cabinet) ---
    CABINET_EXISTED(3001, "Tên tủ sách đã tồn tại", HttpStatus.BAD_REQUEST),
    CABINET_NOT_FOUND(3002, "Không tìm thấy tủ sách yêu cầu", HttpStatus.NOT_FOUND),
    CABINET_NOT_EMPTY(3003, "Không thể xóa: Tủ sách vẫn còn chứa sách bên trong", HttpStatus.CONFLICT),

    // --- 4xxx: Nghiệp vụ Sách (Book) ---
    BOOK_NOT_FOUND(4001, "Không tìm thấy thông tin sách", HttpStatus.NOT_FOUND),
    BOOK_EXISTED_IN_CABINET(4002, "Sách này đã tồn tại trong tủ này rồi", HttpStatus.BAD_REQUEST),
    BOOK_ALREADY_EXISTS(4003, "Sách đã tồn tại trong kho rồi", HttpStatus.BAD_REQUEST), 
    INVALID_BOOK_QUANTITY(4004, "Số lượng sách không hợp lệ", HttpStatus.BAD_REQUEST),
    INVENTORY_NOT_FOUND(4005, "Không tìm thấy thông tin inventory cho sách này trong tủ này", HttpStatus.NOT_FOUND),
    CANNOT_REMOVE_CABINET_WHILE_BORROWED(4006, "Không thể xóa tủ khi vẫn còn sách đang được mượn từ tủ này", HttpStatus.CONFLICT),

    // --- 5xxx: Nghiệp vụ Lượt mượn (Booking) ---
    BOOKING_NOT_FOUND(5001, "Không tìm thấy thông tin lượt mượn", HttpStatus.NOT_FOUND),
    INVALID_BOOKING_STATUS(5002, "Trạng thái lượt mượn không hợp lệ để thực hiện thao tác này", HttpStatus.BAD_REQUEST),
    USER_HAS_ACTIVE_BOOKING(5003, "Bạn đang có một lượt mượn chưa kết thúc", HttpStatus.BAD_REQUEST),
    BOOK_NOT_AVAILABLE(5004, "Một hoặc nhiều cuốn sách hiện không còn đủ số lượng", HttpStatus.BAD_REQUEST),
    CHECKOUT_FAILED(5005, "Thực hiện trả phòng/sách thất bại", HttpStatus.INTERNAL_SERVER_ERROR),
    BOOK_ALREADY_RETURNED(5006, "Cuốn sách này đã được trả trước đó rồi", HttpStatus.BAD_REQUEST);
    ;
    
    

    private final int code;
    private final String message;
    private final HttpStatusCode statusCode;

    ErrorCode(int code, String message, HttpStatusCode statusCode) {
        this.code = code;
        this.message = message;
        this.statusCode = statusCode;
    }
}