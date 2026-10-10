package com.hackathon.risk.stress;

import com.hackathon.risk.signal.EventType;
import jakarta.annotation.PostConstruct;
import lombok.Data;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;
import org.yaml.snakeyaml.Yaml;

import java.io.InputStream;
import java.util.HashMap;
import java.util.Map;

@Slf4j
@Component
public class ScenarioConfig {

    private final Map<EventType, ScenarioParams> scenarioMap = new HashMap<>();

    @Data
    public static class ScenarioParams {
        private double equityShockPct;
        private double rateShockBp;
        private double creditSpreadBp;
        private Map<String, Double> fxShocks = new HashMap<>();
        private Map<String, Map<String, Double>> sectorOverrides = new HashMap<>();
        private double pdMultiplier = 1.0;
        private boolean counterpartySpecific = false;
    }

    @PostConstruct
    public void loadScenarios() {
        Yaml yaml = new Yaml();
        try (InputStream in = getClass().getClassLoader().getResourceAsStream("scenarios.yml")) {
            if (in != null) {
                Map<String, Object> data = yaml.load(in);
                Map<String, Object> scenarios = (Map<String, Object>) data.get("scenarios");
                if (scenarios != null) {
                    for (Map.Entry<String, Object> entry : scenarios.entrySet()) {
                        try {
                            EventType eventType = EventType.valueOf(entry.getKey().toUpperCase());
                            Map<String, Object> params = (Map<String, Object>) entry.getValue();
                            ScenarioParams sp = parseScenario(params);
                            scenarioMap.put(eventType, sp);
                        } catch (IllegalArgumentException e) {
                            log.warn("Unknown event type in scenarios.yml: {}", entry.getKey());
                        }
                    }
                }
            }
            log.info("Loaded {} scenario definitions from scenarios.yml", scenarioMap.size());
        } catch (Exception e) {
            log.error("Failed to load scenarios.yml: {}", e.getMessage());
            loadDefaults();
        }
    }

    private ScenarioParams parseScenario(Map<String, Object> map) {
        ScenarioParams sp = new ScenarioParams();
        if (map == null) return sp;

        sp.setEquityShockPct(asDouble(map.get("equityShockPct"), 0.0));
        sp.setRateShockBp(asDouble(map.get("rateShockBp"), 0.0));
        sp.setCreditSpreadBp(asDouble(map.get("creditSpreadBp"), 0.0));
        sp.setPdMultiplier(asDouble(map.get("pdMultiplier"), 1.0));
        sp.setCounterpartySpecific(Boolean.TRUE.equals(map.get("counterpartySpecific")));

        Object fx = map.get("fxShocks");
        if (fx instanceof Map<?, ?> fxMap) {
            Map<String, Double> parsedFx = new HashMap<>();
            fxMap.forEach((k, v) -> parsedFx.put(String.valueOf(k), asDouble(v, 0.0)));
            sp.setFxShocks(parsedFx);
        }

        Object sec = map.get("sectorOverrides");
        if (sec instanceof Map<?, ?> secMap) {
            Map<String, Map<String, Double>> parsedSec = new HashMap<>();
            secMap.forEach((k, v) -> {
                if (v instanceof Map<?, ?> inner) {
                    Map<String, Double> innerMap = new HashMap<>();
                    inner.forEach((ik, iv) -> innerMap.put(String.valueOf(ik), asDouble(iv, 0.0)));
                    parsedSec.put(String.valueOf(k), innerMap);
                }
            });
            sp.setSectorOverrides(parsedSec);
        }

        return sp;
    }

    private double asDouble(Object obj, double defaultVal) {
        if (obj instanceof Number num) return num.doubleValue();
        return defaultVal;
    }

    public ScenarioParams getParams(EventType eventType) {
        return scenarioMap.getOrDefault(eventType, scenarioMap.getOrDefault(EventType.OTHER, new ScenarioParams()));
    }

    private void loadDefaults() {
        ScenarioParams geo = new ScenarioParams();
        geo.setEquityShockPct(-12.0);
        geo.setRateShockBp(-50.0);
        geo.setCreditSpreadBp(150.0);
        geo.setPdMultiplier(1.4);
        scenarioMap.put(EventType.GEOPOLITICAL, geo);
    }
}
