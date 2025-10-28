import { store } from '../data/store.js';

function randomBetween(min, max, fixed = 2) {
  const value = Math.random() * (max - min) + min;
  return Number.parseFloat(value.toFixed(fixed));
}

export class DataGenerator {
  constructor(clock) {
    this.clock = clock;
    this.lastGeneratedDay = null;
  }

  start() {
    this.clock.subscribe((simTime) => this.handleTick(simTime));
  }

  handleTick(simTime) {
    const dayKey = simTime.toISOString().slice(0, 10);
    if (dayKey === this.lastGeneratedDay) {
      return;
    }
    this.generateForDay(simTime);
    this.lastGeneratedDay = dayKey;
  }

  generateForDay(simTime) {
    const isoDate = simTime.toISOString();
    for (const block of store.blocks) {
      const curahHujan = randomBetween(3, 25);
      const suhu = randomBetween(24, 34);
      const kelembapan = randomBetween(55, 80);
      store.addInputMandor({
        blokId: block.id,
        tanggal: isoDate,
        curahHujanMm: curahHujan,
        suhuC: suhu,
        kelembapanTanahPct: kelembapan,
        statusJalan: Math.random() > 0.2 ? 'baik' : 'buruk',
        catatan: 'Data simulasi otomatis',
      });

      const tbsKg = randomBetween(5000, 15000, 0);
      const brondolanKg = randomBetween(200, 800, 0);
      store.addHarvest({
        blokId: block.id,
        tanggal: isoDate,
        tbsKg,
        brondolanKg,
        jjPct: randomBetween(15, 25),
        keterangan: 'Hasil panen simulasi',
      });

      store.addTransportLog({
        blokId: block.id,
        waktu: isoDate,
        kendaraanId: `TRK-${Math.floor(Math.random() * 10) + 1}`,
        beratTbsKg: tbsKg * 0.95,
        tujuanPabrikId: 'mill-01',
        rute: ['blok', 'jalan utama', 'pabrik'],
        status: 'dikirim',
      });
    }

    for (const station of store.stations) {
      store.addStationMetric({
        stasiunId: station.id,
        waktu: isoDate,
        throughputTph: randomBetween(10, 40),
        rendemenCpoPct: randomBetween(20, 25),
        rendemenPkoPct: randomBetween(3, 5),
        lossesPct: randomBetween(1, 3),
        suhuC: randomBetween(80, 110),
        tekananBar: randomBetween(1.5, 3.5),
        energiKwh: randomBetween(1500, 2500, 0),
      });
    }
  }
}
