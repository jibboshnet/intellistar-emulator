const latitude = 46.8139;
const longitude = -71.2082;
let CONFIG = {
  language: 'en-US',
  units: 'm', // metric for Canada
  unitField: 'metric',
  secrets: {
    twcAPIKey: 'e1f10a1e78da46f5b10a1e78da96f525' // example key from your original code
  },
  crawl: ''
};

let alerts = [];
let alertsActive = false;
let forecastTemp = [], forecastIcon = [], forecastNarrative = [], forecastPrecip = [];
let outlookHigh = [], outlookLow = [], outlookCondition = [], outlookIcon = [];
let currentTemperature, currentCondition, windSpeed, gusts, feelsLike, visibility, humidity, dewPoint, pressure, pressureTrend, currentIcon;
let cityName = "QueBEC City";

async function fetchAlerts(){
  try {
    const res = await fetch(`https://api.weather.gov/alerts/active?point=${latitude},${longitude}`);
    if(!res.ok){ console.warn("Alerts Error"); return; }
    const data = await res.json();

    alerts = [];
    let alertCrawl = '';

    if(data.features){
      for(const feature of data.features){
        alerts.push(feature.properties.event);
        alertCrawl += " " + feature.properties.description.replace(/\.\.\./g, ' ').replace(/\*/g,'');
      }
    }

    if(alertCrawl) CONFIG.crawl = alertCrawl;
    alertsActive = alerts.length > 0;
    fetchForecast();
  } catch(err){
    console.error(err);
  }
}

async function fetchForecast(){
  try {
    const res = await fetch(`https://api.weather.com/v1/geocode/${latitude}/${longitude}/forecast/daily/10day.json?language=${CONFIG.language}&units=${CONFIG.units}&apiKey=${CONFIG.secrets.twcAPIKey}`);
    if(!res.ok){ console.log("Forecast request error (example key)"); return; }
    const data = await res.json();
    const forecasts = data.forecasts;

    let ns = [];
    ns.push(forecasts[0].day || forecasts[0].night);
    ns.push(forecasts[0].night);
    ns.push(forecasts[1].day);
    ns.push(forecasts[1].night);

    for(let i=0; i<=3; i++){
      let n = ns[i];
      forecastTemp[i] = n.temp;
      forecastIcon[i] = n.icon_code;
      forecastNarrative[i] = n.narrative;
      forecastPrecip[i] = `${n.pop}% Chance<br/> of ${n.precip_type.charAt(0).toUpperCase() + n.precip_type.slice(1).toLowerCase()}`;
    }

    for(let i=0; i<7; i++){
      let fc = forecasts[i+1];
      outlookHigh[i] = fc.max_temp;
      outlookLow[i] = fc.min_temp;
      outlookCondition[i] = (fc.day ? fc.day : fc.night).phrase_32char.split(' ').join('<br/>')
        .replace("Thunderstorm","Thunder</br>storm");
      outlookIcon[i] = (fc.day ? fc.day : fc.night).icon_code;
    }

    fetchRadarImages();
  } catch(err){
    console.error(err);
  }
}

async function fetchCurrentWeather(){
  try {
    const res = await fetch(`https://api.weather.com/v1/geocode/${latitude}/${longitude}/observations/current.json?language=${CONFIG.language}&units=${CONFIG.units}&apiKey=${CONFIG.secrets.twcAPIKey}`);
    if(!res.ok){ console.log("Current weather request error (example key)"); return; }
    const data = await res.json();
    const unit = data.observation[CONFIG.unitField];

    currentTemperature = Math.round(unit.temp);
    currentCondition = data.observation.phrase_32char;
    windSpeed = `${data.observation.wdir_cardinal} ${unit.wspd} km/h`;
    gusts = unit.gust || 'NONE';
    feelsLike = unit.feels_like;
    visibility = Math.round(unit.vis);
    humidity = unit.rh;
    dewPoint = unit.dewpt;
    pressure = unit.altimeter.toPrecision(4);
    pressureTrend = (data.observation.ptend_code==1 || data.observation.ptend_code==3) ? '▲' :
                     data.observation.ptend_code==0 ? '' : '▼';
    currentIcon = data.observation.icon_code;

    fetchAlerts();
  } catch(err){
    console.error(err);
  }
}

function fetchRadarImages(){
  const radarContainer = document.getElementById('radar-container');
  radarContainer.innerHTML = '';
  const radarImage = document.createElement('iframe');

  const mapSettings = btoa(JSON.stringify({
    "agenda": { "id": "weather", "center":[longitude, latitude], "zoom":8 },
    "animating": true,
    "base": "standard",
    "opacity": { "alerts":0.0, "local":0.0, "localStations":0.0, "national
