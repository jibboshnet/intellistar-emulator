window.CONFIG = {
  // Random crawl options
  crawlOptions: [
    "Choose the other good channel with Isles Television Network! Local forecasts and programming for Martinsburg, WV!",
    "You are watching JibboshTV, Canada's Least Trusted TV News Network, Based from New Brunswick, Canada!",
    "Goodbye WR!"
  ],

  crawl: '', // will set randomly

  greetingOptions: [
    "This is your very sigma weather!!!!",
    "Get ready for some weather magic!",
    "Your forecast has arrived!",
    "Weather Ranch could never."
  ],

  greeting: '',
  language: 'en-US',
  countryCode: 'CA',
  units: 'm',
  unitField: 'metric',
  loop: true,
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
    airportCode = "YQB";  
    zipCode = null;

    CONFIG.unitField = 'metric';

    // Random greeting
    CONFIG.greeting = CONFIG.greetingOptions[Math.floor(Math.random() * CONFIG.greetingOptions.length)];

    // Random crawl ad
    CONFIG.crawl = CONFIG.crawlOptions[Math.floor(Math.random() * CONFIG.crawlOptions.length)];

    fetchCurrentWeather();

    setTimeout(() => {
      const forceQC = () => {
        const t1 = document.getElementById("infobar-location-text");
        const t2 = document.getElementById("hello-location-text");
        if (t1) t1.innerText = "Quebec City";
        if (t2) t2.innerText = "Quebec City";
      };

      // Run a few times to override any TWC auto-updates.
      let count = 0;
      const interval = setInterval(() => {
        forceQC();
        count++;
        if (count > 10) clearInterval(interval);
      }, 200);

      // Greeting
      const greetingEl = document.getElementById("greeting-text");
      if (greetingEl) greetingEl.innerText = CONFIG.greeting;

      // Wind conversion to km/h
      const windEl = document.getElementById("cc-wind");
      if (windEl) {
        let windText = windEl.innerText;
        let speed = parseInt(windText.replace(/\D/g, '')) || 0;
        windEl.innerText = `N ${Math.round(speed * 1.60934)} km/h`;
      }

      // Pressure formatting
      const pressureEl = document.getElementById("cc-pressure1");
      const pressureDecimalEl = document.getElementById("cc-pressure2");
      const pressureMetricEl = document.getElementById("cc-pressure-metric");
      if (pressureEl && pressureDecimalEl && pressureMetricEl) {
        let pressure = parseFloat(`${pressureEl.innerText}.${pressureDecimalEl.innerText}`) || 1013;
        pressureEl.innerText = Math.floor(pressure);
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

// Always metric
CONFIG.unitField = 'metric';
