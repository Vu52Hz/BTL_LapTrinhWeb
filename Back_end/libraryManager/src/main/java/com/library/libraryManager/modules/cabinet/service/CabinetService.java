package com.library.libraryManager.modules.cabinet.service;

import com.library.libraryManager.common.exception.AppException;
import com.library.libraryManager.common.exception.ErrorCode;
import com.library.libraryManager.modules.cabinet.dtos.requests.CabinetRequest;
import com.library.libraryManager.modules.cabinet.dtos.responses.CabinetResponse;
import com.library.libraryManager.modules.cabinet.entities.Cabinet;
import com.library.libraryManager.modules.cabinet.repositories.CabinetRepository;
import com.library.libraryManager.modules.BookInventory.entities.BookInventory;
import com.library.libraryManager.modules.BookInventory.repositories.BookInventoryRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class CabinetService {
    private final CabinetRepository cabinetRepository;
    private final BookInventoryRepository bookInventoryRepository;

    public List<CabinetResponse> getAll(String ten) {
        List<Cabinet> cabinets;
        if (ten != null && !ten.trim().isEmpty()) {
            cabinets = cabinetRepository.findByTenContainingIgnoreCase(ten);
        } else {
            cabinets = cabinetRepository.findAll();
        }
        return cabinets.stream().map(this::mapToCabinetResponse).toList();
    }

    public CabinetResponse getById(Long id) {
        Cabinet cabinet = cabinetRepository.findById(id)
                .orElseThrow(() -> new AppException(ErrorCode.CABINET_NOT_FOUND));
        return mapToCabinetResponse(cabinet);
    }

    @Transactional
    public CabinetResponse create(CabinetRequest request) {
        if (cabinetRepository.existsByTen(request.ten())) {
            throw new AppException(ErrorCode.CABINET_EXISTED); 
        }
        
        Cabinet cabinet = Cabinet.builder()
                .ten(request.ten())
                .note(request.note())
                .urlAnhTuSach(request.urlAnhTuSach())
                .build();
                
        return mapToCabinetResponse(cabinetRepository.save(cabinet));
    }

    @Transactional
    public CabinetResponse update(Long id, CabinetRequest request) {
        Cabinet cabinet = cabinetRepository.findById(id)
                .orElseThrow(() -> new AppException(ErrorCode.CABINET_NOT_FOUND));

        if (!cabinet.getTen().equals(request.ten()) && cabinetRepository.existsByTen(request.ten())) {
            throw new AppException(ErrorCode.CABINET_EXISTED);
        }

        cabinet.setTen(request.ten());
        cabinet.setNote(request.note());
        cabinet.setUrlAnhTuSach(request.urlAnhTuSach());

        return mapToCabinetResponse(cabinetRepository.save(cabinet));
    }

    @Transactional
    public void delete(Long id) {
        if (!cabinetRepository.existsById(id)) {
            throw new AppException(ErrorCode.CABINET_NOT_FOUND);
        }
        
        // Chỉ đếm những đầu sách ĐANG HOẠT ĐỘNG trong tủ
        // Cần đảm bảo Repository có method: long countByCabinetIdAndIsActiveTrue(Long cabinetId);
        long bookCount = bookInventoryRepository.countByCabinetIdAndIsActiveTrue(id);
        
        if (bookCount > 0) {
            throw new AppException(ErrorCode.CABINET_NOT_EMPTY);
        }
        cabinetRepository.deleteById(id);
    }

    // Hàm Helper để chuyển đổi Entity sang DTO
    private CabinetResponse mapToCabinetResponse(Cabinet cabinet) {
        // 1. Lấy danh sách inventory đang hoạt động của tủ này
        List<BookInventory> inventories = bookInventoryRepository.findByCabinetIdAndIsActiveTrue(cabinet.getId());
        
        // 2. Tính tổng số cuốn sách vật lý có trong tủ (Sum totalQuantity)
        int totalPhysicalBooks = inventories.stream()
                .mapToInt(BookInventory::getTotalQuantity)
                .sum();
        
        // 3. Đếm số đầu sách duy nhất (Unique titles)
        int uniqueBookTitles = inventories.size();
        
        return CabinetResponse.builder()
                .id(cabinet.getId())
                .ten(cabinet.getTen())
                .note(cabinet.getNote())
                .urlAnhTuSach(cabinet.getUrlAnhTuSach())
                .tongSoSach(totalPhysicalBooks) // Trả về tổng số cuốn vật lý cho chuyên nghiệp
                .uniqueBooksCount(uniqueBookTitles) // Có thể thêm trường này vào DTO nếu cần
                .build();
    }
}