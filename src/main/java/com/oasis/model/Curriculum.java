package com.oasis.model;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

@Entity
@Table(name = "curricula")
public class Curriculum {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "course_code", nullable = false, length = 20)
    private String courseCode;

    @Column(name = "year_level", nullable = false)
    private int yearLevel;

    @Column(name = "semester", nullable = false, length = 20)
    private String semester;

    @Column(name = "required_units", nullable = false)
    private int requiredUnits = 25;

    @Column(name = "subject_codes", length = 1000)
    private String subjectCodes; // Store as comma-separated string

    public Curriculum() {}

    public Curriculum(String courseCode, int yearLevel, String semester, String subjectCodes, int requiredUnits) {
        this.courseCode = courseCode;
        this.yearLevel = yearLevel;
        this.semester = semester;
        this.subjectCodes = subjectCodes;
        this.requiredUnits = requiredUnits;
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getCourseCode() { return courseCode; }
    public void setCourseCode(String courseCode) { this.courseCode = courseCode; }

    public int getYearLevel() { return yearLevel; }
    public void setYearLevel(int yearLevel) { this.yearLevel = yearLevel; }

    public String getSemester() { return semester; }
    public void setSemester(String semester) { this.semester = semester; }

    public String getSubjectCodes() { return subjectCodes; }
    public void setSubjectCodes(String subjectCodes) { this.subjectCodes = subjectCodes; }

    // Helper methods for List<String> compatibility
    public void setSubjectCodesList(java.util.List<String> codes) {
        this.subjectCodes = codes != null ? String.join(",", codes) : "";
    }

    public java.util.List<String> getSubjectCodesList() {
        if (subjectCodes == null || subjectCodes.trim().isEmpty()) {
            return new java.util.ArrayList<>();
        }
        return java.util.Arrays.asList(subjectCodes.split(","));
    }

    public int getRequiredUnits() { return requiredUnits; }
    public void setRequiredUnits(int requiredUnits) { this.requiredUnits = requiredUnits; }
} 