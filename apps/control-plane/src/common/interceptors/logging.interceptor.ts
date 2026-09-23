import type {
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Injectable, Logger } from '@nestjs/common';
import type { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger('HTTP');

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const request = context.switchToHttp().getRequest();
    const { method, url } = request;
    const now = Date.now();

    return next.handle().pipe(
      tap({
        next: () => {
          const response = context.switchToHttp().getResponse();
          const { statusCode } = response;
          const delay = Date.now() - now;
          // Only log method, URL, status, and timing - NEVER log request/response bodies
          this.logger.log(`${method} ${url} ${statusCode} - ${delay}ms`);
        },
        error: (error: Error) => {
          const delay = Date.now() - now;
          // Log error type but not full details (those go through exception filter)
          this.logger.error(`${method} ${url} ERROR - ${delay}ms`);
        },
      }),
    );
  }
}
