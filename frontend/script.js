const API_URL = 'https://ai-data-analyzer-jjkj.onrender.com/api/auth';
const DATA_API_URL = 'https://ai-data-analyzer-jjkj.onrender.com/api/data';
// Mobile Navigation Toggle
function toggleMobileMenu() {
    const mobileMenu = document.getElementById('mobileMenu');
    if (mobileMenu) {
        mobileMenu.classList.toggle('hidden');
        mobileMenu.classList.toggle('flex');
    }
}

// FAQ Accordion Handler
document.addEventListener('DOMContentLoaded', () => {
    const faqItems = document.querySelectorAll('.faq-item');

    faqItems.forEach(item => {
        const question = item.querySelector('.faq-question');
        question.addEventListener('click', () => {
            const isActive = item.classList.contains('active');
            
            // Close all other FAQs
            faqItems.forEach(i => i.classList.remove('active'));
            
            // Open clicked if it wasn't active
            if (!isActive) {
                item.classList.add('active');
            }
        });
    });
});

// Placeholder functions for Phase 3 Authentication
function handleLogin() {
    alert("Login functionality will be connected in Phase 3 (Backend Integration).");
}

function handleSignup() {
    alert("Signup functionality will be connected in Phase 3 (Backend Integration).");
}
// ==========================================
// PHASE 3: FASTAPI AUTHENTICATION INTEGRATION
// ==========================================

const API_URL = 'http://127.0.0.1:8000/api/auth';

// 1. SIGNUP HANDLER
async function handleSignup(event) {
    event.preventDefault();
    const fullName = document.getElementById('fullName').value;
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const confirmPassword = document.getElementById('confirmPassword').value;

    if (password !== confirmPassword) {
        alert('Passwords do not match!');
        return;
    }

    try {
        const response = await fetch(`${API_URL}/signup`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ fullName, email, password })
        });

        const data = await response.json();
        if (response.ok && data.success) {
            localStorage.setItem('pendingEmail', email);
            alert(`OTP Generated! Your Verification Code is: ${data.otpDemo}`);
            window.location.href = 'verify-email.html';
        } else {
            alert(data.detail || 'Signup failed');
        }
    } catch (err) {
        alert('Backend error/offline mode. Demo OTP generated.');
        localStorage.setItem('pendingEmail', email);
        window.location.href = 'verify-email.html';
    }
}

// 2. LOGIN HANDLER
async function handleLogin(event) {
    event.preventDefault();
    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;

    try {
        const response = await fetch(`${API_URL}/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });

        const data = await response.json();
        if (response.ok && data.success) {
            localStorage.setItem('token', data.token);
            localStorage.setItem('user', JSON.stringify(data.user));
            window.location.href = 'dashboard.html';
        } else {
            alert(data.detail || 'Login failed');
        }
    } catch (err) {
        alert('Backend offline. Demo login active...');
        localStorage.setItem('user', JSON.stringify({ fullName: 'Demo User', email }));
        window.location.href = 'dashboard.html';
    }
}

// 3. EMAIL VERIFICATION HANDLER
async function handleVerifyOTP(event) {
    event.preventDefault();
    const email = localStorage.getItem('pendingEmail') || 'user@example.com';
    const otp = Array.from(document.querySelectorAll('.otp-input')).map(i => i.value).join('');

    try {
        const response = await fetch(`${API_URL}/verify-email`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, otp })
        });

        const data = await response.json();
        if (response.ok && data.success) {
            alert('Email Verified Successfully! Please login.');
            window.location.href = 'login.html';
        } else {
            alert(data.detail || 'Invalid OTP');
        }
    } catch (err) {
        alert('Verification Successful (Demo Mode)! Redirecting to login...');
        window.location.href = 'login.html';
    }
}
// ==========================================
// PHASE 4: DATA ANALYZER & FILE UPLOAD ENGINE
// ==========================================

const DATA_API_URL = 'http://127.0.0.1:8000/api/data';

// File Input Trigger
const dropZone = document.getElementById('dropZone');
const fileInput = document.getElementById('fileInput');

if (dropZone && fileInput) {
    dropZone.addEventListener('click', () => fileInput.click());

    fileInput.addEventListener('change', (e) => {
        if (e.target.files.length > 0) {
            uploadDatasetFile(e.target.files[0]);
        }
    });
}

// Upload & Process File
async function uploadDatasetFile(file) {
    const formData = new FormData();
    formData.append('file', file);

    try {
        const response = await fetch(`${DATA_API_URL}/upload`, {
            method: 'POST',
            body: formData
        });

        const data = await response.json();
        if (response.ok && data.success) {
            renderDataSummary(data.summary);
        } else {
            alert(data.detail || 'Failed to upload dataset.');
        }
    } catch (err) {
        alert('Server unreachable. Make sure FastAPI backend is running!');
    }
}

// Render Summary & Preview Table
function renderDataSummary(summary) {
    document.getElementById('statsCard').classList.remove('hidden');
    document.getElementById('statRows').innerText = summary.total_rows;
    document.getElementById('statCols').innerText = summary.total_columns;
    document.getElementById('statDuplicates').innerText = summary.duplicates_removed;
    document.getElementById('statMissing').innerText = summary.missing_values_handled;

    // Table Header
    const tHeader = document.getElementById('tableHeader');
    tHeader.innerHTML = `<tr>${summary.columns.map(col => `<th class="p-3 uppercase text-[10px] tracking-wider text-slate-400">${col}</th>`).join('')}</tr>`;

    // Table Rows Preview
    const tBody = document.getElementById('tableBody');
    tBody.innerHTML = summary.preview.map(row => {
        return `<tr class="hover:bg-slate-900/50">${summary.columns.map(col => `<td class="p-3 text-slate-300 border-t border-slate-800/40">${row[col] ?? 'N/A'}</td>`).join('')}</tr>`;
    }).join('');
}

// Send Query to AI Analyzer Engine
async function sendQuery() {
    const queryInput = document.getElementById('queryInput');
    const query = queryInput.value.trim();

    if (!query) return;

    const responseBox = document.getElementById('aiResponseBox');
    const responseText = document.getElementById('aiResponseText');
    responseBox.classList.remove('hidden');
    responseText.innerText = 'Analyzing dataset with Python engine...';

    try {
        const response = await fetch(`${DATA_API_URL}/query`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ query })
        });

        const data = await response.json();
        if (response.ok && data.success) {
            responseText.innerText = data.result.answer;
        } else {
            responseText.innerText = data.detail || 'Could not process query.';
        }
    } catch (err) {
        responseText.innerText = 'Backend error while analyzing data.';
    }
}

function logout() {
    localStorage.clear();
    window.location.href = 'login.html';
}
