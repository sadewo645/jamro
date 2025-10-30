import PropTypes from "prop-types";
import { statusToClassName } from "../utils/alerts.js";
import { formatSensorValue } from "../utils/format.js";

/**
 * Component: StationCard
 * Description: Renders a card with sensor metrics and high-level status per station.
 * @param {object} props - Contains station information and selection handler.
 */
export default function StationCard({ station, onSelect }) {
  return (
    <article className="station-card">
      <div className="station-header">
        <h3>{station.name}</h3>
        <span className={`status-pill ${statusToClassName(station.status)}`}>
          {station.status === "danger" ? "Bahaya" : station.status === "warning" ? "Waspada" : "Normal"}
        </span>
      </div>
      <div className="metrics-list">
          {station.sensors.map((sensor) => (
            <div key={sensor.id} className="metric-row">
              <span>{sensor.label}</span>
              <span>{formatSensorValue(sensor.value)}</span>
            </div>
          ))}
      </div>
      <button type="button" className="detail-button" onClick={onSelect}>
        Lihat Detail
      </button>
    </article>
  );
}

StationCard.propTypes = {
  station: PropTypes.shape({
    key: PropTypes.string.isRequired,
    name: PropTypes.string.isRequired,
    status: PropTypes.string.isRequired,
    sensors: PropTypes.arrayOf(
      PropTypes.shape({
        id: PropTypes.string.isRequired,
        label: PropTypes.string.isRequired,
        value: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
        status: PropTypes.string
      })
    ).isRequired
  }).isRequired,
  onSelect: PropTypes.func.isRequired
};
