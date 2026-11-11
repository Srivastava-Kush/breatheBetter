import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';
import { env } from '../../config/environment';
import { logger } from '../../utils/logger';

const RATE_LIMIT_DELAY_MS = 1050; // slightly over 1 second between requests to stay under 60/min
const MAX_RETRIES = 3;

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function createOpenAQClient(): AxiosInstance {
  const client = axios.create({
    baseURL: env.openaq.baseUrl,
    timeout: 30000,
    headers: {
      'X-API-Key': env.openaq.apiKey,
      'Accept': 'application/json',
      'Content-Type': 'application/json',
    },
  });

  // Request logging
  client.interceptors.request.use((config) => {
    logger.debug(`OpenAQ → ${config.method?.toUpperCase()} ${config.url}`, {
      params: config.params,
    });
    return config;
  });

  // Response logging + rate-limit inspection
  client.interceptors.response.use(
    (response) => {
      const remaining = response.headers['x-ratelimit-remaining'];
      const reset = response.headers['x-ratelimit-reset'];
      if (remaining !== undefined) {
        logger.debug(`OpenAQ rate limit remaining: ${remaining}, reset: ${reset}`);
        if (parseInt(remaining, 10) < 5) {
          logger.warn('OpenAQ rate limit nearly exhausted. Slowing down.');
        }
      }
      return response;
    },
    (error) => {
      if (error.response?.status === 429) {
        logger.warn('OpenAQ rate limit hit (429). Will retry with backoff.');
      }
      return Promise.reject(error);
    }
  );

  return client;
}

export const openaqClient = createOpenAQClient();

/**
 * Make a request to OpenAQ with exponential-backoff retry on transient errors.
 */
export async function openaqRequest<T>(
  config: AxiosRequestConfig,
  attempt = 1
): Promise<AxiosResponse<T>> {
  try {
    const response = await openaqClient.request<T>(config);
    return response;
  } catch (error: unknown) {
    const axiosError = error as { response?: { status?: number }; message?: string };
    const status = axiosError.response?.status;
    const isTransient = !status || status === 429 || status >= 500;

    if (isTransient && attempt < MAX_RETRIES) {
      const delay = Math.pow(2, attempt) * 1000 + Math.random() * 500;
      logger.warn(`OpenAQ request failed (attempt ${attempt}/${MAX_RETRIES}). Retrying in ${Math.round(delay)}ms...`);
      await sleep(delay);
      return openaqRequest<T>(config, attempt + 1);
    }

    if (status === 404) {
      logger.warn(`OpenAQ resource not found (404): ${config.url}`);
    } else {
      logger.error(`OpenAQ request failed permanently after ${attempt} attempt(s):`, {
        url: config.url,
        status,
        message: axiosError.message,
      });
    }
    throw error;
  }
}

/** Rate-limited sequential request helper */
export async function rateLimitedRequest<T>(
  config: AxiosRequestConfig
): Promise<AxiosResponse<T>> {
  await sleep(RATE_LIMIT_DELAY_MS);
  return openaqRequest<T>(config);
}

