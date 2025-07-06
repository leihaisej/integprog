package com.oasis.model;

public class BulkSectionScheduleRequest {
    private String sectionId;
    private ScheduleItem scheduleDetails;

    public BulkSectionScheduleRequest() {}

    public String getSectionId() {
        return sectionId;
    }

    public void setSectionId(String sectionId) {
        this.sectionId = sectionId;
    }

    public ScheduleItem getScheduleDetails() {
        return scheduleDetails;
    }

    public void setScheduleDetails(ScheduleItem scheduleDetails) {
        this.scheduleDetails = scheduleDetails;
    }
} 