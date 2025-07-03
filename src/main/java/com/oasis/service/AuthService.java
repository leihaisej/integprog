package com.oasis.service;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.oasis.model.AuthResponse;
import com.oasis.model.Course;
import com.oasis.model.EnrollmentRequest;
import com.oasis.model.Faculty;
import com.oasis.model.Message;
import com.oasis.model.ScheduleItem;
import com.oasis.model.Section;
import com.oasis.model.StudentAccount;
import com.oasis.model.StudentEnrollment;
import com.oasis.model.StudentForm;
import com.oasis.model.StudentGrade;
import com.oasis.model.StudentSchedule;
import com.oasis.model.Subject;
import com.oasis.model.User;
import com.oasis.repository.CourseRepository;
import com.oasis.repository.EnrollmentRequestRepository;
import com.oasis.repository.FacultyRepository;
import com.oasis.repository.MessageRepository;
import com.oasis.repository.ScheduleItemRepository;
import com.oasis.repository.SectionRepository;
import com.oasis.repository.StudentAccountRepository;
import com.oasis.repository.StudentEnrollmentRepository;
import com.oasis.repository.StudentFormRepository;
import com.oasis.repository.StudentGradeRepository;
import com.oasis.repository.StudentScheduleRepository;
import com.oasis.repository.SubjectRepository;
import com.oasis.repository.UserRepository;

@Service
public class AuthService {

    @Autowired
    private UserRepository userRepository;
    
    @Autowired
    private CourseRepository courseRepository;
    
    @Autowired
    private FacultyRepository facultyRepository;
    
    @Autowired
    private SubjectRepository subjectRepository;
    
    @Autowired
    private SectionRepository sectionRepository;
    
    @Autowired
    private EnrollmentRequestRepository enrollmentRequestRepository;
    
    @Autowired
    private StudentEnrollmentRepository studentEnrollmentRepository;
    
    @Autowired
    private StudentScheduleRepository studentScheduleRepository;
    
    @Autowired
    private StudentGradeRepository studentGradeRepository;
    
    @Autowired
    private StudentAccountRepository studentAccountRepository;
    
    @Autowired
    private MessageRepository messageRepository;
    
    @Autowired
    private StudentFormRepository studentFormRepository;
    
    @Autowired
    private ScheduleItemRepository scheduleItemRepository;

    // MODIFIED: Return AuthResponse
    public AuthResponse authenticate(String userId, String password) {
        Optional<User> userOptional = userRepository.findByIdIgnoreCaseAndPassword(userId, password);
        if (userOptional.isPresent()) {
            User user = userOptional.get();
            return new AuthResponse(user.getId(), user.getName(), user.getRole(), "Login successful");
        } else {
            return new AuthResponse(null, null, null, "Invalid credentials");
        }
    }

    // MODIFIED: Return AuthResponse, takes individual fields
    public AuthResponse registerStudent(String studentId, String name, String birthday, String password, String course) {
        // Generate new ID if not provided or empty
        if (studentId == null || studentId.trim().isEmpty()) {
            // Find the highest existing student number and increment
            int maxNum = userRepository.findAll().stream()
                .filter(u -> u.getId() != null && u.getId().matches("2025-\\d{5}-OA-0"))
                .mapToInt(u -> Integer.parseInt(u.getId().substring(5, 10)))
                .max().orElse(0);
            int nextNum = maxNum + 1;
            String padded = String.format("%05d", nextNum);
            studentId = "2025-" + padded + "-OA-0";
        }
        // Always use course code
        String courseCode = course;
        List<Course> allCourses = courseRepository.findAll();
        // If course is not a code, try to match by name
        if (allCourses.stream().noneMatch(c -> c.getCode().equalsIgnoreCase(course))) {
            Course match = allCourses.stream().filter(c -> c.getName().equalsIgnoreCase(course)).findFirst().orElse(null);
            if (match != null) courseCode = match.getCode();
        }
        if (userRepository.findByIdIgnoreCase(studentId).isEmpty()) {
            User newStudent = new User(studentId, name, password, "student", courseCode, null);
            newStudent.setStatus("New Applicant");
            newStudent.setAdmissionStatus("New");
            newStudent.setScholasticStatus("Pending");
            newStudent.setPreferredCourseCode(courseCode);
            userRepository.save(newStudent);
            // Initialize student-specific data
            studentAccountRepository.save(new StudentAccount(studentId, 0.0, new ArrayList<>(), 0.0, "", ""));
            messageRepository.save(new Message(studentId, "System", "Welcome!", "Your account has been created.", LocalDateTime.now().toString(), false));
            studentFormRepository.save(new StudentForm(studentId, "Enrollment Form", LocalDate.now().toString(), "pending", "Processing"));
            return new AuthResponse(newStudent.getId(), newStudent.getName(), newStudent.getRole(), "Registration successful. Your Student ID is: " + newStudent.getId());
        }
        return new AuthResponse(null, null, null, "User ID already exists");
    }

    // RENAMED from getUserDetails to getUserById to match AuthController's call
    public Optional<User> getUserById(String userId) {
        return userRepository.findByIdIgnoreCase(userId);
    }

    public List<User> getAllUsers() {
        return userRepository.findAll();
    }

    public List<User> getStudents() {
        return userRepository.findAll().stream()
                .filter(user -> "student".equals(user.getRole()))
                .collect(Collectors.toList());
    }

    public List<User> getAdmins() {
        return userRepository.findAll().stream()
                .filter(user -> "admin".equals(user.getRole()))
                .collect(Collectors.toList());
    }

    // --- Course Management ---
    public List<Course> getAllCourses() {
        return courseRepository.findAll();
    }

    // --- Subject Management ---
    public List<Subject> getAllSubjects() {
        return subjectRepository.findAll();
    }

    // --- Faculty Management ---
    public List<Faculty> getAllFaculty() {
        return facultyRepository.findAll();
    }

    // --- Section Management ---
    public List<Section> getAllSections() {
        return sectionRepository.findAll();
    }

    // --- Schedule Management ---
    public List<ScheduleItem> getAllSchedules() {
        return scheduleItemRepository.findAll();
    }

    public List<ScheduleItem> getStudentSchedules(String studentId, String academicYear, String semester) {
        if (academicYear != null && semester != null) {
            return scheduleItemRepository.findByStudentIdIgnoreCaseAndAcademicYearAndSemester(studentId, academicYear, semester);
        } else {
            return scheduleItemRepository.findByStudentIdIgnoreCase(studentId);
        }
    }

    public void addScheduleItem(ScheduleItem scheduleItem) {
        // Validation: Prevent overlapping schedules for the same student (same day, room, academic year, semester)
        List<ScheduleItem> studentSchedules = scheduleItemRepository.findByStudentIdIgnoreCaseAndAcademicYearAndSemester(
            scheduleItem.getStudentId(), scheduleItem.getAcademicYear(), scheduleItem.getSemester());
        for (ScheduleItem existing : studentSchedules) {
            if (existing.getDayTime().equalsIgnoreCase(scheduleItem.getDayTime()) &&
                existing.getRoom().equalsIgnoreCase(scheduleItem.getRoom())) {
                throw new IllegalArgumentException("Schedule conflict: Student already has a class in this room at this day/time.");
            }
        }
        // Validation: Prevent double-booking faculty (same day, academic year, semester)
        if (scheduleItem.getFaculty() != null && !scheduleItem.getFaculty().isEmpty()) {
            List<ScheduleItem> facultySchedules = scheduleItemRepository.findAll().stream()
                .filter(s -> scheduleItem.getFaculty().equalsIgnoreCase(s.getFaculty()) &&
                            scheduleItem.getAcademicYear().equalsIgnoreCase(s.getAcademicYear()) &&
                            scheduleItem.getSemester().equalsIgnoreCase(s.getSemester()) &&
                            scheduleItem.getDayTime().equalsIgnoreCase(s.getDayTime()))
                .toList();
            if (!facultySchedules.isEmpty()) {
                throw new IllegalArgumentException("Schedule conflict: Faculty is already assigned to another class at this day/time.");
            }
        }
        scheduleItemRepository.save(scheduleItem);
    }

    public void addBulkScheduleItems(List<ScheduleItem> scheduleItems) {
        scheduleItemRepository.saveAll(scheduleItems);
    }

    public void updateScheduleItem(Long id, ScheduleItem scheduleItem) {
        scheduleItemRepository.findById(id).ifPresent(existingItem -> {
            // Validation: Prevent overlapping schedules for the same student (ignore current item)
            List<ScheduleItem> studentSchedules = scheduleItemRepository.findByStudentIdIgnoreCaseAndAcademicYearAndSemester(
                scheduleItem.getStudentId(), scheduleItem.getAcademicYear(), scheduleItem.getSemester());
            for (ScheduleItem s : studentSchedules) {
                if (!s.getId().equals(id) &&
                    s.getDayTime().equalsIgnoreCase(scheduleItem.getDayTime()) &&
                    s.getRoom().equalsIgnoreCase(scheduleItem.getRoom())) {
                    throw new IllegalArgumentException("Schedule conflict: Student already has a class in this room at this day/time.");
                }
            }
            // Validation: Prevent double-booking faculty (ignore current item)
            if (scheduleItem.getFaculty() != null && !scheduleItem.getFaculty().isEmpty()) {
                List<ScheduleItem> facultySchedules = scheduleItemRepository.findAll().stream()
                    .filter(s -> !s.getId().equals(id) &&
                                scheduleItem.getFaculty().equalsIgnoreCase(s.getFaculty()) &&
                                scheduleItem.getAcademicYear().equalsIgnoreCase(s.getAcademicYear()) &&
                                scheduleItem.getSemester().equalsIgnoreCase(s.getSemester()) &&
                                scheduleItem.getDayTime().equalsIgnoreCase(s.getDayTime()))
                    .toList();
                if (!facultySchedules.isEmpty()) {
                    throw new IllegalArgumentException("Schedule conflict: Faculty is already assigned to another class at this day/time.");
                }
            }
            // Update fields
            existingItem.setStudentId(scheduleItem.getStudentId());
            existingItem.setSubjectCode(scheduleItem.getSubjectCode());
            existingItem.setDescription(scheduleItem.getDescription());
            existingItem.setUnits(scheduleItem.getUnits());
            existingItem.setLec(scheduleItem.getLec());
            existingItem.setLab(scheduleItem.getLab());
            existingItem.setDayTime(scheduleItem.getDayTime());
            existingItem.setRoom(scheduleItem.getRoom());
            existingItem.setFaculty(scheduleItem.getFaculty());
            existingItem.setAcademicYear(scheduleItem.getAcademicYear());
            existingItem.setSemester(scheduleItem.getSemester());
            scheduleItemRepository.save(existingItem);
        });
    }

    public void deleteScheduleItem(Long id) {
        scheduleItemRepository.deleteById(id);
    }

    // --- Enrollment Request Management ---
    public List<EnrollmentRequest> getPendingEnrollmentRequests() {
        return enrollmentRequestRepository.findByStatusIgnoreCase("pending");
    }

    public Optional<EnrollmentRequest> getEnrollmentRequestById(String requestId) {
        try {
            Long id = Long.parseLong(requestId);
            return enrollmentRequestRepository.findById(id);
        } catch (NumberFormatException e) {
            return Optional.empty();
        }
    }

    public void processEnrollmentRequest(String requestId, String status, String remarks) {
        try {
            Long id = Long.parseLong(requestId);
            enrollmentRequestRepository.findById(id).ifPresent(request -> {
                request.setStatus(status);
                request.setRemarks(remarks);
                enrollmentRequestRepository.save(request);

                if ("approved".equals(status)) {
                    // Update user status and course information
                    userRepository.findByIdIgnoreCase(request.getStudentId()).ifPresent(user -> {
                        user.setStatus("Enrolled");
                        user.setCourse(request.getCourse());
                        user.setAdmissionStatus("Enrolled - New");
                        user.setScholasticStatus("Regular");
                        userRepository.save(user);
                    });

                    // Create student enrollment record
                    StudentEnrollment newEnrollment = new StudentEnrollment(
                        request.getStudentId(),
                        request.getCourse(),
                        request.getSectionId(),
                        request.getSemester(),
                        request.getAcademicYear(),
                        "enrolled"
                    );
                    studentEnrollmentRepository.save(newEnrollment);

                    // Automatically create or update a student account with tuition fee 18,000
                    Optional<StudentAccount> existingAccountOpt = studentAccountRepository.findByStudentIdIgnoreCase(request.getStudentId());
                    if (existingAccountOpt.isPresent()) {
                        StudentAccount existingAccount = existingAccountOpt.get();
                        existingAccount.setTotalBalance(18000.00);
                        existingAccount.setRemainingBalance(18000.00);
                        existingAccount.setAcademicYear(request.getAcademicYear());
                        existingAccount.setSemester(request.getSemester());
                        studentAccountRepository.save(existingAccount);
                    } else {
                        StudentAccount newAccount = new StudentAccount(
                            request.getStudentId(),
                            18000.00,
                            new ArrayList<>(),
                            18000.00,
                            request.getAcademicYear(),
                            request.getSemester()
                        );
                        studentAccountRepository.save(newAccount);
                    }

                    // Send notification message
                    messageRepository.save(new Message(request.getStudentId(), "System", "Enrollment Approved!", "Congratulations! Your enrollment for " + request.getCourse() + " has been approved.", LocalDateTime.now().toString(), false));
                } else if ("rejected".equals(status)) {
                    messageRepository.save(new Message(request.getStudentId(), "System", "Enrollment Rejected", "Your enrollment request for " + request.getCourse() + " was rejected. Reason: " + remarks, LocalDateTime.now().toString(), false));
                }
            });
        } catch (NumberFormatException e) {
            // Handle invalid ID format
            System.err.println("Invalid enrollment request ID format: " + requestId);
        }
    }

    // --- Student Enrollment Retrieval ---
    public Optional<StudentEnrollment> getStudentEnrollmentDetails(String studentId) {
        return studentEnrollmentRepository.findByStudentIdIgnoreCase(studentId);
    }

    // --- Student Account Retrieval and Update ---
    public Optional<StudentAccount> getStudentAccountDetails(String studentId) {
        return studentAccountRepository.findByStudentIdIgnoreCase(studentId);
    }

    public void updateStudentAccount(StudentAccount account) {
        studentAccountRepository.save(account);
    }

    // --- Student Schedule Retrieval and Update ---
    public Optional<StudentSchedule> getStudentSchedule(String studentId) {
        return studentScheduleRepository.findByStudentIdIgnoreCase(studentId);
    }

    public void updateStudentSchedule(String studentId, StudentSchedule schedule) {
        studentScheduleRepository.save(schedule);
    }

    // --- Student Grade Retrieval and Update ---
    public Optional<List<StudentGrade>> getStudentGrades(String studentId) {
        return Optional.of(studentGradeRepository.findByStudentIdIgnoreCase(studentId));
    }

    public void updateStudentGrade(String studentId, StudentGrade grade) {
        studentGradeRepository.save(grade);
    }

    // --- Student Inbox Retrieval ---
    public Optional<List<Message>> getStudentInbox(String studentId) {
        return Optional.of(messageRepository.findByStudentIdIgnoreCaseOrderByTimestampDesc(studentId));
    }

    // --- Student Forms Retrieval ---
    public Optional<List<StudentForm>> getStudentForms(String studentId) {
        return Optional.of(studentFormRepository.findByStudentIdIgnoreCaseOrderByRequestDateDesc(studentId));
    }

    public List<EnrollmentRequest> getAllEnrollmentRequests() {
        return enrollmentRequestRepository.findAll();
    }

    public void addSubject(Subject subject) {
        subjectRepository.save(subject);
    }

    public void updateSubject(String code, Subject subject) {
        subjectRepository.findByCodeIgnoreCase(code).ifPresent(existingSubject -> {
            existingSubject.setName(subject.getName());
            existingSubject.setUnits(subject.getUnits());
            existingSubject.setCourseCode(subject.getCourseCode());
            existingSubject.setDescription(subject.getDescription());
            subjectRepository.save(existingSubject);
        });
    }

    public void deleteSubject(String code) {
        subjectRepository.findByCodeIgnoreCase(code).ifPresent(subjectRepository::delete);
    }

    public void addCourse(Course course) {
        courseRepository.save(course);
    }

    public void updateCourse(String code, Course course) {
        courseRepository.findByCodeIgnoreCase(code).ifPresent(existingCourse -> {
            existingCourse.setName(course.getName());
            courseRepository.save(existingCourse);
        });
    }

    public void deleteCourse(String code) {
        courseRepository.findByCodeIgnoreCase(code).ifPresent(courseRepository::delete);
    }

    public void addSection(Section section) {
        sectionRepository.save(section);
    }

    public void updateSection(String code, Section section) {
        sectionRepository.findByIdIgnoreCase(code).ifPresent(existingSection -> {
            existingSection.setName(section.getName());
            existingSection.setSubjectCodes(section.getSubjectCodes());
            existingSection.setFacultyId(section.getFacultyId());
            existingSection.setSchedule(section.getSchedule());
            existingSection.setMaxCapacity(section.getMaxCapacity());
            existingSection.setCurrentEnrollment(section.getCurrentEnrollment());
            sectionRepository.save(existingSection);
        });
    }

    public void deleteSection(String code) {
        sectionRepository.findByIdIgnoreCase(code).ifPresent(sectionRepository::delete);
    }

    public void addFaculty(Faculty faculty) {
        facultyRepository.save(faculty);
    }

    public void updateFaculty(String id, Faculty faculty) {
        facultyRepository.findByIdIgnoreCase(id).ifPresent(existingFaculty -> {
            existingFaculty.setName(faculty.getName());
            existingFaculty.setDepartment(faculty.getDepartment());
            existingFaculty.setContactNumber(faculty.getContactNumber());
            existingFaculty.setEmail(faculty.getEmail());
            existingFaculty.setPosition(faculty.getPosition());
            existingFaculty.setAssignedSubjects(faculty.getAssignedSubjects());
            facultyRepository.save(existingFaculty);
        });
    }

    public void deleteFaculty(String id) {
        facultyRepository.deleteById(id);
    }

    public void updateUser(String id, User user) {
        // Always use course code
        String inputCourse = user.getCourse();
        List<Course> allCourses = courseRepository.findAll();
        String resolvedCourseCode = inputCourse;
        if (allCourses.stream().noneMatch(c -> c.getCode().equalsIgnoreCase(inputCourse))) {
            Course match = allCourses.stream().filter(c -> c.getName().equalsIgnoreCase(inputCourse)).findFirst().orElse(null);
            if (match != null) resolvedCourseCode = match.getCode();
        }
        final String finalCourseCode = resolvedCourseCode;
        userRepository.findByIdIgnoreCase(id).ifPresent(existingUser -> {
            // Update fields but preserve the ID
            existingUser.setName(user.getName());
            if (user.getPassword() != null && !user.getPassword().trim().isEmpty()) {
                existingUser.setPassword(user.getPassword());
            }
            existingUser.setCourse(finalCourseCode);
            existingUser.setPreferredCourseCode(finalCourseCode);
            existingUser.setSection(user.getSection());
            existingUser.setStatus(user.getStatus());
            existingUser.setAdmissionStatus(user.getAdmissionStatus());
            existingUser.setScholasticStatus(user.getScholasticStatus());
            existingUser.setCurrentSY(user.getCurrentSY());
            existingUser.setCurrentSem(user.getCurrentSem());
            userRepository.save(existingUser);
        });
    }

    @Transactional
    public void deleteUser(String id) {
        try {
            System.out.println("Attempting to delete user with ID: " + id);
            userRepository.findByIdIgnoreCase(id).ifPresent(user -> {
                System.out.println("Found user: " + user.getName() + " with role: " + user.getRole());
                // Delete related data, but never fail if one is missing
                try { studentAccountRepository.deleteByStudentIdIgnoreCase(id); } catch (Exception e) { System.err.println("[WARN] Could not delete student account: " + e.getMessage()); }
                try { studentEnrollmentRepository.deleteByStudentIdIgnoreCase(id); } catch (Exception e) { System.err.println("[WARN] Could not delete student enrollment: " + e.getMessage()); }
                try { studentScheduleRepository.deleteByStudentIdIgnoreCase(id); } catch (Exception e) { System.err.println("[WARN] Could not delete student schedule: " + e.getMessage()); }
                try { studentGradeRepository.deleteByStudentIdIgnoreCase(id); } catch (Exception e) { System.err.println("[WARN] Could not delete student grades: " + e.getMessage()); }
                try { messageRepository.deleteByStudentIdIgnoreCase(id); } catch (Exception e) { System.err.println("[WARN] Could not delete messages: " + e.getMessage()); }
                try { studentFormRepository.deleteByStudentIdIgnoreCase(id); } catch (Exception e) { System.err.println("[WARN] Could not delete student forms: " + e.getMessage()); }
                try { enrollmentRequestRepository.deleteByStudentIdIgnoreCase(id); } catch (Exception e) { System.err.println("[WARN] Could not delete enrollment requests: " + e.getMessage()); }
                try { scheduleItemRepository.deleteByStudentIdIgnoreCase(id); } catch (Exception e) { System.err.println("[WARN] Could not delete schedule items: " + e.getMessage()); }
                // Finally delete the user
                try {
                    userRepository.delete(user);
                    System.out.println("Successfully deleted user: " + id);
                } catch (Exception e) {
                    System.err.println("[ERROR] Could not delete user: " + e.getMessage());
                    throw new RuntimeException("Failed to delete user: " + e.getMessage(), e);
                }
            });
            if (!userRepository.findByIdIgnoreCase(id).isPresent()) {
                System.out.println("User " + id + " was not found for deletion");
            }
        } catch (Exception e) {
            System.err.println("Error in deleteUser method for ID " + id + ": " + e.getMessage());
            e.printStackTrace();
            throw new RuntimeException("Failed to delete user: " + e.getMessage(), e);
        }
    }

    public List<StudentAccount> getAllStudentAccounts() {
        return studentAccountRepository.findAll();
    }

    public boolean processStudentPayment(String studentId, double amount, String date, String description) {
        System.out.println("Received payment: " + amount + " for student " + studentId);
        Optional<StudentAccount> accountOpt = studentAccountRepository.findByStudentIdIgnoreCase(studentId);
        if (accountOpt.isPresent()) {
            StudentAccount account = accountOpt.get();
            String paymentInfo = String.format("%s: %.2f - %s", date, amount, description);
            List<String> payments = account.getPayments();
            payments.add(paymentInfo);
            account.setPayments(payments);
            double newBalance = account.getRemainingBalance() - amount;
            account.setRemainingBalance(newBalance);
            studentAccountRepository.save(account);
            return true;
        }
        return false;
    }

    public void ensureSubjectsForAllCourses() {
        List<Course> courses = getAllCourses();
        List<Subject> allSubjects = getAllSubjects();
        for (Course course : courses) {
            boolean hasSubject = allSubjects.stream().anyMatch(s -> course.getCode().equalsIgnoreCase(s.getCourseCode()));
            if (!hasSubject) {
                // Add a generic subject for this course
                String subjCode = course.getCode() + "101";
                String subjName = "Introduction to " + course.getName();
                Subject newSubject = new Subject(subjCode, subjName, 3, course.getCode(), "Introductory subject for " + course.getName());
                addSubject(newSubject);
            }
        }
    }

    public void ensureSectionExists() {
        if (getAllSections().isEmpty()) {
            // Create a generic section for the first available course (or generic if none)
            List<Course> courses = getAllCourses();
            String courseCode = courses.isEmpty() ? "GEN" : courses.get(0).getCode();
            Section section = new Section(
                courseCode + "-1-A-01",
                (courses.isEmpty() ? "GENERIC" : courses.get(0).getCode()) + " 1-A",
                courseCode,
                "1",
                "A",
                new ArrayList<>(),
                null,
                "MWF 8:00-9:00 AM - Room 100",
                30,
                0
            );
            addSection(section);
        }
    }

    public void ensureFacultyExists() {
        if (getAllFaculty().isEmpty()) {
            Faculty faculty = new Faculty(
                "F-001",
                "Default Faculty",
                "General Department",
                "+63 900 000 0000",
                "faculty@school.edu",
                "Instructor",
                new ArrayList<>()
            );
            addFaculty(faculty);
        }
    }

    // Batch update all students to use course codes in their course field
    @Transactional
    public int batchUpdateStudentCoursesToCode() {
        List<Course> courses = courseRepository.findAll();
        List<User> students = userRepository.findAll().stream()
            .filter(u -> "student".equalsIgnoreCase(u.getRole()))
            .collect(Collectors.toList());
        int updated = 0;
        for (User student : students) {
            if (student.getCourse() == null) continue;
            // If already a code, skip
            boolean isCode = courses.stream().anyMatch(c -> c.getCode().equalsIgnoreCase(student.getCourse()));
            if (isCode) continue;
            // Try to match by name
            Course match = courses.stream().filter(c -> c.getName().equalsIgnoreCase(student.getCourse())).findFirst().orElse(null);
            if (match != null) {
                student.setCourse(match.getCode());
                userRepository.save(student);
                updated++;
            }
        }
        return updated;
    }

    public List<Section> getSectionsByCourseCode(String courseCode) {
        return sectionRepository.findAllByCourseCodeIgnoreCase(courseCode);
    }
}