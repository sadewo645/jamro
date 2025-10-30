import PropTypes from "prop-types";
import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from "recharts";
import { statusToClassName } from "../utils/alerts.js";

/**
 * Component: DetailPanel
 * Description: Displays detailed metrics for the selected station including trend chart and recommendations.
 * @param {object} props - Contains selected station, history, and recommended actions.
 */
export default function DetailPanel({ station, history, recommendations }) {
  const chartData = history.map((entry) => ({
    ...entry,
    label: new Date(entry.time ?? Date.now()).toLocaleTimeString("id-ID", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit"
    })
  }));

  return (
    <section className="detail-panel">
      <div>
        <h3>Detail {station.name}</h3>
        <div className="metrics-list">
          {station.sensors.map((sensor) => (
            <div key={sensor.id} className={`metric-row ${statusToClassName(sensor.status)}`}>
              <span>{sensor.label}</span>
              <span>{sensor.value ?? 0}</span>
            </div>
          ))}
        </div>
        <div className="chart-container">
          <ResponsiveContainer>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="label" />
              <YAxis />
              <Tooltip />
              <Legend />
              {station.sensors.map((sensor) => (
                <Line
                  key={sensor.id}
                  type="monotone"
                  dataKey={sensor.id}
                  stroke={sensor.status === "danger" ? "#dc2626" : sensor.status === "warning" ? "#facc15" : "#22c55e"}
                  dot={false}
                  isAnimationActive={false}
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
      <aside>
        <h3>Tindakan Disarankan</h3>
        <div className="recommendations">
          {recommendations.length === 0 && (
            <div className="recommendation-card">Semua parameter dalam kondisi aman.</div>
          )}
          {recommendations.map((item) => (
            <div key={item.id} className="recommendation-card">
              <strong>{item.title}</strong>
              <div>{item.message}</div>
            </div>
          ))}
        </div>
      </aside>
    </section>
  );
}

DetailPanel.propTypes = {
  station: PropTypes.shape({
    key: PropTypes.string.isRequired,
    name: PropTypes.string.isRequired,
    sensors: PropTypes.arrayOf(
      PropTypes.shape({
        id: PropTypes.string.isRequired,
        label: PropTypes.string.isRequired,
        value: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
        status: PropTypes.string
      })
    ).isRequired
  }).isRequired,
  history: PropTypes.arrayOf(PropTypes.object),
  recommendations: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      title: PropTypes.string.isRequired,
      message: PropTypes.string.isRequired
    })
  )
};

DetailPanel.defaultProps = {
  history: [],
  recommendations: []
};
