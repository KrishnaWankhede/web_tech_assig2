

// document.getElementById('weather-form').addEventListener('submit', function (e) {
//     e.preventDefault();
//     document.getElementsByClassName("weather-details")[0].style.display = "none"; // Hide the weather details

//     const useAutoDetect = document.getElementById('auto-detect').checked;
//     const street = document.getElementById('street').value;
//     const city = document.getElementById('city').value;
//     const state = document.getElementById('state').value;

//     if (useAutoDetect) {
//         fetch("https://ipinfo.io/json?token=1811f02070c9a1")
//             .then(response => response.json())
//             .then(data => {
//                 const [lat, lon] = data.loc.split(',');
//                 console.log("Auto-detected lat/lon:", lat, lon);
//                 fetchWeatherDataByLatLon(lat,lon) ;
//             })
//             .catch(err => console.error("Error fetching location:", err));
//     } else {
//         fetchWeatherData(street, city, state)
//             .then(data => {
//                 console.log("Full API Response:", data); // Check the entire response
//                 if (data && data.data && data.data.location) {
//                     const locationData = data.data.location;
//                     console.log("Location Data:", locationData); // Log lat and lon if available
//                     return locationData;
//                 } else {
//                     console.error("Location data is missing in the API response.");
//                     throw new Error("Location data is missing");
//                 }
//             })
//             .then(locationData => {
//                 if (locationData) {
//                     fetchWeatherDataByLatLon(location.lat,location.lon);
//                 }
//             })
//             .catch(err => console.error("Error fetching weather data:", err));
//     }
// });
document.getElementById('weather-form').addEventListener('submit', function (e) {
    e.preventDefault();
    document.getElementsByClassName("weather-details")[0].style.display = "none"; // Hide the weather details
    
    const useAutoDetect = document.getElementById('auto-detect').checked;
    const street = document.getElementById('street').value;
    const city = document.getElementById('city').value;
    const state = document.getElementById('state').value;

    if (useAutoDetect) {
        console.log("Using auto-detect to get user's current location.");
        // Fetching using auto-detected location
        fetch("https://ipinfo.io/json?token=1811f02070c9a1")
            .then(response => response.json())
            .then(data => {
                const [lat, lon] = data.loc.split(',');
                console.log("Auto-detected lat/lon:", lat, lon);
                fetchWeatherDataByLatLon(lat, lon, `${data.city}, ${data.region}`);
            })
            .catch(err => console.error("Error fetching location:", err));
    } else {
        console.log("Using provided address to get lat/lon.");
        // Get latitude and longitude for the given address and then fetch the weather
        getLatLonFromAddress(street, city, state)
            .then(({ lat, lon, formattedAddress }) => {
                console.log(`Geocoded address: Lat: ${lat}, Lon: ${lon}, Formatted Address: ${formattedAddress}`);
                return fetchWeatherDataByLatLon(lat, lon, formattedAddress);
            })
            .catch(err => console.error("Error in geocoding or fetching weather data:", err));
    }
});
document.getElementById('auto-detect').addEventListener('change', function () {
    toggleFields(this.checked);
});
document.getElementById('auto-detect').addEventListener('change', function () {
    const streetInput = document.getElementById('street');
    const cityInput = document.getElementById('city');
    const stateInput = document.getElementById('state');
    
    if (this.checked) {
        // Disable manual input fields when auto-detect is checked
        streetInput.disabled = true;
        cityInput.disabled = true;
        stateInput.disabled = true;
        // Clear input fields
        streetInput.value = '';
        cityInput.value = '';
        stateInput.value = '';
    } else {
        // Enable manual input fields when auto-detect is unchecked
        streetInput.disabled = false;
        cityInput.disabled = false;
        stateInput.disabled = false;
    }
});

function fetchWeatherData(street, city, state) {
    return fetch(`http://127.0.0.1:5000/get_weather?street=${encodeURIComponent(street)}&city=${encodeURIComponent(city)}&state=${encodeURIComponent(state)}`)
        .then(response => response.json())
        .then(data => {
            if (data.error) {
                alert(data.error);
                return;
            }

            const forecastData = data.data.timelines[0].intervals;
            const todayData = forecastData[0].values;

            // Check if data exists, then display
            if (forecastData && todayData) {
                displayWeatherData({
                    temperature: todayData.temperatureMax || 'N/A',
                    humidity: todayData.humidity || 'N/A',
                    pressure: todayData.pressureSeaLevel || 'N/A',
                    windSpeed: todayData.windSpeed || 'N/A',
                    visibility: todayData.visibility || 'N/A',
                    cloudCover: todayData.cloudCover || 'N/A',
                    uvIndex: todayData.uvIndex || 'N/A',
                    location: data.formatted_address || `${city}, ${state}`,
                    condition: mapWeatherCodeToCondition(todayData.weatherCode),
                    weatherCode: todayData.weatherCode 
                });
                displayForecastTable(forecastData); 
                document.getElementById('weather-body').style.display = 'block';
                document.getElementById('weather-forecastable').style.display = 'block';
            }
        })
        .catch(error => console.error("Error fetching weather data:", error));
}

// 
// Usage example in your main code
function displayWeatherData(data) {
    console.log("Data passed to displayWeatherData:", data); // Log data structure

    const weatherBody = document.getElementById("weather-body");
    if (weatherBody) {
        const weatherDetails = getWeatherDetails(data.weatherCode);

        weatherBody.style.display = "block";
        document.getElementById("location-heading").textContent = `Location: ${data.location || 'N/A'}`;
        document.getElementById("temp").textContent = `${data.temperature || 'N/A'}°`;
        document.getElementById("condition").textContent = weatherDetails.condition;
        document.getElementById("humidity").textContent = `${data.humidity || '--'} %`;
        document.getElementById("pressure").textContent = `${data.pressure || '--'} inHg`;
        document.getElementById("wind-speed").textContent = `${data.windSpeed || '--'} mph`;
        document.getElementById("visibility").textContent = `${data.visibility || '--'} mi`;
        document.getElementById("cloud-cover").textContent = `${data.cloudCover || '--'} %`;
        document.getElementById("uv-index").textContent = `${data.uvIndex || '--'}`;

        // Set the weather icon based on the weather code
        const weatherIcon = document.getElementById("weather-icon");
        if (weatherIcon) {
            weatherIcon.src = weatherDetails.icon; // Use icon from getWeatherDetails function
        }
    } else {
        console.error("Element with ID 'weather-body' not found.");
    }
}
function getLatLonFromAddress(street, city, state) {
    const address = `${street}, ${city}, ${state}`;
    const apiKey = 'AIzaSyBOBwMZ_B-p0GTKWVXhp4TzCr9i1ULj48I';
    const geocodeUrl = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address)}&key=${apiKey}`;

    console.log("Sending request to Google Geocoding API with address:", address);

    return fetch(geocodeUrl)
        .then(response => response.json())
        .then(data => {
            console.log("Received response from Google Geocoding API:", data);

            if (data.status === "OK" && data.results.length > 0) {
                const location = data.results[0].geometry.location;
                console.log("Extracted latitude and longitude:", location);
                return {
                    lat: location.lat,
                    lon: location.lng,
                    formattedAddress: data.results[0].formatted_address // Include the formatted address
                };
            } else {
                console.error("Unable to get latitude and longitude for the provided address.");
                throw new Error("Unable to get latitude and longitude for the provided address.");
            }
        })
        .catch(error => {
            console.error("Error fetching latitude and longitude:", error);
            throw error; // Re-throw the error to be caught by the caller
        });
}


// Function to fetch weather data using latitude and longitude
function fetchWeatherDataByLatLon(lat, lon, formattedAddress) {
    console.log("Fetching weather data for coordinates:", { lat, lon });

    return fetch(`http://127.0.0.1:5000/get_weather?lat=${encodeURIComponent(lat)}&lon=${encodeURIComponent(lon)}`)
        .then(response => response.json())
        .then(data => {
            console.log("Received response from weather API:", data);

            if (data.error) {
                alert(data.error);
                return;
            }

            const forecastData = data.data.timelines[0].intervals;

            if (!forecastData || forecastData.length === 0) {
                console.error("No forecast data available");
                return;
            }

            // Assign dailyData properly here
            const dailyData = forecastData; // Assuming `forecastData` contains daily data for next days
            // console.log("Today's weather data:", dailyData[0].values);
            // Logging the data to confirm
            console.log("Forecast data for next days:", dailyData[0]);
            // console.log("Today's weather data:", dailyData[0].values);
            // console.log("Forecast data for next days:", dailyData);

            const todayData = forecastData[0].values;

            // Check if data exists, then display
            if (forecastData && todayData) {
                console.log("Preparing to display weather data...");
                displayWeatherData({
                    temperature: todayData.temperatureMax || 'N/A',
                    humidity: todayData.humidity || 'N/A',
                    pressure: todayData.pressureSeaLevel || 'N/A',
                    windSpeed: todayData.windSpeed || 'N/A',
                    visibility: todayData.visibility || 'N/A',
                    cloudCover: todayData.cloudCover || 'N/A',
                    uvIndex: todayData.uvIndex || 'N/A',
                    location: formattedAddress || `${lat}, ${lon}`, // Prefer formatted address if available
                    condition: mapWeatherCodeToCondition(todayData.weatherCode),
                    weatherCode: todayData.weatherCode 
                });
                displayForecastTable(forecastData); 
                document.getElementById('weather-body').style.display = 'block';
                document.getElementById('weather-forecastable').style.display = 'block';
                renderCharts(dailyData, hourlyData);

                // Set up arrow toggle functionality for charts
                setupToggleForCharts();
            }
        })
        .catch(error => console.error("Error fetching weather data:", error));
}

document.querySelectorAll('.weather-cell').forEach(cell => {
    cell.addEventListener('click', function () {
        const date = this.getAttribute('data-date');
        const dayData = getWeatherDataForDate(date); // Function to retrieve data for the selected date
        displayDailyWeatherDetails(dayData);
    });
});

function setupToggleForCharts() {
    const toggleArrow = document.getElementById('toggle-arrow');
    toggleArrow.addEventListener('click', function () {
        const chartsContainer = document.getElementById('weather-charts');
        if (chartsContainer.style.display === 'block') {
            chartsContainer.style.display = 'none';
        } else {
            chartsContainer.style.display = 'block';
            renderCharts(window.temperatureRangeData, window.hourlyWeatherData);
        }
    });
}

function renderCharts(dailyData, hourlyData) {
    renderTempRangeChart(dailyData);
    renderHourlyWeatherChart(hourlyData);
}

function renderTempRangeChart(dailyData) {
    const categories = dailyData.map(data => new Date(data.startTime).toLocaleDateString("en-US"));
    const temperatureRanges = dailyData.map(data => [data.values.temperatureMin, data.values.temperatureMax]);

    Highcharts.chart('temp-range-container', {
        chart: {
            type: 'arearange'
        },
        title: {
            text: 'Temperature Ranges (Min, Max)'
        },
        xAxis: {
            categories: dailyData.map(data => new Date(data.startTime).toLocaleDateString())
        },
        yAxis: {
            title: {
                text: 'Temperature (°F)'
            }
        },
        tooltip: {
            crosshairs: true,
            shared: true,
            valueSuffix: '°F'
        },
        series: [{
            name: 'Temperature Range',
            data: dailyData.map(data => [data.startTime, data.values.temperatureMin, data.values.temperatureMax]),
            color: {
                linearGradient: {
                    x1: 0, y1: 0, x2: 0, y2: 1
                },
                stops: [
                    [0, '#FFA07A'],
                    [1, '#4682B4']
                ]
            },
            marker: {
                enabled: true,
                radius: 5
            }
        }]
    });
}

function renderHourlyWeatherChart(hourlyData) {
    Highcharts.chart('hourly-weather-container', {
        chart: {
            type: 'spline',
            zoomType: 'x'
        },
        title: {
            text: 'Hourly Weather (For Next 5 Days)'
        },
        xAxis: {
            type: 'datetime',
            tickInterval: 3600 * 1000 * 6, // every 6 hours
            labels: {
                format: '{value:%a %H:%M}'
            }
        },
        yAxis: [{
            title: {
                text: 'Temperature (°F)'
            },
            opposite: false
        }, {
            title: {
                text: 'Wind Speed (mph)'
            },
            opposite: true
        }, {
            title: {
                text: 'Precipitation (%)'
            },
            opposite: true
        }],
        tooltip: {
            shared: true,
            crosshairs: true
        },
        series: [
            {
                name: 'Temperature',
                data: hourlyData.map(data => [new Date(data.startTime).getTime(), data.values.temperature]),
                yAxis: 0,
                type: 'spline',
                color: '#FF3333',
                tooltip: {
                    valueSuffix: '°F'
                }
            },
            {
                name: 'Precipitation Probability',
                data: hourlyData.map(data => [new Date(data.startTime).getTime(), data.values.precipitationProbability]),
                type: 'column',
                yAxis: 2,
                color: '#68CFE8',
                tooltip: {
                    valueSuffix: '%'
                }
            },
            {
                name: 'Wind Speed',
                data: hourlyData.map(data => [new Date(data.startTime).getTime(), data.values.windSpeed]),
                type: 'windbarb',
                yAxis: 1,
                tooltip: {
                    valueSuffix: ' mph'
                },
                vectorLength: 20
            }
        ]
    });
}



function displayDailyWeatherDetails(data) {
    document.getElementById('date').textContent = formatDate(data.startTime);
    document.getElementById('condition').textContent = mapWeatherCodeToCondition(data.weatherCode);
    document.getElementById('temperature').textContent = ` ${data.temperatureMin}°F / ${data.temperatureMax}°F`;
    document.getElementById('weather-icon').src = getWeatherIconSrc(data.weatherCode);
    document.getElementById('precipitation').textContent = data.precipitation || 'N/A';
    document.getElementById('chance-of-rain').textContent = data.chanceOfRain || 'N/A';
    document.getElementById('wind-speed').textContent = `${data.windSpeed} mph`;
    document.getElementById('humidity').textContent = `${data.humidity}%`;
    document.getElementById('visibility').textContent = `${data.visibility} mi`;
    document.getElementById('sunrise-sunset').textContent = `${data.sunrise} / ${data.sunset}`;
    document.querySelector('.weather-details').style.display = 'block';
}
console.log('precipitationData:', data.precipitation);


function renderCharts(dailyData, hourlyData) {
    renderTempRangeChart(dailyData);
    renderHourlyWeatherChart(hourlyData);
}


function formatDate(dateString) {
    const options = { weekday: 'long', year: 'numeric', month: 'short', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
}


function toggleFields(isAutoDetect) {
    const streetInput = document.getElementById('street');
    const cityInput = document.getElementById('city');
    const stateInput = document.getElementById('state');
    
    streetInput.disabled = isAutoDetect;
    cityInput.disabled = isAutoDetect;
    stateInput.disabled = isAutoDetect;
    
    if (isAutoDetect) {
        streetInput.value = '';
        cityInput.value = '';
        stateInput.value = '';
    }
}


// Adding an event listener for the button
document.getElementById('toggle-arrow').addEventListener('click', toggleCharts);

function showCharts() {
    document.getElementById('weather-charts').style.display = 'block';
    renderTempRangeChart(temperatureRangeData);
    renderHourlyWeatherChart(hourlyWeatherData);
}

function getWeatherDetails(weatherCode) {
    // Define mapping for conditions and icons
    const weatherData = {
        "0": { condition: "Unknown", icon: "/static/Images/Weather Symbols for Weather Codes/default_icon.svg" },
        "1000": { condition: "Clear, Sunny", icon: "/static/Images/Weather Symbols for Weather Codes/clear_day.svg" },
        "1100": { condition: "Mostly Clear", icon: "/static/Images/Weather Symbols for Weather Codes/mostly_clear_day.svg" },
        "1101": { condition: "Partly Cloudy", icon: "/static/Images/Weather Symbols for Weather Codes/partly_cloudy_day.svg" },
        "1102": { condition: "Mostly Cloudy", icon: "/static/Images/Weather Symbols for Weather Codes/mostly_cloudy.svg" },
        "1001": { condition: "Cloudy", icon: "/static/Images/Weather Symbols for Weather Codes/cloudy.svg" },
        "2000": { condition: "Fog", icon: "/static/Images/Weather Symbols for Weather Codes/fog.svg" },
        "2100": { condition: "Light Fog", icon: "/static/Images/Weather Symbols for Weather Codes/fog_light.svg" },
        "4000": { condition: "Drizzle", icon: "/static/Images/Weather Symbols for Weather Codes/drizzle.svg" },
        "4001": { condition: "Rain", icon: "/static/Images/Weather Symbols for Weather Codes/rain.svg" },
        "4200": { condition: "Light Rain", icon: "/static/Images/Weather Symbols for Weather Codes/rain_light.svg" },
        "4201": { condition: "Heavy Rain", icon: "/static/Images/Weather Symbols for Weather Codes/rain_heavy.svg" },
        "5000": { condition: "Snow", icon: "/static/Images/Weather Symbols for Weather Codes/snow.svg" },
        "5001": { condition: "Flurries", icon: "/static/Images/Weather Symbols for Weather Codes/flurries.svg" },
        "5100": { condition: "Light Snow", icon: "/static/Images/Weather Symbols for Weather Codes/snow_light.svg" },
        "5101": { condition: "Heavy Snow", icon: "/static/Images/Weather Symbols for Weather Codes/snow_heavy.svg" },
        "6000": { condition: "Freezing Drizzle", icon: "/static/Images/Weather Symbols for Weather Codes/freezing_drizzle.svg" },
        "6001": { condition: "Freezing Rain", icon: "/static/Images/Weather Symbols for Weather Codes/freezing_rain.svg" },
        "6200": { condition: "Light Freezing Rain", icon: "/static/Images/Weather Symbols for Weather Codes/freezing_rain_light.svg" },
        "6201": { condition: "Heavy Freezing Rain", icon: "/static/Images/Weather Symbols for Weather Codes/freezing_rain_heavy.svg" },
        "7000": { condition: "Ice Pellets", icon: "/static/Images/Weather Symbols for Weather Codes/ice_pellets.svg" },
        "7101": { condition: "Heavy Ice Pellets", icon: "/static/Images/Weather Symbols for Weather Codes/ice_pellets_heavy.svg" },
        "7102": { condition: "Light Ice Pellets", icon: "/static/Images/Weather Symbols for Weather Codes/ice_pellets_light.svg" },
        "8000": { condition: "Thunderstorm", icon: "/static/Images/Weather Symbols for Weather Codes/tstorm.svg" }
    };

    // Default to unknown if the code doesn't exist in the map
    return weatherData[weatherCode] || { condition: "Unknown", icon: "/static/Images/Weather Symbols for Weather Codes/default_icon.svg" };
}


function getWeatherIconSrc(code) {
    const iconPaths = {
        1000: "/static/Images/Weather Symbols for Weather Codes/clear_day.svg",
        1001: "/static/Images/Weather Symbols for Weather Codes/cloudy.svg",
        1100: "/static/Images/Weather Symbols for Weather Codes/mostly_clear_day.svg",
        1101: "/static/Images/Weather Symbols for Weather Codes/partly_cloudy_day.svg",
        1102: "/static/Images/Weather Symbols for Weather Codes/mostly_cloudy.svg",
        2000: "/static/Images/Weather Symbols for Weather Codes/fog.svg",
        2100: "/static/Images/Weather Symbols for Weather Codes/fog_light.svg",
        3000: "/static/Images/Weather Symbols for Weather Codes/light_wind.svg",
        3001: "/static/Images/Weather Symbols for Weather Codes/wind.svg",
        3002: "/static/Images/Weather Symbols for Weather Codes/strong_wind.svg",
        4000: "/static/Images/Weather Symbols for Weather Codes/drizzle.svg",
        4001: "/static/Images/Weather Symbols for Weather Codes/rain.svg",
        4200: "/static/Images/Weather Symbols for Weather Codes/rain_light.svg",
        4201: "/static/Images/Weather Symbols for Weather Codes/rain_heavy.svg",
        5000: "/static/Images/Weather Symbols for Weather Codes/snow.svg",
        5001: "/static/Images/Weather Symbols for Weather Codes/flurries.svg",
        5100: "/static/Images/Weather Symbols for Weather Codes/snow_light.svg",
        5101: "/static/Images/Weather Symbols for Weather Codes/snow_heavy.svg",
        6000: "/static/Images/Weather Symbols for Weather Codes/freezing_drizzle.svg",
        6001: "/static/Images/Weather Symbols for Weather Codes/freezing_rain.svg",
        6200: "/static/Images/Weather Symbols for Weather Codes/freezing_rain_light.svg",
        6201: "/static/Images/Weather Symbols for Weather Codes/freezing_rain_heavy.svg",
        7000: "/static/Images/Weather Symbols for Weather Codes/ice_pellets.svg",
        7101: "/static/Images/Weather Symbols for Weather Codes/ice_pellets_heavy.svg",
        7102: "/static/Images/Weather Symbols for Weather Codes/ice_pellets_light.svg",
        8000: "/static/Images/Weather Symbols for Weather Codes/tstorm.svg"
    };
    return iconPaths[code] || "/static/Images/Weather Symbols for Weather Codes/default_icon.svg";
}

// function displayForecastTable(forecastData) {
//     const forecastTableBody = document.getElementById("forecast-table");
//     forecastTableBody.innerHTML = ''; // Clear existing data

//     forecastData.forEach(day => {
//         console.log("Forecast data for day:", day.values); // Debug

//         const row = document.createElement('tr');
//         const date = new Date(day.startTime).toLocaleDateString("en-US", { weekday: 'long', year: 'numeric', month: 'short', day: 'numeric' });

//         const dateCell = document.createElement('td');
//         dateCell.textContent = date;
//         row.appendChild(dateCell);

//         const statusCell = document.createElement('td');
//         statusCell.classList.add("status");
//         statusCell.innerHTML = getWeatherIcon(day.values.weatherCode) + ' ' + mapWeatherCodeToCondition(day.values.weatherCode);
//         row.appendChild(statusCell);

//         const tempHighCell = document.createElement('td');
//         tempHighCell.textContent = `${day.values.temperatureMax ?? 'N/A'} °F`;
//         row.appendChild(tempHighCell);

//         const tempLowCell = document.createElement('td');
//         tempLowCell.textContent = `${day.values.temperatureMin ?? 'N/A'} °F`;
//         row.appendChild(tempLowCell);

//         const windSpeedCell = document.createElement('td');
//         windSpeedCell.textContent = `${day.values.windSpeed ?? 'N/A'} mph`;
//         row.appendChild(windSpeedCell);

//         // Add click event to show daily details
//         row.addEventListener('click', () => updateWeatherCard(day));

//         forecastTableBody.appendChild(row);
//     });
// }
function displayForecastTable(forecastData) {
    const forecastTableBody = document.getElementById("forecast-table");
    forecastTableBody.innerHTML = ''; // Clear existing data

    forecastData.forEach(day => {
        console.log("Forecast data for day:", day.values); // Debug

        const weatherDetails = getWeatherDetails(day.values.weatherCode);
        
        const row = document.createElement('tr');
        const date = new Date(day.startTime).toLocaleDateString("en-US", { weekday: 'long', year: 'numeric', month: 'short', day: 'numeric' });

        const dateCell = document.createElement('td');
        dateCell.textContent = date;
        row.appendChild(dateCell);

        const statusCell = document.createElement('td');
        statusCell.classList.add("status");
        statusCell.innerHTML = `<img src="${weatherDetails.icon}" class="weather-icon2"> ${weatherDetails.condition}`;
        row.appendChild(statusCell);

        const tempHighCell = document.createElement('td');
        tempHighCell.textContent = `${day.values.temperatureMax ?? 'N/A'} °F`;
        row.appendChild(tempHighCell);

        const tempLowCell = document.createElement('td');
        tempLowCell.textContent = `${day.values.temperatureMin ?? 'N/A'} °F`;
        row.appendChild(tempLowCell);

        const windSpeedCell = document.createElement('td');
        windSpeedCell.textContent = `${day.values.windSpeed ?? 'N/A'} mph`;
        row.appendChild(windSpeedCell);

        // Add click event to show daily details
        row.addEventListener('click', () => updateWeatherCard(day));

        forecastTableBody.appendChild(row);
    });
}
document.querySelector('.clear-btn').addEventListener('click', function() {
    // Hide the weather result container
    document.getElementById("weather-result").style.display = "none";
    document.getElementById("weather-body").style.display = "none";
    document.getElementById("weather-forecastable").style.display = "none";

    // Optionally, clear any input fields in the form
    document.getElementById('street').value = '';
    document.getElementById('city').value = '';
    document.getElementById('state').value = '';
});
// Helper functions to map weather codes to conditions and icons
function mapWeatherCodeToCondition(code) {
    const weatherConditions = {
        1000: 'Clear',
        1001: 'Cloudy',
        1100: 'Mostly Clear',
        1101: 'Partly Cloudy',
        1102: 'Mostly Cloudy',
        2000: 'Fog',
        2100: 'Light Fog',
        3000: 'Light Wind',
        3001: 'Wind',
        3002: 'Strong Wind',
        4000: 'Drizzle',
        4001: 'Rain',
        4200: 'Light Rain',
        4201: 'Heavy Rain',
        5000: 'Snow',
        5001: 'Flurries',
        5100: 'Light Snow',
        5101: 'Heavy Snow',
        6000: 'Freezing Drizzle',
        6001: 'Freezing Rain',
        6200: 'Light Freezing Rain',
        6201: 'Heavy Freezing Rain',
        7000: 'Ice Pellets',
        7101: 'Heavy Ice Pellets',
        7102: 'Light Ice Pellets',
        8000: 'Thunderstorm',
    };
    return weatherConditions[code] || 'Unknown';
}

function getWeatherIcon(code) {
    const icons = {
        1000: '<img src="/static/Images/Weather Symbols for Weather Codes/clear_day.svg" class="weather-icon2">',
        1001: '<img src="/static/Images/Weather Symbols for Weather Codes/cloudy.svg" class="weather-icon2">',
        1100: '<img src="/static/Images/Weather Symbols for Weather Codes/mostly_clear_day.svg" class="weather-icon2">',
        1101: '<img src="/static/Images/Weather Symbols for Weather Codes/partly_cloudy_day.svg" class="weather-icon2">',
        1102: '<img src="/static/Images/Weather Symbols for Weather Codes/mostly_cloudy.svg" class="weather-icon2">',
        2000: '<img src="/static/Images/Weather Symbols for Weather Codes/fog.svg" class="weather-icon2">',
        2100: '<img src="/static/Images/Weather Symbols for Weather Codes/fog_light.svg" class="weather-icon2">',
        3000: '<img src="/static/Images/Weather Symbols for Weather Codes/light_wind.svg" class="weather-icon2">',
        3001: '<img src="/static/Images/Weather Symbols for Weather Codes/wind.svg" class="weather-icon2">',
        3002: '<img src="/static/Images/Weather Symbols for Weather Codes/strong_wind.svg" class="weather-icon2">',
        4000: '<img src="/static/Images/Weather Symbols for Weather Codes/drizzle.svg" class="weather-icon2">',
        4001: '<img src="/static/Images/Weather Symbols for Weather Codes/rain.svg" class="weather-icon2">',
        4200: '<img src="/static/Images/Weather Symbols for Weather Codes/rain_light.svg" class="weather-icon2">',
        4201: '<img src="/static/Images/Weather Symbols for Weather Codes/rain_heavy.svg" class="weather-icon2">',
        5000: '<img src="/static/Images/Weather Symbols for Weather Codes/snow.svg" class="weather-icon2">',
        5001: '<img src="/static/Images/Weather Symbols for Weather Codes/flurries.svg" class="weather-icon2">',
        5100: '<img src="/static/Images/Weather Symbols for Weather Codes/snow_light.svg" class="weather-icon2">',
        5101: '<img src="/static/Images/Weather Symbols for Weather Codes/snow_heavy.svg" class="weather-icon2">',
        6000: '<img src="/static/Images/Weather Symbols for Weather Codes/freezing_drizzle.svg" class="weather-icon2">',
        6001: '<img src="/static/Images/Weather Symbols for Weather Codes/freezing_rain.svg" class="weather-icon2">',
        6200: '<img src="/static/Images/Weather Symbols for Weather Codes/freezing_rain_light.svg" class="weather-icon2">',
        6201: '<img src="/static/Images/Weather Symbols for Weather Codes/freezing_rain_heavy.svg" class="weather-icon2">',
        7000: '<img src="/static/Images/Weather Symbols for Weather Codes/ice_pellets.svg" class="weather-icon2">',
        7101: '<img src="/static/Images/Weather Symbols for Weather Codes/ice_pellets_heavy.svg" class="weather-icon2">',
        7102: '<img src="/static/Images/Weather Symbols for Weather Codes/ice_pellets_light.svg" class="weather-icon2">',
        8000: '<img src="/static/Images/Weather Symbols for Weather Codes/tstorm.svg" class="weather-icon2">',
    };
    return icons[code] || '<img src="/static/Images/Weather Symbols for Weather Codes/default_icon.svg" class="weather-icon2">';
}

function updateWeatherCard(day) {
    console.log("Day data passed to updateWeatherCard:", day); // Log the full day object

    if (!day.values) {
        console.error("No data available for the selected day");
        return;
    }

    document.getElementsByClassName("weather-body")[0].style.display = "none"; // Hide the weather card
    document.getElementsByClassName("weather-forecastable")[0].style.display = "none"; // Hide the weather card
    document.getElementsByClassName("weather-details")[0].style.display = "block"; // Show the weather details

    // Update the daily weather details
    document.getElementById("date").textContent = formatDate(new Date(day.values.sunriseTime));
    document.getElementById("condition1").textContent = mapWeatherCodeToCondition(day.values.weatherCode);
    document.getElementById("temperature").textContent = `${day.values.temperatureMin}°F / ${day.values.temperatureMax}°F`;
    document.getElementById("weather-icon-3").src = getWeatherIconSrc(day.values.weatherCode);

    // Weather statistics
    document.getElementById("precipitation1").textContent = day.values.precipitationType ? mapPrecipitationType(day.values.precipitationType) : "N/A";
    document.getElementById("chance-of-rain1").textContent = `${day.values.precipitationProbability || 0}%`;
    document.getElementById("wind-speed-new1").textContent = `${day.values.windSpeed || "N/A"} mph`;
    document.getElementById("humidity-new1").textContent = `${day.values.humidity || "N/A"}%`;
    document.getElementById("visibility-new1").textContent = `${day.values.visibility || "N/A"} mi`;
    document.getElementById("sunrise-sunset1").textContent = `${formatTime(new Date(day.values.sunriseTime))} / ${formatTime(new Date(day.values.sunsetTime))}`;
}


// Define the formatTime function
function formatTime(date) {
    // Get hours and minutes
    let hours = date.getHours();
    let minutes = date.getMinutes();
    // Format minutes to always be two digits
    minutes = minutes < 10 ? '0' + minutes : minutes;
    // Convert to 12-hour format
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12;
    hours = hours ? hours : 12; // The hour '0' should be '12'
    // Return the formatted time
    return `${hours}:${minutes} ${ampm}`;
}

function clearAll() {
    console.log("Clearing all weather data..."); // Add this line to confirm the button click
    document.getElementsByClassName("weather-body")[0].style.display = "none"; // Hide the weather card
    document.getElementsByClassName("weather-forecastable")[0].style.display = "none"; // Hide the weather card
    document.getElementsByClassName("weather-details")[0].style.display = "none";
}
document.getElementById('toggle-arrow').addEventListener('click', function () {
    const weatherCharts = document.getElementById('weather-charts');
    const arrowIcon = document.getElementById('toggle-arrow');

    if (weatherCharts.style.display === 'none' || weatherCharts.style.display === '') {
        // Show the charts
        weatherCharts.style.display = 'block';
        arrowIcon.src = "/static/Images/point-up-512.png"; // Change the arrow to point upwards
    } else {
        // Hide the charts
        weatherCharts.style.display = 'none';
        arrowIcon.src = "/static/Images/point-down-512.png"; // Change the arrow to point downwards
    }
});
