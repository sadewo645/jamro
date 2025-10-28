import { store } from '../data/store.js';

export function listAfdelings() {
  return store.listAfdelings().map((afdeling) => ({
    ...afdeling,
    blocks: store.listBlocksByAfdeling(afdeling.id),
  }));
}

export function createAfdeling(payload) {
  if (!payload?.kodeUnik || !payload?.nama) {
    throw createValidationError('Kode unik dan nama wajib diisi');
  }
  if (store.afdelings.some((item) => item.kodeUnik === payload.kodeUnik)) {
    throw createValidationError('Kode unik afdeling sudah dipakai');
  }
  return store.createAfdeling({
    kodeUnik: payload.kodeUnik,
    nama: payload.nama,
    lokasi: payload.lokasi ?? '',
    luasHa: payload.luasHa ?? 0,
  });
}

export function getAfdeling(id) {
  const afdeling = store.getAfdeling(id);
  if (!afdeling) {
    const error = new Error('Afdeling tidak ditemukan');
    error.statusCode = 404;
    throw error;
  }
  const blocks = store.listBlocksByAfdeling(id);
  const harvestAggregate = store.aggregateHarvest({ afdelingId: id, periode: 'day' });
  const weather = store.aggregateInputMandor({ afdelingId: id, periode: 'day' });
  return {
    ...afdeling,
    blocks,
    harvestAggregate,
    weather,
  };
}

export function createBlock(afdelingId, payload) {
  const afdeling = store.getAfdeling(afdelingId);
  if (!afdeling) {
    const error = new Error('Afdeling tidak ditemukan');
    error.statusCode = 404;
    throw error;
  }
  if (!payload?.kodeUnik || !payload?.nama) {
    throw createValidationError('Kode unik dan nama blok wajib diisi');
  }
  if (store.blocks.some((item) => item.kodeUnik === payload.kodeUnik)) {
    throw createValidationError('Kode unik blok sudah digunakan');
  }
  return store.createBlock(afdelingId, {
    kodeUnik: payload.kodeUnik,
    nama: payload.nama,
    luasHa: payload.luasHa ?? 0,
    tahunTanam: payload.tahunTanam ?? null,
    varietas: payload.varietas ?? null,
  });
}

export function getBlock(id) {
  const block = store.getBlock(id);
  if (!block) {
    const error = new Error('Blok tidak ditemukan');
    error.statusCode = 404;
    throw error;
  }
  const harvest = store.listHarvestsByBlock(id);
  const inputMandor = store.listInputMandor(id);
  const transport = store.listTransportLogs(id);
  return { ...block, harvest, inputMandor, transport };
}

export function listHarvests(query) {
  const { blok_id: blockId, afdeling_id: afdelingId, from, to } = query;
  const results = [];
  for (const record of store.harvests) {
    if (blockId && record.blokId !== blockId) continue;
    if (afdelingId) {
      const block = store.blocks.find((item) => item.id === record.blokId);
      if (!block || block.afdelingId !== afdelingId) continue;
    }
    if (!store.filterByRange(record.tanggal, from, to)) continue;
    results.push(record);
  }
  return results;
}

export function aggregateHarvest(query) {
  const { periode = 'day', afdeling_id: afdelingId, blok_id: blockId } = query;
  return store.aggregateHarvest({ periode, afdelingId, blockId });
}

export function aggregateWeather(query) {
  const { periode = 'day', afdeling_id: afdelingId, blok_id: blockId } = query;
  return store.aggregateInputMandor({ periode, afdelingId, blockId });
}

export function listTransportLogs(query) {
  const { blok_id: blockId, from, to } = query;
  return store.listTransportLogs(blockId, { from, to });
}

function createValidationError(message) {
  const error = new Error(message);
  error.statusCode = 400;
  return error;
}
