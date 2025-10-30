import { useEffect, useMemo, useRef, useState } from "react";
import { defaultPayload, stationDefinitions } from "../config/stations.js";

/**
 * Hook: useWebSocketData
 * Description: Connects to the backend WebSocket and maintains current and historical sensor data.
 * @returns {{data: object, history: object, timestamp: string}}
 */
export function useWebSocketData() {
  const [data, setData] = useState(defaultPayload);
  const [timestamp, setTimestamp] = useState("");
  const historyRef = useRef({});

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

  useEffect(() => {
    const ws = new WebSocket("ws://localhost:4000");

    ws.onmessage = (event) => {
      const incoming = JSON.parse(event.data);
      setData(incoming);
      setTimestamp(incoming.timestamp ?? new Date().toISOString());

      stationDefinitions.forEach((station) => {
        const payload = {
          time: incoming.timestamp,
          ...defaultPayload[station.key],
          ...incoming[station.key]
        };
        appendHistory(station.key, payload);
      });
    };

    ws.onerror = (error) => {
      console.error("WebSocket error", error);
    };

    return () => {
      ws.close();
    };
  }, []);

  const history = useMemo(() => historyRef.current, []);

  return { data, history, timestamp };
}
