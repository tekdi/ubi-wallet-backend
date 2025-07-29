import { Injectable, Logger } from '@nestjs/common';

interface ErrorDetails {
  message?: string;
  stack?: string;
  name?: string;
  code?: string | number;
  status?: number;
  statusCode?: number;
}

@Injectable()
export class LoggerService extends Logger {
  constructor(context?: string) {
    super(context || 'CustomLogger');
  }

  logError(message: string, error: unknown, context?: string) {
    const errorDetails: ErrorDetails = {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      name: error instanceof Error ? error.name : undefined,
      code: this.getErrorProperty(error, 'code'),
      status: this.getErrorPropertyAsNumber(error, 'status'),
      statusCode: this.getErrorPropertyAsNumber(error, 'statusCode'),
    };

    this.error(message, {
      error: errorDetails,
      context: context || this.context,
      timestamp: new Date().toISOString(),
    });
  }

  logInfo(message: string, data?: unknown, context?: string) {
    this.log(message, {
      data,
      context: context || this.context,
      timestamp: new Date().toISOString(),
    });
  }

  logWarning(message: string, data?: unknown, context?: string) {
    this.warn(message, {
      data,
      context: context || this.context,
      timestamp: new Date().toISOString(),
    });
  }

  private getErrorProperty(
    error: unknown,
    property: string,
  ): string | number | undefined {
    if (error && typeof error === 'object' && property in error) {
      return (error as Record<string, unknown>)[property] as
        | string
        | number
        | undefined;
    }
    return undefined;
  }

  private getErrorPropertyAsNumber(
    error: unknown,
    property: string,
  ): number | undefined {
    const value = this.getErrorProperty(error, property);
    if (value && typeof value === 'string') {
      return Number(value);
    }
    return undefined;
  }
}
