import crypto from 'node:crypto';

const now = new Date();

function hashPassword(password) {
  return crypto.createHash('sha256').update(password).digest('hex');
}

export const users = [
  {
    id: 'u-director',
    name: 'Direktur Utama',
    email: 'director@example.com',
    role: 'DIREKTUR',
    passwordHash: hashPassword('director123'),
  },
  {
    id: 'u-mandor',
    name: 'Mandor A',
    email: 'mandor@example.com',
    role: 'MANDOR',
    passwordHash: hashPassword('mandor123'),
  },
  {
    id: 'u-worker',
    name: 'Pekerja 1',
    email: 'pekerja@example.com',
    role: 'PEKERJA',
    passwordHash: hashPassword('pekerja123'),
  },
  {
    id: 'u-dev',
    name: 'Pengembang',
    email: 'dev@example.com',
    role: 'PENGEMBANG',
    passwordHash: hashPassword('dev123456'),
  },
];

export const afdelings = [
  {
    id: 'afd-01',
    kodeUnik: 'AFD-01',
    nama: 'Afdeling Utara',
    lokasi: 'Koordinat -1.2, 102.3',
    luasHa: 350,
    createdAt: now.toISOString(),
  },
  {
    id: 'afd-02',
    kodeUnik: 'AFD-02',
    nama: 'Afdeling Selatan',
    lokasi: 'Koordinat -1.5, 102.1',
    luasHa: 290,
    createdAt: now.toISOString(),
  },
];

export const blocks = [
  {
    id: 'blk-01',
    kodeUnik: 'AFD01-B01',
    afdelingId: 'afd-01',
    nama: 'Blok Utara 1',
    luasHa: 45,
    tahunTanam: 2010,
    varietas: 'Tenera',
    createdAt: now.toISOString(),
  },
  {
    id: 'blk-02',
    kodeUnik: 'AFD01-B02',
    afdelingId: 'afd-01',
    nama: 'Blok Utara 2',
    luasHa: 40,
    tahunTanam: 2012,
    varietas: 'Tenera',
    createdAt: now.toISOString(),
  },
  {
    id: 'blk-03',
    kodeUnik: 'AFD02-B01',
    afdelingId: 'afd-02',
    nama: 'Blok Selatan 1',
    luasHa: 55,
    tahunTanam: 2009,
    varietas: 'Dura',
    createdAt: now.toISOString(),
  },
];

export const pabriks = [
  {
    id: 'mill-01',
    nama: 'Pabrik Utama',
    lokasi: 'Kompleks Pabrik',
  },
];

export const stations = [
  { id: 'st-01', pabrikId: 'mill-01', nama: 'Timbang', urutan: 1 },
  { id: 'st-02', pabrikId: 'mill-01', nama: 'Sterilizer', urutan: 2 },
  { id: 'st-03', pabrikId: 'mill-01', nama: 'Thresher', urutan: 3 },
  { id: 'st-04', pabrikId: 'mill-01', nama: 'Press', urutan: 4 },
  { id: 'st-05', pabrikId: 'mill-01', nama: 'Clarification', urutan: 5 },
];

export const normaHK = [
  {
    id: 'nhk-01',
    pekerjaan: 'Panen TBS',
    normaHk: 1.2,
    satuan: 'HK/ha',
    catatan: 'Target harian panen per hektar',
    lastUpdatedBy: 'u-director',
    updatedAt: now.toISOString(),
  },
  {
    id: 'nhk-02',
    pekerjaan: 'Perawatan Jalan',
    normaHk: 0.4,
    satuan: 'HK/km',
    catatan: 'Termasuk perataan dan pengerasan',
    lastUpdatedBy: 'u-director',
    updatedAt: now.toISOString(),
  },
];

export const costItems = [
  {
    id: 'cost-01',
    kategori: 'Pemupukan',
    uraian: 'NPK 15-15-15',
    satuan: 'kg',
    hargaSatuan: 8500,
  },
  {
    id: 'cost-02',
    kategori: 'Energi',
    uraian: 'Bahan bakar boiler',
    satuan: 'liter',
    hargaSatuan: 11500,
  },
];
