const BACKEND_URL = "https://ai-data-analyzer-jjkj.onrender.com/analyze";
let chartInstance = null;
let rawApiData = null;

// Page Navigation Function
function switchPage(pageId) {
    // Hide all pages
    document.querySelectorAll('.page-view').forEach(p => p.classList.add('hidden'));
    document.querySelectorAll('.nav-link').forEach(a => a.classList.remove('active'));

    // Show target page & active tab
    const targetPage = document.getElementById(`page-${pageId}`);
    const targetNav = document.getElementById(`nav-${pageId}`);
    
    if (targetPage) targetPage.classList.remove('hidden');
    if (targetNav) targetNav.classList.add('active');

    // Re-render chart if switching to Chart Studio
    if (pageId === 'charts' && rawApiData) {
        setTimeout(renderChartStudio, 100);
    }
}

document.getElementById('fileInput').addEventListener('change', function(e) {
    const fileName = e.target.files[0] ? e.target.files[0].name : "No file selected";
    document.getElementById('fileNameDisplay').textContent = fileName;
});

async function uploadAndAnalyze() {
    const fileInput = document.getElementById('fileInput');
    const file = fileInput.files[0];

    if (!file) {
        alert("Please select a CSV or Excel file first!");
        return;
    }

    const loader = document.getElementById('loader');
    loader.classList.remove('hidden');

    const formData = new FormData();
    formData.append("file", file);

    try {
        const response = await fetch(BACKEND_URL, {
            method: "POST",
            body: formData
        });

        const result = await response.json();

        if (response.ok && result.success) {
            rawApiData = result.data;
            populateToolsData(result.data);
            alert("File analyzed successfully! Use the navigation bar to switch between Data Cleaner, Chart Studio, and PDF Reports.");
        } else {
            alert("Analysis failed: " + (result.detail || "Server error"));
        }
    } catch (error) {
        console.error(error);
        alert("Error connecting to server. Please try again.");
    } finally {
        loader.classList.add('hidden');
    }
}

function populateToolsData(data) {
    // 1. DATA CLEANER TOOL VIEW
    const cleanerEl = document.getElementById('cleanerContent');
    cleanerEl.classList.remove('empty-state');
    cleanerEl.innerHTML = `
        <div class="stats-summary-grid">
            <div class="metric-box">
                <label>Analyzed File</label>
                <div>${data.filename}</div>
            </div>
            <div class="metric-box">
                <label>Total Rows</label>
                <div>${data.rows}</div>
            </div>
            <div class="metric-box">
                <label>Duplicates Removed</label>
                <div style="color: #10b981;">${data.duplicates_removed}</div>
            </div>
        </div>
        <div class="dashboard-card" style="text-align: center;">
            <h3>📥 Export Cleaned Dataset</h3>
            <p style="font-size: 13px; color: #64748b; margin-bottom: 15px;">
                All duplicate rows have been stripped and missing values filled automatically.
            </p>
            <button class="btn-download" onclick="downloadCleanCSV()">Download Cleaned CSV</button>
        </div>
    `;

    // 2. CHART STUDIO TOOL VIEW
    const chartsEl = document.getElementById('chartsContent');
    chartsEl.classList.remove('empty-state');
    chartsEl.innerHTML = `
        <div class="dashboard-card">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px;">
                <h3>📈 Interactive Chart Studio</h3>
                <div>
                    <label for="topFilter" style="font-size: 12px; font-weight: 600; color: #64748b;">Filter: </label>
                    <select id="topFilter" onchange="renderChartStudio()" style="padding: 4px 8px; border-radius: 6px; border: 1px solid #cbd5e1; font-size: 12px;">
                        <option value="10" selected>Top 10 Records</option>
                        <option value="20">Top 20 Records</option>
                        <option value="30">Top 30 Records</option>
                        <option value="all">All Records</option>
                    </select>
                </div>
            </div>
            <div class="chart-wrapper">
                <canvas id="studioChart"></canvas>
            </div>
        </div>
    `;
    renderChartStudio();

    // 3. PDF REPORT GENERATOR VIEW
    const reportsEl = document.getElementById('reportsContent');
    reportsEl.classList.remove('empty-state');
    
    let statsTableHTML = '';
    for (const [col, metric] of Object.entries(data.stats)) {
        statsTableHTML += `
            <tr>
                <td><strong>${col}</strong></td>
                <td>${metric.Total}</td>
                <td>${metric.Average}</td>
                <td>${metric.Max}</td>
                <td>${metric.Min}</td>
            </tr>
        `;
    }

    let insightsHTML = '';
    data.insights.forEach(insight => {
        insightsHTML += `<li style="background: #f1f5f9; padding: 8px 12px; border-radius: 6px; margin-bottom: 6px; font-size: 13px;">${insight}</li>`;
    });

    reportsEl.innerHTML = `
        <div id="pdfReportSection">
            <div class="dashboard-card">
                <h3>💡 Automated Insights Summary</h3>
                <ul style="list-style: none;">${insightsHTML}</ul>
            </div>
            <div class="dashboard-card">
                <h3>🔢 Statistical Summary Metrics</h3>
                <div class="table-responsive">
                    <table>
                        <thead>
                            <tr>
                                <th>Metric Column</th>
                                <th>Total (Sum)</th>
                                <th>Average</th>
                                <th>Max Value</th>
                                <th>Min Value</th>
                            </tr>
                        </thead>
                        <tbody>${statsTableHTML}</tbody>
                    </table>
                </div>
            </div>
        </div>
        <div style="text-align: right; margin-top: 15px;">
            <button class="btn-pdf" onclick="exportPDFReport()">📄 Export Official PDF Report</button>
        </div>
    `;
}

function renderChartStudio() {
    if (!rawApiData) return;

    const filterEl = document.getElementById('topFilter');
    const limitVal = filterEl ? filterEl.value : '10';
    let limit = limitVal === 'all' ? rawApiData.labels.length : parseInt(limitVal);

    const filteredLabels = rawApiData.labels.slice(0, limit);
    const filteredDatasets = rawApiData.chart_datasets.map(dataset => ({
        ...dataset,
        data: dataset.data.slice(0, limit)
    }));

    const canvas = document.getElementById('studioChart');
    if (!canvas) return;

    const ctx = canvas.getContext('2d');

    if (chartInstance) {
        chartInstance.destroy();
    }

    chartInstance = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: filteredLabels,
            datasets: filteredDatasets
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { position: 'top' }
            },
            scales: {
                y: { beginAtZero: true },
                x: { ticks: { maxRotation: 45, minRotation: 0 } }
            }
        }
    });
}

function downloadCleanCSV() {
    if (!rawApiData || !rawApiData.cleaned_csv) return;
    const blob = new Blob([rawApiData.cleaned_csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'cleaned_dataset.csv';
    a.click();
}

function exportPDFReport() {
    const element = document.getElementById('pdfReportSection');
    if (!element) return;

    const opt = {
        margin:       0.5,
        filename:     'Executive_Analytics_Report.pdf',
        image:        { type: 'jpeg', quality: 0.98 },
        html2canvas:  { scale: 2 },
        jsPDF:        { unit: 'in', format: 'letter', orientation: 'portrait' }
    };
    html2pdf().set(opt).from(element).save();
}
