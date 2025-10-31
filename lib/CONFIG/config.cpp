#include "config.h"

#include <EEPROM.h>

#include "debug.h"

void Config::init(void) {
    if (sizeof(laptimer_config_t) > EEPROM_RESERVED_SIZE) {
        DEBUG("Config size too big, adjust reserved EEPROM size\n");
        return;
    }

    EEPROM.begin(EEPROM_RESERVED_SIZE);  // Size of EEPROM
    load();                              // Override default settings from EEPROM

    checkTimeMs = millis();

    DEBUG("EEPROM Init Successful\n");
}

void Config::load(void) {
    modified = false;
    EEPROM.get(0, conf);

    uint32_t version = 0xFFFFFFFF;
    if ((conf.version & CONFIG_MAGIC_MASK) == CONFIG_MAGIC) {
        version = conf.version & ~CONFIG_MAGIC_MASK;
    }

    // If version is not current, reset to defaults
    if (version != CONFIG_VERSION) {
        setDefaults();
    }
}

void Config::write(void) {
    if (!modified) return;

    DEBUG("Writing to EEPROM\n");

    EEPROM.put(0, conf);
    EEPROM.commit();

    DEBUG("Writing to EEPROM done\n");

    modified = false;
}

void Config::populateJsonDocument(JsonDocument& config) {
    config["freq"] = conf.frequency;
    config["minLap"] = conf.minLap;
    config["raceStartDelay"] = conf.raceStartDelay;
    config["alarm"] = conf.alarm;
    config["anType"] = conf.announcerType;
    config["anRate"] = conf.announcerRate;
    config["enterRssi"] = conf.enterRssi;
    config["exitRssi"] = conf.exitRssi;
    config["name"] = conf.pilotName;
    config["freq2"] = conf.frequency2;
    config["enterRssi2"] = conf.enterRssi2;
    config["exitRssi2"] = conf.exitRssi2;
    config["name2"] = conf.pilotName2;
    config["ssid"] = conf.ssid;
    config["pwd"] = conf.password;
}

void Config::toJson(AsyncResponseStream& destination) {
    // Use https://arduinojson.org/v7/assistant to estimate memory
    JsonDocument config;
    populateJsonDocument(config);
    serializeJson(config, destination);
}

void Config::toJsonString(char* buf) {
    JsonDocument config;
    populateJsonDocument(config);
    serializeJsonPretty(config, buf, 512);
}

void Config::fromJson(JsonObject source) {
    if (source["freq"] != conf.frequency) {
        conf.frequency = source["freq"];
        modified = true;
    }
    if (source["minLap"] != conf.minLap) {
        conf.minLap = source["minLap"];
        modified = true;
    }
    if (source["raceStartDelay"] != conf.raceStartDelay) {
        conf.raceStartDelay = source["raceStartDelay"];
        modified = true;
    }
    if (source["alarm"] != conf.alarm) {
        conf.alarm = source["alarm"];
        modified = true;
    }
    if (source["anType"] != conf.announcerType) {
        conf.announcerType = source["anType"];
        modified = true;
    }
    if (source["anRate"] != conf.announcerRate) {
        conf.announcerRate = source["anRate"];
        modified = true;
    }
    if (source["enterRssi"] != conf.enterRssi) {
        conf.enterRssi = source["enterRssi"];
        modified = true;
    }
    if (source["exitRssi"] != conf.exitRssi) {
        conf.exitRssi = source["exitRssi"];
        modified = true;
    }
    if (source["name"] != conf.pilotName) {
        strlcpy(conf.pilotName, source["name"] | "", sizeof(conf.pilotName));
        modified = true;
    }
    if (source["freq2"] != conf.frequency2) {
        conf.frequency2 = source["freq2"];
        modified = true;
    }
    if (source["enterRssi2"] != conf.enterRssi2) {
        conf.enterRssi2 = source["enterRssi2"];
        modified = true;
    }
    if (source["exitRssi2"] != conf.exitRssi2) {
        conf.exitRssi2 = source["exitRssi2"];
        modified = true;
    }
    if (source["name2"] != conf.pilotName2) {
        strlcpy(conf.pilotName2, source["name2"] | "", sizeof(conf.pilotName2));
        modified = true;
    }
    if (source["ssid"] != conf.ssid) {
        strlcpy(conf.ssid, source["ssid"] | "", sizeof(conf.ssid));
        modified = true;
    }
    if (source["pwd"] != conf.password) {
        strlcpy(conf.password, source["pwd"] | "", sizeof(conf.password));
        modified = true;
    }
}

uint16_t Config::getFrequency() {
    return conf.frequency;
}

uint16_t Config::getFrequency2() {
    return conf.frequency2;
}

uint32_t Config::getMinLapMs() {
    return conf.minLap * 100;
}

uint32_t Config::getRaceStartDelayMs() {
    return conf.raceStartDelay * 100;
}

uint8_t Config::getAlarmThreshold() {
    return conf.alarm;
}

uint8_t Config::getEnterRssi() {
    return conf.enterRssi;
}

uint8_t Config::getExitRssi() {
    return conf.exitRssi;
}

uint8_t Config::getEnterRssi2() {
    return conf.enterRssi2;
}

uint8_t Config::getExitRssi2() {
    return conf.exitRssi2;
}

char* Config::getSsid() {
    return conf.ssid;
}

char* Config::getPassword() {
    return conf.password;
}

void Config::setDefaults(void) {
    DEBUG("Setting EEPROM defaults\n");
    // Reset everything to 0/false and then just set anything that zero is not appropriate
    memset(&conf, 0, sizeof(conf));
    conf.version = CONFIG_VERSION | CONFIG_MAGIC;
    conf.frequency = 1111;
    conf.minLap = 40;  // 4 seconds (value * 100ms)
    conf.raceStartDelay = 50;  // 5 seconds (value * 100ms)
    conf.alarm = 34;  // 3.4v (value / 10)
    conf.announcerType = 2;
    conf.announcerRate = 10;
    conf.enterRssi = 120;
    conf.exitRssi = 100;
    conf.frequency2 = 1111;
    conf.enterRssi2 = 120;
    conf.exitRssi2 = 100;
    strlcpy(conf.ssid, "", sizeof(conf.ssid));
    strlcpy(conf.password, "", sizeof(conf.password));
    strlcpy(conf.pilotName, "", sizeof(conf.pilotName));
    strlcpy(conf.pilotName2, "", sizeof(conf.pilotName2));
    modified = true;
    write();
}

void Config::handleEeprom(uint32_t currentTimeMs) {
    if (modified && ((currentTimeMs - checkTimeMs) > EEPROM_CHECK_TIME_MS)) {
        checkTimeMs = currentTimeMs;
        write();
    }
}
