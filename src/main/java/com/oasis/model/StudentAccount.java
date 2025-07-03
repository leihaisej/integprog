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
@Table(name = "student_accounts")
public class StudentAccount {
    
    @Id
    @Column(name = "student_id", length = 20)
    private String studentId;
    
    @Column(name = "total_balance", nullable = false)
    private Double totalBalance;
    
    @ElementCollection
    @CollectionTable(name = "student_payments", 
                    joinColumns = @JoinColumn(name = "student_id"))
    @Column(name = "payment_info", length = 200)
    private List<String> payments;
    
    @Column(name = "remaining_balance", nullable = false)
    private Double remainingBalance;
    
    @Column(name = "academic_year", length = 20)
    private String academicYear;
    
    @Column(name = "semester", length = 20)
    private String semester;

    // Constructors
    public StudentAccount() {}

    public StudentAccount(String studentId, Double totalBalance, List<String> payments, Double remainingBalance, String academicYear, String semester) {
        this.studentId = studentId;
        this.totalBalance = totalBalance;
        this.payments = payments;
        this.remainingBalance = remainingBalance;
        this.academicYear = academicYear;
        this.semester = semester;
    }

    // Getters and Setters
    public String getStudentId() {
        return studentId;
    }

    public void setStudentId(String studentId) {
        this.studentId = studentId;
    }

    public Double getTotalBalance() {
        return totalBalance;
    }

    public void setTotalBalance(Double totalBalance) {
        this.totalBalance = totalBalance;
    }

    public List<String> getPayments() {
        return payments;
    }

    public void setPayments(List<String> payments) {
        this.payments = payments;
    }

    public Double getRemainingBalance() {
        return remainingBalance;
    }

    public void setRemainingBalance(Double remainingBalance) {
        this.remainingBalance = remainingBalance;
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
}