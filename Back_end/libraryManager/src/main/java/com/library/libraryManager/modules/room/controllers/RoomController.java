package com.library.libraryManager.modules.room.controllers;

import com.library.libraryManager.common.dtos.ApiResponse;
import com.library.libraryManager.modules.room.dtos.requests.RoomRequest;
import com.library.libraryManager.modules.room.service.RoomService;
import com.library.libraryManager.modules.room.dtos.responses.RoomResponse;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;
import org.springframework.security.access.prepost.PreAuthorize;

import java.util.List;

@RestController
@RequestMapping("/api/v1/rooms")
@RequiredArgsConstructor
public class RoomController {

    private final RoomService roomService;

    @GetMapping
    public ApiResponse<List<RoomResponse>> getAll(@RequestParam(required = false) String name) {
        return ApiResponse.<List<RoomResponse>>builder()
                .result(roomService.getAllRooms(name))
                .build();
    }

    @GetMapping("/{id}")
    public ApiResponse<RoomResponse> getById(@PathVariable Long id) {
        return ApiResponse.<RoomResponse>builder()
                .result(roomService.getRoomById(id))
                .build();
    }

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')") // Chặn User thường
    public ApiResponse<RoomResponse> create(@RequestBody @Valid RoomRequest request) {
        return ApiResponse.<RoomResponse>builder()
                .message("Tạo phòng thành công")
                .result(roomService.createRoom(request))
                .build();
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ApiResponse<RoomResponse> update(@PathVariable Long id, @RequestBody @Valid RoomRequest request) {
        return ApiResponse.<RoomResponse>builder()
                .message("Cập nhật thành công")
                .result(roomService.updateRoom(id, request))
                .build();
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ApiResponse<Void> delete(@PathVariable Long id) {
        roomService.deleteRoom(id);
        return ApiResponse.<Void>builder()
                .message("Xóa phòng thành công")
                .build();
    }
}