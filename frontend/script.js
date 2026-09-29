// Base Backend URL (Without trailing path)
const API_URL = "https://ai-data-analyzer-jjkj.onrender.com";

let registeredEmail = "";

// AUTO-REDIRECT GUARD
document.addEventListener('DOMContentLoaded', () => {
    const token = localStorage.getItem('user_token');
    const currentPage = window.location.pathname;

    if (token && (currentPage.includes('login.html') || currentPage.includes('signup.html'))) {
        window.location.href = 'dashboard.html';
    }
});

// 1. SIGNUP FUNCTION
async function handleSignup(event) {
    if (event) event.preventDefault();

    const fullName = document.getElementById('signupName')?.value.trim();
    const email = document.getElementById('signupEmail')?.value.trim();
    const password = document.getElementById('signupPassword')?.value;
    const btn = document.getElementById('signupBtn');

    if (!fullName || !email || !password) {
        alert("Please fill in all details.");
        return;
    }

    if (btn) btn.innerText = "Processing...";

    try {
        const response = await fetch(`${API_URL}/api/auth/signup/`, {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
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
            if (badge && data.otpDemo) {
                badge.innerText = `Demo OTP: ${data.otpDemo}`;
            }
        } else {
            alert(data.detail || "Signup failed. Account may already exist.");
        }
    } catch (err) {
        // Fallback retry without trailing slash
        try {
            const fallbackResponse = await fetch(`${API_URL}/api/auth/signup`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ fullName, email, password })
            });
            const fallbackData = await fallbackResponse.json();
            if (fallbackResponse.ok && fallbackData.success) {
                registeredEmail = email;
                document.getElementById('signupCard')?.classList.add('hidden');
                document.getElementById('otpCard')?.classList.remove('hidden');
                const badge = document.getElementById('demoOtpBadge');
                if (badge && fallbackData.otpDemo) {
                    badge.innerText = `Demo OTP: ${fallbackData.otpDemo}`;
                }
                return;
            }
        } catch(fErr) {}
        alert("Backend server is unreachable or sleeping. Please check your connection or wait a few seconds.");
    } finally {
        if (btn) btn.innerText = "Create Account";
    }
}

// 2. OTP VERIFICATION FUNCTION
async function handleOtpSubmit(event) {
    if (event) event.preventDefault();

    const otp = document.getElementById('otpInput')?.value.trim();

    if (!otp) {
        alert("Please enter the 6-digit OTP code.");
        return;
    }

    try {
        const response = await fetch(`${API_URL}/api/auth/verify-email/`, {
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
        // Fallback retry without trailing slash
        try {
            const fbRes = await fetch(`${API_URL}/api/auth/verify-email`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: registeredEmail, otp })
            });
            const fbData = await fbRes.json();
            if (fbRes.ok && fbData.success) {
                alert("Email Verified Successfully! Redirecting to Login...");
                window.location.href = 'login.html';
                return;
            }
        } catch(e) {}
        alert("Error verifying OTP code.");
    }
}

// 3. LOGIN FUNCTION
async function handleLogin(event) {
    if (event) event.preventDefault();

    const email = document.getElementById('loginEmail')?.value.trim();
    const password = document.getElementById('loginPassword')?.value;

    if (!email || !password) {
        alert("Please enter both email and password.");
        return;
    }

    try {
        const response = await fetch(`${API_URL}/api/auth/login/`, {
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
            alert(data.detail || "Invalid Email or Password.");
        }
    } catch (err) {
        // Fallback retry without trailing slash
        try {
            const fbRes = await fetch(`${API_URL}/api/auth/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password })
            });
            const fbData = await fbRes.json();
            if (fbRes.ok && fbData.success) {
                localStorage.setItem('user_token', fbData.token);
                localStorage.setItem('user_data', JSON.stringify(fbData.user));
                alert("Login Successful!");
                window.location.href = 'dashboard.html';
                return;
            }
        } catch(e) {}
        alert("Server Error. Unable to authenticate.");
    }
}

// LOGOUT FUNCTION
function logout() {
    localStorage.clear();
    window.location.href = 'login.html';
}
