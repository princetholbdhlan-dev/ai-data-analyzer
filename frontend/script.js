const API_URL = 'https://ai-data-analyzer-jjkj.onrender.com/api/auth';
const DATA_API_URL = 'https://ai-data-analyzer-jjkj.onrender.com/api/data';

let registeredEmail = "";

// AUTO-REDIRECT GUARD
document.addEventListener('DOMContentLoaded', () => {
    const token = localStorage.getItem('user_token');
    const currentPage = window.location.pathname;

    if (token && (currentPage.includes('login.html') || currentPage.includes('signup.html'))) {
        window.location.href = 'dashboard.html';
    }
});

// SIGNUP FUNCTION
async function handleSignup(event) {
    if (event) event.preventDefault();

    const fullName = document.getElementById('signupName')?.value.trim();
    const email = document.getElementById('signupEmail')?.value.trim();
    const password = document.getElementById('signupPassword')?.value;
    const btn = document.getElementById('signupBtn');

    if (!fullName || !email || !password) {
        alert("Please fill all details.");
        return;
    }

    if (btn) btn.innerText = "Connecting to Server...";

    try {
        const response = await fetch(`${API_URL}/signup`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ fullName, email, password })
        });

        const data = await response.json();

        if (response.ok && data.success) {
            registeredEmail = email;
            
            // UI Screen Switch to OTP Card
            document.getElementById('signupCard')?.classList.add('hidden');
            const otpCard = document.getElementById('otpCard');
            if (otpCard) otpCard.classList.remove('hidden');
            
            const badge = document.getElementById('demoOtpBadge');
            if (badge) badge.innerText = `Demo Verification Code: ${data.otpDemo}`;
        } else {
            alert(data.detail || "Signup failed. Account may already exist.");
        }
    } catch (err) {
        alert("Backend starting up... Please wait 10 seconds and click Create Account again.");
    } finally {
        if (btn) btn.innerText = "Create Account";
    }
}

// OTP SUBMIT FUNCTION
async function handleOtpSubmit(event) {
    if (event) event.preventDefault();

    const otp = document.getElementById('otpInput')?.value.trim();

    if (!otp) {
        alert("Please enter the 6-digit OTP code.");
        return;
    }

    try {
        const response = await fetch(`${API_URL}/verify-email`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: registeredEmail, otp })
        });

        const data = await response.json();

        if (response.ok && data.success) {
            alert("Email Verified Successfully! Redirecting to Login...");
            window.location.href = 'login.html';
        } else {
            alert(data.detail || "Invalid OTP Code.");
        }
    } catch (err) {
        alert("Error verifying code.");
    }
}

// SECURE LOGIN FUNCTION
async function handleLogin(event) {
    if (event) event.preventDefault();

    const email = document.getElementById('loginEmail')?.value.trim();
    const password = document.getElementById('loginPassword')?.value;

    if (!email || !password) {
        alert("Please enter both email and password.");
        return;
    }

    try {
        const response = await fetch(`${API_URL}/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });

        const data = await response.json();

        if (response.ok && data.success) {
            localStorage.setItem('user_token', data.token);
            localStorage.setItem('user_data', JSON.stringify(data.user));
            alert("Login Successful!");
            window.location.href = 'dashboard.html';
        } else {
            alert(data.detail || "Invalid Email or Password. Account does not exist!");
        }
    } catch (err) {
        alert("Server Error. Make sure backend is active.");
    }
}

function logout() {
    localStorage.clear();
    window.location.href = 'login.html';
}
