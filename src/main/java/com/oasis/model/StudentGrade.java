package com.oasis.model;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

@Entity
@Table(name = "student_grades")
public class StudentGrade {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @Column(name = "student_id", nullable = false, length = 20)
    private String studentId;
    
    @Column(name = "subject_code", nullable = false, length = 20)
    private String subjectCode;
    
    @Column(name = "subject_name", nullable = false, length = 100)
    private String subjectName;
    
    @Column(name = "units")
    private Integer units;
    
    @Column(name = "grade", length = 10)
    private String grade; // Letter grade (A, B, C, D, F, INC, etc.)
    
    @Column(name = "numeric_grade")
    private Double numericGrade; // Numeric grade for GPA computation (1.0, 1.25, 1.5, etc.)
    
    @Column(name = "gpa")
    private Double gpa; // Grade Point Average for this subject (units * numericGrade)
    
    @Column(name = "semester", length = 20)
    private String semester;
    
    @Column(name = "academic_year", length = 20)
    private String academicYear;
    
    @Column(name = "is_released", columnDefinition = "BOOLEAN DEFAULT FALSE")
    private Boolean isReleased = false; // Whether the grade is released to student

    // Constructors
    public StudentGrade() {}

    public StudentGrade(String studentId, String subjectCode, String subjectName, Integer units, String grade, String semester, String academicYear) {
        this.studentId = studentId;
        this.subjectCode = subjectCode;
        this.subjectName = subjectName;
        this.units = units;
        this.grade = grade;
        this.semester = semester;
        this.academicYear = academicYear;
        this.isReleased = false;
        // GPA will be computed when numeric grade is set
    }

    public StudentGrade(String studentId, String subjectCode, String subjectName, Integer units, String grade, Double numericGrade, String semester, String academicYear, Boolean isReleased) {
        this.studentId = studentId;
        this.subjectCode = subjectCode;
        this.subjectName = subjectName;
        this.units = units;
        this.grade = grade;
        this.numericGrade = numericGrade;
        this.semester = semester;
        this.academicYear = academicYear;
        this.isReleased = isReleased != null ? isReleased : false;
        // Compute GPA if numeric grade is provided
        if (numericGrade != null && units != null) {
            this.gpa = units * numericGrade;
        }
    }

    // Getters and Setters
    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getStudentId() {
        return studentId;
    }

    public void setStudentId(String studentId) {
        this.studentId = studentId;
    }

    public String getSubjectCode() {
        return subjectCode;
    }

    public void setSubjectCode(String subjectCode) {
        this.subjectCode = subjectCode;
    }

    public String getSubjectName() {
        return subjectName;
    }

    public void setSubjectName(String subjectName) {
        this.subjectName = subjectName;
    }

    public Integer getUnits() {
        return units;
    }

    public void setUnits(Integer units) {
        this.units = units;
    }

    public String getGrade() {
        return grade;
    }

    public void setGrade(String grade) {
        this.grade = grade;
    }

    public Double getNumericGrade() {
        return numericGrade;
    }

    public void setNumericGrade(Double numericGrade) {
        this.numericGrade = numericGrade;
        if (numericGrade != null && units != null) {
            this.gpa = units * numericGrade;
        }
    }

    public Double getGpa() {
        return gpa;
    }

    public void setGpa(Double gpa) {
        this.gpa = gpa;
    }

    public String getSemester() {
        return semester;
    }

    public void setSemester(String semester) {
        this.semester = semester;
    }

    public String getAcademicYear() {
        return academicYear;
    }

    public void setAcademicYear(String academicYear) {
        this.academicYear = academicYear;
    }

    public Boolean getIsReleased() {
        return isReleased;
    }

    public void setIsReleased(Boolean isReleased) {
        this.isReleased = isReleased;
    }
}