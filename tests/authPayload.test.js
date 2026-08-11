import test from 'node:test';
import assert from 'node:assert/strict';
import { normalizeLoginPayload } from '../src/utils/authPayload.js';

test('normalizes identifier-based payloads', () => {
  const payload = normalizeLoginPayload({ identifier: 'admin@example.com', password: 'secret' });
  assert.equal(payload.identifier, 'admin@example.com');
  assert.equal(payload.password, 'secret');
});

test('normalizes email-based payloads', () => {
  const payload = normalizeLoginPayload({ email: 'admin@example.com', password: 'secret' });
  assert.equal(payload.identifier, 'admin@example.com');
  assert.equal(payload.password, 'secret');
});

test('normalizes emp_id-based payloads', () => {
  const payload = normalizeLoginPayload({ emp_id: 'EMP-001', password: 'secret' });
  assert.equal(payload.identifier, 'EMP-001');
  assert.equal(payload.password, 'secret');
});
