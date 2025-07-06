package com.oasis.service;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

import com.oasis.model.Course;
import com.oasis.model.Curriculum;
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
import com.oasis.repository.CurriculumRepository;
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

@Component
public class DataInitializationService implements CommandLineRunner {

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

    @Autowired
    private AuthService authService;

    @Autowired
    private CurriculumRepository curriculumRepository;

    @Override
    public void run(String... args) throws Exception {
        // Only initialize if no data exists
        if (userRepository.count() == 0) {
            initializeData();
        }
        // Always ensure every course has at least one subject
        authService.ensureSubjectsForAllCourses();
        // Always ensure at least one section and one faculty exist
        authService.ensureSectionExists();
        authService.ensureFacultyExists();
    }

    private void initializeData() {
        // Initialize Users
        List<User> users = Arrays.asList(
            new User("admin", "Admin User", "admin", "admin", null, null),
            new User("2025-00001-OA-0", "Pena, Juan", "student123", "student", "BSIT", null),
            new User("2025-00002-OA-0", "Dela Cruz, Maria", "student123", "student", "BSAIS", null)
        );
        userRepository.saveAll(users);

        // Initialize Courses
        List<Course> courses = Arrays.asList(
            new Course("BACOMM", "Bachelor of Arts in Communication"),
            new Course("BAPOLSCI", "Bachelor of Arts in Political Science"),
            new Course("BAPSYCH", "Bachelor of Arts in Psychology"),
            new Course("BSAIS", "Bachelor of Science in Accounting Information System"),
            new Course("BSIT", "Bachelor of Science in Information Technology"),
            new Course("BSCS", "Bachelor of Science in Computer Science")
        );
        courseRepository.saveAll(courses);

        // Initialize Faculty
        List<Faculty> facultyList = Arrays.asList(
            new Faculty("F-001", "Dr. John Smith", "Computer Science", "+63 912 345 6789", "john.smith@university.edu", "Professor", List.of("CS101", "CS201")),
            new Faculty("F-002", "Prof. Maria Garcia", "Information Technology", "+63 923 456 7890", "maria.garcia@university.edu", "Associate Professor", List.of("IT101", "IT201")),
            new Faculty("F-003", "Ms. Sarah Johnson", "Mathematics", "+63 934 567 8901", "sarah.johnson@university.edu", "Instructor", List.of("MATH101"))
        );
        facultyRepository.saveAll(facultyList);

        // Initialize Subjects
        List<Subject> subjects = Arrays.asList(
            new Subject("CS101", "Intro to Programming", 3, "BSIT", "Fundamental programming concepts.", 3, 0),
            new Subject("IT201", "Web Development", 3, "BSIT", "Client-side and server-side web development.", 2, 1),
            new Subject("GENMATH", "General Mathematics", 3, null, "Basic college mathematics.", 3, 0)
        );
        subjectRepository.saveAll(subjects);

        // Initialize Sections
        List<Section> sections = Arrays.asList(
            new Section("BSIT-1-A-01", "BSIT 1-A", "BSIT", "1", "A", List.of("CS101"), "F-001", "MWF 9:00-10:00 AM - Room 101", 30, 0),
            new Section("BSIT-2-B-01", "BSIT 2-B", "BSIT", "2", "B", List.of("IT201"), "F-001", "TTh 1:00-2:30 PM - Room 205", 25, 0)
        );
        sectionRepository.saveAll(sections);

        // Initialize Schedule Items
        List<ScheduleItem> scheduleItems = Arrays.asList(
            new ScheduleItem("2025-00001-OA-0", "CS101", "Intro to Programming", 3, 2, 1, "MWF", "09:00", "10:00", "Room 101", "Prof. Reyes", "2025-2026", "First Semester"),
            new ScheduleItem("2025-00001-OA-0", "GENMATH", "General Mathematics", 3, 3, 0, "TTh", "10:00", "11:30", "Room 102", "Prof. Santos", "2025-2026", "First Semester"),
            new ScheduleItem("2025-00002-OA-0", "GENMATH", "General Mathematics", 3, 3, 0, "MWF", "13:00", "14:30", "Room 103", "Prof. Santos", "2025-2026", "First Semester")
        );
        scheduleItemRepository.saveAll(scheduleItems);

        // Initialize Enrollment Requests
        List<EnrollmentRequest> enrollmentRequests = Arrays.asList(
            new EnrollmentRequest(null, "2025-00001-OA-0", "Pena, Juan", "BSIT", "BSIT", "", "First Semester", "2025-2026", LocalDate.parse("2024-06-20"), "pending", ""),
            new EnrollmentRequest(null, "2025-00002-OA-0", "Dela Cruz, Maria", "BSAIS", "BSAIS", "", "First Semester", "2025-2026", LocalDate.parse("2024-06-21"), "pending", "")
        );
        enrollmentRequestRepository.saveAll(enrollmentRequests);

        // Initialize Student Enrollments
        List<StudentEnrollment> studentEnrollments = Arrays.asList(
            new StudentEnrollment("2025-00001-OA-0", "", "", "", "", "unenrolled"),
            new StudentEnrollment("2025-00002-OA-0", "", "", "", "", "unenrolled")
        );
        studentEnrollmentRepository.saveAll(studentEnrollments);

        // Initialize Student Schedules
        List<StudentSchedule> studentSchedules = Arrays.asList(
            new StudentSchedule("2025-00001-OA-0", "2025-2026", "First Semester", new ArrayList<>()),
            new StudentSchedule("2025-00002-OA-0", "2025-2026", "First Semester", new ArrayList<>())
        );
        studentScheduleRepository.saveAll(studentSchedules);

        // Initialize Student Grades
        List<StudentGrade> studentGrades = Arrays.asList(
            new StudentGrade("2025-00001-OA-0", "CS101", "Intro to Programming", 3, "A", 1.0, "First Semester", "2025-2026", true),
            new StudentGrade("2025-00001-OA-0", "GENMATH", "General Mathematics", 3, "B+", 1.5, "First Semester", "2025-2026", true)
        );
        studentGradeRepository.saveAll(studentGrades);

        // Initialize Student Accounts
        List<StudentAccount> studentAccounts = Arrays.asList(
            new StudentAccount("2025-00001-OA-0", 21000.00, new ArrayList<>(), 21000.00, "2025-2026", "First Semester"),
            new StudentAccount("2025-00002-OA-0", 21000.00, new ArrayList<>(), 21000.00, "2025-2026", "First Semester")
        );
        studentAccountRepository.saveAll(studentAccounts);

        // Initialize Messages
        List<Message> messages = Arrays.asList(
            new Message("2025-00001-OA-0", "System", "Welcome to OASIS", "Your account has been successfully created.", "2024-06-20T10:00:00", false),
            new Message("2025-00002-OA-0", "System", "Welcome to OASIS", "Your account has been successfully created.", "2024-06-21T10:00:00", false)
        );
        messageRepository.saveAll(messages);

        // Initialize Student Forms
        List<StudentForm> studentForms = Arrays.asList(
            new StudentForm("2025-00001-OA-0", "Enrollment Form", "2024-06-20", "pending", "Processing"),
            new StudentForm("2025-00002-OA-0", "Good Moral Certificate", "2024-06-21", "approved", "Ready for pickup")
        );
        studentFormRepository.saveAll(studentForms);

        // Initialize Curricula
        List<Curriculum> curricula = Arrays.asList(
            new Curriculum("BSIT", 1, "First Semester", "CS101,GENMATH", 25),
            new Curriculum("BSIT", 1, "Second Semester", "IT201", 25)
        );
        curriculumRepository.saveAll(curricula);
    }
} 