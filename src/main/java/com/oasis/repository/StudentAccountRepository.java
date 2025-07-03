package com.oasis.repository;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.oasis.model.StudentAccount;

@Repository
public interface StudentAccountRepository extends JpaRepository<StudentAccount, String> {
    
    Optional<StudentAccount> findByStudentIdIgnoreCase(String studentId);
    
    void deleteByStudentIdIgnoreCase(String studentId);
} 