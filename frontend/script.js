// Add inside populateToolsData(data) function:

    // 4. AI DATA ASSISTANT VIEW
    const assistantEl = document.getElementById('assistantContent');
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
