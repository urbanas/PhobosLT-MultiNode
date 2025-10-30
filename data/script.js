// Node 1 elements
const bandSelect = document.getElementById("bandSelect");
const channelSelect = document.getElementById("channelSelect");
const freqOutput = document.getElementById("freqOutput");
const enterRssiInput = document.getElementById("enter");
const exitRssiInput = document.getElementById("exit");
const enterRssiSpan = document.getElementById("enterSpan");
const exitRssiSpan = document.getElementById("exitSpan");
const pilotNameInput = document.getElementById("pname");

// Node 2 elements
const bandSelect2 = document.getElementById("bandSelect2");
const channelSelect2 = document.getElementById("channelSelect2");
const freqOutput2 = document.getElementById("freqOutput2");
const enterRssiInput2 = document.getElementById("enter2");
const exitRssiInput2 = document.getElementById("exit2");
const enterRssiSpan2 = document.getElementById("enterSpan2");
const exitRssiSpan2 = document.getElementById("exitSpan2");
const pilotNameInput2 = document.getElementById("pname2");

// Common elements
const announcerSelect = document.getElementById("announcerSelect");
const announcerRateInput = document.getElementById("rate");
const ssidInput = document.getElementById("ssid");
const pwdInput = document.getElementById("pwd");
const minLapInput = document.getElementById("minLap");
const raceStartDelayInput = document.getElementById("raceStartDelay");
const alarmThreshold = document.getElementById("alarmThreshold");

const freqLookup = [
  [5865, 5845, 5825, 5805, 5785, 5765, 5745, 5725],
  [5733, 5752, 5771, 5790, 5809, 5828, 5847, 5866],
  [5705, 5685, 5665, 5645, 5885, 5905, 5925, 5945],
  [5740, 5760, 5780, 5800, 5820, 5840, 5860, 5880],
  [5658, 5695, 5732, 5769, 5806, 5843, 5880, 5917],
  [5362, 5399, 5436, 5473, 5510, 5547, 5584, 5621],
];

const config = document.getElementById("config");
const race = document.getElementById("race");
const calib = document.getElementById("calib");
const ota = document.getElementById("ota");

// Node 1 variables
var enterRssi = 120, exitRssi = 100;
var frequency = 0;
var lapNo = -1;
var lapTimes = [];
const rssiBuffer = [];
var rssiValue = 0;
var crossing = false;
var rssiSeries = new TimeSeries();
var rssiCrossingSeries = new TimeSeries();
var maxRssiValue = enterRssi + 10;
var minRssiValue = exitRssi - 10;

// Node 2 variables
var enterRssi2 = 120, exitRssi2 = 100;
var frequency2 = 0;
var lapNo2 = -1;
var lapTimes2 = [];
const rssiBuffer2 = [];
var rssiValue2 = 0;
var crossing2 = false;
var rssiSeries2 = new TimeSeries();
var rssiCrossingSeries2 = new TimeSeries();
var maxRssiValue2 = enterRssi2 + 10;
var minRssiValue2 = exitRssi2 - 10;

// Common variables
var announcerRate = 1.0;
var raceStartDelay = 5.0; // seconds

var timerInterval;
const timer = document.getElementById("timer");
const startRaceButton = document.getElementById("startRaceButton");
const stopRaceButton = document.getElementById("stopRaceButton");
const lapTable = document.getElementById("lapTable");
const lapTable2 = document.getElementById("lapTable2");

const batteryVoltageDisplay = document.getElementById("bvolt");

var rssiSending = false;
var rssiChart, rssiChart2;

var audioEnabled = false;
var speakObjsQueue = [];

onload = function (e) {
  config.style.display = "block";
  race.style.display = "none";
  calib.style.display = "none";
  ota.style.display = "none";
  fetch("/config")
    .then((response) => response.json())
    .then((config) => {
      console.log(config);
      // Node 1 config
      setBandChannelIndex(config.freq, 1);
      enterRssiInput.value = config.enterRssi;
      updateEnterRssi(enterRssiInput, enterRssiInput.value);
      exitRssiInput.value = config.exitRssi;
      updateExitRssi(exitRssiInput, exitRssiInput.value);
      pilotNameInput.value = config.name;
      document.getElementById("pilot1Name").textContent = config.name || "Pilot 1";
      
      // Node 2 config
      setBandChannelIndex(config.freq2, 2);
      enterRssiInput2.value = config.enterRssi2;
      updateEnterRssi2(enterRssiInput2, enterRssiInput2.value);
      exitRssiInput2.value = config.exitRssi2;
      updateExitRssi2(exitRssiInput2, exitRssiInput2.value);
      pilotNameInput2.value = config.name2;
      document.getElementById("pilot2Name").textContent = config.name2 || "Pilot 2";
      
      // Common config
      minLapInput.value = (parseFloat(config.minLap) / 10).toFixed(1);
      updateMinLap(minLapInput, minLapInput.value);
      if (config.raceStartDelay !== undefined) {
        raceStartDelayInput.value = (parseFloat(config.raceStartDelay) / 10).toFixed(1);
        updateRaceStartDelay(raceStartDelayInput, raceStartDelayInput.value);
      }
      alarmThreshold.value = (parseFloat(config.alarm) / 10).toFixed(1);
      updateAlarmThreshold(alarmThreshold, alarmThreshold.value);
      announcerSelect.selectedIndex = config.anType;
      announcerRateInput.value = (parseFloat(config.anRate) / 10).toFixed(1);
      updateAnnouncerRate(announcerRateInput, announcerRateInput.value);
      ssidInput.value = config.ssid;
      pwdInput.value = config.pwd;
      
      populateFreqOutput(1);
      populateFreqOutput(2);
      stopRaceButton.disabled = true;
      startRaceButton.disabled = false;
      clearInterval(timerInterval);
      timer.innerHTML = "00:00:00s";
      clearLaps();
      createRssiChart();
      createRssiChart2();
    });
};

function getBatteryVoltage() {
  fetch("/status")
    .then((response) => response.text())
    .then((response) => {
      const batteryVoltageMatch = response.match(/Battery Voltage:\s*([\d.]+v)/);
      const batteryVoltage = batteryVoltageMatch ? batteryVoltageMatch[1] : null;
      batteryVoltageDisplay.innerText = batteryVoltage;
    });
}

setInterval(getBatteryVoltage, 2000);

function addRssiPoint() {
  if (calib.style.display != "none") {
    rssiChart.start();
    rssiChart2.start();
    
    // Node 1
    if (rssiBuffer.length > 0) {
      rssiValue = parseInt(rssiBuffer.shift());
      if (crossing && rssiValue < exitRssi) {
        crossing = false;
      } else if (!crossing && rssiValue > enterRssi) {
        crossing = true;
      }
      maxRssiValue = Math.max(maxRssiValue, rssiValue);
      minRssiValue = Math.min(minRssiValue, rssiValue);
    }

    rssiChart.options.horizontalLines = [
      { color: "hsl(8.2, 86.5%, 53.7%)", lineWidth: 1.7, value: enterRssi },
      { color: "hsl(25, 85%, 55%)", lineWidth: 1.7, value: exitRssi },
    ];
    rssiChart.options.maxValue = Math.max(maxRssiValue, enterRssi + 10);
    rssiChart.options.minValue = Math.max(0, Math.min(minRssiValue, exitRssi - 10));

    var now = Date.now();
    rssiSeries.append(now, rssiValue);
    if (crossing) {
      rssiCrossingSeries.append(now, 256);
    } else {
      rssiCrossingSeries.append(now, -10);
    }
    
    // Node 2
    if (rssiBuffer2.length > 0) {
      rssiValue2 = parseInt(rssiBuffer2.shift());
      if (crossing2 && rssiValue2 < exitRssi2) {
        crossing2 = false;
      } else if (!crossing2 && rssiValue2 > enterRssi2) {
        crossing2 = true;
      }
      maxRssiValue2 = Math.max(maxRssiValue2, rssiValue2);
      minRssiValue2 = Math.min(minRssiValue2, rssiValue2);
    }

    rssiChart2.options.horizontalLines = [
      { color: "hsl(8.2, 86.5%, 53.7%)", lineWidth: 1.7, value: enterRssi2 },
      { color: "hsl(25, 85%, 55%)", lineWidth: 1.7, value: exitRssi2 },
    ];
    rssiChart2.options.maxValue = Math.max(maxRssiValue2, enterRssi2 + 10);
    rssiChart2.options.minValue = Math.max(0, Math.min(minRssiValue2, exitRssi2 - 10));

    rssiSeries2.append(now, rssiValue2);
    if (crossing2) {
      rssiCrossingSeries2.append(now, 256);
    } else {
      rssiCrossingSeries2.append(now, -10);
    }
  } else {
    rssiChart.stop();
    rssiChart2.stop();
    maxRssiValue = enterRssi + 10;
    minRssiValue = exitRssi - 10;
    maxRssiValue2 = enterRssi2 + 10;
    minRssiValue2 = exitRssi2 - 10;
  }
}

setInterval(addRssiPoint, 200);

function createRssiChart() {
  rssiChart = new SmoothieChart({
    responsive: true,
    millisPerPixel: 50,
    grid: {
      strokeStyle: "rgba(255,255,255,0.25)",
      sharpLines: true,
      verticalSections: 0,
      borderVisible: false,
    },
    labels: {
      precision: 0,
    },
    maxValue: 1,
    minValue: 0,
  });
  rssiChart.addTimeSeries(rssiSeries, {
    lineWidth: 1.7,
    strokeStyle: "hsl(214, 53%, 60%)",
    fillStyle: "hsla(214, 53%, 60%, 0.4)",
  });
  rssiChart.addTimeSeries(rssiCrossingSeries, {
    lineWidth: 1.7,
    strokeStyle: "none",
    fillStyle: "hsla(136, 71%, 70%, 0.3)",
  });
  rssiChart.streamTo(document.getElementById("rssiChart"), 200);
}

function createRssiChart2() {
  rssiChart2 = new SmoothieChart({
    responsive: true,
    millisPerPixel: 50,
    grid: {
      strokeStyle: "rgba(255,255,255,0.25)",
      sharpLines: true,
      verticalSections: 0,
      borderVisible: false,
    },
    labels: {
      precision: 0,
    },
    maxValue: 1,
    minValue: 0,
  });
  rssiChart2.addTimeSeries(rssiSeries2, {
    lineWidth: 1.7,
    strokeStyle: "hsl(214, 53%, 60%)",
    fillStyle: "hsla(214, 53%, 60%, 0.4)",
  });
  rssiChart2.addTimeSeries(rssiCrossingSeries2, {
    lineWidth: 1.7,
    strokeStyle: "none",
    fillStyle: "hsla(136, 71%, 70%, 0.3)",
  });
  rssiChart2.streamTo(document.getElementById("rssiChart2"), 200);
}

function openTab(evt, tabName) {
  // Declare all variables
  var i, tabcontent, tablinks;

  // Get all elements with class="tabcontent" and hide them
  tabcontent = document.getElementsByClassName("tabcontent");
  for (i = 0; i < tabcontent.length; i++) {
    tabcontent[i].style.display = "none";
  }

  // Get all elements with class="tablinks" and remove the class "active"
  tablinks = document.getElementsByClassName("tablinks");
  for (i = 0; i < tablinks.length; i++) {
    tablinks[i].className = tablinks[i].className.replace(" active", "");
  }

  // Show the current tab, and add an "active" class to the button that opened the tab
  document.getElementById(tabName).style.display = "block";
  evt.currentTarget.className += " active";

  // if event comes from calibration tab, signal to start sending RSSI events
  if (tabName === "calib" && !rssiSending) {
    fetch("/timer/rssiStart", {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
    })
      .then((response) => {
        if (response.ok) rssiSending = true;
        return response.json();
      })
      .then((response) => {
        console.log("/timer/rssiStart:" + JSON.stringify(response));
        // Ensure charts are properly sized and rendering
        if (rssiChart) rssiChart.start();
        if (rssiChart2) rssiChart2.start();
      });
  } else if (rssiSending) {
    fetch("/timer/rssiStop", {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
    })
      .then((response) => {
        if (response.ok) rssiSending = false;
        return response.json();
      })
      .then((response) => console.log("/timer/rssiStop:" + JSON.stringify(response)));
  }
}

function updateEnterRssi(obj, value) {
  enterRssi = parseInt(value);
  enterRssiSpan.textContent = enterRssi;
  if (enterRssi <= exitRssi) {
    exitRssi = Math.max(0, enterRssi - 1);
    exitRssiInput.value = exitRssi;
    exitRssiSpan.textContent = exitRssi;
  }
}

function updateExitRssi(obj, value) {
  exitRssi = parseInt(value);
  exitRssiSpan.textContent = exitRssi;
  if (exitRssi >= enterRssi) {
    enterRssi = Math.min(255, exitRssi + 1);
    enterRssiInput.value = enterRssi;
    enterRssiSpan.textContent = enterRssi;
  }
}

function updateEnterRssi2(obj, value) {
  enterRssi2 = parseInt(value);
  enterRssiSpan2.textContent = enterRssi2;
  if (enterRssi2 <= exitRssi2) {
    exitRssi2 = Math.max(0, enterRssi2 - 1);
    exitRssiInput2.value = exitRssi2;
    exitRssiSpan2.textContent = exitRssi2;
  }
}

function updateExitRssi2(obj, value) {
  exitRssi2 = parseInt(value);
  exitRssiSpan2.textContent = exitRssi2;
  if (exitRssi2 >= enterRssi2) {
    enterRssi2 = Math.min(255, exitRssi2 + 1);
    enterRssiInput2.value = enterRssi2;
    enterRssiSpan2.textContent = enterRssi2;
  }
}

function saveConfig() {
  fetch("/config", {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      freq: frequency,
      minLap: parseInt(minLapInput.value * 10),
      raceStartDelay: parseInt(raceStartDelay * 10),
      alarm: parseInt(alarmThreshold.value * 10),
      anType: announcerSelect.selectedIndex,
      anRate: parseInt(announcerRate * 10),
      enterRssi: enterRssi,
      exitRssi: exitRssi,
      name: pilotNameInput.value,
      freq2: frequency2,
      enterRssi2: enterRssi2,
      exitRssi2: exitRssi2,
      name2: pilotNameInput2.value,
      ssid: ssidInput.value,
      pwd: pwdInput.value,
    }),
  })
    .then((response) => response.json())
    .then((response) => console.log("/config:" + JSON.stringify(response)));
}

function populateFreqOutput(node) {
  if (node === 1) {
    let band = bandSelect.options[bandSelect.selectedIndex].value;
    let chan = channelSelect.options[channelSelect.selectedIndex].value;
    frequency = freqLookup[bandSelect.selectedIndex][channelSelect.selectedIndex];
    freqOutput.textContent = band + chan + " " + frequency;
  } else if (node === 2) {
    let band = bandSelect2.options[bandSelect2.selectedIndex].value;
    let chan = channelSelect2.options[channelSelect2.selectedIndex].value;
    frequency2 = freqLookup[bandSelect2.selectedIndex][channelSelect2.selectedIndex];
    freqOutput2.textContent = band + chan + " " + frequency2;
  }
}

// Event listeners for Node 1 band/channel changes
bandSelect.addEventListener("change", function() {
  populateFreqOutput(1);
});

channelSelect.addEventListener("change", function() {
  populateFreqOutput(1);
});

// Event listeners for Node 2 band/channel changes
bandSelect2.addEventListener("change", function() {
  populateFreqOutput(2);
});

channelSelect2.addEventListener("change", function() {
  populateFreqOutput(2);
});

function updateAnnouncerRate(obj, value) {
  announcerRate = parseFloat(value);
  $(obj).parent().find("span").text(announcerRate.toFixed(1));
}

function updateMinLap(obj, value) {
  $(obj)
    .parent()
    .find("span")
    .text(parseFloat(value).toFixed(1) + "s");
}

function updateRaceStartDelay(obj, value) {
  raceStartDelay = parseFloat(value);
  $(obj)
    .parent()
    .find("span")
    .text(raceStartDelay.toFixed(1) + "s");
}

function updateAlarmThreshold(obj, value) {
  $(obj)
    .parent()
    .find("span")
    .text(parseFloat(value).toFixed(1) + "v");
}

// function getAnnouncerVoices() {
//   $().articulate("getVoices", "#voiceSelect", "System Default Announcer Voice");
// }

function beep(duration, frequency, type) {
  var context = new AudioContext();
  var oscillator = context.createOscillator();
  oscillator.type = type;
  oscillator.frequency.value = frequency;
  oscillator.connect(context.destination);
  oscillator.start();
  // Beep for 500 milliseconds
  setTimeout(function () {
    oscillator.stop();
  }, duration);
}

function addLap(lapStr, node = 1) {
  const pilotName = node === 1 ? pilotNameInput.value : pilotNameInput2.value;
  const tableId = node === 1 ? "lapTable" : "lapTable2";
  var last2lapStr = "";
  var last3lapStr = "";
  const newLap = parseFloat(lapStr);
  
  if (node === 1) {
    lapNo += 1;
    const table = document.getElementById(tableId);
    const row = table.insertRow();
    const cell1 = row.insertCell(0);
    const cell2 = row.insertCell(1);
    const cell3 = row.insertCell(2);
    cell1.innerHTML = lapNo;
    if (lapNo == 0) {
      cell2.innerHTML = "Hole Shot: " + lapStr + "s";
    } else {
      cell2.innerHTML = lapStr + "s";
    }
    // Calculate 2-lap time for announcer (not displayed in table)
    if (lapTimes.length >= 2 && lapNo != 0) {
      last2lapStr = (newLap + lapTimes[lapTimes.length - 1]).toFixed(2);
    }
    // Calculate and display 3-lap time
    if (lapTimes.length >= 3 && lapNo != 0) {
      last3lapStr = (newLap + lapTimes[lapTimes.length - 2] + lapTimes[lapTimes.length - 1]).toFixed(2);
      cell3.innerHTML = last3lapStr + "s";
    }
    lapTimes.push(newLap);
  } else {
    lapNo2 += 1;
    const table = document.getElementById(tableId);
    const row = table.insertRow();
    const cell1 = row.insertCell(0);
    const cell2 = row.insertCell(1);
    const cell3 = row.insertCell(2);
    cell1.innerHTML = lapNo2;
    if (lapNo2 == 0) {
      cell2.innerHTML = "Hole Shot: " + lapStr + "s";
    } else {
      cell2.innerHTML = lapStr + "s";
    }
    // Calculate 2-lap time for announcer (not displayed in table)
    if (lapTimes2.length >= 2 && lapNo2 != 0) {
      last2lapStr = (newLap + lapTimes2[lapTimes2.length - 1]).toFixed(2);
    }
    // Calculate and display 3-lap time
    if (lapTimes2.length >= 3 && lapNo2 != 0) {
      last3lapStr = (newLap + lapTimes2[lapTimes2.length - 2] + lapTimes2[lapTimes2.length - 1]).toFixed(2);
      cell3.innerHTML = last3lapStr + "s";
    }
    lapTimes2.push(newLap);
  }

  const currentLapNo = node === 1 ? lapNo : lapNo2;
  switch (announcerSelect.options[announcerSelect.selectedIndex].value) {
    case "beep":
      beep(100, 330, "square");
      break;
    case "1lap":
      if (currentLapNo == 0) {
        queueSpeak(`<p>Hole Shot ${lapStr}<p>`);
      } else {
        const lapNoStr = pilotName + " Lap " + currentLapNo + ", ";
        const text = "<p>" + lapNoStr + lapStr + "</p>";
        queueSpeak(text);
      }
      break;
    case "2lap":
      if (currentLapNo == 0) {
        queueSpeak(`<p>Hole Shot ${lapStr}<p>`);
      } else if (last2lapStr != "") {
        const text2 = "<p>" + pilotName + " 2 laps " + last2lapStr + "</p>";
        queueSpeak(text2);
      }
      break;
    case "3lap":
      if (currentLapNo == 0) {
        queueSpeak(`<p>Hole Shot ${lapStr}<p>`);
      } else if (last3lapStr != "") {
        const text3 = "<p>" + pilotName + " 3 laps " + last3lapStr + "</p>";
        queueSpeak(text3);
      }
      break;
    default:
      break;
  }
}

function startTimer(node = 0) {
  if (!timerInterval) {
    var millis = 0;
    var seconds = 0;
    var minutes = 0;
    timerInterval = setInterval(function () {
      millis += 1;

      if (millis == 100) {
        millis = 0;
        seconds++;

        if (seconds == 60) {
          seconds = 0;
          minutes++;

          if (minutes == 60) {
            minutes = 0;
          }
        }
      }
      let m = minutes < 10 ? "0" + minutes : minutes;
      let s = seconds < 10 ? "0" + seconds : seconds;
      let ms = millis < 10 ? "0" + millis : millis;
      timer.innerHTML = `${m}:${s}:${ms}s`;
    }, 10);
  }

  const body = node ? `node=${node}` : "";
  fetch("/timer/start?" + body, {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
  })
    .then((response) => response.json())
    .then((response) => console.log("/timer/start:" + JSON.stringify(response)));
}

function queueSpeak(obj) {
  if (!audioEnabled) {
    return;
  }
  speakObjsQueue.push(obj);
}

async function enableAudioLoop() {
  audioEnabled = true;
  while(audioEnabled) {
    if (speakObjsQueue.length > 0) {
      let isSpeakingFlag = $().articulate('isSpeaking');
      if (!isSpeakingFlag) {
        let obj = speakObjsQueue.shift();
        doSpeak(obj);
      }
    }
    await new Promise((r) => setTimeout(r, 100));
  }
}

function disableAudioLoop() {
  audioEnabled = false;
}
function generateAudio() {
  if (!audioEnabled) {
    return;
  }

  const pilotName = pilotNameInput.value;
  queueSpeak('<div>testing sound for pilot ' + pilotName + '</div>');
  for (let i = 1; i <= 3; i++) {
    queueSpeak('<div>' + i + '</div>')
  }
}

function doSpeak(obj) {
  $(obj).articulate("rate", announcerRate).articulate('speak');
}

async function startRace(node = 0) {
  if (!node) {
    startRaceButton.disabled = true;
    
    if (raceStartDelay > 0) {
      // Calculate time taken to say starting phrase
      const baseWordsPerMinute = 150;
      let baseWordsPerSecond = baseWordsPerMinute / 60;
      let wordsPerSecond = baseWordsPerSecond * announcerRate;
      // 3 words in "Arm your quad"
      let timeToSpeak1 = 3 / wordsPerSecond * 1000; 
      queueSpeak("<p>Arm your quad</p>");
      await new Promise((r) => setTimeout(r, timeToSpeak1));
      // 8 words in "Starting on the tone in less than five"
      let timeToSpeak2 = 8 / wordsPerSecond * 1000; 
      queueSpeak("<p>Starting on the tone in less than five</p>");
      // Use configured delay time (in ms) plus time taken to make previous announcement
      let delayTime = (raceStartDelay * 1000) + timeToSpeak2;
      await new Promise((r) => setTimeout(r, delayTime));
      beep(1, 1, "square"); // needed for some reason to make sure we fire the first beep
      beep(500, 880, "square");
    }
    
    stopRaceButton.disabled = false;
  }
  startTimer(node);
}

function stopRace(node = 0) {
  if (!node) {
    // Stop both nodes
    queueSpeak('<p>Race stopped</p>');
    clearInterval(timerInterval);
    timerInterval = null;
    timer.innerHTML = "00:00:00s";
    stopRaceButton.disabled = true;
    startRaceButton.disabled = false;
    lapNo = -1;
    lapTimes = [];
    lapNo2 = -1;
    lapTimes2 = [];
  } else {
    // Stopping individual node - also stop timer if both nodes are now stopped
    if (timerInterval) {
      clearInterval(timerInterval);
      timerInterval = null;
      timer.innerHTML = "00:00:00s";
    }
  }

  const body = node ? `node=${node}` : "";
  fetch("/timer/stop?" + body, {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
  })
    .then((response) => response.json())
    .then((response) => console.log("/timer/stop:" + JSON.stringify(response)));
    
  if (node === 1) {
    lapNo = -1;
    lapTimes = [];
  } else if (node === 2) {
    lapNo2 = -1;
    lapTimes2 = [];
  }
}

function clearLaps() {
  var tableHeaderRowCount = 1;
  var rowCount = lapTable.rows.length;
  for (var i = tableHeaderRowCount; i < rowCount; i++) {
    lapTable.deleteRow(tableHeaderRowCount);
  }
  var rowCount2 = lapTable2.rows.length;
  for (var i = tableHeaderRowCount; i < rowCount2; i++) {
    lapTable2.deleteRow(tableHeaderRowCount);
  }
  lapNo = -1;
  lapTimes = [];
  lapNo2 = -1;
  lapTimes2 = [];
}

if (!!window.EventSource) {
  var source = new EventSource("/events");

  source.addEventListener(
    "open",
    function (e) {
      console.log("Events Connected");
    },
    false
  );

  source.addEventListener(
    "error",
    function (e) {
      if (e.target.readyState != EventSource.OPEN) {
        console.log("Events Disconnected");
      }
    },
    false
  );

  source.addEventListener(
    "rssi",
    function (e) {
      try {
        const data = JSON.parse(e.data);
        if (data.node === 1) {
          rssiBuffer.push(data.rssi);
          if (rssiBuffer.length > 10) {
            rssiBuffer.shift();
          }
          console.log("rssi node 1:", data.rssi, "buffer size", rssiBuffer.length);
        } else if (data.node === 2) {
          rssiBuffer2.push(data.rssi);
          if (rssiBuffer2.length > 10) {
            rssiBuffer2.shift();
          }
          console.log("rssi node 2:", data.rssi, "buffer size", rssiBuffer2.length);
        }
      } catch (error) {
        console.error("Error parsing RSSI:", error);
      }
    },
    false
  );

  source.addEventListener(
    "lap",
    function (e) {
      try {
        const data = JSON.parse(e.data);
        var lap = (parseFloat(data.time) / 1000).toFixed(2);
        console.log("lap node", data.node, "raw:", data.time, " formatted:", lap);
        // Use requestAnimationFrame to ensure immediate DOM update
        requestAnimationFrame(() => {
          addLap(lap, data.node);
        });
      } catch (error) {
        console.error("Error parsing lap:", error);
      }
    },
    false
  );
}

function setBandChannelIndex(freq, node) {
  for (var i = 0; i < freqLookup.length; i++) {
    for (var j = 0; j < freqLookup[i].length; j++) {
      if (freqLookup[i][j] == freq) {
        if (node === 1) {
          bandSelect.selectedIndex = i;
          channelSelect.selectedIndex = j;
        } else if (node === 2) {
          bandSelect2.selectedIndex = i;
          channelSelect2.selectedIndex = j;
        }
      }
    }
  }
}
