// Frequency lookup table for all bands
const freqLookup = [
  [5865, 5845, 5825, 5805, 5785, 5765, 5745, 5725], // Band A
  [5733, 5752, 5771, 5790, 5809, 5828, 5847, 5866], // Band B
  [5705, 5685, 5665, 5645, 5885, 5905, 5925, 5945], // Band E
  [5740, 5760, 5780, 5800, 5820, 5840, 5860, 5880], // Fatshark
  [5658, 5695, 5732, 5769, 5806, 5843, 5880, 5917], // RaceBand
  [5362, 5399, 5436, 5473, 5510, 5547, 5584, 5621], // LowBand
];

// Node state management - initialized after DOM loads
let nodes = {};

// Common elements - initialized after DOM loads
let commonElements = {};

// Common state
let announcerRate = 1.0;
let raceStartDelay = 5.0;
let timerInterval = null;
let rssiSending = false;
let audioEnabled = false;
let speakObjsQueue = [];

// Initialize DOM references and state
function initializeNodes() {
  nodes = {
    1: {
      // DOM element references
      bandSelect: document.getElementById("bandSelect"),
      channelSelect: document.getElementById("channelSelect"),
      freqOutput: document.getElementById("freqOutput"),
      enterRssiInput: document.getElementById("enter"),
      exitRssiInput: document.getElementById("exit"),
      enterRssiSpan: document.getElementById("enterSpan"),
      exitRssiSpan: document.getElementById("exitSpan"),
      pilotNameInput: document.getElementById("pname"),
      pilotNameDisplay: document.getElementById("pilot1Name"),
      lapTable: document.getElementById("lapTable"),
      chartCanvas: document.getElementById("rssiChart"),
      // State variables
      enterRssi: 120,
      exitRssi: 100,
      frequency: 0,
      lapNo: -1,
      lapTimes: [],
      rssiBuffer: [],
      rssiValue: 0,
      crossing: false,
      rssiSeries: new TimeSeries(),
      rssiCrossingSeries: new TimeSeries(),
      maxRssiValue: 130,
      minRssiValue: 90,
      rssiChart: null,
    },
    2: {
      // DOM element references
      bandSelect: document.getElementById("bandSelect2"),
      channelSelect: document.getElementById("channelSelect2"),
      freqOutput: document.getElementById("freqOutput2"),
      enterRssiInput: document.getElementById("enter2"),
      exitRssiInput: document.getElementById("exit2"),
      enterRssiSpan: document.getElementById("enterSpan2"),
      exitRssiSpan: document.getElementById("exitSpan2"),
      pilotNameInput: document.getElementById("pname2"),
      pilotNameDisplay: document.getElementById("pilot2Name"),
      lapTable: document.getElementById("lapTable2"),
      chartCanvas: document.getElementById("rssiChart2"),
      // State variables
      enterRssi: 120,
      exitRssi: 100,
      frequency: 0,
      lapNo: -1,
      lapTimes: [],
      rssiBuffer: [],
      rssiValue: 0,
      crossing: false,
      rssiSeries: new TimeSeries(),
      rssiCrossingSeries: new TimeSeries(),
      maxRssiValue: 130,
      minRssiValue: 90,
      rssiChart: null,
    },
    3: {
      // DOM element references
      bandSelect: document.getElementById("bandSelect3"),
      channelSelect: document.getElementById("channelSelect3"),
      freqOutput: document.getElementById("freqOutput3"),
      enterRssiInput: document.getElementById("enter3"),
      exitRssiInput: document.getElementById("exit3"),
      enterRssiSpan: document.getElementById("enterSpan3"),
      exitRssiSpan: document.getElementById("exitSpan3"),
      pilotNameInput: document.getElementById("pname3"),
      pilotNameDisplay: document.getElementById("pilot3Name"),
      lapTable: document.getElementById("lapTable3"),
      chartCanvas: document.getElementById("rssiChart3"),
      // State variables
      enterRssi: 120,
      exitRssi: 100,
      frequency: 0,
      lapNo: -1,
      lapTimes: [],
      rssiBuffer: [],
      rssiValue: 0,
      crossing: false,
      rssiSeries: new TimeSeries(),
      rssiCrossingSeries: new TimeSeries(),
      maxRssiValue: 130,
      minRssiValue: 90,
      rssiChart: null,
    },
    4: {
      // DOM element references
      bandSelect: document.getElementById("bandSelect4"),
      channelSelect: document.getElementById("channelSelect4"),
      freqOutput: document.getElementById("freqOutput4"),
      enterRssiInput: document.getElementById("enter4"),
      exitRssiInput: document.getElementById("exit4"),
      enterRssiSpan: document.getElementById("enterSpan4"),
      exitRssiSpan: document.getElementById("exitSpan4"),
      pilotNameInput: document.getElementById("pname4"),
      pilotNameDisplay: document.getElementById("pilot4Name"),
      lapTable: document.getElementById("lapTable4"),
      chartCanvas: document.getElementById("rssiChart4"),
      // State variables
      enterRssi: 120,
      exitRssi: 100,
      frequency: 0,
      lapNo: -1,
      lapTimes: [],
      rssiBuffer: [],
      rssiValue: 0,
      crossing: false,
      rssiSeries: new TimeSeries(),
      rssiCrossingSeries: new TimeSeries(),
      maxRssiValue: 130,
      minRssiValue: 90,
      rssiChart: null,
    }
  };

  commonElements = {
    announcerSelect: document.getElementById("announcerSelect"),
    announcerRateInput: document.getElementById("rate"),
    ssidInput: document.getElementById("ssid"),
    pwdInput: document.getElementById("pwd"),
    minLapInput: document.getElementById("minLap"),
    raceStartDelayInput: document.getElementById("raceStartDelay"),
    alarmThreshold: document.getElementById("alarmThreshold"),
    activeNodeCountSelect: document.getElementById("activeNodeCount"),
    timer: document.getElementById("timer"),
    startRaceButton: document.getElementById("startRaceButton"),
    stopRaceButton: document.getElementById("stopRaceButton"),
    batteryVoltageDisplay: document.getElementById("bvolt"),
    config: document.getElementById("config"),
    race: document.getElementById("race"),
    calib: document.getElementById("calib"),
  };
}

// Initialize application on load
onload = function (e) {
  // Initialize DOM references first
  initializeNodes();
  
  commonElements.config.style.display = "block";
  commonElements.race.style.display = "none";
  commonElements.calib.style.display = "none";
  
  // Enable voice by default
  enableAudioLoop();
  
  loadConfiguration();
  setupEventListeners();
};

// Update visibility of nodes based on activeNodeCount
function updateActiveNodeCount(count) {
  const nodeCount = parseInt(count);
  
  // Get all elements with node-3 and node-4 classes
  const node3Elements = document.querySelectorAll('.node-3');
  const node4Elements = document.querySelectorAll('.node-4');
  
  // Show/hide node 3 elements
  node3Elements.forEach(el => {
    if (nodeCount >= 3) {
      el.classList.add('visible');
    } else {
      el.classList.remove('visible');
    }
  });
  
  // Show/hide node 4 elements
  node4Elements.forEach(el => {
    if (nodeCount >= 4) {
      el.classList.add('visible');
    } else {
      el.classList.remove('visible');
    }
  });
  
  // Handle node 2 visibility (special case for when only 1 node is selected)
  // Node 2 columns in config table
  const node2ConfigCells = document.querySelectorAll('.node-config-table tbody td:nth-child(2)');
  const node2ConfigHeader = document.querySelectorAll('.node-config-table thead th:nth-child(2)');
  
  node2ConfigCells.forEach(el => {
    el.style.display = nodeCount >= 2 ? '' : 'none';
  });
  node2ConfigHeader.forEach(el => {
    el.style.display = nodeCount >= 2 ? '' : 'none';
  });
  
  // Node 2 in race table
  const node2RaceHeader = document.querySelector('.race-layout-table .pilot-header:nth-child(2)');
  const node2RaceCell = document.querySelector('.race-layout-table .lap-table-cell:nth-child(2)');
  if (node2RaceHeader) node2RaceHeader.style.display = nodeCount >= 2 ? '' : 'none';
  if (node2RaceCell) node2RaceCell.style.display = nodeCount >= 2 ? '' : 'none';
  
  // Node 2 calibration section
  const node2Calib = document.querySelectorAll('.calib-section:nth-of-type(2)');
  node2Calib.forEach(el => {
    el.style.display = nodeCount >= 2 ? '' : 'none';
  });
  
  // Dynamically adjust column widths based on node count
  const configHeaders = document.querySelectorAll('.node-config-table thead th');
  const configCells = document.querySelectorAll('.node-config-table tbody td');
  const raceHeaders = document.querySelectorAll('.race-layout-table .pilot-header');
  const raceCells = document.querySelectorAll('.race-layout-table .lap-table-cell');
  
  const widthMap = {
    1: '100%',
    2: '50%',
    3: '33.333%',
    4: '25%'
  };
  
  const width = widthMap[nodeCount];
  
  // Update config table widths
  configHeaders.forEach((el, index) => {
    if (index < nodeCount) {
      el.style.width = width;
    }
  });
  
  configCells.forEach((el, index) => {
    const colIndex = (index % 4) + 1; // Which column (1-4)
    if (colIndex <= nodeCount) {
      el.style.width = width;
    }
  });
  
  // Update race table widths
  raceHeaders.forEach((el, index) => {
    if (index < nodeCount) {
      el.style.width = width;
    }
  });
  
  raceCells.forEach((el, index) => {
    if (index < nodeCount) {
      el.style.width = width;
    }
  });
  
  // Re-create RSSI charts for visible nodes
  for (let i = 1; i <= 4; i++) {
    if (i <= nodeCount) {
      // Use setTimeout to ensure canvas is visible before creating chart
      setTimeout(() => {
        if (!nodes[i].rssiChart && nodes[i].chartCanvas) {
          console.log(`Creating chart for node ${i}`);
          createRssiChart(i);
        }
      }, 100);
    } else {
      // Stop chart if it exists
      if (nodes[i].rssiChart) {
        nodes[i].rssiChart.stop();
        nodes[i].rssiChart = null;
      }
    }
  }
}

// Load configuration from server
function loadConfiguration() {
  fetch("/config")
    .then((response) => response.json())
    .then((config) => {
      console.log("Loaded config:", config);
      
      // Configure Node 1
      configureNode(1, {
        freq: config.freq,
        enterRssi: config.enterRssi,
        exitRssi: config.exitRssi,
        pilotName: config.name,
      });
      
      // Configure Node 2
      configureNode(2, {
        freq: config.freq2,
        enterRssi: config.enterRssi2,
        exitRssi: config.exitRssi2,
        pilotName: config.name2,
      });
      
      // Configure Node 3
      configureNode(3, {
        freq: config.freq3,
        enterRssi: config.enterRssi3,
        exitRssi: config.exitRssi3,
        pilotName: config.name3,
      });
      
      // Configure Node 4
      configureNode(4, {
        freq: config.freq4,
        enterRssi: config.enterRssi4,
        exitRssi: config.exitRssi4,
        pilotName: config.name4,
      });
      
      // Configure common settings
      commonElements.minLapInput.value = (parseFloat(config.minLap) / 10).toFixed(1);
      
      if (config.raceStartDelay !== undefined) {
        commonElements.raceStartDelayInput.value = (parseFloat(config.raceStartDelay) / 10).toFixed(1);
        raceStartDelay = parseFloat(commonElements.raceStartDelayInput.value);
      }
      
      commonElements.alarmThreshold.value = (parseFloat(config.alarm) / 10).toFixed(1);
      commonElements.announcerSelect.selectedIndex = config.anType;
      commonElements.announcerRateInput.value = (parseFloat(config.anRate) / 10).toFixed(1);
      announcerRate = parseFloat(commonElements.announcerRateInput.value);
      commonElements.ssidInput.value = config.ssid;
      commonElements.pwdInput.value = config.pwd;
      
      // Set active node count and update visibility
      const activeNodeCount = config.activeNodeCount || 2;
      commonElements.activeNodeCountSelect.value = activeNodeCount;
      updateActiveNodeCount(activeNodeCount);
      
      commonElements.stopRaceButton.disabled = true;
      commonElements.startRaceButton.disabled = false;
      clearInterval(timerInterval);
      timerInterval = null;
      commonElements.timer.innerHTML = "00:00:00s";
      
      clearLaps();
      
      // Create RSSI charts for active nodes
      for (let i = 1; i <= activeNodeCount; i++) {
        createRssiChart(i);
      }
    });
}

// Configure a specific node with settings
function configureNode(nodeId, config) {
  const node = nodes[nodeId];
  
  setBandChannelIndex(config.freq, nodeId);
  node.enterRssiInput.value = config.enterRssi;
  updateEnterRssiForNode(nodeId, config.enterRssi);
  node.exitRssiInput.value = config.exitRssi;
  updateExitRssiForNode(nodeId, config.exitRssi);
  node.pilotNameInput.value = config.pilotName;
  node.pilotNameDisplay.textContent = config.pilotName || `Pilot ${nodeId}`;
  populateFreqOutput(nodeId);
}

// Setup all event listeners
function setupEventListeners() {
  // Node 1 event listeners
  nodes[1].bandSelect.addEventListener("change", () => populateFreqOutput(1));
  nodes[1].channelSelect.addEventListener("change", () => populateFreqOutput(1));
  
  // Node 2 event listeners
  nodes[2].bandSelect.addEventListener("change", () => populateFreqOutput(2));
  nodes[2].channelSelect.addEventListener("change", () => populateFreqOutput(2));
  
  // Start battery voltage polling
  setInterval(getBatteryVoltage, 2000);
  
  // Start RSSI chart updates
  setInterval(updateRssiCharts, 200);
  
  // Start event source for lap times and RSSI
  setupEventSource();
}

// Battery voltage monitoring
function getBatteryVoltage() {
  fetch("/status")
    .then((response) => response.text())
    .then((response) => {
      const batteryVoltageMatch = response.match(/Battery Voltage:\s*([\d.]+v)/);
      const batteryVoltage = batteryVoltageMatch ? batteryVoltageMatch[1] : null;
      commonElements.batteryVoltageDisplay.innerText = batteryVoltage;
    });
}

// Update RSSI charts for all nodes
function updateRssiCharts() {
  if (commonElements.calib.style.display !== "none") {
    // Charts are visible, update them
    const activeNodeCount = parseInt(commonElements.activeNodeCountSelect.value);
    for (let nodeId = 1; nodeId <= activeNodeCount; nodeId++) {
      const node = nodes[nodeId];
      if (node.rssiChart) {
        node.rssiChart.start();
      }
      
      if (node.rssiBuffer.length > 0) {
        node.rssiValue = parseInt(node.rssiBuffer.shift());
        
        // Update crossing state
        if (node.crossing && node.rssiValue < node.exitRssi) {
          node.crossing = false;
        } else if (!node.crossing && node.rssiValue > node.enterRssi) {
          node.crossing = true;
        }
        
        // Update min/max values
        node.maxRssiValue = Math.max(node.maxRssiValue, node.rssiValue);
        node.minRssiValue = Math.min(node.minRssiValue, node.rssiValue);
        
        // Only append to chart when we have new data
        const now = Date.now();
        node.rssiSeries.append(now, node.rssiValue);
        if (node.crossing) {
          node.rssiCrossingSeries.append(now, 256);
        } else {
          node.rssiCrossingSeries.append(now, -10);
        }
      }
      
      // Update chart options
      if (node.rssiChart) {
        node.rssiChart.options.horizontalLines = [
          { color: "hsl(8.2, 86.5%, 53.7%)", lineWidth: 1.7, value: node.enterRssi },
          { color: "hsl(25, 85%, 55%)", lineWidth: 1.7, value: node.exitRssi },
        ];
        node.rssiChart.options.maxValue = Math.max(node.maxRssiValue, node.enterRssi + 10);
        node.rssiChart.options.minValue = Math.max(0, Math.min(node.minRssiValue, node.exitRssi - 10));
      }
    }
  } else {
    // Charts hidden, stop them
    const activeNodeCount = parseInt(commonElements.activeNodeCountSelect.value);
    for (let nodeId = 1; nodeId <= activeNodeCount; nodeId++) {
      const node = nodes[nodeId];
      if (node.rssiChart) {
        node.rssiChart.stop();
      }
      node.maxRssiValue = node.enterRssi + 10;
      node.minRssiValue = node.exitRssi - 10;
    }
  }
}

// Create RSSI chart for a node
function createRssiChart(nodeId) {
  const node = nodes[nodeId];
  
  // Check if canvas exists
  if (!node.chartCanvas) {
    console.error(`Canvas for node ${nodeId} not found`);
    return;
  }
  
  // Stop existing chart if any
  if (node.rssiChart) {
    node.rssiChart.stop();
  }
  
  // Force canvas dimensions to ensure it's visible
  node.chartCanvas.style.width = '100%';
  node.chartCanvas.style.height = '250px';
  node.chartCanvas.width = node.chartCanvas.offsetWidth || 800;
  node.chartCanvas.height = 250;
  
  node.rssiChart = new SmoothieChart({
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
    maxValue: node.maxRssiValue,
    minValue: node.minRssiValue,
  });
  
  node.rssiChart.addTimeSeries(node.rssiSeries, {
    lineWidth: 1.7,
    strokeStyle: "hsl(214, 53%, 60%)",
    fillStyle: "hsla(214, 53%, 60%, 0.4)",
  });
  
  node.rssiChart.addTimeSeries(node.rssiCrossingSeries, {
    lineWidth: 1.7,
    strokeStyle: "none",
    fillStyle: "hsla(136, 71%, 70%, 0.3)",
  });
  
  node.rssiChart.streamTo(node.chartCanvas, 200);
}

// Tab management
function openTab(evt, tabName) {
  // Hide all tabs
  const tabcontent = document.getElementsByClassName("tabcontent");
  for (let i = 0; i < tabcontent.length; i++) {
    tabcontent[i].style.display = "none";
  }
  
  // Remove active class from all tabs
  const tablinks = document.getElementsByClassName("tablinks");
  for (let i = 0; i < tablinks.length; i++) {
    tablinks[i].className = tablinks[i].className.replace(" active", "");
  }
  
  // Show current tab and mark as active
  document.getElementById(tabName).style.display = "block";
  evt.currentTarget.className += " active";
  
  // Handle RSSI streaming for calibration tab
  if (tabName === "calib") {
    // Create charts for all active nodes when opening calibration tab
    const activeNodeCount = parseInt(commonElements.activeNodeCountSelect.value);
    
    // Longer delay to ensure DOM is fully updated
    setTimeout(() => {
      for (let i = 1; i <= 4; i++) {
        // Always try to create/recreate charts for active nodes
        if (i <= activeNodeCount) {
          if (nodes[i].chartCanvas) {
            // Stop existing chart
            if (nodes[i].rssiChart) {
              nodes[i].rssiChart.stop();
              nodes[i].rssiChart = null;
            }
            createRssiChart(i);
          } else {
            console.error(`Node ${i} canvas element not found!`);
          }
        } else {
          // Stop charts for inactive nodes
          if (nodes[i].rssiChart) {
            nodes[i].rssiChart.stop();
            nodes[i].rssiChart = null;
          }
        }
      }
    }, 250); // Increased delay
    
    if (!rssiSending) {
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
        .catch((error) => console.error("Error starting RSSI:", error));
    }
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
      .then((response) => console.log("/timer/rssiStop:", JSON.stringify(response)));
  }
}

// RSSI threshold updates - internal function
function updateEnterRssiForNode(nodeId, value) {
  const node = nodes[nodeId];
  node.enterRssi = parseInt(value);
  node.enterRssiSpan.textContent = node.enterRssi;
  
  if (node.enterRssi <= node.exitRssi) {
    node.exitRssi = Math.max(0, node.enterRssi - 1);
    node.exitRssiInput.value = node.exitRssi;
    node.exitRssiSpan.textContent = node.exitRssi;
  }
}

function updateExitRssiForNode(nodeId, value) {
  const node = nodes[nodeId];
  node.exitRssi = parseInt(value);
  node.exitRssiSpan.textContent = node.exitRssi;
  
  if (node.exitRssi >= node.enterRssi) {
    node.enterRssi = Math.min(255, node.exitRssi + 1);
    node.enterRssiInput.value = node.enterRssi;
    node.enterRssiSpan.textContent = node.enterRssi;
  }
}

// HTML compatibility wrappers (called from inline oninput handlers)
function updateEnterRssi(obj, value) {
  updateEnterRssiForNode(1, value);
}

function updateExitRssi(obj, value) {
  updateExitRssiForNode(1, value);
}

function updateEnterRssi2(obj, value) {
  updateEnterRssiForNode(2, value);
}

function updateExitRssi2(obj, value) {
  updateExitRssiForNode(2, value);
}

function updateEnterRssi3(obj, value) {
  updateEnterRssiForNode(3, value);
}

function updateExitRssi3(obj, value) {
  updateExitRssiForNode(3, value);
}

function updateEnterRssi4(obj, value) {
  updateEnterRssiForNode(4, value);
}

function updateExitRssi4(obj, value) {
  updateExitRssiForNode(4, value);
}

// Configuration management
function saveConfig() {
  const saveButton = event.target;
  const originalText = saveButton.textContent;
  const originalColor = saveButton.style.backgroundColor;
  
  // Show saving state
  saveButton.textContent = "Saving...";
  saveButton.disabled = true;
  saveButton.style.backgroundColor = "#FFA500";
  
  fetch("/config", {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      freq: nodes[1].frequency,
      minLap: parseInt(commonElements.minLapInput.value * 10),
      raceStartDelay: parseInt(raceStartDelay * 10),
      alarm: parseInt(commonElements.alarmThreshold.value * 10),
      anType: commonElements.announcerSelect.selectedIndex,
      anRate: parseInt(announcerRate * 10),
      enterRssi: nodes[1].enterRssi,
      exitRssi: nodes[1].exitRssi,
      name: nodes[1].pilotNameInput.value,
      freq2: nodes[2].frequency,
      enterRssi2: nodes[2].enterRssi,
      exitRssi2: nodes[2].exitRssi,
      name2: nodes[2].pilotNameInput.value,
      freq3: nodes[3].frequency,
      enterRssi3: nodes[3].enterRssi,
      exitRssi3: nodes[3].exitRssi,
      name3: nodes[3].pilotNameInput.value,
      freq4: nodes[4].frequency,
      enterRssi4: nodes[4].enterRssi,
      exitRssi4: nodes[4].exitRssi,
      name4: nodes[4].pilotNameInput.value,
      activeNodeCount: parseInt(commonElements.activeNodeCountSelect.value),
      ssid: commonElements.ssidInput.value,
      pwd: commonElements.pwdInput.value,
    }),
  })
    .then((response) => response.json())
    .then((response) => {
      console.log("/config:", JSON.stringify(response));
      
      // Show success state
      saveButton.textContent = "Saved ✓";
      saveButton.style.backgroundColor = "#4CAF50";
      
      // Restore original state after 2 seconds
      setTimeout(() => {
        saveButton.textContent = originalText;
        saveButton.style.backgroundColor = originalColor;
        saveButton.disabled = false;
      }, 2000);
    })
    .catch((error) => {
      console.error("Save error:", error);
      
      // Show error state
      saveButton.textContent = "Error ✗";
      saveButton.style.backgroundColor = "#f44336";
      
      // Restore original state after 2 seconds
      setTimeout(() => {
        saveButton.textContent = originalText;
        saveButton.style.backgroundColor = originalColor;
        saveButton.disabled = false;
      }, 2000);
    });
}

// Frequency management
function populateFreqOutput(nodeId) {
  const node = nodes[nodeId];
  const band = node.bandSelect.options[node.bandSelect.selectedIndex].value;
  const chan = node.channelSelect.options[node.channelSelect.selectedIndex].value;
  node.frequency = freqLookup[node.bandSelect.selectedIndex][node.channelSelect.selectedIndex];
  node.freqOutput.textContent = band + chan + " " + node.frequency;
}

function setBandChannelIndex(freq, nodeId) {
  const node = nodes[nodeId];
  for (let i = 0; i < freqLookup.length; i++) {
    for (let j = 0; j < freqLookup[i].length; j++) {
      if (freqLookup[i][j] == freq) {
        node.bandSelect.selectedIndex = i;
        node.channelSelect.selectedIndex = j;
        populateFreqOutput(nodeId); // Update the frequency display
        return;
      }
    }
  }
}

// Common UI updates
function updateAnnouncerRate(obj, value) {
  announcerRate = parseFloat(value);
}

function updateMinLap(obj, value) {
  // Value is already displayed by the input field
}

function updateRaceStartDelay(obj, value) {
  raceStartDelay = parseFloat(value);
}

function updateAlarmThreshold(obj, value) {
  // Value is already displayed by the input field
}

// Audio functions
function beep(duration, frequency, type) {
  const context = new AudioContext();
  const oscillator = context.createOscillator();
  oscillator.type = type;
  oscillator.frequency.value = frequency;
  oscillator.connect(context.destination);
  oscillator.start();
  setTimeout(function () {
    oscillator.stop();
  }, duration);
}

function queueSpeak(obj) {
  if (!audioEnabled) return;
  speakObjsQueue.push(obj);
}

async function enableAudioLoop() {
  audioEnabled = true;
  updateVoiceButtonState();
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
  updateVoiceButtonState();
}

function toggleVoice() {
  if (audioEnabled) {
    disableAudioLoop();
  } else {
    enableAudioLoop();
  }
}

function updateVoiceButtonState() {
  const toggleButton = document.getElementById("ToggleVoiceButton");
  if (toggleButton) {
    toggleButton.textContent = audioEnabled ? "Voice: ON" : "Voice: OFF";
    toggleButton.style.backgroundColor = audioEnabled ? "#4CAF50" : "#f44336";
  }
}

function generateAudio() {
  if (!audioEnabled) return;
  
  const pilotName = nodes[1].pilotNameInput.value;
  queueSpeak('<div>testing sound for pilot ' + pilotName + '</div>');
  for (let i = 1; i <= 3; i++) {
    queueSpeak('<div>' + i + '</div>')
  }
}

function doSpeak(obj) {
  $(obj).articulate("rate", announcerRate).articulate('speak');
}

// Lap management
function addLap(lapStr, nodeId = 1) {
  const node = nodes[nodeId];
  const pilotName = node.pilotNameInput.value;
  let last2lapStr = "";
  let last3lapStr = "";
  const newLap = parseFloat(lapStr);
  
  node.lapNo += 1;
  const table = node.lapTable;
  const row = table.insertRow();
  const cell1 = row.insertCell(0);
  const cell2 = row.insertCell(1);
  const cell3 = row.insertCell(2);
  
  cell1.innerHTML = node.lapNo;
  if (node.lapNo == 0) {
    cell2.innerHTML = "Hole Shot: " + lapStr + "s";
  } else {
    cell2.innerHTML = lapStr + "s";
  }
  
  // Calculate 2-lap time for announcer (not displayed in table)
  if (node.lapTimes.length >= 2 && node.lapNo != 0) {
    last2lapStr = (newLap + node.lapTimes[node.lapTimes.length - 1]).toFixed(2);
  }
  
  // Calculate and display 3-lap time
  if (node.lapTimes.length >= 3 && node.lapNo != 0) {
    last3lapStr = (newLap + node.lapTimes[node.lapTimes.length - 2] + node.lapTimes[node.lapTimes.length - 1]).toFixed(2);
    cell3.innerHTML = last3lapStr + "s";
  }
  
  node.lapTimes.push(newLap);
  
  // Announce lap time
  const announcerType = commonElements.announcerSelect.options[commonElements.announcerSelect.selectedIndex].value;
  switch (announcerType) {
    case "beep":
      beep(100, 330, "square");
      break;
    case "1lap":
      if (node.lapNo == 0) {
        queueSpeak(`<p>Hole Shot ${lapStr}<p>`);
      } else {
        const lapNoStr = pilotName + " Lap " + node.lapNo + ", ";
        const text = "<p>" + lapNoStr + lapStr + "</p>";
        queueSpeak(text);
      }
      break;
    case "2lap":
      if (node.lapNo == 0) {
        queueSpeak(`<p>Hole Shot ${lapStr}<p>`);
      } else if (last2lapStr != "") {
        const text2 = "<p>" + pilotName + " 2 laps " + last2lapStr + "</p>";
        queueSpeak(text2);
      }
      break;
    case "3lap":
      if (node.lapNo == 0) {
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

function clearLaps() {
  const tableHeaderRowCount = 1;
  
  [1, 2].forEach(nodeId => {
    const node = nodes[nodeId];
    const rowCount = node.lapTable.rows.length;
    for (let i = tableHeaderRowCount; i < rowCount; i++) {
      node.lapTable.deleteRow(tableHeaderRowCount);
    }
    node.lapNo = -1;
    node.lapTimes = [];
  });
}

// Timer management
function startTimer(node = 0) {
  if (!timerInterval) {
    let millis = 0;
    let seconds = 0;
    let minutes = 0;
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
      commonElements.timer.innerHTML = `${m}:${s}:${ms}s`;
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
    .then((response) => console.log("/timer/start:", JSON.stringify(response)));
}

async function startRace(node = 0) {
  if (!node) {
    commonElements.startRaceButton.disabled = true;
    
    if (raceStartDelay > 0) {
      // Check if voice is enabled
      if (audioEnabled) {
        // Calculate time taken to say starting phrase
        const baseWordsPerMinute = 150;
        let baseWordsPerSecond = baseWordsPerMinute / 60;
        let wordsPerSecond = baseWordsPerSecond * announcerRate;
        
        // 3 words in "Arm your quad"
        let timeToSpeak1 = 3 / wordsPerSecond * 1000; 
        queueSpeak("<p>Arm your quad</p>");
        await new Promise((r) => setTimeout(r, timeToSpeak1));
        
        // 8 words in "Starting on the tone in [delay] seconds"
        let timeToSpeak2 = 8 / wordsPerSecond * 1000; 
        queueSpeak(`<p>Starting on the tone in ${raceStartDelay.toFixed(1)} seconds</p>`);
        await new Promise((r) => setTimeout(r, timeToSpeak2));
      }
      
      // Wait for configured delay
      await new Promise((r) => setTimeout(r, raceStartDelay * 1000));
      beep(1, 1, "square"); // needed for some reason to make sure we fire the first beep
      beep(500, 880, "square");
    }
    
    commonElements.stopRaceButton.disabled = false;
  }
  startTimer(node);
}

function stopRace(node = 0) {
  if (!node) {
    // Stop both nodes
    queueSpeak('<p>Race stopped</p>');
    clearInterval(timerInterval);
    timerInterval = null;
    commonElements.timer.innerHTML = "00:00:00s";
    commonElements.stopRaceButton.disabled = true;
    commonElements.startRaceButton.disabled = false;
    nodes[1].lapNo = -1;
    nodes[1].lapTimes = [];
    nodes[2].lapNo = -1;
    nodes[2].lapTimes = [];
  } else {
    // Stopping individual node - also stop timer if both nodes are now stopped
    if (timerInterval) {
      clearInterval(timerInterval);
      timerInterval = null;
      commonElements.timer.innerHTML = "00:00:00s";
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
    .then((response) => console.log("/timer/stop:", JSON.stringify(response)));
    
  if (node === 1) {
    nodes[1].lapNo = -1;
    nodes[1].lapTimes = [];
  } else if (node === 2) {
    nodes[2].lapNo = -1;
    nodes[2].lapTimes = [];
  }
}

// Event source for server-sent events
function setupEventSource() {
  if (!!window.EventSource) {
    const source = new EventSource("/events");

    source.addEventListener("open", function (e) {
      console.log("Events Connected");
    }, false);

    source.addEventListener("error", function (e) {
      if (e.target.readyState != EventSource.OPEN) {
        console.log("Events Disconnected");
      }
    }, false);

    source.addEventListener("rssi", function (e) {
      try {
        const data = JSON.parse(e.data);
        const node = nodes[data.node];
        if (node) {
          node.rssiBuffer.push(data.rssi);
          if (node.rssiBuffer.length > 10) {
            node.rssiBuffer.shift();
          }
          console.log("rssi node", data.node, ":", data.rssi, "buffer size", node.rssiBuffer.length);
        }
      } catch (error) {
        console.error("Error parsing RSSI:", error);
      }
    }, false);

    source.addEventListener("lap", function (e) {
      try {
        const data = JSON.parse(e.data);
        const lap = (parseFloat(data.time) / 1000).toFixed(2);
        console.log("lap node", data.node, "raw:", data.time, " formatted:", lap);
        // Use requestAnimationFrame to ensure immediate DOM update
        requestAnimationFrame(() => {
          addLap(lap, data.node);
        });
      } catch (error) {
        console.error("Error parsing lap:", error);
      }
    }, false);
  }
}

