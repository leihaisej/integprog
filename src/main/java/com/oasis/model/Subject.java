package com.oasis.model;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

@Entity
@Table(name = "subjects")
public class Subject {
    
    @Id
    @Column(name = "code", length = 20)
    private String code;
    
    @Column(name = "name", nullable = false, length = 100)
    private String name;
    
    @Column(name = "units", nullable = false)
    private Integer units;
    
    @Column(name = "course_code", length = 20)
    private String courseCode;
    
    @Column(name = "description", length = 500)
    private String description;

    @Column(name = "lec")
    private Integer lec;

    @Column(name = "lab")
    private Integer lab;

    // Constructors
    public Subject() {}

    public Subject(String code, String name, Integer units, String courseCode, String description, Integer lec, Integer lab) {
        this.code = code;
        this.name = name;
        this.units = units;
        this.courseCode = courseCode;
        this.description = description;
        this.lec = lec;
        this.lab = lab;
    }

    // Getters and Setters
    public String getCode() {
        return code;
    }

    public void setCode(String code) {
        this.code = code;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public Integer getUnits() {
        return units;
    }

    public void setUnits(Integer units) {
        this.units = units;
    }

    public String getCourseCode() {
        return courseCode;
    }

    public void setCourseCode(String courseCode) {
        this.courseCode = courseCode;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
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
}