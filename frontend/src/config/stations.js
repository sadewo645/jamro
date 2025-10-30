/**
 * Default payload ensures every sensor exists with a defined value even before live data arrives.
 */
export const defaultPayload = {
  loadingRamp: {
    weight_tbs: 0,
    temp_tbs: 0,
    brondolan_ratio: 0
  },
  sterilizer: {
    pressure_sterilizer: 0,
    temp_sterilizer: 0,
    steam_flow: 0,
    condensate_volume: 0
  },
  thresher: {
    drum_speed: 0,
    unstripped_bunch_ratio: 0
  },
  press: {
    press_pressure: 0,
    press_temp: 0,
    oil_loss_cake: 0
  },
  clarification: {
    clarifier_temp: 0,
    oil_water_ratio: 0,
    turbidity: 0
  },
  kernelStation: {
    kernel_breakage: 0,
    shell_loss: 0
  },
  boilerTurbine: {
    steam_pressure: 0,
    steam_temp: 0,
    power_output: 0,
    fuel_feed_rate: 0,
    flue_gas_emission: 0
  },
  powerHouse: {
    voltage: 0,
    frequency: 0,
    power_factor: 0
  },
  waterTreatment: {
    ph_wtp: 0,
    tss_wtp: 0,
    flow_wtp: 0
  },
  effluentTreatment: {
    ph_pome: 0,
    bod_pome: 0,
    cod_pome: 0,
    methane_flow: 0
  },
  emissionWaste: {
    ash_weight: 0,
    fiber_recovery: 0,
    pm_emission: 0
  }
};

/**
 * List describing each processing station, its display name, and the associated sensors.
 */
export const stationDefinitions = [
  {
    key: "loadingRamp",
    name: "Loading Ramp",
    sensors: [
      { id: "weight_tbs", label: "Berat TBS (t)" },
      { id: "temp_tbs", label: "Suhu TBS (°C)" },
      { id: "brondolan_ratio", label: "Rasio Brondolan (%)" }
    ]
  },
  {
    key: "sterilizer",
    name: "Sterilizer",
    sensors: [
      { id: "pressure_sterilizer", label: "Tekanan Sterilizer (bar)" },
      { id: "temp_sterilizer", label: "Suhu Sterilizer (°C)" },
      { id: "steam_flow", label: "Laju Uap (kg/jam)" },
      { id: "condensate_volume", label: "Volume Kondensat (L)" }
    ]
  },
  {
    key: "thresher",
    name: "Thresher",
    sensors: [
      { id: "drum_speed", label: "Putaran Drum (rpm)" },
      { id: "unstripped_bunch_ratio", label: "Rasio Tandan Tidak Rontok (%)" }
    ]
  },
  {
    key: "press",
    name: "Press",
    sensors: [
      { id: "press_pressure", label: "Tekanan Press (bar)" },
      { id: "press_temp", label: "Suhu Press (°C)" },
      { id: "oil_loss_cake", label: "Kehilangan Minyak di Cake (%)" }
    ]
  },
  {
    key: "clarification",
    name: "Clarification",
    sensors: [
      { id: "clarifier_temp", label: "Suhu Clarifier (°C)" },
      { id: "oil_water_ratio", label: "Rasio Minyak-Air (%)" },
      { id: "turbidity", label: "Kekeruhan (NTU)" }
    ]
  },
  {
    key: "kernelStation",
    name: "Kernel Station",
    sensors: [
      { id: "kernel_breakage", label: "Kerusakan Kernel (%)" },
      { id: "shell_loss", label: "Kehilangan Cangkang (%)" }
    ]
  },
  {
    key: "boilerTurbine",
    name: "Boiler & Turbine",
    sensors: [
      { id: "steam_pressure", label: "Tekanan Uap (bar)" },
      { id: "steam_temp", label: "Suhu Uap (°C)" },
      { id: "power_output", label: "Daya Turbin (kWh)" },
      { id: "fuel_feed_rate", label: "Laju Bahan Bakar (kg/jam)" },
      { id: "flue_gas_emission", label: "Emisi Gas Buang (ppm)" }
    ]
  },
  {
    key: "powerHouse",
    name: "Power House",
    sensors: [
      { id: "voltage", label: "Tegangan (V)" },
      { id: "frequency", label: "Frekuensi (Hz)" },
      { id: "power_factor", label: "Faktor Daya" }
    ]
  },
  {
    key: "waterTreatment",
    name: "Water Treatment Plant",
    sensors: [
      { id: "ph_wtp", label: "pH Air Baku" },
      { id: "tss_wtp", label: "TSS (mg/L)" },
      { id: "flow_wtp", label: "Debit Air (m³/jam)" }
    ]
  },
  {
    key: "effluentTreatment",
    name: "POME",
    sensors: [
      { id: "ph_pome", label: "pH POME" },
      { id: "bod_pome", label: "BOD (mg/L)" },
      { id: "cod_pome", label: "COD (mg/L)" },
      { id: "methane_flow", label: "Aliran Metana (m³/jam)" }
    ]
  },
  {
    key: "emissionWaste",
    name: "Emission & Solid Waste",
    sensors: [
      { id: "ash_weight", label: "Berat Abu (kg)" },
      { id: "fiber_recovery", label: "Recovery Serat (%)" },
      { id: "pm_emission", label: "Emisi PM (mg/Nm³)" }
    ]
  }
];
