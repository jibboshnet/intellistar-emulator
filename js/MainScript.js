// Preset timeline sequences
const MORNING = [
  { name: "Now", subpages: [{ name: "current-page", duration: 9000 }] },
  { name: "Today", subpages: [{ name: "today-page", duration: 10000 }] },
  { name: "Tonight", subpages: [{ name: "tonight-page", duration: 10000 }] },
  {
    name: "Beyond",
    subpages: [
      { name: "tomorrow-page", duration: 10000 },
      { name: "7day-page", duration: 13000 }
    ]
  },
];

const NIGHT = [
  { name: "Now", subpages: [{ name: "current-page", duration: 9000 }] },
  { name: "Tonight", subpages: [{ name: "tonight-page", duration: 10000 }] },
  {
    name: "Beyond",
    subpages: [
      { name: "tomorrow-page", duration: 10000 },
      { name: "tomorrow-night-page", duration: 10000 },
      { name: "7day-page", duration: 13000 }
    ]
  },
];

const SINGLE = [
  { name: "Alert", subpages: [{ name: "single-alert-page", duration: 7000 }] },
  { name: "Now", subpages: [{ name: "current-page", duration: 8000 }] },
  { name: "Tonight", subpages: [{ name: "tonight-page", duration: 8000 }] },
  {
    name: "Beyond",
    subpages: [
      { name: "tomorrow-page", duration: 8000 },
      { name: "7day-page", duration: 21000 } // +8000 to match total time
    ]
  },
];

const MULTIPLE = [
  { name: "Alerts", subpages: [{ name: "multiple-alerts-page", duration: 7000 }] },
  { name: "Now", subpages: [{ name: "current-page", duration: 8000 }] },
  { name: "Tonight", subpages: [{ name: "tonight-page", duration: 8000 }] },
  {
    name: "Beyond",
    subpages: [
      { name: "tomorrow-page", duration: 8000 },
      { name: "7day-page", duration: 21000 } // +8000 to match total time
    ]
  },
];

const WEEKDAY = ["SUN", "MON", "TUES", "WED", "THU", "FRI", "SAT"];

const jingle = new Audio("assets/music/jingle.wav")

const crawlSpeedCasual = 10; // A normal reading pace, in characters per second
const crawlSpeedFast = 20; // A fast reading pace, in characters per second
const crawlScreenTime = 45; // Shortest time crawl will be on screen, in seconds
const crawlSpace = 70; // Approx number of characters that can fix in the crawl bar. Used for crawl speed calcs

var isDay = true;
var currentLogo;
var currentLogoIndex = 0;
var pageOrder;
var music;

// List of wallpaper URLs
const wallpapers = [
  "https://www.tripsavvy.com/thmb/PW-5bAHeH29JVM3ycyojFaM3cJw=/3862x2578/filters:no_upscale():max_bytes(150000):strip_icc()/quebec-city-skyline--canada-852985690-5ac4cea51f4e130036cec16a.jpg",
  "https://www.pixelstalk.net/wp-content/uploads/2016/11/Desktop-Fog-Backgrounds.jpg",
  "https://media.discordapp.net/attachments/1241972819672170577/1419309213762588672/IMG_0180.jpg?ex=69342ab6&is=6932d936&hm=de3092995cc07f6843ffd6778cef8b84380183d587be23c74ea3f5fd868316c4&=&format=webp&width=954&height=1272",
  "https://cdn.discordapp.com/attachments/1241972819672170577/1419309553996271758/image0.jpg?ex=69342b07&is=6932d987&hm=153f0608f6065b0db2d09079b07ae594907acbc560633417bd571a4b28b03e51&"
];

window.onload = function () {
  CONFIG.addLocationOption('airport-code', 'Airport', 'ATL or KATL')
  CONFIG.addLocationOption('zip-code', 'Postal', '00000')

  CONFIG.addOption('crawlText', 'Crawl Text', 'Text that scrolls along the bottom')
  CONFIG.addOption('greetingText', 'Greeting Text', 'Message (or joke) that appears at the start')
  CONFIG.load();
  preLoadMusic();
  setMainBackground();
  resizeWindow();
  setClockTime();
  if (!CONFIG.loop) {
    getElement("settings-container").style.display = 'block';
    guessZipCode();
  }
}

function toggleAdvancedSettings(){
  let advancedSettingsOptions = getElement('advanced-settings-options')
  let advancedOptionsText = getElement('advanced-options-text')

  var advancedSettingsHidden = advancedSettingsOptions.classList.contains('hidden')

  if(advancedSettingsHidden){
    advancedSettingsOptions.classList.remove('hidden')
    advancedOptionsText.innerHTML = 'Hide advanced options'
  }
  else{
    advancedSettingsOptions.classList.add('hidden')
    advancedOptionsText.innerHTML = 'Show advanced options'
  }
}

function preLoadMusic(){
  var index = Math.floor(Math.random() * 12) + 1;
  music = new Audio("assets/music/" + index + ".wav");
}

/* Set the timeline page order depending on time of day and if
alerts are present */
function scheduleTimeline(){
  if(alerts.length == 1){
    pageOrder = SINGLE;
  }else if(alerts.length > 1){
    pageOrder = MULTIPLE;
  }else if(isDay){
    pageOrder = MORNING;
  }else{
    pageOrder = NIGHT;
  }
  setInformation();
}

function revealTimeline(){
  getElement('timeline-event-container').classList.add('shown');
  getElement('progressbar-container').classList.add('shown');
  getElement('logo-stack').classList.add('shown');
  var timelineElements = document.querySelectorAll(".timeline-item");
  for (var i = 0; i < timelineElements.length; i++) {
    timelineElements[i].style.top = '0px';
  }
}

/* Now that all the fetched information is stored in memory, display them in
the appropriate elements */
function setInformation(){
  setGreetingPage();
  checkStormMusic();
  setAlertPage();
  setForecast();
  setOutlook();
  createLogoElements();
  setCurrentConditions();
  setTimelineEvents();
  hideSettings();
  setTimeout(startAnimation, 1000);
}

// Randomly choose one wallpaper from your list
function setMainBackground(){
  const index = Math.floor(Math.random() * wallpapers.length);
  getElement('background-image').style.backgroundImage = `url(${wallpapers[index]})`;
}

function checkStormMusic(){
  if(currentCondition.toLowerCase().includes("storm")){
    music= new Audio("assets/music/storm.wav");
  }
}

function startAnimation(){
  setInitialPositionCurrentPage();

  jingle.play();
  setTimeout(startMusic, 5000)
  executeGreetingPage();
}

function startMusic(){
  music.play();
}

function hideSettings(){
  // Animate settings prompt out
  getElement('settings-prompt').classList.add('hide');
  getElement('settings-container').style.pointerEvents = 'none';
}

function executeGreetingPage(){
  getElement('background-image').classList.remove("below-screen");
  getElement('content-container').classList.add('shown');
  getElement('infobar-twc-logo').classList.add('shown');
  getElement('hello-text').classList.add('shown');
  getElement('hello-location-text').classList.add('shown');
  getElement('greeting-text').classList.add('shown');
  getElement('local-logo-container').classList.add("shown");
  setTimeout(clearGreetingPage, 2500);
}

function clearGreetingPage(){
  getElement('greeting-text').classList.remove('shown');
  getElement('local-logo-container').classList.remove('shown');

  getElement('greeting-text').classList.add('hidden');
  getElement('hello-text-container').classList.add('hidden');
  getElement("hello-location-container").classList.add("hidden");
  getElement("local-logo-container").classList.add("hidden");

  schedulePages();
  loadInfoBar();
  revealTimeline();
  setTimeout(showCrawl, 3000);
}

// Set start and end times for every sub page.
function schedulePages(){
  var cumlativeTime = 0;
  for(var p = 0; p < pageOrder.length; p++){
    for (var s = 0; s < pageOrder[p].subpages.length; s++) {
      var startTime = cumlativeTime;
      var clearTime = cumlativeTime + pageOrder[p].subpages[s].duration;
      setTimeout(executePage, startTime, p, s);
      setTimeout(clearPage, clearTime, p, s);
      cumlativeTime = clearTime;
    }
  }
}

// (The rest of your code continues unchanged, including executePage, clearPage, startRadar, scrollCC, etc.)
