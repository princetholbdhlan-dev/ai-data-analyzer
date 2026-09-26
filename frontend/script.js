const BACKEND_URL = "https://ai-data-analyzer-f3kf.onrender.com/analyze";

async function uploadAndAnalyze() {
    const fileInput = document.getElementById("fileInput");
    const file = fileInput.files[0];

    if (!file) {
        alert("Please select a file first!");
        return;
    }

    const formData = new FormData();
    formData.append("file", file);

    document.getElementById("loading").style.display = "block";
    document.getElementById("results").style.display = "none";

    try {
        const response = await fetch(BACKEND_URL, {
            method: "POST",
            body: formData
        });

        const result = await response.json();
        document.getElementById("loading").style.display = "none";

        if (result.success) {
            displayResults(result.data);
        } else {
            alert("Analysis failed!");
        }
    } catch (error) {
        console.error(error);
        document.getElementById("loading").style.display = "none";
        alert("Error connecting to server.");
    }
}

function displayResults(data) {
    document.getElementById("results").style.display = "block";
    document.getElementById("fileStats").innerText = 
        `File: ${data.filename} | Total Rows: ${data.rows} | Total Columns: ${data.columns_count}`;

    const numericCols = Object.keys(data.chart_data);
    if (numericCols.length > 0) {
        const firstCol = numericCols[0];
        const chartValues = data.chart_data[firstCol];

        const ctx = document.getElementById('myChart').getContext('2d');
        new Chart(ctx, {
            type: 'bar',
            data: {
                labels: chartValues.map((_, i) => `Row ${i+1}`),
                datasets: [{
                    label: firstCol,
                    data: chartValues,
                    backgroundColor: 'rgba(54, 162, 235, 0.6)'
                }]
            }
        });
    }
}
