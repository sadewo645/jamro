import crypto from 'node:crypto';
import {
  users as seedUsers,
  afdelings as seedAfdelings,
  blocks as seedBlocks,
  pabriks as seedPabriks,
  stations as seedStations,
  normaHK as seedNormaHK,
  costItems as seedCostItems,
} from './seed.js';

function makeId(prefix) {
  return `${prefix}-${crypto.randomUUID()}`;
}

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

export class DataStore {
  constructor() {
    this.users = clone(seedUsers);
    this.afdelings = clone(seedAfdelings);
    this.blocks = clone(seedBlocks);
    this.inputMandor = [];
    this.harvests = [];
    this.transportLogs = [];
    this.stationMetrics = [];
    this.pabriks = clone(seedPabriks);
    this.stations = clone(seedStations);
    this.normaHK = clone(seedNormaHK);
    this.costItems = clone(seedCostItems);
    this.payrolls = [];
    this.afdelingRequests = [];
    this.listeners = new Set();
  }

  subscribe(listener) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  emit(event, payload) {
    for (const listener of this.listeners) {
      listener(event, payload);
    }
  }

  findUserByEmail(email) {
    return this.users.find((user) => user.email.toLowerCase() === email.toLowerCase());
  }

  addInputMandor(entry) {
    const record = { id: makeId('input'), ...entry };
    this.inputMandor.push(record);
    this.emit('inputMandor', record);
    return record;
  }

  addHarvest(entry) {
    const record = { id: makeId('harvest'), ...entry };
    this.harvests.push(record);
    this.emit('harvest', record);
    return record;
  }

  addTransportLog(entry) {
    const record = { id: makeId('transport'), ...entry };
    this.transportLogs.push(record);
    this.emit('transport', record);
    return record;
  }

  addStationMetric(entry) {
    const record = { id: makeId('metric'), ...entry };
    this.stationMetrics.push(record);
    this.emit('stationMetric', record);
    return record;
  }

  createAfdeling(payload) {
    const record = {
      id: makeId('afd'),
      kodeUnik: payload.kodeUnik,
      nama: payload.nama,
      lokasi: payload.lokasi,
      luasHa: payload.luasHa,
      createdAt: new Date().toISOString(),
    };
    this.afdelings.push(record);
    this.emit('afdeling', record);
    return record;
  }

  createBlock(afdelingId, payload) {
    const record = {
      id: makeId('blk'),
      afdelingId,
      kodeUnik: payload.kodeUnik,
      nama: payload.nama,
      luasHa: payload.luasHa,
      tahunTanam: payload.tahunTanam,
      varietas: payload.varietas,
      createdAt: new Date().toISOString(),
    };
    this.blocks.push(record);
    this.emit('block', record);
    return record;
  }

  archiveBlock(blockId) {
    const block = this.blocks.find((item) => item.id === blockId);
    if (!block) return null;
    block.archivedAt = new Date().toISOString();
    this.emit('blockArchived', block);
    return block;
  }

  updateNormaHK(id, payload) {
    const record = this.normaHK.find((item) => item.id === id);
    if (!record) return null;
    Object.assign(record, payload, { updatedAt: new Date().toISOString() });
    this.emit('normaHK', record);
    return record;
  }

  listAfdelings() {
    return clone(this.afdelings);
  }

  listBlocksByAfdeling(afdelingId) {
    return this.blocks.filter((block) => block.afdelingId === afdelingId && !block.archivedAt).map(clone);
  }

  getAfdeling(id) {
    return clone(this.afdelings.find((item) => item.id === id));
  }

  getBlock(id) {
    return clone(this.blocks.find((item) => item.id === id));
  }

  listHarvestsByBlock(blockId, { from, to } = {}) {
    return this.harvests.filter((item) => item.blokId === blockId && this.filterByRange(item.tanggal, from, to)).map(clone);
  }

  listInputMandor(blockId, { from, to } = {}) {
    return this.inputMandor.filter((item) => item.blokId === blockId && this.filterByRange(item.tanggal, from, to)).map(clone);
  }

  listTransportLogs(blockId, { from, to } = {}) {
    return this.transportLogs
      .filter((item) => (!blockId || item.blokId === blockId) && this.filterByRange(item.waktu, from, to))
      .map(clone);
  }

  listStationMetrics(stationId, { from, to } = {}) {
    return this.stationMetrics.filter((item) => item.stasiunId === stationId && this.filterByRange(item.waktu, from, to)).map(clone);
  }

  listStations(pabrikId) {
    return this.stations.filter((station) => station.pabrikId === pabrikId).map(clone);
  }

  listPabriks() {
    return clone(this.pabriks);
  }

  listNormaHK() {
    return clone(this.normaHK);
  }

  listCostSummary({ periode } = {}) {
    const grouped = new Map();
    for (const item of this.costItems) {
      const key = item.kategori;
      const current = grouped.get(key) ?? { kategori: key, total: 0, items: [] };
      current.items.push({ ...item });
      current.total += item.hargaSatuan;
      grouped.set(key, current);
    }
    return Array.from(grouped.values());
  }

  filterByRange(timestamp, from, to) {
    const time = new Date(timestamp).getTime();
    if (Number.isNaN(time)) return false;
    if (from && time < new Date(from).getTime()) return false;
    if (to && time > new Date(to).getTime()) return false;
    return true;
  }

  aggregateHarvest({ periode = 'day', afdelingId, blockId }) {
    const grouping = new Map();
    for (const record of this.harvests) {
      if (afdelingId && this.blocks.find((block) => block.id === record.blokId)?.afdelingId !== afdelingId) continue;
      if (blockId && record.blokId !== blockId) continue;
      const key = this.makePeriodKey(record.tanggal, periode);
      if (!key) continue;
      const current = grouping.get(key) ?? { periode: key, tbsTotalKg: 0, brondolanKg: 0 };
      current.tbsTotalKg += record.tbsKg;
      current.brondolanKg += record.brondolanKg ?? 0;
      grouping.set(key, current);
    }
    return Array.from(grouping.values()).sort((a, b) => a.periode.localeCompare(b.periode));
  }

  aggregateInputMandor({ periode = 'day', afdelingId, blockId }) {
    const grouping = new Map();
    for (const record of this.inputMandor) {
      const block = this.blocks.find((item) => item.id === record.blokId);
      if (!block) continue;
      if (afdelingId && block.afdelingId !== afdelingId) continue;
      if (blockId && record.blokId !== blockId) continue;
      const key = this.makePeriodKey(record.tanggal, periode);
      const current = grouping.get(key) ?? {
        periode: key,
        curahHujanTotal: 0,
        suhuTotal: 0,
        kelembapanTotal: 0,
        jalanBaik: 0,
        jalanBuruk: 0,
        count: 0,
      };
      current.curahHujanTotal += record.curahHujanMm ?? 0;
      current.suhuTotal += record.suhuC ?? 0;
      current.kelembapanTotal += record.kelembapanTanahPct ?? 0;
      current.jalanBaik += record.statusJalan === 'baik' ? 1 : 0;
      current.jalanBuruk += record.statusJalan === 'buruk' ? 1 : 0;
      current.count += 1;
      grouping.set(key, current);
    }
    return Array.from(grouping.values())
      .map((item) => ({
        periode: item.periode,
        curahHujanTotal: item.curahHujanTotal,
        curahHujanAvg: item.count ? item.curahHujanTotal / item.count : 0,
        suhuAvg: item.count ? item.suhuTotal / item.count : 0,
        kelembapanAvg: item.count ? item.kelembapanTotal / item.count : 0,
        jalanBaik: item.jalanBaik,
        jalanBuruk: item.jalanBuruk,
        observasi: item.count,
      }))
      .sort((a, b) => a.periode.localeCompare(b.periode));
  }

  aggregatePabrik({ periode = 'day', pabrikId }) {
    const grouping = new Map();
    for (const record of this.stationMetrics) {
      const station = this.stations.find((item) => item.id === record.stasiunId);
      if (!station) continue;
      if (pabrikId && station.pabrikId !== pabrikId) continue;
      const key = this.makePeriodKey(record.waktu, periode);
      const current = grouping.get(key) ?? {
        periode: key,
        throughputTotal: 0,
        rendemenCpoTotal: 0,
        rendemenPkoTotal: 0,
        lossesTotal: 0,
        energiTotal: 0,
        count: 0,
      };
      current.throughputTotal += record.throughputTph ?? 0;
      current.rendemenCpoTotal += record.rendemenCpoPct ?? 0;
      current.rendemenPkoTotal += record.rendemenPkoPct ?? 0;
      current.lossesTotal += record.lossesPct ?? 0;
      current.energiTotal += record.energiKwh ?? 0;
      current.count += 1;
      grouping.set(key, current);
    }
    return Array.from(grouping.values()).map((item) => ({
      periode: item.periode,
      throughputAvg: item.count ? item.throughputTotal / item.count : 0,
      rendemenCpoAvg: item.count ? item.rendemenCpoTotal / item.count : 0,
      rendemenPkoAvg: item.count ? item.rendemenPkoTotal / item.count : 0,
      lossesAvg: item.count ? item.lossesTotal / item.count : 0,
      energiTotal: item.energiTotal,
    })).sort((a, b) => a.periode.localeCompare(b.periode));
  }

  makePeriodKey(timestamp, periode) {
    const date = new Date(timestamp);
    if (Number.isNaN(date.getTime())) return null;
    const year = date.getUTCFullYear();
    const month = `${date.getUTCMonth() + 1}`.padStart(2, '0');
    const day = `${date.getUTCDate()}`.padStart(2, '0');
    if (periode === 'day') return `${year}-${month}-${day}`;
    if (periode === 'month') return `${year}-${month}`;
    if (periode === 'year') return `${year}`;
    return null;
  }
}

export const store = new DataStore();
