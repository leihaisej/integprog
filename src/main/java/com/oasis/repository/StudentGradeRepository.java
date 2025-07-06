package com.oasis.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
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

    // Find all grades for a section, subject, academic year, and semester
    @Query("SELECT g FROM StudentGrade g WHERE g.subjectCode = :subjectCode AND g.academicYear = :academicYear AND g.semester = :semester AND g.studentId IN (SELECT u.id FROM User u WHERE u.section = :sectionId)")
    List<StudentGrade> findBySectionAndSubjectAndTerm(@Param("sectionId") String sectionId, @Param("subjectCode") String subjectCode, @Param("academicYear") String academicYear, @Param("semester") String semester);

    // Find a grade for a student/subject/term
    Optional<StudentGrade> findByStudentIdAndSubjectCodeAndAcademicYearAndSemester(String studentId, String subjectCode, String academicYear, String semester);
    
    // Find grades by student ID and subject code
    List<StudentGrade> findByStudentIdAndSubjectCode(String studentId, String subjectCode);
    
    // Find grades by subject code, academic year, and semester
    List<StudentGrade> findBySubjectCodeAndAcademicYearAndSemester(String subjectCode, String academicYear, String semester);
    
    // Find all released grades for a student
    List<StudentGrade> findByStudentIdAndIsReleasedTrue(String studentId);
    
    // Find grades by student ID, subject code, and isReleased status
    List<StudentGrade> findByStudentIdAndSubjectCodeAndIsReleased(String studentId, String subjectCode, Boolean isReleased);
    
    // Count grades by student ID and term
    @Query("SELECT COUNT(g) FROM StudentGrade g WHERE g.studentId = :studentId AND g.academicYear = :academicYear AND g.semester = :semester")
    Long countByStudentIdAndTerm(@Param("studentId") String studentId, @Param("academicYear") String academicYear, @Param("semester") String semester);
    
    // Find grades with GPA calculation for a student and term
    @Query("SELECT g FROM StudentGrade g WHERE g.studentId = :studentId AND g.academicYear = :academicYear AND g.semester = :semester AND g.numericGrade IS NOT NULL AND g.units IS NOT NULL")
    List<StudentGrade> findGradesWithGPAForTerm(@Param("studentId") String studentId, @Param("academicYear") String academicYear, @Param("semester") String semester);

    // Find all grades for a section (all subjects, all terms)
    @Query("SELECT g FROM StudentGrade g WHERE g.studentId IN (SELECT u.id FROM User u WHERE u.section = :sectionId)")
    List<StudentGrade> findBySection(@Param("sectionId") String sectionId);
} 