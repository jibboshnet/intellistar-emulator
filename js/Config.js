window.CONFIG = {
  crawl: `Choose the other good channel with Isles Television Network! Local forecasts and programming for Martinsburg, WV!`,

  // Random greeting
  greetingOptions: [
    "This is your very sigma weather!!!!",
    "Get ready for some weather magic!",
    "Your forecast has arrived!",
    "Stay informed, stay amazing!"
  ],

  greeting: '', // will set randomly
  language: 'en-US',
  countryCode: 'CA',
  units: 'm',               // Celsius
  unitField: 'metric',      // Celsius
  loop: true,               // AUTO-START
  locationMode: "AIRPORT",
  secrets: {
    twcAPIKey: 'e1f10a1e78da46f5b10a1e78da96f525'
  },

  locationOptions: [],
  options: [],

  addLocationOption: () => {},
  addOption: () => {},

  submit: () => {
    CONFIG.locationMode = "AIRPORT";
    airportCode = "YQB";  // Quebec City Airport
    zipCode = null;

    CONFIG.unitField = 'metric'; // Celsius

    // Pick a random greeting from options
    CONFIG.greeting = CONFIG.greetingOptions[Math.floor(Math.random() * CONFIG.greetingOptions.length)];

    fetchCurrentWeather();

    // Override display name
    setTimeout(() => {
      const t1 = document.getElementById("infobar-location-text");
      const t2 = document.getElementById("hello-location-text");

      if (t1) t1.innerText = "Quebec City";
      if (t2) t2.innerText = "Quebec City";

      // Update greeting text
      const greetingEl = document.getElementById("greeting-text");
      if (greetingEl) greetingEl.innerText = CONFIG.greeting;

      // Update units display (wind km/h, pressure hPa)
      const windEl = document.getElementById("cc-wind");
      if (windEl) {
        let windText = windEl.innerText;
        let speed = parseInt(windText.replace(/\D/g, '')) || 0;
        windEl.innerText = `N ${Math.round(speed * 1.60934)} km/h`;
      }

      const pressureEl = document.getElementById("cc-pressure1");
      const pressureDecimalEl = document.getElementById("cc-pressure2");
      const pressureMetricEl = document.getElementById("cc-pressure-metric");
      if (pressureEl && pressureDecimalEl && pressureMetricEl) {
        let pressure = parseFloat(`${pressureEl.innerText}.${pressureDecimalEl.innerText}`) || 1013;
        pressureEl.innerText = Math.floor(pressure * 33.8639 / 33.8639); // Already metric hPa
        pressureDecimalEl.innerText = '';
        pressureMetricEl.innerText = ' hPa';
      }
    }, 700);
  },

  load: () => {
    hideSettings();
    CONFIG.submit();
  }
};

// Ensure metric units
CONFIG.unitField = 'metric';
