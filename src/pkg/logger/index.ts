import { getTracerData } from "./tracer";
import { logTransport } from "./transport";

let indexPrefix = `${process.env.SERVICE_NAME}-`;
if (process.env.ENVIRONMENT === "localhost") {
  indexPrefix = indexPrefix.concat("local");
} else if (process.env.ENVIRONMENT === "dev") {
  indexPrefix = indexPrefix.concat("dev");
} else if (process.env.ENVIRONMENT === "staging") {
  indexPrefix = indexPrefix.concat("staging");
} else if (process.env.ENVIRONMENT === "qa") {
  indexPrefix = indexPrefix.concat("qa");
} else if (process.env.ENVIRONMENT === "production") {
  indexPrefix = indexPrefix.concat("prod");
}

interface LogData {
  resource?: string
  [key: string]: any
}

class LoggerInstance {
  private static instance: LoggerInstance;

  public static getInstance(): LoggerInstance {
    if (!LoggerInstance.instance) {
      LoggerInstance.instance = new LoggerInstance();
    }
    return LoggerInstance.instance;
  }

  info(msg: string, data: LogData) {
    let tracerData = getTracerData();
    const logger = logTransport(indexPrefix);
    const metaData = {
      data,
      spanId: tracerData.spanId,
      resource: tracerData.resource,
    };
    logger.info(msg, metaData);
  }

  warning(msg: string, data: LogData) {
    let tracerData = getTracerData();
    const logger = logTransport(indexPrefix);
    const metaData = {
      data,
      spanId: tracerData.spanId,
      resource: tracerData.resource,
    };
    logger.warn(msg, metaData);
  }

  http(msg: string, data: LogData) {
    let tracerData = getTracerData();
    const logger = logTransport(indexPrefix);
    const metaData = {
      data,
      spanId: tracerData.spanId,
      resource: tracerData.resource,
      method: tracerData.method,
      url: tracerData.url
    };
    logger.http(msg, metaData);
  }

  child(data: LogData) {
    let tracerData = getTracerData();
    const logger = logTransport(indexPrefix);
    const metaData = {
      data,
      spanId: tracerData.spanId,
      resource: tracerData.resource,
    };
    const child = logger.child(metaData);
    return child;
  }

  error(msg: string, data: any) {
    // Extract comprehensive error information
    const logger = logTransport(indexPrefix);
    let tracerData = getTracerData();
    const errorInfo = this.extractErrorInfo(data.error || data);
    const metaData = {
      data: {
        error: errorInfo,
        errorDetails: {
          message: errorInfo.message,
          stack: errorInfo.stack,
          name: errorInfo.name,
          code: errorInfo.code,
          cause: errorInfo.cause,
          timestamp: new Date().toISOString(),
          service: process.env.SERVICE_NAME || 'unknown',
          environment: process.env.ENVIRONMENT || 'unknown',
        }
      },
      spanId: tracerData.spanId,
      resource: tracerData.resource,
    };

    logger.error(msg, metaData);
  }

  private extractErrorInfo(error: any) {
    if (!error) {
      return {
        message: 'Unknown error',
        stack: 'No stack trace available',
        name: 'UnknownError',
        code: 'UNKNOWN',
        cause: null
      };
    }

    // Handle different error types
    if (error instanceof Error) {
      return {
        message: error.message,
        stack: error.stack,
        name: error.name,
        code: (error as any).code || 'NO_CODE',
        cause: error.cause || null
      };
    }

    // Handle Prisma errors
    if (error?.code && error?.meta) {
      return {
        message: error.message || 'Database error',
        stack: error.stack || 'No stack trace',
        name: 'PrismaError',
        code: error.code,
        cause: error.meta,
        prismaDetails: {
          code: error.code,
          meta: error.meta,
          clientVersion: error.clientVersion
        }
      };
    }

    // Handle HTTP errors
    if (error?.status || error?.statusCode) {
      return {
        message: error.message || 'HTTP error',
        stack: error.stack || 'No stack trace',
        name: 'HttpError',
        code: error.status || error.statusCode,
        cause: error.response?.data || error.body || null
      };
    }

    // Handle string errors
    if (typeof error === 'string') {
      return {
        message: error,
        stack: 'String error - no stack trace',
        name: 'StringError',
        code: 'STRING_ERROR',
        cause: null
      };
    }

    // Handle object errors
    if (typeof error === 'object') {
      return {
        message: error.message || JSON.stringify(error),
        stack: error.stack || 'Object error - no stack trace',
        name: error.name || 'ObjectError',
        code: error.code || 'OBJECT_ERROR',
        cause: error.cause || null,
        originalError: error
      };
    }

    return {
      message: String(error),
      stack: 'Unknown error type - no stack trace',
      name: 'UnknownError',
      code: 'UNKNOWN_TYPE',
      cause: null
    };
  }

  debug(msg: string, data: LogData) {
    const logger = logTransport(indexPrefix);
    let tracerData = getTracerData();
    const metaData = {
      data,
      spanId: tracerData.spanId,
      resource: tracerData.resource,
    };
    logger.debug(msg, metaData);
  }
}

const Logger = LoggerInstance.getInstance();

export default Logger;