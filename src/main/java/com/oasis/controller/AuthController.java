package com.oasis.controller;

import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.HashMap;
import java.util.Set;
import java.util.HashSet;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.oasis.model.AuthRequest;
import com.oasis.model.AuthResponse;
import com.oasis.model.BulkSectionScheduleRequest;
import com.oasis.model.BulkCourseScheduleRequest;
import com.oasis.model.Course;
import com.oasis.model.EnrollmentRequest;
import com.oasis.model.Faculty;
import com.oasis.model.PaymentRequest;
import com.oasis.model.ProcessEnrollmentRequest;
import com.oasis.model.ScheduleItem;
import com.oasis.model.Section;
import com.oasis.model.StudentAccount;
import com.oasis.model.StudentGrade;
import com.oasis.model.Subject;
import com.oasis.model.User;
import com.oasis.service.AuthService;
import com.oasis.service.GradeService;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final AuthService authService;
    private final GradeService gradeService;

    @Autowired
    public AuthController(AuthService authService, GradeService gradeService) {
        this.authService = authService;
        this.gradeService = gradeService;
    }

    @PostMapping("/login")
    public ResponseEntity<AuthResponse> login(@RequestBody AuthRequest authRequest) {
        AuthResponse response = authService.authenticate(authRequest.getUserId(), authRequest.getPassword());
        if (response.getId() != null) {
            return ResponseEntity.ok(response);
        }
        return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(response);
    }

    @PostMapping("/register")
    public ResponseEntity<AuthResponse> register(@RequestBody User newUser) {
        // Call authService.registerStudent with individual fields, and expect AuthResponse
        AuthResponse response = authService.registerStudent(
            newUser.getId(),
            newUser.getName(),
            null, // No birthday
            newUser.getPassword(),
            newUser.getCourse()
        );
        if (response.getId() != null) {
            return ResponseEntity.status(HttpStatus.CREATED).body(response);
        }
        return ResponseEntity.status(HttpStatus.CONFLICT).body(response);
    }

    @GetMapping("/me")
    public ResponseEntity<User> getCurrentUser(@RequestParam String userId) {
        return authService.getUserById(userId)
                .map(user -> {
                    user.setPassword(null); // For security, don't return password
                    return ResponseEntity.ok(user);
                })
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/enrollment/requests")
    public ResponseEntity<List<EnrollmentRequest>> getAllEnrollmentRequests() {
        List<EnrollmentRequest> requests = authService.getAllEnrollmentRequests();
        return ResponseEntity.ok(requests);
    }

    @PutMapping("/enrollment/requests/process")
    public ResponseEntity<String> processEnrollmentRequest(@RequestBody ProcessEnrollmentRequest req) {
        authService.processEnrollmentRequest(req.getRequestId(), req.getStatus(), req.getRemarks());
        return ResponseEntity.ok("Enrollment request processed successfully.");
    }

    @GetMapping("/users")
    public ResponseEntity<List<User>> getAllUsers() {
        List<User> users = authService.getAllUsers();
        users.forEach(u -> u.setPassword(null)); // Hide passwords
        return ResponseEntity.ok(users);
    }

    @GetMapping("/courses")
    public ResponseEntity<List<Course>> getAllCourses() {
        return ResponseEntity.ok(authService.getAllCourses());
    }

    @GetMapping("/sections")
    public ResponseEntity<List<Section>> getSections(@RequestParam(value = "courseCode", required = false) String courseCode) {
        if (courseCode != null && !courseCode.isEmpty()) {
            return ResponseEntity.ok(authService.getSectionsByCourseCode(courseCode));
        } else {
            return ResponseEntity.ok(authService.getAllSections());
        }
    }

    @GetMapping("/subjects")
    public ResponseEntity<List<Subject>> getAllSubjects() {
        return ResponseEntity.ok(authService.getAllSubjects());
    }

    @GetMapping("/subjects/by-course")
    public ResponseEntity<List<Subject>> getSubjectsByCourse(@RequestParam String courseCode) {
        return ResponseEntity.ok(authService.getSubjectsByCourse(courseCode));
    }

    @GetMapping("/faculty")
    public ResponseEntity<List<Faculty>> getAllFaculty() {
        return ResponseEntity.ok(authService.getAllFaculty());
    }

    // Schedule Management Endpoints
    @GetMapping("/schedules")
    public ResponseEntity<List<ScheduleItem>> getAllSchedules() {
        return ResponseEntity.ok(authService.getAllSchedules());
    }

    @GetMapping("/schedules/{studentId}")
    public ResponseEntity<List<ScheduleItem>> getStudentSchedules(
            @PathVariable String studentId,
            @RequestParam(required = false) String academicYear,
            @RequestParam(required = false) String semester) {
        return ResponseEntity.ok(authService.getStudentSchedules(studentId, academicYear, semester));
    }

    @PostMapping("/schedules")
    public ResponseEntity<String> createSchedule(@RequestBody ScheduleItem scheduleItem) {
        authService.addScheduleItem(scheduleItem);
        return ResponseEntity.status(HttpStatus.CREATED).body("Schedule item created successfully.");
    }

    @PutMapping("/schedules/{id}")
    public ResponseEntity<String> updateSchedule(@PathVariable Long id, @RequestBody ScheduleItem scheduleItem) {
        authService.updateScheduleItem(id, scheduleItem);
        return ResponseEntity.ok("Schedule item updated successfully.");
    }

    @DeleteMapping("/schedules/{id}")
    public ResponseEntity<String> deleteSchedule(@PathVariable Long id) {
        authService.deleteScheduleItem(id);
        return ResponseEntity.ok("Schedule item deleted successfully.");
    }

    @PostMapping("/schedules/bulk")
    public ResponseEntity<String> createBulkSchedules(@RequestBody List<ScheduleItem> scheduleItems) {
        authService.addBulkScheduleItems(scheduleItems);
        return ResponseEntity.status(HttpStatus.CREATED).body("Schedule items created successfully.");
    }

    @PostMapping("/schedules/section-bulk")
    public ResponseEntity<String> createBulkSchedulesBySection(@RequestBody BulkSectionScheduleRequest request) {
        int created = authService.addBulkScheduleItemsBySection(request.getSectionId(), request.getScheduleDetails());
        return ResponseEntity.status(HttpStatus.CREATED).body("Created schedule for " + created + " students in section " + request.getSectionId());
    }

    @PostMapping("/schedules/course-bulk")
    public ResponseEntity<String> createBulkSchedulesByCourse(@RequestBody BulkCourseScheduleRequest request) {
        int created = authService.addBulkScheduleItemsByCourse(request.getCourseCode(), request.getScheduleDetails());
        return ResponseEntity.status(HttpStatus.CREATED).body("Created schedule for " + created + " students in course " + request.getCourseCode());
    }

    @PostMapping("/subjects")
    public ResponseEntity<String> createSubject(@RequestBody Subject subject) {
        authService.addSubject(subject);
        return ResponseEntity.status(HttpStatus.CREATED).body("Subject created successfully.");
    }

    @PutMapping("/subjects/{code}")
    public ResponseEntity<String> updateSubject(@PathVariable String code, @RequestBody Subject subject) {
        authService.updateSubject(code, subject);
        return ResponseEntity.ok("Subject updated successfully.");
    }

    @DeleteMapping("/subjects/{code}")
    public ResponseEntity<String> deleteSubject(@PathVariable String code) {
        authService.deleteSubject(code);
        return ResponseEntity.ok("Subject deleted successfully.");
    }

    @PostMapping("/courses")
    public ResponseEntity<String> createCourse(@RequestBody Course course) {
        authService.addCourse(course);
        return ResponseEntity.status(HttpStatus.CREATED).body("Course created successfully.");
    }

    @PutMapping("/courses/{code}")
    public ResponseEntity<String> updateCourse(@PathVariable String code, @RequestBody Course course) {
        authService.updateCourse(code, course);
        return ResponseEntity.ok("Course updated successfully.");
    }

    @DeleteMapping("/courses/{code}")
    public ResponseEntity<String> deleteCourse(@PathVariable String code) {
        authService.deleteCourse(code);
        return ResponseEntity.ok("Course deleted successfully.");
    }

    @PostMapping("/sections")
    public ResponseEntity<String> createSection(@RequestBody Section section) {
        authService.addSection(section);
        return ResponseEntity.status(HttpStatus.CREATED).body("Section created successfully.");
    }

    @PutMapping("/sections/{code}")
    public ResponseEntity<String> updateSection(@PathVariable String code, @RequestBody Section section) {
        authService.updateSection(code, section);
        return ResponseEntity.ok("Section updated successfully.");
    }

    @DeleteMapping("/sections/{code}")
    public ResponseEntity<String> deleteSection(@PathVariable String code) {
        authService.deleteSection(code);
        return ResponseEntity.ok("Section deleted successfully.");
    }

    @PostMapping("/faculty")
    public ResponseEntity<String> createFaculty(@RequestBody Faculty faculty) {
        authService.addFaculty(faculty);
        return ResponseEntity.status(HttpStatus.CREATED).body("Faculty created successfully.");
    }

    @PutMapping("/faculty/{id}")
    public ResponseEntity<String> updateFaculty(@PathVariable String id, @RequestBody Faculty faculty) {
        authService.updateFaculty(id, faculty);
        return ResponseEntity.ok("Faculty updated successfully.");
    }

    @DeleteMapping("/faculty/{id}")
    public ResponseEntity<String> deleteFaculty(@PathVariable String id) {
        authService.deleteFaculty(id);
        return ResponseEntity.ok("Faculty deleted successfully.");
    }

    @PutMapping("/users/{id}")
    public ResponseEntity<String> updateUser(@PathVariable String id, @RequestBody User user) {
        authService.updateUser(id, user);
        return ResponseEntity.ok("User updated successfully.");
    }

    @DeleteMapping("/users/{id}")
    public ResponseEntity<String> deleteUser(@PathVariable String id) {
        try {
            System.out.println("DELETE /api/auth/users/" + id + " - Request received");
            Optional<User> userOpt = authService.getUserById(id);
            if (!userOpt.isPresent()) {
                System.out.println("[WARN] User not found: " + id + ". Returning 200 OK for idempotency.");
                return ResponseEntity.ok("User not found, but treated as deleted.");
            }
            System.out.println("User found, proceeding with deletion: " + id);
            authService.deleteUser(id);
            System.out.println("User deleted successfully: " + id);
            return ResponseEntity.ok("User deleted successfully.");
        } catch (Exception e) {
            System.err.println("Error deleting user " + id + ": " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body("Failed to delete user: " + e.getMessage());
        }
    }

    @GetMapping("/accounts")
    public ResponseEntity<List<StudentAccount>> getAllStudentAccounts() {
        return ResponseEntity.ok(authService.getAllStudentAccounts());
    }

    @GetMapping("/account/{studentId}")
    public ResponseEntity<StudentAccount> getStudentAccount(@PathVariable String studentId) {
        return authService.getStudentAccountDetails(studentId)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping("/account/payment")
    public ResponseEntity<String> processStudentPayment(@RequestBody PaymentRequest paymentRequest) {
        boolean success = authService.processStudentPayment(
            paymentRequest.getStudentId(), 
            paymentRequest.getAmount(), 
            paymentRequest.getDate(), 
            paymentRequest.getDescription()
        );
        if (success) {
            return ResponseEntity.ok("Payment processed successfully.");
        } else {
            return ResponseEntity.badRequest().body("Failed to process payment.");
        }
    }

    @GetMapping("/enrollments/section/{sectionId}")
    public ResponseEntity<List<User>> getStudentsBySection(@PathVariable String sectionId) {
        List<User> students = authService.getAllUsers().stream()
            .filter(u -> "student".equalsIgnoreCase(u.getRole()) && sectionId.equalsIgnoreCase(u.getSection()))
            .toList();
        return ResponseEntity.ok(students);
    }

    // ADMIN: Batch update all students to use course codes in their course field
    @PostMapping("/admin/update-student-courses-to-code")
    public ResponseEntity<String> updateAllStudentCoursesToCode() {
        int updated = authService.batchUpdateStudentCoursesToCode();
        return ResponseEntity.ok("Updated " + updated + " students to use course codes.");
    }

    // Get all grades for a section/subject/term
    @GetMapping("/grades/section")
    public ResponseEntity<List<StudentGrade>> getGradesForSection(
        @RequestParam String sectionId,
        @RequestParam String subjectCode,
        @RequestParam String academicYear,
        @RequestParam String semester
    ) {
        List<StudentGrade> grades = gradeService.getGradesForSection(sectionId, subjectCode, academicYear, semester);
        return ResponseEntity.ok(grades);
    }

    // Batch encode grades for a section/subject/term
    @PostMapping("/grades/batch-encode")
    public ResponseEntity<String> batchEncodeGrades(@RequestBody Map<String, Object> payload) {
        System.out.println("Payload: " + payload);
        String sectionId = (String) payload.get("sectionId");
        String subjectCode = (String) payload.get("subjectCode");
        String academicYear = (String) payload.get("academicYear");
        String semester = (String) payload.get("semester");
        Object gradesObj = payload.get("grades");
        System.out.println("Grades object: " + gradesObj);
        List<Map<String, Object>> grades;
        try {
            ObjectMapper mapper = new ObjectMapper();
            String json = mapper.writeValueAsString(gradesObj);
            grades = mapper.readValue(json, new TypeReference<List<Map<String, Object>>>(){});
        } catch (Exception e) {
            System.out.println("Error parsing grades: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.status(500).body("Error parsing grades payload: " + e.getMessage());
        }
        int saved = gradeService.batchEncodeGrades(sectionId, subjectCode, academicYear, semester, grades);
        return ResponseEntity.ok("Saved " + saved + " grades.");
    }

    // Batch release all grades for a section/subject/term
    @PostMapping("/grades/release-all")
    public ResponseEntity<String> releaseAllGrades(@RequestBody Map<String, String> params) {
        String sectionId = params.get("sectionId");
        String subjectCode = params.get("subjectCode");
        String academicYear = params.get("academicYear");
        String semester = params.get("semester");
        int released = gradeService.releaseAllGrades(sectionId, subjectCode, academicYear, semester);
        return ResponseEntity.ok("Released " + released + " grades.");
    }

    // Batch unrelease all grades for a section/subject/term
    @PostMapping("/grades/unrelease-all")
    public ResponseEntity<String> unreleaseAllGrades(@RequestBody Map<String, String> params) {
        String sectionId = params.get("sectionId");
        String subjectCode = params.get("subjectCode");
        String academicYear = params.get("academicYear");
        String semester = params.get("semester");
        int unreleased = gradeService.unreleaseAllGrades(sectionId, subjectCode, academicYear, semester);
        return ResponseEntity.ok("Unreleased " + unreleased + " grades.");
    }

    // Get grade statistics for a section/subject/term
    @GetMapping("/grades/statistics")
    public ResponseEntity<Map<String, Object>> getGradeStatistics(
        @RequestParam String sectionId,
        @RequestParam String subjectCode,
        @RequestParam String academicYear,
        @RequestParam String semester
    ) {
        Map<String, Object> stats = gradeService.getGradeStatistics(sectionId, subjectCode, academicYear, semester);
        return ResponseEntity.ok(stats);
    }

    // Validate grade input
    @PostMapping("/grades/validate")
    public ResponseEntity<Map<String, Object>> validateGrade(@RequestBody Map<String, String> request) {
        String grade = request.get("grade");
        boolean isValid = gradeService.isValidGrade(grade);
        
        Map<String, Object> response = new HashMap<>();
        response.put("isValid", isValid);
        
        if (isValid && grade != null) {
            // Try to convert and provide feedback
            try {
                double numericGrade = Double.parseDouble(grade);
                if (numericGrade >= 1.0 && numericGrade <= 5.0) {
                    String letterGrade = gradeService.convertNumericToLetter(numericGrade);
                    response.put("letterGrade", letterGrade);
                    response.put("numericGrade", numericGrade);
                } else if (numericGrade >= 0 && numericGrade <= 100) {
                    // Convert percentage to 5.0 scale
                    double convertedGrade = 5.0 - (numericGrade / 20.0);
                    String letterGrade = gradeService.convertNumericToLetter(convertedGrade);
                    response.put("letterGrade", letterGrade);
                    response.put("numericGrade", convertedGrade);
                    response.put("originalPercentage", numericGrade);
                }
            } catch (NumberFormatException e) {
                // It's a letter grade
                Double numericGrade = gradeService.convertLetterToNumeric(grade);
                response.put("letterGrade", grade.toUpperCase());
                response.put("numericGrade", numericGrade);
            }
        }
        
        return ResponseEntity.ok(response);
    }

    // Get all unique subjects and terms for a section (for dropdown filtering)
    @GetMapping("/grades/section/subjects-terms")
    public ResponseEntity<Map<String, Object>> getSubjectsAndTermsForSection(@RequestParam String sectionId) {
        List<StudentGrade> grades = gradeService.getAllGradesForSection(sectionId);
        Set<Map<String, Object>> subjects = new HashSet<>();
        Set<String> terms = new HashSet<>();
        for (StudentGrade g : grades) {
            Map<String, Object> subj = new HashMap<>();
            subj.put("code", g.getSubjectCode());
            subj.put("name", g.getSubjectName());
            subjects.add(subj);
            terms.add(g.getAcademicYear() + "||" + g.getSemester());
        }
        Map<String, Object> result = new HashMap<>();
        result.put("subjects", subjects);
        result.put("terms", terms);
        return ResponseEntity.ok(result);
    }

    // Get all schedules for a section
    @GetMapping("/schedules/section/{sectionId}")
    public ResponseEntity<List<ScheduleItem>> getSchedulesForSection(@PathVariable String sectionId) {
        List<ScheduleItem> schedules = authService.getSchedulesForSection(sectionId);
        return ResponseEntity.ok(schedules);
    }
}
