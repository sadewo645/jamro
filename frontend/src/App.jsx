import { useEffect, useMemo, useRef, useState } from "react";
import DashboardHeader from "./components/DashboardHeader.jsx";
import StationCard from "./components/StationCard.jsx";
import DetailPanel from "./components/DetailPanel.jsx";
import { useWebSocketData } from "./hooks/useWebSocketData.js";
import { defaultPayload, stationDefinitions } from "./config/stations.js";
import { getAlertMessage, getSensorStatus, mapRecommendations } from "./utils/alerts.js";

/**
 * Component: App
 * Description: Composes the full dashboard layout, wiring sensor data into cards and charts.
 */
export default function App() {
  const { data, history, timestamp } = useWebSocketData();
  const [config, setConfig] = useState({});
  const [activeStation, setActiveStation] = useState(stationDefinitions[0]);
  const triggeredAlerts = useRef(new Set());

  /**
   * Fetches sensor threshold configuration from the backend exactly once.
   */
  useEffect(() => {
    async function fetchConfig() {
      try {
        const response = await fetch("/api/config");
        const json = await response.json();
        setConfig(json);
      } catch (error) {
        console.error("Unable to load configuration", error);
      }
    }

    fetchConfig();
  }, []);

  const mergedData = useMemo(() => ({ ...defaultPayload, ...data }), [data]);

  /**
   * Calculates the overall status for each processing station based on its sensors.
   */
  const stationStatuses = useMemo(() => {
    return stationDefinitions.map((station) => {
      const sensors = station.sensors.map((sensor) => {
        const value = mergedData?.[station.key]?.[sensor.id] ?? 0;
        return {
          ...sensor,
          value,
          status: getSensorStatus(sensor.id, value, config)
        };
      });

      const overall = sensors.reduce((acc, cur) => {
        if (cur.status === "danger") return "danger";
        if (cur.status === "warning" && acc !== "danger") return "warning";
        return acc;
      }, "normal");

      return {
        ...station,
        sensors,
        status: overall
      };
    });
  }, [config, mergedData]);

  /**
   * Produces actionable recommendations whenever sensor values breach thresholds.
   */
  const recommendations = useMemo(() => {
    return mapRecommendations(stationStatuses, config);
  }, [stationStatuses, config]);

  const stationRecommendations = useMemo(() => {
    return recommendations.filter((item) => item.title === activeStation.name);
  }, [recommendations, activeStation]);

  /**
   * Issues browser alerts when a sensor transitions into a danger state.
   */
  useEffect(() => {
    stationStatuses.forEach((station) => {
      station.sensors.forEach((sensor) => {
        const key = `${station.key}-${sensor.id}`;

        if (sensor.status === "danger" && !triggeredAlerts.current.has(key)) {
          triggeredAlerts.current.add(key);
          window.alert(`⚠️ ${getAlertMessage(sensor.id, station.name)}`);
        } else if (sensor.status === "normal" && triggeredAlerts.current.has(key)) {
          triggeredAlerts.current.delete(key);
        }
      });
    });
  }, [stationStatuses]);

  return (
    <div className="app-container">
      <aside className="sidebar">
        <h2>Stasiun</h2>
        <div className="station-list">
          {stationStatuses.map((station) => (
            <button
              key={station.key}
              type="button"
              className={`station-button${activeStation.key === station.key ? " active" : ""}`}
              onClick={() => setActiveStation(station)}
            >
              <span>{station.name}</span>
              <span>{station.status === "danger" ? "🔴" : station.status === "warning" ? "🟡" : "🟢"}</span>
            </button>
          ))}
        </div>
      </aside>
      <main className="main-content">
        <DashboardHeader timestamp={timestamp} data={mergedData} />
        <section className="status-grid">
          {stationStatuses.map((station) => (
            <StationCard key={station.key} station={station} onSelect={() => setActiveStation(station)} />
          ))}
        </section>
        <DetailPanel
          station={activeStation}
          history={history[activeStation.key] ?? []}
          recommendations={stationRecommendations}
        />
      </main>
    </div>
  );
}
