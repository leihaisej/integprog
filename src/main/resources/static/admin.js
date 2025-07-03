function setupModal(modalId, openButtonId, closeButtonId, formId, onSubmit, onOpen, cancelButtonId) {
    const modal = document.getElementById(modalId);
    const openBtn = document.getElementById(openButtonId);
    const closeBtn = document.getElementById(closeButtonId);
    const form = document.getElementById(formId);
    const cancelBtn = cancelButtonId ? document.getElementById(cancelButtonId) : null;

    if (openBtn) {
        openBtn.onclick = async () => {
            if (onOpen) {
                const result = await onOpen(form);
                if (result === false) return;
            }
            modal.style.display = 'block';
            document.body.style.overflow = 'hidden';
        };
    }
    if (closeBtn) {
        closeBtn.onclick = () => {
            modal.style.display = 'none';
            document.body.style.overflow = '';
        };
    }
    if (cancelBtn) {
        cancelBtn.onclick = () => {
            modal.style.display = 'none';
            document.body.style.overflow = '';
        };
    }
    if (form) {
        form.onsubmit = async (e) => {
            e.preventDefault();
            if (onSubmit) {
                const result = await onSubmit(form);
                if (result !== false) {
                    modal.style.display = 'none';
                    document.body.style.overflow = '';
                }
            }
        };
    }
    // Close modal when clicking outside
    window.addEventListener('click', (event) => {
        if (event.target === modal) {
            modal.style.display = 'none';
            document.body.style.overflow = '';
        }
    });
}

let curriculumSubjectsSelect;
let curriculumRequiredUnitsInput;
let curriculumUnitsDisplay;
let curriculumNavLink;
let origPopulateSubjectDropdown;
let lastCurriculumCourseFilter;

// Status options for dropdowns
const systemStatusOptions = [
    'Enrolled',
    'Not Enrolled'
];
const admissionStatusOptions = [
    'Regular',
    'Irregular',
    'Probationary',
    'Conditional',
    'Dismissed',
    'Transferred',
    'Graduated'
];
const scholasticStatusOptions = [
    'Good Standing',
    'Warning',
    'Probation',
    'Dismissed',
    'Graduated'
];

document.addEventListener('DOMContentLoaded', () => {
    const currentUser = checkAuthentication();
    if (!currentUser) return;

    const adminNameHeader = document.getElementById('adminNameHeader');
    if (adminNameHeader) adminNameHeader.textContent = currentUser.name;

    const navLinks = document.querySelectorAll('.sidebar .nav-link');
    const contentSections = document.querySelectorAll('.main-content .content-section');

    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            navLinks.forEach(l => l.classList.remove('active'));
            link.classList.add('active');
            contentSections.forEach(section => section.classList.remove('active'));
            const targetSectionId = link.dataset.target;
            const targetSection = document.getElementById(targetSectionId);
            if (targetSection) {
                targetSection.classList.add('active');
                loadAdminSectionData(targetSectionId);
            }
        });
    });

    // Main function to load admin section data
    async function loadAdminSectionData(sectionId) {
        switch (sectionId) {
            case 'dashboardHome':
                updateDashboardStats();
                break;
            case 'manageStudents':
                await loadStudentsTable();
                break;
            case 'enrollmentRequests':
                await loadEnrollmentRequestsTable();
                break;
            case 'manageFaculty':
                await loadFacultyTable();
                break;
            case 'manageCourses':
                await loadCoursesTable();
                break;
            case 'manageSubjects':
                await loadSubjectsTable();
                break;
            case 'manageSections':
                await loadSectionsTable();
                break;
            case 'manageSchedules':
                await loadSchedulesTable();
                break;
            case 'encodeGrades':
                await loadEncodeGradesData();
                break;
            case 'manageAccounts':
                await loadAccountsTable();
                break;
            case 'manageCurriculum':
                await loadCurriculumTable();
                break;
        }
    }

    // Update dashboard statistics
    async function updateDashboardStats() {
        try {
            // Get total students
            const usersResponse = await fetch('/api/auth/users');
            let totalStudents = 0;
            if (usersResponse.ok) {
                const users = await usersResponse.json();
                totalStudents = users.filter(u => u.role === 'student' && u.admissionStatus !== 'New' && u.status !== 'New Applicant').length;
            }

            // Get pending enrollment requests
            const requestsResponse = await fetch('/api/auth/enrollment/requests');
            let pendingRequests = 0;
            if (requestsResponse.ok) {
                const requests = await requestsResponse.json();
                pendingRequests = requests.filter(req => req.status === 'pending').length;
            }

            // Get total courses
            const coursesResponse = await fetch('/api/auth/courses');
            let totalCourses = 0;
            if (coursesResponse.ok) {
                const courses = await coursesResponse.json();
                totalCourses = courses.length;
            }

            // Update the stats display
            const statTotalStudents = document.getElementById('statTotalStudents');
            const statPendingRequests = document.getElementById('statPendingRequests');
            const statTotalCourses = document.getElementById('statTotalCourses');

            if (statTotalStudents) statTotalStudents.textContent = totalStudents;
            if (statPendingRequests) statPendingRequests.textContent = pendingRequests;
            if (statTotalCourses) statTotalCourses.textContent = totalCourses;
        } catch (e) {
            console.error('Failed to update dashboard stats:', e);
        }
    }

    // Load encode grades data
    async function loadEncodeGradesData() {
        try {
            // Load students with schedules only
            const usersResponse = await fetch('/api/auth/users');
            let students = [];
            if (usersResponse.ok) {
                const users = await usersResponse.json();
                // Only students with at least one schedule
                for (const user of users.filter(u => u.role === 'student')) {
                    const schedRes = await fetch(`/api/auth/schedules/${user.id}`);
                    if (schedRes.ok) {
                        const scheds = await schedRes.json();
                        if (scheds.length > 0) students.push(user);
                    }
                }
            }
                const studentSelect = document.getElementById('gradeStudentSelect');
                if (studentSelect) {
                    studentSelect.innerHTML = '<option value="">-- Select Student --</option>';
                    students.forEach(student => {
                        const option = document.createElement('option');
                        option.value = student.id;
                        option.textContent = `${student.name} (${student.id})`;
                        studentSelect.appendChild(option);
                    });
                }
            // Term dropdown logic
                const termSelect = document.getElementById('gradeTermSelect');
                const subjectSelect = document.getElementById('gradeSubjectSelectEncode');
                if (studentSelect && termSelect && subjectSelect) {
                    studentSelect.onchange = async () => {
                        const studentId = studentSelect.value;
                    termSelect.innerHTML = '<option value="">-- Select Term --</option>';
                            subjectSelect.innerHTML = '<option value="">-- Select Subject --</option>';
                    if (!studentId) return;
                    // Get all terms from schedules
                    const schedRes = await fetch(`/api/auth/schedules/${studentId}`);
                    if (schedRes.ok) {
                        const scheds = await schedRes.json();
                        // Build unique term pairs
                        const termPairs = [];
                        scheds.forEach(s => {
                            if (s.academicYear && s.semester) {
                                const ay = toYearRange(s.academicYear);
                                const key = `${ay}||${s.semester}`;
                                if (!termPairs.some(tp => tp.key === key)) {
                                    termPairs.push({ key, academicYear: ay, semester: s.semester });
                                }
                            }
                        });
                        termPairs.forEach(tp => {
                            const option = document.createElement('option');
                            option.value = tp.key;
                            option.textContent = `S.Y. ${tp.academicYear} - ${tp.semester}`;
                            termSelect.appendChild(option);
                        });
                    }
                };
                    termSelect.onchange = async () => {
                        const studentId = studentSelect.value;
                    const termVal = termSelect.value;
                            subjectSelect.innerHTML = '<option value="">-- Select Subject --</option>';
                    if (!studentId || !termVal) return;
                    // Split value into academicYear and semester
                    let [academicYear, semester] = termVal.split('||');
                    academicYear = toYearRange(academicYear);
                    const schedRes = await fetch(`/api/auth/schedules/${studentId}`);
                    if (schedRes.ok) {
                        const scheds = await schedRes.json();
                        const filtered = scheds.filter(s =>
                            (s.academicYear && s.academicYear.trim() === academicYear.trim()) &&
                            (s.semester && s.semester.trim().toLowerCase() === semester.trim().toLowerCase())
                        );
                        filtered.forEach(item => {
                            const option = document.createElement('option');
                            option.value = item.subjectCode;
                            option.textContent = `${item.subjectCode} - ${item.description} (${item.units} units)`;
                            subjectSelect.appendChild(option);
                        });
                        if (filtered.length === 0) {
                            const option = document.createElement('option');
                            option.value = '';
                            option.textContent = 'No subjects scheduled for this term';
                            option.disabled = true;
                            subjectSelect.appendChild(option);
                        }
                    }
                    await loadCurrentGradesForStudent(studentId, termVal);
                };
            }
            // Grade input validation
            const gradeInput = document.getElementById('finalGradeInput');
            if (gradeInput) {
                gradeInput.oninput = () => {
                    const val = gradeInput.value.trim();
                    let valid = false;
                    if (!isNaN(parseFloat(val))) {
                        const num = parseFloat(val);
                        valid = (num >= 1.0 && num <= 5.0) || (num >= 0 && num <= 100);
                    } else {
                        const validLetters = ['A','A-','B+','B','B-','C+','C','C-','D+','D','D-','F','INC','OD','UD','NGY'];
                        valid = validLetters.includes(val.toUpperCase());
                    }
                    gradeInput.style.borderColor = valid ? '#28a745' : '#dc3545';
                };
            }
            // Encode grades form logic
            const encodeGradesForm = document.getElementById('encodeGradesForm');
            if (encodeGradesForm) {
                encodeGradesForm.onsubmit = async (e) => {
                    e.preventDefault();
                    const studentId = studentSelect.value;
                    const term = termSelect.value;
                    const subjectCode = subjectSelect.value;
                    const finalGrade = gradeInput.value;
                    const remarks = document.getElementById('gradeRemarksSelect').value;
                    if (!studentId || !term || !subjectCode || !finalGrade) {
                        alert('Please fill in all required fields.');
                        return;
                    }
                    // Use the correct delimiter for term splitting
                    let academicYear, semester;
                    if (term.includes('||')) {
                        [academicYear, semester] = term.split('||').map(s => s.trim());
                    } else if (term.includes('-')) {
                        // fallback for old format
                        let parts = term.split('-');
                        academicYear = parts[0].trim();
                        semester = parts.slice(1).join('-').trim();
                    } else {
                        academicYear = '';
                        semester = '';
                    }
                    // Prevent duplicate grade encoding
                    const gradesRes = await fetch(`/api/student/grades/${studentId}/term?semester=${encodeURIComponent(semester)}&academicYear=${encodeURIComponent(toYearRange(academicYear))}`);
                    if (gradesRes.ok) {
                        const grades = await gradesRes.json();
                        if (grades.some(g => g.subjectCode === subjectCode)) {
                            alert('Grade for this subject and term already exists.');
                            return;
                        }
                    }
                    // Get subject details
                    const selectedOption = subjectSelect.options[subjectSelect.selectedIndex];
                    const subjectName = selectedOption.textContent.split(' - ')[1]?.split(' (')[0] || 'Unknown Subject';
                    const units = parseInt(selectedOption.textContent.match(/\((\d+) units\)/)?.[1] || '0');
                    // Determine grade type
                    let numericGrade = null;
                    let letterGrade = null;
                    if (!isNaN(parseFloat(finalGrade))) {
                        numericGrade = parseFloat(finalGrade);
                        if (numericGrade >= 1.0 && numericGrade < 1.25) letterGrade = 'A';
                        else if (numericGrade >= 1.25 && numericGrade < 1.5) letterGrade = 'A-';
                        else if (numericGrade >= 1.5 && numericGrade < 1.75) letterGrade = 'B+';
                        else if (numericGrade >= 1.75 && numericGrade < 2.0) letterGrade = 'B';
                        else if (numericGrade >= 2.0 && numericGrade < 2.25) letterGrade = 'B-';
                        else if (numericGrade >= 2.25 && numericGrade < 2.5) letterGrade = 'C+';
                        else if (numericGrade >= 2.5 && numericGrade < 2.75) letterGrade = 'C';
                        else if (numericGrade >= 2.75 && numericGrade < 3.0) letterGrade = 'C-';
                        else if (numericGrade >= 3.0 && numericGrade < 3.25) letterGrade = 'D+';
                        else if (numericGrade >= 3.25 && numericGrade < 3.5) letterGrade = 'D';
                        else if (numericGrade >= 3.5 && numericGrade < 5.0) letterGrade = 'D-';
                        else if (numericGrade >= 5.0) letterGrade = 'F';
                        else letterGrade = null;
                    } else {
                        letterGrade = finalGrade.toUpperCase();
                        const gradeMap = { 'A': 1.0, 'A-': 1.25, 'B+': 1.5, 'B': 1.75, 'B-': 2.0, 'C+': 2.25, 'C': 2.5, 'C-': 2.75, 'D+': 3.0, 'D': 3.25, 'D-': 3.5, 'F': 5.0, 'INC': null, 'OD': null, 'UD': null, 'NGY': null };
                        numericGrade = gradeMap[letterGrade] ?? null;
                    }
                    try {
                        const response = await fetch('/api/student/grade/encode-enhanced', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                                studentId,
                                subjectCode,
                                subjectName,
                                units,
                                grade: letterGrade,
                                numericGrade: numericGrade,
                                semester,
                                academicYear,
                                isReleased: false
                            })
                        });
                        if (response.ok) {
                            showNotification('Grade encoded successfully!', 'success');
                            gradeInput.value = '';
                            await loadCurrentGradesForStudent(studentId, term);
                        } else {
                            const errorText = await response.text();
                            showNotification(errorText || 'Failed to encode grade', 'error');
                        }
                    } catch (error) {
                        showNotification(`Failed to encode grade: ${error.message}`, 'error');
                    }
                };
            }
        } catch (e) {
            showNotification('Failed to load encode grades data', 'error');
        }
    }

    // Load subjects for a specific student and term
    async function loadSubjectsForStudent(studentId, term) {
        if (!studentId || !term) return;
        
        console.log('Loading subjects for student:', studentId, 'term:', term);
        
        try {
            // Always load all available subjects for grade encoding
            let response = await fetch('/api/student/subjects-for-grades');
            console.log('Subjects response status:', response.status);
            
            // Fallback to auth subjects endpoint if the student endpoint fails
            if (!response.ok) {
                console.log('Trying fallback endpoint...');
                response = await fetch('/api/auth/subjects');
                console.log('Fallback response status:', response.status);
            }
            
            const subjectSelect = document.getElementById('gradeSubjectSelectEncode');
            
            if (subjectSelect) {
                subjectSelect.innerHTML = '<option value="">-- Select Subject --</option>';
                
                if (response.ok) {
                    const subjects = await response.json();
                    console.log('Loaded subjects:', subjects);
                    
                    if (subjects.length === 0) {
                        const option = document.createElement('option');
                        option.value = '';
                        option.textContent = 'No subjects available';
                        option.disabled = true;
                        subjectSelect.appendChild(option);
                        return;
                    }
                    
                    subjects.forEach(item => {
                        const option = document.createElement('option');
                        option.value = item.code;
                        option.textContent = `${item.code} - ${item.name || 'N/A'} (${item.units || 0} units)`;
                        subjectSelect.appendChild(option);
                    });
                } else {
                    console.error('Failed to load subjects, status:', response.status);
                    const option = document.createElement('option');
                    option.value = '';
                    option.textContent = 'Error loading subjects';
                    option.disabled = true;
                    subjectSelect.appendChild(option);
                }
            }
        } catch (e) {
            console.error('Failed to load subjects for student:', e);
            const subjectSelect = document.getElementById('gradeSubjectSelectEncode');
            if (subjectSelect) {
                subjectSelect.innerHTML = '<option value="">-- Error loading subjects --</option>';
            }
        }
    }

    // Load current grades for selected student and term
    async function loadCurrentGradesForStudent(studentId, termVal) {
        if (!studentId || !termVal) return;
        
        console.log('Loading current grades for student:', studentId, 'term:', termVal);
        
        try {
            // Parse academic year and semester from termVal
            let academicYear = '', semester = '';
            if (termVal && termVal.includes('||')) {
                [academicYear, semester] = termVal.split('||').map(s => s.trim());
            } else if (termVal && termVal.includes('-')) {
                // fallback for old format
                let parts = termVal.split('-');
                academicYear = parts[0].trim();
                semester = parts.slice(1).join('-').trim();
            }
            // Debug log
            console.log('Fetching grades for:', { studentId, academicYear, semester });
            // Fetch grades for the selected term
            let grades = [];
            try {
                const response = await fetch(`/api/student/grades/${studentId}/term?semester=${encodeURIComponent(semester)}&academicYear=${encodeURIComponent(toYearRange(academicYear))}`);
                if (response.ok) {
                    grades = await response.json();
                } else {
                    console.error('Failed to load grades, status:', response.status);
                    const row = tbody.insertRow();
                    const cell = row.insertCell();
                    cell.colSpan = 7;
                    cell.textContent = 'Error loading grades.';
                    cell.style.textAlign = 'center';
                    cell.style.color = '#dc3545';
                    return;
                }
            } catch (e) {
                console.error('Failed to load current grades for student:', e);
                const gradesTable = document.getElementById('currentGradesTable');
                if (gradesTable) {
                    const tbody = gradesTable.querySelector('tbody');
                    tbody.innerHTML = '<tr><td colspan="7" style="text-align: center; color: #dc3545;">Error loading grades.</td></tr>';
                }
                return;
            }
            
            const gradesTable = document.getElementById('currentGradesTable');
            if (!gradesTable) return;
            
            const tbody = gradesTable.querySelector('tbody');
            tbody.innerHTML = '';
                
                if (grades.length === 0) {
                    const row = tbody.insertRow();
                    const cell = row.insertCell();
                    cell.colSpan = 6;
                    cell.textContent = 'No grades found for this term.';
                    cell.style.textAlign = 'center';
                    cell.style.color = '#666';
                    return;
                }
                
                grades.forEach(grade => {
                    const row = tbody.insertRow();
                    row.insertCell().textContent = grade.subjectCode;
                    row.insertCell().textContent = grade.subjectName;
                    row.insertCell().textContent = grade.units || 0;
                    // Display grade (letter grade)
                    const gradeCell = row.insertCell();
                    let displayLetterGrade = grade.grade;
                    if ((!displayLetterGrade || displayLetterGrade === 'N/A') && grade.numericGrade !== null && grade.numericGrade !== undefined) {
                        // Compute letter grade from numeric
                        const n = Number(grade.numericGrade);
                        if (n >= 1.0 && n < 1.25) displayLetterGrade = 'A';
                        else if (n >= 1.25 && n < 1.5) displayLetterGrade = 'A-';
                        else if (n >= 1.5 && n < 1.75) displayLetterGrade = 'B+';
                        else if (n >= 1.75 && n < 2.0) displayLetterGrade = 'B';
                        else if (n >= 2.0 && n < 2.25) displayLetterGrade = 'B-';
                        else if (n >= 2.25 && n < 2.5) displayLetterGrade = 'C+';
                        else if (n >= 2.5 && n < 2.75) displayLetterGrade = 'C';
                        else if (n >= 2.75 && n < 3.0) displayLetterGrade = 'C-';
                        else if (n >= 3.0 && n < 3.25) displayLetterGrade = 'D+';
                        else if (n >= 3.25 && n < 3.5) displayLetterGrade = 'D';
                        else if (n >= 3.5 && n < 5.0) displayLetterGrade = 'D-';
                        else if (n >= 5.0) displayLetterGrade = 'F';
                        else displayLetterGrade = 'N/A';
                    }
                    gradeCell.textContent = displayLetterGrade || 'N/A';
                    if (grade.isReleased) {
                        gradeCell.style.color = '#28a745';
                    }
                    // Display numeric grade and GPA
                    const numericCell = row.insertCell();
                    if (grade.numericGrade !== null && grade.numericGrade !== undefined) {
                        numericCell.textContent = Number(grade.numericGrade).toFixed(2);
                        numericCell.style.color = '#28a745';
                    } else {
                        numericCell.textContent = 'N/A';
                        numericCell.style.color = '#dc3545';
                    }
                    const gpaCell = row.insertCell();
                    if (grade.gpa !== null && grade.gpa !== undefined) {
                        gpaCell.textContent = Number(grade.gpa).toFixed(2);
                        gpaCell.style.color = '#28a745';
                    } else {
                        gpaCell.textContent = 'N/A';
                        gpaCell.style.color = '#dc3545';
                    }
                // Add release button or label
                    const actionsCell = row.insertCell();
                    if (!grade.isReleased && (grade.numericGrade !== null && grade.numericGrade !== undefined || displayLetterGrade && displayLetterGrade !== 'N/A')) {
                        const releaseBtn = document.createElement('button');
                        releaseBtn.textContent = 'Release';
                        releaseBtn.classList.add('btn', 'btn-sm', 'btn-success');
                        releaseBtn.onclick = async () => {
                            if (confirm(`Release grade for ${grade.subjectCode}?`)) {
                                try {
                                    const releaseResponse = await fetch(`/api/student/grade/release/${grade.id}`, {
                                        method: 'POST',
                                        headers: { 'Content-Type': 'application/json' }
                                    });
                                    if (releaseResponse.ok) {
                                        showNotification(`Grade for ${grade.subjectCode} released successfully! This grade is now visible to the student.`, 'success');
                                        await loadCurrentGradesForStudent(studentId, termVal);
                                    } else {
                                        const errorText = await releaseResponse.text();
                                        showNotification(errorText || 'Failed to release grade', 'error');
                                    }
                                } catch (error) {
                                    showNotification(`Failed to release grade: ${error.message}`, 'error');
                                }
                            }
                        };
                        actionsCell.appendChild(releaseBtn);
                    }
                    if (grade.isReleased) {
                        const releasedLabel = document.createElement('span');
                        releasedLabel.textContent = 'Released';
                        releasedLabel.style.color = '#28a745';
                        releasedLabel.style.fontWeight = 'bold';
                        actionsCell.appendChild(releasedLabel);
                        // Add Undo Release button
                        const undoBtn = document.createElement('button');
                        undoBtn.textContent = 'Undo Release';
                        undoBtn.classList.add('btn', 'btn-sm', 'btn-warning');
                        undoBtn.style.marginLeft = '8px';
                        undoBtn.onclick = async () => {
                            if (confirm(`Undo release for ${grade.subjectCode}?`)) {
                                try {
                                    const undoResponse = await fetch(`/api/student/grade/unrelease/${grade.id}`, {
                                        method: 'POST',
                                        headers: { 'Content-Type': 'application/json' }
                                    });
                                    if (undoResponse.ok) {
                                        showNotification(`Release undone for ${grade.subjectCode}. The grade is now hidden from the student.`, 'success');
                                        await loadCurrentGradesForStudent(studentId, termVal);
                                    } else {
                                        const errorText = await undoResponse.text();
                                        showNotification(errorText || 'Failed to undo release', 'error');
                                    }
                                } catch (error) {
                                    showNotification(`Failed to undo release: ${error.message}`, 'error');
                                }
                            }
                        };
                        actionsCell.appendChild(undoBtn);
                    } else if (!(grade.numericGrade !== null && grade.numericGrade !== undefined || displayLetterGrade && displayLetterGrade !== 'N/A')) {
                        actionsCell.textContent = 'No Grade';
                        actionsCell.style.color = '#666';
                    }
                    // Debug log
                    console.log('Grade row:', grade);
                });
                
                // Load and display term GPA
                await loadTermGPA(studentId, semester, academicYear);
        } catch (e) {
            console.error('Failed to load current grades for student:', e);
            const gradesTable = document.getElementById('currentGradesTable');
            if (gradesTable) {
                const tbody = gradesTable.querySelector('tbody');
                tbody.innerHTML = '<tr><td colspan="6" style="text-align: center; color: #dc3545;">Error loading grades.</td></tr>';
            }
        }
    }
    
    // Load and display term GPA
    async function loadTermGPA(studentId, semester, academicYear) {
        try {
            const response = await fetch(`/api/student/grades/${studentId}/term-gpa?semester=${semester}&academicYear=${toYearRange(academicYear)}`);
            
            if (response.ok) {
                const gpaData = await response.json();
                const gpaDisplay = document.getElementById('termGPADisplay');
                
                if (gpaDisplay) {
                    if (gpaData.termGPA != null) {
                        gpaDisplay.innerHTML = `<strong>Term GPA: ${gpaData.termGPA.toFixed(2)}</strong>`;
                        gpaDisplay.style.color = '#28a745';
                    } else {
                        gpaDisplay.innerHTML = '<strong>Term GPA: N/A</strong>';
                        gpaDisplay.style.color = '#666';
                    }
                }
            }
        } catch (e) {
            console.error('Failed to load term GPA:', e);
        }
    }

    // Show enrollment success modal
    function showEnrollmentSuccessModal(message, isError = false) {
        const modal = document.getElementById('enrollmentSuccessModal');
        const messageElement = document.getElementById('enrollmentSuccessMessage');
        const closeBtn = document.getElementById('closeEnrollmentSuccessModal');
        const confirmBtn = document.getElementById('confirmEnrollmentSuccess');
        
        if (messageElement) {
            messageElement.textContent = message;
            messageElement.style.color = isError ? 'var(--danger-color)' : 'var(--success-color)';
        }
        
        if (modal) {
            modal.style.display = 'block';
            document.body.style.overflow = 'hidden';
        }
        
        const closeModal = () => {
            if (modal) {
                modal.style.display = 'none';
                document.body.style.overflow = 'auto';
            }
        };
        
        if (closeBtn) {
            closeBtn.onclick = closeModal;
        }
        
        if (confirmBtn) {
            confirmBtn.onclick = closeModal;
        }
        
        // Close on outside click
        window.onclick = (event) => {
            if (event.target === modal) {
                closeModal();
            }
        };
    }

    // Initialize admin dashboard
    async function initializeAdminDashboard() {
        try {
            // Load all sections data
            await loadAdminSectionData('dashboardHome');
            await loadStudentsTable();
            await loadEnrollmentRequestsTable();
            await loadFacultyTable();
            await loadCoursesTable();
            await loadSubjectsTable();
            await loadSectionsTable();
            await loadEncodeGradesData();
            
            // Set up password toggle for student modal
            setupPasswordToggle();
            
            // Set up search functionality for accounts
            setupAccountsSearch();
            
            // Set up auto-refresh for enrollment requests
            setInterval(async () => {
                const enrollmentSection = document.getElementById('enrollmentRequests');
                if (enrollmentSection && enrollmentSection.classList.contains('active')) {
                    await loadEnrollmentRequestsTable();
                    await updateDashboardStats();
                }
            }, 30000); // Refresh every 30 seconds
            
            console.log('Admin dashboard initialized successfully');
        } catch (error) {
            console.error('Error initializing admin dashboard:', error);
        }
    }

    // Function to set up password toggle
    function setupPasswordToggle() {
        const toggleBtn = document.getElementById('toggleStudentPassword');
        const passwordInput = document.getElementById('studentPasswordModal');
        
        if (toggleBtn && passwordInput) {
            toggleBtn.onclick = () => {
                if (passwordInput.type === 'password') {
                    passwordInput.type = 'text';
                    toggleBtn.innerHTML = '<i>Hide</i>';
                } else {
                    passwordInput.type = 'password';
                    toggleBtn.innerHTML = '<i>Show</i>';
                }
            };
        }
    }

    // Call initialization on page load
    initializeAdminDashboard();

    // --- Student CRUD ---
    setupModal('studentModal', 'openAddStudentModal', 'closeStudentModal', 'studentForm',
        async (form) => {
            const id = form.studentIdModal.value.trim();
            const name = form.studentNameModal.value.trim();
            const password = form.studentPasswordModal.value;
            const courseCode = form.studentCourseModal.value;
            const sectionCode = form.studentSectionModal.value;
            const status = form.studentStatusModal.value;
            const admissionStatus = form.studentAdmissionStatusModal.value;
            const scholasticStatus = form.studentScholasticStatusModal.value;
            if (!id || !name || !courseCode) {
                showNotification('Student ID, name, and course are required.', 'error');
                return false;
            }
            const studentData = {
                id,
                name,
                password: password || undefined,
                course: courseCode,
                section: sectionCode,
                status,
                admissionStatus,
                scholasticStatus
            };
            try {
                let response;
                if (form.studentEditId.value) {
                    response = await fetch(`/api/auth/users/${id}`, {
                        method: 'PUT',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(studentData)
                    });
                } else {
                    response = await fetch('/api/auth/register', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(studentData)
                    });
                }
                if (!response.ok) {
                    const errorText = await response.text();
                    showNotification(errorText || 'Failed to save student', 'error');
                    return false;
                }
                await loadStudentsTable();
                showNotification('Student saved successfully.', 'success');
                return true;
            } catch (e) {
                showNotification(e.message, 'error');
                return false;
            }
        },
        async () => {
            document.getElementById('studentModalTitle').textContent = "Add Student";
            document.getElementById('studentForm').reset();
            document.getElementById('studentEditId').value = '';
            document.getElementById('studentIdModal').readOnly = false;
            await populateCourseDropdownForStudent('studentCourseModal', '', false);
            document.getElementById('studentCourseModal').onchange = (e) => {
                populateSectionDropdown('studentSectionModal', '', e.target.value);
            };
            document.getElementById('studentSectionModal').innerHTML = '';
        }, 'cancelStudentForm'
    );

    // When editing a student
    function openEditStudentModal(student) {
        console.log('[DEBUG] Editing student:', student);
        document.getElementById('studentModalTitle').textContent = "Edit Student";
        const studentForm = document.getElementById('studentForm');
        studentForm.reset();
        studentForm.studentEditId.value = student.id;
        studentForm.studentIdModal.value = student.id;
        document.getElementById('studentIdModal').readOnly = true;
        studentForm.studentNameModal.value = student.name;
        // One-time fix: if course is a name, convert to code
        fetch('/api/auth/courses').then(r => r.json()).then(courses => {
            let courseCode = student.course || student.preferredCourseCode || '';
            if (courseCode && !courses.some(c => c.code === courseCode)) {
                const match = courses.find(c => c.name === courseCode);
                if (match) courseCode = match.code;
            }
            console.log('[DEBUG] Using course code for dropdown:', courseCode);
            populateCourseDropdownForStudent('studentCourseModal', courseCode, true).then(() => {
                console.log('[DEBUG] Course dropdown populated. Now populating section dropdown with course code:', courseCode);
                populateSectionDropdown('studentSectionModal', student.section, courseCode);
                document.getElementById('studentCourseModal').onchange = (e) => {
                    console.log('[DEBUG] Course changed to:', e.target.value);
                    populateSectionDropdown('studentSectionModal', '', e.target.value);
                };
            });
            studentForm.studentPasswordModal.placeholder = "Leave blank to keep current password";
            studentForm.studentPasswordModal.value = "";
            populateStatusDropdown('studentStatusModal', student.status, systemStatusOptions, 'System Status');
            populateStatusDropdown('studentAdmissionStatusModal', student.admissionStatus, admissionStatusOptions, 'Admission Status');
            populateStatusDropdown('studentScholasticStatusModal', student.scholasticStatus, scholasticStatusOptions, 'Scholastic Status');
            document.getElementById('studentModal').style.display = 'block';
            document.body.style.overflow = 'hidden';
        });
    }

    async function loadStudentsTable() {
        let users = [];
        try {
            const response = await fetch('/api/auth/users');
            if (response.ok) {
                users = await response.json();
            }
        } catch (e) {
            console.error('Failed to fetch users from backend:', e);
        }
        // Only show students who are not new applicants (i.e., not pending/request)
        const students = users.filter(u => u.role === 'student' && u.admissionStatus !== 'New' && u.status !== 'New Applicant')
            .sort((a,b) => a.name.localeCompare(b.name));
        const tableBody = document.getElementById('studentsTable')?.querySelector('tbody');
        if (!tableBody) return;
        tableBody.innerHTML = '';
        students.forEach(student => {
            const row = tableBody.insertRow();
            row.insertCell().textContent = student.id;
            row.insertCell().textContent = student.name;
            row.insertCell().textContent = student.course || 'N/A';
            row.insertCell().textContent = student.section || 'N/A';
            row.insertCell().textContent = student.status || 'N/A';
            const actionsCell = row.insertCell();
            const editBtn = document.createElement('button');
            editBtn.textContent = 'Edit';
            editBtn.classList.add('btn', 'btn-sm', 'btn-edit');
            editBtn.onclick = () => openEditStudentModal(student);
            const deleteBtn = document.createElement('button');
            deleteBtn.textContent = 'Delete';
            deleteBtn.classList.add('btn', 'btn-sm', 'btn-danger');
            deleteBtn.onclick = async () => {
                if (confirm(`Are you sure you want to delete student ${student.name} (${student.id})? This will remove all associated data.`)) {
                    try {
                        console.log(`Attempting to delete student: ${student.id}`);
                        const response = await fetch(`/api/auth/users/${student.id}`, { 
                            method: 'DELETE',
                            headers: {
                                'Content-Type': 'application/json'
                            }
                        });
                        
                        console.log(`Delete response status: ${response.status}`);
                        
                        if (!response.ok) {
                            const errorText = await response.text();
                            console.error(`Delete failed with status ${response.status}: ${errorText}`);
                            throw new Error(`Failed to delete student: ${response.status} - ${errorText}`);
                        }
                        
                        console.log(`Successfully deleted student: ${student.id}`);
                        showNotification(`Student ${student.name} has been deleted successfully.`, 'success');
                        await loadStudentsTable();
                    } catch (e) {
                        console.error('Error deleting student:', e);
                        alert(`Error deleting student: ${e.message}`);
                    }
                }
            };
            actionsCell.appendChild(editBtn); actionsCell.appendChild(deleteBtn);
        });
    }

    // --- Courses CRUD ---
    async function loadCoursesTable() {
        let courses = [];
        try {
            const response = await fetch('/api/auth/courses');
            if (response.ok) {
                courses = await response.json();
            }
        } catch (e) {
            console.error('Failed to fetch courses from backend:', e);
        }
        const tableBody = document.getElementById('coursesTable')?.querySelector('tbody');
        if (!tableBody) return;
        tableBody.innerHTML = '';
        courses.forEach(course => {
            const row = tableBody.insertRow();
            row.insertCell().textContent = course.code;
            row.insertCell().textContent = course.name;
            const actionsCell = row.insertCell();
            const editBtn = document.createElement('button');
            editBtn.textContent = 'Edit';
            editBtn.classList.add('btn', 'btn-sm', 'btn-edit');
            editBtn.onclick = () => openEditCourseModal(course);
            const deleteBtn = document.createElement('button');
            deleteBtn.textContent = 'Delete';
            deleteBtn.classList.add('btn', 'btn-sm', 'btn-danger');
            deleteBtn.onclick = async () => {
                if (confirm(`Are you sure you want to delete course ${course.name} (${course.code})?`)) {
                    try {
                        console.log(`Attempting to delete course: ${course.code}`);
                        const response = await fetch(`/api/auth/courses/${course.code}`, { 
                            method: 'DELETE',
                            headers: {
                                'Content-Type': 'application/json'
                            }
                        });
                        
                        console.log(`Delete course response status: ${response.status}`);
                        
                        if (!response.ok) {
                            const errorText = await response.text();
                            console.error(`Delete course failed with status ${response.status}: ${errorText}`);
                            throw new Error(`Failed to delete course: ${response.status} - ${errorText}`);
                        }
                        
                        console.log(`Successfully deleted course: ${course.code}`);
                        showNotification(`Course ${course.name} has been deleted successfully.`, 'success');
                        await loadCoursesTable();
                    } catch (e) {
                        console.error('Error deleting course:', e);
                        alert(`Error deleting course: ${e.message}`);
                    }
                }
            };
            actionsCell.appendChild(editBtn);
            actionsCell.appendChild(deleteBtn);
        });
    }

    function openEditCourseModal(course) {
        document.getElementById('courseModalTitle').textContent = "Edit Course";
        const form = document.getElementById('courseForm');
        form.reset();
        form.courseEditCode.value = course.code;
        form.courseCodeModal.value = course.code;
        document.getElementById('courseCodeModal').readOnly = true;
        form.courseNameModal.value = course.name;
        document.getElementById('courseModal').style.display = 'block';
        document.body.style.overflow = 'hidden';
    }

    // Add Course Modal logic
    setupModal('courseModal', 'openAddCourseModal', 'closeCourseModal', 'courseForm',
        async (form) => {
            const code = form.courseCodeModal.value.trim();
            const name = form.courseNameModal.value.trim();
            const editCode = form.courseEditCode.value;
            if (!code || !name) { alert("Course code and name are required."); return false; }
            const courseData = { code, name };
            try {
                if (editCode) {
                    // Edit
                    const response = await fetch(`/api/auth/courses/${editCode}`, {
                        method: 'PUT',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(courseData)
                    });
                    if (!response.ok) throw new Error('Failed to update course');
                } else {
                    // Add
                    const response = await fetch('/api/auth/courses', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(courseData)
                    });
                    if (!response.ok) throw new Error('Failed to add course');
                }
                await loadCoursesTable();
                return true;
            } catch (e) {
                alert(e.message);
                return false;
            }
        },
        () => {
            document.getElementById('courseModalTitle').textContent = "Add New Course";
            document.getElementById('courseForm').reset();
            document.getElementById('courseEditCode').value = '';
            document.getElementById('courseCodeModal').readOnly = false;
        }, 'cancelCourseForm'
    );

    // --- Sections CRUD ---
    async function loadSectionsTable() {
        let sections = [];
        try {
            const response = await fetch('/api/auth/sections');
            if (response.ok) {
                sections = await response.json();
            }
        } catch (e) {
            console.error('Failed to fetch sections from backend:', e);
        }
        const tableBody = document.getElementById('sectionsTable')?.querySelector('tbody');
        if (!tableBody) return;
        tableBody.innerHTML = '';
        for (const section of sections) {
            // Fetch the number of students in this section
            let enrollmentCount = 0;
            try {
                const enrollRes = await fetch(`/api/auth/enrollments/section/${section.id}`);
                if (enrollRes.ok) {
                    const students = await enrollRes.json();
                    enrollmentCount = students.length;
                }
            } catch (e) {
                console.error('Failed to fetch enrollment count for section', section.id, e);
            }
            const row = tableBody.insertRow();
            row.insertCell().textContent = section.id;
            row.insertCell().textContent = section.name;
            row.insertCell().textContent = section.courseCode || 'N/A';
            row.insertCell().textContent = section.yearLevel ? `${section.yearLevel}st Year` : 'N/A';
            row.insertCell().textContent = section.sectionLetter || 'N/A';
            row.insertCell().textContent = `${enrollmentCount}/${section.maxCapacity || 0}`;
            const actionsCell = row.insertCell();
            const editBtn = document.createElement('button');
            editBtn.textContent = 'Edit';
            editBtn.classList.add('btn', 'btn-sm', 'btn-edit');
            editBtn.onclick = () => openEditSectionModal(section);
            const deleteBtn = document.createElement('button');
            deleteBtn.textContent = 'Delete';
            deleteBtn.classList.add('btn', 'btn-sm', 'btn-danger');
            deleteBtn.onclick = () => deleteSection(section.id);
            actionsCell.appendChild(editBtn);
            actionsCell.appendChild(deleteBtn);
        }
    }

    function openEditSectionModal(section) {
        document.getElementById('sectionModalTitle').textContent = "Edit Section";
        const form = document.getElementById('sectionForm');
        form.reset();
        form.sectionEditCode.value = section.id;
        form.sectionCodeModal.value = section.id;
        document.getElementById('sectionCodeModal').readOnly = true;
        form.sectionNameModal.value = section.name;
        populateCourseDropdown('sectionCourseCodeModal', section.courseCode);
        form.sectionYearLevelModal.value = section.yearLevel || '';
        form.sectionLetterModal.value = section.sectionLetter || '';
        form.sectionMaxCapacityModal.value = section.maxCapacity || 30;
        form.sectionCurrentEnrollmentModal.value = section.currentEnrollment || 0;
        document.getElementById('sectionModal').style.display = 'block';
        document.body.style.overflow = 'hidden';
    }

    // Helper to auto-generate section name and ID
    async function generateSectionNameAndId() {
        const courseCode = document.getElementById('sectionCourseCodeModal')?.value;
        const yearLevel = document.getElementById('sectionYearLevelModal')?.value;
        const sectionLetter = document.getElementById('sectionLetterModal')?.value;
        if (courseCode && yearLevel && sectionLetter) {
            // Generate section name
            const sectionName = `${courseCode} ${yearLevel}-${sectionLetter}`;
            document.getElementById('sectionNameModal').value = sectionName;
            // Generate section ID
            try {
                const response = await fetch('/api/auth/sections');
                if (response.ok) {
                    const sections = await response.json();
                    const existingSections = sections.filter(s => s.courseCode === courseCode && s.yearLevel === yearLevel);
                    const nextNumber = existingSections.length + 1;
                    const sectionId = `${courseCode}-${yearLevel}-${sectionLetter}-${String(nextNumber).padStart(2, '0')}`;
                    document.getElementById('sectionCodeModal').value = sectionId;
                }
            } catch (e) {
                // Fallback ID generation
                const sectionId = `${courseCode}-${yearLevel}-${sectionLetter}-01`;
                document.getElementById('sectionCodeModal').value = sectionId;
            }
        }
    }

    // Add Section Modal logic
    setupModal('sectionModal', 'openAddSectionModal', 'closeSectionModal', 'sectionForm',
        async (form) => {
            const id = form.sectionCodeModal.value.trim();
            const name = form.sectionNameModal.value.trim();
            const courseCode = form.sectionCourseCodeModal ? form.sectionCourseCodeModal.value.trim() : '';
            const yearLevel = form.sectionYearLevelModal ? form.sectionYearLevelModal.value.trim() : '';
            const sectionLetter = form.sectionLetterModal ? form.sectionLetterModal.value.trim() : '';
            const maxCapacity = parseInt(form.sectionMaxCapacityModal.value) || 0;
            const currentEnrollment = parseInt(form.sectionCurrentEnrollmentModal.value) || 0;
            const editCode = form.sectionEditCode.value;
            if (!courseCode || !yearLevel || !sectionLetter) { 
                alert("Course Code, Year Level, and Section Letter are required."); 
                return false; 
            }
            const sectionData = { 
                id, 
                name, 
                courseCode, 
                yearLevel,
                sectionLetter,
                maxCapacity, 
                currentEnrollment 
            };
            try {
                if (editCode) {
                    // Edit
                    const response = await fetch(`/api/auth/sections/${editCode}`, {
                        method: 'PUT',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(sectionData)
                    });
                    if (!response.ok) throw new Error('Failed to update section');
                } else {
                    // Add
                    const response = await fetch('/api/auth/sections', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(sectionData)
                    });
                    if (!response.ok) throw new Error('Failed to add section');
                }
                await loadSectionsTable();
                return true;
            } catch (e) {
                alert(e.message);
                return false;
            }
        },
        async () => {
            document.getElementById('sectionModalTitle').textContent = "Add New Section";
            document.getElementById('sectionForm').reset();
            document.getElementById('sectionEditCode').value = '';
            document.getElementById('sectionCodeModal').readOnly = false;
            await populateCourseDropdown('sectionCourseCodeModal');
            // Set up auto-generation listeners
            document.getElementById('sectionCourseCodeModal').onchange = generateSectionNameAndId;
            document.getElementById('sectionYearLevelModal').onchange = generateSectionNameAndId;
            document.getElementById('sectionLetterModal').onchange = generateSectionNameAndId;
        }, 'cancelSectionForm'
    );

    // --- Subjects CRUD ---
    async function loadSubjectsTable() {
        let subjects = [];
        try {
            const response = await fetch('/api/auth/subjects');
            if (response.ok) {
                subjects = await response.json();
            }
        } catch (e) {
            console.error('Failed to fetch subjects from backend:', e);
        }
        const tableBody = document.getElementById('subjectsTable')?.querySelector('tbody');
        if (!tableBody) return;
        tableBody.innerHTML = '';
        subjects.forEach(subject => {
            const row = tableBody.insertRow();
            row.insertCell().textContent = subject.code;
            row.insertCell().textContent = subject.name;
            row.insertCell().textContent = subject.units;
            row.insertCell().textContent = subject.courseCode || 'N/A';
            row.insertCell().textContent = subject.description || 'N/A';
            const actionsCell = row.insertCell();
            const editBtn = document.createElement('button');
            editBtn.textContent = 'Edit';
            editBtn.classList.add('btn', 'btn-sm', 'btn-edit');
            editBtn.onclick = () => openEditSubjectModal(subject);
            const deleteBtn = document.createElement('button');
            deleteBtn.textContent = 'Delete';
            deleteBtn.classList.add('btn', 'btn-sm', 'btn-danger');
            deleteBtn.onclick = async () => {
                if (confirm(`Are you sure you want to delete subject ${subject.code}?`)) {
                    try {
                        const response = await fetch(`/api/auth/subjects/${subject.code}`, { method: 'DELETE' });
                        if (!response.ok) throw new Error('Failed to delete subject');
                        await loadSubjectsTable();
                    } catch (e) {
                        alert(e.message);
                    }
                }
            };
            actionsCell.appendChild(editBtn);
            actionsCell.appendChild(deleteBtn);
        });
    }

    function openEditSubjectModal(subject) {
        document.getElementById('subjectModalTitle').textContent = "Edit Subject";
        const form = document.getElementById('subjectForm');
        form.reset();
        form.subjectEditCode.value = subject.code;
        form.subjectCodeModal.value = subject.code;
        document.getElementById('subjectCodeModal').readOnly = true;
        form.subjectNameModal.value = subject.name;
        form.subjectUnitsModal.value = subject.units;
        populateCourseDropdown('subjectCourseCodeModal', subject.courseCode);
        form.subjectDescriptionModal.value = subject.description;
        document.getElementById('subjectModal').style.display = 'block';
        document.body.style.overflow = 'hidden';
    }

    // Add Subject Modal logic
    setupModal('subjectModal', 'openAddSubjectModal', 'closeSubjectModal', 'subjectForm',
        async (form) => {
            const code = form.subjectCodeModal.value.trim();
            const name = form.subjectNameModal.value.trim();
            const units = parseInt(form.subjectUnitsModal.value);
            const courseCode = form.subjectCourseCodeModal.value.trim();
            const description = form.subjectDescriptionModal.value.trim();
            const editCode = form.subjectEditCode.value;
            if (!code || !name || !units) { alert("Code, Name, and Units are required."); return false; }
            const subjectData = { code, name, units, courseCode, description };
            try {
                if (editCode) {
                    // Edit
                    const response = await fetch(`/api/auth/subjects/${editCode}`, {
                        method: 'PUT',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(subjectData)
                    });
                    if (!response.ok) throw new Error('Failed to update subject');
                } else {
                    // Add
                    const response = await fetch('/api/auth/subjects', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(subjectData)
                    });
                    if (!response.ok) throw new Error('Failed to add subject');
                }
                await loadSubjectsTable();
                return true;
            } catch (e) {
                alert(e.message);
                return false;
            }
        },
        async () => {
            document.getElementById('subjectModalTitle').textContent = "Add New Subject";
            document.getElementById('subjectForm').reset();
            document.getElementById('subjectEditCode').value = '';
            document.getElementById('subjectCodeModal').readOnly = false;
            // Populate course dropdown when modal opens
            await populateCourseDropdown('subjectCourseCodeModal');
        }, 'cancelSubjectForm'
    );

    // --- Faculty CRUD ---
    async function loadFacultyTable() {
        let facultyList = [];
        try {
            const response = await fetch('/api/auth/faculty');
            if (response.ok) {
                facultyList = await response.json();
            }
        } catch (e) {
            console.error('Failed to fetch faculty from backend:', e);
        }
        const tableBody = document.getElementById('facultyTable')?.querySelector('tbody');
        if (!tableBody) return;
        tableBody.innerHTML = '';
        facultyList.forEach(faculty => {
            const row = tableBody.insertRow();
            row.insertCell().textContent = faculty.id;
            row.insertCell().textContent = faculty.name;
            row.insertCell().textContent = faculty.department || 'N/A';
            row.insertCell().textContent = faculty.position || 'N/A';
            row.insertCell().textContent = faculty.email || 'N/A';
            row.insertCell().textContent = faculty.contactNumber || 'N/A';
            row.insertCell().textContent = faculty.assignedSubjects && faculty.assignedSubjects.length > 0 
                ? faculty.assignedSubjects.join(', ') 
                : 'None';
            const actionsCell = row.insertCell();
            const editBtn = document.createElement('button');
            editBtn.textContent = 'Edit';
            editBtn.classList.add('btn', 'btn-sm', 'btn-edit');
            editBtn.onclick = () => openEditFacultyModal(faculty);
            const deleteBtn = document.createElement('button');
            deleteBtn.textContent = 'Delete';
            deleteBtn.classList.add('btn', 'btn-sm', 'btn-danger');
            deleteBtn.onclick = async () => {
                if (confirm(`Are you sure you want to delete faculty ${faculty.name} (${faculty.id})?`)) {
                    try {
                        console.log(`Attempting to delete faculty: ${faculty.id}`);
                        const response = await fetch(`/api/auth/faculty/${faculty.id}`, { 
                            method: 'DELETE',
                            headers: {
                                'Content-Type': 'application/json'
                            }
                        });
                        
                        console.log(`Delete faculty response status: ${response.status}`);
                        
                        if (!response.ok) {
                            const errorText = await response.text();
                            console.error(`Delete faculty failed with status ${response.status}: ${errorText}`);
                            throw new Error(`Failed to delete faculty: ${response.status} - ${errorText}`);
                        }
                        
                        console.log(`Successfully deleted faculty: ${faculty.id}`);
                        showNotification(`Faculty ${faculty.name} has been deleted successfully.`, 'success');
                        await loadFacultyTable();
                    } catch (e) {
                        console.error('Error deleting faculty:', e);
                        alert(`Error deleting faculty: ${e.message}`);
                    }
                }
            };
            actionsCell.appendChild(editBtn);
            actionsCell.appendChild(deleteBtn);
        });
    }

    async function openEditFacultyModal(faculty) {
        document.getElementById('facultyModalTitle').textContent = "Edit Faculty";
        const form = document.getElementById('facultyForm');
        form.reset();
        form.facultyEditId.value = faculty.id;
        form.facultyIdModal.value = faculty.id;
        document.getElementById('facultyIdModal').readOnly = true;
        form.facultyNameModal.value = faculty.name || '';
        form.facultyDepartmentModal.value = faculty.department || '';
        form.facultyPositionModal.value = faculty.position || '';
        form.facultyEmailModal.value = faculty.email || '';
        form.facultyContactModal.value = faculty.contactNumber || '';
        // Populate subjects dropdown and set selected values (await to ensure it's ready)
        await populateSubjectDropdown('facultySubjectsModal', '', faculty.assignedSubjects || []);
        document.getElementById('facultyModal').style.display = 'block';
        document.body.style.overflow = 'hidden';
    }

    // Add Faculty Modal logic
    setupModal('facultyModal', 'openAddFacultyModal', 'closeFacultyModal', 'facultyForm',
        async (form) => {
            const id = form.facultyIdModal.value.trim();
            const name = form.facultyNameModal.value.trim();
            const department = form.facultyDepartmentModal.value.trim();
            const position = form.facultyPositionModal.value.trim();
            const email = form.facultyEmailModal.value.trim();
            const contactNumber = form.facultyContactModal.value.trim();
            const editId = form.facultyEditId.value;
            
            // Get selected subjects from multi-select
            const subjectSelect = document.getElementById('facultySubjectsModal');
            const assignedSubjects = Array.from(subjectSelect.selectedOptions).map(option => option.value).filter(value => value);
            
            if (!name || !department || !position || !email) { 
                alert("Faculty Name, Department, Position, and Email are required."); 
                return false; 
            }
            
            const facultyData = { 
                id, 
                name, 
                department, 
                position,
                email,
                contactNumber,
                assignedSubjects
            };
            
            try {
                if (editId) {
                    // Edit
                    const response = await fetch(`/api/auth/faculty/${editId}`, {
                        method: 'PUT',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(facultyData)
                    });
                    if (!response.ok) throw new Error('Failed to update faculty');
                } else {
                    // Add
                    const response = await fetch('/api/auth/faculty', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(facultyData)
                    });
                    if (!response.ok) throw new Error('Failed to add faculty');
                }
                await loadFacultyTable();
                return true;
            } catch (e) {
                alert(e.message);
                return false;
            }
        },
        async () => {
            document.getElementById('facultyModalTitle').textContent = "Add New Faculty";
            document.getElementById('facultyForm').reset();
            document.getElementById('facultyEditId').value = '';
            document.getElementById('facultyIdModal').readOnly = false;
            
            // Generate faculty ID
            await generateFacultyId();
            
            // Populate subjects dropdown
            await populateSubjectDropdown('facultySubjectsModal');
        }, 'cancelFacultyForm'
    );

    // Function to generate faculty ID automatically
    async function generateFacultyId() {
        try {
            const response = await fetch('/api/auth/faculty');
            if (response.ok) {
                const facultyList = await response.json();
                const nextNumber = facultyList.length + 1;
                const facultyId = `F-${String(nextNumber).padStart(3, '0')}`;
                document.getElementById('facultyIdModal').value = facultyId;
            }
        } catch (e) {
            console.error('Error generating faculty ID:', e);
            // Fallback ID generation
            const facultyId = `F-001`;
            document.getElementById('facultyIdModal').value = facultyId;
        }
    }

    // --- Enrollment Requests ---
    async function loadEnrollmentRequestsTable() {
        let requests = [];
        try {
            const response = await fetch('/api/auth/enrollment/requests');
            if (response.ok) {
                requests = await response.json();
            }
        } catch (e) {
            console.error('Failed to fetch enrollment requests from backend:', e);
        }
        const tableBody = document.getElementById('enrollmentRequestsTable')?.querySelector('tbody');
        const pendingCountBadge = document.getElementById('pendingRequestsCount');
        if (!tableBody || !pendingCountBadge) return;
        tableBody.innerHTML = '';

        const pendingRequests = requests.filter(req => req.status === 'pending')
            .sort((a,b) => new Date(b.applicationDate || b.date).getTime() - new Date(a.applicationDate || a.date).getTime());

        pendingCountBadge.textContent = pendingRequests.length > 0 ? `${pendingRequests.length}` : '';
        pendingCountBadge.style.display = pendingRequests.length > 0 ? 'inline-block' : 'none';

        if (pendingRequests.length === 0) {
            tableBody.innerHTML = '<tr><td colspan="7" style="text-align:center;">No pending enrollment requests.</td></tr>';
            return;
        }

        let coursesData = [];
        try {
            const coursesResponse = await fetch('/api/auth/courses');
            if (coursesResponse.ok) {
                coursesData = await coursesResponse.json();
            }
        } catch (e) {
            console.error('Failed to fetch courses from backend:', e);
        }

        pendingRequests.forEach(req => {
            const row = tableBody.insertRow();
            row.insertCell().textContent = req.id || req.requestId;
            row.insertCell().textContent = req.studentName;
            row.insertCell().textContent = req.studentId;
            const preferredCourseObj = coursesData.find(c => c.code === req.preferredCourseCode);
            if (preferredCourseObj) {
                row.insertCell().textContent = `${preferredCourseObj.name} (${preferredCourseObj.code})`;
            } else if (req.preferredCourseCode) {
                row.insertCell().textContent = req.preferredCourseCode;
            } else {
                row.insertCell().textContent = '';
            }
            // School Year (SY) and Semester
            let sy = req.academicYear || req.schoolYear || req.sy || 'N/A';
            let sem = req.semester || req.term || 'N/A';
            row.insertCell().textContent = `S.Y. ${sy} - ${sem}`;
            // Date Applied
            let dateApplied = req.requestDate || req.applicationDate || req.date;
            if (dateApplied) {
                // If it's a Date object or ISO string, format it
                let formattedDate = (typeof dateApplied === 'string' && dateApplied.length === 10)
                    ? dateApplied
                    : new Date(dateApplied).toLocaleDateString();
                row.insertCell().textContent = formattedDate;
            } else {
                row.insertCell().textContent = 'N/A';
            }

            const actionsCell = row.insertCell();
            const processBtn = document.createElement('button');
            processBtn.textContent = 'Process Request';
            processBtn.classList.add('btn', 'btn-sm', 'btn-primary');
            processBtn.onclick = () => showEnrollmentProcessModal(req);
            actionsCell.appendChild(processBtn);
        });
    }

    function showEnrollmentProcessModal(request) {
        const modal = document.getElementById('enrollmentProcessModal');
        let coursesData = [];
        fetch('/api/auth/courses')
            .then(res => res.ok ? res.json() : [])
            .then(data => {
                coursesData = data;
                const preferredCourseObj = coursesData.find(c => c.code === request.preferredCourseCode);
                document.getElementById('requestStudentName').textContent = request.studentName;
                document.getElementById('requestStudentId').textContent = request.studentId;
                if (preferredCourseObj) {
                    document.getElementById('requestPreferredCourse').textContent = `${preferredCourseObj.name} (${preferredCourseObj.code})`;
                } else if (request.preferredCourseCode) {
                    document.getElementById('requestPreferredCourse').textContent = request.preferredCourseCode;
                } else {
                    document.getElementById('requestPreferredCourse').textContent = '';
                }
                // School Year (SY) and Semester
                let sy = request.academicYear || request.schoolYear || request.sy || 'N/A';
                let sem = request.semester || request.term || 'N/A';
                document.getElementById('requestTerm').textContent = `S.Y. ${sy} - ${sem}`;
                // Date Applied
                let dateApplied = request.requestDate || request.applicationDate || request.date;
                if (dateApplied) {
                    // If it's a Date object or ISO string, format it
                    let formattedDate = (typeof dateApplied === 'string' && dateApplied.length === 10)
                        ? dateApplied
                        : new Date(dateApplied).toLocaleDateString();
                    document.getElementById('requestDate').textContent = formattedDate;
                } else {
                    document.getElementById('requestDate').textContent = 'N/A';
                }
                document.getElementById('enrollmentProcessReason').value = '';
            });

        const closeModal = () => {
            modal.style.display = 'none';
            document.body.style.overflow = 'auto';
        };

        document.getElementById('closeEnrollmentProcessModal').onclick = closeModal;
        document.getElementById('cancelEnrollmentProcess').onclick = closeModal;

        document.getElementById('approveEnrollmentRequest').onclick = () => {
            const reason = document.getElementById('enrollmentProcessReason').value.trim();
            processEnrollmentRequest(request.id, 'approved', reason);
            closeModal();
        };

        document.getElementById('rejectEnrollmentRequest').onclick = () => {
            const reason = document.getElementById('enrollmentProcessReason').value.trim();
            if (!reason) {
                if (!confirm('No reason provided for rejection. Continue anyway?')) {
                    return;
                }
            }
            processEnrollmentRequest(request.id, 'rejected', reason);
            closeModal();
        };

        window.onclick = (event) => {
            if (event.target == modal) {
                closeModal();
            }
        };

        modal.style.display = 'block';
        document.body.style.overflow = 'hidden';
    }

    async function processEnrollmentRequest(requestId, newStatus, reason = "") {
        try {
            const response = await fetch('/api/auth/enrollment/requests/process', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ requestId, status: newStatus, remarks: reason })
            });
            if (response.ok) {
                showEnrollmentSuccessModal('Enrollment request processed successfully.');
                loadEnrollmentRequestsTable();
                loadStudentsTable();
                updateDashboardStats();
            } else {
                showEnrollmentSuccessModal('Failed to process enrollment request.', true);
            }
        } catch (error) {
            console.error('Error processing enrollment request:', error);
            showEnrollmentSuccessModal(`An error occurred while processing the request: ${error.message}`, true);
        }
    }

    // --- Curriculum CRUD ---
    async function loadCurriculumTable() {
        let curricula = [];
        try {
            const response = await fetch('/api/curriculum');
            if (response.ok) {
                curricula = await response.json();
            }
        } catch (e) {
            console.error('Failed to fetch curricula:', e);
        }
        const filterSelect = document.getElementById('curriculumCourseFilter');
        const selectedCourse = filterSelect ? filterSelect.value : '';
        lastCurriculumCourseFilter = selectedCourse;
        if (selectedCourse) {
            curricula = curricula.filter(c => c.courseCode === selectedCourse);
        }
        const tableBody = document.getElementById('curriculumTable')?.querySelector('tbody');
        if (!tableBody) return;
        tableBody.innerHTML = '';
        if (curricula.length === 0) {
            tableBody.innerHTML = '<tr><td colspan="5" style="text-align:center;">No curriculum data yet.</td></tr>';
            return;
        }
        for (const curriculum of curricula) {
            const row = tableBody.insertRow();
            row.insertCell().textContent = curriculum.courseCode;
            row.insertCell().textContent = curriculum.yearLevel;
            row.insertCell().textContent = curriculum.semester;
            const subjectCodes = curriculum.subjectCodes || '';
            const subjectCodesArray = Array.isArray(subjectCodes) ? subjectCodes : subjectCodes.split(',').filter(s => s.trim());
            row.insertCell().textContent = subjectCodesArray.join(', ');
            const actionsCell = row.insertCell();
            const editBtn = document.createElement('button');
            editBtn.textContent = 'Edit';
            editBtn.classList.add('btn', 'btn-sm', 'btn-edit');
            editBtn.onclick = () => openEditCurriculumModal(curriculum);
            const deleteBtn = document.createElement('button');
            deleteBtn.textContent = 'Delete';
            deleteBtn.classList.add('btn', 'btn-sm', 'btn-danger');
            deleteBtn.onclick = () => deleteCurriculum(curriculum.id);
            actionsCell.appendChild(editBtn);
            actionsCell.appendChild(deleteBtn);
        }
    }

    // Curriculum modal setup
    curriculumSubjectsSelect = document.getElementById('curriculumSubjects');
    curriculumRequiredUnitsInput = document.getElementById('curriculumRequiredUnits');
    curriculumUnitsDisplay = document.getElementById('curriculumUnitsDisplay');
    curriculumNavLink = document.querySelector('a[data-target="manageCurriculum"]');

    async function updateCurriculumUnitsDisplay() {
        if (!curriculumSubjectsSelect || !curriculumRequiredUnitsInput || !curriculumUnitsDisplay) return;
        
        const selectedOptions = Array.from(curriculumSubjectsSelect.selectedOptions);
        let totalUnits = 0;
        for (const opt of selectedOptions) {
            const match = opt.textContent.match(/\((\d+(?:\.\d+)?) units\)/);
            if (match) totalUnits += parseFloat(match[1]);
        }
        const requiredUnits = parseFloat(curriculumRequiredUnitsInput.value) || 0;
        curriculumUnitsDisplay.textContent = `Total Units: ${totalUnits} / Required: ${requiredUnits}`;
        if (totalUnits < requiredUnits) {
            curriculumUnitsDisplay.style.color = 'orange';
            curriculumUnitsDisplay.textContent += ' (Not enough units)';
        } else if (totalUnits > requiredUnits) {
            curriculumUnitsDisplay.style.color = 'red';
            curriculumUnitsDisplay.textContent += ' (Too many units)';
        } else {
            curriculumUnitsDisplay.style.color = 'green';
            curriculumUnitsDisplay.textContent += ' (OK)';
        }
        return { totalUnits, requiredUnits };
    }

    function openEditCurriculumModal(curriculum) {
        document.getElementById('curriculumModalTitle').textContent = 'Edit Curriculum';
        const form = document.getElementById('curriculumForm');
        form.reset();
        // First, populate the course dropdown, then set its value and continue
        populateCourseDropdown('curriculumCourseCode').then(() => {
            document.getElementById('curriculumEditId').value = curriculum.id;
            document.getElementById('curriculumCourseCode').value = curriculum.courseCode;
            document.getElementById('curriculumYearLevel').value = curriculum.yearLevel;
            document.getElementById('curriculumSemester').value = curriculum.semester;
            if (curriculumRequiredUnitsInput) curriculumRequiredUnitsInput.value = curriculum.requiredUnits || 25;
            // Handle both string and array formats for backward compatibility
            const subjectCodes = curriculum.subjectCodes || '';
            const subjectCodesArray = Array.isArray(subjectCodes) ? subjectCodes : subjectCodes.split(',').filter(s => s.trim());
            populateSubjectDropdown('curriculumSubjects', curriculum.courseCode, subjectCodesArray);
            document.getElementById('curriculumModal').style.display = 'block';
            document.body.style.overflow = 'hidden';
            updateCurriculumUnitsDisplay();
        });
    }

    function openAddCurriculumModal() {
        document.getElementById('curriculumModalTitle').textContent = 'Add Curriculum';
        const form = document.getElementById('curriculumForm');
        form.reset();
        document.getElementById('curriculumEditId').value = '';
        if (curriculumRequiredUnitsInput) curriculumRequiredUnitsInput.value = 25;
        populateCourseDropdown('curriculumCourseCode', lastCurriculumCourseFilter);
        populateSubjectDropdown('curriculumSubjects', lastCurriculumCourseFilter, []);
        document.getElementById('curriculumModal').style.display = 'block';
        document.body.style.overflow = 'hidden';
        updateCurriculumUnitsDisplay();
    }

    async function deleteCurriculum(id) {
        if (!confirm('Are you sure you want to delete this curriculum?')) return;
        try {
            const response = await fetch(`/api/curriculum/${id}`, { method: 'DELETE' });
            if (!response.ok) throw new Error('Failed to delete curriculum');
            await loadCurriculumTable();
        } catch (e) {
            alert(e.message);
        }
    }

    // Helper: Populate course dropdown
    async function populateCourseDropdown(selectId, selectedValue = '') {
        const select = document.getElementById(selectId);
        if (!select) return;
        try {
            const response = await fetch('/api/auth/courses');
            if (response.ok) {
                const courses = await response.json();
                select.innerHTML = '<option value="">-- Select Course --</option>';
                courses.forEach(course => {
                    const option = document.createElement('option');
                    option.value = course.code;
                    option.textContent = course.name;
                    if (course.code === selectedValue) option.selected = true;
                    select.appendChild(option);
                });
            }
        } catch (e) {
            console.error('Failed to fetch courses:', e);
        }
    }

    // Helper: Populate subject dropdown (filtered by course)
    async function populateSubjectDropdown(selectId, courseCode, selectedCodes = []) {
        const select = document.getElementById(selectId);
        if (!select) return;
        try {
            let url = '/api/auth/subjects';
            if (courseCode) url += `?courseCode=${encodeURIComponent(courseCode)}`;
            const response = await fetch(url);
            if (response.ok) {
                const subjects = await response.json();
                select.innerHTML = '';
                subjects.forEach(subject => {
                    const option = document.createElement('option');
                    option.value = subject.code;
                    option.textContent = `${subject.code} - ${subject.name} (${subject.units} units)`;
                    if (selectedCodes && selectedCodes.includes(subject.code)) option.selected = true;
                    select.appendChild(option);
                });
            }
        } catch (e) {
            console.error('Failed to fetch subjects:', e);
        }
    }

    // Helper: Populate section dropdown (filtered by course)
    async function populateSectionDropdown(selectId, selectedValue = '', courseCode = '') {
        const select = document.getElementById(selectId);
        if (!select) return;
        try {
            let url = '/api/auth/sections';
            if (courseCode) url += `?courseCode=${encodeURIComponent(courseCode)}`;
            const response = await fetch(url);
            if (response.ok) {
                const sections = await response.json();
                if (sections.length === 0) {
                    select.innerHTML = '';
                    return;
                }
                select.innerHTML = '<option value="">-- Select Section --</option>';
                sections.forEach(section => {
                    const option = document.createElement('option');
                    option.value = section.id;
                    option.textContent = section.name;
                    if (option.value === selectedValue) option.selected = true;
                    select.appendChild(option);
                });
            }
        } catch (e) {
            console.error('Failed to fetch sections:', e);
        }
    }

    // Attach curriculum section to sidebar navigation
    if (curriculumNavLink) {
        curriculumNavLink.addEventListener('click', () => {
            loadCurriculumTable();
        });
    }

    // Event listeners for curriculum modal
    document.getElementById('openAddCurriculumModal')?.addEventListener('click', openAddCurriculumModal);
    document.getElementById('closeCurriculumModal')?.addEventListener('click', () => {
        document.getElementById('curriculumModal').style.display = 'none';
        document.body.style.overflow = '';
    });
    document.getElementById('cancelCurriculumForm')?.addEventListener('click', () => {
        document.getElementById('curriculumModal').style.display = 'none';
        document.body.style.overflow = '';
    });

    document.getElementById('curriculumCourseCode')?.addEventListener('change', (e) => {
        populateSubjectDropdown('curriculumSubjects', e.target.value, []);
    });

    // Curriculum form submission
    document.getElementById('curriculumForm')?.addEventListener('submit', async (e) => {
        e.preventDefault();
        const { totalUnits, requiredUnits } = await updateCurriculumUnitsDisplay();
        if (totalUnits !== requiredUnits) {
            alert(`Total units must be exactly ${requiredUnits} to save this curriculum.`);
            return false;
        }
        
        const id = document.getElementById('curriculumEditId').value;
        const courseCode = document.getElementById('curriculumCourseCode').value;
        const yearLevel = parseInt(document.getElementById('curriculumYearLevel').value);
        const semester = document.getElementById('curriculumSemester').value;
        const subjectsSelect = document.getElementById('curriculumSubjects');
        const subjectCodesArray = Array.from(subjectsSelect.selectedOptions).map(opt => opt.value);
        const subjectCodes = subjectCodesArray.join(','); // Convert to comma-separated string
        const requiredUnitsValue = parseFloat(curriculumRequiredUnitsInput?.value) || 25;
        
        if (!courseCode || !yearLevel || !semester || subjectCodes.length === 0) {
            alert('All fields are required.');
            return;
        }
        
        const curriculumData = { courseCode, yearLevel, semester, subjectCodes, requiredUnits: requiredUnitsValue };
        console.log('Sending curriculum data:', curriculumData);
        
        try {
            let response;
            if (id) {
                response = await fetch(`/api/curriculum/${id}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(curriculumData)
                });
            } else {
                response = await fetch('/api/curriculum', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(curriculumData)
                });
            }
            
            console.log('Response status:', response.status);
            
            if (!response.ok) {
                const errorText = await response.text();
                console.error('Backend error:', errorText);
                throw new Error(`Server error: ${response.status} - ${errorText}`);
            }
            
            const result = await response.json();
            console.log('Curriculum saved successfully:', result);
            
            document.getElementById('curriculumModal').style.display = 'none';
            document.body.style.overflow = '';
            await loadCurriculumTable();
        } catch (e) {
            console.error('Error saving curriculum:', e);
            alert('Failed to save curriculum: ' + e.message);
        }
    });

    // Setup curriculum units display updates
    if (curriculumSubjectsSelect) {
        curriculumSubjectsSelect.addEventListener('change', updateCurriculumUnitsDisplay);
    }
    if (curriculumRequiredUnitsInput) {
        curriculumRequiredUnitsInput.addEventListener('input', updateCurriculumUnitsDisplay);
    }

    // Override populateSubjectDropdown to update units display
    origPopulateSubjectDropdown = populateSubjectDropdown;
    populateSubjectDropdown = async function(selectId, courseCode, selectedCodes = []) {
        await origPopulateSubjectDropdown(selectId, courseCode, selectedCodes);
        if (selectId === 'curriculumSubjects') {
            setTimeout(updateCurriculumUnitsDisplay, 100); // Small delay to ensure DOM is updated
        }
    };

    // --- Curriculum Filtering and User-Friendly Creation ---

    // Populate the course filter dropdown and set up filtering
    async function setupCurriculumCourseFilter() {
        const filterSelect = document.getElementById('curriculumCourseFilter');
        if (!filterSelect) return;
        try {
            const response = await fetch('/api/auth/courses');
            if (response.ok) {
                const courses = await response.json();
                filterSelect.innerHTML = '<option value="">-- All Courses --</option>';
                courses.forEach(course => {
                    const option = document.createElement('option');
                    option.value = course.code;
                    option.textContent = course.name;
                    filterSelect.appendChild(option);
                });
            }
        } catch (e) {
            filterSelect.innerHTML = '<option value="">Error loading courses</option>';
        }
        filterSelect.onchange = () => loadCurriculumTable();
    }

    // Store the last selected course filter for use in the modal
    lastCurriculumCourseFilter = '';

    // On page load, set up the curriculum course filter
    setupCurriculumCourseFilter();

    // Helper: Populate status dropdown
    function populateStatusDropdown(selectId, selectedValue = '', options = [], label = '') {
        const select = document.getElementById(selectId);
        if (!select) return;
        select.innerHTML = '';
        if (label) {
            const defaultOption = document.createElement('option');
            defaultOption.value = '';
            defaultOption.textContent = `-- Select ${label} --`;
            select.appendChild(defaultOption);
        }
        options.forEach(optionValue => {
            const option = document.createElement('option');
            option.value = optionValue;
            option.textContent = optionValue;
            if (optionValue === selectedValue) option.selected = true;
            select.appendChild(option);
        });
    }

    // Notification utility for admin panel
    function showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 12px 20px;
            border-radius: 6px;
            color: white;
            font-weight: 500;
            z-index: 1000;
            animation: slideInRight 0.3s ease-out;
            max-width: 300px;
            word-wrap: break-word;
        `;
        switch (type) {
            case 'success':
                notification.style.backgroundColor = '#4CAF50';
                break;
            case 'error':
                notification.style.backgroundColor = '#F44336';
                break;
            case 'warning':
                notification.style.backgroundColor = '#FF9800';
                break;
            default:
                notification.style.backgroundColor = '#2196F3';
        }
        notification.textContent = message;
        document.body.appendChild(notification);
        setTimeout(() => {
            notification.style.animation = 'slideOutRight 0.3s ease-in';
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 300);
        }, 3000);
    }

    // Helper to populate course dropdown
    async function populateCourseDropdownForStudent(selectId, selectedValue = '', readOnly = false) {
        const select = document.getElementById(selectId);
        if (!select) return;
        try {
            const response = await fetch('/api/auth/courses');
            if (response.ok) {
                const courses = await response.json();
                select.innerHTML = '<option value="">-- Select Course --</option>';
                courses.forEach(course => {
                    const option = document.createElement('option');
                    option.value = course.code;
                    option.textContent = `${course.name} (${course.code})`;
                    if (course.code === selectedValue) option.selected = true;
                    select.appendChild(option);
                });
            }
            select.disabled = !!readOnly;
        } catch (e) {
            select.innerHTML = '<option value="">Error loading courses</option>';
        }
    }

    // --- Schedule Modal Logic ---
    setupModal('scheduleModal', 'openAddScheduleModal', 'closeScheduleModal', 'scheduleForm',
        async (form) => {
            // Gather form data
            const id = form.scheduleEditId.value;
            const studentId = document.getElementById('scheduleStudentSelect').value;
            const subjectCode = form.scheduleSubjectCodeModal.value;
            const description = form.scheduleDescriptionModal.value.trim();
            const units = parseFloat(form.scheduleUnitsModal.value);
            const lec = parseInt(form.scheduleLecModal.value) || 0;
            const lab = parseInt(form.scheduleLabModal.value) || 0;
            const dayTime = form.scheduleDayModal.value;
            const startTime = form.scheduleTimeModal.value;
            const endTime = form.scheduleEndTimeModal.value;
            const timeRange = form.scheduleTimeRangeModal.value;
            const room = form.scheduleRoomModal.value.trim();
            const faculty = form.scheduleFacultyModal.value;
            const academicYear = form.scheduleAcademicYearModal.value.trim();
            const semester = form.scheduleSemesterModal.value;
            // Validation
            const errorDiv = document.getElementById('scheduleErrorMsg');
            errorDiv.textContent = '';
            if (!studentId || !subjectCode || !description || !units || !dayTime || !startTime || !endTime || !room || !faculty || !academicYear || !semester) {
                errorDiv.textContent = 'All fields are required.';
                return false;
            }
            // Frontend overlap validation (basic)
            const schedules = window.currentSchedules || [];
            const conflict = schedules.some(item =>
                item.id !== id &&
                item.dayTime === dayTime &&
                ((item.room === room) || (item.faculty === faculty)) &&
                ((startTime < item.endTime && endTime > item.startTime))
            );
            if (conflict) {
                errorDiv.textContent = 'Warning: Overlapping schedule detected for this room or faculty.';
            }
            // Compose day & time string for backend
            const scheduleData = {
                studentId, subjectCode, description, units, lec, lab,
                dayTime, startTime, endTime, timeRange, room, faculty, academicYear, semester
            };
            try {
                let response;
                if (id) {
                    response = await fetch(`/api/auth/schedules/${id}`, {
                        method: 'PUT',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(scheduleData)
                    });
                } else {
                    response = await fetch('/api/auth/schedules', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(scheduleData)
                    });
                }
                if (!response.ok) {
                    const errorText = await response.text();
                    errorDiv.textContent = errorText || 'Failed to save schedule item';
                    return false;
                }
                await loadSchedulesTable();
                showNotification('Schedule item saved successfully.', 'success');
                return true;
            } catch (e) {
                errorDiv.textContent = e.message;
                return false;
            }
        },
        async () => {
            document.getElementById('scheduleModalTitle').textContent = 'Add Schedule Item';
            document.getElementById('scheduleForm').reset();
            document.getElementById('scheduleEditId').value = '';
            document.getElementById('scheduleErrorMsg').textContent = '';
            // Populate subject dropdown
            await populateSubjectDropdown('scheduleSubjectCodeModal');
            // Populate faculty dropdown (initially unfiltered)
            await populateFacultyDropdown('scheduleFacultyModal');
            // Populate academic year dropdown with a range of years
            const yearSelect = document.getElementById('scheduleAcademicYearModal');
            if (yearSelect) {
                yearSelect.innerHTML = '<option value="">-- Select Academic Year --</option>';
                const currentYear = new Date().getFullYear();
                for (let i = -2; i <= 5; i++) {
                    const start = currentYear + i;
                    const end = start + 1;
                    const value = `${start}-${end}`;
                    const option = document.createElement('option');
                    option.value = value;
                    option.textContent = value;
                    yearSelect.appendChild(option);
                }
            }
            // Set up auto-fill for subject
            document.getElementById('scheduleSubjectCodeModal').onchange = async (e) => {
                const code = e.target.value;
                const response = await fetch('/api/auth/subjects');
                if (response.ok) {
                    const subjects = await response.json();
                    const subj = subjects.find(s => s.code === code);
                    if (subj) {
                        document.getElementById('scheduleDescriptionModal').value = subj.name;
                        document.getElementById('scheduleUnitsModal').value = subj.units;
                        document.getElementById('scheduleLecModal').value = subj.lec || '';
                        document.getElementById('scheduleLabModal').value = subj.lab || '';
                    }
                }
                // Filter faculty by selected subject
                await populateFacultyDropdown('scheduleFacultyModal', '', code);
                autoCalculateEndTimeAndRange();
            };
            // If a subject is already selected (e.g., on edit), filter faculty immediately
            const subjSelect = document.getElementById('scheduleSubjectCodeModal');
            if (subjSelect && subjSelect.value) {
                await populateFacultyDropdown('scheduleFacultyModal', '', subjSelect.value);
            }
            // Auto-calculate end time and time range when start time, lec, or lab changes
            ['scheduleTimeModal', 'scheduleLecModal', 'scheduleLabModal'].forEach(id => {
                document.getElementById(id).oninput = autoCalculateEndTimeAndRange;
            });
            function autoCalculateEndTimeAndRange() {
                const start = document.getElementById('scheduleTimeModal').value;
                const lec = parseInt(document.getElementById('scheduleLecModal').value) || 0;
                const lab = parseInt(document.getElementById('scheduleLabModal').value) || 0;
                if (!start) return;
                const [h, m] = start.split(':').map(Number);
                const totalHours = lec + lab;
                if (isNaN(h) || isNaN(m) || !totalHours) return;
                let endH = h + totalHours;
                let endM = m;
                if (endH >= 24) endH -= 24;
                const end = `${String(endH).padStart(2, '0')}:${String(endM).padStart(2, '0')}`;
                document.getElementById('scheduleEndTimeModal').value = end;
                document.getElementById('scheduleTimeRangeModal').value = `${start} - ${end}`;
            }
        }, 'cancelScheduleForm'
    );

    function openEditScheduleModal(item) {
        document.getElementById('scheduleModalTitle').textContent = 'Edit Schedule Item';
        const form = document.getElementById('scheduleForm');
        form.reset();
        form.scheduleEditId.value = item.id;
        form.scheduleSubjectCodeModal.value = item.subjectCode;
        form.scheduleDescriptionModal.value = item.description;
        form.scheduleUnitsModal.value = item.units;
        form.scheduleLecModal.value = item.lec;
        form.scheduleLabModal.value = item.lab;
        form.scheduleDayModal.value = item.dayTime;
        form.scheduleRoomModal.value = item.room;
        form.scheduleAcademicYearModal.value = item.academicYear;
        form.scheduleSemesterModal.value = item.semester;
        form.scheduleTimeModal.value = item.startTime || '';
        form.scheduleEndTimeModal.value = item.endTime || '';
        form.scheduleTimeRangeModal.value = item.timeRange || ((item.startTime && item.endTime) ? `${item.startTime} - ${item.endTime}` : '');
        populateSubjectDropdown('scheduleSubjectCodeModal', item.subjectCode);
        populateFacultyDropdown('scheduleFacultyModal', item.faculty);
        form.scheduleFacultyModal.value = item.faculty;
        document.getElementById('scheduleErrorMsg').textContent = '';
        document.getElementById('scheduleModal').style.display = 'block';
        document.body.style.overflow = 'hidden';
    }

    // Patch: store current schedules for frontend validation
    async function loadSchedulesTable() {
        let schedules = [];
        try {
            const studentId = document.getElementById('scheduleStudentSelect').value;
            const academicYear = document.getElementById('scheduleAcademicYear').value;
            const semester = document.getElementById('scheduleSemester').value;
            let url = `/api/auth/schedules/${studentId}`;
            if (academicYear) url += `?academicYear=${encodeURIComponent(academicYear)}`;
            if (semester) url += `${academicYear ? '&' : '?'}semester=${encodeURIComponent(semester)}`;
            const response = await fetch(url);
            if (response.ok) {
                schedules = await response.json();
            }
        } catch (e) {
            console.error('Failed to fetch schedules from backend:', e);
        }
        window.currentSchedules = schedules; // For frontend validation
        const tableBody = document.getElementById('schedulesTable')?.querySelector('tbody');
        if (!tableBody) return;
        tableBody.innerHTML = '';
        schedules.forEach(item => {
            const row = tableBody.insertRow();
            row.insertCell().textContent = item.subjectCode;
            row.insertCell().textContent = item.description;
            row.insertCell().textContent = item.units;
            row.insertCell().textContent = item.lec;
            row.insertCell().textContent = item.lab;
            row.insertCell().textContent = item.dayTime;
            row.insertCell().textContent = item.room;
            row.insertCell().textContent = item.faculty;
            row.insertCell().textContent = item.academicYear;
            row.insertCell().textContent = item.semester;
            row.insertCell().textContent = item.startTime || '';
            row.insertCell().textContent = item.endTime || '';
            row.insertCell().textContent = item.timeRange || ((item.startTime && item.endTime) ? `${item.startTime} - ${item.endTime}` : '');
            const actionsCell = row.insertCell();
            const editBtn = document.createElement('button');
            editBtn.textContent = 'Edit';
            editBtn.classList.add('btn', 'btn-sm', 'btn-edit');
            editBtn.onclick = () => openEditScheduleModal(item);
            const deleteBtn = document.createElement('button');
            deleteBtn.textContent = 'Delete';
            deleteBtn.classList.add('btn', 'btn-sm', 'btn-danger');
            deleteBtn.onclick = async () => {
                if (confirm('Are you sure you want to delete this schedule item?')) {
                    try {
                        const response = await fetch(`/api/auth/schedules/${item.id}`, { method: 'DELETE' });
                        if (!response.ok) throw new Error('Failed to delete schedule item');
                        await loadSchedulesTable();
                        showNotification('Schedule item deleted successfully.', 'success');
                    } catch (e) {
                        showNotification(e.message, 'error');
                    }
                }
            };
            actionsCell.appendChild(editBtn);
            actionsCell.appendChild(deleteBtn);
        });
    }

    // Modified: Filter faculty by assigned subject
    async function populateFacultyDropdown(selectId, selectedValue = '', subjectCode = '') {
        const select = document.getElementById(selectId);
        if (!select) return;
        try {
            const response = await fetch('/api/auth/faculty');
            if (response.ok) {
                const facultyList = await response.json();
                select.innerHTML = '<option value="">-- Select Faculty --</option>';
                let filtered = facultyList;
                if (subjectCode) {
                    filtered = facultyList.filter(faculty => Array.isArray(faculty.assignedSubjects) && faculty.assignedSubjects.includes(subjectCode));
                }
                filtered.forEach(faculty => {
                    const option = document.createElement('option');
                    option.value = faculty.name;
                    option.textContent = faculty.name;
                    if (faculty.name === selectedValue) option.selected = true;
                    select.appendChild(option);
                });
                // If no faculty available for this subject, show a message
                if (filtered.length === 0) {
                    const option = document.createElement('option');
                    option.value = '';
                    option.textContent = '-- No faculty assigned to this subject --';
                    option.disabled = true;
                    select.appendChild(option);
                }
            }
        } catch (e) {
            select.innerHTML = '<option value="">Error loading faculty</option>';
        }
    }

    // --- Manage Schedules Section ---
    async function populateScheduleStudentDropdown() {
        const select = document.getElementById('scheduleStudentSelect');
        if (!select) return;
        try {
            const response = await fetch('/api/auth/users');
            if (response.ok) {
                const users = await response.json();
                // Show all students regardless of status/admissionStatus
                const students = users.filter(u => u.role === 'student')
                    .sort((a,b) => a.name.localeCompare(b.name));
                select.innerHTML = '<option value="">-- Select Student --</option>';
                students.forEach(student => {
                    const option = document.createElement('option');
                    option.value = student.id;
                    option.textContent = `${student.name} (${student.id})`;
                    select.appendChild(option);
                });
            }
        } catch (e) {
            select.innerHTML = '<option value="">Error loading students</option>';
        }
    }
    async function populateScheduleYearSemesterDropdowns(studentId) {
        const yearSelect = document.getElementById('scheduleAcademicYear');
        const semSelect = document.getElementById('scheduleSemester');
        yearSelect.innerHTML = '<option value="">All Years</option>';
        semSelect.innerHTML = '<option value="">All Semesters</option>';
        if (!studentId) return;
        try {
            const response = await fetch(`/api/auth/schedules/${studentId}`);
            if (response.ok) {
                const schedules = await response.json();
                const years = [...new Set(schedules.map(s => s.academicYear).filter(Boolean))];
                years.sort();
                years.forEach(y => {
                    const option = document.createElement('option');
                    option.value = y;
                    option.textContent = y;
                    yearSelect.appendChild(option);
                });
                const sems = [...new Set(schedules.map(s => s.semester).filter(Boolean))];
                sems.sort();
                sems.forEach(s => {
                    const option = document.createElement('option');
                    option.value = s;
                    option.textContent = s;
                    semSelect.appendChild(option);
                });
            }
        } catch (e) {
            // ignore
        }
    }
    // --- Event Listeners for Manage Schedules ---
    const studentSelect = document.getElementById('scheduleStudentSelect');
    const yearSelect = document.getElementById('scheduleAcademicYear');
    const semSelect = document.getElementById('scheduleSemester');
    const addBtn = document.getElementById('openAddScheduleModal');
    if (studentSelect) {
        studentSelect.onchange = async () => {
            await populateScheduleYearSemesterDropdowns(studentSelect.value);
            yearSelect.value = '';
            semSelect.value = '';
            addBtn.disabled = !studentSelect.value;
            await loadSchedulesTable();
        };
    }
    if (yearSelect) {
        yearSelect.onchange = loadSchedulesTable;
    }
    if (semSelect) {
        semSelect.onchange = loadSchedulesTable;
    }
    if (addBtn) {
        addBtn.disabled = !studentSelect.value;
    }
    // Patch: show message if no student or no schedules
    const origLoadSchedulesTable = loadSchedulesTable;
    loadSchedulesTable = async function() {
        const studentId = studentSelect.value;
        const year = yearSelect.value;
        const sem = semSelect.value;
        const tableBody = document.getElementById('schedulesTable')?.querySelector('tbody');
        if (!studentId) {
            if (tableBody) tableBody.innerHTML = '<tr><td colspan="13" style="text-align:center;color:#888;">Please select a student to view schedules.</td></tr>';
            return;
        }
        // Fetch all schedules for the student
        let schedules = [];
        try {
            let url = `/api/auth/schedules/${studentId}`;
            const response = await fetch(url);
            if (response.ok) {
                schedules = await response.json();
            }
        } catch (e) {
            schedules = [];
        }
        // Filter schedules by year and/or semester
        let filtered = schedules;
        if (year) filtered = filtered.filter(s => s.academicYear === year);
        if (sem) filtered = filtered.filter(s => s.semester === sem);
        window.currentSchedules = filtered; // For frontend validation
        if (!tableBody) return;
        tableBody.innerHTML = '';
        filtered.forEach(item => {
            const row = tableBody.insertRow();
            row.insertCell().textContent = item.subjectCode;
            row.insertCell().textContent = item.description;
            row.insertCell().textContent = item.units;
            row.insertCell().textContent = item.lec;
            row.insertCell().textContent = item.lab;
            row.insertCell().textContent = item.dayTime;
            row.insertCell().textContent = item.room;
            row.insertCell().textContent = item.faculty;
            row.insertCell().textContent = item.academicYear;
            row.insertCell().textContent = item.semester;
            row.insertCell().textContent = item.startTime || '';
            row.insertCell().textContent = item.endTime || '';
            row.insertCell().textContent = item.timeRange || ((item.startTime && item.endTime) ? `${item.startTime} - ${item.endTime}` : '');
            const actionsCell = row.insertCell();
            const editBtn = document.createElement('button');
            editBtn.textContent = 'Edit';
            editBtn.classList.add('btn', 'btn-sm', 'btn-edit');
            editBtn.onclick = () => openEditScheduleModal(item);
            const deleteBtn = document.createElement('button');
            deleteBtn.textContent = 'Delete';
            deleteBtn.classList.add('btn', 'btn-sm', 'btn-danger');
            deleteBtn.onclick = async () => {
                if (confirm('Are you sure you want to delete this schedule item?')) {
                    try {
                        const response = await fetch(`/api/auth/schedules/${item.id}`, { method: 'DELETE' });
                        if (!response.ok) throw new Error('Failed to delete schedule item');
                        await loadSchedulesTable();
                        showNotification('Schedule item deleted successfully.', 'success');
                    } catch (e) {
                        showNotification(e.message, 'error');
                    }
                }
            };
            actionsCell.appendChild(editBtn);
            actionsCell.appendChild(deleteBtn);
        });
        // If no schedules, show message
        if (filtered.length === 0) {
            tableBody.innerHTML = '<tr><td colspan="13" style="text-align:center;color:#888;">No schedules found for the selected filters.</td></tr>';
        }
    };
    // Initial population
    populateScheduleStudentDropdown();

    // Helper to convert single year to range (e.g., 2026 -> 2025-2026)
    function toYearRange(year) {
        if (!year) return '';
        if (/^\d{4}-\d{4}$/.test(year)) return year;
        if (/^\d{4}$/.test(year)) {
            const start = parseInt(year) - 1;
            return `${start}-${year}`;
        }
        return year;
    }

    // --- Accounts Management ---
    async function loadAccountsTable() {
        let accounts = [];
        let students = [];
        
        try {
            // Fetch all student accounts
            const accountsResponse = await fetch('/api/auth/accounts');
            if (accountsResponse.ok) {
                accounts = await accountsResponse.json();
            } else {
                throw new Error(`Failed to fetch accounts: ${accountsResponse.status}`);
            }
            
            // Fetch all students for name lookup
            const studentsResponse = await fetch('/api/auth/users');
            if (studentsResponse.ok) {
                const allUsers = await studentsResponse.json();
                students = allUsers.filter(user => user.role === 'student');
            } else {
                throw new Error(`Failed to fetch students: ${studentsResponse.status}`);
            }
        } catch (e) {
            console.error('Failed to fetch accounts data:', e);
            showNotification('Failed to load accounts data: ' + e.message, 'error');
            return;
        }
        
        const tableBody = document.getElementById('accountsTable')?.querySelector('tbody');
        const searchInput = document.getElementById('accountSearchInput');
        
        if (!tableBody) return;
        
        // Filter accounts based on search
        let filteredAccounts = accounts;
        if (searchInput && searchInput.value.trim()) {
            const searchTerm = searchInput.value.toLowerCase();
            filteredAccounts = accounts.filter(account => {
                const student = students.find(s => s.id === account.studentId);
                const studentName = student ? student.name.toLowerCase() : '';
                const studentId = account.studentId.toLowerCase();
                return studentName.includes(searchTerm) || studentId.includes(searchTerm);
            });
        }
        
        // Sort accounts by remaining balance (highest first)
        filteredAccounts.sort((a, b) => (b.remainingBalance || 0) - (a.remainingBalance || 0));
        
        tableBody.innerHTML = '';
        
        if (filteredAccounts.length === 0) {
            const row = tableBody.insertRow();
            const cell = row.insertCell();
            cell.colSpan = 7;
            cell.innerHTML = `
                <div style="text-align: center; padding: 40px; color: #666;">
                    <div style="font-size: 1.2em; margin-bottom: 10px;">
                        ${searchInput && searchInput.value.trim() ? '🔍 No accounts found matching your search.' : '📊 No student accounts available.'}
                    </div>
                    <div style="font-size: 0.9em; color: #888;">
                        ${searchInput && searchInput.value.trim() ? 'Try adjusting your search terms.' : 'Student accounts will appear here once they are enrolled.'}
                    </div>
                </div>
            `;
            return;
        }
        
        // Add summary row
        const totalBalance = filteredAccounts.reduce((sum, acc) => sum + (acc.totalBalance || 0), 0);
        const totalRemaining = filteredAccounts.reduce((sum, acc) => sum + (acc.remainingBalance || 0), 0);
        const totalPaid = totalBalance - totalRemaining;
        
        const summaryRow = tableBody.insertRow();
        summaryRow.style.backgroundColor = '#f8f9fa';
        summaryRow.style.fontWeight = 'bold';
        summaryRow.insertCell().textContent = `Total (${filteredAccounts.length} accounts)`;
        summaryRow.insertCell().textContent = '';
        summaryRow.insertCell().textContent = `₱${totalBalance.toFixed(2)}`;
        summaryRow.insertCell().textContent = `₱${totalRemaining.toFixed(2)}`;
        summaryRow.insertCell().textContent = '';
        summaryRow.insertCell().textContent = '';
        summaryRow.insertCell().textContent = `₱${totalPaid.toFixed(2)} paid`;
        
        filteredAccounts.forEach(account => {
            const student = students.find(s => s.id === account.studentId);
            const studentName = student ? student.name : 'Unknown Student';
            const remainingBalance = account.remainingBalance || 0;
            const totalBalance = account.totalBalance || 0;
            
            const row = tableBody.insertRow();
            
            // Student ID
            const idCell = row.insertCell();
            idCell.textContent = account.studentId;
            idCell.style.fontFamily = 'monospace';
            idCell.style.fontWeight = 'bold';
            
            // Student Name
            const nameCell = row.insertCell();
            nameCell.textContent = studentName;
            nameCell.style.maxWidth = '200px';
            nameCell.style.overflow = 'hidden';
            nameCell.style.textOverflow = 'ellipsis';
            nameCell.style.whiteSpace = 'nowrap';
            
            // Total Balance
            const totalCell = row.insertCell();
            totalCell.textContent = `₱${totalBalance.toFixed(2)}`;
            totalCell.style.fontWeight = 'bold';
            totalCell.style.color = '#495057';
            
            // Remaining Balance
            const remainingCell = row.insertCell();
            remainingCell.textContent = `₱${remainingBalance.toFixed(2)}`;
            remainingCell.style.fontWeight = 'bold';
            if (remainingBalance > 0) {
                remainingCell.style.color = '#dc3545'; // Red for outstanding balance
            } else {
                remainingCell.style.color = '#28a745'; // Green for fully paid
            }
            
            // Academic Year
            const yearCell = row.insertCell();
            yearCell.textContent = account.academicYear || 'N/A';
            yearCell.style.color = '#6c757d';
            
            // Semester
            const semCell = row.insertCell();
            semCell.textContent = account.semester || 'N/A';
            semCell.style.color = '#6c757d';
            
            // Actions
            const actionsCell = row.insertCell();
            actionsCell.style.whiteSpace = 'nowrap';
            
            // View Account button
            const viewBtn = document.createElement('button');
            viewBtn.textContent = '👁️ View';
            viewBtn.classList.add('btn', 'btn-sm', 'btn-primary');
            viewBtn.style.marginRight = '5px';
            viewBtn.title = 'View detailed account statement';
            viewBtn.onclick = () => openAccountStatementModal(account, studentName);
            
            // Add Payment button
            const addPaymentBtn = document.createElement('button');
            addPaymentBtn.textContent = '💰 Add Payment';
            addPaymentBtn.classList.add('btn', 'btn-sm', 'btn-success');
            addPaymentBtn.title = 'Add a new payment';
            addPaymentBtn.onclick = () => openAddPaymentModal(account, studentName);
            
            // Disable Add Payment if fully paid
            if (remainingBalance <= 0) {
                addPaymentBtn.disabled = true;
                addPaymentBtn.textContent = '✅ Paid';
                addPaymentBtn.classList.remove('btn-success');
                addPaymentBtn.classList.add('btn-secondary');
            }
            
            actionsCell.appendChild(viewBtn);
            actionsCell.appendChild(addPaymentBtn);
        });
    }
    
    function openAccountStatementModal(account, studentName) {
        const modal = document.getElementById('accountStatementModal');
        const closeBtn = document.getElementById('closeAccountStatementModal');
        const closeStatementBtn = document.getElementById('closeAccountStatement');
        
        // Populate account details
        document.getElementById('statementStudentName').textContent = studentName;
        document.getElementById('statementStudentId').textContent = account.studentId;
        document.getElementById('statementAcademicYear').textContent = account.academicYear || 'N/A';
        document.getElementById('statementSemester').textContent = account.semester || 'N/A';
        document.getElementById('statementTotalBalance').textContent = account.totalBalance?.toFixed(2) || '0.00';
        document.getElementById('statementRemainingBalance').textContent = account.remainingBalance?.toFixed(2) || '0.00';
        
        // Populate payment history
        const paymentHistoryList = document.getElementById('paymentHistoryList');
        paymentHistoryList.innerHTML = '';
        
        if (account.payments && account.payments.length > 0) {
            account.payments.forEach((payment, index) => {
                const paymentDiv = document.createElement('div');
                paymentDiv.style.padding = '8px';
                paymentDiv.style.borderBottom = '1px solid #eee';
                paymentDiv.style.marginBottom = '5px';
                
                // Parse payment string: "2024-06-22: 5000.00 - Tuition Fee Payment"
                const parts = payment.split(': ');
                if (parts.length >= 2) {
                    const date = parts[0];
                    const amountAndDesc = parts[1].split(' - ');
                    const amount = parseFloat(amountAndDesc[0]) || 0;
                    const description = amountAndDesc[1] || 'Payment';
                    
                    paymentDiv.innerHTML = `
                        <strong>${new Date(date).toLocaleDateString()}</strong><br>
                        <span style="color: #28a745;">₱${amount.toFixed(2)}</span> - ${description}
                    `;
                } else {
                    paymentDiv.textContent = payment;
                }
                
                paymentHistoryList.appendChild(paymentDiv);
            });
        } else {
            paymentHistoryList.innerHTML = '<div style="text-align: center; color: #666; padding: 20px;">No payment history available.</div>';
        }
        
        // Set up event listeners
        const closeModal = () => {
            modal.style.display = 'none';
            document.body.style.overflow = 'auto';
        };
        
        closeBtn.onclick = closeModal;
        closeStatementBtn.onclick = closeModal;
        
        // Add Payment button functionality
        document.getElementById('addPaymentButton').onclick = () => {
            closeModal();
            openAddPaymentModal(account, studentName);
        };
        
        // Close on outside click
        window.onclick = (event) => {
            if (event.target === modal) {
                closeModal();
            }
        };
        
        modal.style.display = 'block';
        document.body.style.overflow = 'hidden';
    }
    
    function openAddPaymentModal(account, studentName) {
        // Create modal if it doesn't exist
        let paymentModal = document.getElementById('addPaymentModal');
        if (!paymentModal) {
            paymentModal = document.createElement('div');
            paymentModal.id = 'addPaymentModal';
            paymentModal.className = 'modal';
            paymentModal.innerHTML = `
                <div class="modal-content" style="max-width: 600px;">
                    <div class="modal-header">
                        <h3>Add Payment</h3>
                        <button class="close-button" id="closeAddPaymentModal">×</button>
                    </div>
                    <div class="modal-body">
                        <div style="background: #f8f9fa; padding: 15px; border-radius: 5px; margin-bottom: 20px;">
                            <h4 style="margin: 0 0 10px 0; color: #495057;">Account Summary</h4>
                            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px; font-size: 0.9em;">
                                <div><strong>Student:</strong> <span id="paymentStudentNameDisplay"></span></div>
                                <div><strong>Student ID:</strong> <span id="paymentStudentIdDisplay"></span></div>
                                <div><strong>Total Balance:</strong> <span id="paymentTotalBalanceDisplay"></span></div>
                                <div><strong>Remaining Balance:</strong> <span id="paymentRemainingBalanceDisplay"></span></div>
                            </div>
                        </div>
                        <form id="addPaymentForm">
                            <input type="hidden" id="paymentStudentId">
                            <div class="form-group">
                                <label for="paymentAmount">Payment Amount (₱):</label>
                                <input type="number" id="paymentAmount" step="0.01" min="0.01" required>
                                <small style="color: #6c757d;">Maximum payment: ₱<span id="maxPaymentAmount">0.00</span></small>
                            </div>
                            <div class="form-group">
                                <label for="paymentDate">Payment Date:</label>
                                <input type="date" id="paymentDate" required>
                            </div>
                            <div class="form-group">
                                <label for="paymentDescription">Payment Description:</label>
                                <select id="paymentDescription" required>
                                    <option value="">-- Select Payment Type --</option>
                                    <option value="Tuition Fee Payment">Tuition Fee Payment</option>
                                    <option value="Miscellaneous Fee">Miscellaneous Fee</option>
                                    <option value="Laboratory Fee">Laboratory Fee</option>
                                    <option value="Library Fee">Library Fee</option>
                                    <option value="Student Organization Fee">Student Organization Fee</option>
                                    <option value="Other">Other</option>
                                </select>
                            </div>
                            <div class="form-group" id="otherDescriptionGroup" style="display: none;">
                                <label for="otherDescription">Other Description:</label>
                                <input type="text" id="otherDescription" placeholder="Specify payment description">
                            </div>
                        </form>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" id="cancelAddPayment">Cancel</button>
                        <button type="submit" class="btn btn-primary" form="addPaymentForm">Process Payment</button>
                    </div>
                </div>
            `;
            document.body.appendChild(paymentModal);
        }
        
        // Populate account summary
        document.getElementById('paymentStudentNameDisplay').textContent = studentName;
        document.getElementById('paymentStudentIdDisplay').textContent = account.studentId;
        document.getElementById('paymentTotalBalanceDisplay').textContent = `₱${account.totalBalance?.toFixed(2) || '0.00'}`;
        document.getElementById('paymentRemainingBalanceDisplay').textContent = `₱${account.remainingBalance?.toFixed(2) || '0.00'}`;
        document.getElementById('maxPaymentAmount').textContent = (account.remainingBalance || 0).toFixed(2);
        
        // Populate form
        document.getElementById('paymentStudentId').value = account.studentId;
        document.getElementById('paymentAmount').value = '';
        document.getElementById('paymentAmount').max = account.remainingBalance || 0;
        document.getElementById('paymentDate').value = new Date().toISOString().split('T')[0];
        document.getElementById('paymentDescription').value = '';
        document.getElementById('otherDescription').value = '';
        document.getElementById('otherDescriptionGroup').style.display = 'none';
        
        // Set up event listeners
        const closeModal = () => {
            paymentModal.style.display = 'none';
            document.body.style.overflow = 'auto';
        };
        
        document.getElementById('closeAddPaymentModal').onclick = closeModal;
        document.getElementById('cancelAddPayment').onclick = closeModal;
        
        // Handle description dropdown change
        document.getElementById('paymentDescription').onchange = function() {
            const otherGroup = document.getElementById('otherDescriptionGroup');
            if (this.value === 'Other') {
                otherGroup.style.display = 'block';
                document.getElementById('otherDescription').required = true;
            } else {
                otherGroup.style.display = 'none';
                document.getElementById('otherDescription').required = false;
            }
        };
        
        // Handle form submission
        document.getElementById('addPaymentForm').onsubmit = async (e) => {
            e.preventDefault();
            
            const amount = parseFloat(document.getElementById('paymentAmount').value);
            const date = document.getElementById('paymentDate').value;
            let description = document.getElementById('paymentDescription').value;
            
            // Handle "Other" description
            if (description === 'Other') {
                const otherDesc = document.getElementById('otherDescription').value.trim();
                if (!otherDesc) {
                    showNotification('Please specify the payment description', 'error');
                    return;
                }
                description = otherDesc;
            }
            
            if (amount <= 0) {
                showNotification('Payment amount must be greater than 0', 'error');
                return;
            }
            
            if (amount > account.remainingBalance) {
                showNotification('Payment amount cannot exceed remaining balance', 'error');
                return;
            }
            
            // Show confirmation
            if (!confirm(`Process payment of ₱${amount.toFixed(2)} for ${studentName}?\n\nDescription: ${description}\nDate: ${date}`)) {
                return;
            }
            
            try {
                const response = await fetch('/api/auth/account/payment', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        studentId: account.studentId,
                        amount: amount,
                        date: date,
                        description: description
                    })
                });
                
                if (response.ok) {
                    showNotification(`✅ Payment of ₱${amount.toFixed(2)} processed successfully for ${studentName}`, 'success');
                    closeModal();
                    await loadAccountsTable(); // Refresh the table
                } else {
                    const errorText = await response.text();
                    showNotification(errorText || 'Failed to process payment', 'error');
                }
            } catch (error) {
                showNotification(`Failed to process payment: ${error.message}`, 'error');
            }
        };
        
        // Close on outside click
        window.onclick = (event) => {
            if (event.target === paymentModal) {
                closeModal();
            }
        };
        
        paymentModal.style.display = 'block';
        document.body.style.overflow = 'hidden';
    }
    
    // Set up search functionality for accounts
    function setupAccountsSearch() {
        const searchInput = document.getElementById('accountSearchInput');
        if (searchInput) {
            let searchTimeout;
            searchInput.addEventListener('input', () => {
                clearTimeout(searchTimeout);
                searchTimeout = setTimeout(() => {
                    loadAccountsTable();
                }, 300);
            });
        }
    }

    // --- Sections CRUD ---
    async function deleteSection(sectionId) {
        if (!confirm('Are you sure you want to delete this section?')) return;
        try {
            const response = await fetch(`/api/auth/sections/${sectionId}`, { method: 'DELETE' });
            if (!response.ok) throw new Error('Failed to delete section');
            await loadSectionsTable();
            showNotification('Section deleted successfully.', 'success');
        } catch (e) {
            showNotification(e.message, 'error');
        }
    }
});

