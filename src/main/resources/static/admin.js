// Central state management for Manage Schedules (must be at the top for initialization order)
window.manageSchedulesState = {
    currentStep: 1,
    selectedCourse: null,
    selectedSection: null,
    selectedStudent: null,
    selectedAcademicYear: null,
    selectedSemester: null,
    schedules: [],
    isLoading: false,
    error: null,
    cache: {
        courses: null,
        sections: {},
        students: {},
        schedules: {}
    }
};

// State management functions
function updateManageSchedulesState(newState) {
    Object.assign(manageSchedulesState, newState);
    updateUIFromState();
}

function resetManageSchedulesState() {
    Object.assign(manageSchedulesState, {
        currentStep: 1,
        selectedCourse: null,
        selectedSection: null,
        selectedStudent: null,
        selectedAcademicYear: null,
        selectedSemester: null,
        schedules: [],
        isLoading: false,
        error: null,
        cache: {
            courses: null,
            sections: {},
            students: {},
            schedules: {}
        }
    });
    updateUIFromState();
}

function updateUIFromState() {
    const { currentStep, selectedCourse, selectedSection, selectedStudent, isLoading, error } = manageSchedulesState;
    
    // Update step visibility
    showStep(currentStep);
    
    // Update dropdowns
    updateDropdownSelections();
    
    // Update button states
    updateButtonStates();
    
    // Show/hide loading and error states
    showLoadingState(isLoading);
    showErrorState(error);
}

// UI Control Functions
function showStep(stepNumber) {
    const steps = ['step0-course-filter', 'step1-actions', 'step2-section', 'step3-student', 'step4-filter', 'step5-table'];
    steps.forEach((stepId, index) => {
        const element = document.getElementById(stepId);
        if (element) {
            if (index === 0) {
                // Course filter is always visible
                element.style.display = '';
            } else if (index === 1) {
                // Actions step is visible when step 1 is active
                element.style.display = stepNumber === 1 ? '' : 'none';
            } else {
                // Other steps are visible when current step >= their index
                element.style.display = stepNumber >= index ? '' : 'none';
            }
        }
    });
}

function updateDropdownSelections() {
    const { selectedCourse, selectedSection, selectedStudent, selectedAcademicYear, selectedSemester } = manageSchedulesState;
    
    // Update course filter
    const courseFilter = document.getElementById('scheduleCourseFilter');
    if (courseFilter && selectedCourse !== courseFilter.value) {
        courseFilter.value = selectedCourse || '';
    }
    
    // Update section dropdown
    const sectionSelect = document.getElementById('scheduleSectionSelect');
    if (sectionSelect && selectedSection !== sectionSelect.value) {
        sectionSelect.value = selectedSection || '';
    }
    
    // Update student dropdown
    const studentSelect = document.getElementById('scheduleStudentSelect');
    if (studentSelect && selectedStudent !== studentSelect.value) {
        studentSelect.value = selectedStudent || '';
    }
    
    // Update academic year dropdown
    const yearSelect = document.getElementById('scheduleAcademicYear');
    if (yearSelect && selectedAcademicYear !== yearSelect.value) {
        yearSelect.value = selectedAcademicYear || '';
    }
    
    // Update semester dropdown
    const semesterSelect = document.getElementById('scheduleSemester');
    if (semesterSelect && selectedSemester !== semesterSelect.value) {
        semesterSelect.value = selectedSemester || '';
    }
}

function updateButtonStates() {
    const { selectedCourse } = manageSchedulesState;
    const bulkBtn = document.getElementById('openBulkScheduleModal');
    
    if (bulkBtn) {
        bulkBtn.disabled = !selectedCourse;
    }
}

function showLoadingState(isLoading) {
    const loadingElements = document.querySelectorAll('.schedule-loading');
    loadingElements.forEach(el => {
        el.style.display = isLoading ? 'block' : 'none';
    });
}

function showErrorState(error) {
    const errorElements = document.querySelectorAll('.schedule-error');
    errorElements.forEach(el => {
        if (error) {
            el.textContent = error;
            el.style.display = 'block';
        } else {
            el.style.display = 'none';
        }
    });
}

// Data Loading Functions with Caching and Error Handling
async function loadCourses() {
    if (manageSchedulesState.cache.courses) {
        return manageSchedulesState.cache.courses;
    }
    
    try {
        updateManageSchedulesState({ isLoading: true, error: null });
        const response = await fetch('/api/auth/courses');
        if (!response.ok) throw new Error('Failed to load courses');
        
        const courses = await response.json();
        manageSchedulesState.cache.courses = courses;
        return courses;
    } catch (error) {
        updateManageSchedulesState({ error: `Error loading courses: ${error.message}` });
        return [];
    } finally {
        updateManageSchedulesState({ isLoading: false });
    }
}

async function loadSectionsForCourse(courseCode) {
    const cacheKey = courseCode || 'all';
    if (manageSchedulesState.cache.sections[cacheKey]) {
        return manageSchedulesState.cache.sections[cacheKey];
    }
    
    try {
        updateManageSchedulesState({ isLoading: true, error: null });
        const url = courseCode ? `/api/auth/sections?courseCode=${encodeURIComponent(courseCode)}` : '/api/auth/sections';
        const response = await fetch(url);
        if (!response.ok) throw new Error('Failed to load sections');
        
        const sections = await response.json();
        manageSchedulesState.cache.sections[cacheKey] = sections;
        return sections;
    } catch (error) {
        updateManageSchedulesState({ error: `Error loading sections: ${error.message}` });
        return [];
    } finally {
        updateManageSchedulesState({ isLoading: false });
    }
}

async function loadStudentsForSection(sectionId) {
    const cacheKey = sectionId;
    if (manageSchedulesState.cache.students[cacheKey]) {
        return manageSchedulesState.cache.students[cacheKey];
    }
    
    try {
        updateManageSchedulesState({ isLoading: true, error: null });
        const response = await fetch(`/api/auth/enrollments/section/${encodeURIComponent(sectionId)}`);
        if (!response.ok) throw new Error('Failed to load students');
        
        const students = await response.json();
        manageSchedulesState.cache.students[cacheKey] = students;
        return students;
    } catch (error) {
        updateManageSchedulesState({ error: `Error loading students: ${error.message}` });
        return [];
    } finally {
        updateManageSchedulesState({ isLoading: false });
    }
}

async function loadSchedulesForStudent(studentId, filters = {}) {
    const cacheKey = `${studentId}-${JSON.stringify(filters)}`;
    if (manageSchedulesState.cache.schedules[cacheKey]) {
        return manageSchedulesState.cache.schedules[cacheKey];
    }
    
    try {
        updateManageSchedulesState({ isLoading: true, error: null });
        let url = `/api/auth/schedules/${studentId}`;
        const params = new URLSearchParams();
        if (filters.academicYear) params.append('academicYear', filters.academicYear);
        if (filters.semester) params.append('semester', filters.semester);
        if (params.toString()) url += `?${params.toString()}`;
        
        const response = await fetch(url);
        if (!response.ok) throw new Error('Failed to load schedules');
        
        const schedules = await response.json();
        manageSchedulesState.cache.schedules[cacheKey] = schedules;
        return schedules;
    } catch (error) {
        updateManageSchedulesState({ error: `Error loading schedules: ${error.message}` });
        return [];
    } finally {
        updateManageSchedulesState({ isLoading: false });
    }
}

// Dropdown Population Functions
async function populateCourseDropdown() {
    const courseFilter = document.getElementById('scheduleCourseFilter');
    if (!courseFilter) return;
    
    const courses = await loadCourses();
    courseFilter.innerHTML = '<option value="">-- All Courses --</option>';
    courses.forEach(course => {
        const option = document.createElement('option');
        option.value = course.code;
        option.textContent = course.name;
        courseFilter.appendChild(option);
    });
}

async function populateSectionDropdown() {
    const sectionSelect = document.getElementById('scheduleSectionSelect');
    if (!sectionSelect) return;
    
    const sections = await loadSectionsForCourse(manageSchedulesState.selectedCourse);
    sectionSelect.innerHTML = '<option value="">-- Select Section --</option>';
    sections.forEach(section => {
        const option = document.createElement('option');
        option.value = section.id;
        option.textContent = `${section.name} (${section.id})`;
        sectionSelect.appendChild(option);
    });
}

async function populateStudentDropdown() {
    const studentSelect = document.getElementById('scheduleStudentSelect');
    if (!studentSelect) return;
    
    if (!manageSchedulesState.selectedSection) {
        studentSelect.innerHTML = '<option value="">-- Select Section First --</option>';
        studentSelect.disabled = true;
        return;
    }
    
    const students = await loadStudentsForSection(manageSchedulesState.selectedSection);
    studentSelect.innerHTML = '<option value="">-- Select Student --</option>';
    studentSelect.disabled = false;
    
    students.forEach(student => {
        const option = document.createElement('option');
        option.value = student.id;
        option.textContent = `${student.name} (${student.id})`;
        studentSelect.appendChild(option);
    });
}

async function populateAcademicYearSemesterDropdowns() {
    const yearSelect = document.getElementById('scheduleAcademicYear');
    const semesterSelect = document.getElementById('scheduleSemester');
    
    if (!yearSelect || !semesterSelect) return;
    
    if (!manageSchedulesState.selectedStudent) {
        yearSelect.innerHTML = '<option value="">-- Select Student First --</option>';
        semesterSelect.innerHTML = '<option value="">-- Select Student First --</option>';
        yearSelect.disabled = true;
        semesterSelect.disabled = true;
        return;
    }
    
    const schedules = await loadSchedulesForStudent(manageSchedulesState.selectedStudent);
    
    // Extract unique academic years
    const years = [...new Set(schedules.map(s => s.academicYear).filter(Boolean))].sort();
    yearSelect.innerHTML = '<option value="">-- All Years --</option>';
    years.forEach(year => {
        const option = document.createElement('option');
        option.value = year;
        option.textContent = year;
        yearSelect.appendChild(option);
    });
    yearSelect.disabled = false;
    
    // Extract unique semesters
    const semesters = [...new Set(schedules.map(s => s.semester).filter(Boolean))].sort();
    semesterSelect.innerHTML = '<option value="">-- All Semesters --</option>';
    semesters.forEach(semester => {
        const option = document.createElement('option');
        option.value = semester;
        option.textContent = semester;
        semesterSelect.appendChild(option);
    });
    semesterSelect.disabled = false;
}

// Table Rendering Functions
function renderSchedulesTable(schedules) {
    const tableBody = document.getElementById('schedulesTable')?.querySelector('tbody');
    if (!tableBody) return;
    
    tableBody.innerHTML = '';
    
    if (!schedules || schedules.length === 0) {
        const row = tableBody.insertRow();
        const cell = row.insertCell();
        cell.colSpan = 11;
        cell.innerHTML = '<div style="text-align: center; padding: 20px; color: #666;">No schedules found for the selected criteria.</div>';
        return;
    }
    
    schedules.forEach(schedule => {
        const row = tableBody.insertRow();
        
        // Subject Code
        row.insertCell().textContent = schedule.subjectCode || '';
        
        // Description
        row.insertCell().textContent = schedule.description || '';
        
        // Units
        row.insertCell().textContent = schedule.units || '';
        
        // Lecture Hours
        row.insertCell().textContent = schedule.lec || '';
        
        // Laboratory Hours
        row.insertCell().textContent = schedule.lab || '';
        
        // Day & Time
        const dayTimeCell = row.insertCell();
        if (schedule.day && schedule.startTime && schedule.endTime) {
            dayTimeCell.textContent = `${schedule.day}, ${schedule.startTime} - ${schedule.endTime}`;
        } else if (schedule.dayTime) {
            dayTimeCell.textContent = schedule.dayTime;
        } else {
            dayTimeCell.textContent = '';
        }
        
        // Room
        row.insertCell().textContent = schedule.room || '';
        
        // Faculty
        row.insertCell().textContent = schedule.faculty || '';
        
        // Academic Year
        row.insertCell().textContent = schedule.academicYear || '';
        
        // Semester
        row.insertCell().textContent = schedule.semester || '';
        
        // Actions
        const actionsCell = row.insertCell();
        const editBtn = document.createElement('button');
        editBtn.textContent = 'Edit';
        editBtn.className = 'btn btn-sm btn-edit';
        editBtn.onclick = () => openEditScheduleModal(schedule);
        
        const deleteBtn = document.createElement('button');
        deleteBtn.textContent = 'Delete';
        deleteBtn.className = 'btn btn-sm btn-danger';
        deleteBtn.onclick = () => deleteSchedule(schedule.id);
        
        actionsCell.appendChild(editBtn);
        actionsCell.appendChild(deleteBtn);
    });
}

// CRUD Operations
async function createSchedule(scheduleData) {
    try {
        updateManageSchedulesState({ isLoading: true, error: null });
        const response = await fetch('/api/auth/schedules', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(scheduleData)
        });
        
        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(errorText);
        }
        
        // Clear cache for this student
        const cacheKey = `${scheduleData.studentId}-*`;
        Object.keys(manageSchedulesState.cache.schedules).forEach(key => {
            if (key.startsWith(scheduleData.studentId)) {
                delete manageSchedulesState.cache.schedules[key];
            }
        });
        
        await refreshSchedulesTable();
        showNotification('Schedule created successfully!', 'success');
        return true;
    } catch (error) {
        updateManageSchedulesState({ error: `Failed to create schedule: ${error.message}` });
        showNotification(`Failed to create schedule: ${error.message}`, 'error');
        return false;
    } finally {
        updateManageSchedulesState({ isLoading: false });
    }
}

async function updateSchedule(scheduleId, scheduleData) {
    try {
        updateManageSchedulesState({ isLoading: true, error: null });
        const response = await fetch(`/api/auth/schedules/${scheduleId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(scheduleData)
        });
        
        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(errorText);
        }
        
        // Clear cache for this student
        const cacheKey = `${scheduleData.studentId}-*`;
        Object.keys(manageSchedulesState.cache.schedules).forEach(key => {
            if (key.startsWith(scheduleData.studentId)) {
                delete manageSchedulesState.cache.schedules[key];
            }
        });
        
        await refreshSchedulesTable();
        showNotification('Schedule updated successfully!', 'success');
        return true;
    } catch (error) {
        updateManageSchedulesState({ error: `Failed to update schedule: ${error.message}` });
        showNotification(`Failed to update schedule: ${error.message}`, 'error');
        return false;
    } finally {
        updateManageSchedulesState({ isLoading: false });
    }
}

async function deleteSchedule(scheduleId) {
    if (!confirm('Are you sure you want to delete this schedule item?')) {
        return false;
    }
    
    try {
        updateManageSchedulesState({ isLoading: true, error: null });
        const response = await fetch(`/api/auth/schedules/${scheduleId}`, {
            method: 'DELETE'
        });
        
        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(errorText);
        }
        
        // Clear cache for this student
        Object.keys(manageSchedulesState.cache.schedules).forEach(key => {
            if (key.startsWith(manageSchedulesState.selectedStudent)) {
                delete manageSchedulesState.cache.schedules[key];
            }
        });
        
        await refreshSchedulesTable();
        showNotification('Schedule deleted successfully!', 'success');
        return true;
    } catch (error) {
        updateManageSchedulesState({ error: `Failed to delete schedule: ${error.message}` });
        showNotification(`Failed to delete schedule: ${error.message}`, 'error');
        return false;
    } finally {
        updateManageSchedulesState({ isLoading: false });
    }
}

async function bulkAssignSchedules(sectionId, scheduleData) {
    try {
        updateManageSchedulesState({ isLoading: true, error: null });
        const response = await fetch('/api/auth/schedules/section-bulk', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ sectionId, scheduleDetails: scheduleData })
        });
        
        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(errorText);
        }
        
        // Clear all caches since bulk operation affects multiple students
        manageSchedulesState.cache.students = {};
        manageSchedulesState.cache.schedules = {};
        
        await refreshSchedulesTable();
        window.showNotification('Bulk schedule assignment completed successfully!', 'success');
        return true;
    } catch (error) {
        updateManageSchedulesState({ error: `Failed to assign bulk schedules: ${error.message}` });
        window.showNotification(`Failed to assign bulk schedules: ${error.message}`, 'error');
        return false;
    } finally {
        updateManageSchedulesState({ isLoading: false });
    }
}

// Utility Functions
async function refreshSchedulesTable() {
    if (!manageSchedulesState.selectedStudent) return;
    
    const filters = {};
    if (manageSchedulesState.selectedAcademicYear) filters.academicYear = manageSchedulesState.selectedAcademicYear;
    if (manageSchedulesState.selectedSemester) filters.semester = manageSchedulesState.selectedSemester;
    
    const schedules = await loadSchedulesForStudent(manageSchedulesState.selectedStudent, filters);
    updateManageSchedulesState({ schedules });
    renderSchedulesTable(schedules);
}

// Load all schedules for the view all functionality
async function loadAllSchedules() {
    try {
        updateManageSchedulesState({ isLoading: true, error: null });
        const response = await fetch('/api/auth/schedules');
        if (response.ok) {
            const schedules = await response.json();
            updateManageSchedulesState({ schedules });
            renderSchedulesTable(schedules);
        } else {
            throw new Error('Failed to load schedules');
        }
    } catch (error) {
        updateManageSchedulesState({ error: `Failed to load schedules: ${error.message}` });
        window.showNotification('Failed to load schedules', 'error');
    } finally {
        updateManageSchedulesState({ isLoading: false });
    }
}

// Debounced function for performance
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// Event Handlers
function setupManageSchedulesEventListeners() {
    // Course filter change
    const courseFilter = document.getElementById('scheduleCourseFilter');
    if (courseFilter) {
        courseFilter.addEventListener('change', async (e) => {
            const selectedCourse = e.target.value;
            updateManageSchedulesState({
                selectedCourse,
                selectedSection: null,
                selectedStudent: null,
                selectedAcademicYear: null,
                selectedSemester: null,
                schedules: []
            });
            await populateSectionDropdown();
        });
    }
    
    // Section selection change
    const sectionSelect = document.getElementById('scheduleSectionSelect');
    if (sectionSelect) {
        sectionSelect.addEventListener('change', async (e) => {
            const selectedSection = e.target.value;
            updateManageSchedulesState({
                selectedSection,
                selectedStudent: null,
                selectedAcademicYear: null,
                selectedSemester: null,
                schedules: []
            });
            await populateStudentDropdown();
        });
    }
    
    // Student selection change
    const studentSelect = document.getElementById('scheduleStudentSelect');
    if (studentSelect) {
        studentSelect.addEventListener('change', async (e) => {
            const selectedStudent = e.target.value;
            updateManageSchedulesState({
                selectedStudent,
                selectedAcademicYear: null,
                selectedSemester: null,
                schedules: []
            });
            await populateAcademicYearSemesterDropdowns();
            if (selectedStudent) {
                await refreshSchedulesTable();
            }
        });
    }
    
    // Academic year change
    const yearSelect = document.getElementById('scheduleAcademicYear');
    if (yearSelect) {
        yearSelect.addEventListener('change', debounce(async (e) => {
            const selectedAcademicYear = e.target.value;
            updateManageSchedulesState({ selectedAcademicYear });
            await refreshSchedulesTable();
        }, 300));
    }
    
    // Semester change
    const semesterSelect = document.getElementById('scheduleSemester');
    if (semesterSelect) {
        semesterSelect.addEventListener('change', debounce(async (e) => {
            const selectedSemester = e.target.value;
            updateManageSchedulesState({ selectedSemester });
            await refreshSchedulesTable();
        }, 300));
    }
    
    // Action buttons
    const bulkBtn = document.getElementById('openBulkScheduleModal');
    if (bulkBtn) {
        bulkBtn.addEventListener('click', (e) => {
            e.preventDefault();
            // Show bulk modal directly
            const modal = document.getElementById('bulkScheduleModal');
            if (modal) {
                modal.style.display = 'block';
                document.body.style.overflow = 'hidden';
            }
        });
    }
    
    // View All Schedules button
    const viewAllBtn = document.getElementById('viewAllSchedulesBtn');
    if (viewAllBtn) {
        viewAllBtn.addEventListener('click', (e) => {
            e.preventDefault();
            // Show all schedules table directly
            updateManageSchedulesState({ currentStep: 5 });
            // Load all schedules without filtering
            loadAllSchedules();
        });
    }
}

// Modal Functions
function openEditScheduleModal(schedule) {
    // Populate modal with schedule data
    const modal = document.getElementById('scheduleModal');
    if (!modal) return;
    
    // Set modal title
    const title = document.getElementById('scheduleModalTitle');
    if (title) title.textContent = 'Edit Schedule Item';
    
    // Populate form fields
    const form = document.getElementById('scheduleForm');
    if (form) {
        form.scheduleEditId.value = schedule.id;
        form.scheduleSubjectCodeModal.value = schedule.subjectCode || '';
        form.scheduleDescriptionModal.value = schedule.description || '';
        form.scheduleUnitsModal.value = schedule.units || '';
        form.scheduleLecModal.value = schedule.lec || '';
        form.scheduleLabModal.value = schedule.lab || '';
        form.scheduleDayModal.value = schedule.day || '';
        form.scheduleStartTimeModal.value = schedule.startTime || '';
        form.scheduleEndTimeModal.value = schedule.endTime || '';
        form.scheduleRoomModal.value = schedule.room || '';
        form.scheduleFacultyModal.value = schedule.faculty || '';
        form.scheduleAcademicYearModal.value = schedule.academicYear || '';
        form.scheduleSemesterModal.value = schedule.semester || '';
    }
    
    // Show modal
    modal.style.display = 'block';
    document.body.style.overflow = 'hidden';
}

// Initialize Manage Schedules section
async function initializeManageSchedules() {
    try {
        // Reset state
        resetManageSchedulesState();
        
        // Setup event listeners
        setupManageSchedulesEventListeners();
        
        // Populate initial dropdowns
        await populateCourseDropdown();
        
        // Show initial state
        updateUIFromState();
        
        console.log('Manage Schedules section initialized successfully');
    } catch (error) {
        console.error('Failed to initialize Manage Schedules section:', error);
        updateManageSchedulesState({ error: `Initialization failed: ${error.message}` });
    }
}

// Helper function to populate schedule modal dropdowns for a student
async function populateScheduleDropdownsForStudent(studentId) {
    // Populate subject dropdown
    const subjectSelect = document.getElementById('scheduleSubjectCodeModal');
    if (subjectSelect) {
        try {
            const response = await fetch('/api/auth/subjects');
            if (response.ok) {
                const subjects = await response.json();
                subjectSelect.innerHTML = '<option value="">-- Select Subject --</option>';
                subjects.forEach(subject => {
                    const option = document.createElement('option');
                    option.value = subject.code;
                    option.textContent = `${subject.code} - ${subject.name}`;
                    option.dataset.units = subject.units;
                    option.dataset.description = subject.name;
                    subjectSelect.appendChild(option);
                });
            }
        } catch (error) {
            console.error('Error loading subjects:', error);
        }
    }
    
    // Populate faculty dropdown
    const facultySelect = document.getElementById('scheduleFacultyModal');
    if (facultySelect) {
        try {
            const response = await fetch('/api/auth/faculty');
            if (response.ok) {
                const faculty = await response.json();
                facultySelect.innerHTML = '<option value="">-- Select Faculty --</option>';
                faculty.forEach(f => {
                    const option = document.createElement('option');
                    option.value = f.name;
                    option.textContent = f.name;
                    facultySelect.appendChild(option);
                });
            }
        } catch (error) {
            console.error('Error loading faculty:', error);
        }
    }
    
    // Populate academic year dropdown
    const yearSelect = document.getElementById('scheduleAcademicYearModal');
    if (yearSelect) {
        const currentYear = new Date().getFullYear();
        yearSelect.innerHTML = '<option value="">-- Select Academic Year --</option>';
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
}

// Export functions for global access
window.manageSchedules = {
    initialize: initializeManageSchedules,
    createSchedule,
    updateSchedule,
    deleteSchedule,
    bulkAssignSchedules,
    openEditScheduleModal,
    resetState: resetManageSchedulesState
};

// At the top of the file, outside functions
let selectedAcademicYear = null;

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
                await initializeManageSchedules();
                break;
            case 'encodeGrades':
                setTimeout(() => { loadEncodeGradesData(); }, 0);
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
            const courseSelect = document.getElementById('gradeCourseSelect');
            const sectionSelect = document.getElementById('gradeSectionSelect');
            const yearLevelSelect = document.getElementById('gradeYearLevelSelect');
            const semesterSelect = document.getElementById('gradeSemesterSelect');
            const subjectSelect = document.getElementById('gradeSubjectSelect');
            // Remove termSelect
            if (!courseSelect || !sectionSelect || !yearLevelSelect || !semesterSelect || !subjectSelect) {
                console.error('Required dropdown elements not found');
                return;
            }
            await populateCourseDropdown('gradeCourseSelect');

            courseSelect.onchange = async () => {
                const courseCode = courseSelect.value;
                sectionSelect.innerHTML = '<option value="">-- Select Section --</option>';
                yearLevelSelect.innerHTML = '<option value="">-- Select Year Level --</option>';
                semesterSelect.innerHTML = '<option value="">-- Select Semester --</option>';
                subjectSelect.innerHTML = '<option value="">-- Select Subject --</option>';
                sectionSelect.disabled = !courseCode;
                yearLevelSelect.disabled = true;
                semesterSelect.disabled = true;
                subjectSelect.disabled = true;
                document.getElementById('gradeEntrySection').style.display = 'none';
                if (!courseCode) return;
                try {
                    const response = await fetch(`/api/auth/sections?courseCode=${encodeURIComponent(courseCode)}`);
                    if (response.ok) {
                        const sections = await response.json();
                        sections.forEach(section => {
                        const option = document.createElement('option');
                            option.value = section.id; // Use unique section ID
                            option.textContent = `${section.name} (${section.yearLevel}${section.sectionLetter}) [${section.id}]`;
                            sectionSelect.appendChild(option);
                        });
                    }
                } catch (error) {
                    console.error('Error loading sections:', error);
                }
            };

            sectionSelect.onchange = async () => {
                const sectionId = sectionSelect.value;
                yearLevelSelect.innerHTML = '<option value="">-- Select Year Level --</option>';
                semesterSelect.innerHTML = '<option value="">-- Select Semester --</option>';
                            subjectSelect.innerHTML = '<option value="">-- Select Subject --</option>';
                yearLevelSelect.disabled = !sectionId;
                semesterSelect.disabled = true;
                subjectSelect.disabled = true;
                document.getElementById('gradeEntrySection').style.display = 'none';
                if (!sectionId) return;
                // Get year level from section (if available)
                try {
                    const response = await fetch(`/api/auth/sections?courseCode=${encodeURIComponent(courseSelect.value)}`);
                    if (response.ok) {
                        const sections = await response.json();
                        const selectedSection = sections.find(s => s.id === sectionId);
                        if (selectedSection && selectedSection.yearLevel) {
                            selectedAcademicYear = selectedSection.yearLevel;
                            const option = document.createElement('option');
                            option.value = selectedSection.yearLevel;
                            option.textContent = selectedSection.yearLevel;
                            yearLevelSelect.appendChild(option);
                            yearLevelSelect.value = selectedSection.yearLevel;
                            yearLevelSelect.disabled = false;
                            // Auto-trigger year level change
                            yearLevelSelect.dispatchEvent(new Event('change'));
                        } else {
                            // fallback: allow manual selection if needed
                            for (let i = 1; i <= 5; i++) {
                                const option = document.createElement('option');
                                option.value = i;
                                option.textContent = i;
                                yearLevelSelect.appendChild(option);
                            }
                            yearLevelSelect.disabled = false;
                        }
                    }
                } catch (error) {
                    console.error('Error loading year level:', error);
                }
            };

            yearLevelSelect.onchange = async () => {
                const courseCode = courseSelect.value;
                const yearLevel = yearLevelSelect.value;
                semesterSelect.innerHTML = '<option value="">-- Select Semester --</option>';
                subjectSelect.innerHTML = '<option value="">-- Select Subject --</option>';
                semesterSelect.disabled = !yearLevel;
                subjectSelect.disabled = true;
                document.getElementById('gradeEntrySection').style.display = 'none';
                if (!courseCode || !yearLevel) return;
                // Get semesters from curriculum for this course/year
                try {
                    const response = await fetch(`/api/curriculum/by-course?courseCode=${encodeURIComponent(courseCode)}`);
                    if (response.ok) {
                        const curricula = await response.json();
                        const semesters = [...new Set(curricula.filter(c => c.yearLevel == yearLevel).map(c => c.semester))];
                        semesters.forEach(sem => {
                            const option = document.createElement('option');
                            option.value = sem;
                            option.textContent = sem;
                            semesterSelect.appendChild(option);
                        });
                    }
                } catch (error) {
                    console.error('Error loading semesters:', error);
                }
            };

            semesterSelect.onchange = async () => {
                const courseCode = courseSelect.value;
                const yearLevel = yearLevelSelect.value;
                const semester = semesterSelect.value;
                            subjectSelect.innerHTML = '<option value="">-- Select Subject --</option>';
                subjectSelect.disabled = !semester;
                document.getElementById('gradeEntrySection').style.display = 'none';
                if (!courseCode || !yearLevel || !semester) return;
                // Get curriculum for this course/year/semester
                try {
                    const response = await fetch(`/api/curriculum/by-course-year-sem?courseCode=${encodeURIComponent(courseCode)}&yearLevel=${encodeURIComponent(yearLevel)}&semester=${encodeURIComponent(semester)}`);
                    if (response.ok) {
                        const curricula = await response.json();
                        if (curricula.length > 0) {
                            const subjectCodes = curricula[0].subjectCodes.split(',');
                            // Fetch subject details for each code
                            for (const code of subjectCodes) {
                                const subjRes = await fetch(`/api/auth/subjects`);
                                if (subjRes.ok) {
                                    const allSubjects = await subjRes.json();
                                    const subject = allSubjects.find(s => s.code === code);
                                    if (subject) {
                            const option = document.createElement('option');
                                        option.value = subject.code;
                                        option.textContent = `${subject.code} - ${subject.name} (${subject.units} units)`;
                            subjectSelect.appendChild(option);
                        }
                    }
                            }
                        }
                    }
                } catch (error) {
                    console.error('Error loading curriculum subjects:', error);
                }
            };

            subjectSelect.onchange = async () => {
                const subjectCode = subjectSelect.value;
                const sectionId = sectionSelect.value;
                const yearLevel = yearLevelSelect.value;
                const semester = semesterSelect.value;
                document.getElementById('gradeEntrySection').style.display = 'none';
                if (!subjectCode || !sectionId || !yearLevel || !semester) return;
                // Immediately load grade entry table
                await loadGradeEntryTable(sectionId, subjectCode, yearLevel, semester);
            };

        } catch (error) {
            console.error('Error loading encode grades data:', error);
        }
    }

    // Load grade entry table with students
    async function loadGradeEntryTable(sectionId, subjectCode, yearLevel, semester) {
        try {
            const studentsResponse = await fetch(`/api/auth/enrollments/section/${sectionId}`);
            if (!studentsResponse.ok) {
                console.error('Error loading students for section');
                            return;
                        }
            const students = await studentsResponse.json();
            // Use real academic year from first enrolled student, or dropdown if none
            let academicYear = '';
            let academicYearDropdown = document.getElementById('gradeAcademicYearSelect');
            if (!academicYearDropdown) {
                academicYearDropdown = document.createElement('select');
                academicYearDropdown.id = 'gradeAcademicYearSelect';
                academicYearDropdown.style.marginBottom = '10px';
                academicYearDropdown.innerHTML = '<option value="">-- Select Academic Year --</option>';
                // Add 4 years (current and next 3)
                const now = new Date();
                for (let i = 0; i < 4; i++) {
                    const y1 = now.getFullYear() + i;
                    const y2 = y1 + 1;
                    const val = `${y1}-${y2}`;
                    const opt = document.createElement('option');
                    opt.value = val;
                    opt.textContent = val;
                    academicYearDropdown.appendChild(opt);
                }
                // Insert above grade entry table
                const entrySection = document.getElementById('gradeEntrySection');
                if (entrySection) entrySection.parentNode.insertBefore(academicYearDropdown, entrySection);
            }
            if (students.length > 0 && students[0].academicYear) {
                academicYear = students[0].academicYear;
                academicYearDropdown.value = academicYear;
                academicYearDropdown.disabled = true;
            } else {
                academicYearDropdown.disabled = false;
                academicYearDropdown.onchange = () => loadGradeEntryTable(sectionId, subjectCode, yearLevel, semester);
                academicYear = academicYearDropdown.value;
                if (!academicYear) return; // Wait for user to select
            }
            // Get existing grades for this section/subject/academicYear/semester
            const gradesResponse = await fetch(`/api/auth/grades/section?sectionId=${encodeURIComponent(sectionId)}&subjectCode=${encodeURIComponent(subjectCode)}&academicYear=${encodeURIComponent(academicYear)}&semester=${encodeURIComponent(semester)}`);
            let existingGrades = [];
            if (gradesResponse.ok) {
                existingGrades = await gradesResponse.json();
            }
            // Populate the grade entry table (rest of function unchanged)
            const tableBody = document.getElementById('gradeEntryTableBody');
            tableBody.innerHTML = '';
            students.forEach(student => {
                const existingGrade = existingGrades.find(g => g.studentId === student.id);
                const row = document.createElement('tr');
                row.style.borderBottom = '1px solid #dee2e6';
                row.innerHTML = `
                    <td style="padding: 12px; border: none;">${student.id}</td>
                    <td style="padding: 12px; border: none;">${student.name}</td>
                    <td style="padding: 12px; border: none;">
                        <input type="number" 
                               step="0.01" 
                               min="0" 
                               max="5" 
                               class="grade-input" 
                               data-student-id="${student.id}"
                               value="${existingGrade ? existingGrade.numericGrade || '' : ''}"
                               style="width: 80px; padding: 8px; border: 1px solid #ced4da; border-radius: 4px;"
                               placeholder="1.00-5.00"
                               ${existingGrade && existingGrade.isReleased ? 'disabled' : ''}>
                    </td>
                    <td style="padding: 12px; border: none;">
                        <select class="remarks-select" data-student-id="${student.id}" style="padding: 8px; border: 1px solid #ced4da; border-radius: 4px;">
                            <option value="In Progress" ${existingGrade && existingGrade.remarks === 'In Progress' ? 'selected' : ''}>In Progress</option>
                            <option value="Passed" ${existingGrade && existingGrade.remarks === 'Passed' ? 'selected' : ''}>Passed</option>
                            <option value="Failed" ${existingGrade && existingGrade.remarks === 'Failed' ? 'selected' : ''}>Failed</option>
                            <option value="Incomplete" ${existingGrade && existingGrade.remarks === 'Incomplete' ? 'selected' : ''}>Incomplete (INC)</option>
                            <option value="Officially Dropped" ${existingGrade && existingGrade.remarks === 'Officially Dropped' ? 'selected' : ''}>Officially Dropped (OD)</option>
                            <option value="Unofficially Dropped" ${existingGrade && existingGrade.remarks === 'Unofficially Dropped' ? 'selected' : ''}>Unofficially Dropped (UD)</option>
                            <option value="No Grade Yet" ${existingGrade && existingGrade.remarks === 'No Grade Yet' ? 'selected' : ''}>No Grade Yet (NGY)</option>
                        </select>
                    </td>
                    <td style="padding: 12px; border: none;">
                        <span class="grade-status" style="padding: 4px 8px; border-radius: 4px; font-size: 0.85em; ${existingGrade && existingGrade.isReleased ? 'background: #d4edda; color: #155724;' : 'background: #f8d7da; color: #721c24;'}">
                            ${existingGrade && existingGrade.isReleased ? 'Released' : 'Not Released'}
                        </span>
                        <button class="btn btn-sm btn-info view-released-grades-btn" data-student-id="${student.id}" style="margin-left:8px;">View Released Grades</button>
                    </td>
                `;
                tableBody.appendChild(row);
                const viewBtn = row.querySelector('.view-released-grades-btn');
                if (viewBtn) {
                    viewBtn.onclick = async () => {
                        // Use the same academicYear and semester as the current context
                        const apiUrl = `/api/student/grades/${student.id}/released?semester=${encodeURIComponent(semester)}&academicYear=${encodeURIComponent(academicYear)}`;
                        const resp = await fetch(apiUrl);
                        if (resp.ok) {
                            const released = await resp.json();
                            // Fetch all subjects for lookup if needed
                            let allSubjects = [];
                            try {
                                const subjRes = await fetch('/api/auth/subjects');
                                if (subjRes.ok) allSubjects = await subjRes.json();
                            } catch {}
                            const modal = document.getElementById('releasedGradesModal');
                            const content = document.getElementById('releasedGradesModalContent');
                            if (released.length === 0) {
                                content.innerHTML = '<div style="padding:16px;">No released grades for this student in this term.</div>';
                            } else {
                                const { rows: gpaRows, overallGpa } = calculateGPA(released, allSubjects);
                                content.innerHTML = `
                                    <div style="overflow-x:auto;">
                                    <table style="width:100%;border-collapse:collapse;margin-bottom:12px;font-size:1.05em;box-shadow:0 2px 8px #e0e0e0;">
                                        <thead>
                                            <tr style="background:#f8f9fa;">
                                                <th style="padding:10px 8px;">Subject Code</th>
                                                <th style="padding:10px 8px;">Subject Name</th>
                                                <th style="padding:10px 8px;">Units</th>
                                                <th style="padding:10px 8px;">Numeric Grade</th>
                                                <th style="padding:10px 8px;">Letter Grade</th>
                                                <th style="padding:10px 8px;">GPA</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            ${gpaRows.map((g, i) => {
                                                const gpaColor = g.gpa && Number(g.gpa) <= 3.0 ? '#28a745' : (g.gpa ? '#dc3545' : '#666');
                                                return `<tr style="background:${i%2===0?'#fff':'#f6f6fa'};">
                                                    <td style="padding:8px 6px;">${g.subjectCode}</td>
                                                    <td style="padding:8px 6px;">${g.subjectName && g.subjectName !== 'N/A' ? g.subjectName : (allSubjects.find(s => s.code === g.subjectCode)?.name || '')}</td>
                                                    <td style="padding:8px 6px;text-align:center;">${g.units || ''}</td>
                                                    <td style="padding:8px 6px;text-align:center;">${g.numericGrade !== null && g.numericGrade !== undefined ? Number(g.numericGrade).toFixed(2) : ''}</td>
                                                    <td style="padding:8px 6px;text-align:center;">${g.grade || ''}</td>
                                                    <td style="padding:8px 6px;text-align:center;color:${gpaColor};font-weight:bold;">${g.gpa}</td>
                                                </tr>`;
                                            }).join('')}
                                        </tbody>
                                        <tfoot>
                                            <tr style="background:#f1f3f4;font-weight:bold;">
                                                <td colspan="5" style="text-align:right;padding:10px 8px;">Overall GPA:</td>
                                                <td style="padding:10px 8px;text-align:center;color:${overallGpa && Number(overallGpa) <= 3.0 ? '#28a745' : (overallGpa ? '#dc3545' : '#666')};font-size:1.1em;">${overallGpa}</td>
                                            </tr>
                                        </tfoot>
                                    </table>
                                    </div>
                                `;
                                const modalBox = modal.querySelector('div');
                                modalBox.style.borderRadius = '12px';
                                modalBox.style.boxShadow = '0 8px 32px #bdbdbd44';
                                modalBox.style.padding = '32px 32px 18px 32px';
                                modalBox.style.maxWidth = '700px';
                            }
                            modal.style.display = 'block';
                                } else {
                            alert('Failed to fetch released grades.');
                                }
                    };
                            }
            });
            document.getElementById('gradeEntrySection').style.display = 'block';
            updateGradeStatistics(students.length, existingGrades.length, existingGrades.filter(g => g.isReleased).length);
            setupSaveAllGradesButton(sectionId, subjectCode, academicYear, semester);
                        } catch (error) {
            console.error('Error loading grade entry table:', error);
        }
    }

    // Update grade statistics
    function updateGradeStatistics(totalStudents, encodedGrades, releasedGrades) {
        document.getElementById('statTotalStudents').textContent = totalStudents;
        document.getElementById('statEncodedGrades').textContent = encodedGrades;
        document.getElementById('statReleasedGrades').textContent = releasedGrades;
        
        // Calculate average grade (placeholder for now)
        document.getElementById('statAverageGrade').textContent = 'N/A';
    }

    // Setup save all grades button
    function setupSaveAllGradesButton(sectionId, subjectCode, academicYear, semester) {
        const saveAllBtn = document.getElementById('saveAllGradesBtn');
        const releaseAllBtn = document.getElementById('releaseAllGradesBtn');
        const unreleaseAllBtn = document.getElementById('unreleaseAllGradesBtn');
        if (saveAllBtn) {
            saveAllBtn.onclick = async () => {
                await saveAllGrades(sectionId, subjectCode, academicYear, semester);
            };
        }
        if (releaseAllBtn) {
            releaseAllBtn.onclick = async () => {
                await releaseAllGrades(sectionId, subjectCode, academicYear, semester);
            };
        }
        if (unreleaseAllBtn) {
            unreleaseAllGradesBtn.onclick = async () => {
                await unreleaseAllGrades(sectionId, subjectCode, academicYear, semester);
            };
        }
    }

    // Save all grades
    async function saveAllGrades(sectionId, subjectCode, academicYear, semester) {
        try {
            const gradeInputs = document.querySelectorAll('.grade-input');
            const remarksSelects = document.querySelectorAll('.remarks-select');
            const grades = [];
            for (let i = 0; i < gradeInputs.length; i++) {
                const gradeInput = gradeInputs[i];
                const remarksSelect = remarksSelects[i];
                const studentId = gradeInput.dataset.studentId;
                const gradeValue = gradeInput.value.trim();
                const remarks = remarksSelect.value;
                if (gradeValue) {
                    grades.push({
                        studentId: studentId,
                        subjectCode: subjectCode,
                        academicYear: academicYear,
                        semester: semester,
                        numericGrade: gradeValue ? parseFloat(gradeValue) : null,
                        grade: null, // Let backend convert numeric to letter
                        remarks: remarks
                    });
                }
            }
            if (grades.length === 0) {
                alert('Please enter at least one grade.');
                        return;
                    }
            const response = await fetch('/api/auth/grades/batch-encode', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    sectionId: sectionId,
                    subjectCode: subjectCode,
                    academicYear: academicYear,
                    semester: semester,
                    grades: grades
                })
            });
            if (response.ok) {
                alert('Grades saved successfully!');
                await loadGradeEntryTable(sectionId, subjectCode, academicYear.replace('Year ', ''), semester);
                    } else {
                const error = await response.text();
                alert('Error saving grades: ' + error);
            }
        } catch (error) {
            console.error('Error saving grades:', error);
            alert('Error saving grades. Please try again.');
        }
    }

    // Release all grades
    async function releaseAllGrades(sectionId, subjectCode, academicYear, semester) {
        try {
            const response = await fetch('/api/auth/grades/release-all', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    sectionId: sectionId,
                    subjectCode: subjectCode,
                    academicYear: academicYear,
                    semester: semester
                })
            });
            if (response.ok) {
                alert('All grades released successfully!');
                await loadGradeEntryTable(sectionId, subjectCode, academicYear.replace('Year ', ''), semester);
                            } else {
                const error = await response.text();
                alert('Error releasing grades: ' + error);
                        }
                    } catch (error) {
            console.error('Error releasing grades:', error);
            alert('Error releasing grades. Please try again.');
        }
    }

    // Unrelease all grades
    async function unreleaseAllGrades(sectionId, subjectCode, academicYear, semester) {
        try {
            const response = await fetch('/api/auth/grades/unrelease-all', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    sectionId: sectionId,
                    subjectCode: subjectCode,
                    academicYear: academicYear,
                    semester: semester
                })
            });
                        if (response.ok) {
                alert('All grades unreleased successfully!');
                await loadGradeEntryTable(sectionId, subjectCode, academicYear.replace('Year ', ''), semester);
                        } else {
                const error = await response.text();
                alert('Error unreleasing grades: ' + error);
                        }
                    } catch (error) {
            console.error('Error unreleasing grades:', error);
            alert('Error unreleasing grades. Please try again.');
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
                const response = await fetch(`/api/student/grades/${studentId}/term?semester=${encodeURIComponent(semester)}&academicYear=${encodeURIComponent(academicYear)}`);
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
                    } else if (grade.isReleased) {
                        const unreleaseBtn = document.createElement('button');
                        unreleaseBtn.textContent = 'Unrelease';
                        unreleaseBtn.classList.add('btn', 'btn-sm', 'btn-warning');
                        unreleaseBtn.onclick = async () => {
                            if (confirm(`Unrelease grade for ${grade.subjectCode}? This will hide it from the student.`)) {
                                try {
                                    const unreleaseResponse = await fetch(`/api/student/grade/unrelease/${grade.id}`, {
                                        method: 'POST',
                                        headers: { 'Content-Type': 'application/json' }
                                    });
                                    if (unreleaseResponse.ok) {
                                        showNotification(`Grade for ${grade.subjectCode} unreleased successfully! This grade is now hidden from the student.`, 'success');
                                        await loadCurrentGradesForStudent(studentId, termVal);
                                    } else {
                                        const errorText = await unreleaseResponse.text();
                                        showNotification(errorText || 'Failed to unrelease grade', 'error');
                                    }
                                } catch (error) {
                                    showNotification(`Failed to unrelease grade: ${error.message}`, 'error');
                                }
                            }
                        };
                        actionsCell.appendChild(unreleaseBtn);
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
            
            // Set up course filter for sections
            await setupSectionsCourseFilter();
            
            // Set up course filter for students
            await setupStudentsCourseFilter();
            
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
            const status = form.studentStatusModal.value || 'Enrolled';
            const admissionStatus = form.studentAdmissionStatusModal.value || 'Regular';
            const scholasticStatus = form.studentScholasticStatusModal.value || 'Good Standing';
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
                scholasticStatus,
                role: 'student'
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
                // Close and reset modal on success
                document.getElementById('studentModal').style.display = 'none';
                document.body.style.overflow = '';
                document.getElementById('studentForm').reset();
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
            // Auto-generate a unique Student ID in the format 2025-00001-OA-0 (auto-increment)
            const year = new Date().getFullYear();
            let nextNum = 1;
            try {
                const response = await fetch('/api/auth/users');
                if (response.ok) {
                    const users = await response.json();
                    // Filter only students with correct ID format
                    const studentIds = users
                        .filter(u => u.role === 'student' && u.id && u.id.startsWith(year + '-'))
                        .map(u => {
                            const match = u.id.match(/-(\d{5})-OA-0$/);
                            return match ? parseInt(match[1], 10) : null;
                        })
                        .filter(num => num !== null);
                    if (studentIds.length > 0) {
                        nextNum = Math.max(...studentIds) + 1;
                    }
                }
            } catch (e) {
                // fallback: nextNum stays 1
            }
            const uniqueNum = nextNum.toString().padStart(5, '0');
            const generatedId = `${year}-${uniqueNum}-OA-0`;
            const studentIdInput = document.getElementById('studentIdModal');
            studentIdInput.value = generatedId;
            studentIdInput.readOnly = true;
            await populateCourseDropdownForStudent('studentCourseModal', '', false);
            document.getElementById('studentCourseModal').onchange = (e) => {
                populateSectionDropdown('studentSectionModal', '', e.target.value);
            };
            document.getElementById('studentSectionModal').innerHTML = '';
            // Populate status dropdowns
            populateStatusDropdown('studentStatusModal', '', systemStatusOptions, 'System Status');
            populateStatusDropdown('studentAdmissionStatusModal', '', admissionStatusOptions, 'Admission Status');
            populateStatusDropdown('studentScholasticStatusModal', '', scholasticStatusOptions, 'Scholastic Status');
            // Reset password field and placeholder
            const passwordInput = document.getElementById('studentPasswordModal');
            passwordInput.value = '';
            passwordInput.placeholder = '';
            // Ensure password toggle works
            const toggleBtn = document.getElementById('toggleStudentPassword');
            if (toggleBtn) {
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
        },
        'cancelStudentForm'
    );

    // Ensure cancel button closes and resets modal
    document.getElementById('cancelStudentForm').onclick = () => {
        document.getElementById('studentModal').style.display = 'none';
        document.body.style.overflow = '';
        document.getElementById('studentForm').reset();
    };

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

    // --- Manage Students Search Feature ---
    const studentSearchInput = document.getElementById('studentSearchInput');
    let allStudentsCache = [];

    async function loadStudentsTable() {
        let users = [];
        try {
            const response = await fetch('/api/auth/users');
            if (response.ok) {
                users = await response.json();
                console.log('Users from backend:', users); // DEBUG LINE
            }
        } catch (e) {
            console.error('Failed to fetch users from backend:', e);
        }
        // Show all users except admin
        let students = users.filter(u => u.id !== 'admin')
            .sort((a,b) => a.name.localeCompare(b.name));
        
        // Get the selected course filter
        const courseFilter = document.getElementById('studentCourseFilter')?.value;
        
        // Filter students by course if a filter is selected
        if (courseFilter) {
            students = students.filter(student => student.course === courseFilter);
        }
        
        allStudentsCache = students; // Cache for search
        renderStudentsTable(students);
        users.forEach(u => {
            console.log(`User: id=${u.id}, name=${u.name}, admissionStatus=${u.admissionStatus}, status=${u.status}`);
        });
    }

    function renderStudentsTable(students) {
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

    if (studentSearchInput) {
        studentSearchInput.addEventListener('input', () => {
            const query = studentSearchInput.value.trim().toLowerCase();
            if (!query) {
                renderStudentsTable(allStudentsCache);
                return;
            }
            const filtered = allStudentsCache.filter(student =>
                student.id.toLowerCase().includes(query) ||
                student.name.toLowerCase().includes(query) ||
                (student.course || '').toLowerCase().includes(query) ||
                (student.section || '').toLowerCase().includes(query)
            );
            renderStudentsTable(filtered);
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
        
        // Get the selected course filter
        const courseFilter = document.getElementById('sectionCourseFilter')?.value;
        
        // Filter sections by course if a filter is selected
        if (courseFilter) {
            sections = sections.filter(section => section.courseCode === courseFilter);
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

    // Set up course filter for sections table
    async function setupSectionsCourseFilter() {
        try {
            // Populate the course filter dropdown
            await populateCourseDropdown('sectionCourseFilter');
            
            // Set up event listener for course filter
            const courseFilter = document.getElementById('sectionCourseFilter');
            if (courseFilter) {
                courseFilter.addEventListener('change', async () => {
                    await loadSectionsTable();
                });
            }
        } catch (error) {
            console.error('Error setting up sections course filter:', error);
        }
    }

    // Set up course filter for students table
    async function setupStudentsCourseFilter() {
        try {
            // Populate the course filter dropdown
            await populateCourseDropdown('studentCourseFilter');
            
            // Set up event listener for course filter
            const courseFilter = document.getElementById('studentCourseFilter');
            if (courseFilter) {
                courseFilter.addEventListener('change', async () => {
                    await loadStudentsTable();
                });
            }
        } catch (error) {
            console.error('Error setting up students course filter:', error);
        }
    }

    async function openEditSectionModal(section) {
        document.getElementById('sectionModalTitle').textContent = "Edit Section";
        const form = document.getElementById('sectionForm');
        form.reset();
        form.sectionEditCode.value = section.id;
        form.sectionCodeModal.value = section.id;
        document.getElementById('sectionCodeModal').readOnly = true;
        form.sectionNameModal.value = section.name;
        
        // Populate course filter dropdown
        await populateCourseDropdown('sectionCourseFilter', section.courseCode);
        
        // Populate course code dropdown with the section's course
        await populateCourseDropdown('sectionCourseCodeModal', section.courseCode);
        
        form.sectionYearLevelModal.value = section.yearLevel || '';
        form.sectionLetterModal.value = section.sectionLetter || '';
        form.sectionMaxCapacityModal.value = section.maxCapacity || 30;
        form.sectionCurrentEnrollmentModal.value = section.currentEnrollment || 0;
        
        // Set up course filter functionality for edit mode
        document.getElementById('sectionCourseFilter').onchange = async function() {
            const selectedCourse = this.value;
            const courseCodeSelect = document.getElementById('sectionCourseCodeModal');
            
            if (selectedCourse) {
                // Filter course code dropdown to show only the selected course
                courseCodeSelect.innerHTML = '<option value="">-- Select Course --</option>';
                const option = document.createElement('option');
                option.value = selectedCourse;
                option.textContent = selectedCourse;
                courseCodeSelect.appendChild(option);
                courseCodeSelect.value = selectedCourse;
            } else {
                // Show all courses if no filter is selected
                await populateCourseDropdown('sectionCourseCodeModal');
            }
            
            // Trigger auto-generation
            generateSectionNameAndId();
        };
        
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
            
            // Populate course filter dropdown
            await populateCourseDropdown('sectionCourseFilter');
            
            // Populate course code dropdown
            await populateCourseDropdown('sectionCourseCodeModal');
            
            // Set up course filter functionality
            document.getElementById('sectionCourseFilter').onchange = async function() {
                const selectedCourse = this.value;
                const courseCodeSelect = document.getElementById('sectionCourseCodeModal');
                
                if (selectedCourse) {
                    // Filter course code dropdown to show only the selected course
                    courseCodeSelect.innerHTML = '<option value="">-- Select Course --</option>';
                    const option = document.createElement('option');
                    option.value = selectedCourse;
                    option.textContent = selectedCourse;
                    courseCodeSelect.appendChild(option);
                    courseCodeSelect.value = selectedCourse;
                } else {
                    // Show all courses if no filter is selected
                    await populateCourseDropdown('sectionCourseCodeModal');
                }
                
                // Trigger auto-generation
                generateSectionNameAndId();
            };
            
            // Set up auto-generation listeners
            document.getElementById('sectionCourseCodeModal').onchange = generateSectionNameAndId;
            document.getElementById('sectionYearLevelModal').onchange = generateSectionNameAndId;
            document.getElementById('sectionLetterModal').onchange = generateSectionNameAndId;
        }, 'cancelSectionForm'
    );

    // --- Subjects CRUD ---
    let allSubjectsCache = []; // Cache for search functionality
    
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
        allSubjectsCache = subjects; // Cache for search
        renderSubjectsTable(subjects);
    }

    function renderSubjectsTable(subjects) {
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

    // Set up search functionality for subjects
    const subjectSearchInput = document.getElementById('subjectSearchInput');
    if (subjectSearchInput) {
        subjectSearchInput.addEventListener('input', () => {
            const query = subjectSearchInput.value.trim().toLowerCase();
            if (!query) {
                renderSubjectsTable(allSubjectsCache);
                return;
            }
            const filtered = allSubjectsCache.filter(subject =>
                subject.code.toLowerCase().includes(query) ||
                subject.name.toLowerCase().includes(query) ||
                (subject.courseCode || '').toLowerCase().includes(query) ||
                (subject.description || '').toLowerCase().includes(query)
            );
            renderSubjectsTable(filtered);
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
            window.showNotification('Failed to load curriculum data', 'error');
            return;
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
            tableBody.innerHTML = '<tr><td colspan="5" style="text-align:center;">No curriculum data found.</td></tr>';
            return;
        }
        
        for (const curriculum of curricula) {
            const row = tableBody.insertRow();
            row.insertCell().textContent = curriculum.courseCode || '';
            row.insertCell().textContent = curriculum.yearLevel || '';
            row.insertCell().textContent = curriculum.semester || '';
            
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
    const curriculumSubjectsSelect = document.getElementById('curriculumSubjects');
    const curriculumRequiredUnitsInput = document.getElementById('curriculumRequiredUnits');
    const curriculumUnitsDisplay = document.getElementById('curriculumUnitsDisplay');
    const curriculumNavLink = document.querySelector('a[data-target="manageCurriculum"]');
    let lastCurriculumCourseFilter = '';

    async function updateCurriculumUnitsDisplay() {
        const subjectsSelect = document.getElementById('curriculumSubjects');
        const requiredUnitsInput = document.getElementById('curriculumRequiredUnits');
        const unitsDisplay = document.getElementById('curriculumUnitsDisplay');
        
        if (!subjectsSelect || !requiredUnitsInput || !unitsDisplay) return;
        
        const selectedOptions = Array.from(subjectsSelect.selectedOptions);
        let totalUnits = 0;
        
        for (const opt of selectedOptions) {
            const match = opt.textContent.match(/\((\d+(?:\.\d+)?) units\)/);
            if (match) totalUnits += parseFloat(match[1]);
        }
        
        const requiredUnits = parseFloat(requiredUnitsInput.value) || 0;
        unitsDisplay.textContent = `Total Units: ${totalUnits} / Required: ${requiredUnits}`;
        
        if (totalUnits < requiredUnits) {
            unitsDisplay.style.color = 'orange';
            unitsDisplay.textContent += ' (Not enough units)';
        } else if (totalUnits > requiredUnits) {
            unitsDisplay.style.color = 'red';
            unitsDisplay.textContent += ' (Too many units)';
        } else {
            unitsDisplay.style.color = 'green';
            unitsDisplay.textContent += ' (OK)';
        }
        
        return { totalUnits, requiredUnits };
    }

    function openEditCurriculumModal(curriculum) {
        const modalTitle = document.getElementById('curriculumModalTitle');
        const form = document.getElementById('curriculumForm');
        const editId = document.getElementById('curriculumEditId');
        const courseCode = document.getElementById('curriculumCourseCode');
        const yearLevel = document.getElementById('curriculumYearLevel');
        const semester = document.getElementById('curriculumSemester');
        const requiredUnits = document.getElementById('curriculumRequiredUnits');
        const modal = document.getElementById('curriculumModal');
        
        if (!modalTitle || !form || !editId || !courseCode || !yearLevel || !semester || !requiredUnits || !modal) {
            window.showNotification('Curriculum modal elements not found', 'error');
            return;
        }
        
        modalTitle.textContent = 'Edit Curriculum';
        form.reset();
        
        // First, populate the course dropdown, then set its value and continue
        populateCourseDropdown('curriculumCourseCode').then(() => {
            editId.value = curriculum.id || '';
            courseCode.value = curriculum.courseCode || '';
            yearLevel.value = curriculum.yearLevel || '';
            semester.value = curriculum.semester || '';
            requiredUnits.value = curriculum.requiredUnits || 25;
            
            // Handle both string and array formats for backward compatibility
            const subjectCodes = curriculum.subjectCodes || '';
            const subjectCodesArray = Array.isArray(subjectCodes) ? subjectCodes : subjectCodes.split(',').filter(s => s.trim());
            populateSubjectDropdown('curriculumSubjects', curriculum.courseCode, subjectCodesArray);
            
            modal.style.display = 'block';
            document.body.style.overflow = 'hidden';
            updateCurriculumUnitsDisplay();
        });
    }

    function openAddCurriculumModal() {
        const modalTitle = document.getElementById('curriculumModalTitle');
        const form = document.getElementById('curriculumForm');
        const editId = document.getElementById('curriculumEditId');
        const requiredUnits = document.getElementById('curriculumRequiredUnits');
        const modal = document.getElementById('curriculumModal');
        
        if (!modalTitle || !form || !editId || !requiredUnits || !modal) {
            window.showNotification('Curriculum modal elements not found', 'error');
            return;
        }
        
        modalTitle.textContent = 'Add Curriculum';
        form.reset();
        editId.value = '';
        requiredUnits.value = 25;
        
        populateCourseDropdown('curriculumCourseCode', lastCurriculumCourseFilter);
        populateSubjectDropdown('curriculumSubjects', lastCurriculumCourseFilter, []);
        
        modal.style.display = 'block';
        document.body.style.overflow = 'hidden';
        updateCurriculumUnitsDisplay();
    }

    async function deleteCurriculum(id) {
        if (!confirm('Are you sure you want to delete this curriculum?')) return;
        
        try {
            const response = await fetch(`/api/curriculum/${id}`, { method: 'DELETE' });
            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(errorText || 'Failed to delete curriculum');
            }
            
            await loadCurriculumTable();
            window.showNotification('Curriculum deleted successfully', 'success');
        } catch (e) {
            console.error('Failed to delete curriculum:', e);
            window.showNotification(`Failed to delete curriculum: ${e.message}`, 'error');
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

    // Setup curriculum course filter
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
                
                // Add change event listener
                filterSelect.addEventListener('change', () => {
                    loadCurriculumTable();
                });
            }
        } catch (e) {
            console.error('Failed to setup curriculum course filter:', e);
        }
    }
    
    // Attach curriculum section to sidebar navigation
    if (curriculumNavLink) {
        curriculumNavLink.addEventListener('click', () => {
            setupCurriculumCourseFilter();
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

    // Notification utility for admin panel (moved to global scope)
    window.showNotification = function(message, type = 'info') {
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

    // --- Schedule Modal Logic (Removed Add Schedule Item functionality) ---

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
        form.scheduleStartTimeModal.value = item.startTime || '';
        form.scheduleEndTimeModal.value = item.endTime || '';
        // Only set form.scheduleStartTimeModal.value and form.scheduleEndTimeModal.value.
        // Remove or comment out:
        // form.scheduleTimeRangeModal.value = item.timeRange || ((item.startTime && item.endTime) ? `${item.startTime} - ${item.endTime}` : '');
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
            const dayTimeCell = row.insertCell();
            if (item.day && item.startTime && item.endTime) {
                dayTimeCell.textContent = `${item.day}, ${item.startTime} - ${item.endTime}`;
            } else if (item.dayTime) {
                dayTimeCell.textContent = item.dayTime;
            } else {
                dayTimeCell.textContent = '';
            }
            row.insertCell().textContent = item.room;
            row.insertCell().textContent = item.faculty;
            row.insertCell().textContent = item.academicYear;
            row.insertCell().textContent = item.semester;
            // Removed: row.insertCell().textContent = item.startTime || '';
            // Removed: row.insertCell().textContent = item.endTime || '';
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
            cell.colSpan = 8;
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
            
            // Schedule
            const scheduleCell = row.insertCell();
            const viewScheduleBtn = document.createElement('button');
            viewScheduleBtn.textContent = '📅 View Schedule';
            viewScheduleBtn.classList.add('btn', 'btn-sm', 'btn-info');
            viewScheduleBtn.title = 'View student schedule';
            viewScheduleBtn.onclick = () => viewStudentSchedule(account.studentId, studentName);
            scheduleCell.appendChild(viewScheduleBtn);
            
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

// Function to view a specific student's schedule
async function viewStudentSchedule(studentId, studentName) {
    try {
        // Switch to Manage Schedules section
        const manageSchedulesLink = document.querySelector('a[data-target="manageSchedules"]');
        if (manageSchedulesLink) {
            manageSchedulesLink.click();
        }
        
        // Wait for the section to load
        setTimeout(async () => {
            // Set the student in the state
            updateManageSchedulesState({
                selectedStudent: studentId,
                currentStep: 5
            });
            
            // Load the student's schedules
            const schedules = await loadSchedulesForStudent(studentId);
            updateManageSchedulesState({ schedules });
            renderSchedulesTable(schedules);
            
            // Show success message
            window.showNotification(`Loaded schedule for ${studentName}`, 'success');
        }, 100);
    } catch (error) {
        window.showNotification(`Failed to load schedule: ${error.message}`, 'error');
    }
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

    // --- Bulk Assign Schedule by Section ---
    const openBulkScheduleModalBtn = document.getElementById('openBulkScheduleModal');
    const bulkScheduleModal = document.getElementById('bulkScheduleModal');
    const closeBulkScheduleModalBtn = document.getElementById('closeBulkScheduleModal');
    const bulkSectionSelect = document.getElementById('bulkSectionSelect');
    const bulkSubjectSelect = document.getElementById('bulkSubjectSelect');
    const bulkDescriptionModal = document.getElementById('bulkDescriptionModal');
    const bulkUnitsModal = document.getElementById('bulkUnitsModal');
    const bulkLecModal = document.getElementById('bulkLecModal');
    const bulkLabModal = document.getElementById('bulkLabModal');
    const bulkScheduleDay = document.getElementById('bulkScheduleDay');
    const bulkScheduleStartTime = document.getElementById('bulkScheduleStartTime');
    const bulkScheduleEndTime = document.getElementById('bulkScheduleEndTime');
    const bulkScheduleRoom = document.getElementById('bulkScheduleRoom');
    const bulkScheduleFaculty = document.getElementById('bulkScheduleFaculty');
    const bulkScheduleAcademicYear = document.getElementById('bulkScheduleAcademicYear');
    const bulkScheduleSemester = document.getElementById('bulkScheduleSemester');
    const bulkScheduleForm = document.getElementById('bulkScheduleForm');
    const bulkScheduleErrorMsg = document.getElementById('bulkScheduleErrorMsg');
    const cancelBulkScheduleFormBtn = document.getElementById('cancelBulkScheduleForm');

    // Open modal only if a course is selected
    if (openBulkScheduleModalBtn) {
        openBulkScheduleModalBtn.onclick = async () => {
            const courseSelect = document.getElementById('scheduleCourseFilter');
            if (!courseSelect || !courseSelect.value) {
                window.showNotification('Please select a course first.', 'error');
                return;
            }
            
            // Fetch and populate sections for the selected course
            bulkSectionSelect.innerHTML = '<option value="">-- All Sections --</option>';
            try {
                const sectionsResponse = await fetch(`/api/auth/sections?courseCode=${encodeURIComponent(courseSelect.value)}`);
                if (sectionsResponse.ok) {
                    const sections = await sectionsResponse.json();
                    sections.forEach(section => {
                        const option = document.createElement('option');
                        option.value = section.id;
                        option.textContent = `${section.name} (${section.id})`;
                        bulkSectionSelect.appendChild(option);
                    });
                }
            } catch (e) {
                window.showNotification('Failed to load sections for this course.', 'error');
            }
            
            // Fetch and populate subjects for the selected course
            bulkSubjectSelect.innerHTML = '<option value="">-- Select Subject --</option>';
            try {
                const response = await fetch(`/api/auth/subjects/by-course?courseCode=${encodeURIComponent(courseSelect.value)}`);
                if (response.ok) {
                    const subjects = await response.json();
                    subjects.forEach(subject => {
                        const option = document.createElement('option');
                        option.value = subject.code;
                        option.textContent = `${subject.code} - ${subject.name}`;
                        option.dataset.description = subject.description;
                        option.dataset.units = subject.units;
                        bulkSubjectSelect.appendChild(option);
                    });
                }
            } catch (e) {
                window.showNotification('Failed to load subjects for this course.', 'error');
            }
            
            // Clear autofill fields
            bulkDescriptionModal.value = '';
            bulkUnitsModal.value = '';
            
            // Populate faculty dropdown
            await populateFacultyDropdown('bulkScheduleFaculty');
            
            // Populate academic year dropdown
            const yearSelect = document.getElementById('bulkScheduleAcademicYear');
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
            
            // Populate semester dropdown
            const semesterSelect = document.getElementById('bulkScheduleSemester');
            if (semesterSelect) {
                semesterSelect.innerHTML = '<option value="">-- Select Semester --</option>';
                const semesters = ['First Semester', 'Second Semester', 'Summer'];
                semesters.forEach(semester => {
                    const option = document.createElement('option');
                    option.value = semester;
                    option.textContent = semester;
                    semesterSelect.appendChild(option);
                });
            }
            
            // Show modal
            bulkScheduleModal.style.display = 'block';
            document.body.style.overflow = 'hidden';
            
            // Set up auto-fill for subject selection
            bulkSubjectSelect.onchange = async (e) => {
                const code = e.target.value;
                if (!code) {
                    bulkDescriptionModal.value = '';
                    bulkUnitsModal.value = '';
                    return;
                }
                
                try {
                    const response = await fetch('/api/auth/subjects');
                    if (response.ok) {
                        const subjects = await response.json();
                        const subj = subjects.find(s => s.code === code);
                        if (subj) {
                            bulkDescriptionModal.value = subj.name;
                            bulkUnitsModal.value = subj.units;
                            bulkLecModal.value = subj.lec || '';
                            bulkLabModal.value = subj.lab || '';
                        }
                    }
                    // Filter faculty by selected subject
                    await populateFacultyDropdown('bulkScheduleFaculty', '', code);
                } catch (e) {
                    console.error('Failed to load subject details:', e);
                }
            };
        };
    }
    if (closeBulkScheduleModalBtn) {
        closeBulkScheduleModalBtn.onclick = () => {
            bulkScheduleModal.style.display = 'none';
            document.body.style.overflow = '';
        };
    }
    if (cancelBulkScheduleFormBtn) {
        cancelBulkScheduleFormBtn.onclick = () => {
            bulkScheduleModal.style.display = 'none';
            document.body.style.overflow = '';
        };
    }
    if (bulkScheduleForm) {
        bulkScheduleForm.onsubmit = async (e) => {
            e.preventDefault();
            bulkScheduleErrorMsg.textContent = '';
            const courseSelect = document.getElementById('scheduleCourseFilter');
            const courseCode = courseSelect ? courseSelect.value : '';
            const sectionId = bulkSectionSelect.value;
            const subjectOption = bulkSubjectSelect.options[bulkSubjectSelect.selectedIndex];
            const subjectCode = subjectOption.value;
            const description = bulkDescriptionModal.value;
            const units = bulkUnitsModal.value;
            const lec = bulkLecModal.value;
            const lab = bulkLabModal.value;
            const day = bulkScheduleDay.value;
            const startTime = bulkScheduleStartTime.value;
            const endTime = bulkScheduleEndTime.value;
            const room = bulkScheduleRoom.value;
            const faculty = bulkScheduleFaculty.value;
            const academicYear = bulkScheduleAcademicYear.value;
            const semester = bulkScheduleSemester.value;
            if (!courseCode || !subjectCode || !description || !units || !lec || !lab || !day || !startTime || !endTime || !room || !faculty || !academicYear || !semester) {
                bulkScheduleErrorMsg.textContent = 'Please fill in all required fields.';
                return;
            }
            const scheduleDetails = {
                subjectCode,
                description,
                units,
                lec,
                lab,
                day,
                startTime,
                endTime,
                room,
                faculty,
                academicYear,
                semester
            };
            try {
                let response;
                if (sectionId) {
                    // Assign to specific section
                    response = await fetch('/api/auth/schedules/section-bulk', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ sectionId, scheduleDetails })
                    });
                } else {
                    // Assign to all sections of the course
                    response = await fetch('/api/auth/schedules/course-bulk', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ courseCode, scheduleDetails })
                    });
                }
                
                if (!response.ok) {
                    const errorText = await response.text();
                    throw new Error(errorText);
                }
                bulkScheduleModal.style.display = 'none';
                document.body.style.overflow = '';
                
                const successMessage = sectionId 
                    ? 'Schedule assigned to the selected section successfully!' 
                    : 'Schedule assigned to all sections of the course successfully!';
                window.showNotification(successMessage, 'success');
                
                // Refresh the schedules table if it's currently displayed
                const schedulesTable = document.getElementById('schedulesTable');
                if (schedulesTable && schedulesTable.style.display !== 'none') {
                    await loadSchedulesTable();
                }
            } catch (error) {
                bulkScheduleErrorMsg.textContent = error.message;
                window.showNotification('Failed to assign schedule: ' + error.message, 'error');
            }
        };
    }
    // Disable Assign Section Schedule button if no course is selected
    const scheduleCourseFilter = document.getElementById('scheduleCourseFilter');
    if (scheduleCourseFilter && openBulkScheduleModalBtn) {
        scheduleCourseFilter.addEventListener('change', () => {
            openBulkScheduleModalBtn.disabled = !scheduleCourseFilter.value;
        });
        openBulkScheduleModalBtn.disabled = !scheduleCourseFilter.value;
    }

    // --- Batch Grade Encoding Dropdown Filtering ---
    function setupBatchGradeDropdowns() {
        batchSectionSelect?.removeEventListener('change', updateBatchDropdownsForSection);
        batchSectionSelect?.addEventListener('change', updateBatchDropdownsForSection);
        batchSubjectSelect?.removeEventListener('change', loadBatchGradeTable);
        batchSubjectSelect?.addEventListener('change', loadBatchGradeTable);
        batchTermSelect?.removeEventListener('change', loadBatchGradeTable);
        batchTermSelect?.addEventListener('change', loadBatchGradeTable);
        // Populate on load
        populateBatchSectionDropdown();
        updateBatchDropdownsForSection();
    }

    // Call this only when batch grade encoding section is shown
    if (window.location.hash.includes('Encode Grades') || document.getElementById('batchGradesTable')) {
        setupBatchGradeDropdowns();
    }

    // --- Restore Manage Schedules Dropdowns ---
    // Ensure schedule modal and table use the original populateSubjectDropdown
    // (No changes needed if they already call populateSubjectDropdown directly)
    // If you have navigation logic, ensure setupBatchGradeDropdowns is NOT called when switching to Manage Schedules

    // --- Manage Schedules: Ensure year/semester dropdowns are always populated ---
    function setupManageSchedulesDropdowns() {
        const studentSelect = document.getElementById('scheduleStudentSelect');
        const yearSelect = document.getElementById('scheduleAcademicYear');
        const semSelect = document.getElementById('scheduleSemester');
        if (!studentSelect || !yearSelect || !semSelect) return;
        studentSelect.onchange = async () => {
            await populateScheduleYearSemesterDropdowns(studentSelect.value);
            yearSelect.value = '';
            semSelect.value = '';
            await loadSchedulesTable();
        };
        yearSelect.onchange = loadSchedulesTable;
        semSelect.onchange = loadSchedulesTable;
    }
    // Call this when switching to Manage Schedules section
    if (window.location.hash.includes('Manage Schedules') || document.getElementById('schedulesTable')) {
        setupManageSchedulesDropdowns();
        // If a student is already selected, populate dropdowns
        const studentSelect = document.getElementById('scheduleStudentSelect');
        if (studentSelect && studentSelect.value) {
            populateScheduleYearSemesterDropdowns(studentSelect.value);
        }
    }
    // After adding/editing/deleting a schedule, repopulate dropdowns
    if (!window.origLoadSchedulesTable) {
        window.origLoadSchedulesTable = loadSchedulesTable;
        loadSchedulesTable = async function() {
            await window.origLoadSchedulesTable.apply(this, arguments);
            // Repopulate dropdowns after table changes
            const studentSelect = document.getElementById('scheduleStudentSelect');
            if (studentSelect && studentSelect.value) {
                await populateScheduleYearSemesterDropdowns(studentSelect.value);
            }
        };
    }

    // --- Manage Schedules: Stepper UI Logic ---
    function setupManageSchedulesStepper() {
        const sectionSelect = document.getElementById('scheduleSectionSelect');
        const studentSelect = document.getElementById('scheduleStudentSelect');
        const yearSelect = document.getElementById('scheduleAcademicYear');
        const semSelect = document.getElementById('scheduleSemester');
        const bulkBtn = document.getElementById('openBulkScheduleModal');
        const table = document.getElementById('schedulesTable');
        const sectionMsg = document.getElementById('sectionStepMsg');
        const studentMsg = document.getElementById('studentStepMsg');
        const filterMsg = document.getElementById('filterStepMsg');
        const actionsMsg = document.getElementById('actionsStepMsg');
        const tableMsg = document.getElementById('tableStepMsg');

        // Check if all required elements exist
        if (!sectionSelect || !studentSelect || !yearSelect || !semSelect || !bulkBtn || !table || !sectionMsg || !studentMsg || !filterMsg || !actionsMsg || !tableMsg) {
            console.log('Some Manage Schedules elements not found, skipping setup');
            return;
        }

        // Initial state: only section enabled
        sectionSelect.disabled = false;
        studentSelect.disabled = true;
        yearSelect.disabled = true;
        semSelect.disabled = true;
        bulkBtn.disabled = true;
        sectionMsg.style.display = '';
        studentMsg.style.display = '';
        filterMsg.style.display = '';
        actionsMsg.style.display = '';
        tableMsg.style.display = '';
        table.style.opacity = 0.5;

        // Helper: Reset all steps after section
        function resetAfterSection() {
            studentSelect.value = '';
            yearSelect.value = '';
            semSelect.value = '';
            studentSelect.disabled = true;
            yearSelect.disabled = true;
            semSelect.disabled = true;
            bulkBtn.disabled = true;
            studentMsg.style.display = '';
            filterMsg.style.display = '';
            actionsMsg.style.display = '';
            tableMsg.style.display = '';
            table.style.opacity = 0.5;
        }
        // Helper: Reset after student
        function resetAfterStudent() {
            yearSelect.value = '';
            semSelect.value = '';
            yearSelect.disabled = true;
            semSelect.disabled = true;
            bulkBtn.disabled = true;
            filterMsg.style.display = '';
            actionsMsg.style.display = '';
            tableMsg.style.display = '';
            table.style.opacity = 0.5;
        }

        // Step 1: Section select
        sectionSelect.onchange = async () => {
            if (!sectionSelect.value) {
                resetAfterSection();
                sectionMsg.textContent = 'Please select a section to begin.';
                return;
            }
            // Populate students for section
            await populateScheduleStudentDropdown(sectionSelect.value);
            studentSelect.disabled = false;
            studentMsg.textContent = 'Please select a student to view or manage schedules.';
            resetAfterStudent();
        };

        // Step 2: Student select
        studentSelect.onchange = async () => {
            if (!studentSelect.value) {
                resetAfterStudent();
                studentMsg.textContent = 'Please select a student to view or manage schedules.';
                return;
            }
            // Populate year/semester for student
            await populateScheduleYearSemesterDropdowns(studentSelect.value);
            yearSelect.disabled = false;
            semSelect.disabled = false;
            bulkBtn.disabled = false;
            studentMsg.style.display = 'none';
            filterMsg.textContent = '';
            actionsMsg.textContent = '';
            tableMsg.style.display = 'none';
            table.style.opacity = 1;
            // Load table
            await loadSchedulesTable();
        };

        // Step 3: Year/Semester filter
        yearSelect.onchange = loadSchedulesTable;
        semSelect.onchange = loadSchedulesTable;

        // Step 4: Actions (handled by enabling/disabling above)

        // Step 5: Table (handled by loadSchedulesTable)
    }

    // Call this when switching to Manage Schedules section
    if (window.location.hash.includes('Manage Schedules') || document.getElementById('schedulesTable')) {
        setupManageSchedulesStepper();
    }

    // Ensure section dropdown is populated when Manage Schedules is shown
    if (window.location.hash.includes('Manage Schedules') || document.getElementById('schedulesTable')) {
        populateScheduleSectionDropdown();
        setupManageSchedulesStepper();
    }

    // Ensure released grades modal exists in DOM
    if (!document.getElementById('releasedGradesModal')) {
        const modal = document.createElement('div');
        modal.id = 'releasedGradesModal';
        modal.style.display = 'none';
        modal.style.position = 'fixed';
        modal.style.top = '0';
        modal.style.left = '0';
        modal.style.width = '100vw';
        modal.style.height = '100vh';
        modal.style.background = 'rgba(0,0,0,0.4)';
        modal.style.zIndex = '9999';
        modal.innerHTML = `
            <div style="background:#fff;max-width:600px;margin:60px auto;padding:24px 24px 12px 24px;border-radius:8px;position:relative;">
                <h3 style="margin-top:0;">Released Grades</h3>
                <div id="releasedGradesModalContent"></div>
                <button id="closeReleasedGradesModal" style="margin-top:16px;float:right;padding:6px 18px;">Close</button>
            </div>
        `;
        document.body.appendChild(modal);
        document.getElementById('closeReleasedGradesModal').onclick = () => {
            modal.style.display = 'none';
        };
    }

    // --- Manage Schedules: New Stepper UI Logic ---
    // This function is now moved to global scope below



    // Patch section dropdown population to filter by course
    // This function is now moved to global scope below


});

// Ensure this function exists and is robust
async function populateCourseDropdown(selectId) {
    const select = document.getElementById(selectId);
    if (!select) return;
    select.innerHTML = '<option value="">-- Select Course --</option>';
    try {
        const response = await fetch('/api/auth/courses');
        if (response.ok) {
            const courses = await response.json();
            if (courses.length === 0) {
                const option = document.createElement('option');
                option.value = '';
                option.textContent = 'No courses found';
                select.appendChild(option);
            } else {
                courses.forEach(course => {
                    const option = document.createElement('option');
                    option.value = course.code;
                    option.textContent = course.name;
                    select.appendChild(option);
                });
            }
        } else {
            const option = document.createElement('option');
            option.value = '';
            option.textContent = 'Error loading courses';
            select.appendChild(option);
        }
    } catch (error) {
        const option = document.createElement('option');
        option.value = '';
        option.textContent = 'Error loading courses';
        select.appendChild(option);
        console.error('Error loading courses:', error);
    }
}

// At the start of loadEncodeGradesData, call populateCourseDropdown
// (already present, but ensure it is the first thing called)

function calculateGPA(grades, allSubjects) {
    let totalGpa = 0, totalUnits = 0;
    const rows = grades.map(g => {
        let subject = allSubjects.find(s => s.code === g.subjectCode) || {};
        const units = (g.units && g.units !== 'N/A') ? Number(g.units) : (subject.units || 0);
        let gpa = '';
        if (units && g.numericGrade !== null && g.numericGrade !== undefined && !isNaN(units) && !isNaN(Number(g.numericGrade))) {
            gpa = (units * Number(g.numericGrade)).toFixed(2);
            totalGpa += units * Number(g.numericGrade);
            totalUnits += units;
        }
        return { ...g, units, gpa };
    });
    const overallGpa = (totalUnits > 0) ? (totalGpa / totalUnits).toFixed(2) : '';
    return { rows, overallGpa };
}

// Global function for populating schedule section dropdown
window.populateScheduleSectionDropdown = async function() {
    const sectionSelect = document.getElementById('scheduleSectionSelect');
    const courseFilter = document.getElementById('scheduleCourseFilter');
    if (!sectionSelect) return;
    try {
        const response = await fetch('/api/auth/sections');
        if (response.ok) {
            const sections = await response.json();
            sectionSelect.innerHTML = '<option value="">All Sections</option>';
            const selectedCourse = courseFilter ? courseFilter.value : '';
            sections.forEach(section => {
                if (!selectedCourse || section.courseCode === selectedCourse) {
                    const option = document.createElement('option');
                    option.value = section.id;
                    option.textContent = section.name + ' (' + section.id + ')';
                    sectionSelect.appendChild(option);
                }
            });
        }
    } catch (e) {
        sectionSelect.innerHTML = '<option value="">Error loading sections</option>';
    }
};

// --- Manage Schedules: New Stepper UI Logic (Global Scope) ---
function setupManageSchedulesNewStepper() {
    const courseFilter = document.getElementById('scheduleCourseFilter');
    const actionsCard = document.getElementById('step1-actions');
    const sectionCard = document.getElementById('step2-section');
    const studentCard = document.getElementById('step3-student');
    const filterCard = document.getElementById('step4-filter');
    const tableCard = document.getElementById('step5-table');
    const bulkBtn = document.getElementById('openBulkScheduleModal');
    const sectionSelect = document.getElementById('scheduleSectionSelect');

    if (!courseFilter || !actionsCard || !sectionCard || !studentCard || !filterCard || !tableCard || !bulkBtn) {
        console.log('Some Manage Schedules elements not found, skipping setup');
        return;
    }

    // Hide all steps except course filter and actions
    sectionCard.style.display = 'none';
    studentCard.style.display = 'none';
    filterCard.style.display = 'none';
    tableCard.style.display = 'none';
    bulkBtn.disabled = false;

    // Populate course filter
    populateCourseDropdown('scheduleCourseFilter');
    courseFilter.onchange = async function() {
        await window.populateScheduleSectionDropdown();
    };

    // Bulk button: show modal immediately, do not reveal other steps
    bulkBtn.onclick = async function(e) {
        e.preventDefault();
        sectionCard.style.display = 'none';
        studentCard.style.display = 'none';
        filterCard.style.display = 'none';
        tableCard.style.display = 'none';
        bulkBtn.disabled = false;
        // Show bulk modal (existing logic)
        if (typeof openBulkScheduleModalBtn !== 'undefined' && openBulkScheduleModalBtn.onclick) {
            openBulkScheduleModalBtn.onclick();
        } else {
            // fallback: show modal directly
            const modal = document.getElementById('bulkScheduleModal');
            if (modal) {
                modal.style.display = 'block';
                document.body.style.overflow = 'hidden';
            }
        }
    };



    // When switching away, reset steps and re-enable buttons
    window.resetManageSchedulesStepper = function() {
        sectionCard.style.display = 'none';
        studentCard.style.display = 'none';
        filterCard.style.display = 'none';
        tableCard.style.display = 'none';
        bulkBtn.disabled = false;
    };
}

// --- Ensure Manage Schedules stepper is always initialized ---
function ensureManageSchedulesStepperInit() {
    // Listen for hashchange (tab switch)
    window.addEventListener('hashchange', () => {
        if (window.location.hash.includes('Manage Schedules') || document.getElementById('schedulesTable')) {
            setupManageSchedulesNewStepper();
        }
    });
    // Also run on DOMContentLoaded and after navigation
    if (window.location.hash.includes('Manage Schedules') || document.getElementById('schedulesTable')) {
        setupManageSchedulesNewStepper();
    }
}

// Call this at the end of the file
ensureManageSchedulesStepperInit();

// In the Add/Edit Section modal logic, update the onOpen function:
// - Get the selected course from the main page filter (sectionCourseFilter)
// - Populate the Course Code dropdown with only that course
// - Set the value and make it read-only/disabled
// - For edit, also pre-fill with the section's course

// Update the onOpen function for setupModal('sectionModal', ...)
const mainSectionCourseFilter = document.getElementById('sectionCourseFilter');

function getMainSectionSelectedCourse() {
    return mainSectionCourseFilter ? mainSectionCourseFilter.value : '';
}

// Patch the onOpen function for Add Section
const origSectionModalOnOpen = async () => {
    document.getElementById('sectionModalTitle').textContent = "Add New Section";
    document.getElementById('sectionForm').reset();
    document.getElementById('sectionEditCode').value = '';
    document.getElementById('sectionCodeModal').readOnly = false;
    // Only show the selected course in the Course Code dropdown
    const courseCodeSelect = document.getElementById('sectionCourseCodeModal');
    const selectedCourse = getMainSectionSelectedCourse();
    courseCodeSelect.innerHTML = '<option value="">-- Select Course --</option>';
    if (selectedCourse) {
        const option = document.createElement('option');
        option.value = selectedCourse;
        option.textContent = selectedCourse;
        courseCodeSelect.appendChild(option);
        courseCodeSelect.value = selectedCourse;
        courseCodeSelect.disabled = true;
    } else {
        courseCodeSelect.disabled = false;
    }
    document.getElementById('sectionCourseCodeModal').onchange = generateSectionNameAndId;
    document.getElementById('sectionYearLevelModal').onchange = generateSectionNameAndId;
    document.getElementById('sectionLetterModal').onchange = generateSectionNameAndId;
};

// Patch the onOpen function for Edit Section
async function openEditSectionModal(section) {
    document.getElementById('sectionModalTitle').textContent = "Edit Section";
    const form = document.getElementById('sectionForm');
    form.reset();
    form.sectionEditCode.value = section.id;
    form.sectionCodeModal.value = section.id;
    document.getElementById('sectionCodeModal').readOnly = true;
    form.sectionNameModal.value = section.name;
    // Only show the section's course in the Course Code dropdown
    const courseCodeSelect = document.getElementById('sectionCourseCodeModal');
    courseCodeSelect.innerHTML = '';
    const option = document.createElement('option');
    option.value = section.courseCode;
    option.textContent = section.courseCode;
    courseCodeSelect.appendChild(option);
    courseCodeSelect.value = section.courseCode;
    courseCodeSelect.disabled = true;
    form.sectionYearLevelModal.value = section.yearLevel || '';
    form.sectionLetterModal.value = section.sectionLetter || '';
    form.sectionMaxCapacityModal.value = section.maxCapacity || 30;
    form.sectionCurrentEnrollmentModal.value = section.currentEnrollment || 0;
    document.getElementById('sectionModal').style.display = 'block';
    document.body.style.overflow = 'hidden';
}

// Setup schedule modal with new CRUD operations
setupModal('scheduleModal', null, 'closeScheduleModal', 'scheduleForm',
    async (form) => {
        const formData = new FormData(form);
        const scheduleData = {
            studentId: manageSchedulesState.selectedStudent,
            subjectCode: formData.get('scheduleSubjectCodeModal'),
            description: formData.get('scheduleDescriptionModal'),
            units: parseInt(formData.get('scheduleUnitsModal')),
            lec: parseInt(formData.get('scheduleLecModal')),
            lab: parseInt(formData.get('scheduleLabModal')),
            day: formData.get('scheduleDayModal'),
            startTime: formData.get('scheduleStartTimeModal'),
            endTime: formData.get('scheduleEndTimeModal'),
            room: formData.get('scheduleRoomModal'),
            faculty: formData.get('scheduleFacultyModal'),
            academicYear: formData.get('scheduleAcademicYearModal'),
            semester: formData.get('scheduleSemesterModal')
        };
        
        const scheduleId = formData.get('scheduleEditId');
        if (scheduleId) {
            return await updateSchedule(scheduleId, scheduleData);
        } else {
            return await createSchedule(scheduleData);
        }
    },
    async (form) => {
        // Reset form for new schedule
        form.reset();
        form.scheduleEditId.value = '';
        document.getElementById('scheduleModalTitle').textContent = 'Add Schedule Item';
        
        // Pre-populate with current student if available
        if (manageSchedulesState.selectedStudent) {
            // Populate dropdowns for the current student's context
            await populateScheduleDropdownsForStudent(manageSchedulesState.selectedStudent);
        }
    },
    'cancelScheduleForm');

// Setup section modal (restore the original)
setupModal('sectionModal', 'openAddSectionModal', 'closeSectionModal', 'sectionForm',
    async (form) => { /* ...existing submit logic... */ },
    origSectionModalOnOpen, 'cancelSectionForm');

// ============================================================================
// MANAGE SCHEDULES SECTION - COMPREHENSIVE IMPLEMENTATION
// ============================================================================
