package com.oasis.repository;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.oasis.model.Course;

@Repository
public interface CourseRepository extends JpaRepository<Course, String> {
    
    Optional<Course> findByCodeIgnoreCase(String code);
} 