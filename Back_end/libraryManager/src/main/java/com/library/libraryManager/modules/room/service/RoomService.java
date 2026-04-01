package com.library.libraryManager.modules.room.service;

import com.library.libraryManager.common.exception.AppException;
import com.library.libraryManager.common.exception.ErrorCode;
import com.library.libraryManager.modules.room.dtos.requests.RoomRequest;
import com.library.libraryManager.modules.room.entities.Room;
import com.library.libraryManager.modules.room.repositories.RoomRepository;
import com.library.libraryManager.modules.room.dtos.responses.RoomResponse;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class RoomService {
    private final RoomRepository roomRepository;

    // 1. Lấy tất cả hoặc tìm kiếm theo tên
    public List<RoomResponse> getAllRooms(String name) {
        List<Room> rooms;
        if (name != null && !name.trim().isEmpty()) {
            rooms = roomRepository.findByNameContainingIgnoreCaseAndIsActiveTrue(name);
        } else {
            rooms = roomRepository.findAllByIsActiveTrue();
        }
        return rooms.stream().map(this::mapToRoomResponse).toList();
    }

    // 2. Lấy chi tiết 1 phòng
    public RoomResponse getRoomById(Long id) {
        return roomRepository.findByIdAndIsActiveTrue(id)
                .map(this::mapToRoomResponse)
                .orElseThrow(() -> new AppException(ErrorCode.ROOM_NOT_FOUND));
    }

    // 3. Tạo phòng mới
    @Transactional
    public RoomResponse createRoom(RoomRequest request) {
        if (roomRepository.existsByNameAndIsActiveTrue(request.name())) {
            throw new AppException(ErrorCode.ROOM_EXISTED);
        }
        
        Room room = Room.builder()
                .name(request.name())
                .note(request.note())
                .imageUrl(request.imageUrl())
                .capacity(request.capacity())
                .availableSlots(request.capacity()) // Mới tạo thì chỗ trống = sức chứa
                .build();
                
        return mapToRoomResponse(roomRepository.save(room));
    }

    // 4. Cập nhật phòng
    @Transactional
    public RoomResponse updateRoom(Long id, RoomRequest request) {
        Room room = roomRepository.findById(id)
                .orElseThrow(() -> new AppException(ErrorCode.ROOM_NOT_FOUND));

        if (roomRepository.existsByNameAndIsActiveTrue(request.name()) && !room.getName().equals(request.name())) {
            throw new AppException(ErrorCode.ROOM_EXISTED);
        }

        // Logic tính toán: Số người hiện tại đang ngồi trong phòng
        int currentOccupied = room.getCapacity() - room.getAvailableSlots();
        
        if (request.capacity() < currentOccupied) {
            // Không thể giảm sức chứa nhỏ hơn số người đang ngồi thực tế
            throw new AppException(ErrorCode.UNCATEGORIZED_EXCEPTION); 
        }

        room.setName(request.name());
        room.setImageUrl(request.imageUrl());
        room.setNote(request.note());
        room.setCapacity(request.capacity());
        // Cập nhật lại số chỗ trống dựa trên sức chứa mới
        room.setAvailableSlots(request.capacity() - currentOccupied);

        return mapToRoomResponse(roomRepository.save(room));
    }

    // 5. Xóa phòng
    @Transactional
    public void deleteRoom(Long id) {
        Room room = roomRepository.findById(id)
                .orElseThrow(() -> new AppException(ErrorCode.ROOM_NOT_FOUND));

        // Kiểm tra xem phòng có đang có người ngồi không (dựa vào availableSlots)
        if (room.getAvailableSlots() < room.getCapacity()) {
            throw new AppException(ErrorCode.ROOM_NOT_EMPTY);
        }
        
        // ĐỔI LOGIC XÓA CỨNG THÀNH XÓA MỀM TẠI ĐÂY
        room.setActive(false);
        roomRepository.save(room);
    }

    // 6. Hàm Helper chuyển đổi Entity -> DTO (Đã sửa logic totalUsers)
    private RoomResponse mapToRoomResponse(Room room) {
        // Số người đang ở trong phòng = Tổng sức chứa - Số chỗ còn trống
        int currentOccupied = room.getCapacity() - room.getAvailableSlots();

        return RoomResponse.builder()
                .id(room.getId())
                .name(room.getName())
                .note(room.getNote())
                .imageUrl(room.getImageUrl())
                .capacity(room.getCapacity())
                .availableSlots(room.getAvailableSlots()) // Thêm trường này nếu RoomResponse có
                .totalUsers(currentOccupied) // Lấy con số thực tế đang ngồi
                .build();
    }
}