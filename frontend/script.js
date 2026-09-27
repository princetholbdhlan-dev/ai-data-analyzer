const BACKEND_URL = "https://ai-data-analyzer-jjkj.onrender.com/analyze";
let chartInstance = null;
let rawApiData = null;

// Page Navigation Function
function switchPage(pageId) {
    document.querySelectorAll('.page-view').forEach(p => p.classList.add('hidden'));
    document.querySelectorAll('.nav-link').forEach(a => a.classList.remove('active'));

    const targetPage = document.getElementById(`page-${pageId}`);
    const targetNav = document.getElementById(`nav-${pageId}`);
    
    if (targetPage) targetPage.classList.remove('hidden');
    if (targetNav) targetNav.classList.add('active');

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
            alert("File analyzed successfully! Use navigation bar to switch between Data Cleaner, Chart Studio, AI Assistant & PDF Reports.");
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
    // Update Overview Stats
    const qFile = document.getElementById('quickFileName');
    const qRows = document.getElementById('quickRows');
    const qCols = document.getElementById('quickCols');
    const summaryView = document.getElementById('homeSummaryView');

    if (qFile) qFile.textContent = data.filename;
    if (qRows) qRows.textContent = data.rows;
    if (qCols) qCols.textContent = data.columns || Object.keys(data.stats).length;
    if (summaryView) summaryView.classList.remove('hidden');

    // 1. DATA CLEANER TOOL VIEW
    const cleanerEl = document.getElementById('cleanerContent');
    if (cleanerEl) {
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
    }

    // 2. CHART STUDIO TOOL VIEW
    const chartsEl = document.getElementById('chartsContent');
    if (chartsEl) {
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
    }

    // 3. AI DATA ASSISTANT VIEW
    const assistantEl = document.getElementById('assistantContent');
    if (assistantEl) {
        assistantEl.classList.remove('empty-state');
        assistantEl.innerHTML = `
            <div class="dashboard-card">
                <h3>💬 Ask AI About Your Dataset</h3>
                <p style="font-size: 13px; color: #64748b; margin-bottom: 15px;">
                    Ask queries like <i>"Which item has the highest revenue?"</i>, <i>"What is the average sales?"</i>, or <i>"Show me total sum"</i>.
                </p>
                <div id="chatHistory" style="min-height: 150px; max-height: 300px; overflow-y: auto; background: #f8fafc; padding: 12px; border-radius: 8px; border: 1px solid #e2e8f0; margin-bottom: 12px;">
                    <div style="background: #eff6ff; padding: 10px; border-radius: 6px; font-size: 13px; margin-bottom: 8px;">
                        🤖 <strong>AI Assistant:</strong> Hello! Your dataset <strong>${data.filename}</strong> is loaded. Ask me any question!
                    </div>
                </div>
                <div style="display: flex; gap: 8px;">
                    <input type="text" id="chatInput" placeholder="Type your query here..." style="flex: 1; padding: 10px; border-radius: 6px; border: 1px solid #cbd5e1; font-size: 13px;" onkeypress="if(event.key==='Enter') sendChatQuery()">
                    <button onclick="sendChatQuery()" style="background: #2563eb; color: white; border: none; padding: 10px 18px; border-radius: 6px; font-size: 13px; font-weight: 600; cursor: pointer;">Ask AI</button>
                </div>
            </div>
        `;
    }

    // 4. PDF REPORT GENERATOR VIEW
    const reportsEl = document.getElementById('reportsContent');
    if (reportsEl) {
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

async function sendChatQuery() {
    const inputEl = document.getElementById('chatInput');
    const question = inputEl ? inputEl.value.trim() : '';
    if (!question || !rawApiData) return;

    const chatHistory = document.getElementById('chatHistory');
    if (!chatHistory) return;
    
    // Append User Question
    chatHistory.innerHTML += `
        <div style="background: #ffffff; padding: 10px; border-radius: 6px; font-size: 13px; margin-bottom: 8px; border: 1px solid #e2e8f0; text-align: right;">
            <strong>You:</strong> ${question}
        </div>
    `;
    inputEl.value = '';
    chatHistory.scrollTop = chatHistory.scrollHeight;

    try {
        const response = await fetch("https://ai-data-analyzer-jjkj.onrender.com/chat", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                question: question,
                stats: rawApiData.stats,
                insights: rawApiData.insights
            })
        });

        const result = await response.json();
        if (response.ok && result.success) {
            chatHistory.innerHTML += `
                <div style="background: #eff6ff; padding: 10px; border-radius: 6px; font-size: 13px; margin-bottom: 8px;">
                    ${result.answer}
                </div>
            `;
        } else {
            chatHistory.innerHTML += `<div style="color: red; font-size: 12px; margin-bottom: 8px;">Failed to get AI response.</div>`;
        }
    } catch (err) {
        console.error(err);
        chatHistory.innerHTML += `<div style="color: red; font-size: 12px; margin-bottom: 8px;">Error connecting to AI server.</div>`;
    }
    chatHistory.scrollTop = chatHistory.scrollHeight;
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
