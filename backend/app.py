from flask import Flask, request, jsonify
from flask_cors import CORS
import requests
import os
from datetime import datetime, timedelta
import json

app = Flask(__name__)
CORS(app)  # Enable CORS for all routes

# API Keys
GOOGLE_API_KEY = "AIzaSyB-sQiTRO3p05lnwcvUMEajFHoVGTZlq6U"
GOOGLE_MAPS_API_KEY = "AIzaSyAohLm4KLqxuo2Fhp7E07kM5kKZqwnF1VY"

# In-memory cache (in production, use Redis)
cache = {}
CACHE_DURATION = 300  # 5 minutes

def is_cache_valid(cache_key):
    if cache_key in cache:
        return (datetime.now() - cache['timestamp']).seconds < CACHE_DURATION
    return False

@app.route("/health", methods=["GET"])
def health_check():
    return jsonify({"status": "healthy", "timestamp": datetime.now().isoformat()})

@app.route("/aqi", methods=["POST"])
def get_aqi():
    """Get current AQI data for given coordinates"""
    data = request.get_json()
    latitude = data.get("latitude")
    longitude = data.get("longitude")
    
    if latitude is None or longitude is None:
        return jsonify({"error": "Missing latitude or longitude"}), 400
    
    # Check cache first
    cache_key = f"aqi_{latitude}_{longitude}"
    if is_cache_valid(cache_key):
        return jsonify(cache[cache_key]['data'])
    
    payload = {
        "universalAqi": True,
        "location": {
            "latitude": latitude,
            "longitude": longitude
        },
        "extraComputations": [
            "HEALTH_RECOMMENDATIONS",
            "DOMINANT_POLLUTANT_CONCENTRATION",
            "POLLUTANT_CONCENTRATION"
        ],
        "languageCode": "en"
    }
    
    try:
        response = requests.post(
            f"https://airquality.googleapis.com/v1/currentConditions:lookup?key={GOOGLE_API_KEY}",
            json=payload,
            timeout=10
        )
        response.raise_for_status()
        result = response.json()
        
        # Enhanced response with additional processing
        enhanced_result = {
            "success": True,
            "data": result,
            "processed": {
                "aqi": result.get("indexes", [{}])[0].get("aqi", 0),
                "category": get_aqi_category(result.get("indexes", [{}])[0].get("aqi", 0)),
                "dominant_pollutant": result.get("indexes", [{}])[0].get("dominantPollutant", "unknown"),
                "timestamp": datetime.now().isoformat(),
                "location": {"lat": latitude, "lng": longitude}
            }
        }
        
        # Cache the result
        cache[cache_key] = {
            "data": enhanced_result,
            "timestamp": datetime.now()
        }
        
        return jsonify(enhanced_result)
        
    except requests.exceptions.RequestException as e:
        return jsonify({"error": f"API request failed: {str(e)}"}), 500
    except Exception as e:
        return jsonify({"error": f"Unexpected error: {str(e)}"}), 500

@app.route("/forecast", methods=["POST"])
def get_forecast():
    """Get AQI forecast data"""
    data = request.get_json()
    latitude = data.get("latitude")
    longitude = data.get("longitude")
    days = data.get("days", 3)  # Default 3 days
    
    if latitude is None or longitude is None:
        return jsonify({"error": "Missing latitude or longitude"}), 400
    
    cache_key = f"forecast_{latitude}_{longitude}_{days}"
    if is_cache_valid(cache_key):
        return jsonify(cache[cache_key]['data'])
    
    payload = {
        "universalAqi": True,
        "location": {
            "latitude": latitude,
            "longitude": longitude
        },
        "period": {
            "startTime": datetime.now().isoformat(),
            "endTime": (datetime.now() + timedelta(days=days)).isoformat()
        },
        "languageCode": "en"
    }
    
    try:
        response = requests.post(
            f"https://airquality.googleapis.com/v1/forecast:lookup?key={GOOGLE_API_KEY}",
            json=payload,
            timeout=10
        )
        response.raise_for_status()
        result = response.json()
        
        # Process forecast data
        processed_forecast = []
        if "hourlyForecasts" in result:
            for forecast in result["hourlyForecasts"][:24]:  # Limit to 24 hours
                aqi = forecast.get("indexes", [{}])[0].get("aqi", 0)
                processed_forecast.append({
                    "datetime": forecast.get("dateTime"),
                    "aqi": aqi,
                    "category": get_aqi_category(aqi),
                    "dominant_pollutant": forecast.get("indexes", [{}])[0].get("dominantPollutant", "unknown")
                })
        
        enhanced_result = {
            "success": True,
            "data": result,
            "processed": {
                "forecasts": processed_forecast,
                "summary": {
                    "avg_aqi": sum(f["aqi"] for f in processed_forecast) / len(processed_forecast) if processed_forecast else 0,
                    "max_aqi": max(f["aqi"] for f in processed_forecast) if processed_forecast else 0,
                    "min_aqi": min(f["aqi"] for f in processed_forecast) if processed_forecast else 0
                }
            }
        }
        
        cache[cache_key] = {
            "data": enhanced_result,
            "timestamp": datetime.now()
        }
        
        return jsonify(enhanced_result)
        
    except requests.exceptions.RequestException as e:
        # Return mock data if API fails
        mock_forecast = generate_mock_forecast(latitude, longitude, days)
        return jsonify(mock_forecast)

@app.route("/geocode", methods=["POST"])
def geocode_location():
    """Geocode address to coordinates"""
    data = request.get_json()
    address = data.get("address")
    
    if not address:
        return jsonify({"error": "Missing address"}), 400
    
    try:
        response = requests.get(
            f"https://maps.googleapis.com/maps/api/geocode/json",
            params={
                "address": address,
                "key": GOOGLE_MAPS_API_KEY
            },
            timeout=10
        )
        response.raise_for_status()
        result = response.json()
        
        if result["results"]:
            location = result["results"][0]["geometry"]["location"]
            return jsonify({
                "success": True,
                "latitude": location["lat"],
                "longitude": location["lng"],
                "formatted_address": result["results"][0]["formatted_address"]
            })
        else:
            return jsonify({"error": "Location not found"}), 404
            
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route("/reverse-geocode", methods=["POST"])
def reverse_geocode():
    """Get address from coordinates"""
    data = request.get_json()
    latitude = data.get("latitude")
    longitude = data.get("longitude")
    
    if latitude is None or longitude is None:
        return jsonify({"error": "Missing coordinates"}), 400
    
    try:
        response = requests.get(
            f"https://maps.googleapis.com/maps/api/geocode/json",
            params={
                "latlng": f"{latitude},{longitude}",
                "key": GOOGLE_MAPS_API_KEY
            },
            timeout=10
        )
        response.raise_for_status()
        result = response.json()
        
        if result["results"]:
            address_components = result["results"][0]["address_components"]
            city = next((comp["long_name"] for comp in address_components 
                        if "locality" in comp["types"] or "administrative_area_level_2" in comp["types"]), 
                       "Unknown City")
            
            return jsonify({
                "success": True,
                "city": city,
                "formatted_address": result["results"][0]["formatted_address"],
                "address_components": address_components
            })
        else:
            return jsonify({"error": "Address not found"}), 404
            
    except Exception as e:
        return jsonify({"error": str(e)}), 500

def get_aqi_category(aqi):
    """Get AQI category and color"""
    if aqi <= 50:
        return {"label": "Good", "color": "#00E400", "level": 1}
    elif aqi <= 100:
        return {"label": "Moderate", "color": "#FFFF00", "level": 2}
    elif aqi <= 150:
        return {"label": "Unhealthy for Sensitive Groups", "color": "#FF7E00", "level": 3}
    elif aqi <= 200:
        return {"label": "Unhealthy", "color": "#FF0000", "level": 4}
    elif aqi <= 300:
        return {"label": "Very Unhealthy", "color": "#8F3F97", "level": 5}
    else:
        return {"label": "Hazardous", "color": "#7E0023", "level": 6}

def generate_mock_forecast(lat, lng, days):
    """Generate mock forecast data when API fails"""
    forecasts = []
    base_aqi = 85  # Base AQI around moderate
    
    for i in range(days * 8):  # 8 forecasts per day (3-hour intervals)
        # Add some realistic variation
        variation = (-20 + (i % 5) * 10) + (i % 3 - 1) * 5
        aqi = max(30, min(200, base_aqi + variation))
        
        forecast_time = datetime.now() + timedelta(hours=i * 3)
        forecasts.append({
            "datetime": forecast_time.isoformat(),
            "aqi": aqi,
            "category": get_aqi_category(aqi),
            "dominant_pollutant": "pm25"
        })
    
    return {
        "success": True,
        "data": {"hourlyForecasts": forecasts},
        "processed": {
            "forecasts": forecasts,
            "summary": {
                "avg_aqi": sum(f["aqi"] for f in forecasts) / len(forecasts),
                "max_aqi": max(f["aqi"] for f in forecasts),
                "min_aqi": min(f["aqi"] for f in forecasts)
            }
        },
        "note": "Using mock data due to API unavailability"
    }

if __name__ == "__main__":
    app.run(debug=True, host="0.0.0.0", port=5000)