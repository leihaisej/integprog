package com.oasis.model;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

@Entity
@Table(name = "student_enrollments")
public class StudentEnrollment {
    
    @Id
    @Column(name = "student_id", length = 20)
    private String studentId;
    
    @Column(name = "course", length = 50)
    private String course;
    
    @Column(name = "section_id", length = 20)
    private String sectionId;
    
    @Column(name = "semester", length = 20)
    private String semester;
    
    @Column(name = "academic_year", length = 20)
    private String academicYear;
    
    @Column(name = "status", nullable = false, length = 20)
    private String status;

    // Constructors
    public StudentEnrollment() {}

    public StudentEnrollment(String studentId, String course, String sectionId, String semester, String academicYear, String status) {
        this.studentId = studentId;
        this.course = course;
        this.sectionId = sectionId;
        this.semester = semester;
        this.academicYear = academicYear;
        this.status = status;
    }

    // Getters and Setters
    public String getStudentId() {
        return studentId;
    }

    public void setStudentId(String studentId) {
        this.studentId = studentId;
    }

    public String getCourse() {
        return course;
    }

    public void setCourse(String course) {
        this.course = course;
    }

    public String getSectionId() {
        return sectionId;
    }

    public void setSectionId(String sectionId) {
        this.sectionId = sectionId;
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

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }
}