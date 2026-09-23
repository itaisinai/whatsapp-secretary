import { test } from 'node:test';
import assert from 'node:assert/strict';
import type { ExecutionContext, CallHandler } from '@nestjs/common';
import { of, throwError } from 'rxjs';
import { LoggingInterceptor } from './logging.interceptor';

test('LoggingInterceptor logs successful requests', (t, done) => {
  const interceptor = new LoggingInterceptor();

  const mockRequest = {
    method: 'GET',
    url: '/health',
  };

  const mockResponse = {
    statusCode: 200,
  };

  const mockContext = {
    switchToHttp: () => ({
      getRequest: () => mockRequest,
      getResponse: () => mockResponse,
    }),
  } as unknown as ExecutionContext;

  const mockHandler: CallHandler = {
    handle: () => of({ status: 'ok' }),
  };

  const result$ = interceptor.intercept(mockContext, mockHandler);

  result$.subscribe({
    next: (value) => {
      assert.deepEqual(value, { status: 'ok' });
      done();
    },
    error: (err) => done(err),
  });
});

test('LoggingInterceptor logs failed requests', (t, done) => {
  const interceptor = new LoggingInterceptor();

  const mockRequest = {
    method: 'POST',
    url: '/webhooks/whatsapp',
  };

  const mockContext = {
    switchToHttp: () => ({
      getRequest: () => mockRequest,
      getResponse: () => ({}),
    }),
  } as unknown as ExecutionContext;

  const mockHandler: CallHandler = {
    handle: () => throwError(() => new Error('Test error')),
  };

  const result$ = interceptor.intercept(mockContext, mockHandler);

  result$.subscribe({
    next: () => done(new Error('Should not succeed')),
    error: (err) => {
      assert.equal(err.message, 'Test error');
      done();
    },
  });
});
