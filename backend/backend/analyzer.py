import pandas as pd
import numpy as np
import io

def analyze_dataset(file_bytes: bytes, filename: str) -> dict:
    # Read CSV or Excel
    if filename.endswith('.csv'):
        df = pd.read_csv(io.BytesIO(file_bytes))
    elif filename.endswith(('.xls', '.xlsx')):
        df = pd.read_excel(io.BytesIO(file_bytes))
    else:
        raise ValueError("Unsupported file format. Please upload CSV or Excel.")

    df = df.replace([np.inf, -np.inf], np.nan)

    total_rows, total_cols = df.shape
    columns_info = list(df.columns)

    preview = df.head(5).fillna("").to_dict(orient="records")
    missing_summary = df.isnull().sum().to_dict()

    numeric_cols = df.select_dtypes(include=[np.number]).columns.tolist()
    stats = {}
    outliers = {}

    for col in numeric_cols:
        col_data = df[col].dropna()
        if col_data.empty:
            continue

        mean_val = float(col_data.mean())
        std_val = float(col_data.std()) if len(col_data) > 1 else 0.0
        min_val = float(col_data.min())
        max_val = float(col_data.max())

        stats[col] = {
            "mean": round(mean_val, 2),
            "std": round(std_val, 2),
            "min": round(min_val, 2),
            "max": round(max_val, 2)
        }

        # Outliers detection (IQR)
        q1 = col_data.quantile(0.25)
        q3 = col_data.quantile(0.75)
        iqr = q3 - q1
        lower_bound = q1 - (1.5 * iqr)
        upper_bound = q3 + (1.5 * iqr)

        outlier_count = int(((col_data < lower_bound) | (col_data > upper_bound)).sum())
        outliers[col] = {
            "outlier_count": outlier_count,
            "lower_bound": round(float(lower_bound), 2),
            "upper_bound": round(float(upper_bound), 2)
        }

    chart_data = {}
    for col in numeric_cols[:3]:
        chart_data[col] = df[col].fillna(0).tolist()[:20]

    return {
        "filename": filename,
        "rows": total_rows,
        "columns_count": total_cols,
        "columns": columns_info,
        "preview": preview,
        "missing_values": missing_summary,
        "numeric_stats": stats,
        "outliers": outliers,
        "chart_data": chart_data
    }
