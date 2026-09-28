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
