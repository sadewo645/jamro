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
  const [afdelings, harvest, weather] = await Promise.all([
    apiRequest('/afdelings'),
    apiRequest('/harvest/aggregate?periode=day'),
    apiRequest('/metrics/kebun?periode=day'),
  ]);
  state.data.monitoring = { afdelings, harvest, weather };
}

function renderMonitoring() {
  const { afdelings = [], harvest = [], weather = [] } = state.data.monitoring ?? {};
  const harvestKpi = harvest.slice(-1)[0];
  const weatherKpi = weather.slice(-1)[0];
  contentSection.innerHTML = `
    <div class="module-header">
      <div>
        <h1>Monitoring Kebun</h1>
        <p class="muted">Percepatan waktu aktif, data terbaru diperbarui otomatis.</p>
      </div>
      <div class="filters">
        <span class="badge">Sim 1 hari = 30 detik</span>
      </div>
    </div>
    <div class="kpi-grid">
      <div class="kpi-card">
        <span class="kpi-title">TBS Hari Ini</span>
        <span class="kpi-value">${formatNumber(harvestKpi?.tbsTotalKg ?? 0)} kg</span>
      </div>
      <div class="kpi-card">
        <span class="kpi-title">Brondolan</span>
        <span class="kpi-value">${formatNumber(harvestKpi?.brondolanKg ?? 0)} kg</span>
      </div>
      <div class="kpi-card">
        <span class="kpi-title">Curah Hujan Rata-rata</span>
        <span class="kpi-value">${formatNumber(weatherKpi?.curahHujanAvg ?? 0)} mm</span>
      </div>
      <div class="kpi-card">
        <span class="kpi-title">Suhu Rata-rata</span>
        <span class="kpi-value">${formatNumber(weatherKpi?.suhuAvg ?? 0)} °C</span>
      </div>
    </div>
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
                        <span class="kpi-value">${block.varietas ?? 'N/A'}</span>
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
