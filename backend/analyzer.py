import pandas as pd
import io

def analyze_dataset(file_contents: bytes, filename: str):
    # Load File
    if filename.endswith('.csv'):
        df = pd.read_csv(io.BytesIO(file_contents))
    else:
        df = pd.read_excel(io.BytesIO(file_contents))

    # Data Cleaning Metrics
    initial_rows = len(df)
    
    # 1. Strip Whitespaces from strings
    df = df.apply(lambda x: x.str.strip() if x.dtype == "object" else x)
    
    # 2. Remove Duplicate Rows
    df_cleaned = df.drop_duplicates()
    duplicates_removed = initial_rows - len(df_cleaned)

    # 3. Fill Missing Numeric Values with Median/0
    numeric_df = df_cleaned.select_dtypes(include=['number'])
    df_cleaned[numeric_df.columns] = numeric_df.fillna(0)

    # Basic Info Post-Cleaning
    total_rows, total_cols = df_cleaned.shape
    columns = list(df_cleaned.columns)

    # Identify Text Column for X-Axis
    text_cols = df_cleaned.select_dtypes(include=['object', 'string']).columns.tolist()
    label_col = text_cols[0] if text_cols else None
    
    labels = df_cleaned[label_col].astype(str).tolist() if label_col else [f"Row {i+1}" for i in range(total_rows)]
    numeric_cols = df_cleaned.select_dtypes(include=['number']).columns.tolist()

    stats = {}
    chart_datasets = []
    insights = []

    colors = [
        'rgba(75, 192, 192, 0.8)',
        'rgba(54, 162, 235, 0.8)',
        'rgba(255, 99, 132, 0.8)',
        'rgba(255, 206, 86, 0.8)'
    ]

    for idx, col in enumerate(numeric_cols):
        col_sum = float(df_cleaned[col].sum())
        col_mean = float(df_cleaned[col].mean())
        col_max = float(df_cleaned[col].max())
        col_min = float(df_cleaned[col].min())

        stats[col] = {
            "Total": round(col_sum, 2),
            "Average": round(col_mean, 2),
            "Max": round(col_max, 2),
            "Min": round(col_min, 2)
        }

        chart_datasets.append({
            "label": col,
            "data": df_cleaned[col].tolist(),
            "backgroundColor": colors[idx % len(colors)]
        })

        if label_col:
            max_item = df_cleaned.loc[df_cleaned[col].idxmax()][label_col]
            min_item = df_cleaned.loc[df_cleaned[col].idxmin()][label_col]
            insights.append(f"Highest <strong>{col}</strong> is <strong>{col_max}</strong> ({max_item}).")
            insights.append(f"Lowest <strong>{col}</strong> is <strong>{col_min}</strong> ({min_item}).")
        else:
            insights.append(f"Highest <strong>{col}</strong> is <strong>{col_max}</strong>.")

    # Convert Cleaned Data to CSV String for Download
    cleaned_csv = df_cleaned.to_csv(index=False)

    return {
        "filename": filename,
        "rows": total_rows,
        "columns": total_cols,
        "duplicates_removed": duplicates_removed,
        "column_names": columns,
        "labels": labels,
        "stats": stats,
        "chart_datasets": chart_datasets,
        "insights": insights,
        "cleaned_csv": cleaned_csv
    }
