import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import type { Request, Response } from 'express';

/**
 * One global catch-all. Goals:
 *   - Never leak stack traces, Prisma SQL, table/column names, or internal
 *     messages to the client. Those go to the server log only.
 *   - Map the Prisma errors we actually expect (unique clash, FK, not-found)
 *     to clean, user-facing Uzbek messages with the right HTTP status.
 *   - Pass HttpExceptions (our deliberate 400/401/403/404/409) through as-is.
 *   - Everything else → generic 500.
 */
@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger('Exception');

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const res = ctx.getResponse<Response>();
    const req = ctx.getRequest<Request>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message: string | string[] = 'Server xatosi';
    let error = 'Internal Server Error';

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const body = exception.getResponse();
      if (typeof body === 'string') {
        message = body;
      } else if (body && typeof body === 'object') {
        const b = body as { message?: string | string[]; error?: string };
        message = b.message ?? exception.message;
        error = b.error ?? error;
      }
    } else if (exception instanceof Prisma.PrismaClientKnownRequestError) {
      ({ status, message, error } = mapPrismaError(exception));
    } else if (exception instanceof Prisma.PrismaClientValidationError) {
      status = HttpStatus.BAD_REQUEST;
      message = "Noto'g'ri so'rov";
      error = 'Bad Request';
    }

    // Log full detail server-side (5xx as error, 4xx as warning).
    const detail = exception instanceof Error ? exception.stack ?? exception.message : String(exception);
    const line = `${req.method} ${req.originalUrl} → ${status}`;
    if (status >= 500) this.logger.error(line, detail);
    else this.logger.warn(`${line} — ${JSON.stringify(message)}`);

    res.status(status).json({ statusCode: status, error, message });
  }
}

function mapPrismaError(e: Prisma.PrismaClientKnownRequestError): {
  status: HttpStatus;
  message: string;
  error: string;
} {
  switch (e.code) {
    case 'P2002': // unique constraint
      return { status: HttpStatus.CONFLICT, message: 'Bunday yozuv allaqachon mavjud', error: 'Conflict' };
    case 'P2025': // record not found
      return { status: HttpStatus.NOT_FOUND, message: 'Topilmadi', error: 'Not Found' };
    case 'P2003': // FK constraint
      return {
        status: HttpStatus.BAD_REQUEST,
        message: "Bog'liq ma'lumot mavjud emas yoki o'chirib bo'lmaydi",
        error: 'Bad Request',
      };
    default:
      return { status: HttpStatus.INTERNAL_SERVER_ERROR, message: 'Server xatosi', error: 'Internal Server Error' };
  }
}
