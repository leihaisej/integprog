package com.oasis.model;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

@Entity
@Table(name = "users")
public class User {
    
    @Id
    @Column(name = "id", length = 50)
    private String id;
    
    @Column(name = "name", nullable = false, length = 100)
    private String name;
    
    @Column(name = "password", length = 100)
    private String password;
    
    @Column(name = "role", nullable = false, length = 20)
    private String role;
    
    @Column(name = "course", length = 50)
    private String course;
    
    @Column(name = "faculty_id", length = 50)
    private String facultyId;
    
    @Column(name = "status", length = 50)
    private String status;
    
    @Column(name = "admission_status", length = 50)
    private String admissionStatus;
    
    @Column(name = "scholastic_status", length = 50)
    private String scholasticStatus;
    
    @Column(name = "section", length = 50)
    private String section;
    
    @Column(name = "preferred_course_code", length = 50)
    private String preferredCourseCode;

    @Column(name = "current_sy", length = 10)
    private String currentSY;

    @Column(name = "current_sem", length = 20)
    private String currentSem;

    // Constructors
    public User() {}

    public User(String id, String name, String password, String role, String course, String facultyId) {
        this.id = id;
        this.name = name;
        this.password = password;
        this.role = role;
        this.course = course;
        this.facultyId = facultyId;
        this.status = "New Applicant";
        this.admissionStatus = "New";
        this.scholasticStatus = "Pending";
        this.section = null;
        this.preferredCourseCode = null;
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

    public String getPassword() {
        return password;
    }

    public void setPassword(String password) {
        this.password = password;
    }

    public String getRole() {
        return role;
    }

    public void setRole(String role) {
        this.role = role;
    }

    public String getCourse() {
        return course;
    }

    public void setCourse(String course) {
        this.course = course;
    }

    public String getFacultyId() {
        return facultyId;
    }

    public void setFacultyId(String facultyId) {
        this.facultyId = facultyId;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public String getAdmissionStatus() {
        return admissionStatus;
    }

    public void setAdmissionStatus(String admissionStatus) {
        this.admissionStatus = admissionStatus;
    }

    public String getScholasticStatus() {
        return scholasticStatus;
    }

    public void setScholasticStatus(String scholasticStatus) {
        this.scholasticStatus = scholasticStatus;
    }

    public String getSection() {
        return section;
    }

    public void setSection(String section) {
        this.section = section;
    }

    public String getPreferredCourseCode() {
        return preferredCourseCode;
    }

    public void setPreferredCourseCode(String preferredCourseCode) {
        this.preferredCourseCode = preferredCourseCode;
    }

    public String getCurrentSY() {
        return currentSY;
    }

    public void setCurrentSY(String currentSY) {
        this.currentSY = currentSY;
    }

    public String getCurrentSem() {
        return currentSem;
    }

    public void setCurrentSem(String currentSem) {
        this.currentSem = currentSem;
    }

    @Override
    public String toString() {
        return "User{" +
               "id='" + id + '\'' +
               ", name='" + name + '\'' +
               ", role='" + role + '\'' +
               '}';
    }
}