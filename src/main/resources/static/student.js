document.addEventListener('DOMContentLoaded', async () => {
    const currentUser = checkAuthentication();
    if (!currentUser) return;

    // Fetch student data from backend
    let freshCurrentUser = null;
    try {
        const response = await fetch(`/api/auth/me?userId=${encodeURIComponent(currentUser.id)}`);
        if (response.ok) {
            freshCurrentUser = await response.json();
        }
    } catch (e) {
        console.error("Failed to fetch student data from backend:", e);
    }
    // Expose to global scope for manual trigger button
    window.freshCurrentUser = freshCurrentUser;

    const studentNameHeader = document.getElementById('studentNameHeader');
    if (studentNameHeader && freshCurrentUser) studentNameHeader.textContent = freshCurrentUser.name.split(',')[0];

    const studentInfoBar = document.getElementById('studentInfoBar');
    if (studentInfoBar && freshCurrentUser) studentInfoBar.textContent = `${freshCurrentUser.name} (${freshCurrentUser.id})`;

    const navLinks = document.querySelectorAll('.sidebar .nav-link');
    const contentSections = document.querySelectorAll('.main-content .content-section');

    // Load initial section data (Home) and check for congrats modal
    if (freshCurrentUser) {
        loadSectionData('home', freshCurrentUser); // Load home data first
        // Restore original one-time modal logic with debug logs
        checkForEnrollmentApprovalWithDebug(freshCurrentUser);
        
        // Set up auto-refresh for enrollment section
        let enrollmentRefreshInterval = null;
        let accountsRefreshInterval = null;
        let scheduleRefreshInterval = null;
        let gradesRefreshInterval = null;
        
        // Function to start auto-refresh for enrollment
        function startEnrollmentAutoRefresh() {
            if (enrollmentRefreshInterval) {
                clearInterval(enrollmentRefreshInterval);
            }
            enrollmentRefreshInterval = setInterval(() => {
                const enrollmentSection = document.getElementById('enrollment');
                if (enrollmentSection && enrollmentSection.classList.contains('active')) {
                    loadEnrollmentData(freshCurrentUser);
                }
            }, 30000); // Refresh every 30 seconds
        }
        
        // Function to start auto-refresh for accounts
        function startAccountsAutoRefresh() {
            if (accountsRefreshInterval) {
                clearInterval(accountsRefreshInterval);
            }
            accountsRefreshInterval = setInterval(() => {
                const accountsSection = document.getElementById('accounts');
                if (accountsSection && accountsSection.classList.contains('active')) {
                    loadAccountsData(freshCurrentUser.id);
                }
            }, 15000); // Refresh every 15 seconds for accounts
        }
        
        // Function to start auto-refresh for schedule
        function startScheduleAutoRefresh() {
            if (scheduleRefreshInterval) {
                clearInterval(scheduleRefreshInterval);
            }
            scheduleRefreshInterval = setInterval(() => {
                const scheduleSection = document.getElementById('schedule');
                if (scheduleSection && scheduleSection.classList.contains('active')) {
                    loadScheduleData(freshCurrentUser);
                }
            }, 20000); // Refresh every 20 seconds for schedule
        }
        
        // Function to start auto-refresh for grades
        function startGradesAutoRefresh() {
            if (gradesRefreshInterval) {
                clearInterval(gradesRefreshInterval);
            }
            gradesRefreshInterval = setInterval(() => {
                const gradesSection = document.getElementById('grades');
                if (gradesSection && gradesSection.classList.contains('active')) {
                    loadGradesData(freshCurrentUser);
                }
            }, 15000); // Refresh every 15 seconds for grades
        }
        
        // Function to stop auto-refresh
        function stopEnrollmentAutoRefresh() {
            if (enrollmentRefreshInterval) {
                clearInterval(enrollmentRefreshInterval);
                enrollmentRefreshInterval = null;
            }
        }

        // Function to stop accounts auto-refresh
        function stopAccountsAutoRefresh() {
            if (accountsRefreshInterval) {
                clearInterval(accountsRefreshInterval);
                accountsRefreshInterval = null;
            }
        }
        
        // Function to stop schedule auto-refresh
        function stopScheduleAutoRefresh() {
            if (scheduleRefreshInterval) {
                clearInterval(scheduleRefreshInterval);
                scheduleRefreshInterval = null;
            }
        }
        
        // Function to stop grades auto-refresh
        function stopGradesAutoRefresh() {
            if (gradesRefreshInterval) {
                clearInterval(gradesRefreshInterval);
                gradesRefreshInterval = null;
            }
        }
        
        // Modify the nav link click handler to manage auto-refresh
        navLinks.forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                navLinks.forEach(l => l.classList.remove('active'));
                link.classList.add('active');

                contentSections.forEach(section => section.classList.remove('active'));
                const targetSectionId = link.dataset.target;
                const targetSection = document.getElementById(targetSectionId);
                if (targetSection && freshCurrentUser) {
                    targetSection.classList.add('active');
                    loadSectionData(targetSectionId, freshCurrentUser);
                    
                    // Start auto-refresh for enrollment section
                    if (targetSectionId === 'enrollment') {
                        startEnrollmentAutoRefresh();
                    } else {
                        stopEnrollmentAutoRefresh();
                    }
                    
                    // Start auto-refresh for accounts section
                    if (targetSectionId === 'accounts') {
                        startAccountsAutoRefresh();
                    } else {
                        stopAccountsAutoRefresh();
                    }
                    
                    // Start auto-refresh for schedule section
                    if (targetSectionId === 'schedule') {
                        startScheduleAutoRefresh();
                    } else {
                        stopScheduleAutoRefresh();
                    }
                    
                    // Start auto-refresh for grades section
                    if (targetSectionId === 'grades') {
                        startGradesAutoRefresh();
                    } else {
                        stopGradesAutoRefresh();
                    }
                }
            });
        });
        
        // Add refresh button functionality for schedule
        const refreshScheduleBtn = document.getElementById('refreshScheduleBtn');
        if (refreshScheduleBtn) {
            refreshScheduleBtn.addEventListener('click', () => {
                if (freshCurrentUser) {
                    loadScheduleData(freshCurrentUser);
                    showNotification('Schedule refreshed successfully!', 'success');
                }
            });
        }

        // Add refresh button functionality for accounts
        const refreshAccountsBtn = document.getElementById('refreshAccountsBtn');
        if (refreshAccountsBtn && freshCurrentUser) {
            refreshAccountsBtn.addEventListener('click', () => {
                loadAccountsData(freshCurrentUser.id);
                showNotification('Account refreshed successfully!', 'success');
            });
        }
    } else {
        alert("Error: Could not retrieve your data. Please log out and log in again.");
        handleLogout();
    }

    function loadSectionData(sectionId, student) {
        if (!student) {
            console.error("Student data not available for loading section.");
            return;
        }
        
        // Set enrollment status based on backend data, not localStorage
        student.isCurrentlyEnrolled = student.status && student.status.toLowerCase().includes('enrolled');

        switch (sectionId) {
            case 'home':
                loadHomeData(student);
                break;
            case 'enrollment':
                loadEnrollmentData(student);
                break;
            case 'accounts':
                loadAccountsData(student.id);
                break;
            case 'schedule':
                loadScheduleData(student);
                break;
            case 'grades':
                loadGradesData(student);
                break;
            case 'forms':
                loadStudentCurriculum(student);
                break;
        }
    }

    function displayEnrollmentApprovedModal(studentName, courseName, termSY, termSem) {
        const modal = document.getElementById('enrollmentApprovedModal');
        const studentNameEl = document.getElementById('enrollmentApprovedStudentName');
        const courseEl = document.getElementById('enrollmentApprovedCourse');
        const termSYEl = document.getElementById('enrollmentApprovedTermSY');
        const termSemEl = document.getElementById('enrollmentApprovedTermSem');
        const closeBtn = document.getElementById('closeEnrollmentApprovedModal');

        if (studentNameEl) studentNameEl.textContent = studentName;
        if (courseEl) courseEl.textContent = courseName || 'your program';
        if (termSYEl) termSYEl.textContent = termSY || 'the current term';
        if (termSemEl) termSemEl.textContent = termSem || '';

        if (modal) {
            modal.style.display = 'block';
            document.body.style.overflow = 'hidden';
        }
        
        const closeModal = () => {
            if (modal) {
                modal.style.display = 'none';
                document.body.style.overflow = 'auto';
                // Load the home section to show latest data
                loadSectionData('home', freshCurrentUser);
            }
        };

        if (closeBtn) {
            closeBtn.onclick = closeModal;
        }

        // Only close on outside click if explicitly clicked outside
        window.onclick = function(event) {
            if (event.target === modal) {
                closeModal();
            }
        };
    }

    // Function to refresh student data from backend
    async function refreshStudentData(studentId) {
        try {
            const response = await fetch(`/api/auth/me?userId=${encodeURIComponent(studentId)}`);
            if (response.ok) {
                const updatedStudent = await response.json();
                // Update the global student data
                Object.assign(freshCurrentUser, updatedStudent);
                return updatedStudent;
            }
        } catch (e) {
            console.error("Failed to refresh student data from backend:", e);
        }
        return null;
    }

    // Function to check for enrollment approval and show congratulations modal
    async function checkForEnrollmentApproval(student) {
        try {
            const response = await fetch(`/api/student/enrollment/requests/${student.id}`);
            if (response.ok) {
                const requests = await response.json();
                const approvedRequest = requests.find(req => req.status === 'approved');
                if (approvedRequest && student.status && student.status.toLowerCase().includes('enrolled')) {
                    // Use localStorage key to track if modal was shown for this student and term
                    const modalKey = `enrollmentApprovedModalShown_${student.id}_${approvedRequest.academicYear}_${approvedRequest.semester}`;
                    if (!localStorage.getItem(modalKey)) {
                        // Show congratulations modal
                        displayEnrollmentApprovedModal(
                            student.name,
                            student.course,
                            approvedRequest.academicYear,
                            approvedRequest.semester
                        );
                        localStorage.setItem(modalKey, 'true');
                    }
                }
            }
        } catch (e) {
            console.error('Failed to check for enrollment approval:', e);
        }
    }

    // Add this function after the original checkForEnrollmentApproval
    async function checkForEnrollmentApprovalWithDebug(student) {
        try {
            console.log('[DEBUG] Checking for enrollment approval for:', student.id, student.status);
            const response = await fetch(`/api/student/enrollment/requests/${student.id}`);
            if (response.ok) {
                const requests = await response.json();
                const approvedRequest = requests.find(req => req.status === 'approved');
                console.log('[DEBUG] Enrollment requests:', requests);
                if (!approvedRequest) {
                    console.log('[DEBUG] No approved enrollment request found.');
                    return;
                }
                if (!student.status || !student.status.toLowerCase().includes('enrolled')) {
                    console.log('[DEBUG] Student status is not enrolled:', student.status);
                    return;
                }
                const modalKey = `enrollmentApprovedModalShown_${student.id}_${approvedRequest.academicYear}_${approvedRequest.semester}`;
                if (localStorage.getItem(modalKey)) {
                    console.log('[DEBUG] Modal already shown for this term:', modalKey);
                    return;
                }
                // Show congratulations modal
                console.log('[DEBUG] Showing congratulatory modal!');
                displayEnrollmentApprovedModal(
                    student.name,
                    student.course,
                    approvedRequest.academicYear,
                    approvedRequest.semester
                );
                localStorage.setItem(modalKey, 'true');
            } else {
                console.log('[DEBUG] Failed to fetch enrollment requests:', response.status);
            }
        } catch (e) {
            console.error('[DEBUG] Error in checkForEnrollmentApprovalWithDebug:', e);
        }
    }

    async function loadHomeData(student) {
        let messages = [];
        try {
            const response = await fetch(`/api/student/inbox/${student.id}`);
            if (response.ok) {
                messages = await response.json();
                messages = messages.sort((a,b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
            }
        } catch (e) {
            console.error('Failed to fetch inbox from backend:', e);
        }
        const inboxCountEl = document.getElementById('inboxCount');
        const inboxMessagesEl = document.getElementById('inboxMessages');

        if (inboxCountEl) inboxCountEl.textContent = messages.filter(m => !m.isRead).length;

        if (inboxMessagesEl) {
            inboxMessagesEl.innerHTML = '';
            if (messages.length === 0) {
                inboxMessagesEl.innerHTML = '<p class="text-muted" style="text-align:center; padding:10px;">No messages in your inbox.</p>';
                return;
            }

            const table = document.createElement('table');
            table.innerHTML = `<thead><tr><th>Date</th><th>Subject</th><th>Status</th></tr></thead>`;
            const tbody = document.createElement('tbody');
            messages.slice(0, 5).forEach(msg => {
                const row = tbody.insertRow();
                // Date cell
                let dateStr = '';
                if (msg.timestamp) {
                    const d = new Date(msg.timestamp);
                    if (!isNaN(d.getTime())) {
                        dateStr = d.toLocaleString('en-US', {
                            month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit', hour12: true
                        });
                    }
                }
                row.insertCell().textContent = dateStr || 'No Date';
                // Subject cell
                const subjectCell = row.insertCell();
                const subjectLink = document.createElement('a');
                subjectLink.href = '#';
                subjectLink.textContent = msg.subject;
                subjectLink.style.fontWeight = msg.isRead ? 'normal' : 'bold';
                subjectLink.onclick = async (e) => {
                    e.preventDefault();
                    alert(`Message from: System\nDate: ${dateStr || 'No Date'}\nSubject: ${msg.subject}\n\n${msg.content}`);
                    // Mark as read in backend
                    if (!msg.isRead && msg.id) {
                        await fetch(`/api/student/inbox/read/${msg.id}`, { method: 'PUT' });
                    }
                    loadHomeData(student);
                };
                subjectCell.appendChild(subjectLink);
                // Status cell
                const statusCell = row.insertCell();
                if (msg.isRead) {
                    statusCell.textContent = 'Read';
                    statusCell.style.color = '#888';
                    statusCell.style.fontWeight = 'normal';
                } else {
                    statusCell.textContent = 'Unread';
                    statusCell.style.color = '#2196f3';
                    statusCell.style.fontWeight = 'bold';
                }
                if (!msg.isRead) row.style.fontWeight = 'bold';
            });
            table.appendChild(tbody);
            inboxMessagesEl.appendChild(table);
            if (messages.length > 5) {
                const viewAllLink = document.createElement('a');
                viewAllLink.href = "#";
                viewAllLink.textContent = "View all messages...";
                viewAllLink.style.display = "block";
                viewAllLink.style.textAlign = "right";
                viewAllLink.style.marginTop = "10px";
                viewAllLink.onclick = (e) => { e.preventDefault(); alert("Full inbox view not implemented yet.");}
                inboxMessagesEl.appendChild(viewAllLink);
            }
        }
    }

    async function loadEnrollmentData(student) {
        // Optionally refresh student data first
        let updatedStudent = student;
        try {
            const url = `/api/auth/me?userId=${encodeURIComponent(student.id)}`;
            console.log('[DEBUG] Fetching user:', url);
            const response = await fetch(url);
            console.log('[DEBUG] User fetch status:', response.status);
            if (response.ok) {
                updatedStudent = await response.json();
            }
        } catch (e) {
            console.error("Failed to refresh student data from backend:", e);
        }

        let requests = [];
        try {
            const url = `/api/student/enrollment/requests/${student.id}`;
            console.log('[DEBUG] Fetching enrollment requests:', url);
            const response = await fetch(url);
            console.log('[DEBUG] Enrollment requests fetch status:', response.status);
            if (response.ok) {
                requests = await response.json();
            }
        } catch (e) {
            console.error('Failed to fetch enrollment requests from backend:', e);
        }

        // Get courses for dropdown
        let courses = [];
        try {
            const url = '/api/auth/courses';
            console.log('[DEBUG] Fetching courses:', url);
            const response = await fetch(url);
            console.log('[DEBUG] Courses fetch status:', response.status);
            if (response.ok) {
                courses = await response.json();
            }
        } catch (e) {
            console.error('Failed to fetch courses from backend:', e);
        }

        const container = document.getElementById('enrollmentStatusContainer');
        if (!container) return;

        // Check if student is currently enrolled
        const isEnrolled = updatedStudent.status && updatedStudent.status.toLowerCase().includes('enrolled');
        console.log('[DEBUG] updatedStudent:', updatedStudent);
        console.log('[DEBUG] isEnrolled:', isEnrolled, 'status:', updatedStudent.status);
        const hasPendingRequest = requests.some(req => req.status === 'pending');

        let html = '';

        if (isEnrolled) {
            // Student is enrolled - show enrollment details
            html = `
                <div class="oaa-card">
                    <div class="oaa-card-header">
                        <span style="color: var(--success-color);">✓ Enrollment Status: Enrolled</span>
                    </div>
                    <div class="enrollment-details">
                        <p><strong>Course:</strong> ${updatedStudent.course || 'N/A'}</p>
                        <p><strong>Section:</strong> ${updatedStudent.section || 'N/A'}</p>
                        <p><strong>Current Term:</strong> S.Y. ${updatedStudent.currentSY || '2425'} - ${updatedStudent.currentSem || 'First Semester'}</p>
                        <p><strong>Status:</strong> ${updatedStudent.status || 'Enrolled'}</p>
                    </div>
                </div>
            `;
        } else if (hasPendingRequest) {
            // Student has pending enrollment request
            const pendingRequest = requests.find(req => req.status === 'pending');
            html = `
                <div class="oaa-card">
                    <div class="oaa-card-header">
                        <span style="color: var(--warning-color);">⏳ Enrollment Status: Pending</span>
                    </div>
                    <div class="enrollment-details">
                        <p><strong>Applied Course:</strong> ${pendingRequest.course}</p>
                        <p><strong>Term Applied For:</strong> S.Y. ${pendingRequest.academicYear} - ${pendingRequest.semester}</p>
                        <p><strong>Date Applied:</strong> ${new Date(pendingRequest.requestDate).toLocaleDateString()}</p>
                        <p><strong>Status:</strong> ${pendingRequest.status}</p>
                        ${pendingRequest.remarks ? `<p><strong>Remarks:</strong> ${pendingRequest.remarks}</p>` : ''}
                    </div>
                    <div style="margin-top: 15px;">
                        <p style="color: var(--info-color); font-style: italic;">
                            Your enrollment request is being reviewed. You will receive a notification once it's processed.
                        </p>
                    </div>
                </div>
            `;
        } else {
            // Student can apply for enrollment
            html = `
                <div class="oaa-card">
                    <div class="oaa-card-header">
                        <span style="color: var(--info-color);">📝 Enrollment Status: Not Enrolled</span>
                    </div>
                    <div class="enrollment-details">
                        <p>You are not currently enrolled. Please apply for enrollment to continue your studies.</p>
                    </div>
                    <div style="margin-top: 20px;">
                        <button id="applyEnrollmentBtn" class="btn btn-primary">Apply for Enrollment</button>
                    </div>
                </div>
            `;
        }

        // Show enrollment history if any
        if (requests.length > 0) {
            html += `
                <div class="oaa-card" style="margin-top: 20px;">
                    <div class="oaa-card-header">Enrollment History</div>
                    <table style="width: 100%; margin-top: 10px;">
                        <thead>
                            <tr>
                                <th>Date Applied</th>
                                <th>Course</th>
                                <th>Term</th>
                                <th>Status</th>
                                <th>Remarks</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${requests.map(req => `
                                <tr>
                                    <td>${new Date(req.requestDate).toLocaleDateString()}</td>
                                    <td>${req.course}</td>
                                    <td>S.Y. ${req.academicYear} - ${req.semester}</td>
                                    <td>
                                        <span style="color: ${
                                            req.status === 'approved' ? 'var(--success-color)' :
                                            req.status === 'rejected' ? 'var(--danger-color)' :
                                            'var(--warning-color)'
                                        };">
                                            ${req.status.charAt(0).toUpperCase() + req.status.slice(1)}
                                        </span>
                                    </td>
                                    <td>${req.remarks || '-'}</td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
            `;
        }

        container.innerHTML = html;

        // Add event listener for apply enrollment button
        const applyBtn = document.getElementById('applyEnrollmentBtn');
        if (applyBtn) {
            applyBtn.addEventListener('click', () => showEnrollmentForm(updatedStudent, courses));
        }
    }

    function showEnrollmentForm(student, courses) {
        const modal = document.createElement('div');
        modal.className = 'modal';
        modal.style.display = 'block';
        document.body.style.overflow = 'hidden';

        // Set academic year to 2025-2026
        const academicYear = '2025-2026';

        // Find the preferred course object
        const preferredCourseObj = courses.find(c => c.code === student.preferredCourseCode);
        const preferredCourseText = preferredCourseObj ? `${preferredCourseObj.name} (${preferredCourseObj.code})` : (student.preferredCourseCode || 'N/A');

        modal.innerHTML = `
            <div class="modal-content" style="max-width: 500px;">
                <div class="modal-header">
                    <h3>Apply for Enrollment</h3>
                    <button class="close-button" onclick="this.closest('.modal').remove(); document.body.style.overflow='auto';">×</button>
                </div>
                <div class="modal-body">
                    <form id="enrollmentForm">
                        <div class="form-group">
                            <label>Preferred Course:</label>
                            <div id="enrollmentCourseText" style="font-weight:bold;">${preferredCourseText}</div>
                            <input type="hidden" id="enrollmentCourse" value="${student.preferredCourseCode || ''}">
                        </div>
                        <div class="form-group">
                            <label for="enrollmentSemester">Semester:</label>
                            <select id="enrollmentSemester" required>
                                <option value="First Semester">First Semester</option>
                                <option value="Second Semester">Second Semester</option>
                                <option value="Summer">Summer</option>
                            </select>
                        </div>
                        <div class="form-group">
                            <label for="enrollmentYear">Academic Year:</label>
                            <input type="text" id="enrollmentYear" value="${academicYear}" required readonly>
                        </div>
                        <div class="form-group">
                            <label for="enrollmentRemarks">Remarks (optional):</label>
                            <textarea id="enrollmentRemarks" rows="2" placeholder="Any additional info..."></textarea>
                        </div>
                        <button type="submit" class="btn btn-primary" style="width:100%;">Submit Enrollment Request</button>
                    </form>
                </div>
            </div>
        `;
        document.body.appendChild(modal);
        const form = modal.querySelector('#enrollmentForm');
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            const courseCode = document.getElementById('enrollmentCourse').value;
            const semester = document.getElementById('enrollmentSemester').value;
            const academicYear = document.getElementById('enrollmentYear').value;
            const remarks = document.getElementById('enrollmentRemarks').value;
            if (!courseCode || !semester || !academicYear) {
                alert('Please fill in all required fields.');
                return;
            }
            const selectedCourse = courses.find(c => c.code === courseCode);
            const enrollmentRequest = {
                studentId: student.id,
                studentName: student.name,
                course: selectedCourse ? selectedCourse.name : courseCode,
                preferredCourseCode: courseCode,
                semester: semester,
                academicYear: academicYear,
                requestDate: new Date().toISOString().split('T')[0],
                status: 'pending',
                remarks: remarks
            };
            try {
                const response = await fetch('/api/student/enrollment/submit', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(enrollmentRequest)
                });
                if (response.ok) {
                    alert('Enrollment request submitted successfully!');
                    modal.remove();
                    document.body.style.overflow = 'auto';
                    loadEnrollmentData(student);
                } else {
                    throw new Error('Failed to submit enrollment request');
                }
            } catch (error) {
                alert(error.message);
            }
        });
    }

    // Function to show a notification
    function showNotification(message, type = 'info') {
        // Create notification element
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
        
        // Set background color based on type
        switch (type) {
            case 'success':
                notification.style.backgroundColor = 'var(--success-color)';
                break;
            case 'error':
                notification.style.backgroundColor = 'var(--danger-color)';
                break;
            case 'warning':
                notification.style.backgroundColor = 'var(--warning-color)';
                break;
            default:
                notification.style.backgroundColor = 'var(--info-color)';
        }
        
        notification.textContent = message;
        document.body.appendChild(notification);
        
        // Remove notification after 3 seconds
        setTimeout(() => {
            notification.style.animation = 'slideOutRight 0.3s ease-in';
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 300);
        }, 3000);
    }

    // Add CSS animations for notifications
    const style = document.createElement('style');
    style.textContent = `
        @keyframes slideInRight {
            from { transform: translateX(100%); opacity: 0; }
            to { transform: translateX(0); opacity: 1; }
        }
        @keyframes slideOutRight {
            from { transform: translateX(0); opacity: 1; }
            to { transform: translateX(100%); opacity: 0; }
        }
    `;
    document.head.appendChild(style);

    async function loadAccountsData(studentId) {
        let account = null;
        let previousPaymentCount = 0;
        
        // Store previous payment count for comparison
        const accountsTable = document.getElementById('accountsTable');
        if (accountsTable) {
            const existingRows = accountsTable.querySelectorAll('tbody tr');
            previousPaymentCount = existingRows.length - 1; // Subtract 1 for assessment row
        }
        
        try {
            const response = await fetch(`/api/student/account/${studentId}`);
            if (response.ok) {
                account = await response.json();
            }
        } catch (e) {
            console.error('Failed to fetch account from backend:', e);
        }
        
        const tableBody = document.getElementById('accountsTable')?.querySelector('tbody');
        if (!tableBody) return;
        
        tableBody.innerHTML = '';
        
        if (!account) {
            const row = tableBody.insertRow();
            const cell = row.insertCell();
            cell.colSpan = 8;
            cell.textContent = 'No account data available.';
            cell.style.textAlign = 'center';
            cell.style.padding = '20px';
            cell.style.color = 'var(--text-muted)';
            return;
        }

        // Add initial assessment row
        const assessmentRow = tableBody.insertRow();
        assessmentRow.insertCell().textContent = account.academicYear || 'N/A';
        assessmentRow.insertCell().textContent = account.semester || 'N/A';
        assessmentRow.insertCell().textContent = 'N/A'; // Scholarship
        assessmentRow.insertCell().textContent = 'N/A'; // O.R. Date
        assessmentRow.insertCell().textContent = 'N/A'; // O.R. No.
        assessmentRow.insertCell().textContent = `₱${account.totalBalance.toFixed(2)}`; // Assessment
        // Calculate total paid
        const totalPaid = (account.payments || []).reduce((sum, p) => {
            const parts = p.split(': ');
            if (parts.length >= 2) {
                const amount = parseFloat(parts[1].split(' - ')[0]) || 0;
                return sum + amount;
            }
            return sum;
        }, 0);
        assessmentRow.insertCell().textContent = `₱${totalPaid.toFixed(2)}`; // Payment
        assessmentRow.insertCell().textContent = `₱${account.remainingBalance.toFixed(2)}`; // Balance

        // Add payment history rows
        if (account.payments && account.payments.length > 0) {
            account.payments.forEach(payment => {
                // Parse payment string format: "2024-06-22: 5000.00 - Tuition Fee Payment"
                const paymentParts = payment.split(': ');
                if (paymentParts.length >= 2) {
                    const date = paymentParts[0];
                    const amountAndDesc = paymentParts[1].split(' - ');
                    const amount = parseFloat(amountAndDesc[0]) || 0;
                    const description = amountAndDesc[1] || 'Payment';

                    const row = tableBody.insertRow();
                    row.insertCell().textContent = account.academicYear || 'N/A';
                    row.insertCell().textContent = account.semester || 'N/A';
                    row.insertCell().textContent = 'N/A'; // Scholarship
                    row.insertCell().textContent = new Date(date).toLocaleDateString(); // O.R. Date
                    row.insertCell().textContent = 'N/A'; // O.R. No.
                    row.insertCell().textContent = '₱0.00'; // Assessment
                    row.insertCell().textContent = `₱${amount.toFixed(2)}`; // Payment
                    
                    // Calculate running balance
                    const currentBalance = account.totalBalance - account.payments
                        .slice(0, account.payments.indexOf(payment) + 1)
                        .reduce((sum, p) => {
                            const pAmount = parseFloat(p.split(': ')[1].split(' - ')[0]) || 0;
                            return sum + pAmount;
                        }, 0);
                    row.insertCell().textContent = `₱${currentBalance.toFixed(2)}`; // Balance
                }
            });
            
            // Show notification if new payments were added
            const currentPaymentCount = account.payments.length;
            if (currentPaymentCount > previousPaymentCount && previousPaymentCount > 0) {
                const newPayments = currentPaymentCount - previousPaymentCount;
                showNotification(`Account updated! ${newPayments} new payment${newPayments > 1 ? 's' : ''} processed.`, 'success');
            }
        }

        // Add summary row showing current remaining balance
        if (account.remainingBalance !== account.totalBalance) {
            const summaryRow = tableBody.insertRow();
            summaryRow.style.fontWeight = 'bold';
            summaryRow.style.backgroundColor = 'var(--gray-light)';
            
            const summaryCell = summaryRow.insertCell();
            summaryCell.colSpan = 7;
            summaryCell.textContent = 'Current Outstanding Balance:';
            summaryCell.style.textAlign = 'right';
            
            const balanceCell = summaryRow.insertCell();
            balanceCell.textContent = `₱${account.remainingBalance.toFixed(2)}`;
            balanceCell.style.fontWeight = 'bold';
            balanceCell.style.color = account.remainingBalance > 0 ? 'var(--danger-color)' : 'var(--success-color)';
        }
    }

    async function loadScheduleData(student) {
        let scheduleItems = [];
        try {
            // Use 2025-2026 academic year to match enrollment form
            const academicYear = '2025-2026';
            const semester = 'First Semester';
            const response = await fetch(`/api/student/schedule/${student.id}?academicYear=${academicYear}&semester=${semester}`);
            if (response.ok) {
                scheduleItems = await response.json();
            }
        } catch (e) {
            console.error('Failed to fetch schedule from backend:', e);
        }
        
        const tableBody = document.getElementById('scheduleTable')?.querySelector('tbody');
        const syElement = document.getElementById('scheduleSY');
        const semElement = document.getElementById('scheduleSem');
        
        if (!tableBody) return;
        
        tableBody.innerHTML = '';
        
        if (syElement) syElement.textContent = '2025-2026';
        if (semElement) semElement.textContent = 'First Semester';
        
        if (!scheduleItems || scheduleItems.length === 0) {
            const row = tableBody.insertRow();
            const cell = row.insertCell();
            cell.colSpan = 9;
            cell.textContent = 'No schedule data available for the current term.';
            cell.style.textAlign = 'center';
            cell.style.padding = '20px';
            cell.style.color = 'var(--text-muted)';
            return;
        }
        
        scheduleItems.forEach((item, index) => {
            const row = tableBody.insertRow();
            row.insertCell().textContent = index + 1;
            row.insertCell().textContent = item.subjectCode || 'N/A';
            row.insertCell().textContent = item.description || 'N/A';
            row.insertCell().textContent = item.units || 'N/A';
            row.insertCell().textContent = item.lec || 'N/A';
            row.insertCell().textContent = item.lab || 'N/A';
            // Fix Day & Time column to use day, startTime, endTime if available
            let dayTimeDisplay = 'N/A';
            if (item.day && item.startTime && item.endTime) {
                dayTimeDisplay = `${item.day}, ${item.startTime} - ${item.endTime}`;
            } else if (item.dayTime) {
                dayTimeDisplay = item.dayTime;
            }
            row.insertCell().textContent = dayTimeDisplay;
            row.insertCell().textContent = item.room || 'N/A';
            row.insertCell().textContent = item.faculty || 'N/A';
        });
    }

    async function loadGradesData(student) {
        const gradesLoading = document.getElementById('gradesLoading');
        const gradesDebugPanel = document.getElementById('gradesDebugPanel');
        if (gradesLoading) gradesLoading.style.display = 'block';
        if (gradesDebugPanel) gradesDebugPanel.innerHTML = '';
        let grades = [];
        let termGPA = null;
        let cumulativeGPA = null;
        // Get dropdown elements
        const yearSelect = document.getElementById('gradesYearSelect');
        const semSelect = document.getElementById('gradesSemSelect');
        // Fetch all grades for the student (for dropdown population)
        let allGrades = [];
        try {
            const allGradesResponse = await fetch(`/api/student/grades/${student.id}`);
            if (allGradesResponse.ok) {
                allGrades = await allGradesResponse.json();
            }
        } catch (e) {
            showNotification('Failed to fetch grades. Please try again later.', 'error');
            if (gradesLoading) gradesLoading.style.display = 'none';
            return;
        }
        // Find the earliest academic year in the grades (student's start year)
        let allAcademicYears = allGrades.map(g => toYearRange(g.academicYear)).filter(Boolean);
        allAcademicYears = allAcademicYears.filter(y => /^\d{4}-\d{4}$/.test(y));
        let startYear = null;
        if (allAcademicYears.length > 0) {
            startYear = Math.min(...allAcademicYears.map(y => parseInt(y.substr(0,4))));
        }
        // Build up to 4 consecutive academic years from startYear
        let validYears = [];
        if (startYear) {
            for (let i = 0; i < 4; i++) {
                const y1 = startYear + i;
                const y2 = y1 + 1;
                validYears.push(`${y1}-${y2}`);
            }
        }
        // Only show years that are both in validYears and in the grades data
        let years = validYears.filter(y => allAcademicYears.includes(y));
        years.sort((a, b) => b.localeCompare(a)); // Most recent first

        // If no years found, add a default (e.g., current year)
        if (years.length === 0) {
            const now = new Date();
            const y1 = now.getFullYear();
            const y2 = y1 + 1;
            years = [`${y1}-${y2}`];
        }

        // Optionally, label as 1st, 2nd, 3rd, 4th year
        const yearLabels = ['1st Year', '2nd Year', '3rd Year', '4th Year'];
        // Populate year dropdown
        if (yearSelect) {
            yearSelect.innerHTML = '';
            years.forEach((y, idx) => {
                const opt = document.createElement('option');
                opt.value = y;
                opt.textContent = `${y} (${yearLabels[idx] || ''})`;
                yearSelect.appendChild(opt);
            });
            // Default to most recent
            if (years.length > 0) yearSelect.value = years[0];
        }
        // Find all semesters for the selected year
        let sems = [];
        if (yearSelect && yearSelect.value) {
            // Remove label (e.g., '2025-2026 (1st Year)' -> '2025-2026')
            const selectedYearValue = yearSelect.value.replace(/ \(.+\)$/, '');
            sems = allGrades
                .filter(g => toYearRange(g.academicYear) === selectedYearValue)
                .map(g => g.semester)
                .filter(Boolean);
            sems = Array.from(new Set(sems));
        }
        // Populate semester dropdown
        if (semSelect) {
            semSelect.innerHTML = '';
            if (sems.length === 0) {
                // Add default semesters if none found
                ['First Semester', 'Second Semester'].forEach(s => {
                    const opt = document.createElement('option');
                    opt.value = s;
                    opt.textContent = s;
                    semSelect.appendChild(opt);
                });
            } else {
            sems.forEach(s => {
                const opt = document.createElement('option');
                opt.value = s;
                opt.textContent = s;
                semSelect.appendChild(opt);
            });
            }
            // Default to first semester if not set
            semSelect.value = semSelect.options[0]?.value || '';
        }
        // Add event listeners to dropdowns to reload grades on change
        if (yearSelect && semSelect && !yearSelect._listenerAdded) {
            yearSelect.addEventListener('change', () => loadGradesData(student));
            semSelect.addEventListener('change', () => loadGradesData(student));
            yearSelect._listenerAdded = true;
            semSelect._listenerAdded = true;
        }
        // Fetch only released grades for selected year/sem
        const selectedYear = yearSelect ? toYearRange(yearSelect.value) : '';
        const selectedSem = semSelect ? semSelect.value : '';
        let releasedGradesResponse = null;
        let releasedGradesRaw = null;
        try {
            if (selectedYear && selectedSem) {
                const apiUrl = `/api/student/grades/${student.id}/released?semester=${encodeURIComponent(selectedSem)}&academicYear=${encodeURIComponent(selectedYear)}`;
                console.log('Fetching released grades from:', apiUrl);
                releasedGradesResponse = await fetch(apiUrl);
                console.log('Released grades response status:', releasedGradesResponse.status);
                if (releasedGradesResponse.ok) {
                    releasedGradesRaw = await releasedGradesResponse.clone().json();
                    grades = releasedGradesRaw;
                    console.log('Released grades received:', grades);
                } else {
                    releasedGradesRaw = await releasedGradesResponse.text();
                    console.error('Failed to fetch released grades:', releasedGradesRaw);
                }
            }
        } catch (e) {
            console.error('Error fetching released grades:', e);
            showNotification('Failed to fetch released grades. Please try again later.', 'error');
            if (gradesLoading) gradesLoading.style.display = 'none';
            return;
        }
        // Fetch and display term/cumulative GPA as before
        let termGPAData = null;
        try {
            if (selectedYear && selectedSem) {
                const termGPAResponse = await fetch(`/api/student/grades/${student.id}/term-gpa?semester=${encodeURIComponent(selectedSem)}&academicYear=${encodeURIComponent(selectedYear)}`);
                if (termGPAResponse.ok) {
                    termGPAData = await termGPAResponse.json();
                    termGPA = termGPAData.termGPA;
                }
            }
            const cumulativeGPAResponse = await fetch(`/api/student/grades/${student.id}/cumulative-gpa`);
            if (cumulativeGPAResponse.ok) {
                const cumulativeGPAData = await cumulativeGPAResponse.json();
                cumulativeGPA = cumulativeGPAData.cumulativeGPA;
            }
        } catch (e) {
            // GPA is not critical, so just log
            console.error('Failed to fetch GPA:', e);
        }
        // Update UI
        const tableBody = document.getElementById('gradesTable')?.querySelector('tbody');
        const syElement = document.getElementById('gradesSY');
        const semElement = document.getElementById('gradesSem');
        const admissionStatusElement = document.getElementById('admissionStatus');
        const scholasticStatusElement = document.getElementById('scholasticStatus');
        const courseElement = document.getElementById('courseDescription');
        const gpaElement = document.getElementById('gpa');
        const termGPAElement = document.getElementById('termGPA');
        const cumulativeGPAElement = document.getElementById('cumulativeGPA');
        if (!tableBody) {
            if (gradesLoading) gradesLoading.style.display = 'none';
            return;
        }
        tableBody.innerHTML = '';
        if (syElement) syElement.textContent = selectedYear || 'N/A';
        if (semElement) semElement.textContent = selectedSem || 'N/A';
        if (admissionStatusElement) admissionStatusElement.textContent = student.admissionStatus || 'N/A';
        if (scholasticStatusElement) scholasticStatusElement.textContent = student.scholasticStatus || 'N/A';
        if (courseElement) {
            courseElement.textContent = student.course || 'N/A';
        }
        if (termGPAElement) {
            termGPAElement.textContent = termGPA != null ? termGPA.toFixed(2) : 'N/A';
        }
        if (cumulativeGPAElement) {
            cumulativeGPAElement.textContent = cumulativeGPA != null ? cumulativeGPA.toFixed(2) : 'N/A';
        }
        if (gpaElement) {
            gpaElement.textContent = termGPA != null ? termGPA.toFixed(2) : 'N/A';
        }
        // Show number of released grades found (remove API URL from user view)
        if (gradesDebugPanel) {
            gradesDebugPanel.innerHTML = `<div style='margin:10px 0;color:#888;'>Found <b>${grades.length}</b> released grade(s) for <b>${selectedYear}</b> - <b>${selectedSem}</b>.</div>`;
        }
        if (grades.length === 0) {
            const row = tableBody.insertRow();
            const cell = row.insertCell();
            cell.colSpan = 8;
            cell.innerHTML = `<span style='color:#dc3545;'>No released grades available for the selected term.<br><span style='color:#888;font-size:0.95em;'>Possible reasons: (1) Your instructor has not released your grade yet. (2) You are viewing the wrong term. (3) There is a data issue. Please contact support if this persists.</span></span>`;
            cell.style.textAlign = 'center';
            cell.style.padding = '20px';
            cell.style.color = 'var(--text-muted)';
            
            // Show additional info about pending grades
            if (selectedYear && selectedSem) {
                try {
                    const allGradesResponse = await fetch(`/api/student/grades/${student.id}/term?semester=${encodeURIComponent(selectedSem)}&academicYear=${encodeURIComponent(selectedYear)}`);
                    if (allGradesResponse.ok) {
                        const allGrades = await allGradesResponse.json();
                        const unreleasedGrades = allGrades.filter(g => !g.isReleased);
                        if (unreleasedGrades.length > 0) {
                            const infoRow = tableBody.insertRow();
                            const infoCell = infoRow.insertCell();
                            infoCell.colSpan = 8;
                            infoCell.innerHTML = `<div style='background-color:#fff3cd;border:1px solid #ffeaa7;border-radius:4px;padding:10px;margin-top:10px;'><span style='color:#856404;'><strong>Note:</strong> You have ${unreleasedGrades.length} grade(s) that have been encoded but not yet released by your instructor(s). These will appear here once they are released.</span></div>`;
                            infoCell.style.textAlign = 'center';
                        }
                    }
                } catch (e) {
                    console.error('Failed to check for unreleased grades:', e);
                }
            }
            
            if (gradesLoading) gradesLoading.style.display = 'none';
            return;
        }
        // Before rendering the grades table, fetch all subjects for lookup
        let allSubjects = [];
        try {
            const subjRes = await fetch('/api/auth/subjects');
            if (subjRes.ok) allSubjects = await subjRes.json();
        } catch {}
        const { rows: gpaRows, overallGpa } = calculateGPA(grades, allSubjects);
        // After fetching allSubjects and calculating GPA, render the grades table with improved UI
        const gradesSection = document.getElementById('gradesSectionWrapper') || document.getElementById('gradesSection');
        if (gradesSection) {
            let tableHtml = `<div style="overflow-x:auto;">
            <table style="width:100%;border-collapse:collapse;margin-bottom:12px;font-size:1.05em;box-shadow:0 2px 8px #e0e0e0;">
                <thead>
                    <tr style="background:#f8f9fa;">
                        <th style="padding:10px 8px;">#</th>
                        <th style="padding:10px 8px;">Subject Code</th>
                        <th style="padding:10px 8px;">Subject Name</th>
                        <th style="padding:10px 8px;">Units</th>
                        <th style="padding:10px 8px;">Letter Grade</th>
                        <th style="padding:10px 8px;">Numeric Grade</th>
                        <th style="padding:10px 8px;">GPA</th>
                        <th style="padding:10px 8px;">Remarks</th>
                    </tr>
                </thead>
                <tbody>`;
            gpaRows.forEach((grade, index) => {
                const gpaColor = grade.gpa && Number(grade.gpa) <= 3.0 ? '#28a745' : (grade.gpa ? '#dc3545' : '#666');
                tableHtml += `<tr style="background:${index%2===0?'#fff':'#f6f6fa'};">
                    <td style="padding:8px 6px;">${index + 1}</td>
                    <td style="padding:8px 6px;">${grade.subjectCode || ''}</td>
                    <td style="padding:8px 6px;">${grade.subjectName && grade.subjectName !== 'N/A' ? grade.subjectName : (allSubjects.find(s => s.code === grade.subjectCode)?.name || '')}</td>
                    <td style="padding:8px 6px;text-align:center;">${grade.units || ''}</td>
                    <td style="padding:8px 6px;text-align:center;">${grade.grade || ''}</td>
                    <td style="padding:8px 6px;text-align:center;">${grade.numericGrade !== null && grade.numericGrade !== undefined ? Number(grade.numericGrade).toFixed(2) : ''}</td>
                    <td style="padding:8px 6px;text-align:center;color:${gpaColor};font-weight:bold;">${grade.gpa}</td>
                    <td style="padding:8px 6px;">${grade.remarks || ''}</td>
                </tr>`;
            });
            tableHtml += `</tbody>
                <tfoot>
                    <tr style="background:#f1f3f4;font-weight:bold;">
                        <td colspan="6" style="text-align:right;padding:10px 8px;">Overall GPA:</td>
                        <td style="padding:10px 8px;text-align:center;color:${overallGpa && Number(overallGpa) <= 3.0 ? '#28a745' : (overallGpa ? '#dc3545' : '#666')};font-size:1.1em;">${overallGpa}</td>
                        <td></td>
                    </tr>
                </tfoot>
            </table>
            </div>`;
            gradesSection.innerHTML = tableHtml;
        }
        if (gradesLoading) gradesLoading.style.display = 'none';
    }

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

    async function loadFormsData(studentId) {
        let forms = [];
        try {
            const response = await fetch(`/api/student/forms/${studentId}`);
            if (response.ok) {
                forms = await response.json();
            }
        } catch (e) {
            console.error('Failed to fetch forms from backend:', e);
        }
        
        const tableBody = document.getElementById('formsTable')?.querySelector('tbody');
        if (!tableBody) return;
        
        tableBody.innerHTML = '';
        
        if (forms.length === 0) {
            const row = tableBody.insertRow();
            const cell = row.insertCell();
            cell.colSpan = 2;
            cell.textContent = 'No forms available for download.';
            cell.style.textAlign = 'center';
            cell.style.padding = '20px';
            cell.style.color = 'var(--text-muted)';
            return;
        }
        
        forms.forEach(form => {
            const row = tableBody.insertRow();
            row.insertCell().textContent = form.formName || 'N/A';
            
            const actionCell = row.insertCell();
            const downloadBtn = document.createElement('button');
            downloadBtn.textContent = 'Download';
            downloadBtn.classList.add('btn', 'btn-sm', 'btn-primary');
            downloadBtn.onclick = () => {
                // Simulate download - in a real app, this would download the actual file
                alert(`Downloading ${form.formName}...\n\nIn a real application, this would download the actual PDF file.`);
            };
            actionCell.appendChild(downloadBtn);
        });
    }

    async function loadInboxData(studentId) {
        let messages = [];
        try {
            const response = await fetch(`/api/student/inbox/${studentId}`);
            if (response.ok) {
                messages = await response.json();
            }
        } catch (e) {
            console.error('Failed to fetch inbox from backend:', e);
        }
        // Render inbox/messages table using messages array
    }

    // --- Enhanced Student Curriculum Display in Forms Section ---
    async function loadStudentCurriculum(student) {
        const container = document.getElementById('studentCurriculumContainer');
        if (!container || !student || !student.course) {
            if (container) container.innerHTML = '';
            return;
        }
        try {
            // Fetch all curriculums for the student's course
            const response = await fetch(`/api/curriculum/by-course?courseCode=${encodeURIComponent(student.course)}`);
            let curricula = [];
            if (response.ok) {
                curricula = await response.json();
            }
            if (!curricula || curricula.length === 0) {
                container.innerHTML = `<div style="padding: 18px; background: #fff3cd; color: #856404; border-radius: 6px; border: 1px solid #ffeeba; text-align: center; font-size: 1.1em;">Curriculums for your course will be available soon.</div>`;
                return;
            }
            // Fetch all subjects for mapping
            let subjectsMap = {};
            try {
                const subjResp = await fetch('/api/auth/subjects');
                if (subjResp.ok) {
                    const subjects = await subjResp.json();
                    subjectsMap = Object.fromEntries(subjects.map(s => [s.code, s]));
                }
            } catch (e) { /* ignore, fallback to code only */ }
            // Group by year level and semester for display
            curricula.sort((a, b) => a.yearLevel - b.yearLevel || a.semester.localeCompare(b.semester));
            let html = `<div style="margin-bottom: 12px; display: flex; align-items: center; justify-content: space-between;">
                <strong>Your Curriculum for <span style='color:#d63384;'>${student.course}</span>:</strong>
                <button id="printCurriculumBtn" style="background: #1976d2; color: #fff; border: none; border-radius: 6px; padding: 7px 18px; font-size: 1em; font-family: inherit; cursor: pointer; box-shadow: 0 2px 8px #dbeafe; transition: background 0.2s;">🖨️ Print Curriculum</button>
            </div>`;
            html += `<div id="curriculumTableWrapper"><table class="curriculum-table-styled">
                <thead><tr><th>Year</th><th>Semester</th><th>Subjects</th></tr></thead><tbody>`;
            for (const c of curricula) {
                const subjectCodes = (c.subjectCodes || '').split(',').map(s => s.trim()).filter(Boolean);
                let subjectsHtml = '';
                if (subjectCodes.length > 0) {
                    subjectsHtml = '<table style="width:100%; border-collapse:collapse; background:transparent;">';
                    subjectsHtml += '<thead><tr><th>Code</th><th>Name</th><th>Units</th></tr></thead><tbody>';
                    for (const code of subjectCodes) {
                        const subj = subjectsMap[code];
                        subjectsHtml += `<tr><td>${code}</td><td>${subj ? subj.name : ''}</td><td style="text-align:center;">${subj && subj.units != null ? subj.units : ''}</td></tr>`;
                    }
                    subjectsHtml += '</tbody></table>';
                }
                html += `<tr><td>${c.yearLevel}</td><td>${c.semester}</td><td>${subjectsHtml}</td></tr>`;
            }
            html += '</tbody></table></div>';
            container.innerHTML = html;
            // Add print handler
            const printBtn = document.getElementById('printCurriculumBtn');
            if (printBtn) {
                printBtn.onclick = function() {
                    const printContents = document.getElementById('curriculumTableWrapper').innerHTML;
                    const win = window.open('', '', 'height=700,width=900');
                    win.document.write('<html><head><title>Print Curriculum</title>');
                    win.document.write('<style>body{font-family:sans-serif;} .curriculum-table-styled{width:100%;border-collapse:collapse;} .curriculum-table-styled th, .curriculum-table-styled td{border:1px solid #bdbdbd;padding:8px;} .curriculum-table-styled th{background:#1976d2;color:#fff;} .curriculum-table-styled tr:nth-child(even){background:#f3f7fa;} .curriculum-table-styled tr:hover{background:#e3f2fd;} table table{background:transparent;} table th, table td{text-align:left;}</style>');
                    win.document.write('</head><body>');
                    win.document.write(printContents);
                    win.document.write('</body></html>');
                    win.document.close();
                    win.focus();
                    setTimeout(() => win.print(), 300);
                };
            }
        } catch (e) {
            container.innerHTML = `<div style=\"padding: 18px; background: #f8d7da; color: #721c24; border-radius: 6px; border: 1px solid #f5c6cb; text-align: center; font-size: 1.1em;\">Failed to load curriculum. Please try again later.</div>`;
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
});