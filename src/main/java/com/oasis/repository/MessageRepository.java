package com.oasis.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.oasis.model.Message;

@Repository
public interface MessageRepository extends JpaRepository<Message, Long> {
    
    List<Message> findByStudentIdIgnoreCaseOrderByTimestampDesc(String studentId);
    
    List<Message> findByStudentIdIgnoreCaseAndIsReadOrderByTimestampDesc(String studentId, Boolean isRead);
    
    void deleteByStudentIdIgnoreCase(String studentId);
} 