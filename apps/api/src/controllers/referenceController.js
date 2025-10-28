import { store } from '../data/store.js';

export function listNormaHK() {
  return store.listNormaHK();
}

export function updateNormaHK(id, payload, user) {
  const record = store.updateNormaHK(id, {
    pekerjaan: payload.pekerjaan ?? undefined,
    normaHk: payload.normaHk ?? undefined,
    satuan: payload.satuan ?? undefined,
    catatan: payload.catatan ?? undefined,
    lastUpdatedBy: user?.sub ?? null,
  });
  if (!record) {
    const error = new Error('Norma HK tidak ditemukan');
    error.statusCode = 404;
    throw error;
  }
  return record;
}

export function listCostSummary(query) {
  const { periode } = query;
  return store.listCostSummary({ periode });
}
