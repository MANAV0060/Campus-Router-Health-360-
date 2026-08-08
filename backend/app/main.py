# backend/app/main.py

import uvicorn
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api.dashboard import router as dashboard_router
from app.api.routers import router as routers_router
from app.api.analytics import router as analytics_router
from app.api.copilot import router as copilot_router
from app.services.data_loader import reload_data
from app.config import HOST, PORT

app = FastAPI(
    title="NetSentinel API",
    description="Backend API service for NetSentinel Campus Router Health 360",
    version="1.0.0"
)

# Enable CORS for React dev server
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, specify frontend origin
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Startup event to load and cache datasets
@app.on_event("startup")
def startup_event():
    print("[NetSentinel] Loading datasets on startup...")
    try:
        reload_data()
        print("[NetSentinel] Datasets loaded and cached successfully.")
    except Exception as e:
        print(f"[NetSentinel] Error loading datasets on startup: {str(e)}")

# Include API routes
app.include_router(dashboard_router, prefix="/api", tags=["Dashboard"])
app.include_router(routers_router, prefix="/api", tags=["Routers"])
app.include_router(analytics_router, prefix="/api", tags=["Analytics"])
app.include_router(copilot_router, prefix="/api", tags=["Copilot"])

@app.get("/")
def read_root():
    return {
        "status": "online",
        "service": "NetSentinel API"
    }

if __name__ == "__main__":
    uvicorn.run("app.main:app", host=HOST, port=PORT, reload=True)
