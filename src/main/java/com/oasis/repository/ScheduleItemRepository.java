package com.oasis.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.oasis.model.ScheduleItem;

@Repository
public interface ScheduleItemRepository extends JpaRepository<ScheduleItem, Long> {
    
    List<ScheduleItem> findByStudentIdIgnoreCase(String studentId);
    
    List<ScheduleItem> findByStudentIdIgnoreCaseAndAcademicYearAndSemester(String studentId, String academicYear, String semester);
    
    void deleteByStudentIdIgnoreCase(String studentId);
    
    void deleteByStudentIdIgnoreCaseAndAcademicYearAndSemester(String studentId, String academicYear, String semester);
} 