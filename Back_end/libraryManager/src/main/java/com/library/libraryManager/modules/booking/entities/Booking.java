package com.library.libraryManager.modules.booking.entities;

import com.library.libraryManager.modules.user.entities.User;
import com.library.libraryManager.modules.room.entities.Room;
import com.library.libraryManager.common.constants.BookingStatus;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Getter 
@Setter 
@Builder
@NoArgsConstructor 
@AllArgsConstructor
public class Booking {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id")
    private User user;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "room_id")
    private Room room;


    @OneToMany(mappedBy = "booking", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<BookingDetail> bookingDetails = new ArrayList<>();

    private LocalDateTime startTime; // Lưu lúc bắt đầu vào
    private LocalDateTime endTime;   // Lưu lúc thực tế trả phòng

    @Enumerated(EnumType.STRING)
    private BookingStatus status;

    private String note;
}