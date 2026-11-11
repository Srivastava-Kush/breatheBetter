import winston from 'winston';
import { env } from '../config/environment';

const { combine, timestamp, printf, colorize, json } = winston.format;

function safeStringify(obj: any): string {
  try {
    const seen = new WeakSet();
    return JSON.stringify(obj, (_key, value) => {
      if (typeof value === 'object' && value !== null) {
        if (seen.has(value)) return '[Circular]';
        seen.add(value);
        if (
          value.constructor &&
          (value.constructor.name === 'ClientRequest' ||
            value.constructor.name === 'IncomingMessage' ||
            value.constructor.name === 'Socket')
        ) {
          return '[HTTP Socket]';
        }
      }
      return value;
    });
  } catch {
    return String(obj);
  }
}

const devFormat = combine(
  colorize(),
  timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  printf(({ level, message, timestamp, ...rest }) => {
    const extra = Object.keys(rest).length ? ` ${safeStringify(rest)}` : '';
    return `[${timestamp}] ${level}: ${message}${extra}`;
  })
);

const prodFormat = combine(timestamp(), json());

export const logger = winston.createLogger({
  level: env.isDevelopment ? 'debug' : 'info',
  format: env.isDevelopment ? devFormat : prodFormat,
  transports: [new winston.transports.Console()],
});

