#include "debug.h"
#include "led.h"
#include "webserver.h"
#include <ElegantOTA.h>

// Task configuration
#define PARALLEL_TASK_STACK_SIZE 3000
#define PARALLEL_TASK_PRIORITY 0
#define PARALLEL_TASK_CORE 0
#define PARALLEL_TASK_DELAY_MS 1

// Timing constants
#define STARTUP_BEEP_DURATION_MS 200
#define STARTUP_LED_DURATION_MS 400

static RX5808 rx1(PIN_RX5808_RSSI, PIN_RX5808_DATA, PIN_RX5808_SELECT, PIN_RX5808_CLOCK);
static RX5808 rx2(PIN_RX5808_2_RSSI, PIN_RX5808_2_DATA, PIN_RX5808_2_SELECT, PIN_RX5808_2_CLOCK);
static RX5808 rx3(PIN_RX5808_3_RSSI, PIN_RX5808_3_DATA, PIN_RX5808_3_SELECT, PIN_RX5808_3_CLOCK);
static RX5808 rx4(PIN_RX5808_4_RSSI, PIN_RX5808_4_DATA, PIN_RX5808_4_SELECT, PIN_RX5808_4_CLOCK);
static Config config;
static Webserver ws;
static Buzzer buzzer;
static Led led;
static LapTimer timer1;
static LapTimer timer2;
static LapTimer timer3;
static LapTimer timer4;
static BatteryMonitor monitor;

static TaskHandle_t xTimerTask = NULL;

static void parallelTask(void *pvArgs) {
    for (;;) {
        uint32_t currentTimeMs = millis();
        buzzer.handleBuzzer(currentTimeMs);
        led.handleLed(currentTimeMs);
        ws.handleWebUpdate(currentTimeMs);
        config.handleEeprom(currentTimeMs);
        
        // Handle frequency changes for all nodes (even if not active - minimal overhead)
        rx1.handleFrequencyChange(currentTimeMs, config.getFrequency());
        rx2.handleFrequencyChange(currentTimeMs, config.getFrequency2());
        rx3.handleFrequencyChange(currentTimeMs, config.getFrequency3());
        rx4.handleFrequencyChange(currentTimeMs, config.getFrequency4());
        
        monitor.checkBatteryState(currentTimeMs, config.getAlarmThreshold());
        delay(PARALLEL_TASK_DELAY_MS);  // Prevent CPU spinning, allows other tasks to run
    }
}

static void initParallelTask() {
    disableCore0WDT();
    xTaskCreatePinnedToCore(parallelTask, "parallelTask", PARALLEL_TASK_STACK_SIZE, NULL, PARALLEL_TASK_PRIORITY, &xTimerTask, PARALLEL_TASK_CORE);
}

void setup() {
    DEBUG_INIT;
    config.init();
    rx1.init();
    rx2.init();
    rx3.init();
    rx4.init();
    buzzer.init(PIN_BUZZER, BUZZER_INVERTED);
    led.init(PIN_LED, false);
    timer1.init(&config, &rx1, &buzzer, &led);
    timer2.init(&config, &rx2, &buzzer, &led);
    timer3.init(&config, &rx3, &buzzer, &led);
    timer4.init(&config, &rx4, &buzzer, &led);
    monitor.init(PIN_VBAT, VBAT_SCALE, VBAT_ADD, &buzzer, &led);
    ws.init(&config, &timer1, &timer2, &timer3, &timer4, &monitor, &buzzer, &led);
    led.on(STARTUP_LED_DURATION_MS);
    buzzer.beep(STARTUP_BEEP_DURATION_MS);
    initParallelTask();
}

void loop() {
    uint32_t currentTimeMs = millis();
    timer1.handleLapTimerUpdate(currentTimeMs);
    timer2.handleLapTimerUpdate(currentTimeMs);
    timer3.handleLapTimerUpdate(currentTimeMs);
    timer4.handleLapTimerUpdate(currentTimeMs);
    ElegantOTA.loop();
}
