package com.oasis.service;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.oasis.model.StudentGrade;
import com.oasis.repository.StudentGradeRepository;
import com.oasis.repository.SubjectRepository;

@Service
public class GradeService {
    
    @Autowired
    private StudentGradeRepository studentGradeRepository;
    
    @Autowired
    private SubjectRepository subjectRepository;
    
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
    public Double convertLetterToNumeric(String letterGrade) {
        if (letterGrade == null || letterGrade.trim().isEmpty()) {
            return null;
        }
        return GRADE_CONVERSION.get(letterGrade.toUpperCase());
    }
    
    /**
     * Convert numeric grade to letter grade
     */
    public String convertNumericToLetter(Double numericGrade) {
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
     * Validate grade input
     */
    public boolean isValidGrade(String grade) {
        if (grade == null || grade.trim().isEmpty()) {
            return false;
        }
        
        // Check if it's a valid letter grade
        if (GRADE_CONVERSION.containsKey(grade.toUpperCase())) {
            return true;
        }
        
        // Check if it's a valid numeric grade
        try {
            double numericGrade = Double.parseDouble(grade);
            return (numericGrade >= 1.0 && numericGrade <= 5.0) || 
                   (numericGrade >= 0 && numericGrade <= 100);
        } catch (NumberFormatException e) {
            return false;
        }
    }
    
    /**
     * Save or update a grade with automatic conversion and validation
     */
    @Transactional
    public StudentGrade saveGrade(StudentGrade grade) {
        // Validate input
        if (grade.getStudentId() == null || grade.getStudentId().trim().isEmpty()) {
            throw new IllegalArgumentException("Student ID is required");
        }
        if (grade.getSubjectCode() == null || grade.getSubjectCode().trim().isEmpty()) {
            throw new IllegalArgumentException("Subject code is required");
        }
        if (grade.getAcademicYear() == null || grade.getAcademicYear().trim().isEmpty()) {
            throw new IllegalArgumentException("Academic year is required");
        }
        if (grade.getSemester() == null || grade.getSemester().trim().isEmpty()) {
            throw new IllegalArgumentException("Semester is required");
        }
        
        // Handle grade conversion
        if (grade.getGrade() != null && grade.getNumericGrade() == null) {
            // Convert letter grade to numeric
            grade.setNumericGrade(convertLetterToNumeric(grade.getGrade()));
        } else if (grade.getNumericGrade() != null && grade.getGrade() == null) {
            // Convert numeric grade to letter
            grade.setGrade(convertNumericToLetter(grade.getNumericGrade()));
        }
        
        // Compute GPA
        if (grade.getNumericGrade() != null && grade.getUnits() != null) {
            grade.setGpa(grade.getUnits() * grade.getNumericGrade());
        }
        
        // Set default values
        if (grade.getIsReleased() == null) {
            grade.setIsReleased(false);
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
        System.out.println("[DEBUG] Fetching released grades for studentId=" + studentId + ", semester=" + semester + ", academicYear=" + academicYear);
        List<StudentGrade> grades = studentGradeRepository.findByStudentIdAndSemesterAndAcademicYearAndIsReleasedTrue(studentId, semester, academicYear);
        System.out.println("[DEBUG] Found " + grades.size() + " released grades");
        for (StudentGrade g : grades) {
            System.out.println("  - " + g.getSubjectCode() + " | " + g.getSemester() + " | " + g.getAcademicYear() + " | Released: " + g.getIsReleased());
        }
        return grades;
    }
    
    /**
     * Get all grades for a section/subject/term
     */
    public List<StudentGrade> getGradesForSection(String sectionId, String subjectCode, String academicYear, String semester) {
        return studentGradeRepository.findBySectionAndSubjectAndTerm(sectionId, subjectCode, academicYear, semester);
    }
    
    /**
     * Calculate overall GPA for a student in a specific term
     */
    public Double calculateTermGPA(String studentId, String semester, String academicYear) {
        List<StudentGrade> grades = studentGradeRepository.findGradesWithGPAForTerm(studentId, academicYear, semester);
        if (grades == null || grades.isEmpty()) {
            return null;
        }
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
        if (allGrades == null || allGrades.isEmpty()) {
            return null;
        }
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
    
    /**
     * Batch encode grades for a section/subject/term
     */
    @Transactional
    public int batchEncodeGrades(String sectionId, String subjectCode, String academicYear, String semester, List<Map<String, Object>> grades) {
        int count = 0;
        // Look up subject name once for this batch
        String subjectName = subjectRepository.findByCodeIgnoreCase(subjectCode)
            .map(s -> s.getName())
            .orElse("Unknown Subject");
        for (Map<String, Object> g : grades) {
            String studentId = (String) g.get("studentId");
            Object numericGradeObj = g.get("numericGrade");
            String remarks = (String) g.get("remarks");
            Double numericGrade = null;
            if (numericGradeObj != null) {
                if (numericGradeObj instanceof Number) {
                    numericGrade = ((Number) numericGradeObj).doubleValue();
                } else if (numericGradeObj instanceof String) {
                    try {
                        numericGrade = Double.parseDouble((String) numericGradeObj);
                    } catch (NumberFormatException e) {
                        continue;
                    }
                }
            }
            Optional<StudentGrade> gradeOpt = studentGradeRepository.findByStudentIdAndSubjectCodeAndAcademicYearAndSemester(studentId, subjectCode, academicYear, semester);
            StudentGrade grade = gradeOpt.orElseGet(() -> {
                StudentGrade ng = new StudentGrade();
                ng.setStudentId(studentId);
                ng.setSubjectCode(subjectCode);
                ng.setAcademicYear(academicYear);
                ng.setSemester(semester);
                ng.setIsReleased(false);
                // Always set subjectName from repository
                ng.setSubjectName(subjectName);
                Object unitsObj = g.get("units");
                if (unitsObj instanceof Number) {
                    ng.setUnits(((Number) unitsObj).intValue());
                } else if (unitsObj instanceof String) {
                    try {
                        ng.setUnits(Integer.parseInt((String) unitsObj));
                    } catch (NumberFormatException e) {
                        ng.setUnits(null);
                    }
                }
                return ng;
            });
            if (numericGrade != null) {
                grade.setNumericGrade(numericGrade);
                grade.setGrade(convertNumericToLetter(numericGrade));
                if (grade.getUnits() != null) {
                    grade.setGpa(grade.getUnits() * numericGrade);
                }
            }
            if (remarks != null) {
                grade.setRemarks(remarks);
            }
            // Always update subjectName from repository
            grade.setSubjectName(subjectName);
            Object unitsObj = g.get("units");
            if (unitsObj instanceof Number) {
                grade.setUnits(((Number) unitsObj).intValue());
            } else if (unitsObj instanceof String) {
                try {
                    grade.setUnits(Integer.parseInt((String) unitsObj));
                } catch (NumberFormatException e) {
                    grade.setUnits(null);
                }
            }
            studentGradeRepository.save(grade);
            count++;
        }
        return count;
    }

    /**
     * Batch release all grades for a section/subject/term
     */
    @Transactional
    public int releaseAllGrades(String sectionId, String subjectCode, String academicYear, String semester) {
        List<StudentGrade> grades = studentGradeRepository.findBySectionAndSubjectAndTerm(sectionId, subjectCode, academicYear, semester);
        System.out.println("[DEBUG] Releasing all grades for section=" + sectionId + ", subject=" + subjectCode + ", academicYear=" + academicYear + ", semester=" + semester);
        for (StudentGrade grade : grades) {
            grade.setIsReleased(true);
            System.out.println("  - Releasing grade for studentId=" + grade.getStudentId() + ", subject=" + grade.getSubjectCode() + ", semester=" + grade.getSemester() + ", academicYear=" + grade.getAcademicYear());
        }
        studentGradeRepository.saveAll(grades);
        return grades.size();
    }
    
    /**
     * Batch unrelease all grades for a section/subject/term
     */
    @Transactional
    public int unreleaseAllGrades(String sectionId, String subjectCode, String academicYear, String semester) {
        List<StudentGrade> grades = studentGradeRepository.findBySectionAndSubjectAndTerm(sectionId, subjectCode, academicYear, semester);
        for (StudentGrade grade : grades) {
            grade.setIsReleased(false);
        }
        studentGradeRepository.saveAll(grades);
        return grades.size();
    }
    
    /**
     * Get grade statistics for a section/subject/term
     */
    public Map<String, Object> getGradeStatistics(String sectionId, String subjectCode, String academicYear, String semester) {
        List<StudentGrade> grades = studentGradeRepository.findBySectionAndSubjectAndTerm(sectionId, subjectCode, academicYear, semester);
        
        Map<String, Object> stats = new HashMap<>();
        stats.put("totalStudents", grades.size());
        
        long encodedGrades = grades.stream().filter(g -> g.getNumericGrade() != null || g.getGrade() != null).count();
        stats.put("encodedGrades", encodedGrades);
        
        long releasedGrades = grades.stream().filter(g -> Boolean.TRUE.equals(g.getIsReleased())).count();
        stats.put("releasedGrades", releasedGrades);
        
        if (encodedGrades > 0) {
            double averageGrade = grades.stream()
                .filter(g -> g.getNumericGrade() != null)
                .mapToDouble(StudentGrade::getNumericGrade)
                .average()
                .orElse(0.0);
            stats.put("averageGrade", averageGrade);
        }
        
        return stats;
    }

    // Get all grades for a section (regardless of subject or term)
    public List<StudentGrade> getAllGradesForSection(String sectionId) {
        // Find all students in the section and get their grades
        // This assumes studentId in StudentGrade matches User.id and User.section
        // We'll use a custom repository method for this
        return studentGradeRepository.findBySection(sectionId);
    }
} 