import { test } from 'node:test';
import assert from 'node:assert/strict';
import { HealthController } from './health.controller';

test('GET /health returns status and timestamp', () => {
  const controller = new HealthController();
  const result = controller.check();

  assert.equal(result.status, 'ok');
  assert.equal(typeof result.timestamp, 'string');
  // Verify timestamp is valid ISO 8601
  assert.doesNotThrow(() => new Date(result.timestamp));
});

test('GET /health/ready returns ready true', () => {
  const controller = new HealthController();
  const result = controller.ready();

  assert.equal(result.ready, true);
});

test('GET /health/live returns alive true', () => {
  const controller = new HealthController();
  const result = controller.live();

  assert.equal(result.alive, true);
});
