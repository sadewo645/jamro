import http from 'node:http';
import { URL } from 'node:url';
import { HOST, PORT, CORS_ORIGINS } from './config.js';
import { Router } from './routes/router.js';
import { login, devElevate } from './controllers/authController.js';
import {
  listAfdelings,
  createAfdeling,
  getAfdeling,
  createBlock,
  getBlock,
  listHarvests,
  aggregateHarvest,
  aggregateWeather,
  listTransportLogs,
} from './controllers/estateController.js';
import { listPabrikStations, getStationMetrics, aggregatePabrik } from './controllers/pabrikController.js';
import { listNormaHK, updateNormaHK, listCostSummary } from './controllers/referenceController.js';
import { verifyToken } from './utils/jwt.js';
import { store } from './data/store.js';
import { SimulationClock } from './sim/clock.js';
import { DataGenerator } from './sim/generator.js';
import { EventStream } from './services/eventStream.js';

const router = new Router();
const clock = new SimulationClock({});
const generator = new DataGenerator(clock);
const eventStream = new EventStream({ store, clock });
clock.start();
generator.start();

const allowOriginHeader = CORS_ORIGINS.includes('*') ? '*' : null;

router.register('POST', '/auth/login', async ({ body }) => ({ status: 200, data: login(body) }));
router.register('POST', '/auth/dev-elevate', async ({ body }) => ({ status: 200, data: devElevate(body) }));

router.register('GET', '/afdelings', async () => ({ status: 200, data: listAfdelings() }), { auth: true });
router.register('POST', '/afdelings', async ({ body }) => ({ status: 201, data: createAfdeling(body) }), {
  auth: true,
  roles: ['DIREKTUR', 'PENGEMBANG'],
});
router.register('GET', '/afdelings/:id', async ({ params }) => ({ status: 200, data: getAfdeling(params.id) }), {
  auth: true,
});
router.register(
  'POST',
  '/afdelings/:id/blocks',
  async ({ params, body }) => ({ status: 201, data: createBlock(params.id, body) }),
  { auth: true, roles: ['DIREKTUR', 'PENGEMBANG'] },
);
router.register('GET', '/blocks/:id', async ({ params }) => ({ status: 200, data: getBlock(params.id) }), { auth: true });

router.register('GET', '/harvest', async ({ query }) => ({ status: 200, data: listHarvests(query) }), { auth: true });
router.register('GET', '/harvest/aggregate', async ({ query }) => ({ status: 200, data: aggregateHarvest(query) }), {
  auth: true,
});
router.register('GET', '/metrics/kebun', async ({ query }) => ({ status: 200, data: aggregateWeather(query) }), {
  auth: true,
});
router.register('GET', '/transport/logs', async ({ query }) => ({ status: 200, data: listTransportLogs(query) }), {
  auth: true,
});

router.register('GET', '/pabrik/stations', async () => ({ status: 200, data: listPabrikStations() }), { auth: true });
router.register(
  'GET',
  '/pabrik/stations/:id/metrics',
  async ({ params, query }) => ({ status: 200, data: getStationMetrics(params.id, query) }),
  { auth: true },
);
router.register('GET', '/pabrik/aggregate', async ({ query }) => ({ status: 200, data: aggregatePabrik(query) }), {
  auth: true,
});

router.register('GET', '/norma-hk', async () => ({ status: 200, data: listNormaHK() }), { auth: true });
router.register(
  'PUT',
  '/norma-hk/:id',
  async ({ params, body, user }) => ({ status: 200, data: updateNormaHK(params.id, body, user) }),
  { auth: true, roles: ['DIREKTUR', 'PENGEMBANG'] },
);

router.register('GET', '/cost/summary', async ({ query }) => ({ status: 200, data: listCostSummary(query) }), {
  auth: true,
});

router.register('GET', '/live', async ({ res }) => {
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    Connection: 'keep-alive',
  });
  eventStream.addClient(res);
  return { stream: true };
});

const server = http.createServer(async (req, res) => {
  try {
    setCorsHeaders(req, res);
    if (req.method === 'OPTIONS') {
      res.writeHead(204);
      res.end();
      return;
    }
    const url = new URL(req.url, `http://${req.headers.host}`);
    const route = router.match(req.method, url.pathname);
    if (!route) {
      res.writeHead(404, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ message: 'Not Found' }));
      return;
    }

    let user = null;
    if (route.options?.auth) {
      user = authenticate(req);
      if (route.options.roles && !route.options.roles.includes(user.role)) {
        const error = new Error('Tidak memiliki akses');
        error.statusCode = 403;
        throw error;
      }
    }

    const context = {
      req,
      res,
      params: route.params,
      query: Object.fromEntries(url.searchParams.entries()),
      body: await parseBody(req),
      user,
    };

    const result = await route.handler(context);
    if (result?.stream) {
      return;
    }
    const status = result?.status ?? 200;
    const data = result?.data ?? null;
    res.writeHead(status, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ data }));
  } catch (error) {
    const statusCode = error.statusCode ?? 500;
    res.writeHead(statusCode, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ message: error.message ?? 'Internal Server Error' }));
  }
});

server.listen(PORT, HOST, () => {
  console.log(`API server running at http://${HOST}:${PORT}`);
});

function setCorsHeaders(req, res) {
  const origin = req.headers.origin;
  if (allowOriginHeader) {
    res.setHeader('Access-Control-Allow-Origin', allowOriginHeader);
  } else if (origin && CORS_ORIGINS.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  }
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization');
  res.setHeader('Access-Control-Allow-Credentials', 'true');
}

async function parseBody(req) {
  if (req.method === 'GET' || req.method === 'DELETE') {
    return null;
  }
  const chunks = [];
  for await (const chunk of req) {
    chunks.push(chunk);
  }
  if (!chunks.length) {
    return {};
  }
  const raw = Buffer.concat(chunks).toString('utf8');
  if (!raw) return {};
  try {
    return JSON.parse(raw);
  } catch (error) {
    throw new Error('Payload tidak valid');
  }
}

function authenticate(req) {
  const header = req.headers.authorization;
  if (!header) {
    const error = new Error('Token diperlukan');
    error.statusCode = 401;
    throw error;
  }
  const [, token] = header.split(' ');
  try {
    const payload = verifyToken(token);
    const user = store.users.find((item) => item.id === payload.sub);
    if (!user) {
      const err = new Error('Pengguna tidak ditemukan');
      err.statusCode = 401;
      throw err;
    }
    return { ...payload, role: payload.role ?? user.role };
  } catch (error) {
    const err = new Error('Token tidak valid');
    err.statusCode = 401;
    throw err;
  }
}
