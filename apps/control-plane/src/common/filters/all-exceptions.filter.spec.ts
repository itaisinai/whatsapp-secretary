import { test } from 'node:test';
import assert from 'node:assert/strict';
import { HttpException, HttpStatus, type ArgumentsHost } from '@nestjs/common';
import { AllExceptionsFilter } from './all-exceptions.filter';

test('AllExceptionsFilter handles HttpException', () => {
  const filter = new AllExceptionsFilter();
  const exception = new HttpException('Test error', HttpStatus.BAD_REQUEST);

  const mockResponse = {
    status: (code: number) => {
      assert.equal(code, HttpStatus.BAD_REQUEST);
      return mockResponse;
    },
    json: (body: unknown) => {
      assert.equal(typeof body, 'object');
      const response = body as Record<string, unknown>;
      assert.equal(response.statusCode, HttpStatus.BAD_REQUEST);
      assert.equal(response.message, 'Test error');
      assert.equal(typeof response.timestamp, 'string');
      assert.equal(response.path, '/test');
    },
  };

  const mockRequest = {
    method: 'GET',
    url: '/test',
  };

  const mockHost = {
    switchToHttp: () => ({
      getResponse: () => mockResponse,
      getRequest: () => mockRequest,
    }),
  } as unknown as ArgumentsHost;

  filter.catch(exception, mockHost);
});

test('AllExceptionsFilter handles unknown exception with 500', () => {
  const filter = new AllExceptionsFilter();
  const exception = new Error('Unknown error');

  const mockResponse = {
    status: (code: number) => {
      assert.equal(code, HttpStatus.INTERNAL_SERVER_ERROR);
      return mockResponse;
    },
    json: (body: unknown) => {
      const response = body as Record<string, unknown>;
      assert.equal(response.statusCode, HttpStatus.INTERNAL_SERVER_ERROR);
      assert.equal(response.message, 'Internal server error');
      assert.equal(response.path, '/test');
    },
  };

  const mockRequest = {
    method: 'POST',
    url: '/test',
  };

  const mockHost = {
    switchToHttp: () => ({
      getResponse: () => mockResponse,
      getRequest: () => mockRequest,
    }),
  } as unknown as ArgumentsHost;

  filter.catch(exception, mockHost);
});

test('AllExceptionsFilter extracts message from HttpException response object', () => {
  const filter = new AllExceptionsFilter();
  const exception = new HttpException(
    { message: 'Validation failed', errors: ['field1', 'field2'] },
    HttpStatus.UNPROCESSABLE_ENTITY,
  );

  const mockResponse = {
    status: () => mockResponse,
    json: (body: unknown) => {
      const response = body as Record<string, unknown>;
      assert.equal(response.message, 'Validation failed');
    },
  };

  const mockRequest = { method: 'POST', url: '/test' };

  const mockHost = {
    switchToHttp: () => ({
      getResponse: () => mockResponse,
      getRequest: () => mockRequest,
    }),
  } as unknown as ArgumentsHost;

  filter.catch(exception, mockHost);
});
