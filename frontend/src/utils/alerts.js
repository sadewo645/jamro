import { v4 as uuidv4 } from "uuid";

export const recommendationMap = {
  pressure_sterilizer: {
    condition: (value) => value > 3.2,
    message: "Turunkan tekanan sterilizer! Kurangi aliran steam atau cek katup relief."
  },
  ph_pome: {
    condition: (value) => value < 6,
    message: "Cek pH kolam limbah! Tambahkan kapur atau soda ash."
  },
  cod_pome: {
    condition: (value) => value > 4000,
    message: "COD tinggi! Tingkatkan aerasi kolam."
  },
  pm_emission: {
    condition: (value) => value > 150,
    message: "Emisi udara melebihi ambang batas! Segera cek sistem filtrasi."
  },
  turbidity: {
    condition: (value) => value > 500,
    message: "Bersihkan clarifier untuk menurunkan kekeruhan."
  }
};

/**
 * Determines sensor status string using the provided threshold configuration.
 * @param {string} sensor - Sensor identifier.
 * @param {number} value - Sensor reading.
 * @param {object} config - Threshold configuration.
 * @returns {"normal"|"warning"|"danger"}
 */
export function getSensorStatus(sensor, value, config) {
  const thresholds = config?.[sensor];
  if (!thresholds) {
    return "normal";
  }

  if (typeof thresholds.dangerLow === "number" && value <= thresholds.dangerLow) {
    return "danger";
  }
  if (typeof thresholds.dangerHigh === "number" && value >= thresholds.dangerHigh) {
    return "danger";
  }
  if (typeof thresholds.warningLow === "number" && value <= thresholds.warningLow) {
    return "warning";
  }
  if (typeof thresholds.warningHigh === "number" && value >= thresholds.warningHigh) {
    return "warning";
  }

  return "normal";
}

/**
 * Converts status strings to CSS class names for styling.
 * @param {"normal"|"warning"|"danger"} status - Sensor or station status string.
 * @returns {string} CSS class name.
 */
export function statusToClassName(status) {
  switch (status) {
    case "danger":
      return "status-danger";
    case "warning":
      return "status-warning";
    default:
      return "status-normal";
  }
}

/**
 * Evaluates every sensor against pre-defined conditions to derive recommended actions.
 * @param {Array} stationStatuses - Array containing station objects with sensor data.
 * @param {object} config - Threshold configuration for sensors.
 * @returns {Array} Collection of recommendation objects.
 */
export function mapRecommendations(stationStatuses, config) {
  const actions = [];

  stationStatuses.forEach((station) => {
    station.sensors.forEach((sensor) => {
      const rule = recommendationMap[sensor.id];
      const value = Number(sensor.value ?? 0);
      const status = getSensorStatus(sensor.id, value, config);

      if (rule && rule.condition(value)) {
        actions.push({
          id: uuidv4(),
          title: station.name,
          message: rule.message
        });
      } else if (status === "danger" && !rule) {
        actions.push({
          id: uuidv4(),
          title: station.name,
          message: `Periksa parameter ${sensor.label} segera.`
        });
      }
    });
  });

  return actions;
}

/**
 * Retrieves the alert text for a given sensor, falling back to a generic message when unknown.
 * @param {string} sensor - Sensor identifier.
 * @param {string} stationName - Human readable station name.
 * @returns {string} Alert string for notification purposes.
 */
export function getAlertMessage(sensor, stationName) {
  const rule = recommendationMap[sensor];
  if (rule) {
    return rule.message;
  }
  return `Parameter ${sensor} di ${stationName} melebihi batas aman. Lakukan inspeksi segera.`;
}
