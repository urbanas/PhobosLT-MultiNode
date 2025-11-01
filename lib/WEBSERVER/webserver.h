#include <WiFi.h>
#include <ESPAsyncWebServer.h>

#include "battery.h"
#include "laptimer.h"

#define WIFI_CONNECTION_TIMEOUT_MS 30000
#define WIFI_RECONNECT_TIMEOUT_MS 500
#define WEB_RSSI_SEND_TIMEOUT_MS 200

// Forward declarations for webserver internal types
class AsyncWebServer;
class AsyncEventSource;
class DNSServer;

class Webserver {
   public:
    void init(Config *config, LapTimer *lapTimer1, LapTimer *lapTimer2, LapTimer *lapTimer3, LapTimer *lapTimer4, BatteryMonitor *batMonitor, Buzzer *buzzer, Led *l);
    void handleWebUpdate(uint32_t currentTimeMs);

   private:
    void startServices();
    void sendRssiEvent(uint8_t rssi, uint8_t node);
    void sendLaptimeEvent(uint32_t lapTime, uint8_t node);

    Config *conf;
    LapTimer *timer1;
    LapTimer *timer2;
    LapTimer *timer3;
    LapTimer *timer4;
    BatteryMonitor *monitor;
    Buzzer *buz;
    Led *led;

    // WiFi state
    wifi_mode_t wifiMode = WIFI_OFF;
    wl_status_t lastStatus = WL_IDLE_STATUS;
    volatile wifi_mode_t changeMode = WIFI_OFF;
    volatile uint32_t changeTimeMs = 0;
    bool servicesStarted = false;
    bool wifiConnected = false;

    // RSSI streaming state
    bool sendRssi = false;
    uint32_t rssiSentMs = 0;
    
    // Network configuration (moved from statics)
    AsyncWebServer *server = nullptr;
    AsyncEventSource *events = nullptr;
    DNSServer *dnsServer = nullptr;
    IPAddress ipAddress;
    IPAddress netMsk;
    String wifiApSsid;
};
