package com.oasis.repository;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.oasis.model.StudentSchedule;

@Repository
public interface StudentScheduleRepository extends JpaRepository<StudentSchedule, String> {
    
    Optional<StudentSchedule> findByStudentIdIgnoreCase(String studentId);
    
    void deleteByStudentIdIgnoreCase(String studentId);
} 