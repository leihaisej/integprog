package com.oasis.model;

public class AuthResponse {
    private String id;
    private String name;
    private String role;
    private String message;

    public AuthResponse(String id, String name, String role, String message) {
        this.id = id;
        this.name = name;
        this.role = role;
        this.message = message;
    }

    // Getters and setters
    public String getId() { return id; }
    public void setId(String id) { this.id = id; }
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public String getRole() { return role; }
    public void setRole(String role) { this.role = role; }
    public String getMessage() { return message; }
    public void setMessage(String message) { this.message = message; }
}