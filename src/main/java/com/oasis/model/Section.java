package com.oasis.model;

import java.util.List;

import jakarta.persistence.Column;
import jakarta.persistence.ElementCollection;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

@Entity
@Table(name = "sections")
public class Section {
    
    @Id
    @Column(name = "id", length = 20)
    private String id;
    
    @Column(name = "name", nullable = false, length = 50)
    private String name; // e.g., "BSIT 1-A"
    
    @Column(name = "course_code", length = 20)
    private String courseCode;
    
    @Column(name = "year_level", length = 10)
    private String yearLevel; // e.g., "1", "2", "3", "4"
    
    @Column(name = "section_letter", length = 5)
    private String sectionLetter; // e.g., "A", "B", "C"
    
    @ElementCollection
    private List<String> subjectCodes;
    
    @Column(name = "faculty_id", length = 20)
    private String facultyId;
    
    @Column(name = "schedule", length = 100)
    private String schedule; // e.g., "MWF 9:00-10:00 AM - Room 101"
    
    @Column(name = "max_capacity")
    private Integer maxCapacity;
    
    @Column(name = "current_enrollment")
    private Integer currentEnrollment; // Number of students currently enrolled

    // Constructors
    public Section() {}

    public Section(String id, String name, String courseCode, String yearLevel, String sectionLetter, List<String> subjectCodes, String facultyId, String schedule, Integer maxCapacity, Integer currentEnrollment) {
        this.id = id;
        this.name = name;
        this.courseCode = courseCode;
        this.yearLevel = yearLevel;
        this.sectionLetter = sectionLetter;
        this.subjectCodes = subjectCodes;
        this.facultyId = facultyId;
        this.schedule = schedule;
        this.maxCapacity = maxCapacity;
        this.currentEnrollment = currentEnrollment;
    }

    // Getters and Setters
    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getCourseCode() {
        return courseCode;
    }

    public void setCourseCode(String courseCode) {
        this.courseCode = courseCode;
    }

    public String getYearLevel() {
        return yearLevel;
    }

    public void setYearLevel(String yearLevel) {
        this.yearLevel = yearLevel;
    }

    public String getSectionLetter() {
        return sectionLetter;
    }

    public void setSectionLetter(String sectionLetter) {
        this.sectionLetter = sectionLetter;
    }

    public List<String> getSubjectCodes() {
        return subjectCodes;
    }

    public void setSubjectCodes(List<String> subjectCodes) {
        this.subjectCodes = subjectCodes;
    }

    public String getFacultyId() {
        return facultyId;
    }

    public void setFacultyId(String facultyId) {
        this.facultyId = facultyId;
    }

    public String getSchedule() {
        return schedule;
    }

    public void setSchedule(String schedule) {
        this.schedule = schedule;
    }

    public Integer getMaxCapacity() {
        return maxCapacity;
    }

    public void setMaxCapacity(Integer maxCapacity) {
        this.maxCapacity = maxCapacity;
    }

    public Integer getCurrentEnrollment() {
        return currentEnrollment;
    }

    public void setCurrentEnrollment(Integer currentEnrollment) {
        this.currentEnrollment = currentEnrollment;
    }
}