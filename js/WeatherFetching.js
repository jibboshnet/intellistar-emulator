// --- ZIP CODE GUESS (disabled until TWC geolookup added) ---
function guessZipCode() {
    // Skip geolookup until replaced with TWC
    return;

    var zipCodeElement = getElement("zip-code-text");
    if (zipCodeElement.value != "") return;

    // TODO: replace with TWC v3/location/search
}

// --- FETCH ALERTS ---
function fetchAlerts() {
    var alertCrawl = "";

    fetch(`https://api.weather.com/v3/alerts/headlines?geocode=${latitude},${longitude}&format=json&language=${CONFIG.language}&apiKey=${CONFIG.secrets.twcAPIKey}`)
    .then(response => {
        if (response.status !== 200) {
            console.warn("Alerts Error, no alerts will be shown");
            fetchForecast();
            return;
        }
        response.json().then(data => {
            alerts = [];

            if (!data.alerts || data.alerts.length === 0) {
                fetchForecast();
                return;
            }

            data.alerts.forEach((alert, i) => {
                alerts[i] = alert.eventDescription;
                alertCrawl += " " + alert.eventDescription.replace(/\.\.\./g, " ").replace(/\*/g, "");
            });

            if (alertCrawl != "") CONFIG.crawl = alertCrawl;
            alertsActive = alerts.length > 0;

            fetchForecast();
        });
    })
    .catch(err => {
        console.error("Error fetching alerts:", err);
        fetchForecast();
    });
}

// --- FETCH FORECAST ---
function fetchForecast() {
    fetch(`https://api.weather.com/v1/geocode/${latitude}/${longitude}/forecast/daily/10day.json?language=${CONFIG.language}&units=${CONFIG.units}&apiKey=${CONFIG.secrets.twcAPIKey}`)
    .then(response => {
        if (response.status !== 200) {
            console.log('Forecast request error');
            return;
        }
        response.json().then(data => {
            let forecasts = data.forecasts;

            // Day/Night narratives
            let ns = [];
            ns.push(forecasts[0].day || forecasts[0].night);
            ns.push(forecasts[0].night);
            ns.push(forecasts[1].day);
            ns.push(forecasts[1].night);

            for (let i = 0; i <= 3; i++) {
                let n = ns[i];
                forecastTemp[i] = n.temp;
                forecastIcon[i] = n.icon_code;
                forecastNarrative[i] = n.narrative;
                forecastPrecip[i] = `${n.pop}% Chance<br/> of ${n.precip_type.charAt(0).toUpperCase() + n.precip_type.substr(1).toLowerCase()}`;
            }

            // 7-day outlook
            for (let i = 0; i < 7; i++) {
                let fc = forecasts[i + 1];
                outlookHigh[i] = fc.max_temp;
                outlookLow[i] = fc.min_temp;
                outlookCondition[i] = (fc.day ? fc.day : fc.night).phrase_32char.split(' ').join('<br/>');
                outlookCondition[i] = outlookCondition[i].replace("Thunderstorm", "Thunder</br>storm");
                outlookIcon[i] = (fc.day ? fc.day : fc.night).icon_code;
            }

            fetchRadarImages();
        });
    });
}

// --- FETCH CURRENT WEATHER ---
function fetchCurrentWeather() {
    let location = "";
    if (CONFIG.locationMode === "POSTAL") {
        location = `postalKey=${zipCode}:${CONFIG.countryCode}`;
    } else if (CONFIG.locationMode === "AIRPORT") {
        let len = airportCode.length;
        if (len === 3) location = `iataCode=${airportCode}`;
        else if (len === 4) location = `icaoCode=${airportCode}`;
        else {
            alert("Please enter a valid ICAO or IATA Code");
            console.error(`Expected Airport Code Length 3 or 4, got ${len}`);
            return;
        }
    } else {
        alert("Please select a location type");
        console.error("Unknown location mode");
        return;
    }

    fetch(`https://api.weather.com/v3/location/point?${location}&language=${CONFIG.language}&format=json&apiKey=${CONFIG.secrets.twcAPIKey}`)
    .then(response => {
        if (response.status === 404) {
            alert("Location not found!");
            console.log('Conditions request error');
            return;
        }
        if (response.status !== 200) {
            alert("Something went wrong (check console)");
            console.log('Conditions request error');
            return;
        }
        response.json().then(data => {
            try {
                if (CONFIG.locationMode === "AIRPORT") {
                    cityName = data.location.airportName.toUpperCase().replace("INTERNATIONAL","INTL.").replace("AIRPORT","").trim();
                } else {
                    cityName = data.location.city.toUpperCase();
                }
                latitude = data.location.latitude;
                longitude = data.location.longitude;
            } catch (err) {
                alert('Enter valid ZIP code');
                console.error(err);
                getZipCodeFromUser();
                return;
            }

            fetch(`https://api.weather.com/v1/geocode/${latitude}/${longitude}/observations/current.json?language=${CONFIG.language}&units=${CONFIG.units}&apiKey=${CONFIG.secrets.twcAPIKey}`)
            .then(response => {
                if (response.status !== 200) {
                    console.log("Conditions request error");
                    return;
                }
                response.json().then(data => {
                    let unit = data.observation[CONFIG.unitField];
                    currentTemperature = Math.round(unit.temp);
                    currentCondition = data.observation.phrase_32char;
                    windSpeed = `${data.observation.wdir_cardinal} ${unit.wspd} ${CONFIG.units === 'm' ? 'km/h' : 'mph'}`;
                    gusts = unit.gust || 'NONE';
                    feelsLike = unit.feels_like;
                    visibility = Math.round(unit.vis);
                    humidity = unit.rh;
                    dewPoint = unit.dewpt;
                    pressure = unit.altimeter.toPrecision(4);
                    let ptendCode = data.observation.ptend_code;
                    pressureTrend = (ptendCode === 1 || ptendCode === 3) ? '▲' : ptendCode === 0 ? '' : '▼';
                    currentIcon = data.observation.icon_code;

                    fetchAlerts(); // start alerts + forecast
                });
            });
        });
    });
}

// --- FETCH RADAR IMAGES ---
function fetchRadarImages() {
    radarImage = document.createElement("iframe");
    radarImage.onerror = () => getElement('radar-container').style.display = 'none';

    let mapSettings = btoa(JSON.stringify({
        "agenda": { "id": "weather", "center": [longitude, latitude], "location": null, "zoom": 8 },
        "animating": true,
        "base": "standard",
        "artcc": false, "county": false, "cwa": false, "rfc": false, "state": false, "menu": false, "shortFusedOnly": false,
        "opacity": { "alerts": 0.0, "local": 0.0, "localStations": 0.0, "national": 0.6 }
    }));

    radarImage.setAttribute("src", "https://radar.weather.gov/?settings=v1_" + mapSettings);
    radarImage.style.width = "1230px";
    radarImage.style.height = "740px";
    radarImage.style.marginTop = "-220px";
    radarImage.style.overflow = "hidden";

    if (alertsActive) {
        let zoomedRadarImage = document.createElement("iframe");
        zoomedRadarImage.onerror = () => getElement('zoomed-radar-container').style.display = 'none';

        mapSettings = btoa(JSON.stringify({
            "agenda": { "id": "weather", "center": [longitude, latitude], "location": null, "zoom": 10 },
            "animating": true,
            "base": "standard",
            "artcc": false, "county": false, "cwa": false, "rfc": false, "state": false, "menu": false, "shortFusedOnly": false,
            "opacity": { "alerts": 0.0, "local": 0.0, "localStations": 0.0, "national": 0.6 }
        }));
        zoomedRadarImage.setAttribute("src", "https://radar.weather.gov/?settings=v1_" + mapSettings);
        zoomedRadarImage.style.width = "1230px";
        zoomedRadarImage.style.height = "740px";
        zoomedRadarImage.style.marginTop = "-220px";
        zoomedRadarImage.style.overflow = "hidden";
    }

    scheduleTimeline();
}
