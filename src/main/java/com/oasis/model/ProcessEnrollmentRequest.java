package com.oasis.model;

public class ProcessEnrollmentRequest {
    private String status; // "approved" or "rejected"
    private String remarks;
    private String requestId;

    // Getters and setters
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
    public String getRemarks() { return remarks; }
    public void setRemarks(String remarks) { this.remarks = remarks; }
    public String getRequestId() { return requestId; }
    public void setRequestId(String requestId) { this.requestId = requestId; }
}