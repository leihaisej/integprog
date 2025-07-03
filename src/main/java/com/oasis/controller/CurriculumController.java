package com.oasis.controller;

import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.oasis.model.Curriculum;
import com.oasis.model.Subject;
import com.oasis.repository.CurriculumRepository;
import com.oasis.repository.SubjectRepository;

@RestController
@RequestMapping("/api/curriculum")
public class CurriculumController {
    private static final Logger logger = LoggerFactory.getLogger(CurriculumController.class);
    
    @Autowired
    private CurriculumRepository curriculumRepository;
    @Autowired
    private SubjectRepository subjectRepository;
    @Autowired
    private JdbcTemplate jdbcTemplate;

    @GetMapping
    public List<Curriculum> getAllCurricula() {
        return curriculumRepository.findAll();
    }

    @GetMapping("/by-course")
    public List<Curriculum> getCurriculaByCourse(@RequestParam String courseCode) {
        return curriculumRepository.findByCourseCodeIgnoreCase(courseCode);
    }

    @GetMapping("/by-course-year-sem")
    public List<Curriculum> getCurriculaByCourseYearSem(@RequestParam String courseCode, @RequestParam int yearLevel, @RequestParam String semester) {
        return curriculumRepository.findByCourseCodeIgnoreCaseAndYearLevelAndSemester(courseCode, yearLevel, semester);
    }

    @PostMapping
    public ResponseEntity<?> createCurriculum(@RequestBody Curriculum curriculum) {
        try {
            logger.info("Creating curriculum: {}", curriculum);
            
            // Validate required fields
            if (curriculum.getCourseCode() == null || curriculum.getCourseCode().trim().isEmpty()) {
                return ResponseEntity.badRequest().body("Course code is required");
            }
            if (curriculum.getYearLevel() <= 0) {
                return ResponseEntity.badRequest().body("Year level must be greater than 0");
            }
            if (curriculum.getSemester() == null || curriculum.getSemester().trim().isEmpty()) {
                return ResponseEntity.badRequest().body("Semester is required");
            }
            
            // Handle subject codes - convert List to string if needed
            if (curriculum.getSubjectCodes() == null || curriculum.getSubjectCodes().trim().isEmpty()) {
                return ResponseEntity.badRequest().body("At least one subject is required");
            }
            
            if (curriculum.getRequiredUnits() <= 0) {
                curriculum.setRequiredUnits(25);
            }
            
            Curriculum saved = curriculumRepository.save(curriculum);
            logger.info("Curriculum created successfully with ID: {}", saved.getId());
            return ResponseEntity.ok(saved);
        } catch (Exception e) {
            logger.error("Error creating curriculum: {}", e.getMessage(), e);
            return ResponseEntity.internalServerError().body("Failed to create curriculum: " + e.getMessage());
        }
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> updateCurriculum(@PathVariable Long id, @RequestBody Curriculum updated) {
        try {
            logger.info("Updating curriculum with ID: {}", id);
            
            Optional<Curriculum> opt = curriculumRepository.findById(id);
            if (opt.isPresent()) {
                Curriculum c = opt.get();
                c.setCourseCode(updated.getCourseCode());
                c.setYearLevel(updated.getYearLevel());
                c.setSemester(updated.getSemester());
                c.setSubjectCodes(updated.getSubjectCodes());
                c.setRequiredUnits(updated.getRequiredUnits() > 0 ? updated.getRequiredUnits() : 25);
                
                Curriculum saved = curriculumRepository.save(c);
                logger.info("Curriculum updated successfully");
                return ResponseEntity.ok(saved);
            } else {
                return ResponseEntity.notFound().build();
            }
        } catch (Exception e) {
            logger.error("Error updating curriculum: {}", e.getMessage(), e);
            return ResponseEntity.internalServerError().body("Failed to update curriculum: " + e.getMessage());
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteCurriculum(@PathVariable Long id) {
        try {
            // First, delete from curriculum_subjects
            jdbcTemplate.update("DELETE FROM curriculum_subjects WHERE curriculum_id = ?", id);
            // Then, delete from curricula
            curriculumRepository.deleteById(id);
            return ResponseEntity.ok().build();
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body("Failed to delete curriculum: " + e.getMessage());
        }
    }

    // Helper: Get subject details for a curriculum
    @GetMapping("/{id}/subjects")
    public List<Subject> getSubjectsForCurriculum(@PathVariable Long id) {
        Curriculum c = curriculumRepository.findById(id).orElseThrow();
        return c.getSubjectCodesList().stream()
            .map(code -> subjectRepository.findByCodeIgnoreCase(code).orElse(null))
            .filter(s -> s != null)
            .collect(Collectors.toList());
    }
} 