import winston from 'winston';
import { env } from '../config/environment';

const { combine, timestamp, printf, colorize, json } = winston.format;

const devFormat = combine(
  colorize(),
  timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  printf(({ level, message, timestamp, ...rest }) => {
    const extra = Object.keys(rest).length ? ` ${JSON.stringify(rest)}` : '';
    return `[${timestamp}] ${level}: ${message}${extra}`;
  })
);

const prodFormat = combine(timestamp(), json());

export const logger = winston.createLogger({
  level: env.isDevelopment ? 'debug' : 'info',
  format: env.isDevelopment ? devFormat : prodFormat,
  transports: [new winston.transports.Console()],
});

