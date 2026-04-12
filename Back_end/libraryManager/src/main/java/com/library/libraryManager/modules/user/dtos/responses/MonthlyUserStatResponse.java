package com.library.libraryManager.modules.user.dtos.responses;

public record MonthlyUserStatResponse(
    int year,       // Năm
    int month,      // Tháng (1 - 12)
    long total,     // Tổng số tài khoản trong tháng
    long active,    // Số tài khoản đang hoạt động (tại cuối tháng)
    long locked     // Số tài khoản bị khóa (tại cuối tháng)
) {}