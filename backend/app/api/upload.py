# backend/app/api/upload.py

import io
import os
import pandas as pd
from fastapi import APIRouter, UploadFile, File, HTTPException
from app.config import METRICS_CSV, ROUTERS_CSV
from app.services.data_loader import reload_data

router = APIRouter()

@router.post("/upload/metrics")
async def upload_metrics_csv(file: UploadFile = File(...)):
    if not file.filename.endswith('.csv'):
        raise HTTPException(status_code=400, detail="Only CSV files are supported.")
    
    try:
        content = await file.read()
        # Parse CSV to validate
        df = pd.read_csv(io.BytesIO(content))
        
        # Clean headers
        df.columns = [c.strip() for c in df.columns]
        
        # Required columns for metrics
        required_cols = [
            "router_id", 
            "timestamp", 
            "latency_ms", 
            "packet_loss_pct", 
            "disconnects", 
            "avg_speed_mbps", 
            "signal_dbm", 
            "connected_devices"
        ]
        
        missing = [c for c in required_cols if c not in df.columns]
        if missing:
            raise HTTPException(
                status_code=400, 
                detail=f"Invalid metrics CSV. Missing required columns: {missing}"
            )
            
        # Overwrite the metrics file in workspace
        df.to_csv(METRICS_CSV, index=False)
        
        # Trigger cache flush
        reload_data()
        
        return {
            "status": "success",
            "message": f"Successfully uploaded new metrics telemetry. Loaded {len(df)} rows.",
            "rows_count": len(df)
        }
        
    except HTTPException as he:
        raise he
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to process CSV file: {str(e)}")

@router.post("/upload/routers")
async def upload_routers_csv(file: UploadFile = File(...)):
    if not file.filename.endswith('.csv'):
        raise HTTPException(status_code=400, detail="Only CSV files are supported.")
        
    try:
        content = await file.read()
        # Parse CSV to validate
        df = pd.read_csv(io.BytesIO(content))
        
        # Clean headers
        df.columns = [c.strip() for c in df.columns]
        
        # Required columns for routers
        required_cols = ["router_id", "building", "room", "model", "firmware"]
        
        missing = [c for c in required_cols if c not in df.columns]
        if missing:
            raise HTTPException(
                status_code=400, 
                detail=f"Invalid routers CSV. Missing required columns: {missing}"
            )
            
        # Overwrite the routers file in workspace
        df.to_csv(ROUTERS_CSV, index=False)
        
        # Trigger cache flush
        reload_data()
        
        return {
            "status": "success",
            "message": f"Successfully uploaded new router configurations. Loaded {len(df)} entries.",
            "rows_count": len(df)
        }
        
    except HTTPException as he:
        raise he
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to process CSV file: {str(e)}")
