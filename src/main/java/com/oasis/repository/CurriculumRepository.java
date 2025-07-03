package com.oasis.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.oasis.model.Curriculum;

@Repository
public interface CurriculumRepository extends JpaRepository<Curriculum, Long> {
    List<Curriculum> findByCourseCodeIgnoreCaseAndYearLevelAndSemester(String courseCode, int yearLevel, String semester);
    List<Curriculum> findByCourseCodeIgnoreCase(String courseCode);
} 