import pandas as pd
import json

def clean_dataset_df(df: pd.DataFrame) -> dict:
    """
    Cleans the uploaded pandas DataFrame:
    1. Removes duplicate rows
    2. Fills missing values (numeric with median, text with 'N/A')
    """
    initial_rows = len(df)
    
    # Drop duplicate rows
    df = df.drop_duplicates()
    duplicates_removed = initial_rows - len(df)
    
    # Fill missing values
    missing_before = df.isnull().sum().sum()
    for col in df.columns:
        if df[col].dtype in ['int64', 'float64']:
            df[col] = df[col].fillna(df[col].median())
        else:
            df[col] = df[col].fillna('N/A')
            
    summary = {
        "total_rows": len(df),
        "total_columns": len(df.columns),
        "duplicates_removed": int(duplicates_removed),
        "missing_values_handled": int(missing_before),
        "columns": list(df.columns),
        "preview": json.loads(df.head(10).to_json(orient="records"))
    }
    return summary, df

def analyze_dataset_query(df: pd.DataFrame, query: str) -> dict:
    """
    Basic NLP analysis simulation for Pandas DataFrame.
    """
    query_lower = query.lower()
    
    if "summary" in query_lower or "stats" in query_lower:
        result = df.describe(include='all').fillna('N/A').to_dict()
        return {"type": "summary", "data": result, "answer": "Here is the statistical summary of your dataset."}
    
    if "columns" in query_lower or "fields" in query_lower:
        return {"type": "text", "answer": f"The dataset contains the following columns: {', '.join(df.columns)}"}
        
    return {"type": "text", "answer": f"Dataset has {len(df)} rows and {len(df.columns)} columns. Try asking for 'summary' or column-specific metrics."}
