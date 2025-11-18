import asyncio
import json
import os
import logging
import base64
from io import BytesIO
import PyPDF2
from PIL import Image
import pytesseract  # For OCR if needed
from typing import Dict, Any, List, Optional
from datetime import datetime, timedelta
from fastapi import FastAPI, HTTPException, BackgroundTasks, File, UploadFile, Form
from fastapi.responses import HTMLResponse
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field, validator
import requests
from dotenv import load_dotenv
from openai import OpenAI, AsyncOpenAI
from cachetools import TTLCache

# ==================== CONFIGURATION ====================
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger("farmsmart")

load_dotenv()

# API Keys validation
REQUIRED_KEYS = {
    "WEATHER_API_KEY": os.getenv("WEATHER_API_KEY"),
    "OPENWEATHER_API_KEY": os.getenv("OPENWEATHER_API_KEY"),
    "GEMINI_API_KEY": os.getenv("GEMINI_API_KEY"),  # Only needed if still using Gemini
    "OPENAI_API_KEY": os.getenv("OPENAI_API_KEY"),   # Add this for OpenAI
    "TAVILY_API_KEY": os.getenv("TAVILY_API_KEY")
}


missing_keys = [k for k, v in REQUIRED_KEYS.items() if not v]
if missing_keys:
    raise EnvironmentError(f"Missing API keys: {', '.join(missing_keys)}")

WEATHER_API_KEY = REQUIRED_KEYS["WEATHER_API_KEY"]
OPENWEATHER_API_KEY = REQUIRED_KEYS["OPENWEATHER_API_KEY"]
GEMINI_API_KEY = REQUIRED_KEYS["GEMINI_API_KEY"]
OPENAI_API_KEY = REQUIRED_KEYS["OPENAI_API_KEY"]
TAVILY_API_KEY = REQUIRED_KEYS["TAVILY_API_KEY"]


# OpenAI Clients
sync_client = OpenAI(api_key=OPENAI_API_KEY)
async_client = AsyncOpenAI(api_key=OPENAI_API_KEY)


from agents import Agent, Runner, function_tool, OpenAIChatCompletionsModel, handoff, SQLiteSession
from tavily import TavilyClient

MODEL = OpenAIChatCompletionsModel(
    model="gpt-4o-mini",  # or gpt-4, gpt-3.5-turbo
    openai_client=async_client
)

tavily_client = TavilyClient(api_key=TAVILY_API_KEY)


# Cache for API responses (5 min TTL)
weather_cache = TTLCache(maxsize=100, ttl=300)
market_cache = TTLCache(maxsize=200, ttl=600)
knowledge_cache = TTLCache(maxsize=500, ttl=1800)  # 30 min for knowledge


# ==================== NEW KNOWLEDGE BASE TOOL ====================

@function_tool
def get_agritech_knowledge(topic: str, subtopic: str = "") -> Dict[str, Any]:
    """Comprehensive agriculture knowledge base covering all farming topics."""
    
    cache_key = f"knowledge_{topic}_{subtopic}"
    if cache_key in knowledge_cache:
        return knowledge_cache[cache_key]
    
    # Structured knowledge database
    knowledge_db = {
        "crop_basics": {
            "wheat": {
                "type": "Rabi (Winter) crop",
                "scientific_name": "Triticum aestivum",
                "sowing_time": "November-December",
                "harvest_time": "April-May",
                "duration": "120-150 days",
                "temperature": "20-25°C optimal",
                "soil": "Well-drained loamy soil, pH 6-7",
                "water": "3-5 irrigations needed",
                "varieties": ["Punjab-11", "Faisalabad-08", "Johar-16"],
                "urdu": "Gandum - Rabi ki mukhy fasal"
            },
            "rice": {
                "type": "Kharif (Summer) crop",
                "scientific_name": "Oryza sativa",
                "sowing_time": "May-June (nursery)",
                "transplanting": "June-July",
                "harvest_time": "October-November",
                "duration": "140-160 days",
                "temperature": "25-35°C",
                "soil": "Heavy clay soil, pH 5.5-6.5",
                "water": "Standing water required",
                "varieties": ["Super Basmati", "KSK-133", "Kainat"],
                "urdu": "Chawal - Kharif ki mukhy fasal"
            },
            "cotton": {
                "type": "Kharif (Summer) crop",
                "scientific_name": "Gossypium hirsutum",
                "sowing_time": "April-May",
                "harvest_time": "September-December (multiple pickings)",
                "duration": "180-200 days",
                "temperature": "25-35°C",
                "soil": "Sandy loam, pH 6-8",
                "varieties": ["BT-121", "FH-326", "IUB-13"],
                "urdu": "Kapas - Kharif ki nakdi fasal"
            },
            "sugarcane": {
                "type": "Annual/Ratoon crop",
                "sowing_time": "February-March (spring), September-October (autumn)",
                "harvest_time": "November-March",
                "duration": "12-18 months",
                "water": "Heavy water requirement",
                "varieties": ["CPF-246", "HSF-240"],
                "urdu": "Ganna - Barson wali fasal"
            }
        },
        
        "soil_science": {
            "types": {
                "sandy": {
                    "texture": "Coarse, gritty",
                    "drainage": "Excellent (too fast)",
                    "water_retention": "Poor",
                    "nutrients": "Low",
                    "best_for": ["Groundnut", "Watermelon", "Carrots"],
                    "improvement": "Add organic matter, compost",
                    "urdu": "Retli mitti - pani jaldi sookh jata hai"
                },
                "loamy": {
                    "texture": "Balanced mixture",
                    "drainage": "Good",
                    "water_retention": "Excellent",
                    "nutrients": "High",
                    "best_for": ["Wheat", "Rice", "Most vegetables"],
                    "urdu": "Dumat mitti - sab se achi mitti"
                },
                "clay": {
                    "texture": "Fine, sticky when wet",
                    "drainage": "Poor",
                    "water_retention": "Excellent (too much)",
                    "nutrients": "High",
                    "best_for": ["Rice", "Wheat", "Sugarcane"],
                    "improvement": "Add sand, gypsum for drainage",
                    "urdu": "Chikni mitti - pani zyada rakhti hai"
                }
            },
            "testing": {
                "ph": "Test every 2-3 years. Ideal: 6-7 for most crops",
                "npk": "Test before sowing to determine fertilizer needs",
                "organic_matter": "Should be 2-5% for good fertility",
                "urdu": "Mitti ka test agriculture lab me karwayen"
            }
        },
        
        "irrigation": {
            "methods": {
                "flood": {
                    "description": "Traditional method, field flooding",
                    "efficiency": "40-60%",
                    "best_for": ["Rice", "Wheat", "Sugarcane"],
                    "cost": "Low initial investment",
                    "urdu": "Sailab irrigation - poore khet me pani"
                },
                "drip": {
                    "description": "Water directly to plant roots",
                    "efficiency": "90-95%",
                    "best_for": ["Vegetables", "Fruits", "Cotton"],
                    "cost": "High initial, low running cost",
                    "subsidy": "Government provides 60% subsidy",
                    "urdu": "Boond boond pani - pani ki bachat"
                },
                "sprinkler": {
                    "description": "Rain-like water distribution",
                    "efficiency": "70-80%",
                    "best_for": ["Vegetables", "Fodder", "Wheat"],
                    "cost": "Medium",
                    "urdu": "Fawara system - barish ki tarah"
                }
            },
            "scheduling": {
                "critical_stages": "Never skip water during flowering/grain formation",
                "timing": "Early morning (5-8 AM) or evening (5-8 PM)",
                "frequency": "Check soil moisture at 6 inches depth",
                "urdu": "Subah ya sham ko pani dein"
            }
        },
        
        "fertilizers": {
            "types": {
                "urea": {
                    "npk": "46:0:0",
                    "nutrient": "Nitrogen (N)",
                    "use": "Vegetative growth, green leaves",
                    "timing": "Split doses during growth",
                    "price_range": "PKR 2000-2500 per 50kg bag",
                    "urdu": "Urea - paudhon ko hara karta hai"
                },
                "dap": {
                    "npk": "18:46:0",
                    "nutrient": "Phosphorus (P) + Nitrogen",
                    "use": "Root development, at sowing",
                    "timing": "Apply during land preparation",
                    "price_range": "PKR 7000-8500 per 50kg bag",
                    "subsidy": "PKR 1000 subsidy per bag",
                    "urdu": "DAP - jarein mazboot karta hai"
                },
                "potash": {
                    "npk": "0:0:60",
                    "nutrient": "Potassium (K)",
                    "use": "Fruit/grain quality, disease resistance",
                    "timing": "Flowering stage",
                    "urdu": "Potash - phool aur phal ke liye"
                },
                "npk_complex": {
                    "npk": "Various ratios",
                    "use": "Balanced nutrition",
                    "common": "12:32:16, 15:15:15",
                    "urdu": "Mix khaad - teeno tatve shamil"
                }
            },
            "organic": {
                "fym": "Farm Yard Manure - 5-10 tons per acre",
                "compost": "Decomposed organic matter",
                "green_manure": "Sesbania, sunhemp before main crop",
                "urdu": "Desi khaad - gaay gobar, patti"
            }
        },
        
        "pests_diseases": {
            "common_pests": {
                "aphids": {
                    "symptoms": "Sticky leaves, curled leaves, stunted growth",
                    "organic": "Neem oil spray (5ml/liter), ladybugs",
                    "chemical": "Imidacloprid @ 0.5ml/liter",
                    "urdu": "Choti makhi - paton pe chipak jati hai"
                },
                "whitefly": {
                    "symptoms": "White flies under leaves, yellowing",
                    "organic": "Yellow sticky traps, neem spray",
                    "chemical": "Acetamiprid @ 1g/liter",
                    "urdu": "Safed makhi - paton ke neeche"
                },
                "bollworm": {
                    "crop": "Cotton",
                    "symptoms": "Holes in bolls, damaged fruits",
                    "organic": "Pheromone traps, neem",
                    "chemical": "BT spray, chlorpyrifos",
                    "urdu": "Tikka - kapas ka keera"
                }
            },
            "diseases": {
                "rust": {
                    "symptoms": "Orange-brown pustules on leaves",
                    "affected": "Wheat, pulses",
                    "control": "Fungicide spray, resistant varieties",
                    "urdu": "Zang - paton pe laal daag"
                },
                "blast": {
                    "symptoms": "Diamond-shaped lesions on leaves",
                    "affected": "Rice",
                    "control": "Tricyclazole spray",
                    "urdu": "Blast - chawal ki beemari"
                }
            }
        },
        
        "farm_machinery": {
            "tractor": {
                "cost": "PKR 1.2-2.5 million",
                "subsidy": "Available through tractorization scheme",
                "financing": "Banks offer agricultural loans",
                "urdu": "Tractor - zameen ki jotai ke liye"
            },
            "harvester": {
                "types": ["Combine harvester", "Reaper"],
                "rental": "PKR 3000-5000 per acre",
                "subsidy": "Available for small farmers",
                "urdu": "Harvester - fasal katne ki machine"
            },
            "spray_pump": {
                "types": ["Manual", "Battery", "Motorized"],
                "cost": "PKR 5000-50,000",
                "urdu": "Spray pump - dawa chirakne ke liye"
            }
        },
        
        "government_schemes": {
            "kisan_card": {
                "loan_amount": "Up to PKR 150,000",
                "interest": "Zero markup for 1 year",
                "eligibility": "Landowner with CNIC and documents",
                "apply_at": "Zarai Taraqiati Bank (ZTBL)",
                "urdu": "Kisan Card - sasta qarz"
            },
            "crop_insurance": {
                "scheme": "Prime Minister's Crop Insurance (PMFBP)",
                "premium_subsidy": "Government pays 50% premium",
                "coverage": "Natural disasters, pest attacks",
                "helpline": "051-9205771",
                "urdu": "Fasal ki insurance - nuksaan ki tazmeen"
            },
            "subsidy_programs": {
                "seeds": "30% subsidy on certified seeds",
                "fertilizer": "PKR 1000 per DAP bag",
                "drip": "60% subsidy on drip irrigation",
                "solar": "50% subsidy on solar pumps",
                "urdu": "Hukumat ki madad programs"
            }
        },
        
        "marketing": {
            "selling_options": {
                "mandi": "Traditional market - auction system",
                "contract": "Pre-agreed price with companies",
                "online": "Online platforms emerging",
                "export": "High value for quality produce",
                "urdu": "Fasal bechne ke tareeqe"
            },
            "pricing_factors": {
                "demand_supply": "Main price determinant",
                "quality": "Grade A gets premium",
                "timing": "Off-season = higher prices",
                "storage": "Cold storage extends selling window",
                "urdu": "Qeemat kis cheez pe nirbhar karti hai"
            }
        },
        
        "organic_farming": {
            "principles": {
                "no_chemicals": "No synthetic pesticides/fertilizers",
                "natural": "Use organic inputs only",
                "certification": "Required for premium pricing",
                "market": "Growing demand in urban areas",
                "urdu": "Organic kheti - qudrati tareeqa"
            },
            "inputs": {
                "fertilizer": "Compost, vermicompost, FYM",
                "pest_control": "Neem, tobacco extract, biopesticides",
                "certification_bodies": "PNAC (Pakistan National Accreditation Council)",
                "urdu": "Desi tareeqon se kheti"
            }
        },
        
        "climate_smart": {
            "practices": {
                "water_conservation": "Drip, mulching, rainwater harvesting",
                "soil_health": "Cover crops, crop rotation, no-till",
                "renewable_energy": "Solar pumps, biogas from waste",
                "weather_info": "Use weather apps for planning",
                "urdu": "Mausam ke hisab se kheti"
            },
            "challenges": {
                "heat_stress": "Rising temperatures affect yield",
                "water_scarcity": "Groundwater depletion",
                "unpredictable_rain": "Delayed or excess rainfall",
                "solutions": "Drought-resistant varieties, efficient irrigation",
                "urdu": "Mausam ki tabdili ke masail"
            }
        }
    }
    
    # Search and return relevant knowledge
    result = {"topic": topic, "subtopic": subtopic, "data": {}}
    
    topic_lower = topic.lower()
    
    # Match topic
    if topic_lower in knowledge_db:
        result["data"] = knowledge_db[topic_lower]
    else:
        # Search across all topics
        for main_topic, content in knowledge_db.items():
            if topic_lower in str(content).lower():
                result["data"][main_topic] = content
    
    # If no exact match, provide general farming info
    if not result["data"]:
        result["data"] = {
            "message": f"Information about '{topic}' is being compiled.",
            "suggestion": "Try topics like: crop_basics, soil_science, irrigation, fertilizers, pests_diseases, farm_machinery, government_schemes, marketing, organic_farming, climate_smart"
        }
    
    knowledge_cache[cache_key] = result
    return result


@function_tool
def web_search(query: str) -> str:
    try:
        response = tavily_client.search(query, max_results=5)
        formatted_results = {"query": query, "results": [], "success": True}
        if response.get("results"):
            for result in response["results"]:
                formatted_results["results"].append({
                    "title": result.get("title", ""),
                    "url": result.get("url", ""),
                    "snippet": result.get("snippet", ""),
                    "source": result.get("source", "")
                })
        return json.dumps(formatted_results, indent=2)
    except Exception as e:
        return json.dumps({"error": str(e), "success": False})


@function_tool
def get_datetime() -> str:
    from datetime import datetime
    import time
    now = datetime.now()
    return json.dumps({
        "current_datetime": now.isoformat(),
        "date": now.strftime("%Y-%m-%d"),
        "time": now.strftime("%H:%M:%S"),
        "day": now.strftime("%A"),
        "timestamp": int(time.time())
    })


@function_tool
def search_farming_practices(query: str, region: str = "Pakistan") -> Dict[str, Any]:
    """Search for specific farming practices and techniques."""
    
    practices_db = {
        "land_preparation": {
            "steps": [
                "1. Remove previous crop residue",
                "2. Deep ploughing (8-10 inches)",
                "3. Planking/leveling",
                "4. Apply FYM if available",
                "5. Final ploughing before sowing"
            ],
            "urdu": "Zameen tayyar karne ka tareeqa"
        },
        "seed_selection": {
            "criteria": [
                "Use certified seeds",
                "Check germination rate (>85%)",
                "Select disease-resistant varieties",
                "Match variety to your region"
            ],
            "sources": ["Punjab Seed Corporation", "Private companies", "Agriculture department"],
            "urdu": "Acha beej kaise chuno"
        },
        "water_management": {
            "tips": [
                "Check soil moisture before irrigation",
                "Irrigate at critical stages",
                "Avoid over-watering",
                "Use efficient methods (drip/sprinkler)"
            ],
            "urdu": "Pani ka intezam"
        },
        "weed_control": {
            "methods": {
                "manual": "Hand weeding - labor intensive",
                "chemical": "Herbicides - use carefully",
                "mulching": "Cover soil to prevent weeds",
                "crop_rotation": "Breaks weed cycles"
            },
            "urdu": "Jhangli ghaas se nijat"
        },
        "harvest_timing": {
            "indicators": [
                "Grain moisture content",
                "Color of grains/fruits",
                "Leaf yellowing (for grains)",
                "Days after flowering"
            ],
            "urdu": "Fasal katne ka sahi waqt"
        },
        "post_harvest": {
            "steps": [
                "Threshing/cleaning",
                "Drying to safe moisture (12-14%)",
                "Storage in proper conditions",
                "Pest control in storage"
            ],
            "storage_tips": "Use airtight containers, add neem leaves",
            "urdu": "Fasal katne ke baad kya karein"
        }
    }
    
    query_lower = query.lower()
    results = {}
    
    for practice, details in practices_db.items():
        if any(word in practice for word in query_lower.split()):
            results[practice] = details
    
    if not results:
        return {
            "query": query,
            "message": "No exact match found",
            "available_practices": list(practices_db.keys()),
            "suggestion": "Try: land_preparation, seed_selection, water_management, weed_control, harvest_timing, post_harvest"
        }
    
    return {
        "query": query,
        "region": region,
        "practices": results
    }


@function_tool
def get_farming_calendar_by_month(month: int, region: str = "Punjab") -> Dict[str, Any]:
    """Get what farming activities should be done in a specific month."""
    
    month_names = [
        "", "January", "February", "March", "April", "May", "June",
        "July", "August", "September", "October", "November", "December"
    ]
    
    calendar = {
        1: {"season": "Winter (Rabi)", "activities": ["Wheat irrigation", "Fertilizer for wheat", "Potato harvest begins"], "urdu": "Gandum me pani aur khaad"},
        2: {"season": "Spring prep", "activities": ["Sugarcane planting", "Wheat fertilizer (2nd dose)", "Prepare for cotton"], "urdu": "Ganna lagana shuru"},
        3: {"season": "Spring", "activities": ["Cotton land preparation", "Wheat irrigation", "Summer vegetables sowing"], "urdu": "Kapas ki zameen tayyar"},
        4: {"season": "Summer start (Kharif)", "activities": ["Cotton sowing", "Rice nursery preparation", "Wheat harvest"], "urdu": "Kapas bona, gandum katna"},
        5: {"season": "Hot (Kharif)", "activities": ["Rice nursery", "Cotton irrigation", "Maize sowing"], "urdu": "Chawal ki nursery"},
        6: {"season": "Monsoon start", "activities": ["Rice transplanting", "Cotton pest management", "Fodder sowing"], "urdu": "Chawal ropna"},
        7: {"season": "Monsoon", "activities": ["Rice irrigation", "Cotton fertilizer", "Weed control"], "urdu": "Chawal aur kapas ka khayal"},
        8: {"season": "Late monsoon", "activities": ["Cotton picking prep", "Rice fertilizer", "Vegetable sowing"], "urdu": "Fasal pakne ki tayyari"},
        9: {"season": "Post-monsoon", "activities": ["Cotton picking", "Rice harvest prep", "Wheat land prep"], "urdu": "Kapas todna shuru"},
        10: {"season": "Autumn (Rabi prep)", "activities": ["Rice harvest", "Wheat land preparation", "Sugarcane harvest"], "urdu": "Chawal katna, gandum ki tayyari"},
        11: {"season": "Winter start (Rabi)", "activities": ["Wheat sowing", "Fertilizer application", "Sugarcane harvest"], "urdu": "Gandum bona"},
        12: {"season": "Winter (Rabi)", "activities": ["Wheat irrigation", "Potato sowing", "Fodder crops"], "urdu": "Gandum me pani, aalu lagana"}
    }
    
    if month < 1 or month > 12:
        month = datetime.now().month
    
    month_data = calendar[month]
    
    return {
        "month": month_names[month],
        "region": region,
        "season": month_data["season"],
        "key_activities": month_data["activities"],
        "urdu_summary": month_data["urdu"],
        "next_month_prep": calendar[(month % 12) + 1]["activities"][0]
    }


# ==================== EXISTING TOOLS (keeping all previous tools) ====================

@function_tool
def get_weather(location: str) -> Dict[str, Any]:
    """Get current weather with forecast for farming decisions."""
    cache_key = f"weather_{location}"
    if cache_key in weather_cache:
        return weather_cache[cache_key]
    
    try:
        response = requests.get(
            "https://api.weatherapi.com/v1/forecast.json",
            params={
                "key": WEATHER_API_KEY,
                "q": location,
                "days": 3,
                "aqi": "yes"
            },
            timeout=10
        )
        response.raise_for_status()
        data = response.json()
        
        result = {
            "location": data["location"]["name"],
            "region": data["location"]["region"],
            "current": {
                "temp_c": data["current"]["temp_c"],
                "feels_like": data["current"]["feelslike_c"],
                "condition": data["current"]["condition"]["text"],
                "humidity": data["current"]["humidity"],
                "wind_kph": data["current"]["wind_kph"],
                "uv_index": data["current"]["uv"],
                "precipitation_mm": data["current"]["precip_mm"]
            },
            "forecast": [
                {
                    "date": day["date"],
                    "max_temp": day["day"]["maxtemp_c"],
                    "min_temp": day["day"]["mintemp_c"],
                    "rain_chance": day["day"]["daily_chance_of_rain"],
                    "condition": day["day"]["condition"]["text"]
                }
                for day in data["forecast"]["forecastday"]
            ],
            "air_quality": {
                "aqi": data["current"]["air_quality"].get("us-epa-index", "N/A"),
                "pm2_5": data["current"]["air_quality"].get("pm2_5", "N/A")
            }
        }
        
        weather_cache[cache_key] = result
        return result
        
    except Exception as e:
        logger.error(f"Weather API error: {e}")
        return {"error": "Weather data unavailable. Try again later."}


@function_tool
def get_soil_moisture_advice(soil_type: str, crop: str, weather_humidity: int = 60) -> Dict[str, Any]:
    """Provide soil moisture management based on soil type and crop."""
    soil_db = {
        "sandy": {"water_retention": "low", "irrigation_frequency": "daily", "method": "drip"},
        "loamy": {"water_retention": "medium", "irrigation_frequency": "2-3 days", "method": "sprinkler"},
        "clay": {"water_retention": "high", "irrigation_frequency": "weekly", "method": "flood"}
    }
    
    soil_info = soil_db.get(soil_type.lower(), soil_db["loamy"])
    
    return {
        "soil_type": soil_type,
        "crop": crop,
        "water_retention": soil_info["water_retention"],
        "irrigation_frequency": soil_info["irrigation_frequency"],
        "recommended_method": soil_info["recommended_method"],
        "moisture_tip": f"For {crop} in {soil_type} soil, check moisture at 6 inches depth.",
        "weather_adjustment": "Reduce watering by 30%" if weather_humidity > 70 else "Normal watering"
    }


@function_tool
def detect_pest_disease(symptoms: str, crop: str) -> Dict[str, Any]:
    """Identify pest/disease from symptoms and suggest organic solutions."""
    prompt = f"""
You are a plant pathologist. A farmer reports these symptoms on {crop}: "{symptoms}"
Return ONLY valid JSON:
{{
    "crop": "{crop}",
    "likely_issue": "Aphid infestation",
    "severity": "medium",
    "organic_solution": "Neem oil spray (5ml per liter), spray early morning",
    "chemical_option": "Imidacloprid 200 SL @ 0.5ml/liter (if severe)",
    "prevention": "Remove weeds, use yellow sticky traps",
    "urdu_tip": "Neem ka tail subah chirko, har 5 din baad"
}}
"""
    try:
        response = sync_client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[{"role": "user", "content": prompt}],
            response_format={"type": "json_object"},
            temperature=0.3
        )
        return json.loads(response.choices[0].message.content)
    except Exception as e:
        logger.error(f"Pest detection error: {e}")
        return {
            "crop": crop,
            "likely_issue": "Unable to diagnose",
            "suggestion": "Visit nearest agriculture extension office with leaf sample"
        }


@function_tool
def get_fertilizer_schedule(crop: str, growth_stage: str, soil_type: str = "loamy") -> Dict[str, Any]:
    """Generate NPK fertilizer schedule for crop growth stages."""
    schedules = {
        "wheat": {
            "sowing": {"npk": "12:32:16", "kg_per_acre": 50, "urdu": "Buwai ke waqt DAP"},
            "tillering": {"npk": "46:0:0", "kg_per_acre": 30, "urdu": "21 din baad urea"},
            "flowering": {"npk": "0:0:50", "kg_per_acre": 20, "urdu": "Phool aane pe potash"}
        },
        "rice": {
            "transplanting": {"npk": "12:32:16", "kg_per_acre": 60},
            "tillering": {"npk": "46:0:0", "kg_per_acre": 40},
            "panicle": {"npk": "0:0:50", "kg_per_acre": 25}
        }
    }
    
    crop_schedule = schedules.get(crop.lower(), schedules["wheat"])
    stage_info = crop_schedule.get(growth_stage.lower(), list(crop_schedule.values())[0])
    
    return {
        "crop": crop,
        "growth_stage": growth_stage,
        "npk_ratio": stage_info["npk"],
        "quantity_per_acre": stage_info["kg_per_acre"],
        "application_method": "Broadcast before irrigation or mix with irrigation water",
        "timing": f"Apply during {growth_stage} stage",
        "urdu_advice": stage_info.get("urdu", "Khad pani ke sath daalein")
    }


@function_tool
def calculate_irrigation_need(crop: str, area_acres: float, temperature: float, humidity: int) -> Dict[str, Any]:
    """Calculate daily water requirement based on crop and weather."""
    crop_kc = {
        "wheat": 0.85, "rice": 1.2, "cotton": 0.8, "sugarcane": 1.1,
        "maize": 0.9, "potato": 0.75, "onion": 0.7
    }
    
    kc = crop_kc.get(crop.lower(), 0.8)
    et0 = 0.408 * (temperature / 20) * (1 - humidity / 200)
    daily_water_mm = et0 * kc * 1.2
    total_water_m3 = daily_water_mm * area_acres * 4046.86 / 1000
    
    return {
        "crop": crop,
        "area_acres": area_acres,
        "daily_water_mm": round(daily_water_mm, 2),
        "total_water_m3_per_day": round(total_water_m3, 2),
        "total_liters_per_day": round(total_water_m3 * 1000, 0),
        "irrigation_hours_drip": round(total_water_m3 / 2, 1),
        "advice": f"Water early morning (5-8 AM) or evening (5-7 PM)",
        "urdu": f"{crop} ke liye roz {round(total_water_m3, 0)} cubic meter pani chahiye"
    }


@function_tool
def get_market_data(product: str, region: str = "Pakistan") -> Dict[str, Any]:
    """Get market prices with trend analysis."""
    cache_key = f"market_{product}_{region}"
    if cache_key in market_cache:
        return market_cache[cache_key]
    
    prompt = f"""
Generate realistic market data for {product} in {region} (current date: {datetime.now().strftime('%Y-%m-%d')}).
Return ONLY valid JSON:
{{
    "product": "{product}",
    "region": "{region}",
    "price_per_kg_pkr": 120,
    "price_range": {{"min": 100, "max": 140}},
    "demand": "high",
    "supply": "medium",
    "trend": "increasing",
    "best_markets": ["Lahore Azadi Chowk Sabzi Mandi", "Faisalabad Jhang Bazar"],
    "export_potential": "yes",
    "advice": "Prices peak in 2 weeks, hold stock if possible",
    "urdu_tip": "Aglay hafte qeemat barh sakti hai"
}}
"""
    try:
        response = sync_client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[{"role": "user", "content": prompt}],
            response_format={"type": "json_object"},
            temperature=0.3
        )
        result = json.loads(response.choices[0].message.content)
        market_cache[cache_key] = result
        return result
    except Exception as e:
        logger.error(f"Market data error: {e}")
        return {
            "product": product,
            "price_per_kg_pkr": 100,
            "error": "Market data temporarily unavailable"
        }


@function_tool
def get_subsidy_info(crop: str, region: str = "Punjab") -> Dict[str, Any]:
    """Get government subsidy and loan information."""
    subsidies = {
        "Punjab": {
            "seed_subsidy": "30% off certified seeds",
            "fertilizer": "PKR 1000/bag subsidy on DAP",
            "kisan_card": "Zero-markup loan up to PKR 150,000",
            "insurance": "Premium subsidy available through PMFBP"
        },
        "Sindh": {
            "seed_subsidy": "25% off",
            "tractor_scheme": "Subsidy on farm machinery"
        }
    }
    
    region_info = subsidies.get(region, subsidies["Punjab"])
    
    return {
        "region": region,
        "crop": crop,
        "subsidies_available": region_info,
        "apply_at": "Visit nearest agriculture department or Zarai Taraqiati Bank",
        "helpline": "0800-12345 (toll-free)",
        "urdu": "Kisan Card banwane ke liye apna CNIC aur zameen ki registry le kar ZTBL jaayen"
    }


@function_tool
def estimate_crop_yield(crop: str, area_acres: float, soil_quality: str = "medium", region: str = "Pakistan") -> Dict[str, Any]:
    """Estimate yield with profitability analysis."""
    base_yields = {
        "wheat": 2500, "rice": 3000, "cotton": 800, "sugarcane": 30000,
        "maize": 2800, "potato": 10000, "onion": 12000, "tomato": 15000,
        "millet": 900, "chickpea": 1200, "sunflower": 1800
    }
    
    quality_multiplier = {"poor": 0.7, "medium": 1.0, "good": 1.3}.get(soil_quality.lower(), 1.0)
    base = base_yields.get(crop.lower(), 1000)
    estimated_kg = base * area_acres * quality_multiplier
    
    market = get_market_data(crop, region)
    price = market.get("price_per_kg_pkr", 50)
    
    revenue = estimated_kg * price
    cost_per_acre = base * 0.4 * price
    total_cost = cost_per_acre * area_acres
    profit = revenue - total_cost
    
    return {
        "crop": crop,
        "area_acres": area_acres,
        "soil_quality": soil_quality,
        "estimated_yield_kg": round(estimated_kg, 2),
        "estimated_yield_mound": round(estimated_kg / 40, 2),
        "market_price_pkr": price,
        "estimated_revenue_pkr": round(revenue, 2),
        "estimated_cost_pkr": round(total_cost, 2),
        "estimated_profit_pkr": round(profit, 2),
        "roi_percentage": round((profit / total_cost) * 100, 1),
        "urdu": f"{area_acres} acre me lagbhag {round(estimated_kg/40, 0)} mann {crop} hogi"
    }


@function_tool
def get_crop_rotation_plan(current_crop: str, soil_type: str, region: str = "Pakistan") -> Dict[str, Any]:
    """Suggest crop rotation to maintain soil health."""
    rotations = {
        "wheat": ["chickpea", "fodder", "sugarcane"],
        "rice": ["wheat", "potato", "mustard"],
        "cotton": ["wheat", "chickpea", "vegetables"],
        "sugarcane": ["wheat", "potato", "sunflower"]
    }
    
    next_crops = rotations.get(current_crop.lower(), ["wheat", "maize", "vegetables"])
    
    return {
        "current_crop": current_crop,
        "recommended_next_crops": next_crops,
        "reason": "Crop rotation prevents soil nutrient depletion and breaks pest cycles",
        "timeline": f"After {current_crop} harvest, prepare field for {next_crops[0]}",
        "soil_benefit": "Nitrogen fixation and organic matter improvement",
        "urdu": f"{current_crop} ke baad {next_crops[0]} lagayen, zameen ki taqat wapas aati hai"
    }


@function_tool
def get_crop_calendar(crop: str, region: str = "Punjab") -> Dict[str, Any]:
    """Get complete crop calendar with all farming activities."""
    calendars = {
        "wheat": {
            "sowing": "November - December",
            "irrigation": "3-4 times (21, 45, 75, 100 DAS)",
            "fertilizer_schedule": ["At sowing: DAP", "21 DAS: Urea", "Flowering: Potash"],
            "harvest": "April - May",
            "days_to_maturity": 120
        },
        "rice": {
            "nursery": "May - June",
            "transplanting": "June - July",
            "irrigation": "Standing water till grain formation",
            "harvest": "October - November",
            "days_to_maturity": 140
        }
    }
    
    calendar = calendars.get(crop.lower(), calendars["wheat"])
    
    return {
        "crop": crop,
        "region": region,
        **calendar,
        "urdu_summary": f"{crop} ki buwai {calendar.get('sowing', 'season ke mutabiq')} me karein"
    }


@function_tool
def get_weather_based_advice(location: str, crop: str) -> Dict[str, Any]:
    """Combine weather forecast with crop-specific advice."""
    weather = get_weather(location)
    
    if "error" in weather:
        return {"error": "Cannot provide advice without weather data"}
    
    temp = weather["current"]["temp_c"]
    rain_chance = weather["forecast"][0]["rain_chance"] if weather.get("forecast") else 0
    
    advice = []
    
    if temp > 35:
        advice.append(f"High temperature alert! Increase irrigation for {crop}.")
        advice.append("Urdu: Garmi bohot hai, pani zyada dein")
    
    if rain_chance > 70:
        advice.append("Heavy rain expected. Delay fertilizer application.")
        advice.append("Urdu: Barish hogi, khad na daalein abhi")
    
    if temp < 15 and crop.lower() in ["rice", "cotton"]:
        advice.append(f"Cold weather warning! {crop} growth may slow down.")
    
    return {
        "location": location,
        "crop": crop,
        "weather_summary": f"{temp}°C, {rain_chance}% rain chance",
        "advice": advice,
        "action_needed": "yes" if (temp > 35 or rain_chance > 70) else "no"
    }

@function_tool
def read_uploaded_file(file_path: str, file_type: str = "auto") -> Dict[str, Any]:
    """
    Read and extract text from uploaded files (PDF, images, text files).
    
    Args:
        file_path: Path to the uploaded file
        file_type: Type of file (pdf, image, text, or auto-detect)
    
    Returns:
        Dictionary with extracted text and metadata
    """
    
    try:
        # Auto-detect file type from extension
        if file_type == "auto":
            extension = file_path.lower().split('.')[-1]
            if extension == 'pdf':
                file_type = 'pdf'
            elif extension in ['jpg', 'jpeg', 'png', 'bmp', 'tiff']:
                file_type = 'image'
            elif extension in ['txt', 'csv']:
                file_type = 'text'
            else:
                return {
                    "error": f"Unsupported file type: {extension}",
                    "supported_types": ["pdf", "jpg", "png", "txt", "csv"]
                }
        
        # Extract text based on file type
        if file_type == 'pdf':
            return extract_pdf_text(file_path)
        elif file_type == 'image':
            return extract_image_text(file_path)
        elif file_type == 'text':
            return extract_text_file(file_path)
        else:
            return {"error": "Invalid file type specified"}
            
    except Exception as e:
        logger.error(f"File reading error: {e}")
        return {
            "error": f"Failed to read file: {str(e)}",
            "file_path": file_path
        }


def extract_pdf_text(file_path: str) -> Dict[str, Any]:
    """Extract text from PDF files."""
    try:
        with open(file_path, 'rb') as file:
            pdf_reader = PyPDF2.PdfReader(file)
            
            text_content = []
            for page_num, page in enumerate(pdf_reader.pages, 1):
                page_text = page.extract_text()
                text_content.append({
                    "page": page_num,
                    "text": page_text.strip()
                })
            
            full_text = "\n\n".join([f"Page {p['page']}:\n{p['text']}" 
                                    for p in text_content])
            
            return {
                "file_type": "PDF",
                "total_pages": len(pdf_reader.pages),
                "extracted_text": full_text,
                "pages": text_content,
                "success": True
            }
    except Exception as e:
        return {"error": f"PDF extraction failed: {str(e)}"}


def extract_image_text(file_path: str) -> Dict[str, Any]:
    """Extract text from images using OCR."""
    try:
        image = Image.open(file_path)
        
        # Use OCR to extract text
        extracted_text = pytesseract.image_to_string(image, lang='eng')
        
        return {
            "file_type": "Image",
            "image_size": image.size,
            "image_format": image.format,
            "extracted_text": extracted_text.strip(),
            "success": True,
            "note": "OCR extraction - may contain errors for handwritten text"
        }
    except Exception as e:
        return {"error": f"Image extraction failed: {str(e)}"}


def extract_text_file(file_path: str) -> Dict[str, Any]:
    """Extract text from plain text files."""
    try:
        with open(file_path, 'r', encoding='utf-8') as file:
            content = file.read()
        
        return {
            "file_type": "Text",
            "extracted_text": content.strip(),
            "character_count": len(content),
            "line_count": len(content.split('\n')),
            "success": True
        }
    except Exception as e:
        return {"error": f"Text file extraction failed: {str(e)}"}


@function_tool
def analyze_document_content(document_text: str, question: str, language: str = "auto") -> Dict[str, Any]:
    """
    Analyze document content and answer specific questions about it.
    Uses AI to understand context and provide accurate answers.
    
    Args:
        document_text: Extracted text from document
        question: User's question about the document
        language: Response language (english/roman_urdu/auto)
    
    Returns:
        Structured answer based on document content
    """
    
    # Detect language from question
    is_urdu = any(word in question.lower() for word in 
                  ['kya', 'hai', 'kaise', 'kyun', 'kis', 'kaun', 'kab', 'kahan'])
    
    if language == "auto":
        language = "roman_urdu" if is_urdu else "english"
    
    prompt = f"""
You are an agricultural document analyst. A farmer has uploaded a document and asked a question.

DOCUMENT CONTENT:
{document_text[:3000]}  # Limit to first 3000 chars to avoid token limits

USER QUESTION: {question}

INSTRUCTIONS:
1. Read the document carefully
2. Find information relevant to the question
3. Provide accurate answer ONLY from document content
4. If answer is not in document, clearly state that
5. Include specific details (numbers, dates, measurements) from document
6. Response language: {language}

{"LANGUAGE STYLE: Use Pakistani Roman Urdu/English mix. Example: 'Document me likha hai ke...'" if language == "roman_urdu" else "LANGUAGE STYLE: Professional English"}

Return answer in JSON format:
{{
    "answer": "Direct answer to the question",
    "source_reference": "Specific quote or section from document",
    "confidence": "high/medium/low",
    "additional_info": "Any extra relevant details",
    "urdu_summary": "Roman Urdu summary (if language is roman_urdu)"
}}

IMPORTANT: 
- NO hallucinations - answer ONLY from document
- If information is not in document, say "Document me ye information nahi hai" (Urdu) or "This information is not in the document" (English)
"""
    
    try:
        response = sync_client.chat.completions.create(
            model="gemini-2.5-flash",
            messages=[{"role": "user", "content": prompt}],
            response_format={"type": "json_object"},
            temperature=0.1  # Low temperature for factual accuracy
        )
        
        result = json.loads(response.choices[0].message.content)
        result["language_used"] = language
        return result
        
    except Exception as e:
        logger.error(f"Document analysis error: {e}")
        return {
            "error": "Analysis failed",
            "suggestion": "Please try rephrasing your question" if language == "english" 
                         else "Apna sawal dobara poochen"
        }


@function_tool
def summarize_agricultural_document(document_text: str, language: str = "english") -> Dict[str, Any]:
    """
    Create a concise summary of agricultural documents.
    Extracts key information relevant to farming.
    
    Args:
        document_text: Full document text
        language: Summary language (english/roman_urdu)
    
    Returns:
        Structured summary with key points
    """
    
    prompt = f"""
Summarize this agricultural document. Extract:
- Main topic/subject
- Key recommendations
- Important numbers (quantities, dates, measurements)
- Action items for farmers
- Warnings or critical information

DOCUMENT:
{document_text[:4000]}

Language: {language}
{"Style: Pakistani Roman Urdu/English mix" if language == "roman_urdu" else "Style: Professional English"}

Return JSON:
{{
    "main_topic": "What is this document about",
    "key_points": ["point 1", "point 2", "point 3"],
    "numbers_and_data": {{"measurement": "value"}},
    "recommendations": ["action 1", "action 2"],
    "warnings": ["warning 1"],
    "summary": "2-3 sentence overview"
}}
"""
    
    try:
        response = sync_client.chat.completions.create(
            model="gemini-2.5-flash",
            messages=[{"role": "user", "content": prompt}],
            response_format={"type": "json_object"},
            temperature=0.2
        )
        
        return json.loads(response.choices[0].message.content)
        
    except Exception as e:
        return {"error": f"Summarization failed: {str(e)}"}

import firebase_admin
from firebase_admin import credentials, db
import json
from typing import List, Dict, Any, Optional

# Initialize Firebase
FIREBASE_CREDENTIALS_PATH = os.getenv("FIREBASE_CREDENTIALS_PATH")
FIREBASE_DATABASE_URL = os.getenv("FIREBASE_DATABASE_URL")

if not firebase_admin._apps:
    cred = credentials.Certificate(FIREBASE_CREDENTIALS_PATH)
    firebase_admin.initialize_app(cred, {
        'databaseURL': FIREBASE_DATABASE_URL
    })

logger.info("✅ Firebase initialized successfully")


class FirebaseSessionManager:
    """Custom session manager using Firebase Realtime Database"""
    
    def __init__(self, session_id: str):
        self.session_id = session_id
        self.ref = db.reference(f'sessions/{session_id}')
    
    def add_message(self, role: str, content: str, metadata: Dict = None):
        """Add a message to the session"""
        message = {
            'role': role,
            'content': content,
            'timestamp': datetime.now().isoformat(),
            'metadata': metadata or {}
        }
        
        # Get current messages
        messages = self.get_messages()
        messages.append(message)
        
        # Update Firebase
        self.ref.set({
            'messages': messages,
            'last_active': datetime.now().isoformat(),
            'session_id': self.session_id
        })
        
        logger.info(f"💾 Message saved to Firebase session: {self.session_id}")
    
    def get_messages(self) -> List[Dict]:
        """Get all messages from the session"""
        data = self.ref.get()
        if data and 'messages' in data:
            return data['messages']
        return []
    
    def get_conversation_history(self) -> str:
        """Get formatted conversation history"""
        messages = self.get_messages()
        history = []
        for msg in messages:
            role = msg.get('role', 'unknown')
            content = msg.get('content', '')
            history.append(f"{role.upper()}: {content}")
        return "\n\n".join(history)
    
    def get_last_agent(self) -> Optional[str]:
        """Get the last agent used in this session"""
        data = self.ref.get()
        if data and 'last_agent' in data:
            return data['last_agent']
        return None
    
    def set_last_agent(self, agent_name: str):
        """Set the last agent used"""
        current_data = self.ref.get() or {}
        current_data['last_agent'] = agent_name
        current_data['last_active'] = datetime.now().isoformat()
        self.ref.update(current_data)
    
    def get_last_active(self) -> Optional[datetime]:
        """Get last activity timestamp"""
        data = self.ref.get()
        if data and 'last_active' in data:
            return datetime.fromisoformat(data['last_active'])
        return None
    
    def clear(self):
        """Clear the session"""
        self.ref.delete()
        logger.info(f"🗑️ Session cleared: {self.session_id}")
    
    def get_context_for_prompt(self, max_messages: int = 10) -> str:
        """Get recent context to inject into agent prompt"""
        messages = self.get_messages()
        recent = messages[-max_messages:] if len(messages) > max_messages else messages
        
        context = "Previous conversation:\n"
        for msg in recent:
            role = msg.get('role', 'unknown')
            content = msg.get('content', '')[:200]  # Limit length
            context += f"- {role}: {content}\n"
        
        return context        



# ==================== NEW MASTER AGRITECH AGENT ====================

Master_AgriTech_Agent = Agent(
    name="Master AgriTech Expert",
    instructions="""You are the MASTER agriculture expert with comprehensive knowledge across ALL farming domains.
**Your Expertise Covers:**
- Crop science & agronomy
- Soil science & fertility management
- Irrigation & water management
- Pest & disease management
- Farm machinery & technology
- Agricultural economics & marketing
- Government schemes & subsidies
- Organic farming & sustainable practices
- Climate-smart agriculture
- Post-harvest management
- Agricultural research & innovation

**Response Structure (MANDATORY):**
Always format your answer in this order:
1. 🎯 Direct Answer – One-sentence clear reply to the user’s question.
2. 📚 Detailed Explanation – Simple scientific reasoning; avoid jargon.
3. 📏 Practical Recommendations – Exact doses, timings, measurements (e.g., "50 kg/acre", "Nov 1–15").
4. 🌾 Local Context Tips – Pakistan-specific advice, traditional + modern options, regional relevance.
5. 🔒 Preventive Advice / Future Steps** – What to avoid, monitoring tips, when to seek help.

Always format your answer in this order—without using asterisks or markdown: 


Use bold headings, bullet points, and emojis for clarity—even in plain text.
**Response Rules:**
1. **Language Matching**: 
   - English query → Professional English response
   - Roman Urdu/Urdu words → Pakistani Roman Urdu/English mix
   - Examples:
     * English: "Based on soil analysis, I recommend..."
     * Roman Urdu: "Aap ki mitti ki janch ke mutabiq, main salah deta hoon..."
2. **Knowledge Delivery**:
   - Always use available tools to get accurate, structured data
   - Combine multiple data sources for comprehensive answers
   - Provide scientific explanations in simple terms
   - Include practical, actionable advice
   - Give both traditional and modern solutions
3. **Response Structure**:
   - Start with direct answer to the question
   - Provide detailed explanation with reasoning
   - Include specific numbers, timings, and measurements
   - Add practical tips from local context
   - End with preventive measures or future recommendations
4. **When to Use Tools**:
   - get_agritech_knowledge: For general farming concepts, crop info, practices
   - search_farming_practices: For specific techniques and how-to questions
   - get_farming_calendar_by_month: For timing and seasonal activities
   - Other specialized tools: For real-time data (weather, market, etc.)
5. **Conversation Style**:
   - Be warm, encouraging, and supportive
   - Acknowledge farmer's concerns genuinely
   - Simplify complex concepts without being condescending
   - Use local examples and context
   - Celebrate good farming practices
**Example Responses:**
English Query: "What is NPK fertilizer?"
Response: "NPK fertilizer is a compound fertilizer containing three essential nutrients:
- N (Nitrogen): Promotes leaf and stem growth, gives green color
- P (Phosphorus): Strengthens roots and helps flowering
- K (Potassium): Improves fruit quality and disease resistance
Common NPK ratios in Pakistan:
- 12:32:16 - Balanced for wheat/rice at sowing
- 46:0:0 (Urea) - Pure nitrogen for vegetative growth
- 0:0:50 (Potash) - Pure potassium at flowering
Application tip: Apply phosphorus at sowing as it doesn't move in soil. Nitrogen can be split into multiple doses."
Roman Urdu Query: "NPK fertilizer kya hota hai?"
Response: "NPK fertilizer teen zaroori tatve ka mixture hai:
- N (Nitrogen): Paudhon ko hara karta hai, patte aur tana mazboot karta hai
- P (Phosphorus): Jarein mazboot karti hai, phool aur beej banane me madad
- K (Potassium): Phal ki quality achi karta hai, beemari se bachata hai
Pakistan me common ratios:
- 12:32:16 - Gandum/Chawal ke liye buwai ke waqt
- 46:0:0 (Urea) - Sirf nitrogen, paudhon ko hara karne ke liye
- 0:0:50 (Potash) - Sirf potassium, phool aane pe
Tip: Phosphorus buwai ke waqt hi daalein kyunke ye mitti me neeche nahi jata. Nitrogen ko 2-3 baar me daalein."

Example Responses follow the 🎯📚📏🌾🔒 format above.

**Always be the helpful, knowledgeable friend every farmer needs!
**LANGUAGE RULE:
- If user writes in ENGLISH → Respond ONLY in English.
- If user writes Roman Urdu → Respond ONLY in Roman Urdu (no Urdu script).
- If user writes Urdu script → Respond ONLY in Roman Urdu.
- NEVER reply in Urdu script.
""",
    tools=[
        get_agritech_knowledge,
        search_farming_practices,
        get_farming_calendar_by_month,
        get_weather,
        get_market_data,
        detect_pest_disease,
        get_fertilizer_schedule,
        calculate_irrigation_need,
        estimate_crop_yield,
        get_crop_rotation_plan,
        get_subsidy_info,
        get_weather_based_advice
    ],
    model=MODEL
)


# ==================== EXISTING SPECIALIZED AGENTS ====================

Sensor_Agent = Agent(
    name="Soil & Crop Expert",
    instructions="""You are a dedicated soil scientist and agronomist supporting farmers across Pakistan. Your role is to provide practical, science-backed crop recommendations tailored to the user’s soil type.
Core Guidelines:
- Always recommend **3 to 5 suitable crops** based on the soil type provided (e.g., sandy, loamy, clay, or mixed).
- For each crop, give a **brief, clear reason** explaining why it thrives in that soil (e.g., drainage, water retention, nutrient needs, root depth).
- Prioritize crops relevant to Pakistani agriculture (e.g., wheat, rice, cotton, sugarcane, maize, millet/bajra, pulses, vegetables).
- Use available agronomic tools or knowledge to ensure recommendations are accurate and regionally appropriate.

**Response Structure (MANDATORY):**
1. 🎯 Direct Answer – List 3–5 best crops for the given soil.
2. 📚 Explanation per Crop** – Why each crop suits that soil (drainage, nutrients, root depth).
3. 📏 Practical Tips – Sowing time, expected yield range, water needs.
4. 🌾 Local Context – Prioritize wheat, rice, cotton, sugarcane, bajra, pulses as per Pakistani farming.
5. 🔒 Soil Health Advice – How to maintain or improve this soil type.

Always format your answer in this order—without using asterisks or markdown: 


LANGUAGE RULES (STRICTLY FOLLOW):
- If the user’s query is **entirely in English** → Respond **only in English**.
  Example: "For sandy soil, I recommend cotton, pearl millet (bajra), and groundnuts because sandy soils drain quickly and warm up early, favoring drought-tolerant and deep-rooted crops."
  
- If the query contains **any Roman Urdu words** (e.g., kya, hai, mein, tum, ki, ke liye, zameen, acha) → Respond **only in a natural Pakistani Roman Urdu–English mix**.
  Example: "Aap ki loamy soil ke liye best crops hain: wheat, maize, aur sugarcane — kyunki loamy zameen nutrients aur paani dono ko balance mein rakhti hai."

- If the query is written in **Urdu script (Arabic/Nastaliq)** → Respond in **Roman Urdu (not Urdu script)** using the same Roman Urdu–English mix.

- **NEVER** respond in Urdu script under any circumstance.
- **NEVER** mix English and Roman Urdu in a single response unless the input itself justifies it per the rules above.

Formatting:
- List 3–5 crops clearly.
- List crops clearly with bullet points
- Keep explanations simple, farmer-friendly, and grounded in soil science.
- If soil type is missing or unclear, politely ask for clarification before giving recommendations.
""",
    tools=[get_crop_rotation_plan, get_soil_moisture_advice, get_agritech_knowledge],
    model=MODEL
)

AgriTech_Agent = Agent(
    name="Master AgriTech Expert",
    instructions="""
You are a mastered Pakistani AgriTech expert capable of solving **any agricultural query** across crops, livestock, soil, irrigation, pest management, machinery, markets, and climate.

Core Responsibilities:
- Always try to provide the **most accurate, actionable advice** for farmers.
- Use **tools if available**:
  1. `get_weather` for current and 3-day forecast.
  2. `get_weather_based_advice` for crop-specific recommendations.
  3. `web_search` for latest market news, pest alerts, research, or government updates.
- Provide practical guidance including:
  - Crop-specific advice (wheat, rice, sugarcane, cotton, vegetables, fruits)
  - Irrigation timing
  - Pest/disease prevention
  - Harvesting suggestions
  - Sowing delays or scheduling
  - Market trends or prices if relevant
- When weather info is requested, give exact dates and forecast confidence.
- Include **Roman Urdu + English** for Roman Urdu queries; English for English queries. Never use Urdu script.

**Response Structure (MANDATORY):**
Always format your answer in this order:
1. 🎯 Direct Answer – One-sentence clear reply to the user’s question.
2. 📚 Detailed Explanation – Simple scientific reasoning; avoid jargon.
3. 📏 Practical Recommendations – Exact doses, timings, measurements (e.g., "50 kg/acre", "Nov 1–15").
4. 🌾 Local Context Tips– Pakistan-specific advice, traditional + modern options, regional relevance.
5. 🔒 Preventive Advice / Future Steps** – What to avoid, monitoring tips, when to seek help.

Language & Communication Rules (Strictly Enforced):
- **English query → English response**
- **Roman Urdu query → Pakistani Roman Urdu + English mix**
- **Urdu script query → Roman Urdu**
- Always **match user’s language style exactly**.
- Be concise, practical, and farmer-friendly.

General Principles:
- Always validate the latest info using tools first before responding.
- If data is unavailable, clearly inform the user:
  "Mausam ya market ki reliable info iss waqt available nahi. Local radio, Pak Met, ya mandi check karein."
- Prioritize **Pakistan-specific farming practices and conditions**.
- Avoid generic advice; always contextualize to crops, region, and season.
""",
    tools=[get_weather, get_weather_based_advice, web_search],
    model=MODEL
)




Market_Agent = Agent(
    name="Market Intelligence",
    instructions="""You are an agricultural market analyst providing timely, data-driven insights to farmers and agri-stakeholders in Pakistan.

Core Responsibilities:
- **Always use the `get_market_data` tool** to fetch the latest verified prices for agricultural commodities before responding.
- Provide the following for each requested commodity:
  1. **Current price range** (in PKR per kg, maund, or ton—whichever is standard for that crop).
  2. **Market trend**: Clearly state whether prices are rising, falling, or stable over the past 7–14 days.
  3. **Actionable advice**: Suggest optimal timing to **sell** or **buy** based on trends and seasonal patterns.
  4. **Simple example**: Include a brief calculation (e.g., “If you sell 1,000 kg at PKR 120/kg, you’ll earn PKR 120,000”).

- Use `estimate_crop_yield` when users ask about potential income from a field.
- Use `get_subsidy_info` if the query relates to government support, input costs, or policy incentives.

**Response Structure (MANDATORY):**
1. 🎯 Direct Answer – Current price & trend (rising/falling/stable).
2. 📚 Market Context – Why prices are moving (season, demand, imports, Ramadan, etc.).
3. 📏 Actionable Advice – Exact recommendation: “Sell now”, “Wait 5 days”, “Buy inputs today”.
4. 🌾 Local Context – Reference Punjab/Sindh mandis, transport costs, government procurement.
5. 🔒 Risk Note – Price volatility warning or alternative markets.

Always format your answer in this order—without using asterisks or markdown: 


Language & Communication Rules (Strictly Enforced):
- **English query** → Respond **only in clear, professional English**.  
  Example: "Today’s wheat price is PKR 120 per kg. Demand is high due to Ramadan procurement, and prices are rising—consider selling within the next week."

- **Query contains Roman Urdu words** (e.g., kya, hai, mein, qeemat, zameen, bechna) → Respond **only in Pakistani Roman Urdu–English mix**, as used in everyday farming conversations.  
  Example: "Aaj wheat ki qeemat PKR 120 per kg hai. Demand zyada hai aur prices barh rahi hain — agle 5 din mein bech dena acha rahega."

- **Query in Urdu script** → Respond in **Roman Urdu** (never in Urdu script).

- **NEVER** use Urdu (Arabic/Nastaliq) script in your response.
- Always **match the user’s language style exactly**—no mixing unless the input itself mixes (which is rare).
- Keep explanations **scientific but simple**, avoiding jargon unless clearly explained.

**Include example calculation:**  
“If you sell 1,000 kg at PKR 120/kg = PKR 120,000”

General Principles:
- Be precise, concise, and farmer-focused.
- If market data is unavailable, state this transparently and advise caution.
- Prioritize relevance to Pakistan’s domestic markets (e.g., mandi prices in Punjab/Sindh, import/export effects).
""",
    tools=[get_market_data, estimate_crop_yield, get_subsidy_info],
    model=MODEL
)

Weather_Agent = Agent(
    name="Weather & Climate Advisor",
    instructions="""
You are a trusted weather meteorologist and farming climate advisor for Pakistani farmers.
Your job is to give accurate 3-day weather forecasts and farming advice using real tools.

===============================================================================
CITY DETECTION RULES (VERY IMPORTANT)
===============================================================================
You MUST detect Pakistani city names using the list below.

Recognize ANY of these (English or Roman Urdu):
Karachi, Lahore, Islamabad, Rawalpindi, Peshawar, Quetta, Hyderabad, Multan,
Faisalabad, Sialkot, Gujranwala, Sukkur, Larkana, Dadu, Mirpurkhas, Khairpur,
Nawabshah, Jacobabad, Shikarpur, Thatta, Badin, Rahim Yar Khan, Bahawalpur,
Sargodha, Mardan, Swat, Kohat, DI Khan, Muzaffarabad, Gilgit, Skardu.

ALSO recognize common Roman Urdu short forms:
Karachi → karachi, karachy, karachii  
Hyderabad → hyd, hyderbad  
Islamabad → islbd, islamabd  
Lahore → lahore, lahor  
Sukkur → sukkur, sukar  
Multan → multan, multn  

Tolerate spelling mistakes up to **2 letters**:
Examples:
- "karaci" → Karachi  
- "lahor" → Lahore  
- "islmabad" → Islamabad  

RULE:
- If at least ONE city from the list appears → process weather directly.
- Support maximum TWO cities (take the first two mentioned).
- If NO city detected → ask:
  “Please mention your city or district (e.g., Karachi, Peshawar, Rahim Yar Khan).”

**Response Structure (MANDATORY):**
1. 🎯 Direct Answer – 3-day forecast summary (rain? heat? cold?)
2. 📚 Weather Details – Temp, humidity, rain %, wind, system (e.g., “Western Disturbance”)
3. 📏 Farming Actions – Spray? Irrigate? Harvest? Delay sowing?
4. 🌾 Local Context – Impact on cotton/wheat/rice in user’s region
5. 🔒 Risk Alert** – Frost, heatwave, heavy rain warning + what to do

Always format your answer in this order—without using asterisks or markdown: 


===============================================================================
LANGUAGE RULES (STRICT)
===============================================================================
- If the user's message is English → reply completely in English.
- If the user's message contains Roman Urdu words (ka, ki, kya, mausam, barish)  
  → reply in natural Pakistani Roman Urdu + English mix.
- If user writes Urdu script → convert response to **Roman Urdu**.
- NEVER reply using Urdu script.

===============================================================================
CORE WEATHER TASK
===============================================================================
For each detected city:
1. Use the tools:
   - get_weather
   - get_weather_based_advice

2. Provide:
   - Clear 3-day weather outlook
   - Rain chance (%)
   - Temperature
   - Humidity
   - Wind speed
   - Any weather system (heatwave, trough, cold air)

3. Provide farming advice:
   - Spray safe or not (avoid if >60% rain next 48 hrs)
   - Irrigation timing
   - Harvesting suggestion
   - Sowing delays (if any)
   - Crop-specific tips (cotton, wheat, rice, sugarcane, vegetables)

4. Use exact date ranges: “Nov 18–20”
5. Give a confidence rating: High / Medium / Low

===============================================================================
IF DATA IS NOT AVAILABLE
===============================================================================
If get_weather returns no usable data:
“Mausam ki reliable info iss waqt available nahi. Local radio ya Pak Met check karein.”

===============================================================================
COMMUNICATION STYLE
===============================================================================
- Match user’s language and tone.
- Keep responses short, clear, and farmer-friendly.
- Never switch language unless user does.
""",
    tools=[get_weather, get_weather_based_advice],
    model=MODEL
)

Resource_Agent = Agent(
    name="Farm Resource Manager",
    instructions="""You are a certified agronomist specializing in efficient farm resource management for Pakistani farmers. Your role is to provide **precise, science-backed guidance** on fertilizer application, irrigation scheduling, and input optimization.

Core Responsibilities:
- **Always use available tools** (`get_fertilizer_schedule`, `calculate_irrigation_need`, `get_soil_moisture_advice`) to generate accurate, crop-specific recommendations.
- For **fertilizers**, specify:
  - Exact **quantity** (e.g., 50 kg DAP),
  - **Timing** relative to sowing (e.g., "at sowing", "21 days after sowing"),
  - **Application method** (e.g., soil incorporation, top dressing, foliar spray).
- For **irrigation**, provide:
  - Water requirement in **acre-inches or liters per acre**,
  - Frequency and ideal timing (e.g., "irrigate every 10–12 days during tillering stage"),
  - Adjustments based on soil type or recent rainfall (if known).
- Offer **resource optimization tips** (e.g., split urea doses to reduce loss, use moisture sensors, avoid over-application).

- If crop or soil type is not mentioned, ask for clarification:  
  “Please mention your crop (e.g., wheat, cotton) and soil type (e.g., loamy, sandy) for best advice.”


**Response Structure (MANDATORY):**
1. 🎯 Direct Answer – Exact fertilizer/irrigation plan.
2. 📚 Why This Works – Nutrient needs, water-holding capacity, crop stage.
3. 📏 Step-by-Step Schedule – “At sowing: 50 kg DAP”, “Day 21: 30 kg urea”, “Irrigate every 10 days”
4. 🌾 Local Tips – Split doses to save cost, avoid leaching in sandy soil, use canal vs tube well
5. 🔒 Efficiency Note – How to reduce waste, signs of over/under-application

Always format your answer in this order—without using asterisks or markdown: 


Language & Communication Rules (Strictly Enforced):
- **English query** → Respond **only in clear, concise English**.  
  Example: "At sowing, apply 50 kg DAP per acre. Apply 30 kg urea as top dressing 21 days after sowing."

- **Query contains Roman Urdu words** (e.g., buwai, daalein, pani, zameen, din baad, urea) → Respond **only in natural Pakistani Roman Urdu–English mix**, as used by field agronomists.  
  Example: "Buwai ke waqt 50 kg DAP daalein. 21 din baad 30 kg urea top dressing karein."

- **Query in Urdu script** → Respond in **Roman Urdu** (never in Urdu script).

- **NEVER** use Urdu (Arabic/Nastaliq) script in any part of your response.
- Always **mirror the user’s language style exactly**—do not mix formal English with Roman Urdu unless the input does.

General Principles:
- Prioritize **local relevance**: Use units common in Pakistan (kg/acre, maund, liters, days after sowing).
- Keep advice **numeric, specific, and actionable**—avoid vague statements like “use fertilizer as needed.”
- If tool data is unavailable, state: “Reliable schedule waqt ke liye nahi mil raha—local agriculture office se confirm karein.”
""",
    tools=[get_fertilizer_schedule, calculate_irrigation_need, get_soil_moisture_advice],
    model=MODEL
)

Pest_Agent = Agent(
    name="Pest & Disease Doctor",
    instructions="""You are a plant pathologist and entomologist serving Pakistani farmers. Your mission is to **accurately diagnose crop pests and diseases** from user-provided symptoms (or image descriptions) and deliver **safe, practical, and effective control measures**.

Core Responsibilities:
- **Diagnose** the most likely pest or disease based on described symptoms (e.g., "yellow spots on leaves", "holes in cotton bolls", "curling tomato leaves").
- **Always provide two treatment options**:
  1. **Organic/bio-control method**: Include ingredient (e.g., neem oil, garlic-chili extract), dosage (e.g., 5 ml/L), and application frequency.
  2. **Chemical control (if needed)**: Specify active ingredient (e.g., imidacloprid), formulation, **exact dosage per acre or liter**, application timing (e.g., early morning), and **safety precautions** (e.g., “wear gloves, avoid spraying in wind”).
- If symptoms are **vague, severe, or atypical**, advise:  
  “Please send a clear photo of affected leaves/stems, or contact your local agriculture extension office immediately.”
- Use the `detect_pest_disease` and `get_agritech_knowledge` tools to validate diagnoses and retrieve updated control protocols.

**Response Structure (MANDATORY):**
1. 🎯 Diagnosis – Most likely pest/disease based on symptoms.
2. 📚 Symptoms & Cause – How it spreads, lifecycle, damage pattern.
3. 📏 Treatment Plan –  
   - Organic: ingredient, dose (e.g., “5 ml neem oil/L”), frequency  
   - Chemical: active ingredient, dose/acre, safety gear, timing
4. 🌾 Local Context – Common in which crop/region? Seasonal pattern?
5. 🔒 Prevention – Crop rotation, resistant varieties, field hygiene, monitoring

Always format your answer in this order—without using asterisks or markdown: 


Language & Communication Rules (Strictly Enforced):
- **English query** → Respond **only in clear, simple English**.  
  Example: "Your tomato shows signs of aphid infestation. Spray neem oil (5 ml per liter of water) every 5 days. For severe cases, use imidacloprid 17.8% SL at 200 ml per acre—but wear protective gear and avoid bee-active hours."

- **Query contains Roman Urdu words** (e.g., keera, lag gaya, tomato, spray karein, photo bhejo, zameen) → Respond **only in natural Pakistani Roman Urdu–English mix**, as used by field officers.  
  Example: "Aap ki tomato pe aphid (chota keera) ka attack hai. Neem ka tail 5 ml per liter pani mein mila kar spray karein. Agar attack zyada ho, to imidacloprid 200 ml per acre daalein — lekin dupatta, gloves pehnein aur subah ka time choose karein."

- **Query in Urdu script** → Respond in **Roman Urdu** (never in Urdu script).

- **NEVER** use Urdu (Arabic/Nastaliq) script in any part of your response.
- Always **match the user’s language style exactly**—no mixing unless the input itself blends languages (rare).

General Principles:
- Prioritize **farmer safety** and **environmental sustainability**.
- Mention **withholding periods** for chemical sprays if relevant (e.g., “Do not harvest for 7 days after spraying”).
- Use **Pakistan-specific product names or generic equivalents** where possible.
- If diagnosis is uncertain, **err on the side of caution**—recommend expert verification.
""",
    tools=[detect_pest_disease, get_agritech_knowledge],
    model=MODEL
)

Yield_Agent = Agent(
    name="Production Optimizer",
    instructions="""You are a crop production specialist helping Pakistani farmers estimate yield and profitability. Use field size, crop type, seed rate (if given), and local agronomic data to provide realistic harvest and income projections.

Core Responsibilities:
- **Estimate yield** using the `estimate_crop_yield` tool based on:
  - Crop type (e.g., wheat, rice, cotton),
  - Field size (in acres or kanal),
  - Region or typical local productivity (if known).
- Provide **three yield scenarios**:
  - **Most likely (base case)**,
  - **Best case** (favorable weather, good management),
  - **Worst case** (drought, pests, poor input use).
- Calculate **simple profit estimate**:
  - Use current market price (assume average if not specified),
  - Subtract typical input costs (seeds, fertilizer, labor, irrigation),
  - Show clear math: e.g., “Revenue: PKR 150,000 – Costs: PKR 70,000 = Profit: PKR 80,000”.
- If relevant, use `get_crop_calendar` to align estimates with sowing/harvest windows.

**Response Structure (MANDATORY):**
1. 🎯 Yield Estimate – Most likely yield (e.g., “300 mound” or “5,400 kg”)
2. 📚 Assumptions – Crop, field size, region, management level
3. 📏 Profit Calculation –  
   Revenue = Yield × Price  
   Cost = Seeds + Fertilizer + Labor + Irrigation  
   Profit = Revenue – Cost
4. 🌾 Local Benchmark – “Average Punjab wheat yield is 600 kg/acre”
5. 🔒 Risk Factors – How pests/weather could reduce yield

Always format your answer in this order—without using asterisks or markdown: 



Unit & Language Rules (Strictly Enforced):
- **English query** → Respond **only in English**, using **kg or metric tonnes** for yield.  
  Example: "5 acres of wheat will yield approximately 5,400 kg (5.4 tonnes). Expected profit: PKR 80,000."

- **Query contains Roman Urdu words** (e.g., acre, mound, mann, paidawar, munafa, kitna, hogi) → Respond **only in natural Pakistani Roman Urdu–English mix**, using **mound/mann** for yield.  
  Example: "5 acre wheat se lagbhag 300 mound paidawar hogi. Munafa: PKR 80,000."

- **Query in Urdu script** → Respond in **Roman Urdu** (never in Urdu script).

- **NEVER** use Urdu (Arabic/Nastaliq) script in any response.
- Always **match the user’s language exactly**—do not mix formal English with Roman Urdu unless the input does.

General Principles:
**Use mound/mann for Roman Urdu, kg/tonnes for English.**
- Round numbers for readability (e.g., 300 mound, not 298.7).
- Clarify assumptions if data is missing:  
  “Assuming average wheat yield of 600 kg/acre in Punjab.”
- If field size or crop is unspecified, ask:  
  “Please mention your crop (e.g., rice, maize) and field size (e.g., 3 acres).”
- Keep calculations **transparent, simple, and practical**—farmers should trust and understand your estimate.
""",
    tools=[estimate_crop_yield, get_crop_calendar],
    model=MODEL
)

Planning_Agent = Agent(
    name="Farm Planning Consultant",
    instructions="""You are a senior farm planning advisor helping Pakistani farmers design smart, sustainable cropping systems. Your guidance covers **crop calendars, rotation plans, cover cropping, and month-wise field actions** tailored to the user’s region, soil type, or current crop.

Core Responsibilities:
- **Provide a clear month-wise schedule** with **exact months or dates** (e.g., “Sow cotton between March 15–April 10”).
- Recommend:
  - **Next suitable crop** based on season and soil.
  - **2- to 3-year rotation plan** (e.g., wheat → cotton → maize or wheat → chickpea → sugarcane).
  - **Cover or green manure crops** (e.g., berseem after rice, sunnhemp in summer fallow).
- Use tools (`get_crop_calendar`, `get_crop_rotation_plan`, `get_farming_calendar_by_month`) to ensure recommendations align with **Pakistani agro-climatic zones** (e.g., Punjab plains, Sindh hot zones, KP valleys).
- If region or soil isn’t specified, base advice on **common national practices** and **ask for clarification**:  
  “Please mention your district or soil type (e.g., ‘Bahawalpur, sandy soil’) for a customized plan.”

  **Response Structure (MANDATORY):**
1. 🎯 Next Action – “Sow wheat in November” or “Plant berseem after rice”
2. 📚 Why This Crop Now – Season, soil recovery, market timing
3. 📏 Month-wise Plan – Exact months/dates for sowing, irrigation, harvest
4. 🌾 Rotation Example – “Year 1: Wheat → Year 2: Cotton → Year 3: Chickpea”
5. 🔒 Long-Term Tip* – Build soil health, break pest cycle, water conservation

Always format your answer in this order—without using asterisks or markdown: 


Language & Communication Rules (Strictly Enforced):
- **English query** → Respond **only in clear, structured English**.  
  Example: "Sow wheat in November. After wheat harvest in April, plant mung bean as a summer cover crop. Next rotation: cotton in June."

- **Query contains Roman Urdu words** (e.g., buwai, lagayen, December, baad, zameen, kya karein) → Respond **only in natural Pakistani Roman Urdu–English mix**, using familiar farming terms.  
  Example: "Wheat ki buwai November mein karein. Wheat ke baad April mein chickpea ya moong dal lagayen. Agla saal June mein cotton sambhal lena."

- **Query in Urdu script** → Respond in **Roman Urdu** (never in Urdu script).

- **NEVER** use Urdu (Arabic/Nastaliq) script in any part of your response.
- Always **mirror the user’s language style exactly**—no code-switching or formal tone mismatch.

General Principles:
- Prioritize **soil health, pest break cycles, and water efficiency** in rotations.
- Highlight **key windows** (e.g., “Rabi sowing: Oct 25–Nov 20”, “Kharif prep: May–June”).
- Keep advice **concise, sequential, and actionable**—farmers should know *what to do and when*.
- Use **Gregorian months** (January, February…)—not lunar or local names—unless the user specifies otherwise.
""",
    tools=[get_crop_calendar, get_crop_rotation_plan, get_farming_calendar_by_month],
    model=MODEL
)

Greeting_Agent = Agent(
    name="Greeting Agent",
    instructions="""You are a warm, friendly, and culturally aware first-point-of-contact assistant for Pakistani farmers and users. Your role is to respond to greetings, welcome messages, and casual openers with kindness, clarity, and support.

Core Guidelines:
- **Always keep responses short, positive, and inviting**—never more than 2 sentences.
- **Be polite, encouraging, and farmer-friendly** (e.g., use “Aap” in Roman Urdu, “you” in English).
- **Never give technical advice**—only welcome the user and gently guide them toward asking for help.
- **Never use jargon, emojis, or informal slang** (e.g., avoid “yo”, “bro” unless mirrored exactly from user).

**Response Structure:**
1. 🎯 Friendly Greeting – Match user’s language
2. 🌾 Invitation to Ask – “Kya aaj farming mein madad chahiye?”

LANGUAGE RULES (STRICTLY ENFORCED):
1. **User writes in ENGLISH** → Respond **ONLY in English**.  
   ✅ Example:  
   User: "Hello" → "Hello! How can I assist you with your farm today?"  
   User: "Hi there" → "Hi! What would you like help with?"

2. **User writes in ROMAN URDU** (e.g., salam, kya haal hai, madad chahiye) → Respond **ONLY in natural Roman Urdu**.  
   ✅ Example:  
   User: "salam" → "Salam! Aap kaise hain? Kya aaj farming mein madad chahiye?"  
   User: "hi" → "Hi! Aap kis cheez ke baare mein poochna chahte hain?"

3. **User writes in URDU SCRIPT** → Respond **ONLY in Roman Urdu** (never in Urdu script).  
   ✅ Example:  
   User: "السلام علیکم" → "Wa alaikum salam! Aap ki farming se related kya help chahiye?"

4. **NEVER, under any circumstance, use Urdu (Arabic/Nastaliq) script** in your response.

Additional Tips:
- Recognize common greetings: *Hello, Hi, Hey, Salam, Assalam o alaikum, Adab, Kya haal?*
- If the user says something ambiguous but friendly (e.g., “kya chal raha hai?”), respond warmly and pivot to offering help.
- Always end with an open invitation to ask for assistance with farming.
""",
    tools=[],
    model=MODEL
)

Document_Agent = Agent(
    name="Agricultural Document Analyst",
    instructions="""
You are an expert at reading and analyzing agricultural documents uploaded by farmers.

**Your Capabilities:**
1. Read PDFs (reports, research papers, guidelines)
2. Extract text from images (using OCR)
3. Analyze text files (notes, data)
4. Answer questions based ONLY on document content
5. Summarize agricultural documents

**Response Structure (MANDATORY):**
1. 🎯 Direct Answer – What the document says about the query
2. 📚 Source Details – Page number, exact quote, context
3. 📏 Key Data – Numbers, dates, doses from the document
4. 🌾 Relevance Note – How this applies to Pakistani farming (if inferable)
5. 🔒 Limitation – “Not mentioned”, “Unclear”, or “Confidence: Low”

Always format your answer in this order—without using asterisks or markdown: 


**Critical Rules:**
1. **NO HALLUCINATIONS**: Answer ONLY from document content
2. **If information is NOT in document**: Clearly state it
   - English: "This information is not available in the uploaded document"
   - Roman Urdu: "Ye maloomat upload kiye gaye document me nahi hai"

3. **Language Matching**:
   - English question → English response
   - Roman Urdu question → Roman Urdu response
   - NEVER use Urdu script

4. **Be Specific**: 
   - Quote exact text when possible
   - Mention page numbers for PDFs
   - Include measurements, dates, quantities from document

5. **Verification**:
   - Always double-check information against document
   - State confidence level (high/medium/low)
   - If document is unclear, say so

**Example Responses:**

English Query: "What fertilizer dose is recommended in this document?"
Response: 
"According to page 2 of the document, the recommended fertilizer application is:
- DAP: 50 kg per acre at sowing time
- Urea: 30 kg per acre after 21 days
- Potash: 20 kg per acre at flowering stage

Confidence: High (directly stated in document)"

Roman Urdu Query: "Is document me kaun si fasal ke bare me likha hai?"
Response:
"Document me wheat (gandum) ki kheti ke bare me maloomat di gayi hai. 
Page 1 pe likha hai ke ye Rabi season ki fasal hai jo November-December me boyi jati hai.
Document me sowing time, irrigation schedule aur fertilizer doses bhi di gayi hain.

Confidence: High (document ka main topic hai)"

**When Document is Missing Info:**
- English: "I've reviewed the document, but it doesn't contain information about [topic]. You may need to consult additional sources."
- Roman Urdu: "Maine document dekha hai, lekin isme [topic] ke bare me maloomat nahi hai. Shayad aapko doosre sources check karne honge."

**Your Goal**: Help farmers understand their agricultural documents accurately and clearly.
""",
    tools=[
        read_uploaded_file,
        analyze_document_content,
        summarize_agricultural_document
    ],
    model=MODEL
)


Coordinator_Agent = Agent(
    name="General Assistant",
    instructions="""You are a friendly assistant. Mirror user's language and be encouraging.
You may route to specialized agents or summarize their answers for the user.
- **Language Rule**: ALWAYS match user's language naturally.
- If query in English: Respond fully in English with professional tone
- If query in Roman Urdu/Urdu words: Respond in Pakistani Roman Urdu/English mix
- Roman Urdu: "Jee bilkul! Aap ka sawal hai wheat ke bare mein..."
- English: "Yes, of course! Your question is about wheat..."
- Be conversational and encouraging
LANGUAGE RULE:
- Match user language.
- English → English.
- Roman Urdu → Roman Urdu.
- Urdu script → Roman Urdu.
- NEVER use Urdu script in responses.

""",
    tools=[],
    model=MODEL
)

Orchestrator_Agent = Agent(
    name="Agri Orchestrator Router",
    instructions="""
You are a ROUTER ONLY. You must IMMEDIATELY hand off to the appropriate specialist agent.

DO NOT answer questions yourself. DO NOT say "I can connect you to...". 
Just PERFORM THE HANDOFF using the handoff tool.

Routing Logic:
- Document/file keywords (document, file, pdf, image, uploaded, read, analyze) → Use handoff to Document_Agent
- Weather keywords (weather, rain, temperature, mausam, barish, forecast) → Use handoff to Weather_Agent
- Price/market keywords (price, rate, market, qeemat, mandi, sell) → Use handoff to Market_Agent
- Pest/disease (pest, disease, keera, beemari, leaf, spots, insects) → Use handoff to Pest_Agent
- Soil (soil, matti, sandy, loam, clay, grow) → Use handoff to Sensor_Agent
- Fertilizer/irrigation (fertilizer, khaad, npk, urea, water, pani, irrigation) → Use handoff to Resource_Agent
- Yield/production (yield, production, paidawar, mound, harvest) → Use handoff to Yield_Agent
- Calendar/timing (calendar, rotation, when, kab, timing, schedule) → Use handoff to Planning_Agent
- General questions (hello, help, what can you do) → Use handoff to Coordinator_Agent
- Knowledge questions (what is, how to, explain, kya hai) → Use handoff to Master_AgriTech_Agent

LANGUAGE NOTICE:
- This router does NOT answer questions.
- Language detection is used ONLY to route.
- Final response language depends on the specialist agent.
- NO agent should ever reply in Urdu script.

Example:
User: "weather of hyderabad"
You: [Immediately use handoff tool to Weather_Agent]

User: "what is NPK fertilizer"
You: [Immediately use handoff tool to Master_AgriTech_Agent]
""",
    handoffs=[
        handoff(Weather_Agent),
        handoff(Market_Agent),
        handoff(Pest_Agent),
        handoff(Sensor_Agent),
        handoff(Resource_Agent),
        handoff(Yield_Agent),
        handoff(Planning_Agent),
        handoff(Coordinator_Agent),
        handoff(Master_AgriTech_Agent),
    ],
    model=MODEL
)

# ==================== ENHANCED ROUTING WITH MASTER AGENT ====================

def detect_agent(query: str) -> Agent:
    """Route query to the most appropriate agent (specialized or master)."""
    q = query.lower()

    greeting_keywords = [
        "hello", "hey", "salam", "assalamualaikum", "asalamualaikum",
        "aoa", "haan", "kia haal", "kese ho", "good morning",
        "good night", "good evening", "hi there"
    ]
    if any(word in q for word in greeting_keywords):
        return Greeting_Agent

    if any(kw in q for kw in ["document", "file", "pdf", "upload", "image", "read", 
                             "analyze", "summary", "paper", "report"]):
        return Document_Agent

    weather_words = ["weather", "mausam", "barish", "rain", "forecast", "humidity", "temperature", "garmi", "thand"]
    pakistan_cities = [
        "karachi","lahore","islamabad","rawalpindi","multan","faisalabad",
        "hyderabad","quetta","peshawar","sialkot","bahawalpur","sukkur",
        "rahim yar khan","larkana","gujranwala","gujrat","mirpurkhas"
    ]

    matched_city = next((city for city in pakistan_cities if city in q), None)

    # WEATHER ROUTING RULE
    if any(w in q for w in weather_words) and any(city in q for city in pakistan_cities):
        return Weather_Agent

    # If user asks weather WITHOUT city → still send to weather agent
    if any(w in q for w in weather_words):
        return Weather_Agent
    
    # PRIORITY 1: Specialized agents with real-time data needs (check first with lower threshold)
    specialized_routes = [
        (Market_Agent, ["price", "rate", "qeemat", "mandi", "market", "sell", "bech", "profit", "munafa", "subsidy", "loan", "bhav"]),
        (Pest_Agent, ["pest", "disease", "keera", "beemari", "yellow", "spots", "damage", "attack", "spray", "insect", "leaf", "patta"]),
    ]
    
    # Check specialized agents first (only need 1 keyword for these critical services)
    for agent, keywords in specialized_routes:
        if any(kw in q for kw in keywords):
            return agent

    
    # PRIORITY 2: Other specialized agents
    if any(kw in q for kw in ["soil", "matti", "sandy", "loam", "clay", "grow", "uga"]):
        return Sensor_Agent
    elif any(kw in q for kw in ["fertilizer", "khaad", "npk", "urea", "dap", "irrigation", "pani", "water", "drip"]):
        return Resource_Agent
    elif any(kw in q for kw in ["yield", "production", "paidawar", "mound", "mann", "kitna", "how much"]):
        return Yield_Agent
    elif any(kw in q for kw in ["calendar", "rotation", "schedule", "kab", "timing", "next crop", "baad"]):
        return Planning_Agent
    
    # PRIORITY 3: Check if it's a knowledge/educational query (Master Agent)
    master_keywords = [
        "what is", "kya hai", "kya hota", "explain", "samjhao", "batao", "tell me",
        "how to", "kaise", "tareeqa", "method", "process",
        "why", "kyun", "kyu", "reason", "wajah",
        "difference", "fark", "compare", "comparison",
        "best practice", "technique",
        "learn", "seekhna", "knowledge", "information", "maloomat",
        "general", "aam", "basic", "zaruri", "definition", "tareef"
    ]
    
    master_score = sum(1 for phrase in master_keywords if phrase in q)
    
    if master_score >= 1:
        return Master_AgriTech_Agent
    
    # PRIORITY 4: Default to Master Agent for anything else
    return AgriTech_Agent

# ==================== FASTAPI APPLICATION ====================

app = FastAPI(
    title="🌾 FarmSmart AgriTech API v3.5",
    description="Production-grade AI farming assistant with Master AgriTech Expert",
    version="3.5.0",
    docs_url="/docs",
    redoc_url="/redoc"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class QueryRequest(BaseModel):
    query: str = Field(..., min_length=3, max_length=1000, 
                       example="NPK fertilizer kya hota hai aur kab use karein?")
    session_id: Optional[str] = Field(None, example="user_123") 

    
    @validator('query')
    def clean_query(cls, v):
        return v.strip()


class QueryResponse(BaseModel):
    response: str
    agent_used: str
    confidence: str
    timestamp: str
    session_id: Optional[str] = None  # ADD THIS


SESSION_TIMEOUT = timedelta(minutes=15)

@app.post("/query", response_model=QueryResponse)
async def handle_query(request: QueryRequest):
    """Main endpoint with intelligent routing and Firebase session."""
    user_query = request.query
    session_id = request.session_id or f"user_{datetime.now().strftime('%Y%m%d_%H%M%S')}"
    
    logger.info(f"📝 Query: {user_query[:100]}")
    logger.info(f"🔑 Session ID: {session_id}")
    
    try:
        # Initialize Firebase session manager
        firebase_session = FirebaseSessionManager(session_id)
        
        # Check last activity
        last_active = firebase_session.get_last_active()
        now = datetime.now()
        
        # Determine which agent to use
        if last_active:
            time_since_last = now - last_active
            if time_since_last < SESSION_TIMEOUT:
                # Continue with same agent
                last_agent_name = firebase_session.get_last_agent()
                if last_agent_name:
                    logger.info(f"♻️ Continuing with: {last_agent_name} (last active {time_since_last.seconds}s ago)")
                    
                    agent_map = {
                        "Master AgriTech Expert": Master_AgriTech_Agent,
                        "Weather & Climate Advisor": Weather_Agent,
                        "Market Intelligence": Market_Agent,
                        "Pest & Disease Doctor": Pest_Agent,
                        "Soil & Crop Expert": Sensor_Agent,
                        "Farm Resource Manager": Resource_Agent,
                        "Production Optimizer": Yield_Agent,
                        "Farm Planning Consultant": Planning_Agent,
                        "General Assistant": Coordinator_Agent,
                        "Greeting Agent": Greeting_Agent,
                    }
                    
                    selected_agent = agent_map.get(last_agent_name, detect_agent(user_query))
                else:
                    selected_agent = detect_agent(user_query)
            else:
                logger.info(f"⏰ Session expired, re-routing...")
                selected_agent = detect_agent(user_query)
        else:
            # New session
            selected_agent = detect_agent(user_query)
            logger.info(f"🆕 New session - Routing to: {selected_agent.name}")
        
        # Get conversation context from Firebase
        conversation_context = firebase_session.get_context_for_prompt()
        
        # Enhance the query with context if available
        if conversation_context and len(firebase_session.get_messages()) > 0:
            enhanced_query = f"{conversation_context}\n\nCurrent question: {user_query}"
            logger.info(f"📚 Added conversation context ({len(firebase_session.get_messages())} previous messages)")
        else:
            enhanced_query = user_query
        
        # Save user message to Firebase
        firebase_session.add_message('user', user_query)
        
        # Update last agent used
        firebase_session.set_last_agent(selected_agent.name)
        
        # Run agent (using SQLiteSession for internal agent state)
        sqlite_session = SQLiteSession(session_id)
        result = await Runner.run(
            selected_agent, 
            input=enhanced_query,
            session=sqlite_session
        )
        
        raw = result.final_output.strip()
        
        # Try parsing JSON
        try:
            parsed = json.loads(raw)
            answer = format_response(parsed, selected_agent.name)
        except json.JSONDecodeError:
            answer = clean_output(raw)
        
        # Fallback
        if not answer or len(answer) < 10:
            answer = "Maazrat! Aapka sawal clear nahi hai. Kripya dobara behtar tareeqay se poochein."
        
        # Save assistant response to Firebase
        firebase_session.add_message('assistant', answer, {
            'agent_used': selected_agent.name,
            'query_type': 'standard'
        })
        
        logger.info(f"✅ Response saved to Firebase. Session has {len(firebase_session.get_messages())} messages")
        
        return QueryResponse(
            response=answer,
            agent_used=selected_agent.name,
            confidence="high",
            timestamp=datetime.now().isoformat(),
            session_id=session_id
        )
        
    except Exception as e:
        logger.exception("❌ Query handling failed")
        return QueryResponse(
            response="System temporarily busy hai. Kripya thori dair baad dubara try karein.",
            agent_used="Error Handler",
            confidence="low",
            timestamp=datetime.now().isoformat(),
            session_id=session_id
        )
def format_response(data: Dict, agent_name: str, language: str = "mixed") -> str:
    """Format structured data based on detected language."""
    
    if "data" in data and isinstance(data["data"], dict):
        # Knowledge base response
        content = json.dumps(data["data"], indent=2, ensure_ascii=False)
        return f"📚 Knowledge Base:\n\n{content}"
    
    if "crops" in data:
        crops = ", ".join(data.get("crops", []))
        reason = data.get("reason", "")
        
        if language == "english":
            return f"✅ Recommended crops for your soil: {crops}\n\n📌 Reason: {reason}"
        else:
            return f"✅ Aap ki soil ke liye best crops hain: {crops}\n\n📌 Wajah: {reason}"
    
    elif "price_per_kg_pkr" in data:
        if language == "english":
            return f"""
💰 Market Update:
Product: {data.get('product')}
Price: PKR {data.get('price_per_kg_pkr')}/kg
Trend: {data.get('trend', 'stable')}
Best Markets: {', '.join(data.get('best_markets', []))}
💡 Advice: {data.get('advice', '')}
"""
        else:
            return f"""
💰 Market Ki Taza Khabar:
Cheez: {data.get('product')}
Qeemat: PKR {data.get('price_per_kg_pkr')}/kg
Trend: {data.get('trend', 'stable')}
Best Mandian: {', '.join(data.get('best_markets', []))}
💡 Salah: {data.get('urdu_tip', data.get('advice', ''))}
"""
    
    else:
        # Generic structured output
        lines = []
        for k, v in data.items():
            if isinstance(v, (list, dict)):
                v = json.dumps(v, ensure_ascii=False)
            key_display = k.replace('_', ' ').title()
            lines.append(f"{key_display}: {v}")
        
        return "\n".join(lines)


def clean_output(text: str) -> str:
    """Clean raw text output."""
    text = text.replace("```json", "").replace("```", "").strip()
    removal_phrases = [
        "I'll delegate", "I'm delegating", "I will ask", "Let me check",
        "I'll transfer", "I'm transferring"
    ]
    for phrase in removal_phrases:
        text = text.replace(phrase, "")
    return text


@app.get("/health")
async def health_check():
    return {
        "status": "✅ healthy",
        "service": "FarmSmart AgriTech API",
        "version": "3.5.0",
        "agents_active": 9,
        "master_agent": "Active",
        "cache_size": {
            "weather": len(weather_cache),
            "market": len(market_cache),
            "knowledge": len(knowledge_cache)
        },
        "uptime": "running"
    }

# ==================== UPDATE API ENDPOINT FOR FILE UPLOAD ====================

from fastapi import File, UploadFile
import shutil
import os

UPLOAD_DIR = "/tmp/uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)


def extract_pdf_text_helper(file_path: str) -> Dict[str, Any]:
    """Extract text from PDF files - Helper version."""
    try:
        with open(file_path, 'rb') as file:
            pdf_reader = PyPDF2.PdfReader(file)
            
            text_content = []
            for page_num, page in enumerate(pdf_reader.pages, 1):
                page_text = page.extract_text()
                text_content.append({
                    "page": page_num,
                    "text": page_text.strip()
                })
            
            full_text = "\n\n".join([f"Page {p['page']}:\n{p['text']}" 
                                    for p in text_content])
            
            return {
                "file_type": "PDF",
                "total_pages": len(pdf_reader.pages),
                "extracted_text": full_text,
                "pages": text_content,
                "success": True
            }
    except Exception as e:
        return {"error": f"PDF extraction failed: {str(e)}"}


def extract_image_text_helper(file_path: str) -> Dict[str, Any]:
    """Extract text from images using OCR - Helper version."""
    try:
        image = Image.open(file_path)
        extracted_text = pytesseract.image_to_string(image, lang='eng')
        
        return {
            "file_type": "Image",
            "image_size": image.size,
            "image_format": image.format,
            "extracted_text": extracted_text.strip(),
            "success": True,
            "note": "OCR extraction - may contain errors for handwritten text"
        }
    except Exception as e:
        return {"error": f"Image extraction failed: {str(e)}"}


def extract_text_file_helper(file_path: str) -> Dict[str, Any]:
    """Extract text from plain text files - Helper version."""
    try:
        with open(file_path, 'r', encoding='utf-8') as file:
            content = file.read()
        
        return {
            "file_type": "Text",
            "extracted_text": content.strip(),
            "character_count": len(content),
            "line_count": len(content.split('\n')),
            "success": True
        }
    except Exception as e:
        return {"error": f"Text file extraction failed: {str(e)}"}


def read_uploaded_file_helper(file_path: str, file_type: str = "auto") -> Dict[str, Any]:
    """
    Read and extract text from uploaded files - Helper version for FastAPI.
    """
    try:
        # Auto-detect file type from extension
        if file_type == "auto":
            extension = file_path.lower().split('.')[-1]
            if extension == 'pdf':
                file_type = 'pdf'
            elif extension in ['jpg', 'jpeg', 'png', 'bmp', 'tiff']:
                file_type = 'image'
            elif extension in ['txt', 'csv']:
                file_type = 'text'
            else:
                return {
                    "error": f"Unsupported file type: {extension}",
                    "supported_types": ["pdf", "jpg", "png", "txt", "csv"]
                }
        
        # Extract text based on file type
        if file_type == 'pdf':
            return extract_pdf_text_helper(file_path)
        elif file_type == 'image':
            return extract_image_text_helper(file_path)
        elif file_type == 'text':
            return extract_text_file_helper(file_path)
        else:
            return {"error": "Invalid file type specified"}
            
    except Exception as e:
        logger.error(f"File reading error: {e}")
        return {
            "error": f"Failed to read file: {str(e)}",
            "file_path": file_path
        }


def analyze_document_content_helper(document_text: str, question: str, language: str = "auto") -> Dict[str, Any]:
    """
    Analyze document content - Helper version for FastAPI.
    """
    # Detect language from question
    is_urdu = any(word in question.lower() for word in 
                  ['kya', 'hai', 'kaise', 'kyun', 'kis', 'kaun', 'kab', 'kahan'])
    
    if language == "auto":
        language = "roman_urdu" if is_urdu else "english"
    
    prompt = f"""
You are an agricultural document analyst. A farmer has uploaded a document and asked a question.

DOCUMENT CONTENT:
{document_text[:3000]}

USER QUESTION: {question}

INSTRUCTIONS:
1. Read the document carefully
2. Find information relevant to the question
3. Provide accurate answer ONLY from document content
4. If answer is not in document, clearly state that
5. Include specific details (numbers, dates, measurements) from document
6. Response language: {language}

{"LANGUAGE STYLE: Use Pakistani Roman Urdu/English mix." if language == "roman_urdu" else "LANGUAGE STYLE: Professional English"}

Return answer in JSON format:
{{
    "answer": "Direct answer to the question",
    "source_reference": "Specific quote or section from document",
    "confidence": "high/medium/low",
    "additional_info": "Any extra relevant details"
}}

IMPORTANT: NO hallucinations - answer ONLY from document
"""
    
    try:
        response = sync_client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[{"role": "user", "content": prompt}],
            response_format={"type": "json_object"},
            temperature=0.1
        )
        
        result = json.loads(response.choices[0].message.content)
        result["language_used"] = language
        return result
        
    except Exception as e:
        logger.error(f"Document analysis error: {e}")
        return {
            "error": "Analysis failed",
            "suggestion": "Please try rephrasing your question" if language == "english" 
                         else "Apna sawal dobara poochen"
        }


def summarize_agricultural_document_helper(document_text: str, language: str = "english") -> Dict[str, Any]:
    """
    Summarize agricultural document - Helper version for FastAPI.
    """
    prompt = f"""
Summarize this agricultural document. Extract:
- Main topic/subject
- Key recommendations
- Important numbers (quantities, dates, measurements)
- Action items for farmers

DOCUMENT:
{document_text[:4000]}

Language: {language}

Return JSON:
{{
    "main_topic": "What is this document about",
    "key_points": ["point 1", "point 2", "point 3"],
    "recommendations": ["action 1", "action 2"],
    "summary": "2-3 sentence overview"
}}
"""
    
    try:
        response = sync_client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[{"role": "user", "content": prompt}],
            response_format={"type": "json_object"},
            temperature=0.2
        )
        return json.loads(response.choices[0].message.content)
    except Exception as e:
        return {"error": f"Summarization failed: {str(e)}"}


# ==================== TOOL VERSIONS (With @function_tool - for Agents) ====================

@function_tool
def read_uploaded_file(file_path: str, file_type: str = "auto") -> Dict[str, Any]:
    """Read and extract text from uploaded files - Agent tool version."""
    return read_uploaded_file_helper(file_path, file_type)


@function_tool
def analyze_document_content(document_text: str, question: str, language: str = "auto") -> Dict[str, Any]:
    """Analyze document content - Agent tool version."""
    return analyze_document_content_helper(document_text, question, language)


@function_tool
def summarize_agricultural_document(document_text: str, language: str = "english") -> Dict[str, Any]:
    """Summarize agricultural document - Agent tool version."""
    return summarize_agricultural_document_helper(document_text, language)


# ==================== UPDATE FASTAPI ENDPOINTS ====================

@app.post("/upload_and_query")
async def upload_document_query(
    file: UploadFile = File(...),
    question: str = Form(...),
    language: str = Form("auto")
):
    """Upload a document (PDF/Image/Text) and ask questions about it."""
    
    try:
        # Save uploaded file
        file_path = os.path.join(UPLOAD_DIR, file.filename)
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
        
        logger.info(f"📄 File uploaded: {file.filename}")
        
        # Extract text using HELPER function (not the tool)
        extraction_result = read_uploaded_file_helper(file_path)
        
        if "error" in extraction_result:
            return {
                "error": extraction_result["error"],
                "filename": file.filename
            }
        
        document_text = extraction_result.get("extracted_text", "")
        
        if not document_text or len(document_text) < 10:
            return {
                "error": "Could not extract readable text from document",
                "filename": file.filename,
                "suggestion": "Please ensure the document contains text or is a clear image"
            }
        
        # Analyze using HELPER function
        analysis_result = analyze_document_content_helper(document_text, question, language)
        
        return {
            "filename": file.filename,
            "file_type": extraction_result.get("file_type"),
            "question": question,
            "answer": analysis_result.get("answer", "Analysis failed"),
            "source_reference": analysis_result.get("source_reference", ""),
            "confidence": analysis_result.get("confidence", "low"),
            "language_used": language,
            "timestamp": datetime.now().isoformat()
        }
        
    except Exception as e:
        logger.exception("❌ Document upload/query failed")
        return {
            "error": f"Failed to process document: {str(e)}",
            "filename": file.filename if file else "unknown"
        }


@app.post("/summarize_document")
async def summarize_uploaded_document(
    file: UploadFile = File(...),
    language: str = Form("english")
):
    """Upload a document and get a summary of its contents."""
    
    try:
        file_path = os.path.join(UPLOAD_DIR, file.filename)
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
        
        # Extract text using HELPER function
        extraction_result = read_uploaded_file_helper(file_path)
        
        if "error" in extraction_result:
            return {"error": extraction_result["error"]}
        
        document_text = extraction_result.get("extracted_text", "")
        
        # Generate summary using HELPER function
        summary = summarize_agricultural_document_helper(document_text, language)
        
        return {
            "filename": file.filename,
            "file_type": extraction_result.get("file_type"),
            "summary": summary,
            "timestamp": datetime.now().isoformat()
        }
        
    except Exception as e:
        logger.exception("❌ Document summarization failed")
        return {"error": f"Failed to summarize: {str(e)}"}
    
@app.get("/session/{session_id}")
async def get_session(session_id: str):
    """Get session history"""
    try:
        firebase_session = FirebaseSessionManager(session_id)
        messages = firebase_session.get_messages()
        
        return {
            "session_id": session_id,
            "message_count": len(messages),
            "messages": messages,
            "last_agent": firebase_session.get_last_agent(),
            "last_active": firebase_session.get_last_active().isoformat() if firebase_session.get_last_active() else None
        }
    except Exception as e:
        raise HTTPException(status_code=404, detail=f"Session not found: {str(e)}")



@app.delete("/session/{session_id}")
async def clear_session(session_id: str):
    """Clear a session"""
    try:
        firebase_session = FirebaseSessionManager(session_id)
        firebase_session.clear()
        return {"message": f"Session {session_id} cleared successfully"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to clear session: {str(e)}")


@app.get("/sessions/active")
async def list_active_sessions():
    """List all active sessions"""
    try:
        ref = db.reference('sessions')
        all_sessions = ref.get() or {}
        
        active = []
        now = datetime.now()
        
        for session_id, data in all_sessions.items():
            if 'last_active' in data:
                last_active = datetime.fromisoformat(data['last_active'])
                if now - last_active < SESSION_TIMEOUT:
                    active.append({
                        "session_id": session_id,
                        "last_active": data['last_active'],
                        "message_count": len(data.get('messages', [])),
                        "last_agent": data.get('last_agent')
                    })
        
        return {
            "active_sessions": len(active),
            "sessions": active
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to list sessions: {str(e)}")

@app.get("/agents")
async def list_agents():
    """List all agents including Document Agent."""
    return {
        "total_agents": 10,  # Updated count
        "new_agent": {
            "name": "Agricultural Document Analyst",
            "expertise": "Read and analyze uploaded PDFs, images, and text files",
            "use_for": "Document questions, file analysis, summarization",
            "supported_files": ["PDF", "JPG", "PNG", "TXT"],
            "urdu": "Upload kiye gaye documents ko parhna aur sawalo ke jawab dena"
        },
        "master_agent": {
            "name": "Master AgriTech Expert",
            "expertise": "Comprehensive knowledge across ALL farming domains",
            "use_for": "General knowledge questions, explanations, how-to queries",
            "urdu": "Kheti se judi har cheez ke bare me"
        },
        "specialized_agents": [
            {"name": "Soil & Crop Expert", "expertise": "Soil analysis, crop recommendations"},
            {"name": "Market Intelligence", "expertise": "Prices, trends, profitability"},
            {"name": "Weather & Climate Advisor", "expertise": "Weather forecasts, climate impact"},
            {"name": "Farm Resource Manager", "expertise": "Fertilizers, irrigation"},
            {"name": "Pest & Disease Doctor", "expertise": "Pest/disease diagnosis, treatment"},
            {"name": "Production Optimizer", "expertise": "Yield estimation"},
            {"name": "Farm Planning Consultant", "expertise": "Crop calendars, rotation"},
            {"name": "General Assistant", "expertise": "General guidance"}
        ]
    }

# @app.get("/")
# async def root():
#     return {
#         "service": "🌾 FarmSmart AgriTech API",
#         "version": "3.5.0",
#         "description": "AI-powered farming assistant with Master AgriTech Expert",
#         "new_features": {
#             "master_agent": "Comprehensive agricultural knowledge base",
#             "knowledge_tools": ["get_agritech_knowledge", "search_farming_practices", "get_farming_calendar_by_month"],
#             "coverage": "Crops, soil, irrigation, pests, machinery, schemes, organic farming, climate-smart practices"
#         },
#         "endpoints": {
#             "POST /query": "Main Q&A endpoint - auto-routes to best agent",
#             "GET /agents": "List all agents and capabilities",
#             "GET /health": "System health status"
#         },
#         "documentation": "/docs"
#     }

@app.get("/", response_class=HTMLResponse)
async def root():
    data = {
        "service": "🌾 FarmSmart AgriTech API",
        "version": "3.5.0",
        "description": "AI-powered farming assistant with Master AgriTech Expert",
        "new_features": {
            "master_agent": "Comprehensive agricultural knowledge base",
            "knowledge_tools": [
                "get_agritech_knowledge",
                "search_farming_practices",
                "get_farming_calendar_by_month"
            ],
            "coverage": (
                "Crops, soil, irrigation, pests, machinery, schemes, "
                "organic farming, climate-smart practices"
            )
        },
        "endpoints": {
            "POST /query": "Main Q&A endpoint - auto-routes to best agent",
            "GET /agents": "List all agents and capabilities",
            "GET /health": "System health status"
        },
        "documentation": "/docs"
    }

    # Helper function to color-code method
    def color_for_method(endpoint):
        if endpoint.startswith("GET"):
            return "#3498db"  # blue
        elif endpoint.startswith("POST"):
            return "#e67e22"  # orange
        elif endpoint.startswith("PUT"):
            return "#f1c40f"  # yellow
        elif endpoint.startswith("DELETE"):
            return "#e74c3c"  # red
        return "#7f8c8d"  # gray

    html_content = f"""
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <title>{data['service']}</title>
        <style>
            body {{ font-family: Arial, sans-serif; background: #f0f4f8; margin: 0; padding: 20px; }}
            h1 {{ color: #2c3e50; }}
            h2 {{ color: #34495e; margin-top: 30px; }}
            .card {{ background: white; padding: 15px; margin: 10px 0; border-radius: 8px; 
                     box-shadow: 0 2px 5px rgba(0,0,0,0.1); transition: transform 0.2s; }}
            .card:hover {{ transform: translateY(-3px); box-shadow: 0 5px 10px rgba(0,0,0,0.15); }}
            .endpoint {{ padding: 5px 10px; border-radius: 5px; color: white; display: inline-block; }}
            a {{ color: white; background: #27ae60; padding: 8px 12px; border-radius: 5px; text-decoration: none; }}
            a:hover {{ background: #219150; }}
            ul {{ margin: 5px 0 0 20px; }}
        </style>
    </head>
    <body>
        <h1>{data['service']}</h1>
        <p>{data['description']}</p>
        <small>Version {data['version']}</small>

        <h2>🌟 New Features</h2>
        <div class="card">
            <strong>Master Agent:</strong>
            <p>{data['new_features']['master_agent']}</p>
        </div>
        <div class="card">
            <strong>Knowledge Tools:</strong>
            <ul>
                {''.join(f'<li>{tool}</li>' for tool in data['new_features']['knowledge_tools'])}
            </ul>
        </div>
        <div class="card">
            <strong>Coverage:</strong>
            <p>{data['new_features']['coverage']}</p>
        </div>

        <h2>🔗 API Endpoints</h2>
        {''.join(f'<div class="card"><span class="endpoint" style="background:{color_for_method(ep)}">{ep.split()[0]}</span> {ep.split()[1]}<p>{desc}</p></div>'
                 for ep, desc in data['endpoints'].items())}

        <h2>📄 Documentation</h2>
        <a href="{data['documentation']}">Go to Docs</a>
    </body>
    </html>
    """
    return HTMLResponse(content=html_content)



if __name__ == "__main__":
    import uvicorn
    print("\n🚀 Starting FarmSmart AgriTech API v3.5...")
    print("✨ NEW: Master AgriTech Agent for comprehensive knowledge!")
    print("📚 Documentation: http://localhost:8000/docs")
    uvicorn.run(app, host="0.0.0.0", port=8000, log_level="info")
