import test from 'node:test';
import assert from 'node:assert/strict';
import { isAdminCreationAllowed, normalizeRegistrationPayload } from '../src/utils/adminRegistration.js';

test('allows first admin registration when no admin user exists', () => {
  assert.equal(isAdminCreationAllowed(null, 'admin'), true);
});

test('blocks admin registration when an admin already exists', () => {
  assert.equal(isAdminCreationAllowed({ id: 1 }, 'admin'), false);
});

test('normalizes registration payload values', () => {
  const payload = normalizeRegistrationPayload({
    emp_id: ' EMP-100 ',
    emp_name: ' Jane Doe ',
    email: ' JANE@EXAMPLE.COM ',
    password: 'secret',
    location: ' Mumbai ',
    role_name: 'ADMIN',
  });

  assert.deepEqual(payload, {
    emp_id: 'EMP-100',
    emp_name: 'Jane Doe',
    email: 'jane@example.com',
    password: 'secret',
    location: 'Mumbai',
    roleName: 'admin',
  });
});
