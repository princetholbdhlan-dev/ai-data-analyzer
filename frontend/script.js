// Live Render Backend API Base URLs
const API_URL = 'https://ai-data-analyzer-jjkj.onrender.com/api/auth';
const DATA_API_URL = 'https://ai-data-analyzer-jjkj.onrender.com/api/data';

// Navigation & Accordion Handling
function toggleMobileMenu() {
    const mobileMenu = document.getElementById('mobileMenu');
    if (mobileMenu) {
        mobileMenu.classList.toggle('hidden');
        mobileMenu.classList.toggle('flex');
    }
}

document.addEventListener('DOMContentLoaded', () => {
    // FAQ Accordion
    const faqItems = document.querySelectorAll('.faq-item');
    faqItems.forEach(item => {
        const question = item.querySelector('.faq-question');
        if (question) {
            question.addEventListener('click', () => {
                const isActive = item.classList.contains('active');
                faqItems.forEach(i => i.classList.remove('active'));
                if (!isActive) item.classList.add('active');
            });
        }
    });

    // File Input Trigger Handling (Without Double Click Issue)
    const dropZone = document.getElementById('dropZone');
    const fileInput = document.getElementById('fileInput');

    if (dropZone && fileInput) {
        dropZone.onclick = (e) => {
            if (e.target !== fileInput) {
                fileInput.click();
            }
        };

        fileInput.onchange = (e) => {
            if (e.target.files.length > 0) {
                uploadDatasetFile(e.target.files[0]);
            }
        };
    }
});

// Upload & Process File API
async function uploadDatasetFile(file) {
    const formData = new FormData();
    formData.append('file', file);

    const dropZone = document.getElementById('dropZone');
    if (dropZone) {
        dropZone.style.opacity = '0.5';
        dropZone.style.pointerEvents = 'none';
    }

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
        alert('Backend is starting up or unreachable. Please wait 10 seconds and try again.');
    } finally {
        if (dropZone) {
            dropZone.style.opacity = '1';
            dropZone.style.pointerEvents = 'auto';
        }
    }
}

// Render Summary & Preview Table
function renderDataSummary(summary) {
    const statsCard = document.getElementById('statsCard');
    if (statsCard) statsCard.classList.remove('hidden');

    document.getElementById('statRows').innerText = summary.total_rows || 0;
    document.getElementById('statCols').innerText = summary.total_columns || 0;
    document.getElementById('statDuplicates').innerText = summary.duplicates_removed || 0;
    document.getElementById('statMissing').innerText = summary.missing_values_handled || 0;

    // Table Header
    const tHeader = document.getElementById('tableHeader');
    if (tHeader) {
        tHeader.innerHTML = `<tr>${summary.columns.map(col => `<th class="p-3 uppercase text-[10px] tracking-wider text-slate-400">${col}</th>`).join('')}</tr>`;
    }

    // Table Body Preview
    const tBody = document.getElementById('tableBody');
    if (tBody) {
        tBody.innerHTML = summary.preview.map(row => {
            return `<tr class="hover:bg-slate-900/50">${summary.columns.map(col => `<td class="p-3 text-slate-300 border-t border-slate-800/40">${row[col] ?? 'N/A'}</td>`).join('')}</tr>`;
        }).join('');
    }
}

// AI Query Assistant Function
async function sendQuery() {
    const queryInput = document.getElementById('queryInput');
    const query = queryInput ? queryInput.value.trim() : '';

    if (!query) return;

    const responseBox = document.getElementById('aiResponseBox');
    const responseText = document.getElementById('aiResponseText');
    
    if (responseBox) responseBox.classList.remove('hidden');
    if (responseText) responseText.innerText = 'Analyzing dataset with Python engine...';

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
        if (responseText) responseText.innerText = 'Backend server error while analyzing data.';
    }
}

function logout() {
    localStorage.clear();
    window.location.href = 'login.html';
}
