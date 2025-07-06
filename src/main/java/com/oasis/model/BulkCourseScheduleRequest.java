package com.oasis.model;

public class BulkCourseScheduleRequest {
    private String courseCode;
    private ScheduleItem scheduleDetails;

    public BulkCourseScheduleRequest() {}

    public String getCourseCode() {
        return courseCode;
    }

    public void setCourseCode(String courseCode) {
        this.courseCode = courseCode;
    }

    public ScheduleItem getScheduleDetails() {
        return scheduleDetails;
    }

    public void setScheduleDetails(ScheduleItem scheduleDetails) {
        this.scheduleDetails = scheduleDetails;
    }
} 