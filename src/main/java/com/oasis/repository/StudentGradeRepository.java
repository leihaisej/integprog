package com.oasis.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.oasis.model.StudentGrade;

@Repository
public interface StudentGradeRepository extends JpaRepository<StudentGrade, Long> {
    
    List<StudentGrade> findByStudentIdIgnoreCase(String studentId);
    
    List<StudentGrade> findByStudentId(String studentId);
    
    List<StudentGrade> findByStudentIdIgnoreCaseAndSemesterIgnoreCase(String studentId, String semester);
    
    List<StudentGrade> findByStudentIdIgnoreCaseAndAcademicYearIgnoreCase(String studentId, String academicYear);
    
    List<StudentGrade> findByStudentIdAndSemesterAndAcademicYear(String studentId, String semester, String academicYear);
    
    List<StudentGrade> findByStudentIdAndSemesterAndAcademicYearAndIsReleasedTrue(String studentId, String semester, String academicYear);
    
    List<StudentGrade> findByStudentIdIgnoreCaseAndSemesterIgnoreCaseAndAcademicYearIgnoreCase(String studentId, String semester, String academicYear);
    
    void deleteByStudentIdIgnoreCase(String studentId);
} 