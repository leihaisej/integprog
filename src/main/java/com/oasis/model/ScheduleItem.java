package com.oasis.model;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

@Entity
@Table(name = "schedule_items")
public class ScheduleItem {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @Column(name = "student_id", length = 20)
    private String studentId;
    
    @Column(name = "subject_code", length = 20)
    private String subjectCode;
    
    @Column(name = "description", length = 100)
    private String description;
    
    @Column(name = "units")
    private Integer units;
    
    @Column(name = "lec")
    private Integer lec;
    
    @Column(name = "lab")
    private Integer lab;
    
    @Column(name = "day_time", length = 50)
    private String dayTime;
    
    @Column(name = "room", length = 20)
    private String room;
    
    @Column(name = "faculty", length = 50)
    private String faculty;
    
    @Column(name = "academic_year", length = 20)
    private String academicYear;
    
    @Column(name = "semester", length = 20)
    private String semester;

    @Column(name = "day", length = 20)
    private String day;
    
    @Column(name = "start_time", length = 10)
    private String startTime;
    
    @Column(name = "end_time", length = 10)
    private String endTime;

    // Constructors
    public ScheduleItem() {}

    public ScheduleItem(String studentId, String subjectCode, String description, Integer units, Integer lec, Integer lab, String day, String startTime, String endTime, String room, String faculty, String academicYear, String semester) {
        this.studentId = studentId;
        this.subjectCode = subjectCode;
        this.description = description;
        this.units = units;
        this.lec = lec;
        this.lab = lab;
        this.day = day;
        this.startTime = startTime;
        this.endTime = endTime;
        this.room = room;
        this.faculty = faculty;
        this.academicYear = academicYear;
        this.semester = semester;
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

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public Integer getUnits() {
        return units;
    }

    public void setUnits(Integer units) {
        this.units = units;
    }

    public Integer getLec() {
        return lec;
    }

    public void setLec(Integer lec) {
        this.lec = lec;
    }

    public Integer getLab() {
        return lab;
    }

    public void setLab(Integer lab) {
        this.lab = lab;
    }

    public String getDayTime() {
        return dayTime;
    }

    public void setDayTime(String dayTime) {
        this.dayTime = dayTime;
    }

    public String getRoom() {
        return room;
    }

    public void setRoom(String room) {
        this.room = room;
    }

    public String getFaculty() {
        return faculty;
    }

    public void setFaculty(String faculty) {
        this.faculty = faculty;
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

    public String getDay() {
        return day;
    }

    public void setDay(String day) {
        this.day = day;
    }

    public String getStartTime() {
        return startTime;
    }

    public void setStartTime(String startTime) {
        this.startTime = startTime;
    }

    public String getEndTime() {
        return endTime;
    }

    public void setEndTime(String endTime) {
        this.endTime = endTime;
    }
}
