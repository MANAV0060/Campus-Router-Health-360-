# backend/app/api/analytics.py

from fastapi import APIRouter
from app.services.data_loader import load_routers
from app.services.analytics import get_building_analytics, get_firmware_analytics, get_model_analytics
from app.services.impact_engine import get_prioritized_intervention_list

router = APIRouter()

@router.get("/buildings")
def get_buildings():
    df_routers = load_routers()
    unique_buildings = sorted(df_routers["building"].dropna().unique().tolist())
    return {
        "buildings": unique_buildings
    }

@router.get("/firmware")
def get_firmware():
    df_routers = load_routers()
    unique_firmware = sorted(df_routers["firmware_version"].dropna().unique().tolist())
    return {
        "firmware": unique_firmware
    }

@router.get("/analytics")
def get_network_analytics():
    building_data = get_building_analytics()
    firmware_data = get_firmware_analytics()
    model_data = get_model_analytics()
    prioritized_list = get_prioritized_intervention_list()
    
    return {
        "building_performance": building_data,
        "firmware_performance": firmware_data,
        "model_performance": model_data,
        "prioritized_interventions": prioritized_list
    }
