package com.oasis.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.oasis.model.StudentForm;

@Repository
public interface StudentFormRepository extends JpaRepository<StudentForm, Long> {
    
    List<StudentForm> findByStudentIdIgnoreCaseOrderByRequestDateDesc(String studentId);
    
    List<StudentForm> findByStudentIdIgnoreCaseAndStatusIgnoreCaseOrderByRequestDateDesc(String studentId, String status);
    
    void deleteByStudentIdIgnoreCase(String studentId);
} 