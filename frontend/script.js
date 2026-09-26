const BACKEND_URL = "https://ai-data-analyzer-jjkj.onrender.com/analyze";
let chartInstance = null;

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
    // 1. Overview Cards
    document.getElementById('resFilename').textContent = data.filename;
    document.getElementById('resRows').textContent = data.rows;
    document.getElementById('resCols').textContent = data.columns;

    // 2. Insights List
    const insightsList = document.getElementById('insightsList');
    insightsList.innerHTML = '';
    data.insights.forEach(insight => {
        const li = document.createElement('li');
        li.innerHTML = insight;
        insightsList.appendChild(li);
    });

    // 3. Render Chart
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

    // 4. Statistics Table
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

    // Show Results Section
    document.getElementById('resultsContainer').classList.remove('hidden');
}
