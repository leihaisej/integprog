package com.oasis.repository;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.oasis.model.StudentEnrollment;

@Repository
public interface StudentEnrollmentRepository extends JpaRepository<StudentEnrollment, String> {
    
    Optional<StudentEnrollment> findByStudentIdIgnoreCase(String studentId);
    
    void deleteByStudentIdIgnoreCase(String studentId);
} 