/*
 * Module: sensorSimulator.js
 * Description: Generates simulated sensor data for each processing station in the palm oil mill.
 */

import { randomUUID } from "crypto";

/**
 * Generates a random floating-point number within a range with specified precision.
 * @param {number} min - Minimum value allowed for the sensor.
 * @param {number} max - Maximum value allowed for the sensor.
 * @param {number} decimals - Number of decimal places to keep.
 * @returns {number} Rounded floating-point number representing the simulated value.
 */
function randomFloat(min, max, decimals = 2) {
  const factor = 10 ** decimals;
  return Math.round((Math.random() * (max - min) + min) * factor) / factor;
}

/**
 * Produces a timestamp string in ISO format for the generated sample.
 * @returns {string} ISO timestamp string for the current time.
 */
function currentTimestamp() {
  return new Date().toISOString();
}

/**
 * Generates a full sensor payload covering every palm oil mill station.
 * Each value imitates realistic operating ranges. When sensor readings are
 * unavailable, the caller should fall back to "0" so downstream components
 * see a defined value.
 * @returns {object} Object containing simulated sensor readings and metadata.
 */
export function generateSensorData() {
  return {
    id: randomUUID(),
    timestamp: currentTimestamp(),
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
      flue_gas_emission: randomFloat(80, 180, 0)
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
 * Maps nested sensor payloads into a flat dictionary for easier threshold processing.
 * @param {object} payload - Nested sensor object produced by generateSensorData.
 * @returns {object} Flat key-value object of sensor names to readings.
 */
export function flattenSensors(payload) {
  return {
    weight_tbs: payload?.loadingRamp?.weight_tbs ?? 0,
    temp_tbs: payload?.loadingRamp?.temp_tbs ?? 0,
    brondolan_ratio: payload?.loadingRamp?.brondolan_ratio ?? 0,
    pressure_sterilizer: payload?.sterilizer?.pressure_sterilizer ?? 0,
    temp_sterilizer: payload?.sterilizer?.temp_sterilizer ?? 0,
    steam_flow: payload?.sterilizer?.steam_flow ?? 0,
    condensate_volume: payload?.sterilizer?.condensate_volume ?? 0,
    drum_speed: payload?.thresher?.drum_speed ?? 0,
    unstripped_bunch_ratio: payload?.thresher?.unstripped_bunch_ratio ?? 0,
    press_pressure: payload?.press?.press_pressure ?? 0,
    press_temp: payload?.press?.press_temp ?? 0,
    oil_loss_cake: payload?.press?.oil_loss_cake ?? 0,
    clarifier_temp: payload?.clarification?.clarifier_temp ?? 0,
    oil_water_ratio: payload?.clarification?.oil_water_ratio ?? 0,
    turbidity: payload?.clarification?.turbidity ?? 0,
    kernel_breakage: payload?.kernelStation?.kernel_breakage ?? 0,
    shell_loss: payload?.kernelStation?.shell_loss ?? 0,
    steam_pressure: payload?.boilerTurbine?.steam_pressure ?? 0,
    steam_temp: payload?.boilerTurbine?.steam_temp ?? 0,
    power_output: payload?.boilerTurbine?.power_output ?? 0,
    fuel_feed_rate: payload?.boilerTurbine?.fuel_feed_rate ?? 0,
    flue_gas_emission: payload?.boilerTurbine?.flue_gas_emission ?? 0,
    voltage: payload?.powerHouse?.voltage ?? 0,
    frequency: payload?.powerHouse?.frequency ?? 0,
    power_factor: payload?.powerHouse?.power_factor ?? 0,
    ph_wtp: payload?.waterTreatment?.ph_wtp ?? 0,
    tss_wtp: payload?.waterTreatment?.tss_wtp ?? 0,
    flow_wtp: payload?.waterTreatment?.flow_wtp ?? 0,
    ph_pome: payload?.effluentTreatment?.ph_pome ?? 0,
    bod_pome: payload?.effluentTreatment?.bod_pome ?? 0,
    cod_pome: payload?.effluentTreatment?.cod_pome ?? 0,
    methane_flow: payload?.effluentTreatment?.methane_flow ?? 0,
    ash_weight: payload?.emissionWaste?.ash_weight ?? 0,
    fiber_recovery: payload?.emissionWaste?.fiber_recovery ?? 0,
    pm_emission: payload?.emissionWaste?.pm_emission ?? 0
  };
}
