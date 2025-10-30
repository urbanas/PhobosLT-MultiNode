#include "debug.h"
#include "led.h"
#include "webserver.h"
#include <ElegantOTA.h>

static RX5808 rx1(PIN_RX5808_RSSI, PIN_RX5808_DATA, PIN_RX5808_SELECT, PIN_RX5808_CLOCK);
static RX5808 rx2(PIN_RX5808_2_RSSI, PIN_RX5808_2_DATA, PIN_RX5808_2_SELECT, PIN_RX5808_2_CLOCK);
static Config config;
static Webserver ws;
static Buzzer buzzer;
static Led led;
static LapTimer timer1;
static LapTimer timer2;
static BatteryMonitor monitor;

static TaskHandle_t xTimerTask = NULL;

static void parallelTask(void *pvArgs) {
    for (;;) {
        uint32_t currentTimeMs = millis();
        buzzer.handleBuzzer(currentTimeMs);
        led.handleLed(currentTimeMs);
        ws.handleWebUpdate(currentTimeMs);
        config.handleEeprom(currentTimeMs);
        rx1.handleFrequencyChange(currentTimeMs, config.getFrequency());
        rx2.handleFrequencyChange(currentTimeMs, config.getFrequency2());
        monitor.checkBatteryState(currentTimeMs, config.getAlarmThreshold());
        buzzer.handleBuzzer(currentTimeMs);
        led.handleLed(currentTimeMs);
    }
}

static void initParallelTask() {
    disableCore0WDT();
    xTaskCreatePinnedToCore(parallelTask, "parallelTask", 3000, NULL, 0, &xTimerTask, 0);
}

void setup() {
    DEBUG_INIT;
    config.init();
    rx1.init();
    rx2.init();
    buzzer.init(PIN_BUZZER, BUZZER_INVERTED);
    led.init(PIN_LED, false);
    timer1.init(&config, &rx1, &buzzer, &led);
    timer2.init(&config, &rx2, &buzzer, &led);
    monitor.init(PIN_VBAT, VBAT_SCALE, VBAT_ADD, &buzzer, &led);
    ws.init(&config, &timer1, &timer2, &monitor, &buzzer, &led);
    led.on(400);
    buzzer.beep(200);
    initParallelTask();
}

void loop() {
    uint32_t currentTimeMs = millis();
    timer1.handleLapTimerUpdate(currentTimeMs);
    timer2.handleLapTimerUpdate(currentTimeMs);
    ElegantOTA.loop();
}
