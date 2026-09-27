def answer_dataset_question(question: str, stats: dict, insights: list) -> str:
    q = question.lower().strip()

    # Match maximum or highest queries
    if "highest" in q or "max" in q or "maximum" in q or "sabse zyada" in q:
        for insight in insights:
            if "highest" in insight.lower():
                return f"🤖 **AI Analysis:** {insight}"
        for col, s in stats.items():
            if col.lower() in q:
                return f"🤖 **AI Analysis:** The maximum value for **{col}** is **{s['Max']}**."
        
    # Match minimum or lowest queries
    if "lowest" in q or "min" in q or "minimum" in q or "sabse kam" in q:
        for insight in insights:
            if "lowest" in insight.lower():
                return f"🤖 **AI Analysis:** {insight}"
        for col, s in stats.items():
            if col.lower() in q:
                return f"🤖 **AI Analysis:** The minimum value for **{col}** is **{s['Min']}**."

    # Match average/mean queries
    if "average" in q or "mean" in q or "avg" in q:
        for col, s in stats.items():
            if col.lower() in q:
                return f"🤖 **AI Analysis:** The average **{col}** across the dataset is **{s['Average']}**."
        return "🤖 **AI Analysis:** Here are the averages:\n" + "\n".join([f"- **{col}**: {s['Average']}" for col, s in stats.items()])

    # Match total/sum queries
    if "total" in q or "sum" in q or "overall" in q:
        for col, s in stats.items():
            if col.lower() in q:
                return f"🤖 **AI Analysis:** The total **{col}** is **{s['Total']}**."
        return "🤖 **AI Analysis:** Here are the totals:\n" + "\n".join([f"- **{col}**: {s['Total']}" for col, s in stats.items()])

    # Default overview answer
    if insights:
        return f"🤖 **AI Analysis:** Based on your dataset summary:\n" + "\n".join([f"- {i}" for i in insights[:3]])
    
    return "🤖 **AI Analysis:** I could not find a specific match for your question. Try asking about the 'highest revenue', 'average sales', or 'total count'."
