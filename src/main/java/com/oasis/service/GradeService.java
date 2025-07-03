package com.oasis.service;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.oasis.model.StudentGrade;
import com.oasis.repository.StudentGradeRepository;

@Service
public class GradeService {
    
    @Autowired
    private StudentGradeRepository studentGradeRepository;
    
    // Grade conversion map (letter grade to numeric grade)
    private static final Map<String, Double> GRADE_CONVERSION = new HashMap<>();
    static {
        GRADE_CONVERSION.put("A", 1.0);
        GRADE_CONVERSION.put("A-", 1.25);
        GRADE_CONVERSION.put("B+", 1.5);
        GRADE_CONVERSION.put("B", 1.75);
        GRADE_CONVERSION.put("B-", 2.0);
        GRADE_CONVERSION.put("C+", 2.25);
        GRADE_CONVERSION.put("C", 2.5);
        GRADE_CONVERSION.put("C-", 2.75);
        GRADE_CONVERSION.put("D+", 3.0);
        GRADE_CONVERSION.put("D", 3.25);
        GRADE_CONVERSION.put("D-", 3.5);
        GRADE_CONVERSION.put("F", 5.0);
        GRADE_CONVERSION.put("INC", null); // Incomplete
        GRADE_CONVERSION.put("OD", null);  // Officially Dropped
        GRADE_CONVERSION.put("UD", null);  // Unofficially Dropped
        GRADE_CONVERSION.put("NGY", null); // No Grade Yet
    }
    
    /**
     * Convert letter grade to numeric grade
     */
    public Double convertGradeToNumeric(String letterGrade) {
        if (letterGrade == null || letterGrade.trim().isEmpty()) {
            return null;
        }
        return GRADE_CONVERSION.get(letterGrade.toUpperCase());
    }
    
    /**
     * Convert numeric grade to letter grade
     */
    public String convertNumericToGrade(Double numericGrade) {
        if (numericGrade == null) {
            return null;
        }
        
        if (numericGrade >= 1.0 && numericGrade < 1.25) return "A";
        if (numericGrade >= 1.25 && numericGrade < 1.5) return "A-";
        if (numericGrade >= 1.5 && numericGrade < 1.75) return "B+";
        if (numericGrade >= 1.75 && numericGrade < 2.0) return "B";
        if (numericGrade >= 2.0 && numericGrade < 2.25) return "B-";
        if (numericGrade >= 2.25 && numericGrade < 2.5) return "C+";
        if (numericGrade >= 2.5 && numericGrade < 2.75) return "C";
        if (numericGrade >= 2.75 && numericGrade < 3.0) return "C-";
        if (numericGrade >= 3.0 && numericGrade < 3.25) return "D+";
        if (numericGrade >= 3.25 && numericGrade < 3.5) return "D";
        if (numericGrade >= 3.5 && numericGrade < 5.0) return "D-";
        if (numericGrade >= 5.0) return "F";
        
        return null;
    }
    
    /**
     * Save or update a grade with automatic GPA computation
     */
    @Transactional
    public StudentGrade saveGrade(StudentGrade grade) {
        // Convert letter grade to numeric grade if needed
        if (grade.getNumericGrade() == null && grade.getGrade() != null) {
            Double numericGrade = convertGradeToNumeric(grade.getGrade());
            grade.setNumericGrade(numericGrade);
        }
        
        // Convert numeric grade to letter grade if needed
        if (grade.getGrade() == null && grade.getNumericGrade() != null) {
            String letterGrade = convertNumericToGrade(grade.getNumericGrade());
            grade.setGrade(letterGrade);
        }
        
        // Compute GPA
        if (grade.getNumericGrade() != null && grade.getUnits() != null) {
            grade.setGpa(grade.getUnits() * grade.getNumericGrade());
        }
        
        return studentGradeRepository.save(grade);
    }
    
    /**
     * Release a grade to make it visible to the student
     */
    @Transactional
    public StudentGrade releaseGrade(Long gradeId) {
        StudentGrade grade = studentGradeRepository.findById(gradeId)
            .orElseThrow(() -> new RuntimeException("Grade not found"));
        
        grade.setIsReleased(true);
        return studentGradeRepository.save(grade);
    }
    
    /**
     * Undo release of a grade (make it hidden from the student)
     */
    @Transactional
    public StudentGrade unreleaseGrade(Long gradeId) {
        StudentGrade grade = studentGradeRepository.findById(gradeId)
            .orElseThrow(() -> new RuntimeException("Grade not found"));
        grade.setIsReleased(false);
        return studentGradeRepository.save(grade);
    }
    
    /**
     * Get grades for a student (admin view - shows all grades)
     */
    public List<StudentGrade> getGradesForStudent(String studentId, String semester, String academicYear) {
        return studentGradeRepository.findByStudentIdIgnoreCaseAndSemesterIgnoreCaseAndAcademicYearIgnoreCase(studentId, semester, academicYear);
    }
    
    /**
     * Get released grades for a student (student view - shows only released grades)
     */
    public List<StudentGrade> getReleasedGradesForStudent(String studentId, String semester, String academicYear) {
        return studentGradeRepository.findByStudentIdAndSemesterAndAcademicYearAndIsReleasedTrue(studentId, semester, academicYear);
    }
    
    /**
     * Calculate overall GPA for a student in a specific term
     */
    public Double calculateTermGPA(String studentId, String semester, String academicYear) {
        List<StudentGrade> grades = getGradesForStudent(studentId, semester, academicYear);
        
        double totalGradePoints = 0.0;
        int totalUnits = 0;
        
        for (StudentGrade grade : grades) {
            if (grade.getNumericGrade() != null && grade.getUnits() != null) {
                totalGradePoints += grade.getGpa();
                totalUnits += grade.getUnits();
            }
        }
        
        if (totalUnits == 0) {
            return null;
        }
        
        return totalGradePoints / totalUnits;
    }
    
    /**
     * Calculate cumulative GPA for a student across all terms
     */
    public Double calculateCumulativeGPA(String studentId) {
        List<StudentGrade> allGrades = studentGradeRepository.findByStudentId(studentId);
        
        double totalGradePoints = 0.0;
        int totalUnits = 0;
        
        for (StudentGrade grade : allGrades) {
            if (grade.getNumericGrade() != null && grade.getUnits() != null) {
                totalGradePoints += grade.getGpa();
                totalUnits += grade.getUnits();
            }
        }
        
        if (totalUnits == 0) {
            return null;
        }
        
        return totalGradePoints / totalUnits;
    }
} 