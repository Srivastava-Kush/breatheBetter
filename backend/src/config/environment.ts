import dotenv from 'dotenv';
dotenv.config();

function getEnv(name: string, fallback?: string): string {
  const value = process.env[name];
  if (!value && fallback === undefined) {
    return '';
  }
  return value || fallback || '';
}

const mongoUri = getEnv('MONGODB_URI', 'mongodb://localhost:27017/breathebetter');
const openaqKey = getEnv('OPENAQ_API_KEY', '');
const isMockMode = process.env['DATA_PROVIDER'] === 'mock' || !openaqKey || openaqKey.includes('your_openaq');

export const env = {
  port: parseInt(process.env['PORT'] || '5000', 10),
  nodeEnv: process.env['NODE_ENV'] || 'development',
  isDevelopment: process.env['NODE_ENV'] !== 'production',
  isMockMode,

  mongodb: {
    uri: mongoUri,
  },

  openaq: {
    apiKey: openaqKey,
    baseUrl: process.env['OPENAQ_BASE_URL'] || 'https://api.openaq.org/v3',
  },

  openMeteo: {
    enabled: process.env['OPEN_METEO_ENABLED'] !== 'false',
    baseUrl: process.env['OPEN_METEO_BASE_URL'] || 'https://air-quality-api.open-meteo.com/v1',
  },

  client: {
    url: process.env['CLIENT_URL'] || 'http://localhost:5173',
  },

  gemini: {
    apiKey: process.env['GEMINI_API_KEY'] || null,
  },

  jwt: {
    secret: process.env['JWT_SECRET'] || 'breathebetter-jwt-secret-key-2026',
    expiresIn: '30d',
  },
};
