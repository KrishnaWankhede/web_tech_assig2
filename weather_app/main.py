from flask import Flask, request, jsonify
from flask_cors import CORS
import requests

app = Flask(__name__)
CORS(app,resources={r"/get_weather/*": {"origins": "*"}})


# Replace with your actual keys
TOMORROW_API_KEY = 'ooZU1Z91HqOzkSVLvcbyup6f6QXvOZlu'
GOOGLE_API_KEY = 'AIzaSyBOBwMZ_B-p0GTKWVXhp4TzCr9i1ULj48I'
IPINFO_TOKEN = '1811f02070c9a1'

def get_lat_lon_from_google(address):
    """Fetches latitude and longitude from Google Geocoding API."""
    url = f"https://maps.googleapis.com/maps/api/geocode/json?address={address}&key={GOOGLE_API_KEY}"
    print("url", url)
    response = requests.get(url)
    print("response", response)
    data = response.json()
    if data['results']:
        location = data['results'][0]['geometry']['location']
        # print("location", location)
        return location['lat'], location['lng']
    return None, None

def fetch_weather_data(lat, lon, timestep='1d'):
    """Fetches weather data from Tomorrow.io API."""
    url = "https://api.tomorrow.io/v4/timelines"
    params = { 
        "location": f"{lat},{lon}",
        "fields": "temperatureMin,temperatureMax,weatherCode,windSpeed,humidity,pressureSeaLevel,visibility,uvIndex,sunriseTime,sunsetTime,moonPhase,cloudCover",
        "timesteps": timestep,
        "units": "imperial",
        "apikey": TOMORROW_API_KEY
    }
    try:
        response = requests.get(url, params=params)
        response.raise_for_status()  # Will raise an HTTPError if the HTTP request returned an unsuccessful status code
        return response.json()
    except requests.exceptions.RequestException as e:
        print(f"Error fetching weather data: {e}")
        return {"error": "Could not fetch weather data."}
    
@app.route('/get_weather', methods=['GET'])
def get_weather():
    lat = request.args.get('lat')
    lon = request.args.get('lon')

    if not lat or not lon:
        street = request.args.get('street', '')
        city = request.args.get('city', '')
        state = request.args.get('state', '')
        address = ', '.join(filter(None, [street, city, state]))
        lat, lon = get_lat_lon_from_google(address)

    if not lat or not lon:
        return jsonify({"error": "Could not determine location with provided data."}), 400

    daily_weather = fetch_weather_data(lat, lon, '1d')
    hourly_weather = fetch_weather_data(lat, lon, '1h')

    return jsonify({
        "daily": daily_weather,
        "hourly": hourly_weather
    })

    # street = request.args.get('street', '')
    # city = request.args.get('city', '')
    # state = request.args.get('state', '')
    # lat = request.args.get('lat')
    # lon = request.args.get('lon')
    
    # # Determine if latitude and longitude are provided
    # if lat and lon:
    #     # Fetch weather data using latitude and longitude
    #     weather_data = fetch_weather_data(lat, lon, '1d')
    # else:
    #     address = ', '.join(filter(None, [street, city, state]))
    #     lat, lon = get_lat_lon_from_google(address)
    #     if not lat or not lon:
    #         return jsonify({"error": "Could not determine location with provided data."}), 400
    #     weather_data = fetch_weather_data(lat, lon, '1d')
        
    return jsonify(weather_data)
def get_full_address(street, city, state):
    """Fetches full address details, including the postal code, from Google Geocoding API."""
    # Properly format the full address for the API request
    address = f"{street}, {city}, {state}"
    url = f"https://maps.googleapis.com/maps/api/geocode/json?address={address}&key={GOOGLE_API_KEY}"
    response = requests.get(url)
    data = response.json()
    
    if 'results' in data and data['results']:
        # Extract formatted address, postal code, and location details
        formatted_address = data['results'][0]['formatted_address']
        location = data['results'][0]['geometry']['location']
        
        # Attempt to get the postal code from the address components
        postal_code = None
        for component in data['results'][0]['address_components']:
            if 'postal_code' in component['types']:
                postal_code = component['long_name']
                break
        
        # Include postal code in the formatted address if available
        if postal_code:
            formatted_address = f"{formatted_address}, {postal_code}"
            
        return formatted_address, location['lat'], location['lng']
    
    return None, None, None  # Return None if no results found

@app.route('/', methods=['GET'])
def get_index():
    return app.send_static_file('index.html')

if __name__ == '__main__':
    app.run(host='127.0.0.1', port=8080, debug=True)
