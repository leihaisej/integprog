package com.oasis.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.oasis.model.Section;

@Repository
public interface SectionRepository extends JpaRepository<Section, String> {
    
    Optional<Section> findByIdIgnoreCase(String id);
    
    List<Section> findByFacultyIdIgnoreCase(String facultyId);
    
    Optional<Section> findByCourseCodeIgnoreCase(String courseCode);
    
    List<Section> findAllByCourseCodeIgnoreCase(String courseCode);
} 