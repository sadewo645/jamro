/**
 * Formats numeric sensor values for display while respecting default zero fallbacks.
 * @param {number|string} value - Raw sensor reading from the backend or simulator.
 * @returns {string|number} Human-readable representation for UI components.
 */
export function formatSensorValue(value) {
  if (value === null || value === undefined || Number.isNaN(value)) {
    return 0;
  }

  if (typeof value === "number") {
    return value.toLocaleString("id-ID", {
      minimumFractionDigits: value % 1 === 0 ? 0 : 2,
      maximumFractionDigits: 2
    });
  }

  return value;
}
