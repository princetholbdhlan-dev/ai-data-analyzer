import pandas as pd
import io

def analyze_dataset(file_contents: bytes, filename: str):
    # Load File into DataFrame
    if filename.endswith('.csv'):
        df = pd.read_csv(io.BytesIO(file_contents))
    else:
        df = pd.read_excel(io.BytesIO(file_contents))

    # Basic Info
    total_rows, total_cols = df.shape
    columns = list(df.columns)
    
    # Identify Text/Categorical Column for X-Axis Labels
    text_cols = df.select_dtypes(include=['object', 'string']).columns.tolist()
    label_col = text_cols[0] if text_cols else None
    
    if label_col:
        labels = df[label_col].astype(str).tolist()
    else:
        labels = [f"Row {i+1}" for i in range(total_rows)]

    # Identify Numeric Columns for Metrics
    numeric_df = df.select_dtypes(include=['number'])
    numeric_cols = numeric_df.columns.tolist()

    # Calculate Statistics
    stats = {}
    chart_datasets = []
    insights = []

    # Palette for chart colors
    colors = [
        'rgba(75, 192, 192, 0.7)',
        'rgba(54, 162, 235, 0.7)',
        'rgba(255, 99, 132, 0.7)',
        'rgba(255, 206, 86, 0.7)',
        'rgba(153, 102, 255, 0.7)'
    ]

    for idx, col in enumerate(numeric_cols):
        col_sum = float(df[col].sum())
        col_mean = float(df[col].mean())
        col_max = float(df[col].max())
        col_min = float(df[col].min())

        stats[col] = {
            "Total": round(col_sum, 2),
            "Average": round(col_mean, 2),
            "Max": round(col_max, 2),
            "Min": round(col_min, 2)
        }

        chart_datasets.append({
            "label": col,
            "data": df[col].fillna(0).tolist(),
            "backgroundColor": colors[idx % len(colors)]
        })

        # Generate Quick Insights
        if label_col:
            max_item = df.loc[df[col].idxmax()][label_col]
            min_item = df.loc[df[col].idxmin()][label_col]
            insights.append(f"Highest {col} is <strong>{col_max}</strong> ({max_item}).")
            insights.append(f"Lowest {col} is <strong>{col_min}</strong> ({min_item}).")
        else:
            insights.append(f"Highest {col} is <strong>{col_max}</strong>.")

    return {
        "filename": filename,
        "rows": total_rows,
        "columns": total_cols,
        "column_names": columns,
        "labels": labels,
        "stats": stats,
        "chart_datasets": chart_datasets,
        "insights": insights
    }
