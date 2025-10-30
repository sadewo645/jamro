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

const keyMetrics = [
  {
    id: "pressure_sterilizer",
    stationKey: "sterilizer",
    label: "Tekanan Sterilizer (bar)",
    color: "#dc2626"
  },
  {
    id: "clarifier_temp",
    stationKey: "clarification",
    label: "Suhu Clarifier (°C)",
    color: "#2563eb"
  },
  {
    id: "pm_emission",
    stationKey: "emissionWaste",
    label: "Emisi PM (mg/Nm³)",
    color: "#f97316"
  },
  {
    id: "power_output",
    stationKey: "boilerTurbine",
    label: "Daya Turbin (kWh)",
    color: "#16a34a"
  }
];

/**
 * Aggregates historical sensor data into a format that can be consumed by Recharts.
 * @param {object} history - Mapping of station keys to history arrays.
 * @returns {Array} Array of chart rows sorted by timestamp.
 */
function buildChartData(history) {
  const combined = new Map();

  keyMetrics.forEach((metric) => {
    const stationHistory = history?.[metric.stationKey] ?? [];

    stationHistory.forEach((entry) => {
      const key = entry.time ?? metric.id;
      const existing = combined.get(key) ?? {
        time: entry.time,
        label: entry.time
          ? new Date(entry.time).toLocaleTimeString("id-ID", {
              hour: "2-digit",
              minute: "2-digit",
              second: "2-digit"
            })
          : metric.id
      };

      existing[metric.id] = entry?.[metric.id] ?? 0;
      combined.set(key, existing);
    });
  });

  return Array.from(combined.values())
    .sort((a, b) => new Date(a.time ?? 0) - new Date(b.time ?? 0))
    .slice(-40);
}

/**
 * Component: OverviewTrends
 * Description: Renders the high-level monitoring chart to visualize critical process parameters over time.
 * @param {object} props - Contains the historical sensor store for all stations.
 */
export default function OverviewTrends({ history }) {
  const chartData = buildChartData(history);

  return (
    <section className="overview-trends">
      <div className="overview-header">
        <h2>Tren Monitoring Utama</h2>
        <p>Update otomatis setiap 3 detik dari simulasi sensor pabrik kelapa sawit.</p>
      </div>
      <div className="overview-chart">
        {chartData.length === 0 ? (
          <div className="empty-state">Menunggu data sensor...</div>
        ) : (
          <ResponsiveContainer>
            <LineChart data={chartData} margin={{ left: 4, right: 16, bottom: 8 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="label" />
              <YAxis />
              <Tooltip />
              <Legend />
              {keyMetrics.map((metric) => (
                <Line
                  key={metric.id}
                  type="monotone"
                  dataKey={metric.id}
                  name={metric.label}
                  stroke={metric.color}
                  dot={false}
                  isAnimationActive={false}
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>
    </section>
  );
}

OverviewTrends.propTypes = {
  history: PropTypes.object
};

OverviewTrends.defaultProps = {
  history: {}
};

/**
 * Exported for unit testing to verify dataset transformations independently.
 */
export { buildChartData, keyMetrics };
