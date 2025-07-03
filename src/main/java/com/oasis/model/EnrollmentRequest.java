package com.oasis.model;

import java.time.LocalDate;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

@Entity
@Table(name = "enrollment_requests")
public class EnrollmentRequest {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id")
    private Long id;
    
    @Column(name = "student_id", nullable = false, length = 20)
    private String studentId;
    
    @Column(name = "student_name", nullable = false, length = 100)
    private String studentName;
    
    @Column(name = "course", nullable = false, length = 50)
    private String course;
    
    @Column(name = "preferred_course_code", length = 50)
    private String preferredCourseCode;
    
    @Column(name = "section_id", length = 20)
    private String sectionId;
    
    @Column(name = "semester", nullable = false, length = 20)
    private String semester;
    
    @Column(name = "academic_year", nullable = false, length = 20)
    private String academicYear;
    
    @Column(name = "request_date", nullable = false)
    private LocalDate requestDate;
    
    @Column(name = "status", nullable = false, length = 20)
    private String status;
    
    @Column(name = "remarks", length = 500)
    private String remarks;

    // Constructors
    public EnrollmentRequest() {}

    public EnrollmentRequest(Long id, String studentId, String studentName, String course, String preferredCourseCode, String sectionId, String semester, String academicYear, LocalDate requestDate, String status, String remarks) {
        this.id = id;
        this.studentId = studentId;
        this.studentName = studentName;
        this.course = course;
        this.preferredCourseCode = preferredCourseCode;
        this.sectionId = sectionId;
        this.semester = semester;
        this.academicYear = academicYear;
        this.requestDate = requestDate;
        this.status = status;
        this.remarks = remarks;
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

    public String getStudentName() {
        return studentName;
    }

    public void setStudentName(String studentName) {
        this.studentName = studentName;
    }

    public String getCourse() {
        return course;
    }

    public void setCourse(String course) {
        this.course = course;
    }

    public String getPreferredCourseCode() {
        return preferredCourseCode;
    }

    public void setPreferredCourseCode(String preferredCourseCode) {
        this.preferredCourseCode = preferredCourseCode;
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

    public LocalDate getRequestDate() {
        return requestDate;
    }

    public void setRequestDate(LocalDate requestDate) {
        this.requestDate = requestDate;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public String getRemarks() {
        return remarks;
    }

    public void setRemarks(String remarks) {
        this.remarks = remarks;
    }
}