package com.oasis.model;

public class Payment {
    private double amount;
    private String date; // e.g., "2024-06-22"
    private String description; // e.g., "Tuition Fee - First Installment"

    public Payment(double amount, String date, String description) {
        this.amount = amount;
        this.date = date;
        this.description = description;
    }

    public Payment() {}

    // Getters and Setters
    public double getAmount() { return amount; }
    public void setAmount(double amount) { this.amount = amount; }
    public String getDate() { return date; }
    public void setDate(String date) { this.date = date; }
    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }
}