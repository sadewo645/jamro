export const SIMULATION_REAL_SECONDS_PER_SIM_DAY = Number.parseFloat(process.env.SIM_REAL_SECONDS_PER_SIM_DAY ?? '30');
export const SIMULATION_TICK_MS = Number.parseInt(process.env.SIM_TICK_MS ?? '1000', 10);
export const JWT_SECRET = process.env.JWT_SECRET ?? 'development-secret-change-me';
export const TOKEN_TTL_SECONDS = Number.parseInt(process.env.TOKEN_TTL_SECONDS ?? String(60 * 60 * 12), 10);
export const PORT = Number.parseInt(process.env.PORT ?? '4000', 10);
export const HOST = process.env.HOST ?? '0.0.0.0';
export const CORS_ORIGINS = (process.env.CORS_ORIGINS ?? '*').split(',').map((origin) => origin.trim());
