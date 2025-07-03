package com.oasis.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.oasis.model.EnrollmentRequest;

@Repository
public interface EnrollmentRequestRepository extends JpaRepository<EnrollmentRequest, Long> {
    
    List<EnrollmentRequest> findByStudentIdIgnoreCase(String studentId);
    
    List<EnrollmentRequest> findByStatusIgnoreCase(String status);
    
    void deleteByStudentIdIgnoreCase(String studentId);
} 