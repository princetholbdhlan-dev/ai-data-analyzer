const BACKEND_URL = "https://ai-data-analyzer-jjkj.onrender.com/analyze";
let chartInstance = null;
let cleanedCSVData = "";

document.getElementById('fileInput').addEventListener('change', function(e) {
    const fileName = e.target.files[0] ? e.target.files[0].name : "No file selected";
    document.getElementById('fileNameDisplay').textContent = fileName;
});

async function uploadAndAnalyze() {
    const fileInput = document.getElementById('fileInput');
    const file = fileInput.files[0];

    if (!file) {
        alert("Please select a file first!");
        return;
    }

    const loader = document.getElementById('loader');
    const resultsContainer = document.getElementById('resultsContainer');
    
    loader.classList.remove('hidden');
    resultsContainer.classList.add('hidden');

    const formData = new FormData();
    formData.append("file", file);

    try {
        const response = await fetch(BACKEND_URL, {
            method: "POST",
            body: formData
        });

        const result = await response.json();

        if (response.ok && result.success) {
            cleanedCSVData = result.data.cleaned_csv;
            renderDashboard(result.data);
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

function renderDashboard(data) {
    document.getElementById('resFilename').textContent = data.filename;
    document.getElementById('resRows').textContent = data.rows;
    document.getElementById('resDuplicates').textContent = data.duplicates_removed;

    const insightsList = document.getElementById('insightsList');
    insightsList.innerHTML = '';
    data.insights.forEach(insight => {
        const li = document.createElement('li');
        li.innerHTML = insight;
        insightsList.appendChild(li);
    });

    const ctx = document.getElementById('dataChart').getContext('2d');
    if (chartInstance) {
        chartInstance.destroy();
    }

    chartInstance = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: data.labels,
            datasets: data.chart_datasets
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { position: 'top' }
            },
            scales: {
                y: { beginAtZero: true }
            }
        }
    });

    const tbody = document.querySelector('#statsTable tbody');
    tbody.innerHTML = '';

    for (const [col, metric] of Object.entries(data.stats)) {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td><strong>${col}</strong></td>
            <td>${metric.Total}</td>
            <td>${metric.Average}</td>
            <td>${metric.Max}</td>
            <td>${metric.Min}</td>
        `;
        tbody.appendChild(tr);
    }

    document.getElementById('resultsContainer').classList.remove('hidden');
}

function downloadCleanCSV() {
    if (!cleanedCSVData) return;
    const blob = new Blob([cleanedCSVData], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'cleaned_dataset.csv';
    a.click();
}

function exportPDFReport() {
    const element = document.getElementById('reportContent');
    const opt = {
        margin:       0.5,
        filename:     'Analytics_Report.pdf',
        image:        { type: 'jpeg', quality: 0.98 },
        html2canvas:  { scale: 2 },
        jsPDF:        { unit: 'in', format: 'letter', orientation: 'portrait' }
    };
    html2pdf().set(opt).from(element).save();
}
