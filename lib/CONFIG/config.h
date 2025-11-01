#include <ArduinoJson.h>
#include <AsyncJson.h>
#include <stdint.h>

/*
## Pinout ##
| ESP32 | RX5880 |
| :------------- |:-------------|
| 33 | RSSI |
| GND | GND |
| 19 | CH1 |
| 22 | CH2 |
| 23 | CH3 |
| 3V3 | +5V |

* **Led** goes to pin 21 and GND
* The optional **Buzzer** goes to pin 25 or 27 and GND

*/

//ESP23-C3
#if defined(ESP32C3)

#define PIN_LED 1
#define PIN_VBAT 0
#define VBAT_SCALE 2
#define VBAT_ADD 2
#define PIN_RX5808_RSSI 3
#define PIN_RX5808_DATA 6     //CH1
#define PIN_RX5808_SELECT 7   //CH2
#define PIN_RX5808_CLOCK 4    //CH3
#define PIN_RX5808_2_RSSI 2
#define PIN_RX5808_2_DATA 8
#define PIN_RX5808_2_SELECT 9
#define PIN_RX5808_2_CLOCK 10
#define PIN_RX5808_3_RSSI 20
#define PIN_RX5808_3_DATA 6   // Shared DATA with Node 1 & 2
#define PIN_RX5808_3_SELECT 21
#define PIN_RX5808_3_CLOCK 4  // Shared CLOCK with Node 1 & 2
#define PIN_RX5808_4_RSSI 19
#define PIN_RX5808_4_DATA 6   // Shared DATA with Node 1, 2 & 3
#define PIN_RX5808_4_SELECT 18
#define PIN_RX5808_4_CLOCK 4  // Shared CLOCK with Node 1, 2 & 3
#define PIN_BUZZER 5
#define BUZZER_INVERTED false

//ESP32-S3
#elif defined(ESP32S3)

#define PIN_LED 2
#define PIN_VBAT 1
#define VBAT_SCALE 2
#define VBAT_ADD 2
#define PIN_RX5808_RSSI 13
#define PIN_RX5808_DATA 11     //CH1
#define PIN_RX5808_SELECT 10   //CH2
#define PIN_RX5808_CLOCK 12    //CH3
#define PIN_RX5808_2_RSSI 4
#define PIN_RX5808_2_DATA 5
#define PIN_RX5808_2_SELECT 6
#define PIN_RX5808_2_CLOCK 7
#define PIN_RX5808_3_RSSI 8
#define PIN_RX5808_3_DATA 11  // Shared DATA with Node 1 & 2
#define PIN_RX5808_3_SELECT 9
#define PIN_RX5808_3_CLOCK 12 // Shared CLOCK with Node 1 & 2
#define PIN_RX5808_4_RSSI 14
#define PIN_RX5808_4_DATA 11  // Shared DATA with Node 1, 2 & 3
#define PIN_RX5808_4_SELECT 15
#define PIN_RX5808_4_CLOCK 12 // Shared CLOCK with Node 1, 2 & 3
#define PIN_BUZZER 3
#define BUZZER_INVERTED false

//ESP32
#else

#define PIN_LED 21
#define PIN_VBAT 35
#define VBAT_SCALE 2
#define VBAT_ADD 2
#define PIN_RX5808_RSSI 33
#define PIN_RX5808_DATA 19   //CH1
#define PIN_RX5808_SELECT 22 //CH2
#define PIN_RX5808_CLOCK 23  //CH3
#define PIN_RX5808_2_RSSI 32
#define PIN_RX5808_2_DATA 25
#define PIN_RX5808_2_SELECT 26
#define PIN_RX5808_2_CLOCK 14
#define PIN_RX5808_3_RSSI 34
#define PIN_RX5808_3_DATA 19  // Shared DATA with Node 1 & 2
#define PIN_RX5808_3_SELECT 18
#define PIN_RX5808_3_CLOCK 23 // Shared CLOCK with Node 1 & 2
#define PIN_RX5808_4_RSSI 36
#define PIN_RX5808_4_DATA 19  // Shared DATA with Node 1, 2 & 3
#define PIN_RX5808_4_SELECT 17
#define PIN_RX5808_4_CLOCK 23 // Shared CLOCK with Node 1, 2 & 3
#define PIN_BUZZER 27
#define BUZZER_INVERTED false

#endif

#define EEPROM_RESERVED_SIZE 256
#define CONFIG_MAGIC_MASK (0b11U << 30)
#define CONFIG_MAGIC (0b01U << 30)
#define CONFIG_VERSION 0U

#define EEPROM_CHECK_TIME_MS 1000

typedef struct {
    uint32_t version;
    uint16_t frequency;
    uint8_t minLap;
    uint8_t raceStartDelay;
    uint8_t alarm;
    uint8_t announcerType;
    uint8_t announcerRate;
    uint8_t enterRssi;
    uint8_t exitRssi;
    char pilotName[21];
    uint16_t frequency2;
    uint8_t enterRssi2;
    uint8_t exitRssi2;
    char pilotName2[21];
    uint16_t frequency3;
    uint8_t enterRssi3;
    uint8_t exitRssi3;
    char pilotName3[21];
    uint16_t frequency4;
    uint8_t enterRssi4;
    uint8_t exitRssi4;
    char pilotName4[21];
    uint8_t activeNodeCount;  // Number of active nodes (1-4)
    char ssid[33];
    char password[33];
} laptimer_config_t;

class Config {
   public:
    void init();
    void load();
    void write();
    void toJson(AsyncResponseStream& destination);
    void toJsonString(char* buf);
    void fromJson(JsonObject source);
    void handleEeprom(uint32_t currentTimeMs);

    // getters and setters
    uint16_t getFrequency();
    uint16_t getFrequency2();
    uint16_t getFrequency3();
    uint16_t getFrequency4();
    uint32_t getMinLapMs();
    uint32_t getRaceStartDelayMs();
    uint8_t getAlarmThreshold();
    uint8_t getEnterRssi();
    uint8_t getExitRssi();
    uint8_t getEnterRssi2();
    uint8_t getExitRssi2();
    uint8_t getEnterRssi3();
    uint8_t getExitRssi3();
    uint8_t getEnterRssi4();
    uint8_t getExitRssi4();
    uint8_t getActiveNodeCount();
    char* getSsid();
    char* getPassword();

   private:
    laptimer_config_t conf;
    bool modified;
    volatile uint32_t checkTimeMs = 0;
    void setDefaults();
    void populateJsonDocument(JsonDocument& doc);
};
