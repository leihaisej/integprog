package com.oasis.service;

import java.util.List;
import java.util.Optional;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.oasis.model.EnrollmentRequest;
import com.oasis.model.Message;
import com.oasis.model.StudentAccount;
import com.oasis.model.StudentEnrollment;
import com.oasis.model.StudentForm;
import com.oasis.model.StudentGrade;
import com.oasis.model.StudentSchedule;
import com.oasis.repository.EnrollmentRequestRepository;
import com.oasis.repository.MessageRepository;
import com.oasis.repository.StudentAccountRepository;
import com.oasis.repository.StudentEnrollmentRepository;
import com.oasis.repository.StudentFormRepository;
import com.oasis.repository.StudentGradeRepository;
import com.oasis.repository.StudentScheduleRepository;

@Service
public class StudentService {
    
    @Autowired
    private EnrollmentRequestRepository enrollmentRequestRepository;
    
    @Autowired
    private StudentEnrollmentRepository studentEnrollmentRepository;
    
    @Autowired
    private StudentAccountRepository studentAccountRepository;
    
    @Autowired
    private StudentScheduleRepository studentScheduleRepository;
    
    @Autowired
    private StudentGradeRepository studentGradeRepository;
    
    @Autowired
    private MessageRepository messageRepository;
    
    @Autowired
    private StudentFormRepository studentFormRepository;

    @Autowired
    private GradeService gradeService;

    public Optional<StudentEnrollment> getStudentEnrollmentDetails(String studentId) {
        return studentEnrollmentRepository.findByStudentIdIgnoreCase(studentId);
    }

    public void submitEnrollmentRequest(EnrollmentRequest request) {
        if (request.getStatus() == null) request.setStatus("pending");
        if (request.getRequestDate() == null) request.setRequestDate(java.time.LocalDate.now());
        enrollmentRequestRepository.save(request);
    }

    public Optional<StudentAccount> getStudentAccountDetails(String studentId) {
        return studentAccountRepository.findByStudentIdIgnoreCase(studentId);
    }

    public Optional<StudentSchedule> getStudentSchedule(String studentId) {
        return studentScheduleRepository.findByStudentIdIgnoreCase(studentId);
    }

    public Optional<List<StudentGrade>> getStudentGrades(String studentId) {
        return Optional.of(studentGradeRepository.findByStudentIdIgnoreCase(studentId));
    }

    public Optional<List<Message>> getStudentInbox(String studentId) {
        return Optional.of(messageRepository.findByStudentIdIgnoreCaseOrderByTimestampDesc(studentId));
    }

    public Optional<List<StudentForm>> getStudentForms(String studentId) {
        return Optional.of(studentFormRepository.findByStudentIdIgnoreCaseOrderByRequestDateDesc(studentId));
    }

    public void updateStudentAccount(StudentAccount studentAccount) {
        studentAccountRepository.save(studentAccount);
    }

    public void updateStudentSchedule(String studentId, StudentSchedule studentSchedule) {
        studentScheduleRepository.save(studentSchedule);
    }

    public void updateStudentGrade(String studentId, StudentGrade studentGrade) {
        studentGradeRepository.save(studentGrade);
    }

    public void encodeGrade(StudentGrade grade) {
        // Check if a grade already exists for this student, subject, and term
        List<StudentGrade> existingGrades = studentGradeRepository.findByStudentIdIgnoreCase(grade.getStudentId());
        boolean gradeExists = existingGrades.stream()
            .anyMatch(existing -> existing.getSubjectCode().equalsIgnoreCase(grade.getSubjectCode()) &&
                                existing.getSemester().equalsIgnoreCase(grade.getSemester()) &&
                                existing.getAcademicYear().equalsIgnoreCase(grade.getAcademicYear()));
        
        if (gradeExists) {
            // Update existing grade
            StudentGrade existingGrade = existingGrades.stream()
                .filter(existing -> existing.getSubjectCode().equalsIgnoreCase(grade.getSubjectCode()) &&
                                  existing.getSemester().equalsIgnoreCase(grade.getSemester()) &&
                                  existing.getAcademicYear().equalsIgnoreCase(grade.getAcademicYear()))
                .findFirst()
                .orElse(null);
            
            if (existingGrade != null) {
                existingGrade.setGrade(grade.getGrade());
                existingGrade.setNumericGrade(grade.getNumericGrade());
                existingGrade.setSubjectName(grade.getSubjectName());
                existingGrade.setUnits(grade.getUnits());
                existingGrade.setSemester(grade.getSemester());
                existingGrade.setAcademicYear(grade.getAcademicYear());
                existingGrade.setIsReleased(grade.getIsReleased());
                gradeService.saveGrade(existingGrade);
                return;
            }
        }
        // Create new grade
        gradeService.saveGrade(grade);
    }

    public List<EnrollmentRequest> getEnrollmentRequestsByStudentId(String studentId) {
        return enrollmentRequestRepository.findByStudentIdIgnoreCase(studentId);
    }
}
