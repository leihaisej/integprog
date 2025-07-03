package com.oasis.controller;

import java.util.Collections;
import java.util.List;
import java.util.Map;
import java.util.Optional;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.oasis.model.EnrollmentRequest;
import com.oasis.model.Message;
import com.oasis.model.ScheduleItem;
import com.oasis.model.StudentAccount;
import com.oasis.model.StudentEnrollment;
import com.oasis.model.StudentForm;
import com.oasis.model.StudentGrade;
import com.oasis.model.Subject;
import com.oasis.repository.MessageRepository;
import com.oasis.repository.ScheduleItemRepository;
import com.oasis.repository.SubjectRepository;
import com.oasis.service.GradeService;
import com.oasis.service.StudentService;

@RestController
@RequestMapping("/api/student")
public class StudentController {

    private final StudentService studentService;
    private final GradeService gradeService;
    private final SubjectRepository subjectRepository;
    private final ScheduleItemRepository scheduleItemRepository;
    private final MessageRepository messageRepository;

    public StudentController(StudentService studentService, GradeService gradeService, SubjectRepository subjectRepository, 
                           ScheduleItemRepository scheduleItemRepository, MessageRepository messageRepository) {
        this.studentService = studentService;
        this.gradeService = gradeService;
        this.subjectRepository = subjectRepository;
        this.scheduleItemRepository = scheduleItemRepository;
        this.messageRepository = messageRepository;
    }

    // Endpoint for getting student enrollment details
    @GetMapping("/enrollment/{studentId}")
    public ResponseEntity<StudentEnrollment> getEnrollmentDetails(@PathVariable String studentId) {
        return studentService.getStudentEnrollmentDetails(studentId)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    // Endpoint for submitting enrollment request
    @PostMapping("/enrollment/submit")
    public ResponseEntity<String> submitEnrollment(@RequestBody EnrollmentRequest request) {
        studentService.submitEnrollmentRequest(request);
        return ResponseEntity.ok("Enrollment request submitted.");
    }

    // Endpoint for getting student account details
    @GetMapping("/account/{studentId}")
    public ResponseEntity<StudentAccount> getAccountDetails(@PathVariable String studentId) {
        return studentService.getStudentAccountDetails(studentId)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    // Updated endpoint for getting student schedule
    @GetMapping("/schedule/{studentId}")
    public ResponseEntity<List<ScheduleItem>> getSchedule(
            @PathVariable String studentId,
            @RequestParam(required = false) String academicYear,
            @RequestParam(required = false) String semester) {
        
        List<ScheduleItem> scheduleItems;
        if (academicYear != null && semester != null) {
            scheduleItems = scheduleItemRepository.findByStudentIdIgnoreCaseAndAcademicYearAndSemester(
                studentId, academicYear, semester);
        } else {
            scheduleItems = scheduleItemRepository.findByStudentIdIgnoreCase(studentId);
        }
        
        return ResponseEntity.ok(scheduleItems);
    }

    // Endpoint for getting all subjects for grade encoding (admin use)
    @GetMapping("/subjects-for-grades")
    public ResponseEntity<List<Subject>> getAllSubjectsForGrades() {
        List<Subject> subjects = subjectRepository.findAll();
        return ResponseEntity.ok(subjects);
    }

    // Endpoint for getting student grades
    @GetMapping("/grades/{studentId}")
    public ResponseEntity<List<StudentGrade>> getGrades(@PathVariable String studentId) {
        List<StudentGrade> grades = studentService.getStudentGrades(studentId).orElse(Collections.emptyList());
        return ResponseEntity.ok(grades);
    }

    // Endpoint for getting student inbox messages
    @GetMapping("/inbox/{studentId}")
    public ResponseEntity<List<Message>> getInbox(@PathVariable String studentId) {
        List<Message> messages = studentService.getStudentInbox(studentId).orElse(Collections.emptyList());
        return ResponseEntity.ok(messages);
    }

    // Endpoint for getting student forms
    @GetMapping("/forms/{studentId}")
    public ResponseEntity<List<StudentForm>> getForms(@PathVariable String studentId) {
        List<StudentForm> forms = studentService.getStudentForms(studentId).orElse(Collections.emptyList());
        return ResponseEntity.ok(forms);
    }

    // Example of a PUT endpoint to update student account
    @PutMapping("/account")
    public ResponseEntity<String> updateAccount(@RequestBody StudentAccount studentAccount) {
        studentService.updateStudentAccount(studentAccount);
        return ResponseEntity.ok("Student account updated successfully.");
    }

    // Updated endpoint to update student schedule
    @PutMapping("/schedule/{studentId}")
    public ResponseEntity<String> updateSchedule(@PathVariable String studentId, @RequestBody List<ScheduleItem> scheduleItems) {
        // Delete existing schedule items for this student and term
        if (!scheduleItems.isEmpty()) {
            String academicYear = scheduleItems.get(0).getAcademicYear();
            String semester = scheduleItems.get(0).getSemester();
            scheduleItemRepository.deleteByStudentIdIgnoreCaseAndAcademicYearAndSemester(studentId, academicYear, semester);
        }
        
        // Save new schedule items
        scheduleItemRepository.saveAll(scheduleItems);
        return ResponseEntity.ok("Student schedule updated successfully.");
    }

    // Example of a PUT endpoint to update student grade
    @PutMapping("/grade/{studentId}")
    public ResponseEntity<String> updateGrade(@PathVariable String studentId, @RequestBody StudentGrade studentGrade) {
        studentService.updateStudentGrade(studentId, studentGrade);
        return ResponseEntity.ok("Student grade updated successfully.");
    }

    // Endpoint for getting all enrollment requests for a student
    @GetMapping("/enrollment/requests/{studentId}")
    public ResponseEntity<List<EnrollmentRequest>> getEnrollmentRequests(@PathVariable String studentId) {
        List<EnrollmentRequest> requests = studentService.getEnrollmentRequestsByStudentId(studentId);
        return ResponseEntity.ok(requests);
    }

    // Endpoint for encoding grades (admin use)
    @PostMapping("/grade/encode")
    public ResponseEntity<String> encodeGrade(@RequestBody StudentGrade grade) {
        studentService.encodeGrade(grade);
        return ResponseEntity.ok("Grade encoded successfully.");
    }
    
    // Enhanced endpoint for encoding grades with automatic GPA computation
    @PostMapping("/grade/encode-enhanced")
    public ResponseEntity<StudentGrade> encodeGradeEnhanced(@RequestBody StudentGrade grade) {
        System.out.println("=== DEBUG: Encoding grade ===");
        System.out.println("Student ID: " + grade.getStudentId());
        System.out.println("Subject Code: " + grade.getSubjectCode());
        System.out.println("Grade: " + grade.getGrade());
        System.out.println("Numeric Grade: " + grade.getNumericGrade());
        System.out.println("Is Released: " + grade.getIsReleased());
        
        StudentGrade savedGrade = gradeService.saveGrade(grade);
        
        System.out.println("Grade saved with ID: " + savedGrade.getId());
        System.out.println("Is Released: " + savedGrade.getIsReleased());
        System.out.println("=== END DEBUG ===");
        
        return ResponseEntity.ok(savedGrade);
    }
    
    // Endpoint for releasing a grade to make it visible to student
    @PostMapping("/grade/release/{gradeId}")
    public ResponseEntity<StudentGrade> releaseGrade(@PathVariable Long gradeId) {
        try {
            System.out.println("=== DEBUG: Releasing grade ===");
            System.out.println("Grade ID: " + gradeId);
            
            StudentGrade releasedGrade = gradeService.releaseGrade(gradeId);
            
            System.out.println("Grade released successfully:");
            System.out.println("- Student ID: " + releasedGrade.getStudentId());
            System.out.println("- Subject: " + releasedGrade.getSubjectCode());
            System.out.println("- Grade: " + releasedGrade.getGrade());
            System.out.println("- Is Released: " + releasedGrade.getIsReleased());
            System.out.println("=== END DEBUG ===");
            
            return ResponseEntity.ok(releasedGrade);
        } catch (RuntimeException e) {
            System.out.println("ERROR releasing grade: " + e.getMessage());
            return ResponseEntity.notFound().build();
        }
    }
    
    // Endpoint for getting grades for a specific term (admin view - shows all grades)
    @GetMapping("/grades/{studentId}/term")
    public ResponseEntity<List<StudentGrade>> getGradesForTerm(
            @PathVariable String studentId,
            @RequestParam(name = "semester", required = true) String semester,
            @RequestParam(name = "academicYear", required = true) String academicYear) {
        System.out.println("[DEBUG] getGradesForTerm: studentId=" + studentId + ", semester=" + semester + ", academicYear=" + academicYear);
        if (semester == null || academicYear == null || semester.isEmpty() || academicYear.isEmpty()) {
            System.out.println("[ERROR] Missing required parameters");
            return ResponseEntity.badRequest().build();
        }
        List<StudentGrade> grades = gradeService.getGradesForStudent(studentId, semester, academicYear);
        return ResponseEntity.ok(grades);
    }
    
    // Endpoint for getting released grades for a specific term (student view)
    @GetMapping("/grades/{studentId}/released")
    public ResponseEntity<List<StudentGrade>> getReleasedGradesForTerm(
            @PathVariable String studentId,
            @RequestParam String semester,
            @RequestParam String academicYear) {
        
        System.out.println("=== DEBUG: Getting released grades ===");
        System.out.println("Student ID: " + studentId);
        System.out.println("Semester: " + semester);
        System.out.println("Academic Year: " + academicYear);
        
        List<StudentGrade> grades = gradeService.getReleasedGradesForStudent(studentId, semester, academicYear);
        
        System.out.println("Found " + grades.size() + " released grades");
        for (StudentGrade grade : grades) {
            System.out.println("- " + grade.getSubjectCode() + ": " + grade.getGrade() + " (Released: " + grade.getIsReleased() + ")");
        }
        System.out.println("=== END DEBUG ===");
        
        return ResponseEntity.ok(grades);
    }
    
    // Endpoint for calculating term GPA
    @GetMapping("/grades/{studentId}/term-gpa")
    public ResponseEntity<Map<String, Object>> getTermGPA(
            @PathVariable String studentId,
            @RequestParam String semester,
            @RequestParam String academicYear) {
        Double termGPA = gradeService.calculateTermGPA(studentId, semester, academicYear);
        Map<String, Object> response = Map.of(
            "studentId", studentId,
            "semester", semester,
            "academicYear", academicYear,
            "termGPA", termGPA
        );
        return ResponseEntity.ok(response);
    }
    
    // Endpoint for calculating cumulative GPA
    @GetMapping("/grades/{studentId}/cumulative-gpa")
    public ResponseEntity<Map<String, Object>> getCumulativeGPA(@PathVariable String studentId) {
        Double cumulativeGPA = gradeService.calculateCumulativeGPA(studentId);
        Map<String, Object> response = Map.of(
            "studentId", studentId,
            "cumulativeGPA", cumulativeGPA
        );
        return ResponseEntity.ok(response);
    }

    @PutMapping("/inbox/read/{messageId}")
    public ResponseEntity<String> markMessageAsRead(@PathVariable Long messageId) {
        Optional<Message> msgOpt = messageRepository.findById(messageId);
        if (msgOpt.isPresent()) {
            Message msg = msgOpt.get();
            msg.setIsRead(true);
            messageRepository.save(msg);
            return ResponseEntity.ok("Message marked as read.");
        }
        return ResponseEntity.notFound().build();
    }

    // Endpoint for undoing release of a grade (make it hidden from student)
    @PostMapping("/grade/unrelease/{gradeId}")
    public ResponseEntity<StudentGrade> unreleaseGrade(@PathVariable Long gradeId) {
        try {
            System.out.println("=== DEBUG: Undoing release of grade ===");
            System.out.println("Grade ID: " + gradeId);
            StudentGrade unreleasedGrade = gradeService.unreleaseGrade(gradeId);
            System.out.println("Grade release undone successfully:");
            System.out.println("- Student ID: " + unreleasedGrade.getStudentId());
            System.out.println("- Subject: " + unreleasedGrade.getSubjectCode());
            System.out.println("- Grade: " + unreleasedGrade.getGrade());
            System.out.println("- Is Released: " + unreleasedGrade.getIsReleased());
            System.out.println("=== END DEBUG ===");
            return ResponseEntity.ok(unreleasedGrade);
        } catch (RuntimeException e) {
            System.out.println("ERROR undoing release: " + e.getMessage());
            return ResponseEntity.notFound().build();
        }
    }
}