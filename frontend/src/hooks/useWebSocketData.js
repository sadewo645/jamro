import { useEffect, useMemo, useRef, useState } from "react";
import { defaultPayload, stationDefinitions } from "../config/stations.js";

/**
 * Generates a random floating-point number within a range with specified precision.
 * @param {number} min - Minimum allowed value.
 * @param {number} max - Maximum allowed value.
 * @param {number} decimals - Total decimals to keep in the result.
 * @returns {number} Rounded floating-point number for sensor simulation.
 */
function randomFloat(min, max, decimals = 2) {
  const factor = 10 ** decimals;
  return Math.round((Math.random() * (max - min) + min) * factor) / factor;
}

/**
 * Generates client-side simulated sensor data to keep the UI populated when the backend is unreachable.
 * @returns {object} Simulated payload following the backend schema.
 */
function simulateSensorPayload() {
  const timestamp = new Date().toISOString();
  const id = typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).slice(2);

  return {
    id,
    timestamp,
    loadingRamp: {
      weight_tbs: randomFloat(15, 30, 2),
      temp_tbs: randomFloat(28, 40, 1),
      brondolan_ratio: randomFloat(5, 15, 1)
    },
    sterilizer: {
      pressure_sterilizer: randomFloat(2.5, 3.5, 2),
      temp_sterilizer: randomFloat(130, 145, 1),
      steam_flow: randomFloat(1000, 1500, 1),
      condensate_volume: randomFloat(500, 900, 1)
    },
    thresher: {
      drum_speed: randomFloat(18, 24, 2),
      unstripped_bunch_ratio: randomFloat(3, 8, 1)
    },
    press: {
      press_pressure: randomFloat(30, 45, 1),
      press_temp: randomFloat(90, 105, 1),
      oil_loss_cake: randomFloat(3, 7, 1)
    },
    clarification: {
      clarifier_temp: randomFloat(85, 95, 1),
      oil_water_ratio: randomFloat(40, 60, 1),
      turbidity: randomFloat(300, 600, 0)
    },
    kernelStation: {
      kernel_breakage: randomFloat(5, 12, 1),
      shell_loss: randomFloat(2, 6, 1)
    },
    boilerTurbine: {
      steam_pressure: randomFloat(18, 24, 1),
      steam_temp: randomFloat(380, 420, 1),
      power_output: randomFloat(1200, 1800, 0),
      fuel_feed_rate: randomFloat(3000, 4500, 1),
      flue_gas_emission: randomFloat(80, 200, 0)
    },
    powerHouse: {
      voltage: randomFloat(395, 415, 1),
      frequency: randomFloat(49.5, 50.5, 2),
      power_factor: randomFloat(0.85, 0.98, 2)
    },
    waterTreatment: {
      ph_wtp: randomFloat(6.5, 8.0, 2),
      tss_wtp: randomFloat(20, 80, 0),
      flow_wtp: randomFloat(25, 40, 2)
    },
    effluentTreatment: {
      ph_pome: randomFloat(5.5, 8.5, 2),
      bod_pome: randomFloat(2000, 4000, 0),
      cod_pome: randomFloat(2500, 5000, 0),
      methane_flow: randomFloat(40, 85, 1)
    },
    emissionWaste: {
      ash_weight: randomFloat(500, 900, 0),
      fiber_recovery: randomFloat(75, 90, 1),
      pm_emission: randomFloat(80, 200, 0)
    }
  };
}

/**
 * Normalizes an incoming payload so every sensor is guaranteed to be present with a default value.
 * @param {object} incoming - Raw payload from WebSocket or local simulator.
 * @returns {object} Payload merged with default sensor values.
 */
function normalizePayload(incoming = {}) {
  const timestamp = incoming.timestamp ?? new Date().toISOString();
  const normalized = { ...incoming, timestamp };

  stationDefinitions.forEach((station) => {
    normalized[station.key] = {
      ...defaultPayload[station.key],
      ...(incoming[station.key] ?? {})
    };
  });

  return normalized;
}

/**
 * Resolves the best available WebSocket URL taking deployment environments into account.
 * @returns {string} WebSocket endpoint URL.
 */
function resolveWebSocketUrl() {
  const envUrl = import.meta.env.VITE_WS_URL;
  if (envUrl) {
    return envUrl;
  }

  if (typeof window === "undefined") {
    return "ws://localhost:4000";
  }

  const { protocol, hostname, port } = window.location;
  const wsProtocol = protocol === "https:" ? "wss" : "ws";

  if (port && port !== "" && port !== "80" && port !== "443" && port !== "4000") {
    const targetPort = port === "5173" ? "4000" : port;
    return `${wsProtocol}://${hostname}:${targetPort}`;
  }

  return `${wsProtocol}://${window.location.host}`;
}

/**
 * Hook: useWebSocketData
 * Description: Connects to the backend WebSocket and maintains current and historical sensor data.
 * @returns {{data: object, history: object, timestamp: string}}
 */
export function useWebSocketData() {
  const [data, setData] = useState(() => normalizePayload({}));
  const [timestamp, setTimestamp] = useState("");
  const historyRef = useRef({});
  const [, forceRender] = useState(0);

  /**
   * Appends a new reading to the history buffer with a rolling window.
   * @param {string} stationKey - Identifier for the processing station.
   * @param {object} payload - Sensor object to append.
   */
  function appendHistory(stationKey, payload) {
    const history = historyRef.current[stationKey] ?? [];
    const updated = [...history, payload].slice(-40);
    historyRef.current[stationKey] = updated;
  }

  /**
   * Applies a payload to component state and refreshes history references.
   * @param {object} raw - Incoming payload from socket or fallback generator.
   */
  function handlePayload(raw) {
    const normalized = normalizePayload(raw);
    setData(normalized);
    setTimestamp(normalized.timestamp ?? new Date().toISOString());

    stationDefinitions.forEach((station) => {
      const payload = {
        time: normalized.timestamp,
        ...defaultPayload[station.key],
        ...normalized[station.key]
      };
      appendHistory(station.key, payload);
    });

    forceRender((value) => value + 1);
  }

  useEffect(() => {
    let ws;
    let fallbackInterval;

    /**
     * Starts the local simulator interval for environments without backend connectivity.
     * @param {boolean} immediate - When true, push an initial sample before waiting for the interval.
     */
    function startFallback(immediate = false) {
      if (fallbackInterval) {
        return;
      }

      if (immediate) {
        handlePayload(simulateSensorPayload());
      }

      fallbackInterval = setInterval(() => {
        handlePayload(simulateSensorPayload());
      }, 3000);
    }

    /**
     * Stops the local simulator interval once a backend connection is available.
     */
    function stopFallback() {
      if (fallbackInterval) {
        clearInterval(fallbackInterval);
        fallbackInterval = undefined;
      }
    }

    try {
      ws = new WebSocket(resolveWebSocketUrl());
    } catch (error) {
      console.error("WebSocket connection failed, switching to local simulator", error);
      startFallback(true);
      return () => {
        stopFallback();
      };
    }

    ws.onopen = () => {
      stopFallback();
    };

    ws.onmessage = (event) => {
      handlePayload(JSON.parse(event.data));
    };

    ws.onerror = (error) => {
      console.error("WebSocket error", error);
      startFallback(true);
    };

    ws.onclose = () => {
      startFallback(true);
    };

    return () => {
      stopFallback();
      if (ws) {
        ws.close();
      }
    };
  }, []);

  const history = useMemo(() => historyRef.current, []);

  return { data, history, timestamp };
}
