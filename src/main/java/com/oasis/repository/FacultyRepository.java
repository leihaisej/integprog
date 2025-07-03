package com.oasis.repository;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.oasis.model.Faculty;

@Repository
public interface FacultyRepository extends JpaRepository<Faculty, String> {
    
    Optional<Faculty> findByIdIgnoreCase(String id);
} 