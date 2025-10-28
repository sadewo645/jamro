const API_BASE = window.__API_BASE__ ?? 'http://localhost:4000';

const modules = [
  { id: 'monitoring', label: 'Monitoring Kebun' },
  { id: 'pabrik', label: 'Monitoring Pabrik' },
  { id: 'panduan', label: 'Panduan Budidaya' },
  { id: 'norma', label: 'Norma HK' },
  { id: 'cost', label: 'Cost Produksi' },
];

const state = {
  token: null,
  user: null,
  activeModule: 'monitoring',
  data: {},
};

const authSection = document.getElementById('auth-section');
const contentSection = document.getElementById('content-section');
const navEl = document.getElementById('module-nav');
const userBadge = document.getElementById('user-badge');
const logoutBtn = document.getElementById('logout-btn');

renderAuthForm();
renderNav();
updateUserBadge();
logoutBtn.addEventListener('click', () => {
  state.token = null;
  state.user = null;
  state.data = {};
  toggleAuth(true);
  updateUserBadge();
});

function renderAuthForm() {
  authSection.innerHTML = `
    <h1>Masuk ke Jamro</h1>
    <p class="muted">Gunakan akun Mandor/Direktur atau kode pengembang sementara.</p>
    <div class="form-grid">
      <form id="login-form">
        <label>Email
          <input type="email" name="email" required placeholder="nama@contoh.com" />
        </label>
        <label>Password
          <input type="password" name="password" required placeholder="••••••" />
        </label>
        <button class="primary" type="submit">Masuk</button>
      </form>
      <div class="divider"></div>
      <form id="dev-form">
        <label>Kode Pengembang
          <input type="password" name="code" required placeholder="123456" />
        </label>
        <button class="primary" type="submit">Elevasi</button>
      </form>
      <div id="auth-message"></div>
    </div>
  `;

  const loginForm = document.getElementById('login-form');
  const devForm = document.getElementById('dev-form');
  const message = document.getElementById('auth-message');

  loginForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    const formData = new FormData(loginForm);
    try {
      const result = await apiRequest('/auth/login', {
        method: 'POST',
        body: {
          email: formData.get('email'),
          password: formData.get('password'),
        },
      });
      state.token = result.token;
      state.user = result.user;
      toggleAuth(false);
      updateUserBadge();
      await loadModule(state.activeModule);
    } catch (error) {
      message.textContent = error.message;
      message.className = 'alert';
    }
  });

  devForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    const formData = new FormData(devForm);
    try {
      const result = await apiRequest('/auth/dev-elevate', {
        method: 'POST',
        body: { code: formData.get('code') },
      });
      state.token = result.token;
      state.user = { id: 'dev', name: 'Pengembang', role: 'PENGEMBANG' };
      toggleAuth(false);
      updateUserBadge();
      await loadModule(state.activeModule);
    } catch (error) {
      message.textContent = error.message;
      message.className = 'alert';
    }
  });
}

function renderNav() {
  navEl.innerHTML = '';
  modules.forEach((module) => {
    const button = document.createElement('button');
    button.textContent = module.label;
    button.classList.toggle('active', state.activeModule === module.id);
    button.addEventListener('click', async () => {
      if (!state.token) {
        return;
      }
      state.activeModule = module.id;
      renderNav();
      await loadModule(module.id);
    });
    navEl.appendChild(button);
  });
}

async function loadModule(moduleId) {
  toggleAuth(false);
  try {
    if (moduleId === 'monitoring') {
      await loadMonitoring();
      renderMonitoring();
    } else if (moduleId === 'pabrik') {
      await loadPabrik();
      renderPabrik();
    } else if (moduleId === 'panduan') {
      renderPanduan();
    } else if (moduleId === 'norma') {
      await loadNorma();
      renderNorma();
    } else if (moduleId === 'cost') {
      await loadCost();
      renderCost();
    }
  } catch (error) {
    contentSection.innerHTML = `<div class="alert">${error.message}</div>`;
  }
}

async function loadMonitoring() {
  const [afdelings, harvestDaily, weatherDaily, weatherMonthly, harvestMonthly] = await Promise.all([
    apiRequest('/afdelings'),
    apiRequest('/harvest/aggregate?periode=day'),
    apiRequest('/metrics/kebun?periode=day'),
    apiRequest('/metrics/kebun?periode=month'),
    apiRequest('/harvest/aggregate?periode=month'),
  ]);
  state.data.monitoring = {
    afdelings,
    harvestDaily,
    weatherDaily,
    weatherMonthly,
    harvestMonthly,
  };
}

function renderMonitoring() {
  const {
    afdelings = [],
    harvestDaily = [],
    harvestMonthly = [],
    weatherDaily = [],
    weatherMonthly = [],
  } = state.data.monitoring ?? {};

  const latestWeatherDaily = weatherDaily.at(-1) ?? {};
  const latestHarvestDaily = harvestDaily.at(-1) ?? {};
  const latestWeatherMonthly = weatherMonthly.at(-1) ?? {};
  const latestHarvestMonthly = harvestMonthly.at(-1) ?? {};

  const rainfallMonthlySeries = weatherMonthly
    .slice(-12)
    .map((item) => ({
      label: formatPeriodLabel(item.periode),
      value: item.curahHujanTotal ?? 0,
    }));

  const harvestMonthlySeries = harvestMonthly
    .slice(-12)
    .map((item) => ({
      label: formatPeriodLabel(item.periode),
      value: (item.tbsTotalKg ?? 0) / 1000,
    }));

  const rainfallStatus = classifyRange(latestWeatherMonthly.curahHujanTotal, {
    min: 150,
    max: 250,
  });
  const moistureStatus = classifyRange(latestWeatherDaily.kelembapanAvg, {
    min: 28,
    max: 35,
    tolerance: 0.2,
  });
  const temperatureStatus = classifyRange(latestWeatherDaily.suhuAvg, {
    min: 24,
    max: 32,
  });

  const totalObservasi = latestWeatherDaily.observasi ?? 0;
  const jalanBaikPersentase = totalObservasi
    ? Math.round((latestWeatherDaily.jalanBaik / totalObservasi) * 100)
    : 0;
  const jalanStatus = classifyRange(jalanBaikPersentase, {
    min: 70,
    max: 100,
    tolerance: 0.05,
  });

  contentSection.innerHTML = `
    <div class="module-header">
      <div>
        <h1>Monitoring Kebun</h1>
        <p class="muted">Data real-time dari simulasi percepatan waktu.</p>
      </div>
      <div class="filters">
        <span class="badge">Sim 1 hari = 30 detik</span>
        <span class="badge">${formatNumber(afdelings.length)} Afdeling</span>
      </div>
    </div>
    <div class="overview-grid">
      <div class="card rain-card">
        <div class="card-header">
          <div>
            <h2>Curah Hujan Bulanan</h2>
            <p class="muted">Total akumulasi setiap bulan (mm)</p>
          </div>
          ${renderStatusBadge(rainfallStatus)}
        </div>
        <div class="rain-highlight">
          <span class="rain-value">${formatNumber(latestWeatherMonthly.curahHujanTotal ?? 0)}</span>
          <span class="rain-unit">mm</span>
        </div>
        <p class="muted">Optimal 150 – 250 mm/bulan</p>
        ${renderBarChart(rainfallMonthlySeries, { unit: ' mm', highlightLatest: true })}
      </div>
      <div class="card climate-card">
        <div class="card-header">
          <div>
            <h2>Tren Kelembapan &amp; Suhu</h2>
            <p class="muted">Rata-rata per bulan</p>
          </div>
          <div class="legend">
            <span><span class="dot humidity"></span>Kelembapan (%)</span>
            <span><span class="dot temperature"></span>Suhu (°C)</span>
          </div>
        </div>
        ${renderClimateChart(weatherMonthly)}
      </div>
    </div>
    <div class="card">
      <div class="section-header">
        <h2>Monitoring Tanah</h2>
        <p class="muted">Snapshot harian berdasarkan input mandor terakhir.</p>
      </div>
      <div class="soil-grid">
        <div class="soil-card">
          <div class="soil-meta">
            <span class="soil-title">Curah Hujan</span>
            ${renderStatusBadge(rainfallStatus)}
          </div>
          <div class="soil-value">${formatNumber(latestWeatherMonthly.curahHujanTotal ?? 0)}<span> mm/bln</span></div>
          <p class="muted">Target 150 – 250 mm/bulan</p>
        </div>
        <div class="soil-card">
          <div class="soil-meta">
            <span class="soil-title">Kelembapan Tanah</span>
            ${renderStatusBadge(moistureStatus)}
          </div>
          <div class="soil-value">${formatNumber(latestWeatherDaily.kelembapanAvg ?? 0)}<span> %</span></div>
          <p class="muted">Ideal 28 – 35 %</p>
        </div>
        <div class="soil-card">
          <div class="soil-meta">
            <span class="soil-title">Suhu Udara</span>
            ${renderStatusBadge(temperatureStatus)}
          </div>
          <div class="soil-value">${formatNumber(latestWeatherDaily.suhuAvg ?? 0)}<span> °C</span></div>
          <p class="muted">Rentang 24 – 32 °C</p>
        </div>
        <div class="soil-card">
          <div class="soil-meta">
            <span class="soil-title">Kondisi Jalan</span>
            ${renderStatusBadge(jalanStatus)}
          </div>
          <div class="soil-value">${formatNumber(jalanBaikPersentase)}<span> %</span></div>
          <p class="muted">${formatNumber(latestWeatherDaily.jalanBaik ?? 0)} dari ${formatNumber(totalObservasi)} laporan baik</p>
        </div>
      </div>
    </div>
    <div class="card">
      <div class="section-header">
        <h2>Hasil Panen</h2>
        <p class="muted">Akumulasi tonase per bulan dan snapshot harian.</p>
      </div>
      <div class="harvest-grid">
        <div class="harvest-highlight">
          <span class="harvest-label">TBS Bulan Ini</span>
          <div class="harvest-value">${formatNumber((latestHarvestMonthly.tbsTotalKg ?? 0) / 1000)}<span> ton</span></div>
          <p class="muted">Brondolan: ${formatNumber((latestHarvestMonthly.brondolanKg ?? 0) / 1000)} ton</p>
          <div class="divider"></div>
          <span class="harvest-label">Update Harian</span>
          <p class="muted">${formatNumber(latestHarvestDaily.tbsTotalKg ?? 0)} kg TBS • ${formatNumber(latestHarvestDaily.brondolanKg ?? 0)} kg brondolan</p>
        </div>
        <div class="harvest-chart">
          ${renderBarChart(harvestMonthlySeries, { unit: ' ton', highlightLatest: true })}
        </div>
      </div>
    </div>
    <div class="card">
      <h2>Afdeling</h2>
      <div class="list">
        ${afdelings
          .map((afdeling) => {
            const blockCount = afdeling.blocks?.length ?? 0;
            return `
              <div class="list-item">
                <div class="flex-between">
                  <div>
                    <h3>${afdeling.nama}</h3>
                    <p class="muted">Kode ${afdeling.kodeUnik} • ${blockCount} blok</p>
                  </div>
                  <span class="badge">${formatNumber(afdeling.luasHa)} ha</span>
                </div>
                <div class="kpi-grid">
                  ${afdeling.blocks
                    .map(
                      (block) => `
                        <div class="kpi-card">
                          <span class="kpi-title">${block.nama}</span>
                          <span class="kpi-value">${block.varietas ?? 'Varietas belum diisi'}</span>
                          <span class="muted">Tahun tanam ${block.tahunTanam ?? '—'}</span>
                        </div>
                      `,
                    )
                    .join('')}
                </div>
              </div>
            `;
          })
          .join('')}
      </div>
    </div>
  `;
  toggleAuth(false);
}

async function loadPabrik() {
  const [stations, aggregate] = await Promise.all([
    apiRequest('/pabrik/stations'),
    apiRequest('/pabrik/aggregate?periode=day'),
  ]);
  state.data.pabrik = { stations, aggregate };
}

function renderPabrik() {
  const { stations = [], aggregate = [] } = state.data.pabrik ?? {};
  const last = aggregate.slice(-1)[0];
  contentSection.innerHTML = `
    <div class="module-header">
      <div>
        <h1>Monitoring Pabrik</h1>
        <p class="muted">Rekap throughput, rendemen, dan losses per stasiun.</p>
      </div>
      <div class="filters">
        <span class="badge">OEE Simulasi</span>
      </div>
    </div>
    <div class="kpi-grid">
      <div class="kpi-card">
        <span class="kpi-title">Throughput Rata-rata</span>
        <span class="kpi-value">${formatNumber(last?.throughputAvg ?? 0)} tph</span>
      </div>
      <div class="kpi-card">
        <span class="kpi-title">Rendemen CPO</span>
        <span class="kpi-value">${formatNumber(last?.rendemenCpoAvg ?? 0)} %</span>
      </div>
      <div class="kpi-card">
        <span class="kpi-title">Energi Harian</span>
        <span class="kpi-value">${formatNumber(last?.energiTotal ?? 0)} kWh</span>
      </div>
    </div>
    <h2>Stasiun</h2>
    <div class="list">
      ${stations
        .flatMap((pabrik) =>
          pabrik.stations.map(
            (station) => `
              <div class="list-item">
                <div class="flex-between">
                  <div>
                    <h3>${station.nama}</h3>
                    <p class="muted">Pabrik ${pabrik.nama}</p>
                  </div>
                  <span class="badge">Urutan ${station.urutan}</span>
                </div>
                <p class="muted">Pantau metrik detail via API /pabrik/stations/${station.id}/metrics</p>
              </div>
            `,
          ),
        )
        .join('')}
    </div>
  `;
}

async function loadNorma() {
  const norma = await apiRequest('/norma-hk');
  state.data.norma = norma;
}

function renderNorma() {
  const { norma = [] } = state.data;
  const canEdit = ['DIREKTUR', 'PENGEMBANG'].includes(state.user?.role);
  contentSection.innerHTML = `
    <div class="module-header">
      <div>
        <h1>Norma Hari Kerja</h1>
        <p class="muted">Parameter dasar perhitungan HK dan payroll.</p>
      </div>
      ${canEdit ? '<span class="badge">Mode edit diizinkan</span>' : ''}
    </div>
    <table class="table">
      <thead>
        <tr>
          <th>Pekerjaan</th>
          <th>Norma HK</th>
          <th>Satuan</th>
          <th>Catatan</th>
          <th>Update</th>
        </tr>
      </thead>
      <tbody>
        ${norma
          .map(
            (item) => `
              <tr>
                <td>${item.pekerjaan}</td>
                <td>${item.normaHk}</td>
                <td>${item.satuan}</td>
                <td>${item.catatan ?? ''}</td>
                <td>${new Date(item.updatedAt).toLocaleString('id-ID')}</td>
              </tr>
            `,
          )
          .join('')}
      </tbody>
    </table>
  `;
}

async function loadCost() {
  const summary = await apiRequest('/cost/summary');
  state.data.cost = summary;
}

function renderCost() {
  const { cost = [] } = state.data;
  contentSection.innerHTML = `
    <div class="module-header">
      <div>
        <h1>Ringkasan Biaya Produksi</h1>
        <p class="muted">Kalkulasi kategori biaya dari feed simulasi.</p>
      </div>
    </div>
    <div class="list">
      ${cost
        .map(
          (item) => `
            <div class="list-item">
              <div class="flex-between">
                <h3>${item.kategori}</h3>
                <span class="badge">Total Rp ${formatNumber(item.total)}</span>
              </div>
              <ul>
                ${item.items
                  .map((detail) => `<li>${detail.uraian} • Rp ${formatNumber(detail.hargaSatuan)} / ${detail.satuan}</li>`)
                  .join('')}
              </ul>
            </div>
          `,
        )
        .join('')}
    </div>
  `;
}

function renderPanduan() {
  contentSection.innerHTML = `
    <div class="module-header">
      <div>
        <h1>Panduan Budidaya</h1>
        <p class="muted">Kurasi internal yang siap diintegrasi dengan CMS ringan.</p>
      </div>
    </div>
    <article class="list-item">
      <h3>1. Persiapan Lahan &amp; Pembibitan</h3>
      <p>
        Gunakan bibit bersertifikat varietas tenera dengan tingkat kecambah &gt; 95%. Pastikan pH tanah pada kisaran 4.5 - 6.0 dan lakukan
        penanaman penutup tanah leguminosa untuk menjaga kelembapan.
      </p>
      <h3>2. Pemeliharaan Blok</h3>
      <p>
        Monitoring curah hujan, suhu, dan kelembapan tanah diintegrasikan otomatis dari input mandor. Sistem akan memberi peringatan
        jika curah hujan &lt; 5 mm atau suhu &gt; 34 °C untuk lebih dari dua hari simulasi berturut-turut.
      </p>
      <h3>3. Panen &amp; Transportasi</h3>
      <p>
        Jadwalkan panen berdasarkan umur brondolan dan estimasi produksi per blok. Gunakan kode unik blok saat membuat SPB agar data
        ritase dan tonase terhubung ke dashboard monitoring.
      </p>
      <h3>4. Integrasi Norma HK</h3>
      <p>
        Norma HK menjadi acuan payroll otomatis. Direktur dapat melakukan revisi melalui modul Norma HK dan histori perubahan
        tersimpan pada backend.
      </p>
    </article>
  `;
}

function renderBarChart(items, { unit = '', highlightLatest = false } = {}) {
  if (!items?.length) {
    return '<div class="empty-state">Data belum tersedia</div>';
  }

  const sanitized = items.map((item) => ({
    label: item.label ?? '',
    value: Number.isFinite(item.value) ? item.value : 0,
  }));

  const maxValue = Math.max(...sanitized.map((item) => item.value), 0);
  const divisor = maxValue === 0 ? 1 : maxValue;

  return `
    <div class="bar-chart">
      ${sanitized
        .map((item, index) => {
          const height = Math.round((item.value / divisor) * 100);
          const barHeight = Math.max(height, 4);
          const latestClass = highlightLatest && index === sanitized.length - 1 ? 'latest' : '';
          return `
            <div class="bar">
              <div class="bar-fill ${latestClass}" style="height: ${barHeight}%"></div>
              <span class="bar-value">${formatNumber(item.value)}${unit}</span>
              <span class="bar-label">${item.label}</span>
            </div>
          `;
        })
        .join('')}
    </div>
  `;
}

function renderClimateChart(records) {
  if (!records?.length) {
    return '<div class="empty-state">Data belum tersedia</div>';
  }

  const series = records.slice(-12);
  const values = series
    .flatMap((item) => [item.kelembapanAvg ?? null, item.suhuAvg ?? null])
    .filter((value) => Number.isFinite(value));

  if (!values.length) {
    return '<div class="empty-state">Data belum tersedia</div>';
  }

  const width = 560;
  const height = 220;
  const paddingX = 36;
  const paddingTop = 18;
  const paddingBottom = 38;
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;
  const step = series.length > 1 ? (width - paddingX * 2) / (series.length - 1) : 0;

  const humidityPoints = [];
  const temperaturePoints = [];

  series.forEach((item, index) => {
    const x = paddingX + step * index;
    const humidityValue = Number.isFinite(item.kelembapanAvg) ? item.kelembapanAvg : min;
    const temperatureValue = Number.isFinite(item.suhuAvg) ? item.suhuAvg : min;
    const humidityY =
      paddingTop + (1 - (humidityValue - min) / range) * (height - paddingTop - paddingBottom);
    const temperatureY =
      paddingTop + (1 - (temperatureValue - min) / range) * (height - paddingTop - paddingBottom);
    humidityPoints.push(`${x.toFixed(1)},${humidityY.toFixed(1)}`);
    temperaturePoints.push(`${x.toFixed(1)},${temperatureY.toFixed(1)}`);
  });

  if (humidityPoints.length === 1) {
    const [x, y] = humidityPoints[0].split(',').map(Number);
    humidityPoints.push(`${(x + 1).toFixed(1)},${y.toFixed(1)}`);
  }
  if (temperaturePoints.length === 1) {
    const [x, y] = temperaturePoints[0].split(',').map(Number);
    temperaturePoints.push(`${(x + 1).toFixed(1)},${y.toFixed(1)}`);
  }

  const axisY = height - paddingBottom;
  const lastHumidity = humidityPoints.slice(-1)[0];
  const lastTemperature = temperaturePoints.slice(-1)[0];

  return `
    <div class="climate-chart-wrap">
      <svg viewBox="0 0 ${width} ${height}" class="climate-chart" preserveAspectRatio="none">
        <defs>
          <linearGradient id="humidityGradient" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stop-color="rgba(34, 211, 238, 0.35)" />
            <stop offset="100%" stop-color="rgba(34, 211, 238, 0.05)" />
          </linearGradient>
          <linearGradient id="temperatureGradient" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stop-color="rgba(248, 113, 113, 0.35)" />
            <stop offset="100%" stop-color="rgba(248, 113, 113, 0.05)" />
          </linearGradient>
        </defs>
        <line x1="${paddingX}" y1="${axisY}" x2="${width - paddingX}" y2="${axisY}" class="chart-axis" />
        <polyline points="${humidityPoints.join(' ')}" class="line humidity" />
        <polyline points="${temperaturePoints.join(' ')}" class="line temperature" />
        ${lastHumidity ? `<circle class="chart-point humidity" cx="${lastHumidity.split(',')[0]}" cy="${lastHumidity.split(',')[1]}" r="4" />` : ''}
        ${lastTemperature ? `<circle class="chart-point temperature" cx="${lastTemperature.split(',')[0]}" cy="${lastTemperature.split(',')[1]}" r="4" />` : ''}
      </svg>
      <div class="chart-labels">
        ${series.map((item) => `<span>${formatPeriodLabel(item.periode)}</span>`).join('')}
      </div>
    </div>
  `;
}

function renderStatusBadge(status) {
  if (!status) {
    return '<span class="status muted">N/A</span>';
  }
  return `<span class="status ${status.tone}">${status.label}</span>`;
}

function classifyRange(value, { min = Number.NEGATIVE_INFINITY, max = Number.POSITIVE_INFINITY, tolerance = 0.1 } = {}) {
  if (value == null || Number.isNaN(value)) {
    return { label: 'Tidak ada data', tone: 'muted' };
  }

  const lower = min ?? Number.NEGATIVE_INFINITY;
  const upper = max ?? Number.POSITIVE_INFINITY;
  if (value >= lower && value <= upper) {
    return { label: 'Optimal', tone: 'optimal' };
  }

  const lowerWarn = Number.isFinite(lower) ? lower * (1 - tolerance) : Number.NEGATIVE_INFINITY;
  const upperWarn = Number.isFinite(upper) ? upper * (1 + tolerance) : Number.POSITIVE_INFINITY;
  if (value < lowerWarn || value > upperWarn) {
    return { label: 'Kritis', tone: 'critical' };
  }

  return { label: 'Perlu atensi', tone: 'warning' };
}

function formatPeriodLabel(periode) {
  if (!periode) return '';
  if (/^\d{4}-\d{2}-\d{2}$/.test(periode)) {
    const [year, month, day] = periode.split('-').map(Number);
    const date = new Date(Date.UTC(year, month - 1, day));
    return date.toLocaleDateString('id-ID', { day: '2-digit', month: 'short' });
  }
  if (/^\d{4}-\d{2}$/.test(periode)) {
    const [year, month] = periode.split('-').map(Number);
    const date = new Date(Date.UTC(year, month - 1, 1));
    return date.toLocaleDateString('id-ID', { month: 'short' });
  }
  if (/^\d{4}$/.test(periode)) {
    return periode;
  }
  return periode;
}

function toggleAuth(showAuth) {
  if (showAuth) {
    authSection.classList.remove('hidden');
    contentSection.classList.add('hidden');
  } else {
    authSection.classList.add('hidden');
    contentSection.classList.remove('hidden');
  }
}

function updateUserBadge() {
  if (!state.user) {
    userBadge.textContent = 'Belum masuk';
    return;
  }
  userBadge.innerHTML = `Login sebagai <strong>${state.user.name}</strong> • ${state.user.role}`;
}

async function apiRequest(path, { method = 'GET', body } = {}) {
  const headers = {};
  if (body) {
    headers['Content-Type'] = 'application/json';
  }
  if (state.token) {
    headers.Authorization = `Bearer ${state.token}`;
  }
  const response = await fetch(`${API_BASE}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });
  const contentType = response.headers.get('content-type') ?? '';
  const payload = contentType.includes('application/json') ? await response.json() : null;
  if (!response.ok) {
    const message = payload?.message ?? 'Terjadi kesalahan';
    throw new Error(message);
  }
  return payload?.data ?? payload ?? null;
}

function formatNumber(value) {
  return new Intl.NumberFormat('id-ID', { maximumFractionDigits: 2 }).format(value ?? 0);
}

if (!!window.EventSource) {
  const stream = new EventSource(`${API_BASE}/live`);
  stream.addEventListener('tick', (event) => {
    const data = JSON.parse(event.data);
    document.title = `Jamro • ${new Date(data.now).toLocaleString('id-ID')}`;
  });
}
