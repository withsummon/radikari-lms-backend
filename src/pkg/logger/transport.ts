
import path from 'path';
import { ulid } from 'ulid';
import { createLogger, format, Logger, transports } from 'winston';
import 'winston-daily-rotate-file';
import { ElasticsearchTransport } from 'winston-elasticsearch';
const LOG_FILENAME = `${process.env.SERVICE_NAME}-output`;
const { combine, timestamp, errors, json } = format;


interface LogLevels {
    error: 0;
    warn: 1;
    http: 2;
    info: 3;
    debug: 4;
}

const levels: LogLevels = {
    error: 0,
    warn: 1,
    http: 2,
    info: 3,
    debug: 4,
};



export const logTransport = (indexPrefix: string): Logger => {
    const spanTracerId = ulid();
    const logsDir = path.join(process.cwd(), 'logs');

    const transport = new transports.DailyRotateFile({
        filename: path.join(logsDir, `${LOG_FILENAME}-%DATE%.log`),
        datePattern: 'YYYY-MM-DD-HH',
        zippedArchive: true,
        maxFiles: '7d',
        maxSize: '20m',
        frequency: '3h',
    });

    let logger = createLogger({
        level: 'debug',
        levels: levels as any,
        format: combine(timestamp(), errors({ stack: true }), json()),
        transports: [
            transport,
            new transports.Console({ format: format.splat(), level: 'debug' })
        ],
        handleExceptions: true,
    });

    if (process.env.ENABLE_ELK_LOG === 'true') {
        try {
            const elkTransport = new ElasticsearchTransport({
                transformer: (logData: any) => {
                    let resource = "unknown"
                    try {
                        resource = logData.meta?.resource || process.env.SERVICE_NAME || 'unknown'
                    } catch (error) {
                        resource = process.env.SERVICE_NAME || 'unknown'
                    }

                    let span_id = spanTracerId
                    try {
                        span_id = logData.meta?.spanId || spanTracerId
                    } catch (error) {
                        span_id = spanTracerId
                    }

                    return {
                        '@timestamp': new Date(),
                        resource: resource,
                        severity: logData.level,
                        message: logData.message,
                        data: JSON.stringify(logData.meta?.data || {}),
                        span_id: span_id,
                        service_name: process.env.SERVICE_NAME || 'unknown',
                        service_version: process.env.SERVICE_VERSION || 'unknown',
                        utcTimestamp: new Date().toISOString(),
                        '@version': process.env.SERVICE_VERSION || 'unknown',
                    };
                },
                level: 'debug',
                indexPrefix,
                indexSuffixPattern: 'YYYY-MM-DD',
                clientOpts: {
                    node: process.env.ELASTIC_HOST || 'http://127.0.0.1:9200',
                    auth: {
                        username: process.env.ELASTIC_USER || 'user',
                        password: process.env.ELASTIC_PASSWORD || 'password',
                    },
                },
                apm: null,
            });

            logger = createLogger({
                level: 'debug',
                levels: levels as any,
                format: combine(timestamp(), errors({ stack: true }), json()),
                transports: [
                    transport,
                    elkTransport,
                    new transports.Console({ format: format.splat(), level: 'debug' })
                ],
                handleExceptions: true,
            });
        } catch (error) {
            console.error('❌ Failed to initialize Elasticsearch transport:', error);
        }
    }

    return logger;
};

