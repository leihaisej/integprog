async function callApi(url, method, data) {
    try {
        const response = await fetch(url, {
            method: method,
            headers: {
                'Content-Type': 'application/json',
            },
            body: data ? JSON.stringify(data) : null,
        });

        // Check if response is ok (status 2xx), if not, throw an error with message from server
        if (!response.ok) {
            const errorBody = await response.json().catch(() => ({ message: `Server responded with status ${response.status}` }));
            throw new Error(errorBody.message || `API call failed with status: ${response.status}`);
        }
        return response.json(); // Parse and return the JSON response
    } catch (error) {
        console.error('API call failed:', error);
        throw error; // Re-throw to be caught by the calling function
    }
}

document.addEventListener('DOMContentLoaded', () => {
    // IMPORTANT: If 'initializeData' from data.js was only for populating localStorage
    // and you are now using a backend, you should comment it out or remove it.
    // If data.js also contains other common utility functions, keep the file but remove data initialization.
    // if (typeof initializeData === 'function') {
    //     initializeData();
    // } else {
    //     console.error("CRITICAL: initializeData function from data.js not found. SIS will not work correctly.");
    //     alert("System initialization error. Please contact support.");
    //     return;
    // }

    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', handleLogin);
    }

    const logoutButton = document.getElementById('logoutButton');
    if (logoutButton) {
        logoutButton.addEventListener('click', handleLogout);
    }

    const protectedPages = ['student.html', 'admin.html'];
    const currentPageFile = window.location.pathname.split('/').pop();
    if (protectedPages.includes(currentPageFile)) {
        checkAuthentication();
    }

    const registrationForm = document.getElementById('registrationForm');
    if (registrationForm) {
        registrationForm.addEventListener('submit', handleRegistration);
    }

    // Password toggle functionality for login
    const toggleLoginPassword = document.getElementById('toggleLoginPassword');
    const passwordInput = document.getElementById('password');
    if (toggleLoginPassword && passwordInput) {
        toggleLoginPassword.addEventListener('click', () => {
            const type = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
            passwordInput.setAttribute('type', type);
            toggleLoginPassword.querySelector('i').textContent = type === 'password' ? 'Show' : 'Hide';
        });
    }

    // Password toggle for student form in admin panel (assuming this is still needed)
    const toggleStudentPassword = document.getElementById('toggleStudentPassword');
    const studentPasswordInput = document.getElementById('studentPasswordModal');
    if (toggleStudentPassword && studentPasswordInput) {
        toggleStudentPassword.addEventListener('click', () => {
            const type = studentPasswordInput.getAttribute('type') === 'password' ? 'text' : 'password';
            studentPasswordInput.setAttribute('type', type);
            toggleStudentPassword.querySelector('i').textContent = type === 'password' ? 'Show' : 'Hide';
        });
    }

    // Remember me functionality
    const rememberMeCheckbox = document.getElementById('rememberMe');
    const userIdInput = document.getElementById('userId');
    
    if (rememberMeCheckbox && userIdInput) {
        // Load saved userId if exists
        const savedUserId = localStorage.getItem('rememberedUserId');
        if (savedUserId) {
            userIdInput.value = savedUserId;
            rememberMeCheckbox.checked = true;
        }

        // Handle remember me checkbox
        rememberMeCheckbox.addEventListener('change', () => {
            if (!rememberMeCheckbox.checked) {
                localStorage.removeItem('rememberedUserId');
            }
        });
    }
});


async function handleLogin(event) {
    event.preventDefault(); // Prevent default form submission
    const userId = document.getElementById('userId').value.trim();
    const password = document.getElementById('password').value;
    const rememberMe = document.getElementById('rememberMe')?.checked;

    if (!userId || !password) {
        alert('Please enter both User ID and Password.');
        return;
    }

    try {
        const authRequest = { userId: userId, password: password };
        const authResponse = await callApi('/api/auth/login', 'POST', authRequest);
        if (authResponse && authResponse.id) { // Success!
            localStorage.setItem('sessionUserId', authResponse.id);
            if (rememberMe) {
                localStorage.setItem('rememberedUserId', userId);
            }
            // REDIRECT based on role
            if (authResponse.role === 'student') {
                window.location.href = 'student.html';
            } else if (authResponse.role === 'admin') {
                window.location.href = 'admin.html';
            } else {
                alert('User role not recognized. Please contact support.');
                localStorage.removeItem('sessionUserId');
            }
        } else {
            alert(authResponse.message || 'Login failed. Invalid User ID or Password. Please try again.');
        }
    } catch (error) {
        alert(error.message || 'Failed to connect to the server. Please check your network connection and try again.');
        console.error("Login API call error:", error);
    }
}


async function handleRegistration(event) {
    event.preventDefault();
    console.log("Registration form submitted!"); // Diagnostic log
    const newStudentName = document.getElementById('regName').value.trim();
    const newStudentPassword = document.getElementById('regPassword').value;
    const newStudentConfirmPassword = document.getElementById('regConfirmPassword').value;
    const newStudentCourseCode = document.getElementById('regCourse').value;

    if (!newStudentName || !newStudentPassword || !newStudentCourseCode) {
        alert("Please fill all required fields for the application.");
        return;
    }

    if (newStudentPassword !== newStudentConfirmPassword) {
        alert('Passwords do not match!');
        return;
    }

    // The backend registerStudent method expects a User object as @RequestBody
    const newUser = {
        name: newStudentName,
        password: newStudentPassword,
        course: newStudentCourseCode,
        role: 'student'
    };

    try {
        const authResponse = await callApi('/api/auth/register', 'POST', newUser);
        const successMsgDiv = document.getElementById('registrationSuccessMsg');
        const regSuccessModal = document.getElementById('registrationSuccessModal');
        const regStudentIdDisplay = document.getElementById('regStudentIdDisplay');
        const copyStudentIdBtn = document.getElementById('copyStudentIdBtn');
        const closeRegSuccessModalBtn = document.getElementById('closeRegistrationSuccessModal');
        if (authResponse && authResponse.id) {
            // Show modal popup with Student ID
            if (regSuccessModal && regStudentIdDisplay) {
                regStudentIdDisplay.textContent = authResponse.id;
                regSuccessModal.style.display = 'block';
                document.body.style.overflow = 'hidden';
                // Copy button logic
                if (copyStudentIdBtn) {
                    copyStudentIdBtn.onclick = function() {
                        navigator.clipboard.writeText(authResponse.id);
                        copyStudentIdBtn.textContent = 'Copied!';
                        setTimeout(() => { copyStudentIdBtn.textContent = 'Copy Student ID'; }, 1500);
                    };
                }
                // Close modal logic
                if (closeRegSuccessModalBtn) {
                    closeRegSuccessModalBtn.onclick = function() {
                        regSuccessModal.style.display = 'none';
                        document.body.style.overflow = 'auto';
                    };
                }
                // Auto-close modal after 10 seconds
                setTimeout(() => {
                    if (regSuccessModal.style.display === 'block') {
                        regSuccessModal.style.display = 'none';
                        document.body.style.overflow = 'auto';
                    }
                }, 10000);
            } else if (successMsgDiv) {
                successMsgDiv.style.display = 'block';
                successMsgDiv.textContent = authResponse.message || 'Student account application submitted successfully! You can now log in.';
            } else {
                alert(authResponse.message || 'Student account application submitted successfully! You can now log in.');
            }
            // Optionally close the registration modal after a delay
            setTimeout(() => {
                const registrationModal = document.getElementById('registrationModal');
                if (registrationModal) {
                    registrationModal.style.display = 'none';
                }
                if (event.target && typeof event.target.reset === 'function') {
                    event.target.reset();
                }
                if (successMsgDiv) {
                    successMsgDiv.style.display = 'none';
                    successMsgDiv.textContent = '';
                }
            }, 5000);
        } else {
            if (successMsgDiv) {
                successMsgDiv.style.display = 'block';
                successMsgDiv.style.color = 'red';
                successMsgDiv.textContent = authResponse.message || 'Registration failed. User ID might already exist or other server issue.';
            } else {
                alert(authResponse.message || 'Registration failed. User ID might already exist or other server issue.');
            }
        }
    } catch (error) {
        alert(error.message || 'Failed to connect to the server during registration. Please try again later.');
        console.error("Registration API call error:", error);
    }
}


function handleLogout() {
    localStorage.removeItem('sessionUserId');
    window.location.href = 'index.html'; // Redirect to login page
}

function checkAuthentication() {
    const userId = localStorage.getItem('sessionUserId');
    if (!userId) {
        window.location.href = 'index.html'; // Redirect to login
        return null;
    }
    return { id: userId }; // You can fetch full user info from backend if needed
}

async function getCurrentUser() {
    const userId = localStorage.getItem('sessionUserId');
    if (!userId) return null;
    const response = await fetch(`/api/auth/me?userId=${encodeURIComponent(userId)}`);
    if (response.ok) {
        return await response.json();
    }
    return null;
}
