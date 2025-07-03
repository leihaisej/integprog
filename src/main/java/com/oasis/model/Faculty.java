package com.oasis.model;

import java.util.List;

import jakarta.persistence.Column;
import jakarta.persistence.ElementCollection;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

@Entity
@Table(name = "faculty")
public class Faculty {
    
    @Id
    @Column(name = "id", length = 20)
    private String id;
    
    @Column(name = "name", nullable = false, length = 100)
    private String name;
    
    @Column(name = "department", length = 100)
    private String department;
    
    @Column(name = "contact_number", length = 20)
    private String contactNumber;
    
    @Column(name = "email", length = 100)
    private String email;
    
    @Column(name = "position", length = 50)
    private String position;
    
    @ElementCollection
    private List<String> assignedSubjects; // List of subject codes assigned to this faculty

    // Constructors
    public Faculty() {}

    public Faculty(String id, String name, String department, String contactNumber, String email, String position, List<String> assignedSubjects) {
        this.id = id;
        this.name = name;
        this.department = department;
        this.contactNumber = contactNumber;
        this.email = email;
        this.position = position;
        this.assignedSubjects = assignedSubjects;
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

    public String getDepartment() {
        return department;
    }

    public void setDepartment(String department) {
        this.department = department;
    }

    public String getContactNumber() {
        return contactNumber;
    }

    public void setContactNumber(String contactNumber) {
        this.contactNumber = contactNumber;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public String getPosition() {
        return position;
    }

    public void setPosition(String position) {
        this.position = position;
    }

    public List<String> getAssignedSubjects() {
        return assignedSubjects;
    }

    public void setAssignedSubjects(List<String> assignedSubjects) {
        this.assignedSubjects = assignedSubjects;
    }
}