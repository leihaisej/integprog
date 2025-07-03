package com.oasis.repository;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

import org.springframework.stereotype.Component;

import com.oasis.model.Course;
import com.oasis.model.EnrollmentRequest;
import com.oasis.model.Faculty; // For generating unique IDs
import com.oasis.model.Message;
import com.oasis.model.Section;
import com.oasis.model.StudentAccount;
import com.oasis.model.StudentEnrollment;
import com.oasis.model.StudentForm;
import com.oasis.model.StudentGrade;
import com.oasis.model.StudentSchedule;
import com.oasis.model.Subject;
import com.oasis.model.User;

import jakarta.annotation.PostConstruct;

@Component
public class InMemoryDataStore {

    private final List<User> users = new ArrayList<>();
    private final List<Course> courses = new ArrayList<>();
    private final List<Subject> subjects = new ArrayList<>();
    private final List<Faculty> faculty = new ArrayList<>();
    private final List<Section> sections = new ArrayList<>();
    private final List<EnrollmentRequest> enrollmentRequests = new ArrayList<>();

    // Using Maps for quick lookup by ID, similar to how localStorage keys work
    private final Map<String, StudentEnrollment> studentEnrollments = new HashMap<>(); // studentId -> StudentEnrollment
    private final Map<String, StudentSchedule> studentSchedules = new HashMap<>();     // studentId -> StudentSchedule
    private final Map<String, List<StudentGrade>> studentGrades = new HashMap<>();    // studentId -> List<StudentGrade>
    private final Map<String, StudentAccount> studentAccounts = new HashMap<>();      // studentId -> StudentAccount
    private final Map<String, List<Message>> studentInbox = new HashMap<>();         // studentId -> List<Message>
    private final Map<String, List<StudentForm>> studentForms = new HashMap<>();     // studentId -> List<StudentForm>


    @PostConstruct
    public void init() {
        // Initialize data similar to data.js
        // Users
        users.add(new User("admin", "Admin User", "admin", "admin", null, null));
        users.add(new User("2025-00001-OA-0", "Pena, Juan", "student123", "student", "BSIT", null));
        users.add(new User("2025-00002-OA-0", "Dela Cruz, Maria", "student123", "student", "BSAIS", null));

        // Courses
        courses.add(new Course("BACOMM", "Bachelor of Arts in Communication"));
        courses.add(new Course("BAPOLSCI", "Bachelor of Arts in Political Science"));
        courses.add(new Course("BAPSYCH", "Bachelor of Arts in Psychology"));
        courses.add(new Course("BSAIS", "Bachelor of Science in Accounting Information System"));
        courses.add(new Course("BSIT", "Bachelor of Science in Information Technology"));
        courses.add(new Course("BSCS", "Bachelor of Science in Computer Science"));
        courses.add(new Course("BFA", "Bachelor of Fine Arts"));

        // Subjects (example)
        subjects.add(new Subject("CS101", "Intro to Programming", 3, "BSIT", "Fundamental programming concepts."));
        subjects.add(new Subject("IT201", "Web Development", 3, "BSIT", "Client-side and server-side web development."));
        subjects.add(new Subject("GENMATH", "General Mathematics", 3, null, "Basic college mathematics."));

        // Faculty (example)
        faculty.add(new Faculty("F-001", "Dr. John Smith", "Computer Science", "+63 912 345 6789", "john.smith@university.edu", "Professor", List.of("CS101", "CS201")));
        faculty.add(new Faculty("F-002", "Prof. Maria Garcia", "Information Technology", "+63 923 456 7890", "maria.garcia@university.edu", "Associate Professor", List.of("IT101", "IT201")));
        faculty.add(new Faculty("F-003", "Ms. Sarah Johnson", "Mathematics", "+63 934 567 8901", "sarah.johnson@university.edu", "Instructor", List.of("MATH101")));

        // Sections (example)
        sections.add(new Section("BSIT-1-A-01", "BSIT 1-A", "BSIT", "1", "A", List.of("CS101"), "F-001", "MWF 9:00-10:00 AM - Room 101", 30, 0));
        sections.add(new Section("BSIT-2-B-01", "BSIT 2-B", "BSIT", "2", "B", List.of("IT201"), "F-001", "TTh 1:00-2:30 PM - Room 205", 25, 0));
        sections.add(new Section("BFA-1-A-01", "BFA 1-A", "BFA", "1", "A", List.of(), null, "MWF 10:00-11:00 AM - Room 201", 30, 0));

        // Enrollment Requests (example)
        enrollmentRequests.add(new EnrollmentRequest(null, "2025-00001-OA-0", "Pena, Juan", "BSIT", "BSIT", "", "First Semester", "2025-2026", LocalDate.parse("2024-06-20"), "pending", ""));
        enrollmentRequests.add(new EnrollmentRequest(null, "2025-00002-OA-0", "Dela Cruz, Maria", "BSAIS", "BSAIS", "", "First Semester", "2025-2026", LocalDate.parse("2024-06-21"), "pending", ""));

        // Student Specific Data Initialization (empty or with initial data if applicable from data.js)
        studentEnrollments.put("2025-00001-OA-0", new StudentEnrollment("2025-00001-OA-0", "", "", "", "", "unenrolled")); // Will be updated on approval
        studentEnrollments.put("2025-00002-OA-0", new StudentEnrollment("2025-00002-OA-0", "", "", "", "", "unenrolled"));

        studentSchedules.put("2025-00001-OA-0", new StudentSchedule("2025-00001-OA-0", "2025-2026", "First Semester", new ArrayList<>()));
        studentSchedules.put("2025-00002-OA-0", new StudentSchedule("2025-00002-OA-0", "2025-2026", "First Semester", new ArrayList<>()));

        studentGrades.put("2025-00001-OA-0", new ArrayList<>());
        studentGrades.put("2025-00002-OA-0", new ArrayList<>());

        studentAccounts.put("2025-00001-OA-0", new StudentAccount("2025-00001-OA-0", 21000.00, new ArrayList<>(), 21000.00, "2025-2026", "First Semester"));
        studentAccounts.put("2025-00002-OA-0", new StudentAccount("2025-00002-OA-0", 21000.00, new ArrayList<>(), 21000.00, "2025-2026", "First Semester"));

        studentInbox.put("2025-00001-OA-0", new ArrayList<>());
        studentInbox.put("2025-00002-OA-0", new ArrayList<>());

        studentForms.put("2025-00001-OA-0", new ArrayList<>());
        studentForms.put("2025-00002-OA-0", new ArrayList<>());
    }

    // --- User Operations ---
    public Optional<User> findUserById(String id) {
        return users.stream().filter(u -> u.getId().equalsIgnoreCase(id)).findFirst();
    }

    public Optional<User> findUserByCredentials(String userId, String password) {
        return users.stream()
            .filter(u -> u.getId().equalsIgnoreCase(userId)
                && u.getPassword() != null
                && u.getPassword().equals(password))
            .findFirst();
    }

    public User saveUser(User user) {
        // In a real app, handle ID generation carefully (UUID, sequence, etc.)
        if (user.getId() == null || user.getId().isEmpty()) {
            user.setId("S-" + (users.size() + 1)); // Simple ID generation for new students
        }
        users.add(user);
        // Initialize student-specific data for new students
        if ("student".equalsIgnoreCase(user.getRole())) {
            studentEnrollments.put(user.getId(), new StudentEnrollment(user.getId(), "", "", "", "", "unenrolled"));
            studentSchedules.put(user.getId(), new StudentSchedule(user.getId(), "", "", new ArrayList<>()));
            studentGrades.put(user.getId(), new ArrayList<>());
            studentAccounts.put(user.getId(), new StudentAccount(user.getId(), 0.0, new ArrayList<>(), 0.0, "", ""));
            studentInbox.put(user.getId(), new ArrayList<>());
            studentForms.put(user.getId(), new ArrayList<>());
        }
        return user;
    }

    // --- Course Operations ---
    public List<Course> findAllCourses() {
        return new ArrayList<>(courses);
    }

    public Optional<Course> findCourseByCode(String code) {
        return courses.stream().filter(c -> c.getCode().equalsIgnoreCase(code)).findFirst();
    }

    // --- Enrollment Request Operations ---
    public List<EnrollmentRequest> findAllEnrollmentRequests() {
        return new ArrayList<>(enrollmentRequests);
    }

    public Optional<EnrollmentRequest> findEnrollmentRequestById(String id) {
        try {
            Long longId = Long.parseLong(id);
            return enrollmentRequests.stream()
                .filter(req -> req.getId() != null && req.getId().equals(longId))
                .findFirst();
        } catch (NumberFormatException e) {
            return Optional.empty();
        }
    }

    public EnrollmentRequest saveEnrollmentRequest(EnrollmentRequest request) {
        request.setId(null); // Let DB or logic handle ID if needed
        request.setStatus("pending");
        enrollmentRequests.add(request);
        return request;
    }

    public void updateEnrollmentRequest(EnrollmentRequest updatedRequest) {
        for (int i = 0; i < enrollmentRequests.size(); i++) {
            Long currentId = enrollmentRequests.get(i).getId();
            Long updatedId = updatedRequest.getId();
            if (currentId != null && updatedId != null && currentId.equals(updatedId)) {
                enrollmentRequests.set(i, updatedRequest);
                return;
            }
        }
    }

    // --- Student Enrollment Operations ---
    public Optional<StudentEnrollment> findStudentEnrollment(String studentId) {
        return Optional.ofNullable(studentEnrollments.get(studentId));
    }

    public void saveStudentEnrollment(StudentEnrollment enrollment) {
        studentEnrollments.put(enrollment.getStudentId(), enrollment);
    }

    // --- Student Account Operations ---
    public Optional<StudentAccount> findStudentAccount(String studentId) {
        return Optional.ofNullable(studentAccounts.get(studentId));
    }

    public void saveStudentAccount(StudentAccount account) {
        studentAccounts.put(account.getStudentId(), account);
    }

    // --- Student Schedule Operations ---
    public Optional<StudentSchedule> findStudentSchedule(String studentId) {
        return Optional.ofNullable(studentSchedules.get(studentId));
    }

    public void saveStudentSchedule(StudentSchedule schedule) {
        studentSchedules.put(schedule.getStudentId(), schedule);
    }

    // --- Student Grades Operations ---
    public List<StudentGrade> findStudentGrades(String studentId) {
        return studentGrades.getOrDefault(studentId, new ArrayList<>());
    }

    public void saveStudentGrade(String studentId, StudentGrade grade) {
        studentGrades.computeIfAbsent(studentId, k -> new ArrayList<>()).add(grade);
    }
    
    // --- Student Inbox Operations ---
    public List<Message> findStudentInbox(String studentId) {
        return studentInbox.getOrDefault(studentId, new ArrayList<>());
    }
    public void addInboxMessage(String studentId, Message message) {
        studentInbox.computeIfAbsent(studentId, k -> new ArrayList<>()).add(message);
    }
    
    // --- Student Forms Operations ---
    public List<StudentForm> findStudentForms(String studentId) {
        return studentForms.getOrDefault(studentId, new ArrayList<>());
    }
    public void addStudentForm(String studentId, StudentForm form) {
        studentForms.computeIfAbsent(studentId, k -> new ArrayList<>()).add(form);
    }

    // You will add more methods here for other entities (subjects, faculty, sections, etc.)
    public List<User> findAllUsers() {
        return new ArrayList<>(users);
    }
    public List<Faculty> findAllFaculty() {
        return new ArrayList<>(faculty);
    }
    public List<Subject> findAllSubjects() {
        return new ArrayList<>(subjects);
    }
    public List<Section> findAllSections() {
        return new ArrayList<>(sections);
    }
    public Optional<Subject> findSubjectByCode(String code) {
        return subjects.stream().filter(s -> s.getCode().equalsIgnoreCase(code)).findFirst();
    }
    public Optional<Faculty> findFacultyById(String id) {
        return faculty.stream().filter(f -> f.getId().equalsIgnoreCase(id)).findFirst();
    }
    public Optional<Section> findSectionById(String id) {
        return sections.stream().filter(s -> s.getId().equalsIgnoreCase(id)).findFirst();
    }
    public void addSubject(Subject subject) {
        subjects.add(subject);
    }
    public void updateSubject(String code, Subject updated) {
        for (int i = 0; i < subjects.size(); i++) {
            if (subjects.get(i).getCode().equalsIgnoreCase(code)) {
                subjects.set(i, updated);
                return;
            }
        }
    }
    public void deleteSubject(String code) {
        subjects.removeIf(s -> s.getCode().equalsIgnoreCase(code));
    }
    public void addCourse(Course course) {
        courses.add(course);
    }
    public void updateCourse(String code, Course updated) {
        for (int i = 0; i < courses.size(); i++) {
            if (courses.get(i).getCode().equalsIgnoreCase(code)) {
                courses.set(i, updated);
                return;
            }
        }
    }
    public void deleteCourse(String code) {
        courses.removeIf(c -> c.getCode().equalsIgnoreCase(code));
    }
    public void addSection(Section section) {
        sections.add(section);
    }
    public void updateSection(String code, Section updated) {
        for (int i = 0; i < sections.size(); i++) {
            if (sections.get(i).getId().equalsIgnoreCase(code)) {
                sections.set(i, updated);
                return;
            }
        }
    }
    public void deleteSection(String code) {
        sections.removeIf(s -> s.getId().equalsIgnoreCase(code));
    }
    public void addFaculty(Faculty facultyMember) {
        faculty.add(facultyMember);
    }
    public void updateFaculty(String id, Faculty updated) {
        for (int i = 0; i < faculty.size(); i++) {
            if (faculty.get(i).getId().equalsIgnoreCase(id)) {
                faculty.set(i, updated);
                return;
            }
        }
    }
    public void deleteFaculty(String id) {
        faculty.removeIf(f -> f.getId().equalsIgnoreCase(id));
    }
}