// Live Render Backend Base URLs
const API_URL = 'https://ai-data-analyzer-jjkj.onrender.com/api/auth';
const DATA_API_URL = 'https://ai-data-analyzer-jjkj.onrender.com/api/data';

// --- AUTHENTICATION & SESSION MANAGEMENT ---

// 1. AUTO ROUTING GUARD (Check if already logged in)
document.addEventListener('DOMContentLoaded', () => {
    const token = localStorage.getItem('user_token');
    const currentPage = window.location.pathname;

    // Agar user logged in hai aur login/signup page par hai, to Dashboard bhejo
    if (token && (currentPage.includes('login.html') || currentPage.includes('signup.html'))) {
        window.location.href = 'dashboard.html';
    }

    // Agar user logged in NAHI hai aur dashboard pages par jaane ki koshish kare, to Login bhejo
    if (!token && currentPage.includes('dashboard.html')) {
        window.location.href = 'login.html';
    }
});

// 2. SIGNUP FUNCTION (With Real Verification Handshake)
async function handleSignup(event) {
    if (event) event.preventDefault();
    
    const fullName = document.getElementById('signupName')?.value.trim();
    const email = document.getElementById('signupEmail')?.value.trim();
    const password = document.getElementById('signupPassword')?.value;

    if (!fullName || !email || !password) {
        alert("Please fill in all details.");
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
            alert(`OTP Sent! Use Demo OTP: ${data.otpDemo}`);
            
            // Verify Email prompt trigger
            const userOtp = prompt("Enter the 6-digit OTP sent to your email:");
            if (userOtp) {
                await verifyOtpCode(email, userOtp);
            }
        } else {
            alert(data.detail || "Signup failed. Email might already exist.");
        }
    } catch (err) {
        alert("Backend unreachable. Please try again in a few seconds.");
    }
}

// 3. OTP VERIFICATION FUNCTION
async function verifyOtpCode(email, otp) {
    try {
        const response = await fetch(`${API_URL}/verify-email`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, otp })
        });

        const data = await response.json();

        if (response.ok && data.success) {
            alert("Email Verified Successfully! Please Login now.");
            window.location.href = 'login.html';
        } else {
            alert(data.detail || "Invalid OTP Code!");
        }
    } catch (err) {
        alert("Error verifying OTP.");
    }
}

// 4. SECURE LOGIN FUNCTION (Strict Authentication Check)
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
            // Secure Session Save
            localStorage.setItem('user_token', data.token);
            localStorage.setItem('user_data', JSON.stringify(data.user));
            
            alert("Login Successful! Welcome back.");
            window.location.href = 'dashboard.html';
        } else {
            // Strictly block login if account does not exist or password wrong
            alert(data.detail || "Invalid Email or Password. Please signup first.");
        }
    } catch (err) {
        alert("Server error during login. Make sure backend is running.");
    }
}

// 5. LOGOUT FUNCTION
function logout() {
    localStorage.removeItem('user_token');
    localStorage.removeItem('user_data');
    window.location.href = 'login.html';
}
