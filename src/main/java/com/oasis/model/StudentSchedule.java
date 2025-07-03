package com.oasis.model;

import java.util.List;

import jakarta.persistence.CollectionTable;
import jakarta.persistence.Column;
import jakarta.persistence.ElementCollection;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.Table;

@Entity
@Table(name = "student_schedules")
public class StudentSchedule {
    
    @Id
    @Column(name = "student_id", length = 20)
    private String studentId;
    
    @Column(name = "academic_year", length = 20)
    private String academicYear;
    
    @Column(name = "semester", length = 20)
    private String semester;
    
    @ElementCollection
    @CollectionTable(name = "student_schedule_items", 
                    joinColumns = @JoinColumn(name = "student_id"))
    @Column(name = "schedule_item", length = 200)
    private List<String> scheduleItems;

    // Constructors
    public StudentSchedule() {}

    public StudentSchedule(String studentId, String academicYear, String semester, List<String> scheduleItems) {
        this.studentId = studentId;
        this.academicYear = academicYear;
        this.semester = semester;
        this.scheduleItems = scheduleItems;
    }

    // Getters and Setters
    public String getStudentId() {
        return studentId;
    }

    public void setStudentId(String studentId) {
        this.studentId = studentId;
    }

    public String getAcademicYear() {
        return academicYear;
    }

    public void setAcademicYear(String academicYear) {
        this.academicYear = academicYear;
    }

    public String getSemester() {
        return semester;
    }

    public void setSemester(String semester) {
        this.semester = semester;
    }

    public List<String> getScheduleItems() {
        return scheduleItems;
    }

    public void setScheduleItems(List<String> scheduleItems) {
        this.scheduleItems = scheduleItems;
    }
}