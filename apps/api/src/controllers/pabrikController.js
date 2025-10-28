import { store } from '../data/store.js';

export function listPabrikStations() {
  return store.listPabriks().map((pabrik) => ({
    ...pabrik,
    stations: store.listStations(pabrik.id),
  }));
}

export function getStationMetrics(stationId, query) {
  const station = store.stations.find((item) => item.id === stationId);
  if (!station) {
    const error = new Error('Stasiun tidak ditemukan');
    error.statusCode = 404;
    throw error;
  }
  const { from, to } = query;
  return {
    station,
    metrics: store.listStationMetrics(stationId, { from, to }),
  };
}

export function aggregatePabrik(query) {
  const { periode = 'day', pabrik_id: pabrikId } = query;
  return store.aggregatePabrik({ periode, pabrikId });
}
