import PropTypes from "prop-types";

/**
 * Component: DashboardHeader
 * Description: Displays current date, time, and aggregate production values.
 * @param {object} props - Component properties containing timestamp and data payload.
 */
export default function DashboardHeader({ timestamp, data }) {
  const date = timestamp ? new Date(timestamp) : new Date();
  const formattedDate = date.toLocaleDateString("id-ID", {
    day: "2-digit",
    month: "long",
    year: "numeric"
  });
  const formattedTime = date.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit", second: "2-digit" });

  const estimatedProduction = data?.press?.press_pressure && data?.loadingRamp?.weight_tbs
    ? Number((data.press.press_pressure * data.loadingRamp.weight_tbs * 0.1).toFixed(2))
    : 0;

  return (
    <header className="header">
      <div>
        <h1>Dashboard Monitoring PKS</h1>
        <p>{formattedDate} • {formattedTime} WIB</p>
      </div>
      <div>
        <strong>Total Produksi Estimasi:</strong>
        <div>{estimatedProduction} ton/jam</div>
      </div>
    </header>
  );
}

DashboardHeader.propTypes = {
  timestamp: PropTypes.string,
  data: PropTypes.object
};
