package com.oasis.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.oasis.model.Subject;

@Repository
public interface SubjectRepository extends JpaRepository<Subject, String> {
    
    Optional<Subject> findByCodeIgnoreCase(String code);
    
    List<Subject> findByCourseCodeIgnoreCase(String courseCode);
} 