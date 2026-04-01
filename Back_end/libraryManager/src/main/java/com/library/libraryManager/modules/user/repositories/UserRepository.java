package com.library.libraryManager.modules.user.repositories;

import com.library.libraryManager.common.constants.Roles;
import com.library.libraryManager.modules.user.entities.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface UserRepository extends JpaRepository<User, Long> {
    
    Optional<User> findByUsername(String username);

    Optional<User> findByUsernameAndIsActiveTrue(String username);

    boolean existsByUsername(String username);

    @Query("SELECT u FROM User u WHERE " +
           "(LOWER(u.fullName) LIKE LOWER(CONCAT('%', :keyword, '%')) OR u.phone LIKE CONCAT('%', :keyword, '%')) " +
           "AND u.role = :role AND u.isActive = true")
    List<User> searchActiveUsersByRole(@Param("keyword") String keyword, @Param("role") Roles role);

    List<User> findAllByRoleAndIsActiveTrue(Roles role);
    
    List<User> findAllByIsActiveTrue();

    List<User> findAllByIsActiveFalse();

    List<User> findAllByRoleAndIsActiveFalse(Roles role);
}