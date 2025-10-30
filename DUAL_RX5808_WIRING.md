# 📐 Dual RX5808 Wiring Diagram for PhobosLT

This guide explains how to connect **two RX5808 modules** to an ESP32 for simultaneous dual-pilot tracking.

## 🎯 Overview

PhobosLT now supports dual RX5808 modules, allowing you to:
- Track 2 pilots simultaneously
- Measure split times at different track points
- Run backup timing on the same frequency
- Practice with friends using separate timers

---

## 📊 Connection Diagram

```
┌─────────────────────────────────────────────────────────────────────┐
│                         ESP32 (T-ENERGY / DevKit)                   │
└─────────────────────────────────────────────────────────────────────┘
                                  │
        ┌─────────────────────────┼─────────────────────────┐
        │                         │                         │
        │  NODE 1 (PRIMARY)       │  NODE 2 (SECONDARY)     │
        │                         │                         │
┌───────▼────────────┐    ┌───────▼────────────┐
│    RX5808 #1       │    │    RX5808 #2       │
├────────────────────┤    ├────────────────────┤
│ +5V  ◄── 3.3V (33) │    │ +5V  ◄── 3.3V (32) │  ⚠️ Undervolt!
│ GND  ◄── GND       │    │ GND  ◄── GND       │
│ RSSI ──► GPIO 33   │    │ RSSI ──► GPIO 32   │
│ CH1  ◄── GPIO 19   │    │ CH1  ◄── GPIO 25   │
│ CH2  ◄── GPIO 22   │    │ CH2  ◄── GPIO 26   │
│ CH3  ◄── GPIO 23   │    │ CH3  ◄── GPIO 14   │
└────────────────────┘    └────────────────────┘

        PERIPHERALS (Optional but Recommended)
        ┌──────────────────────────────────────┐
        │  LED (any color)                     │
        │  Anode (+) ──► GPIO 21               │
        │  Cathode (-) ──► Resistor ──► GND    │
        └──────────────────────────────────────┘
        
        ┌──────────────────────────────────────┐
        │  Active Buzzer (3.3V-5V)             │
        │  Positive (+) ──► GPIO 27            │
        │  Negative (-) ──► GND                │
        └──────────────────────────────────────┘
        
        ┌──────────────────────────────────────┐
        │  Battery Monitor (for 1S Li-Ion)     │
        │  VBAT (via 1:2 divider) ──► GPIO 35 │
        └──────────────────────────────────────┘
```

---

## 📋 Pin Assignment Table (ESP32 Standard)

| **Connection**        | **ESP32 GPIO** | **RX5808 #1 (Node 1)** | **RX5808 #2 (Node 2)** |
|-----------------------|----------------|------------------------|------------------------|
| **RSSI Output**       | 33 / 32        | RSSI pin               | RSSI pin               |
| **SPI Data (CH1)**    | 19 / 25        | CH1 / DATA pin         | CH1 / DATA pin         |
| **SPI Select (CH2)**  | 22 / 26        | CH2 / SEL pin          | CH2 / SEL pin          |
| **SPI Clock (CH3)**   | 23 / 14        | CH3 / CLK pin          | CH3 / CLK pin          |
| **Power (+5V)**       | **3.3V rail**  | +5V pin ⚠️             | +5V pin ⚠️             |
| **Ground**            | GND            | GND                    | GND                    |

### Peripheral Connections
| **Peripheral**        | **ESP32 GPIO** | **Notes**                          |
|-----------------------|----------------|------------------------------------|
| LED Anode (+)         | 21             | Add current-limiting resistor      |
| Buzzer Positive (+)   | 27             | Active buzzer (3.3V-5V)           |
| Battery Monitor       | 35             | 1:2 voltage divider for 1S Li-Ion |

---

## 🎨 Visual Board Layout

```
                          ┌──── USB ────┐
                          │             │
    ┌─────────────────────┴─────────────┴─────────────────────┐
    │                     ESP32 DEVKIT                         │
    │                                                           │
    │  [3V3]●────────┬────────────────┬──────────► RX#1 +5V   │
    │                └────────────────┴──────────► RX#2 +5V   │
    │  [GND]●────────┬────────────────┬──────────► RX#1 GND   │
    │                └────────────────┴──────────► RX#2 GND   │
    │  [GPIO 33]●────────────────────────────────► RX#1 RSSI  │
    │  [GPIO 32]●────────────────────────────────► RX#2 RSSI  │
    │  [GPIO 19]●────────────────────────────────► RX#1 CH1   │
    │  [GPIO 25]●────────────────────────────────► RX#2 CH1   │
    │  [GPIO 22]●────────────────────────────────► RX#1 CH2   │
    │  [GPIO 26]●────────────────────────────────► RX#2 CH2   │
    │  [GPIO 23]●────────────────────────────────► RX#1 CH3   │
    │  [GPIO 14]●────────────────────────────────► RX#2 CH3   │
    │  [GPIO 21]●────────────────────────────────► LED +      │
    │  [GPIO 27]●────────────────────────────────► BUZZER +   │
    │  [GPIO 35]●────────────────────────────────► VBAT sense │
    │                                                           │
    └───────────────────────────────────────────────────────────┘
```

---

## ⚠️ CRITICAL: RX5808 Undervolting

**Important:** Connect the **+5V pin of BOTH RX5808 modules to the ESP32's 3.3V rail**, not to 5V!

### Why Undervolt?
- ✅ Better RSSI resolution (wider dynamic range)
- ✅ Less heating of the RX5808 modules
- ✅ More stable readings for close-range detection
- ✅ Works perfectly for FPV lap timing

```
  ❌ WRONG:  RX5808 +5V  ──►  ESP32 5V rail
  ✅ RIGHT:  RX5808 +5V  ──►  ESP32 3.3V rail
```

---

## 🔧 Alternative Board Pinouts

### ESP32-C3 Pin Assignments

| **Signal**      | **Node 1 GPIO** | **Node 2 GPIO** |
|-----------------|-----------------|-----------------|
| RSSI            | 3               | 2               |
| CH1 (DATA)      | 6               | 8               |
| CH2 (SELECT)    | 7               | 9               |
| CH3 (CLOCK)     | 4               | 10              |
| LED             | 1               | -               |
| BUZZER          | 5               | -               |
| VBAT            | 0               | -               |

### ESP32-S3 Pin Assignments

| **Signal**      | **Node 1 GPIO** | **Node 2 GPIO** |
|-----------------|-----------------|-----------------|
| RSSI            | 13              | 4               |
| CH1 (DATA)      | 11              | 5               |
| CH2 (SELECT)    | 10              | 6               |
| CH3 (CLOCK)     | 12              | 7               |
| LED             | 2               | -               |
| BUZZER          | 3               | -               |
| VBAT            | 1               | -               |

### LilyGo T-ENERGY / T-CELL

**Good news!** These boards have built-in battery management, so you only need to connect the RX5808 modules and optionally a buzzer. The pinout follows the ESP32 standard shown above.

---

## 🛠️ Prerequisites: SPI Modification

Both RX5808 modules **must have the SPI mod performed** to enable channel switching via software.

### SPI Mod Steps:
1. Locate the SPI pads on the RX5808 PCB (usually on the back)
2. Bridge the appropriate pads with solder
3. Verify continuity with a multimeter

📖 **Detailed SPI Mod Guide**: https://sheaivey.github.io/rx5808-pro-diversity/docs/rx5808-spi-mod.html

⚠️ **Without this mod, the RX5808 will remain locked to its default channel and software tuning won't work!**

---

## 🔌 Step-by-Step Wiring Instructions

### Step 1: Prepare Your Components
- [ ] 2× RX5808 modules (with SPI mod completed)
- [ ] 1× ESP32 board (DevKit, T-ENERGY, C3, or S3)
- [ ] 1× Active buzzer (optional but recommended)
- [ ] 1× LED + resistor (optional)
- [ ] Jumper wires (female-to-female recommended)
- [ ] Power source (USB, battery, or powerbank)

### Step 2: Connect Node 1 (Primary RX5808)
1. **Power:**
   - RX5808 GND → ESP32 GND
   - RX5808 +5V → ESP32 3.3V ⚠️ (not 5V!)
2. **RSSI Signal:**
   - RX5808 RSSI → ESP32 GPIO 33
3. **SPI Control:**
   - RX5808 CH1 (DATA) → ESP32 GPIO 19
   - RX5808 CH2 (SEL) → ESP32 GPIO 22
   - RX5808 CH3 (CLK) → ESP32 GPIO 23

### Step 3: Connect Node 2 (Secondary RX5808)
1. **Power:**
   - RX5808 GND → ESP32 GND (share with Node 1)
   - RX5808 +5V → ESP32 3.3V ⚠️ (not 5V!)
2. **RSSI Signal:**
   - RX5808 RSSI → ESP32 GPIO 32
3. **SPI Control:**
   - RX5808 CH1 (DATA) → ESP32 GPIO 25
   - RX5808 CH2 (SEL) → ESP32 GPIO 26
   - RX5808 CH3 (CLK) → ESP32 GPIO 14

### Step 4: Connect Peripherals (Optional)
1. **Buzzer:**
   - Buzzer (+) → ESP32 GPIO 27
   - Buzzer (-) → ESP32 GND
2. **LED:**
   - LED Anode (+) → 220Ω Resistor → ESP32 GPIO 21
   - LED Cathode (-) → ESP32 GND

### Step 5: Double-Check Everything
- [ ] Both RX5808 modules connected to 3.3V (not 5V)
- [ ] All GND connections secure
- [ ] RSSI pins connected to correct GPIOs (33 and 32)
- [ ] SPI pins (CH1, CH2, CH3) connected correctly
- [ ] No short circuits between adjacent pins
- [ ] Wires secured and not loose

---

## 🧪 Testing Your Setup

### Initial Power-On Test
1. **Flash the firmware:**
   ```bash
   PlatformIO → PhobosLT → General → Upload
   PlatformIO → PhobosLT → Platform → Upload Filesystem Image
   ```

2. **Connect to WiFi:**
   - SSID: `PhobosLT_xxxx`
   - Password: `phoboslt`
   - Open browser to `20.0.0.1`

3. **Go to Calibration tab:**
   - You should see **TWO RSSI graphs**
   - Top graph = Node 1 (GPIO 33)
   - Bottom graph = Node 2 (GPIO 32)

### RSSI Signal Test
1. **Power on a VTx** near RX5808 #1
2. Node 1 graph should spike (blue line goes up)
3. Move VTx near RX5808 #2
4. Node 2 graph should spike

If both graphs respond to VTx proximity, your wiring is correct! ✅

### Channel Switching Test
1. **Go to Configuration tab**
2. Set Node 1 to Band R, Channel 1 (5658 MHz)
3. Set Node 2 to Band R, Channel 8 (5917 MHz)
4. **Save Configuration**
5. **Power on VTx on R1** (5658 MHz)
6. Only Node 1 graph should spike
7. **Change VTx to R8** (5917 MHz)
8. Only Node 2 graph should spike

If channel switching works, the SPI mod is successful! ✅

---

## 💡 Pro Tips & Best Practices

### Wiring Tips
1. **Use short wires** (< 15cm) for clean RSSI readings
2. **Keep modules separated** by at least 5cm to avoid RF interference
3. **Strain relief:** Secure wires with hot glue or zip ties
4. **Color code:** Use consistent wire colors (red=3.3V, black=GND, etc.)
5. **Test continuity:** Use multimeter to verify connections

### Placement Recommendations
1. **Gate placement:** Place both RX5808s side-by-side at start/finish gate
2. **Split timing:** Place Node 1 at start, Node 2 at mid-track checkpoint
3. **Orientation:** RX5808 antennas should point perpendicular to flight path
4. **Height:** Mount at same height as typical drone flight level (1-2m)
5. **Shielding:** Keep away from metal objects that can reflect RF

### Configuration Tips
1. **Different frequencies:** Set nodes to different channels for dual pilot tracking
2. **Same frequency:** Use same channel on both for redundancy/split timing
3. **Pilot names:** Set descriptive names (e.g., "Pilot 1", "Pilot 2") for voice callouts
4. **RSSI calibration:** Calibrate each node independently based on room size
5. **Test thoroughly:** Run practice laps before actual racing

### Troubleshooting
| **Problem**                    | **Solution**                                      |
|--------------------------------|---------------------------------------------------|
| No RSSI reading on Node 1      | Check GPIO 33 connection and 3.3V power          |
| No RSSI reading on Node 2      | Check GPIO 32 connection and 3.3V power          |
| Can't change channel           | Verify SPI mod completed correctly                |
| Both nodes read same RSSI      | Check RSSI wires aren't swapped or shorted       |
| Erratic RSSI readings          | Shorten wires, check for loose connections       |
| No web interface               | Verify filesystem upload completed successfully   |
| Graphs not updating            | Check browser console for WebSocket errors       |

---

## 📚 Additional Resources

- **Original Project:** [PhobosLT GitHub](https://github.com/phobos-/PhobosLT)
- **RX5808 SPI Mod:** [Detailed Guide](https://sheaivey.github.io/rx5808-pro-diversity/docs/rx5808-spi-mod.html)
- **Discord Community:** [Join for Support](https://discord.gg/D3MgfvsnAw)
- **PlatformIO:** [Getting Started](https://platformio.org/install/ide?install=vscode)

---

## 🎯 Use Cases

### 1. Head-to-Head Racing
- **Setup:** Both nodes on different frequencies
- **Config:** Set pilot names (e.g., "Alice", "Bob")
- **Usage:** Start both timers, race simultaneously
- **Benefit:** Real-time head-to-head comparison

### 2. Split Timing
- **Setup:** Both nodes on same frequency, placed at different track points
- **Config:** Node 1 = "Start Gate", Node 2 = "Checkpoint"
- **Usage:** Measure time between two points on track
- **Benefit:** Identify slow sections of your track

### 3. Practice with Friends
- **Setup:** Each node on different pilot's frequency
- **Config:** Set individual pilot names
- **Usage:** Each pilot gets their own timer and lap table
- **Benefit:** No need for multiple lap timers

### 4. Redundant Timing
- **Setup:** Both nodes on same frequency at same location
- **Config:** Same RSSI thresholds
- **Usage:** Backup in case one module fails
- **Benefit:** Never miss a lap time

---

## ⚙️ Technical Details

### Power Consumption
- ESP32 DevKit: ~80-160mA
- RX5808 @ 3.3V: ~80mA each
- Active Buzzer: ~30mA
- LED: ~20mA
- **Total: ~290-370mA** (can run from USB or 1S Li-Ion)

### RSSI Range
- Typical RSSI values: 0-255 (8-bit ADC)
- At 3.3V power: Better resolution in close range
- Recommended range: 10-50cm for indoor timing

### Update Rate
- RSSI sampling: ~200ms per node
- WebSocket updates: ~200ms
- Lap time precision: 1ms
- Total system latency: <50ms

---

## 🆘 Need Help?

If you encounter issues:

1. **Check this document** first - most common issues are covered
2. **Join the Discord** - Community support available
3. **Open a GitHub issue** - For bugs or feature requests
4. **Double-check wiring** - 90% of issues are wiring-related

---

**Happy Racing! 🏁**

*Last updated: October 30, 2025*
*Compatible with PhobosLT firmware v2.0+ (Dual Node Support)*

